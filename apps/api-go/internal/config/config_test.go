package config

import "testing"

func TestLoadDefaults(t *testing.T) {
	t.Parallel()

	got, err := Load(map[string]string{})
	if err != nil {
		t.Fatalf("Load() error = %v", err)
	}

	if got.Port != 3002 {
		t.Errorf("Port = %d, want 3002", got.Port)
	}
	if got.Host != "127.0.0.1" || got.ListenAddress() != "127.0.0.1:3002" {
		t.Errorf("listen = %q/%q, want loopback:3002", got.Host, got.ListenAddress())
	}
	if got.DatabasePath != "../api/data/github-profile.sqlite" {
		t.Errorf("DatabasePath = %q", got.DatabasePath)
	}
	if got.MigrationsDir != "../api/drizzle" {
		t.Errorf("MigrationsDir = %q", got.MigrationsDir)
	}
	if got.KeychainService != "course-homework.github-profile" {
		t.Errorf("KeychainService = %q", got.KeychainService)
	}
	if got.KeychainAccount != "Tiancheng-Xu" {
		t.Errorf("KeychainAccount = %q", got.KeychainAccount)
	}
}

func TestLoadOverridesAndValidatesPort(t *testing.T) {
	t.Parallel()

	got, err := Load(map[string]string{
		"GO_API_HOST":      "::1",
		"GO_API_PORT":      "4102",
		"DB_FILE_NAME":     "/tmp/profile.sqlite",
		"MIGRATIONS_DIR":   "/tmp/migrations",
		"KEYCHAIN_SERVICE": "service",
		"KEYCHAIN_ACCOUNT": "account",
	})
	if err != nil {
		t.Fatalf("Load() error = %v", err)
	}
	if got.ListenAddress() != "[::1]:4102" || got.DatabasePath != "/tmp/profile.sqlite" || got.MigrationsDir != "/tmp/migrations" {
		t.Fatalf("Load() overrides = %#v", got)
	}

	for _, value := range []string{"0", "65536", "not-a-port"} {
		if _, err := Load(map[string]string{"GO_API_PORT": value}); err == nil {
			t.Errorf("Load(GO_API_PORT=%q) expected error", value)
		}
	}

	for _, value := range []string{"", "bad host", "https://localhost"} {
		if _, err := Load(map[string]string{"GO_API_HOST": value}); err == nil {
			t.Errorf("Load(GO_API_HOST=%q) expected error", value)
		}
	}
}
