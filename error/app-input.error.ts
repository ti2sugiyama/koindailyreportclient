import { AppError } from "./app.error";

export class InputError extends AppError{
    constructor(message:string){
        super("InputError",message);
    }
}