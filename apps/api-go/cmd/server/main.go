package main

import (
	"context"
	"errors"
	"fmt"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/Tiancheng-Xu/course-homework/apps/api-go/internal/config"
	"github.com/Tiancheng-Xu/course-homework/apps/api-go/internal/github"
	"github.com/Tiancheng-Xu/course-homework/apps/api-go/internal/httpapi"
	"github.com/Tiancheng-Xu/course-homework/apps/api-go/internal/keychain"
	"github.com/Tiancheng-Xu/course-homework/apps/api-go/internal/migrations"
	"github.com/Tiancheng-Xu/course-homework/apps/api-go/internal/profile"
)

func main() {
	if err := run(); err != nil {
		log.Fatal(err)
	}
}

func run() error {
	cfg, err := config.LoadCurrent()
	if err != nil {
		return err
	}
	db, err := migrations.OpenDatabase(cfg.DatabasePath)
	if err != nil {
		return err
	}
	defer db.Close()

	ctx := context.Background()
	if err := migrations.Apply(ctx, db, cfg.MigrationsDir); err != nil {
		return err
	}
	if err := migrations.ValidateSchema(ctx, db); err != nil {
		return err
	}

	tokenProvider := keychain.NewProvider(cfg.KeychainService, cfg.KeychainAccount, nil)
	githubClient := github.NewClient(github.Options{TokenProvider: tokenProvider})
	profileRepository := profile.NewRepository(db, nil)
	handler := httpapi.New(httpapi.Dependencies{
		GitHub:   githubClient,
		Profiles: profileRepository,
	}, log.Writer())

	server := &http.Server{
		Addr:              fmt.Sprintf(":%d", cfg.Port),
		Handler:           handler,
		ReadHeaderTimeout: 5 * time.Second,
		ReadTimeout:       10 * time.Second,
		WriteTimeout:      10 * time.Second,
		IdleTimeout:       60 * time.Second,
	}

	shutdownContext, stop := signal.NotifyContext(context.Background(), os.Interrupt, syscall.SIGTERM)
	defer stop()
	serverErrors := make(chan error, 1)
	go func() {
		log.Printf("Go profile API listening on http://localhost:%d", cfg.Port)
		serverErrors <- server.ListenAndServe()
	}()

	select {
	case err := <-serverErrors:
		if !errors.Is(err, http.ErrServerClosed) {
			return err
		}
		return nil
	case <-shutdownContext.Done():
		ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
		defer cancel()
		if err := server.Shutdown(ctx); err != nil {
			return fmt.Errorf("shut down server: %w", err)
		}
		return nil
	}
}
