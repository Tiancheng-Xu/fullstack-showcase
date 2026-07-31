package github

import (
	"context"
	"errors"
	"io"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
	"time"

	"github.com/Tiancheng-Xu/course-homework/apps/api-go/internal/apperror"
)

const validUpstreamProfile = `{
	"id": 42,
	"login": "Tiancheng-Xu",
	"name": "Tiancheng Xu",
	"bio": null,
	"avatar_url": "https://avatars.githubusercontent.com/u/42?v=4",
	"html_url": "https://github.com/Tiancheng-Xu",
	"public_repos": 3,
	"followers": 2,
	"created_at": "2020-01-01T00:00:00Z",
	"email": "excluded@example.test"
}`

func TestFetchAuthenticatedProfileUsesRequiredHeadersAndWhitelist(t *testing.T) {
	t.Parallel()

	server := httptest.NewServer(http.HandlerFunc(func(response http.ResponseWriter, request *http.Request) {
		if request.URL.Path != "/user" {
			t.Errorf("path = %s", request.URL.Path)
		}
		wantHeaders := map[string]string{
			"Accept":               "application/vnd.github+json",
			"Authorization":        "Bearer fixture-credential",
			"User-Agent":           "course-homework-github-profile",
			"X-GitHub-Api-Version": "2026-03-10",
		}
		for name, want := range wantHeaders {
			if got := request.Header.Get(name); got != want {
				t.Errorf("%s = %q, want %q", name, got, want)
			}
		}
		response.Header().Set("Content-Type", "application/json")
		_, _ = io.WriteString(response, validUpstreamProfile)
	}))
	t.Cleanup(server.Close)

	client := newTestClient(server.Client(), server.URL, "fixture-credential")
	profile, err := client.FetchAuthenticatedProfile(context.Background())
	if err != nil {
		t.Fatalf("FetchAuthenticatedProfile() error = %v", err)
	}
	if profile.GitHubID != 42 || profile.Login != "Tiancheng-Xu" || profile.PublicRepos != 3 || profile.SyncedAt != "2026-07-31T12:00:00.000Z" {
		t.Fatalf("profile = %#v", profile)
	}
}

func TestFetchAuthenticatedProfileRequiresToken(t *testing.T) {
	t.Parallel()

	doer := doerFunc(func(*http.Request) (*http.Response, error) {
		t.Fatal("HTTP request should not be sent")
		return nil, nil
	})
	client := newTestClient(doer, "https://api.github.test", "")
	_, err := client.FetchAuthenticatedProfile(context.Background())
	assertGitHubAppError(t, err, 503, "GITHUB_TOKEN_MISSING")
}

func TestFetchAuthenticatedProfileMapsUpstreamStatuses(t *testing.T) {
	t.Parallel()

	tests := []struct {
		name       string
		status     int
		headers    http.Header
		wantStatus int
		wantCode   string
	}{
		{"unauthorized", 401, nil, 401, "GITHUB_AUTH_FAILED"},
		{"rate limited", 403, http.Header{"X-Ratelimit-Remaining": []string{"0"}}, 429, "GITHUB_RATE_LIMITED"},
		{"forbidden", 403, nil, 403, "GITHUB_FORBIDDEN"},
		{"server error", 500, nil, 502, "GITHUB_UNAVAILABLE"},
	}
	for _, test := range tests {
		test := test
		t.Run(test.name, func(t *testing.T) {
			t.Parallel()
			doer := doerFunc(func(*http.Request) (*http.Response, error) {
				return &http.Response{
					StatusCode: test.status,
					Header:     test.headers,
					Body:       io.NopCloser(strings.NewReader("private upstream response")),
				}, nil
			})
			client := newTestClient(doer, "https://api.github.test", "fixture-credential")
			_, err := client.FetchAuthenticatedProfile(context.Background())
			assertGitHubAppError(t, err, test.wantStatus, test.wantCode)
		})
	}
}

func TestFetchAuthenticatedProfileRejectsMalformedData(t *testing.T) {
	t.Parallel()

	invalidBodies := []string{
		`not-json`,
		strings.Replace(validUpstreamProfile, `"id": 42`, `"id": "wrong"`, 1),
		strings.Replace(validUpstreamProfile, `https://avatars.githubusercontent.com/u/42?v=4`, `http://invalid.example/avatar`, 1),
		strings.Replace(validUpstreamProfile, `"public_repos": 3`, `"public_repos": -1`, 1),
	}
	for _, body := range invalidBodies {
		body := body
		t.Run(body[:min(12, len(body))], func(t *testing.T) {
			t.Parallel()
			doer := staticResponse(200, nil, body)
			client := newTestClient(doer, "https://api.github.test", "fixture-credential")
			_, err := client.FetchAuthenticatedProfile(context.Background())
			assertGitHubAppError(t, err, 502, "GITHUB_UNAVAILABLE")
		})
	}
}

func TestFetchAuthenticatedProfileMapsTimeoutWithoutLeak(t *testing.T) {
	t.Parallel()

	secret := "fixture-credential-must-not-escape"
	doer := doerFunc(func(request *http.Request) (*http.Response, error) {
		<-request.Context().Done()
		return nil, errors.New(secret)
	})
	client := NewClient(Options{
		TokenProvider: tokenProviderFunc(func(context.Context) (string, error) { return secret, nil }),
		HTTPClient:    doer,
		BaseURL:       "https://api.github.test",
		Now:           fixedGitHubNow,
		Timeout:       time.Millisecond,
	})
	_, err := client.FetchAuthenticatedProfile(context.Background())
	assertGitHubAppError(t, err, 502, "GITHUB_UNAVAILABLE")
	if strings.Contains(err.Error(), secret) {
		t.Fatal("error leaked credential")
	}
}

func newTestClient(doer HTTPDoer, baseURL, token string) *Client {
	return NewClient(Options{
		TokenProvider: tokenProviderFunc(func(context.Context) (string, error) { return token, nil }),
		HTTPClient:    doer,
		BaseURL:       baseURL,
		Now:           fixedGitHubNow,
		Timeout:       5 * time.Second,
	})
}

func staticResponse(status int, headers http.Header, body string) HTTPDoer {
	return doerFunc(func(*http.Request) (*http.Response, error) {
		return &http.Response{
			StatusCode: status,
			Header:     headers,
			Body:       io.NopCloser(strings.NewReader(body)),
		}, nil
	})
}

func fixedGitHubNow() time.Time {
	return time.Date(2026, time.July, 31, 12, 0, 0, 0, time.UTC)
}

type tokenProviderFunc func(context.Context) (string, error)

func (f tokenProviderFunc) Token(ctx context.Context) (string, error) { return f(ctx) }

type doerFunc func(*http.Request) (*http.Response, error)

func (f doerFunc) Do(request *http.Request) (*http.Response, error) { return f(request) }

func assertGitHubAppError(t *testing.T, err error, status int, code string) {
	t.Helper()
	var appError *apperror.Error
	if !errors.As(err, &appError) {
		t.Fatalf("error = %T %v, want *apperror.Error", err, err)
	}
	if appError.Status != status || appError.Code != code {
		t.Fatalf("error = %#v, want status %d code %s", appError, status, code)
	}
	if strings.Contains(appError.SafeMessage, "private upstream response") || strings.Contains(appError.Error(), "fixture-credential") {
		t.Fatal("safe error leaked private data")
	}
}
