// exceptions/root.ts

// Classe de base pour les exceptions HTTP
export class HttpException extends Error {
    statusCode: number;
    errorCode: ErrorCodes;
    errors: any;

    constructor(message: string, errorCode: ErrorCodes, statusCode: number, errors: any) {
        super(message);
        this.statusCode = statusCode;
        this.errorCode = errorCode;
        this.errors = errors;
    }
}

// Définition des codes d'erreur
export enum ErrorCodes {
    USER_NOT_FOUND = 1001,
    USER_ALREADY_EXIST = 1002,
    INCORRECT_PASSWORD = 1003,
    PHONE_NUMBER_ALREADY_EXISTS = 1004,
    INCORRECT_EMAIL = 1005,
    NO_DATA_TO_UPDATE_FOUND = 1006,
    EMAIL_ALREADY_USED = 1007,
    INCORRECT_OTP = 1008,
    INVALID_OTP = 1009,
    INVALID_FORMAT_EMAIL = 1010,
    ACCOUNT_NOT_VERIFY = 1011,
    SUPER_ADMIN_NOT_FOUND = 1012,
    EMAIL_ADMIN_NOT_FOUND = 1013,
    INITIALIZE_ERROR_SUPER_ADMIN = 1014,
    INVALID_TOKEN = 1015,
    ACCES_DENIED = 1016,
}
