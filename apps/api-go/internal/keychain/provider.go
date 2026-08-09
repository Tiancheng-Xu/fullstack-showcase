package keychain

import (
	"context"
	"errors"
	"os/exec"
	"strings"

	"github.com/Tiancheng-Xu/course-homework/apps/api-go/internal/apperror"
)

const maxCredentialOutput = 4096

var errCredentialOutputExceeded = errors.New("credential output exceeded limit")

type Runner interface {
	Output(ctx context.Context, name string, args ...string) ([]byte, error)
}

type Provider struct {
	service string
	account string
	runner  Runner
}

func NewProvider(service, account string, runner Runner) *Provider {
	if runner == nil {
		runner = commandRunner{}
	}
	return &Provider{service: service, account: account, runner: runner}
}

func (p *Provider) Token(ctx context.Context) (string, error) {
	output, err := p.runner.Output(
		ctx,
		"/usr/bin/security",
		"find-generic-password",
		"-s",
		p.service,
		"-a",
		p.account,
		"-w",
	)
	if err != nil {
		var exitCoder interface{ ExitCode() int }
		if errors.As(err, &exitCoder) && exitCoder.ExitCode() == 44 {
			return "", nil
		}
		return "", apperror.New(
			503,
			"GITHUB_CREDENTIAL_UNAVAILABLE",
			"GitHub credential is temporarily unavailable.",
			err,
		)
	}
	if len(output) > maxCredentialOutput {
		return "", apperror.New(
			503,
			"GITHUB_CREDENTIAL_UNAVAILABLE",
			"GitHub credential is temporarily unavailable.",
			errCredentialOutputExceeded,
		)
	}
	return strings.TrimSpace(string(output)), nil
}

type commandRunner struct{}

func (commandRunner) Output(ctx context.Context, name string, args ...string) ([]byte, error) {
	command := exec.CommandContext(ctx, name, args...)
	output := boundedOutput{limit: maxCredentialOutput}
	command.Stdout = &output
	if err := command.Run(); err != nil {
		return nil, err
	}
	if output.overflow {
		return nil, errCredentialOutputExceeded
	}
	return output.data, nil
}

type boundedOutput struct {
	data     []byte
	limit    int
	overflow bool
}

func (output *boundedOutput) Write(chunk []byte) (int, error) {
	remaining := output.limit - len(output.data)
	if remaining > 0 && len(chunk) > remaining {
		output.data = append(output.data, chunk[:remaining]...)
	} else if remaining > 0 {
		output.data = append(output.data, chunk...)
	}
	if len(chunk) > remaining {
		output.overflow = true
	}
	return len(chunk), nil
}
