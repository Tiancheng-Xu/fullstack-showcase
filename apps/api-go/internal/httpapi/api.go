package httpapi

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net/http"
	"time"

	"github.com/Tiancheng-Xu/course-homework/apps/api-go/internal/apperror"
	"github.com/Tiancheng-Xu/course-homework/apps/api-go/internal/contracts"
)

const maxSaveBodyBytes = 2048

type GitHubSource interface {
	FetchAuthenticatedProfile(context.Context) (contracts.Profile, error)
}

type ProfileStore interface {
	FindLatest(context.Context) (*contracts.Profile, error)
	Upsert(context.Context, contracts.Profile) (contracts.Profile, error)
}

type Dependencies struct {
	GitHub   GitHubSource
	Profiles ProfileStore
}

type API struct {
	dependencies Dependencies
	logOutput    io.Writer
}

func New(dependencies Dependencies, logOutput io.Writer) http.Handler {
	if logOutput == nil {
		logOutput = io.Discard
	}
	return &API{dependencies: dependencies, logOutput: logOutput}
}

func (a *API) ServeHTTP(response http.ResponseWriter, request *http.Request) {
	started := time.Now()
	statusResponse := &statusWriter{ResponseWriter: response, status: http.StatusOK}
	defer func() {
		if recover() != nil {
			writeAppError(statusResponse, internalError())
		}
		_, _ = fmt.Fprintf(
			a.logOutput,
			"method=%s path=%s status=%d duration_ms=%d\n",
			request.Method,
			request.URL.Path,
			statusResponse.status,
			time.Since(started).Milliseconds(),
		)
	}()

	switch request.URL.Path {
	case "/health":
		if request.Method != http.MethodGet {
			writeAppError(statusResponse, methodNotAllowed())
			return
		}
		writeJSON(statusResponse, http.StatusOK, map[string]string{"status": "ok"})
	case "/api/github/me":
		if request.Method != http.MethodGet {
			writeAppError(statusResponse, methodNotAllowed())
			return
		}
		a.getGitHubProfile(statusResponse, request)
	case "/api/github-profile":
		switch request.Method {
		case http.MethodGet:
			a.getSavedProfile(statusResponse, request)
		case http.MethodPost:
			a.saveProfile(statusResponse, request)
		default:
			writeAppError(statusResponse, methodNotAllowed())
		}
	default:
		writeAppError(statusResponse, apperror.New(404, "NOT_FOUND", "The requested resource was not found.", nil))
	}
}

func (a *API) getGitHubProfile(response http.ResponseWriter, request *http.Request) {
	profile, err := a.dependencies.GitHub.FetchAuthenticatedProfile(request.Context())
	if err != nil {
		writeAppError(response, normalizeError(err))
		return
	}
	writeJSON(response, http.StatusOK, profile)
}

func (a *API) getSavedProfile(response http.ResponseWriter, request *http.Request) {
	profile, err := a.dependencies.Profiles.FindLatest(request.Context())
	if err != nil {
		writeAppError(response, persistenceError(err))
		return
	}
	if profile == nil {
		writeAppError(response, apperror.New(404, "PROFILE_NOT_FOUND", "No GitHub profile has been saved yet.", nil))
		return
	}
	writeJSON(response, http.StatusOK, profile)
}

func (a *API) saveProfile(response http.ResponseWriter, request *http.Request) {
	request.Body = http.MaxBytesReader(response, request.Body, maxSaveBodyBytes)
	body, err := io.ReadAll(request.Body)
	if err != nil {
		writeAppError(response, validationError())
		return
	}
	input, err := contracts.ParseSaveInput(body)
	if err != nil {
		writeAppError(response, validationError())
		return
	}

	githubProfile, err := a.dependencies.GitHub.FetchAuthenticatedProfile(request.Context())
	if err != nil {
		writeAppError(response, normalizeError(err))
		return
	}
	githubProfile.DisplayName = input.DisplayName
	githubProfile.Bio = input.Bio
	saved, err := a.dependencies.Profiles.Upsert(request.Context(), githubProfile)
	if err != nil {
		writeAppError(response, persistenceError(err))
		return
	}
	writeJSON(response, http.StatusOK, saved)
}

func normalizeError(err error) *apperror.Error {
	var appError *apperror.Error
	if errors.As(err, &appError) {
		return appError
	}
	return internalError()
}

func validationError() *apperror.Error {
	return apperror.New(400, "VALIDATION_FAILED", "The submitted profile fields are invalid.", nil)
}

func persistenceError(cause error) *apperror.Error {
	return apperror.New(500, "PERSISTENCE_FAILED", "The GitHub profile could not be persisted.", cause)
}

func internalError() *apperror.Error {
	return apperror.New(500, "INTERNAL_ERROR", "The request could not be completed.", nil)
}

func methodNotAllowed() *apperror.Error {
	return apperror.New(405, "METHOD_NOT_ALLOWED", "The request method is not allowed.", nil)
}

func writeAppError(response http.ResponseWriter, err *apperror.Error) {
	writeJSON(response, err.Status, err.Body())
}

func writeJSON(response http.ResponseWriter, status int, value any) {
	encoded, err := json.Marshal(value)
	if err != nil {
		encoded, _ = json.Marshal(internalError().Body())
		status = http.StatusInternalServerError
	}
	response.Header().Set("Content-Type", "application/json; charset=utf-8")
	response.WriteHeader(status)
	_, _ = response.Write(encoded)
}

type statusWriter struct {
	http.ResponseWriter
	status      int
	wroteHeader bool
}

func (w *statusWriter) WriteHeader(status int) {
	if w.wroteHeader {
		return
	}
	w.wroteHeader = true
	w.status = status
	w.ResponseWriter.WriteHeader(status)
}

func (w *statusWriter) Write(data []byte) (int, error) {
	if !w.wroteHeader {
		w.WriteHeader(http.StatusOK)
	}
	return w.ResponseWriter.Write(data)
}
