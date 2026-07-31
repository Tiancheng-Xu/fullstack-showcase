package config

import (
	"fmt"
	"strconv"
)

const (
	defaultPort            = 3002
	defaultDatabasePath    = "../api/data/github-profile.sqlite"
	defaultMigrationsDir   = "../api/drizzle"
	defaultKeychainService = "course-homework.github-profile"
	defaultKeychainAccount = "Tiancheng-Xu"
)

type Config struct {
	Port            int
	DatabasePath    string
	MigrationsDir   string
	KeychainService string
	KeychainAccount string
}

func Load(environment map[string]string) (Config, error) {
	port := defaultPort
	if value, ok := environment["GO_API_PORT"]; ok {
		parsed, err := strconv.Atoi(value)
		if err != nil || parsed < 1 || parsed > 65535 {
			return Config{}, fmt.Errorf("GO_API_PORT must be an integer from 1 through 65535")
		}
		port = parsed
	}

	databasePath, err := valueOrDefault(environment, "DB_FILE_NAME", defaultDatabasePath)
	if err != nil {
		return Config{}, err
	}
	migrationsDir, err := valueOrDefault(environment, "MIGRATIONS_DIR", defaultMigrationsDir)
	if err != nil {
		return Config{}, err
	}
	keychainService, err := valueOrDefault(environment, "KEYCHAIN_SERVICE", defaultKeychainService)
	if err != nil {
		return Config{}, err
	}
	keychainAccount, err := valueOrDefault(environment, "KEYCHAIN_ACCOUNT", defaultKeychainAccount)
	if err != nil {
		return Config{}, err
	}

	return Config{
		Port:            port,
		DatabasePath:    databasePath,
		MigrationsDir:   migrationsDir,
		KeychainService: keychainService,
		KeychainAccount: keychainAccount,
	}, nil
}

func valueOrDefault(environment map[string]string, key, fallback string) (string, error) {
	value, ok := environment[key]
	if !ok {
		return fallback, nil
	}
	if value == "" {
		return "", fmt.Errorf("%s must not be empty", key)
	}
	return value, nil
}
