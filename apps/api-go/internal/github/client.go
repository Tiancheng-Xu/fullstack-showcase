package github

import (
	"context"
	"encoding/json"
	"errors"
	"io"
	"net/http"
	"net/url"
	"strings"
	"time"
	"unicode/utf16"

	"github.com/Tiancheng-Xu/fullstack-showcase/apps/api-go/internal/apperror"
	"github.com/Tiancheng-Xu/fullstack-showcase/apps/api-go/internal/contracts"
)

const (
	defaultBaseURL      = "https://api.github.com"
	defaultTimeout      = 5 * time.Second
	maxGitHubBodyLength = 64 << 10
)

type TokenProvider interface {
	Token(context.Context) (string, error)
}

type HTTPDoer interface {
	Do(*http.Request) (*http.Response, error)
}

type Options struct {
	TokenProvider TokenProvider
	HTTPClient    HTTPDoer
	BaseURL       string
	Now           func() time.Time
	Timeout       time.Duration
}

type Client struct {
	tokenProvider TokenProvider
	httpClient    HTTPDoer
	baseURL       string
	now           func() time.Time
	timeout       time.Duration
}

func NewClient(options Options) *Client {
	httpClient := options.HTTPClient
	if httpClient == nil {
		httpClient = http.DefaultClient
	}
	baseURL := strings.TrimRight(options.BaseURL, "/")
	if baseURL == "" {
		baseURL = defaultBaseURL
	}
	now := options.Now
	if now == nil {
		now = time.Now
	}
	timeout := options.Timeout
	if timeout <= 0 {
		timeout = defaultTimeout
	}
	return &Client{
		tokenProvider: options.TokenProvider,
		httpClient:    httpClient,
		baseURL:       baseURL,
		now:           now,
		timeout:       timeout,
	}
}

func (c *Client) FetchAuthenticatedProfile(ctx context.Context) (contracts.Profile, error) {
	token, err := c.tokenProvider.Token(ctx)
	if err != nil {
		return contracts.Profile{}, err
	}
	if token == "" {
		return contracts.Profile{}, apperror.New(
			503,
			"GITHUB_TOKEN_MISSING",
			"GitHub credential has not been saved yet.",
			nil,
		)
	}

	requestContext, cancel := context.WithTimeout(ctx, c.timeout)
	defer cancel()
	request, err := http.NewRequestWithContext(requestContext, http.MethodGet, c.baseURL+"/user", nil)
	if err != nil {
		return contracts.Profile{}, unavailable(err)
	}
	request.Header.Set("Accept", "application/vnd.github+json")
	request.Header.Set("Authorization", "Bearer "+token)
	request.Header.Set("User-Agent", "course-homework-github-profile")
	request.Header.Set("X-GitHub-Api-Version", "2026-03-10")

	response, err := c.httpClient.Do(request)
	if err != nil {
		return contracts.Profile{}, unavailable(err)
	}
	defer response.Body.Close()
	if response.StatusCode < 200 || response.StatusCode >= 300 {
		return contracts.Profile{}, upstreamError(response)
	}

	var upstreamWire upstreamProfileWire
	decoder := json.NewDecoder(io.LimitReader(response.Body, maxGitHubBodyLength))
	if err := decoder.Decode(&upstreamWire); err != nil {
		return contracts.Profile{}, unavailable(err)
	}
	if err := ensureJSONEnd(decoder); err != nil {
		return contracts.Profile{}, unavailable(err)
	}
	upstream, err := upstreamWire.profile()
	if err != nil {
		return contracts.Profile{}, unavailable(err)
	}
	if upstream.Name != nil {
		trimmed := contracts.TrimJavaScriptSpace(*upstream.Name)
		upstream.Name = &trimmed
	}
	if upstream.Bio != nil {
		trimmed := contracts.TrimJavaScriptSpace(*upstream.Bio)
		upstream.Bio = &trimmed
	}
	profile := contracts.Profile{
		GitHubID:        upstream.ID,
		Login:           upstream.Login,
		DisplayName:     upstream.Name,
		Bio:             upstream.Bio,
		AvatarURL:       upstream.AvatarURL,
		ProfileURL:      upstream.HTMLURL,
		PublicRepos:     upstream.PublicRepos,
		Followers:       upstream.Followers,
		GitHubCreatedAt: upstream.CreatedAt,
		SyncedAt:        c.now().UTC().Format("2006-01-02T15:04:05.000Z"),
	}
	if err := validateProfile(profile); err != nil {
		return contracts.Profile{}, unavailable(err)
	}
	return profile, nil
}

type upstreamProfile struct {
	ID          int64
	Login       string
	Name        *string
	Bio         *string
	AvatarURL   string
	HTMLURL     string
	PublicRepos int
	Followers   int
	CreatedAt   string
}

type upstreamProfileWire struct {
	ID          *int64          `json:"id"`
	Login       *string         `json:"login"`
	Name        json.RawMessage `json:"name"`
	Bio         json.RawMessage `json:"bio"`
	AvatarURL   *string         `json:"avatar_url"`
	HTMLURL     *string         `json:"html_url"`
	PublicRepos *int            `json:"public_repos"`
	Followers   *int            `json:"followers"`
	CreatedAt   *string         `json:"created_at"`
}

func (wire upstreamProfileWire) profile() (upstreamProfile, error) {
	if wire.ID == nil || wire.Login == nil || wire.Name == nil || wire.Bio == nil ||
		wire.AvatarURL == nil || wire.HTMLURL == nil || wire.PublicRepos == nil ||
		wire.Followers == nil || wire.CreatedAt == nil {
		return upstreamProfile{}, errors.New("GitHub response omitted a required field")
	}
	name, err := decodeNullableString(wire.Name)
	if err != nil {
		return upstreamProfile{}, err
	}
	bio, err := decodeNullableString(wire.Bio)
	if err != nil {
		return upstreamProfile{}, err
	}
	return upstreamProfile{
		ID:          *wire.ID,
		Login:       *wire.Login,
		Name:        name,
		Bio:         bio,
		AvatarURL:   *wire.AvatarURL,
		HTMLURL:     *wire.HTMLURL,
		PublicRepos: *wire.PublicRepos,
		Followers:   *wire.Followers,
		CreatedAt:   *wire.CreatedAt,
	}, nil
}

func decodeNullableString(data json.RawMessage) (*string, error) {
	var value *string
	if err := json.Unmarshal(data, &value); err != nil {
		return nil, errors.New("GitHub nullable field is malformed")
	}
	return value, nil
}

func validateProfile(profile contracts.Profile) error {
	if profile.GitHubID <= 0 || profile.Login == "" || len(profile.Login) > 39 {
		return errors.New("invalid GitHub identity")
	}
	if profile.DisplayName != nil && utf16Length(*profile.DisplayName) > 100 {
		return errors.New("invalid GitHub name")
	}
	if profile.Bio != nil && utf16Length(*profile.Bio) > 500 {
		return errors.New("invalid GitHub biography")
	}
	if !validURLPrefix(profile.AvatarURL, "https://avatars.githubusercontent.com/") ||
		!validURLPrefix(profile.ProfileURL, "https://github.com/") {
		return errors.New("invalid GitHub URL")
	}
	if profile.PublicRepos < 0 || profile.Followers < 0 {
		return errors.New("invalid GitHub metrics")
	}
	if !strings.HasSuffix(profile.GitHubCreatedAt, "Z") {
		return errors.New("invalid GitHub creation timestamp")
	}
	if _, err := time.Parse(time.RFC3339Nano, profile.GitHubCreatedAt); err != nil {
		return errors.New("invalid GitHub creation timestamp")
	}
	return nil
}

func validURLPrefix(value, prefix string) bool {
	parsed, err := url.ParseRequestURI(value)
	return err == nil && parsed.Scheme == "https" && strings.HasPrefix(value, prefix)
}

func utf16Length(value string) int {
	return len(utf16.Encode([]rune(value)))
}

func ensureJSONEnd(decoder *json.Decoder) error {
	var extra any
	if err := decoder.Decode(&extra); err != io.EOF {
		if err == nil {
			return errors.New("unexpected trailing JSON")
		}
		return err
	}
	return nil
}

func upstreamError(response *http.Response) *apperror.Error {
	if response.StatusCode == http.StatusUnauthorized {
		return apperror.New(401, "GITHUB_AUTH_FAILED", "GitHub rejected the saved credential.", nil)
	}
	if response.StatusCode == http.StatusForbidden {
		if response.Header.Get("X-Ratelimit-Remaining") == "0" {
			return apperror.New(429, "GITHUB_RATE_LIMITED", "GitHub rate limit reached. Please try again later.", nil)
		}
		return apperror.New(403, "GITHUB_FORBIDDEN", "GitHub denied access to the authenticated profile.", nil)
	}
	return unavailable(nil)
}

func unavailable(cause error) *apperror.Error {
	return apperror.New(
		502,
		"GITHUB_UNAVAILABLE",
		"GitHub profile data is temporarily unavailable.",
		cause,
	)
}
