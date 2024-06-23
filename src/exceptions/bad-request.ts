import { ErrorCodes, HttpException } from "./root";

// Exception pour les erreurs de type "Bad Request"
export class BadRequestException extends HttpException {
    constructor(message: string, errorCode: ErrorCodes) {
        super(message, errorCode, 400, null);
    }
}
