package profile

import (
	"context"
	"strings"
	"testing"
	"time"

	"github.com/Tiancheng-Xu/course-homework/apps/api-go/internal/contracts"
	"github.com/Tiancheng-Xu/course-homework/apps/api-go/internal/testdb"
)

func TestFindLatestReturnsNilForEmptyDatabase(t *testing.T) {
	t.Parallel()

	repository := NewRepository(testdb.Open(t), fixedNow)
	got, err := repository.FindLatest(context.Background())
	if err != nil {
		t.Fatalf("FindLatest() error = %v", err)
	}
	if got != nil {
		t.Fatalf("FindLatest() = %#v, want nil", got)
	}
}

func TestUpsertPersistsNullableProfileAndReturnsIt(t *testing.T) {
	t.Parallel()

	db := testdb.Open(t)
	repository := NewRepository(db, fixedNow)
	want := sampleProfile()

	got, err := repository.Upsert(context.Background(), want)
	if err != nil {
		t.Fatalf("Upsert() error = %v", err)
	}
	assertProfile(t, got, want)

	latest, err := repository.FindLatest(context.Background())
	if err != nil {
		t.Fatalf("FindLatest() error = %v", err)
	}
	if latest == nil {
		t.Fatal("FindLatest() = nil")
	}
	assertProfile(t, *latest, want)
}

func TestUpsertUpdatesSameIdentityWithoutDuplicate(t *testing.T) {
	t.Parallel()

	db := testdb.Open(t)
	repository := NewRepository(db, fixedNow)
	first := sampleProfile()
	if _, err := repository.Upsert(context.Background(), first); err != nil {
		t.Fatal(err)
	}

	updatedBio := "Updated from Go"
	updated := first
	updated.Login = "renamed-login"
	updated.ProfileURL = "https://github.com/renamed-login"
	updated.Bio = &updatedBio
	got, err := repository.Upsert(context.Background(), updated)
	if err != nil {
		t.Fatalf("second Upsert() error = %v", err)
	}
	assertProfile(t, got, updated)

	var count int
	if err := db.QueryRow(`SELECT count(*) FROM github_profiles WHERE github_id = ?`, first.GitHubID).Scan(&count); err != nil {
		t.Fatal(err)
	}
	if count != 1 {
		t.Fatalf("row count = %d, want 1", count)
	}
}

func TestFindLatestUsesSyncedAt(t *testing.T) {
	t.Parallel()

	repository := NewRepository(testdb.Open(t), fixedNow)
	older := sampleProfile()
	older.SyncedAt = "2026-07-31T10:00:00Z"
	newer := sampleProfile()
	newer.GitHubID = 43
	newer.Login = "another-user"
	newer.ProfileURL = "https://github.com/another-user"
	newer.SyncedAt = "2026-07-31T13:00:00Z"
	if _, err := repository.Upsert(context.Background(), older); err != nil {
		t.Fatal(err)
	}
	if _, err := repository.Upsert(context.Background(), newer); err != nil {
		t.Fatal(err)
	}

	got, err := repository.FindLatest(context.Background())
	if err != nil {
		t.Fatal(err)
	}
	if got == nil || got.GitHubID != newer.GitHubID {
		t.Fatalf("FindLatest() = %#v, want GitHubID %d", got, newer.GitHubID)
	}
}

func TestRepositoryErrorsDoNotContainProfileData(t *testing.T) {
	t.Parallel()

	db := testdb.Open(t)
	repository := NewRepository(db, fixedNow)
	if err := db.Close(); err != nil {
		t.Fatal(err)
	}
	profile := sampleProfile()
	profile.Login = "private-fixture-login"
	_, err := repository.Upsert(context.Background(), profile)
	if err == nil {
		t.Fatal("Upsert() expected error")
	}
	if strings.Contains(err.Error(), profile.Login) {
		t.Fatal("repository error leaked profile data")
	}
}

func sampleProfile() contracts.Profile {
	name := "Tiancheng Xu"
	return contracts.Profile{
		GitHubID:        42,
		Login:           "Tiancheng-Xu",
		DisplayName:     &name,
		Bio:             nil,
		AvatarURL:       "https://avatars.githubusercontent.com/u/42?v=4",
		ProfileURL:      "https://github.com/Tiancheng-Xu",
		PublicRepos:     3,
		Followers:       2,
		GitHubCreatedAt: "2020-01-01T00:00:00Z",
		SyncedAt:        "2026-07-31T12:00:00Z",
	}
}

func fixedNow() time.Time {
	return time.Date(2026, time.July, 31, 12, 30, 0, 0, time.UTC)
}

func assertProfile(t *testing.T, got, want contracts.Profile) {
	t.Helper()
	if got.GitHubID != want.GitHubID || got.Login != want.Login || got.AvatarURL != want.AvatarURL || got.ProfileURL != want.ProfileURL || got.PublicRepos != want.PublicRepos || got.Followers != want.Followers || got.GitHubCreatedAt != want.GitHubCreatedAt || got.SyncedAt != want.SyncedAt {
		t.Fatalf("profile = %#v, want %#v", got, want)
	}
	if !equalStringPointers(got.DisplayName, want.DisplayName) || !equalStringPointers(got.Bio, want.Bio) {
		t.Fatalf("nullable fields = %#v/%#v, want %#v/%#v", got.DisplayName, got.Bio, want.DisplayName, want.Bio)
	}
}

func equalStringPointers(left, right *string) bool {
	if left == nil || right == nil {
		return left == nil && right == nil
	}
	return *left == *right
}
