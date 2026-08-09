package config

import (
	"fmt"
	"net"
	"os"
	"strconv"
)

const (
	defaultPort            = 3002
	defaultHost            = "127.0.0.1"
	defaultDatabasePath    = "../api/data/github-profile.sqlite"
	defaultMigrationsDir   = "../api/drizzle"
	defaultKeychainService = "course-homework.github-profile"
	defaultKeychainAccount = "Tiancheng-Xu"
)

type Config struct {
	Host            string
	Port            int
	DatabasePath    string
	MigrationsDir   string
	KeychainService string
	KeychainAccount string
}

func LoadCurrent() (Config, error) {
	environment := make(map[string]string)
	for _, key := range []string{
		"GO_API_HOST",
		"GO_API_PORT",
		"DB_FILE_NAME",
		"MIGRATIONS_DIR",
		"KEYCHAIN_SERVICE",
		"KEYCHAIN_ACCOUNT",
	} {
		if value, ok := os.LookupEnv(key); ok {
			environment[key] = value
		}
	}
	return Load(environment)
}

func Load(environment map[string]string) (Config, error) {
	host, err := valueOrDefault(environment, "GO_API_HOST", defaultHost)
	if err != nil {
		return Config{}, err
	}
	if host != "localhost" && net.ParseIP(host) == nil {
		return Config{}, fmt.Errorf("GO_API_HOST must be localhost or an IP address")
	}

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
		Host:            host,
		Port:            port,
		DatabasePath:    databasePath,
		MigrationsDir:   migrationsDir,
		KeychainService: keychainService,
		KeychainAccount: keychainAccount,
	}, nil
}

func (c Config) ListenAddress() string {
	return net.JoinHostPort(c.Host, strconv.Itoa(c.Port))
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
