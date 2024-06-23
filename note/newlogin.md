Pour vérifier si un numéro de téléphone est associé à un compte email, voir si l'email est vérifié, et gérer la logique de génération de tokens et mise à jour de l'utilisateur, voici une version améliorée du contrôleur `userLoginCtrl` :

1. Vérification de la présence de l'identifiant et du mot de passe.
2. Recherche de l'utilisateur par email ou numéro de téléphone.
3. Gestion de la connexion par numéro de téléphone.
4. Gestion de la connexion par email.

```typescript
import { PrismaClient } from "@prisma/client";
import { Request, Response, NextFunction } from "express";
import bcrypt from "bcrypt";
import { BadRequestException } from "../exceptions/bad-request";
import { ErrorCodes } from "../exceptions/root";
import { generateAccessToken, generateRefreshToken } from "../utils/token-utils";

const prisma = new PrismaClient();

export const userLoginCtrl = async (req: Request, res: Response, next: NextFunction) => {
    const { identify, password } = req.body;

    if (!identify || !password) {
        return next(new BadRequestException('Identifiant et mot de passe sont nécessaires', ErrorCodes.INVALID_INPUT));
    }

    try {
        const user = await prisma.user.findFirst({
            where: {
                OR: [
                    { email: identify },
                    { phoneNumber: identify }
                ],
            },
            include: {
                role: true
            }
        });

        if (!user) {
            return next(new BadRequestException('Cet utilisateur n\'existe pas, veuillez créer un compte!', ErrorCodes.USER_NOT_FOUND));
        }

        const validatePassword = await bcrypt.compare(password, user.password);
        if (!validatePassword) {
            return next(new BadRequestException('Mot de passe incorrect!', ErrorCodes.INCORRECT_PASSWORD));
        }

        // si identify est un numero de telephone, voir si il y a un email associe
        if (identify === user.phoneNumber) {
            console.log('Numéro de téléphone accepté');

            if (!user.email) {
                return next(new BadRequestException('Email non existant, veuillez le saisir pour l\'authentifier', ErrorCodes.EMAIL_REQUIRED));
            }

            console.log('Email associé à ce compte trouvé');

            if (!user.emailVerified) {
                return next(new BadRequestException('Veuillez vérifier votre email pour continuer.', ErrorCodes.EMAIL_NOT_VERIFIED));
            }

            console.log('Email vérifié, les mises à jour et les tokens seront générés');
        }

        // Mise à jour du statut de l'utilisateur
        const updatedUser = await prisma.user.update({
            where: { id: user.id },
            data: {
                status: 'active',
                lastLogin: new Date()
            }
        });

        console.log('Mise à jour et génération de token en cours...');

        const accessToken = generateAccessToken(user);
        const refreshToken = generateRefreshToken(user);

        await prisma.refreshTokens.create({
            data: {
                hashedToken: refreshToken,
                userId: user.id
            }
        });

        res.json({
            status: 'success',
            data: {
                firstname: user.firstname,
                lastname: user.lastname,
                email: user.email,
                phoneNumber: user.phoneNumber,
                role: user.role ? user.role.name : 'Role non trouvé',
                status: updatedUser.status,
                isSuperAdmin: updatedUser.isSuperAdmin,
                isAdmin: updatedUser.isAdmin,
                isBlocked: updatedUser.isBlocked,
                token: {
                    accessToken,
                    refreshToken
                }
            }
        });
    } catch (err) {
        next(err);
    }
};
```

### Explications
1. **Vérification des identifiants** : Vérifie si `identify` et `password` sont fournis.
2. **Recherche de l'utilisateur** : Cherche l'utilisateur par email ou numéro de téléphone.
3. **Validation du mot de passe** : Vérifie si le mot de passe fourni correspond au mot de passe stocké.
4. **Gestion du numéro de téléphone** :
   - Si l'identifiant est un numéro de téléphone, vérifie si un email est associé.
   - Si aucun email n'est associé, demande à l'utilisateur de fournir un email.
   - Vérifie si l'email est vérifié.
5. **Mise à jour de l'utilisateur** : Met à jour le statut de l'utilisateur et enregistre la date de dernière connexion.
6. **Génération des tokens** : Génère un access token et un refresh token pour l'utilisateur.

### Variables d'environnement
Pour gérer les variables d'environnement, créez un fichier `config.ts` et utilisez `dotenv` pour les charger :

```typescript
// config.ts
import dotenv from 'dotenv';

dotenv.config();

export const config = {
    port: process.env.PORT || 3000,
    databaseUrl: process.env.DATABASE_URL || 'mongodb://localhost:27017/mydatabase',
    jwtSecret: process.env.JWT_SECRET || 'your_jwt_secret',
    rateLimitWindowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10), // 15 minutes par défaut
    rateLimitMaxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10) // 100 requêtes par défaut
};
```

Ensuite, utilisez ces configurations dans vos fichiers :

```typescript
// server.ts
import express from 'express';
import { config } from './config';

const app = express();
const PORT = config.port;

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
```

Cela permet de centraliser vos configurations et de les utiliser de manière uniforme dans toute votre application.