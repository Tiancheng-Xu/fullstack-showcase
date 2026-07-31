package keychain

import (
	"context"
	"errors"
	"reflect"
	"strings"
	"testing"

	"github.com/Tiancheng-Xu/course-homework/apps/api-go/internal/apperror"
)

func TestProviderReadsGenericPasswordWithFixedArguments(t *testing.T) {
	t.Parallel()

	var gotName string
	var gotArgs []string
	provider := NewProvider("course-homework.github-profile", "Tiancheng-Xu", runnerFunc(
		func(_ context.Context, name string, args ...string) ([]byte, error) {
			gotName = name
			gotArgs = append([]string(nil), args...)
			return []byte("  fixture-credential\n"), nil
		},
	))

	token, err := provider.Token(context.Background())
	if err != nil {
		t.Fatalf("Token() error = %v", err)
	}
	if token != "fixture-credential" {
		t.Fatalf("Token() = %q", token)
	}
	if gotName != "/usr/bin/security" {
		t.Fatalf("command = %q", gotName)
	}
	wantArgs := []string{"find-generic-password", "-s", "course-homework.github-profile", "-a", "Tiancheng-Xu", "-w"}
	if !reflect.DeepEqual(gotArgs, wantArgs) {
		t.Fatalf("args = %#v, want %#v", gotArgs, wantArgs)
	}
}

func TestProviderReturnsEmptyWhenItemIsMissing(t *testing.T) {
	t.Parallel()

	provider := NewProvider("service", "account", runnerFunc(
		func(context.Context, string, ...string) ([]byte, error) {
			return nil, exitError(44)
		},
	))
	token, err := provider.Token(context.Background())
	if err != nil {
		t.Fatalf("Token() error = %v", err)
	}
	if token != "" {
		t.Fatalf("Token() = %q, want empty", token)
	}
}

func TestProviderMapsFailuresWithoutCredentialLeak(t *testing.T) {
	t.Parallel()

	secret := "fixture-credential-must-not-escape"
	provider := NewProvider("service", "account", runnerFunc(
		func(context.Context, string, ...string) ([]byte, error) {
			return []byte(secret), errors.New("private command detail")
		},
	))
	_, err := provider.Token(context.Background())
	assertAppError(t, err, 503, "GITHUB_CREDENTIAL_UNAVAILABLE", secret)
}

func TestProviderMapsCancellationSafely(t *testing.T) {
	t.Parallel()

	provider := NewProvider("service", "account", runnerFunc(
		func(ctx context.Context, _ string, _ ...string) ([]byte, error) {
			return nil, ctx.Err()
		},
	))
	ctx, cancel := context.WithCancel(context.Background())
	cancel()
	_, err := provider.Token(ctx)
	assertAppError(t, err, 503, "GITHUB_CREDENTIAL_UNAVAILABLE", "canceled")
}

func TestCommandRunnerBoundsCredentialOutputWhileStreaming(t *testing.T) {
	t.Parallel()

	output, err := (commandRunner{}).Output(
		context.Background(),
		"/usr/bin/printf",
		strings.Repeat("x", maxCredentialOutput+1),
	)
	if err == nil {
		t.Fatalf("Output() returned %d bytes without error", len(output))
	}
	if len(output) != 0 {
		t.Fatalf("Output() returned %d bytes on overflow", len(output))
	}
}

type runnerFunc func(context.Context, string, ...string) ([]byte, error)

func (f runnerFunc) Output(ctx context.Context, name string, args ...string) ([]byte, error) {
	return f(ctx, name, args...)
}

type exitError int

func (e exitError) Error() string { return "command failed" }
func (e exitError) ExitCode() int { return int(e) }

func assertAppError(t *testing.T, err error, status int, code, forbidden string) {
	t.Helper()
	var appError *apperror.Error
	if !errors.As(err, &appError) {
		t.Fatalf("error = %T %v, want *apperror.Error", err, err)
	}
	if appError.Status != status || appError.Code != code {
		t.Fatalf("error = %#v, want status %d code %s", appError, status, code)
	}
	if strings.Contains(appError.Error(), forbidden) || strings.Contains(appError.SafeMessage, forbidden) {
		t.Fatalf("safe error leaked %q", forbidden)
	}
}
