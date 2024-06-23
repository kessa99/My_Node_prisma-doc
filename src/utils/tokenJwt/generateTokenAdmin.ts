import jwt from 'jsonwebtoken';
import { User } from "@prisma/client";

// Les clés secrètes pour signer les tokens d'accès et de rafraîchissement
const ACCESS_TOKEN_SECRET = process.env.ACCESS_TOKEN || '29&%#(&-@_*JKHN';
const REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN || ')*^#(^LH#&ln2-0i#@K_lk4deby';

// Interface pour définir la charge utile des JWT
interface JwtPayload {
    role: string;
}

// Génère un token d'accès (access token) pour un utilisateur
export const generateAccessTokenAdmin = (user: User): string => {
    // Signer un nouveau token avec l'ID de l'utilisateur comme charge utile
    return jwt.sign(
        { 
            role: user.role
        }, // Charge utile
        ACCESS_TOKEN_SECRET, // Clé secrète pour signer le token
        { 
            expiresIn: '1800s' 
        } // Durée de validité du token (1800 secondes = 30 minutes)
    );
};

// Génère un token de rafraîchissement (refresh token) pour un utilisateur
export const generateRefreshTokenAdmin = (user: User): string => {
    // Signer un nouveau token avec l'ID de l'utilisateur comme charge utile
    return jwt.sign(
        {
            role: user.role
        }, // Charge utile
        REFRESH_TOKEN_SECRET, // Clé secrète pour signer le token
        {
            expiresIn: '7d'
        }// Durée de validité du token (7 jours)
    );
};

// Vérifie et décode un token en utilisant une clé secrète
export const verifyToken = (token: string, secret: string): JwtPayload => {
    try {
        // Vérifier et décoder le token en utilisant la clé secrète fournie
        return jwt.verify(token, secret) as JwtPayload;
    } catch (error) {
        // Si la vérification échoue, lancer une erreur
        throw new Error('Invalid token');
    }
};