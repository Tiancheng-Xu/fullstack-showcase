package migrations

import (
	"context"
	"database/sql"
	"os"
	"path/filepath"
	"strings"
	"testing"
)

const realMigrationsDir = "../../../api/drizzle"

func TestDiscoverMatchesDrizzleMetadata(t *testing.T) {
	t.Parallel()

	migrations, err := Discover(realMigrationsDir)
	if err != nil {
		t.Fatalf("Discover() error = %v", err)
	}
	want := []struct {
		name       string
		hash       string
		createdAt  int64
		statements int
	}{
		{"20260731160853_create_github_profiles", "9d423c755a2671ab2f1a33ad8d384cd065292f8269c1214eb1b1e0a274ead283", 1785514133000, 2},
		{"20260731160918_add_profile_metrics", "3fa4538c3f3336055f6615a461d3c31ce2e6378a615730dee6eac3c2d1e7c1ef", 1785514158000, 10},
		{"20260731160930_remove_location", "1ade5eca6162d982e9d229a8546e9b46c682fd7e658a6f7c8c8d3f70b2fd94b6", 1785514170000, 1},
	}
	if len(migrations) != len(want) {
		t.Fatalf("Discover() returned %d migrations, want %d", len(migrations), len(want))
	}
	for index, expected := range want {
		got := migrations[index]
		if got.Name != expected.name || got.Hash != expected.hash || got.CreatedAt != expected.createdAt || len(got.Statements) != expected.statements {
			t.Errorf("migration[%d] = %#v, want %#v", index, got, expected)
		}
	}
}

func TestApplyMigratesEmptyDatabaseAndIsIdempotent(t *testing.T) {
	t.Parallel()

	db := openTemporaryDatabase(t)
	ctx := context.Background()
	if err := Apply(ctx, db, realMigrationsDir); err != nil {
		t.Fatalf("Apply() error = %v", err)
	}
	if err := ValidateSchema(ctx, db); err != nil {
		t.Fatalf("ValidateSchema() error = %v", err)
	}
	assertMigrationLedger(t, db, 3)

	if err := Apply(ctx, db, realMigrationsDir); err != nil {
		t.Fatalf("second Apply() error = %v", err)
	}
	assertMigrationLedger(t, db, 3)
}

func TestApplyRecognizesDrizzleLedgerRows(t *testing.T) {
	t.Parallel()

	db := openTemporaryDatabase(t)
	ctx := context.Background()
	migrations, err := Discover(realMigrationsDir)
	if err != nil {
		t.Fatal(err)
	}
	if _, err := db.ExecContext(ctx, `CREATE TABLE __drizzle_migrations (
		id INTEGER PRIMARY KEY,
		hash text NOT NULL,
		created_at numeric,
		name text,
		applied_at TEXT
	)`); err != nil {
		t.Fatal(err)
	}
	for _, migration := range migrations {
		for _, statement := range migration.Statements {
			if _, err := db.ExecContext(ctx, statement); err != nil {
				t.Fatalf("seed schema statement: %v", err)
			}
		}
		if _, err := db.ExecContext(ctx,
			`INSERT INTO __drizzle_migrations (hash, created_at, name, applied_at) VALUES (?, ?, ?, ?)`,
			migration.Hash, migration.CreatedAt, migration.Name, "2026-07-31T16:30:00.000Z",
		); err != nil {
			t.Fatal(err)
		}
	}

	if err := Apply(ctx, db, realMigrationsDir); err != nil {
		t.Fatalf("Apply() should accept Drizzle ledger: %v", err)
	}
	assertMigrationLedger(t, db, 3)
}

func TestApplyRejectsChangedAppliedMigration(t *testing.T) {
	t.Parallel()

	db := openTemporaryDatabase(t)
	ctx := context.Background()
	if err := Apply(ctx, db, realMigrationsDir); err != nil {
		t.Fatal(err)
	}
	if _, err := db.ExecContext(ctx, `UPDATE __drizzle_migrations SET hash = 'changed' WHERE id = 1`); err != nil {
		t.Fatal(err)
	}
	if err := Apply(ctx, db, realMigrationsDir); err == nil || !strings.Contains(err.Error(), "hash mismatch") {
		t.Fatalf("Apply() error = %v, want hash mismatch", err)
	}
}

func TestApplyRollsBackFailedMigration(t *testing.T) {
	t.Parallel()

	dir := t.TempDir()
	migrationDir := filepath.Join(dir, "20260731170000_failure")
	if err := os.Mkdir(migrationDir, 0o755); err != nil {
		t.Fatal(err)
	}
	if err := os.WriteFile(filepath.Join(migrationDir, "migration.sql"), []byte(
		"CREATE TABLE should_roll_back (id INTEGER);--> statement-breakpoint\nTHIS IS NOT SQL;",
	), 0o600); err != nil {
		t.Fatal(err)
	}

	db := openTemporaryDatabase(t)
	if err := Apply(context.Background(), db, dir); err == nil {
		t.Fatal("Apply() expected error")
	}
	var count int
	if err := db.QueryRow(`SELECT count(*) FROM sqlite_master WHERE type = 'table' AND name IN ('should_roll_back', '__drizzle_migrations')`).Scan(&count); err != nil {
		t.Fatal(err)
	}
	if count != 0 {
		t.Fatalf("rollback left %d tables", count)
	}
}

func TestValidateSchemaRejectsIncompleteSchema(t *testing.T) {
	t.Parallel()

	db := openTemporaryDatabase(t)
	if _, err := db.Exec(`CREATE TABLE github_profiles (github_id INTEGER PRIMARY KEY)`); err != nil {
		t.Fatal(err)
	}
	if err := ValidateSchema(context.Background(), db); err == nil {
		t.Fatal("ValidateSchema() expected error")
	}
}

func openTemporaryDatabase(t *testing.T) *sql.DB {
	t.Helper()
	db, err := OpenDatabase(filepath.Join(t.TempDir(), "profile.sqlite"))
	if err != nil {
		t.Fatalf("OpenDatabase() error = %v", err)
	}
	t.Cleanup(func() {
		if err := db.Close(); err != nil {
			t.Errorf("Close() error = %v", err)
		}
	})
	return db
}

func assertMigrationLedger(t *testing.T, db *sql.DB, want int) {
	t.Helper()
	var count int
	if err := db.QueryRow(`SELECT count(*) FROM __drizzle_migrations`).Scan(&count); err != nil {
		t.Fatal(err)
	}
	if count != want {
		t.Fatalf("migration count = %d, want %d", count, want)
	}

	rows, err := db.Query(`PRAGMA table_info('__drizzle_migrations')`)
	if err != nil {
		t.Fatal(err)
	}
	defer rows.Close()
	var columns []string
	for rows.Next() {
		var cid, notNull, primaryKey int
		var name, dataType string
		var defaultValue any
		if err := rows.Scan(&cid, &name, &dataType, &notNull, &defaultValue, &primaryKey); err != nil {
			t.Fatal(err)
		}
		columns = append(columns, name)
	}
	if got := strings.Join(columns, ","); got != "id,hash,created_at,name,applied_at" {
		t.Fatalf("ledger columns = %s", got)
	}
}
