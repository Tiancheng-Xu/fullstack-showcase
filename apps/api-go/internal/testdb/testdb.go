package testdb

import (
	"context"
	"database/sql"
	"path/filepath"
	"testing"

	"github.com/Tiancheng-Xu/fullstack-showcase/apps/api-go/internal/migrations"
)

func Open(t testing.TB) *sql.DB {
	t.Helper()
	db, err := migrations.OpenDatabase(filepath.Join(t.TempDir(), "profile.sqlite"))
	if err != nil {
		t.Fatalf("open test database: %v", err)
	}
	t.Cleanup(func() {
		if err := db.Close(); err != nil {
			t.Errorf("close test database: %v", err)
		}
	})
	if err := migrations.Apply(context.Background(), db, "../../../api/drizzle"); err != nil {
		t.Fatalf("migrate test database: %v", err)
	}
	return db
}
