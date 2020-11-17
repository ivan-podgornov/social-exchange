type ErrorsMap = { [key: string]: string };

export class ValidationError extends Error {
    errors: ErrorsMap;
    name = 'ValidationError';

    constructor(errors: ErrorsMap) {
        super();
        this.errors = errors;
    }

    toJSON() {
        return {
            status: 'error',
            name: this.name,
            errors: this.errors,
        };
    }
}
