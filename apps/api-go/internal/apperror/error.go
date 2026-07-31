package apperror

type Error struct {
	Status      int
	Code        string
	SafeMessage string
	cause       error
}

type Body struct {
	Error BodyDetail `json:"error"`
}

type BodyDetail struct {
	Code    string `json:"code"`
	Message string `json:"message"`
}

func New(status int, code, safeMessage string, cause error) *Error {
	return &Error{
		Status:      status,
		Code:        code,
		SafeMessage: safeMessage,
		cause:       cause,
	}
}

func (e *Error) Error() string {
	return e.Code
}

func (e *Error) Cause() error {
	return e.cause
}

func (e *Error) Unwrap() error {
	return e.cause
}

func (e *Error) Body() Body {
	return Body{Error: BodyDetail{Code: e.Code, Message: e.SafeMessage}}
}
