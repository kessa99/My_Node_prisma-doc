Pour implémenter la logique de déconnexion (logout), nous devons nous assurer que le token d'authentification de l'utilisateur est invalidé ou supprimé afin qu'il ne puisse plus être utilisé pour accéder aux ressources protégées.

### 1. Suppression du Token de Rafraîchissement

La méthode la plus courante pour gérer la déconnexion consiste à supprimer le token de rafraîchissement (refresh token) stocké dans la base de données, ce qui empêche l'utilisateur d'obtenir un nouveau token d'accès (access token) une fois le token d'accès actuel expiré.

### Étapes de l'Implémentation

#### Étape 1: Endpoint pour le Logout

Créez un contrôleur pour gérer la déconnexion.

#### controllers/authController.ts

```typescript
import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const logout = async (req: Request, res: Response, next: NextFunction) => {
    try {
        // Obtenir l'ID utilisateur depuis le token (vous pouvez l'obtenir de diverses manières selon votre configuration)
        const userId = req.user.id;

        // Supprimer tous les refresh tokens associés à cet utilisateur
        await prisma.refreshTokens.deleteMany({
            where: {
                userId: userId
            }
        });

        res.json({
            status: 'success',
            message: 'Déconnexion réussie.'
        });
    } catch (err) {
        next(err);
    }
};
```

#### Étape 2: Route pour le Logout

Ajoutez une route pour appeler le contrôleur de déconnexion.

#### routes/auth.ts

```typescript
import express from 'express';
import { logout } from '../controllers/authController';
import { authenticateToken } from '../middleware/authMiddleware'; // Middleware pour authentifier les tokens

const router = express.Router();

// Route pour se déconnecter
router.post('/logout', authenticateToken, logout);

export default router;
```

#### Étape 3: Middleware pour Authentifier les Tokens

Vous avez besoin d'un middleware pour authentifier les tokens et extraire les informations de l'utilisateur du token.

#### middleware/authMiddleware.ts

```typescript
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export const authenticateToken = (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) return res.sendStatus(401);

    jwt.verify(token, process.env.JWT_SECRET || 'default_jwt_secret', (err: any, user: any) => {
        if (err) return res.sendStatus(403);
        req.user = user;
        next();
    });
};
```

### Conclusion

Avec cette configuration, l'utilisateur peut se déconnecter en envoyant une requête à l'endpoint `/logout`. Le token de rafraîchissement sera supprimé de la base de données, empêchant ainsi toute nouvelle génération de tokens d'accès. 

Cela sécurise la déconnexion et garantit que l'utilisateur ne peut pas continuer à utiliser les tokens après s'être déconnecté.