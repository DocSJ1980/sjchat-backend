// ErrorResponse object for custom error handler
class ErrorResponse extends Error {
    constructor(message, statusCode) {
        super(message)
        this.statusCode = statusCode
    }
}

export default ErrorResponse