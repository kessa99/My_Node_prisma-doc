Je m'excuse pour le manque de clarté. Voici comment vous pouvez utiliser les fonctions `generateAccessToken` et `generateRefreshToken` dans le contexte de votre application :

### Exemple d'utilisation dans votre code existant :

1. **Lors de la création d'un token au moment de l'authentification :**

```typescript
import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import { prisma } from "../prisma"; // Assurez-vous d'importer prisma correctement
import { generateAccessToken, generateRefreshToken } from "../utils/tokenUtils"; // Importez vos fonctions de génération de tokens

// Middleware pour la connexion (login) d'un utilisateur
export const loginUser = async (req: Request, res: Response, next: NextFunction) => {
    const { email, password } = req.body;

    try {
        // Recherche de l'utilisateur par email dans la base de données
        const user = await prisma.user.findUnique({
            where: { email }
        });

        // Vérification si l'utilisateur existe et si le mot de passe est correct
        if (!user || !(await bcrypt.compare(password, user.password))) {
            return res.status(401).json({ message: "Email ou mot de passe incorrect." });
        }

        // Génération d'un access token et d'un refresh token
        const accessToken = generateAccessToken(user.id, user.role);
        const refreshToken = generateRefreshToken(user.id);

        // Sauvegarde du refresh token dans la base de données (optionnel selon votre architecture)
        await prisma.refreshToken.create({
            data: {
                hashedToken: refreshToken,
                userId: user.id
            }
        });

        // Réponse avec les tokens générés
        res.json({
            status: "success",
            data: {
                email: user.email,
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

2. **Middleware pour vérifier le token dans les routes protégées :**

```typescript
import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { prisma } from "../prisma"; // Assurez-vous d'importer prisma correctement
import { ACCESS_TOKEN_SECRET } from "../config"; // Assurez-vous d'importer le secret de votre token

// Middleware pour vérifier le token d'authentification
export const authenticateToken = async (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1];

    if (!token) {
        return res.sendStatus(401);
    }

    // Vérification du token
    jwt.verify(token, ACCESS_TOKEN_SECRET, async (err, decoded) => {
        if (err) {
            return res.sendStatus(403);
        }

        // Récupération de l'utilisateur à partir du token décodé (dans votre cas, vérifiez dans la base de données si nécessaire)
        const userId = (decoded as any).userId;

        // Vous pouvez également ajouter une logique supplémentaire ici pour vérifier si l'utilisateur existe, son rôle, etc.
        // Par exemple, vérifier si l'utilisateur a été révoqué ou si ses permissions ont été modifiées.

        // Ajout des informations de l'utilisateur dans l'objet de la requête pour les routes suivantes
        (req as any).user = decoded;

        next();
    });
};
```

### Explication :

- **Utilisation des fonctions de génération de tokens :** Dans la fonction `loginUser`, nous utilisons `generateAccessToken` et `generateRefreshToken` pour créer des tokens JWT après avoir vérifié les informations d'identification de l'utilisateur.

- **Middleware `authenticateToken` :** Ce middleware est utilisé pour vérifier le token d'authentification dans les routes protégées. Il utilise `jwt.verify` pour décoder et vérifier le token, puis ajoute les informations de l'utilisateur décryptées (`userId` et éventuellement d'autres données comme le rôle) à l'objet de la requête (`req.user`).

Assurez-vous d'adapter ce code à votre architecture et à vos besoins spécifiques, notamment en termes de gestion des erreurs, de stockage des tokens rafraîchis, et de gestion des permissions et des rôles des utilisateurs dans votre système.