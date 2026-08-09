package apperror

import (
	"encoding/json"
	"errors"
	"strings"
	"testing"
)

func TestErrorReturnsOnlySafeEnvelope(t *testing.T) {
	t.Parallel()

	secret := "credential-fixture-must-not-escape"
	err := New(503, "GITHUB_CREDENTIAL_UNAVAILABLE", "GitHub credentials are unavailable.", errors.New(secret))

	if err.Status != 503 {
		t.Fatalf("Status = %d", err.Status)
	}
	if strings.Contains(err.Error(), secret) {
		t.Fatal("Error() leaked cause")
	}
	encoded, marshalErr := json.Marshal(err.Body())
	if marshalErr != nil {
		t.Fatal(marshalErr)
	}
	want := `{"error":{"code":"GITHUB_CREDENTIAL_UNAVAILABLE","message":"GitHub credentials are unavailable."}}`
	if string(encoded) != want {
		t.Fatalf("Body JSON = %s, want %s", encoded, want)
	}
	if !errors.Is(err, err.Cause()) {
		t.Fatal("Cause should be available to server code")
	}
}
