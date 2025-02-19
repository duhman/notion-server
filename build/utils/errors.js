export class NotionMCPError extends Error {
    code;
    details;
    constructor(message, code, details) {
        super(message);
        this.code = code;
        this.details = details;
        this.name = 'NotionMCPError';
    }
    static fromError(error) {
        if (error instanceof NotionMCPError) {
            return error;
        }
        if (error instanceof Error) {
            return new NotionMCPError(error.message, 'UNKNOWN_ERROR', { originalError: error });
        }
        return new NotionMCPError('An unknown error occurred', 'UNKNOWN_ERROR', { originalError: error });
    }
    toJSON() {
        return {
            name: this.name,
            message: this.message,
            code: this.code,
            details: this.details,
        };
    }
}
export const errorCodes = {
    VALIDATION_ERROR: 'VALIDATION_ERROR',
    NOT_FOUND: 'NOT_FOUND',
    RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
    UNAUTHORIZED: 'UNAUTHORIZED',
    FORBIDDEN: 'FORBIDDEN',
    INTERNAL_ERROR: 'INTERNAL_ERROR',
};
