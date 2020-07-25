//from https://developer.mozilla.org/ja/docs/Web/JavaScript/Reference/Global_Objects/Error

export class AppError extends Error {
    constructor(message:string = '', ...params:any) {
        super(...params);

        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, AppError);
        }

        this.name = 'AppError';
        this.message = message;
    }
}