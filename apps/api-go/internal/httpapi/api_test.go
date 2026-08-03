package httpapi

import (
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"io"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/Tiancheng-Xu/fullstack-showcase/apps/api-go/internal/apperror"
	"github.com/Tiancheng-Xu/fullstack-showcase/apps/api-go/internal/contracts"
)

func TestHealth(t *testing.T) {
	t.Parallel()

	handler := newTestHandler(githubStub{}, &repositoryStub{}, nil)
	response := request(t, handler, http.MethodGet, "/health", "")
	if response.Code != http.StatusOK || response.Header().Get("Content-Type") != "application/json; charset=utf-8" {
		t.Fatalf("response = %d %s", response.Code, response.Header().Get("Content-Type"))
	}
	if response.Body.String() != `{"status":"ok"}` {
		t.Fatalf("body = %s", response.Body.String())
	}
}

func TestGitHubMeReturnsProfile(t *testing.T) {
	t.Parallel()

	profile := httpSampleProfile()
	handler := newTestHandler(githubStub{profile: profile}, &repositoryStub{}, nil)
	response := request(t, handler, http.MethodGet, "/api/github/me", "")
	if response.Code != http.StatusOK {
		t.Fatalf("status = %d, body = %s", response.Code, response.Body.String())
	}
	assertJSONProfile(t, response.Body.Bytes(), profile)
}

func TestGetSavedProfile(t *testing.T) {
	t.Parallel()

	profile := httpSampleProfile()
	repository := &repositoryStub{latest: &profile}
	handler := newTestHandler(githubStub{}, repository, nil)
	response := request(t, handler, http.MethodGet, "/api/github-profile", "")
	if response.Code != http.StatusOK {
		t.Fatalf("status = %d, body = %s", response.Code, response.Body.String())
	}
	assertJSONProfile(t, response.Body.Bytes(), profile)
}

func TestGetSavedProfileMapsMissingAndPersistenceErrors(t *testing.T) {
	t.Parallel()

	tests := []struct {
		name       string
		repository *repositoryStub
		status     int
		code       string
	}{
		{"missing", &repositoryStub{}, 404, "PROFILE_NOT_FOUND"},
		{"failure", &repositoryStub{findError: errors.New("private database detail")}, 500, "PERSISTENCE_FAILED"},
	}
	for _, test := range tests {
		test := test
		t.Run(test.name, func(t *testing.T) {
			t.Parallel()
			handler := newTestHandler(githubStub{}, test.repository, nil)
			response := request(t, handler, http.MethodGet, "/api/github-profile", "")
			assertErrorResponse(t, response, test.status, test.code)
			if strings.Contains(response.Body.String(), "private") {
				t.Fatal("response leaked database detail")
			}
		})
	}
}

func TestPostRefetchesGitHubAndOverridesOnlyEditableFields(t *testing.T) {
	t.Parallel()

	githubProfile := httpSampleProfile()
	repository := &repositoryStub{}
	github := githubStub{profile: githubProfile}
	handler := newTestHandler(github, repository, nil)
	response := request(t, handler, http.MethodPost, "/api/github-profile", `{"displayName":"  Reviewed Name  ","bio":"Reviewed bio"}`)
	if response.Code != http.StatusOK {
		t.Fatalf("status = %d, body = %s", response.Code, response.Body.String())
	}
	if repository.upserted == nil || repository.upserted.GitHubID != githubProfile.GitHubID || repository.upserted.Login != githubProfile.Login {
		t.Fatalf("upserted = %#v", repository.upserted)
	}
	if repository.upserted.DisplayName == nil || *repository.upserted.DisplayName != "Reviewed Name" || repository.upserted.Bio == nil || *repository.upserted.Bio != "Reviewed bio" {
		t.Fatalf("editable fields = %#v/%#v", repository.upserted.DisplayName, repository.upserted.Bio)
	}
	assertJSONProfile(t, response.Body.Bytes(), *repository.upserted)
}

func TestPostRejectsInvalidAndOversizedBodies(t *testing.T) {
	t.Parallel()

	invalidBodies := []string{
		`not-json`,
		`{"displayName":"name"}`,
		`{"displayName":"name","bio":null,"githubId":42}`,
		`{"displayName":"name","bio":null} {}`,
		`{"displayName":"` + strings.Repeat("a", 3000) + `","bio":null}`,
	}
	for _, body := range invalidBodies {
		body := body
		t.Run(body[:min(len(body), 16)], func(t *testing.T) {
			t.Parallel()
			handler := newTestHandler(githubStub{profile: httpSampleProfile()}, &repositoryStub{}, nil)
			response := request(t, handler, http.MethodPost, "/api/github-profile", body)
			assertErrorResponse(t, response, 400, "VALIDATION_FAILED")
		})
	}
}

func TestApplicationErrorsRemainStable(t *testing.T) {
	t.Parallel()

	githubError := apperror.New(429, "GITHUB_RATE_LIMITED", "GitHub rate limit reached. Please try again later.", errors.New("private"))
	handler := newTestHandler(githubStub{err: githubError}, &repositoryStub{}, nil)
	response := request(t, handler, http.MethodGet, "/api/github/me", "")
	assertErrorResponse(t, response, 429, "GITHUB_RATE_LIMITED")

	repository := &repositoryStub{upsertError: errors.New("private database detail")}
	handler = newTestHandler(githubStub{profile: httpSampleProfile()}, repository, nil)
	response = request(t, handler, http.MethodPost, "/api/github-profile", `{"displayName":null,"bio":null}`)
	assertErrorResponse(t, response, 500, "PERSISTENCE_FAILED")
}

func TestUnknownRoutesAndMethodsUseSafeJSON(t *testing.T) {
	t.Parallel()

	handler := newTestHandler(githubStub{}, &repositoryStub{}, nil)
	assertErrorResponse(t, request(t, handler, http.MethodGet, "/missing", ""), 404, "NOT_FOUND")
	assertErrorResponse(t, request(t, handler, http.MethodDelete, "/api/github-profile", ""), 405, "METHOD_NOT_ALLOWED")
}

func TestRequestLogOmitsHeadersAndBodies(t *testing.T) {
	t.Parallel()

	var logOutput bytes.Buffer
	handler := newTestHandler(githubStub{profile: httpSampleProfile()}, &repositoryStub{}, &logOutput)
	req := httptest.NewRequest(http.MethodPost, "/api/github-profile", strings.NewReader(`{"displayName":"sensitive-form-fixture","bio":null}`))
	req.Header.Set("Authorization", "Bearer sensitive-header-fixture")
	req.Header.Set("Content-Type", "application/json")
	response := httptest.NewRecorder()
	handler.ServeHTTP(response, req)

	logLine := logOutput.String()
	for _, forbidden := range []string{"sensitive-form-fixture", "sensitive-header-fixture", "Authorization"} {
		if strings.Contains(logLine, forbidden) {
			t.Fatalf("log leaked %q: %s", forbidden, logLine)
		}
	}
	for _, required := range []string{"method=POST", "route=/api/github-profile", "status=200", "duration_ms="} {
		if !strings.Contains(logLine, required) {
			t.Fatalf("log missing %q: %s", required, logLine)
		}
	}
}

func TestRequestLogUsesStaticRouteForUnknownControlCharacterPath(t *testing.T) {
	t.Parallel()

	var logOutput bytes.Buffer
	handler := newTestHandler(githubStub{}, &repositoryStub{}, &logOutput)
	response := request(t, handler, http.MethodGet, "/unknown%0Astatus=200", "")
	assertErrorResponse(t, response, 404, "NOT_FOUND")

	logLine := logOutput.String()
	if !strings.Contains(logLine, "route=<unmatched>") {
		t.Fatalf("log = %q, want unmatched route", logLine)
	}
	for _, forbidden := range []string{"unknown", "%0A", "\nstatus=200"} {
		if strings.Contains(logLine, forbidden) {
			t.Fatalf("log leaked attacker path %q: %q", forbidden, logLine)
		}
	}
	if strings.Count(logLine, "\n") != 1 {
		t.Fatalf("log contains forged records: %q", logLine)
	}
}

func newTestHandler(github githubStub, repository *repositoryStub, logOutput *bytes.Buffer) http.Handler {
	var writer io.Writer
	if logOutput != nil {
		writer = logOutput
	}
	return New(Dependencies{GitHub: github, Profiles: repository}, writer)
}

func request(t *testing.T, handler http.Handler, method, path, body string) *httptest.ResponseRecorder {
	t.Helper()
	req := httptest.NewRequest(method, path, strings.NewReader(body))
	if body != "" {
		req.Header.Set("Content-Type", "application/json")
	}
	response := httptest.NewRecorder()
	handler.ServeHTTP(response, req)
	return response
}

type githubStub struct {
	profile contracts.Profile
	err     error
}

func (s githubStub) FetchAuthenticatedProfile(context.Context) (contracts.Profile, error) {
	return s.profile, s.err
}

type repositoryStub struct {
	latest      *contracts.Profile
	findError   error
	upserted    *contracts.Profile
	upsertError error
}

func (s *repositoryStub) FindLatest(context.Context) (*contracts.Profile, error) {
	return s.latest, s.findError
}

func (s *repositoryStub) Upsert(_ context.Context, profile contracts.Profile) (contracts.Profile, error) {
	s.upserted = &profile
	return profile, s.upsertError
}

func httpSampleProfile() contracts.Profile {
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
		SyncedAt:        "2026-07-31T12:00:00.000Z",
	}
}

func assertJSONProfile(t *testing.T, body []byte, want contracts.Profile) {
	t.Helper()
	var got contracts.Profile
	if err := json.Unmarshal(body, &got); err != nil {
		t.Fatalf("decode profile: %v (%s)", err, body)
	}
	if got.GitHubID != want.GitHubID || got.Login != want.Login || got.SyncedAt != want.SyncedAt {
		t.Fatalf("profile = %#v, want %#v", got, want)
	}
}

func assertErrorResponse(t *testing.T, response *httptest.ResponseRecorder, status int, code string) {
	t.Helper()
	if response.Code != status {
		t.Fatalf("status = %d, want %d; body = %s", response.Code, status, response.Body.String())
	}
	var body apperror.Body
	if err := json.Unmarshal(response.Body.Bytes(), &body); err != nil {
		t.Fatalf("decode error: %v (%s)", err, response.Body.String())
	}
	if body.Error.Code != code || body.Error.Message == "" {
		t.Fatalf("error body = %#v, want code %s", body, code)
	}
}
