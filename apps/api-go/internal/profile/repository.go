package profile

import (
	"context"
	"database/sql"
	"fmt"
	"time"

	"github.com/Tiancheng-Xu/fullstack-showcase/apps/api-go/internal/contracts"
)

type Repository struct {
	db  *sql.DB
	now func() time.Time
}

func NewRepository(db *sql.DB, now func() time.Time) *Repository {
	if now == nil {
		now = time.Now
	}
	return &Repository{db: db, now: now}
}

func (r *Repository) FindLatest(ctx context.Context) (*contracts.Profile, error) {
	row := r.db.QueryRowContext(ctx, `SELECT
		github_id,
		login,
		display_name,
		bio,
		avatar_url,
		profile_url,
		public_repos,
		followers,
		github_created_at,
		synced_at
	FROM github_profiles
	ORDER BY synced_at DESC
	LIMIT 1`)
	profile, err := scanProfile(row)
	if err == sql.ErrNoRows {
		return nil, nil
	}
	if err != nil {
		return nil, fmt.Errorf("read latest profile: %w", err)
	}
	return &profile, nil
}

func (r *Repository) Upsert(ctx context.Context, profile contracts.Profile) (contracts.Profile, error) {
	timestamp := r.now().UTC().Format(time.RFC3339Nano)
	row := r.db.QueryRowContext(ctx, `INSERT INTO github_profiles (
		github_id,
		login,
		display_name,
		bio,
		avatar_url,
		profile_url,
		public_repos,
		followers,
		github_created_at,
		synced_at,
		created_at,
		updated_at
	) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
	ON CONFLICT(github_id) DO UPDATE SET
		login = excluded.login,
		display_name = excluded.display_name,
		bio = excluded.bio,
		avatar_url = excluded.avatar_url,
		profile_url = excluded.profile_url,
		public_repos = excluded.public_repos,
		followers = excluded.followers,
		github_created_at = excluded.github_created_at,
		synced_at = excluded.synced_at,
		updated_at = excluded.updated_at
	RETURNING
		github_id,
		login,
		display_name,
		bio,
		avatar_url,
		profile_url,
		public_repos,
		followers,
		github_created_at,
		synced_at`,
		profile.GitHubID,
		profile.Login,
		profile.DisplayName,
		profile.Bio,
		profile.AvatarURL,
		profile.ProfileURL,
		profile.PublicRepos,
		profile.Followers,
		profile.GitHubCreatedAt,
		profile.SyncedAt,
		timestamp,
		timestamp,
	)
	saved, err := scanProfile(row)
	if err != nil {
		return contracts.Profile{}, fmt.Errorf("upsert profile: %w", err)
	}
	return saved, nil
}

type rowScanner interface {
	Scan(dest ...any) error
}

func scanProfile(row rowScanner) (contracts.Profile, error) {
	var result contracts.Profile
	var displayName, bio sql.NullString
	if err := row.Scan(
		&result.GitHubID,
		&result.Login,
		&displayName,
		&bio,
		&result.AvatarURL,
		&result.ProfileURL,
		&result.PublicRepos,
		&result.Followers,
		&result.GitHubCreatedAt,
		&result.SyncedAt,
	); err != nil {
		return contracts.Profile{}, err
	}
	if displayName.Valid {
		result.DisplayName = &displayName.String
	}
	if bio.Valid {
		result.Bio = &bio.String
	}
	return result, nil
}
