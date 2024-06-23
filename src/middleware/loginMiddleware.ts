import { Request, Response, NextFunction } from "express";
import { verifyToken } from "../utils/tokenJwt/jwt";

// Les clés secrètes pour signer les tokens d'accès et de rafraîchissement
const ACCESS_TOKEN_SECRET = process.env.ACCESS_TOKEN || '29&%#(&-@_*JKHN';
const REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN || ')*^#(^LH#&ln2-0i#@K_lk4deby';

// Interface pour définir la charge utile des JWT
interface JwtPayload {
    userId: string;
    role: string;
}

export const loginMiddleware = (req: Request, res: Response, next: NextFunction) => {
    // 1. recuperer le token dans le header (autorization)
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    // 2. verifier que le token est bien present dans le header
    if (!token) {
        return res.status(401).json({
            message: 'Attention le token n\'est pas present'
        })
    }

    // 3. Si le token existe on va le verifier
    const decoded = verifyToken(token, ACCESS_TOKEN_SECRET);
    if (!decoded) {
        return res.status(403).json({ message: 'Token non valide' });
    }


    (req as any).userAuth = decoded.userId;
    next()
};