package contracts

import (
	"encoding/json"
	"errors"
	"strings"
	"unicode/utf16"
)

const (
	maxDisplayNameLength = 100
	maxBioLength         = 500
)

var ErrInvalidSaveInput = errors.New("invalid save profile input")

type Profile struct {
	GitHubID        int64   `json:"githubId"`
	Login           string  `json:"login"`
	DisplayName     *string `json:"displayName"`
	Bio             *string `json:"bio"`
	AvatarURL       string  `json:"avatarUrl"`
	ProfileURL      string  `json:"profileUrl"`
	PublicRepos     int     `json:"publicRepos"`
	Followers       int     `json:"followers"`
	GitHubCreatedAt string  `json:"githubCreatedAt"`
	SyncedAt        string  `json:"syncedAt"`
}

type SaveInput struct {
	DisplayName *string
	Bio         *string
}

func ParseSaveInput(data []byte) (SaveInput, error) {
	var fields map[string]json.RawMessage
	if err := json.Unmarshal(data, &fields); err != nil || len(fields) != 2 {
		return SaveInput{}, ErrInvalidSaveInput
	}

	displayNameJSON, hasDisplayName := fields["displayName"]
	bioJSON, hasBio := fields["bio"]
	if !hasDisplayName || !hasBio {
		return SaveInput{}, ErrInvalidSaveInput
	}

	displayName, err := parseNullableString(displayNameJSON, maxDisplayNameLength)
	if err != nil {
		return SaveInput{}, ErrInvalidSaveInput
	}
	bio, err := parseNullableString(bioJSON, maxBioLength)
	if err != nil {
		return SaveInput{}, ErrInvalidSaveInput
	}

	return SaveInput{DisplayName: displayName, Bio: bio}, nil
}

func parseNullableString(data []byte, maxLength int) (*string, error) {
	var value *string
	if err := json.Unmarshal(data, &value); err != nil {
		return nil, err
	}
	if value == nil {
		return nil, nil
	}

	trimmed := TrimJavaScriptSpace(*value)
	if len(utf16.Encode([]rune(trimmed))) > maxLength {
		return nil, ErrInvalidSaveInput
	}
	return &trimmed, nil
}

func TrimJavaScriptSpace(value string) string {
	return strings.TrimFunc(value, isJavaScriptSpace)
}

func isJavaScriptSpace(value rune) bool {
	switch value {
	case '\u0009', '\u000A', '\u000B', '\u000C', '\u000D', '\u0020', '\u00A0', '\u1680',
		'\u2028', '\u2029', '\u202F', '\u205F', '\u3000', '\uFEFF':
		return true
	default:
		return value >= '\u2000' && value <= '\u200A'
	}
}
