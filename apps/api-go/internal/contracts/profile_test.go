package contracts

import (
	"encoding/json"
	"strings"
	"testing"
)

func TestParseSaveInput(t *testing.T) {
	t.Parallel()

	input, err := ParseSaveInput([]byte(`{"displayName":"  Edited name  ","bio":null}`))
	if err != nil {
		t.Fatalf("ParseSaveInput() error = %v", err)
	}
	if input.DisplayName == nil || *input.DisplayName != "Edited name" {
		t.Fatalf("DisplayName = %#v", input.DisplayName)
	}
	if input.Bio != nil {
		t.Fatalf("Bio = %#v, want nil", input.Bio)
	}
}

func TestParseSaveInputRejectsInvalidBodies(t *testing.T) {
	t.Parallel()

	invalid := []string{
		`{}`,
		`{"displayName":"name"}`,
		`{"displayName":"name","bio":null,"githubId":42}`,
		`{"displayName":42,"bio":null}`,
		`{"displayName":"name","bio":null} {}`,
		`null`,
	}
	for _, body := range invalid {
		if _, err := ParseSaveInput([]byte(body)); err == nil {
			t.Errorf("ParseSaveInput(%s) expected error", body)
		}
	}
}

func TestParseSaveInputUsesJavaScriptStringLength(t *testing.T) {
	t.Parallel()

	validName := strings.Repeat("a", 98) + "😀"
	if _, err := ParseSaveInput([]byte(`{"displayName":` + mustJSON(t, validName) + `,"bio":null}`)); err != nil {
		t.Fatalf("100 UTF-16 units should be valid: %v", err)
	}

	invalidName := strings.Repeat("a", 99) + "😀"
	if _, err := ParseSaveInput([]byte(`{"displayName":` + mustJSON(t, invalidName) + `,"bio":null}`)); err == nil {
		t.Fatal("101 UTF-16 units should be rejected")
	}
}

func TestParseSaveInputUsesJavaScriptTrimSemantics(t *testing.T) {
	t.Parallel()

	input, err := ParseSaveInput([]byte(`{"displayName":"\ufeff Edited name \ufeff","bio":"\u0085kept\u0085"}`))
	if err != nil {
		t.Fatalf("ParseSaveInput() error = %v", err)
	}
	if input.DisplayName == nil || *input.DisplayName != "Edited name" {
		t.Fatalf("DisplayName = %#v, want JavaScript whitespace trimmed", input.DisplayName)
	}
	if input.Bio == nil || *input.Bio != "\u0085kept\u0085" {
		t.Fatalf("Bio = %#v, want U+0085 retained like JavaScript String.trim()", input.Bio)
	}
}

func TestProfileJSONContract(t *testing.T) {
	t.Parallel()

	name := "Tiancheng Xu"
	profile := Profile{
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
	encoded, err := json.Marshal(profile)
	if err != nil {
		t.Fatalf("json.Marshal() error = %v", err)
	}
	want := `{"githubId":42,"login":"Tiancheng-Xu","displayName":"Tiancheng Xu","bio":null,"avatarUrl":"https://avatars.githubusercontent.com/u/42?v=4","profileUrl":"https://github.com/Tiancheng-Xu","publicRepos":3,"followers":2,"githubCreatedAt":"2020-01-01T00:00:00Z","syncedAt":"2026-07-31T12:00:00Z"}`
	if string(encoded) != want {
		t.Fatalf("JSON = %s\nwant = %s", encoded, want)
	}
}

func mustJSON(t *testing.T, value string) string {
	t.Helper()
	encoded, err := json.Marshal(value)
	if err != nil {
		t.Fatal(err)
	}
	return string(encoded)
}
