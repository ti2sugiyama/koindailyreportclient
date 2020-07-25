import { AppError } from "./app.error";

export class IllegalValueError extends AppError {
    constructor(message: string) {
        super("IllegalValueError", message);
    }
}