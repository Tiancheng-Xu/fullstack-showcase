package migrations

import (
	"context"
	"crypto/sha256"
	"database/sql"
	"encoding/hex"
	"fmt"
	"net/url"
	"os"
	"path/filepath"
	"sort"
	"strings"
	"time"

	_ "modernc.org/sqlite"
)

const statementBreakpoint = "--> statement-breakpoint"

var expectedProfileColumns = []string{
	"github_id",
	"login",
	"display_name",
	"bio",
	"avatar_url",
	"profile_url",
	"public_repos",
	"followers",
	"github_created_at",
	"synced_at",
	"created_at",
	"updated_at",
}

type Migration struct {
	Name       string
	Hash       string
	CreatedAt  int64
	Statements []string
}

func Discover(directory string) ([]Migration, error) {
	entries, err := os.ReadDir(directory)
	if err != nil {
		return nil, fmt.Errorf("read migrations directory: %w", err)
	}
	sort.Slice(entries, func(i, j int) bool { return entries[i].Name() < entries[j].Name() })

	result := make([]Migration, 0, len(entries))
	for _, entry := range entries {
		if !entry.IsDir() {
			continue
		}
		name := entry.Name()
		migrationPath := filepath.Join(directory, name, "migration.sql")
		contents, err := os.ReadFile(migrationPath)
		if os.IsNotExist(err) {
			continue
		}
		if err != nil {
			return nil, fmt.Errorf("read migration %q: %w", name, err)
		}
		if len(name) < 14 {
			return nil, fmt.Errorf("migration %q has no 14-digit timestamp", name)
		}
		created, err := time.Parse("20060102150405", name[:14])
		if err != nil {
			return nil, fmt.Errorf("migration %q has invalid timestamp", name)
		}
		digest := sha256.Sum256(contents)
		result = append(result, Migration{
			Name:       name,
			Hash:       hex.EncodeToString(digest[:]),
			CreatedAt:  created.UnixMilli(),
			Statements: strings.Split(string(contents), statementBreakpoint),
		})
	}
	return result, nil
}

func OpenDatabase(path string) (*sql.DB, error) {
	if err := os.MkdirAll(filepath.Dir(path), 0o755); err != nil {
		return nil, fmt.Errorf("create database directory: %w", err)
	}
	absolutePath, err := filepath.Abs(path)
	if err != nil {
		return nil, fmt.Errorf("resolve database path: %w", err)
	}
	dsn := &url.URL{Scheme: "file", Path: filepath.ToSlash(absolutePath)}
	query := dsn.Query()
	query.Add("_pragma", "busy_timeout(5000)")
	query.Add("_pragma", "foreign_keys(1)")
	dsn.RawQuery = query.Encode()

	db, err := sql.Open("sqlite", dsn.String())
	if err != nil {
		return nil, fmt.Errorf("open database: %w", err)
	}
	db.SetMaxOpenConns(1)
	db.SetMaxIdleConns(1)
	if err := db.Ping(); err != nil {
		db.Close()
		return nil, fmt.Errorf("connect database: %w", err)
	}
	return db, nil
}

func Apply(ctx context.Context, db *sql.DB, directory string) error {
	migrations, err := Discover(directory)
	if err != nil {
		return err
	}

	tx, err := db.BeginTx(ctx, nil)
	if err != nil {
		return fmt.Errorf("begin migrations: %w", err)
	}
	defer tx.Rollback()

	if _, err := tx.ExecContext(ctx, `CREATE TABLE IF NOT EXISTS __drizzle_migrations (
		id INTEGER PRIMARY KEY,
		hash text NOT NULL,
		created_at numeric,
		name text,
		applied_at TEXT
	)`); err != nil {
		return fmt.Errorf("create migration ledger: %w", err)
	}

	applied, err := readApplied(ctx, tx)
	if err != nil {
		return err
	}
	for _, migration := range migrations {
		if hash, ok := applied[migration.Name]; ok {
			if hash != migration.Hash {
				return fmt.Errorf("migration %q hash mismatch", migration.Name)
			}
			continue
		}

		for _, statement := range migration.Statements {
			if strings.TrimSpace(statement) == "" {
				continue
			}
			if _, err := tx.ExecContext(ctx, statement); err != nil {
				return fmt.Errorf("migration %q failed: %w", migration.Name, err)
			}
		}
		if _, err := tx.ExecContext(ctx,
			`INSERT INTO __drizzle_migrations (hash, created_at, name, applied_at) VALUES (?, ?, ?, ?)`,
			migration.Hash,
			migration.CreatedAt,
			migration.Name,
			time.Now().UTC().Format(time.RFC3339Nano),
		); err != nil {
			return fmt.Errorf("record migration %q: %w", migration.Name, err)
		}
	}

	if err := tx.Commit(); err != nil {
		return fmt.Errorf("commit migrations: %w", err)
	}
	return nil
}

func readApplied(ctx context.Context, tx *sql.Tx) (map[string]string, error) {
	rows, err := tx.QueryContext(ctx, `SELECT name, hash FROM __drizzle_migrations WHERE name IS NOT NULL`)
	if err != nil {
		return nil, fmt.Errorf("read migration ledger: %w", err)
	}
	defer rows.Close()

	applied := make(map[string]string)
	for rows.Next() {
		var name, hash string
		if err := rows.Scan(&name, &hash); err != nil {
			return nil, fmt.Errorf("scan migration ledger: %w", err)
		}
		applied[name] = hash
	}
	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("iterate migration ledger: %w", err)
	}
	return applied, nil
}

func ValidateSchema(ctx context.Context, db *sql.DB) error {
	rows, err := db.QueryContext(ctx, `PRAGMA table_info('github_profiles')`)
	if err != nil {
		return fmt.Errorf("inspect profile schema: %w", err)
	}
	defer rows.Close()

	columns := make([]string, 0, len(expectedProfileColumns))
	for rows.Next() {
		var cid, notNull, primaryKey int
		var name, dataType string
		var defaultValue any
		if err := rows.Scan(&cid, &name, &dataType, &notNull, &defaultValue, &primaryKey); err != nil {
			return fmt.Errorf("scan profile schema: %w", err)
		}
		columns = append(columns, name)
	}
	if err := rows.Err(); err != nil {
		return fmt.Errorf("iterate profile schema: %w", err)
	}
	if strings.Join(columns, ",") != strings.Join(expectedProfileColumns, ",") {
		return fmt.Errorf("github_profiles schema is incompatible")
	}
	return nil
}
