package main

import (
	"context"
	"log"
	"os"
	"strings"

	"github.com/Tiancheng-Xu/course-homework/apps/api-go/internal/config"
	"github.com/Tiancheng-Xu/course-homework/apps/api-go/internal/migrations"
)

func main() {
	cfg, err := config.Load(currentEnvironment())
	if err != nil {
		log.Fatal(err)
	}
	db, err := migrations.OpenDatabase(cfg.DatabasePath)
	if err != nil {
		log.Fatal(err)
	}
	defer db.Close()

	ctx := context.Background()
	if err := migrations.Apply(ctx, db, cfg.MigrationsDir); err != nil {
		log.Fatal(err)
	}
	if err := migrations.ValidateSchema(ctx, db); err != nil {
		log.Fatal(err)
	}
	log.Print("database migrations complete")
}

func currentEnvironment() map[string]string {
	result := make(map[string]string)
	for _, entry := range os.Environ() {
		key, value, found := strings.Cut(entry, "=")
		if found {
			result[key] = value
		}
	}
	return result
}
