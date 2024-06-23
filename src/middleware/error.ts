// middleware/errorMiddleware.ts
import { Request, Response, NextFunction } from 'express';
import { HttpException } from '../exceptions/root';

// Middleware de gestion des erreurs
export const errorMiddleware = (error: HttpException, req: Request, res: Response, next: NextFunction) => {
    const statusCode = error.statusCode || 500;  // Code de statut par défaut à 500
    res.status(statusCode).json({
        message: error.message,      // Message d'erreur
        errorCode: error.errorCode,  // Code d'erreur
        errors: error.errors,        // Erreurs supplémentaires
    });
};
