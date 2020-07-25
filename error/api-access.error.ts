import { AppError } from "./app.error";

export class APIAccessError extends AppError {
    protected error:any;
    constructor(message: string,error:any) {
        super("APIAccessError", message);
        this.error = error;
    }
}