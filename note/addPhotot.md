Pour permettre à un utilisateur de mettre à jour sa photo de profil dans votre application, voici comment vous pouvez procéder :

### 1. Modification du Schéma de la Base de Données

Assurez-vous que votre schéma de base de données a une manière de stocker l'URL ou la référence de la photo de profil de l'utilisateur. Habituellement, cela peut être fait en ajoutant un champ `profileImage` ou similaire dans le modèle utilisateur.

#### Exemple de Schéma Prisma (schema.prisma)

Voici un exemple simple de modification de votre modèle utilisateur pour inclure un champ `profileImage` :

```prisma
model User {
  id          Int      @id @default(autoincrement())
  email       String   @unique
  password    String
  phoneNumber String?
  profileImage String? // Champ pour stocker l'URL de la photo de profil
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}
```

### 2. Mise à Jour du Contrôleur de Mise à Jour de la Photo de Profil

Ajoutez un contrôleur qui permet à l'utilisateur de mettre à jour sa photo de profil. Habituellement, cela se ferait via une requête PATCH à une route spécifique.

#### controllers/userController.ts

```typescript
import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const updateProfileImage = async (req: Request, res: Response, next: NextFunction) => {
    const userId = req.user.id; // Récupérer l'ID de l'utilisateur à partir du token ou de la session

    try {
        const { profileImageUrl } = req.body;

        // Mettre à jour la photo de profil de l'utilisateur
        const updatedUser = await prisma.user.update({
            where: { id: userId },
            data: {
                profileImage: profileImageUrl
            }
        });

        res.json({
            status: 'success',
            message: 'Photo de profil mise à jour avec succès.',
            data: updatedUser
        });
    } catch (err) {
        next(err);
    }
};
```

### 3. Route pour Mettre à Jour la Photo de Profil

Ajoutez une route dans votre fichier de routes pour gérer la mise à jour de la photo de profil.

#### routes/userRoutes.ts

```typescript
import express from 'express';
import { updateProfileImage } from '../controllers/userController';
import { authenticateToken } from '../middleware/authMiddleware'; // Middleware pour authentifier les tokens

const router = express.Router();

// Route pour mettre à jour la photo de profil
router.patch('/profile/image', authenticateToken, updateProfileImage);

export default router;
```

### 4. Middleware pour Authentifier les Tokens

Assurez-vous d'avoir un middleware qui extrait et vérifie le token d'authentification de l'utilisateur à partir de la requête. Cela garantit que seuls les utilisateurs authentifiés peuvent mettre à jour leur photo de profil.

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

### 5. Frontend

Dans votre frontend, assurez-vous que l'interface utilisateur permet à l'utilisateur de télécharger ou de sélectionner une nouvelle photo de profil, et d'envoyer cette URL à votre backend pour la mise à jour.

### Conclusion

En suivant ces étapes, vous permettez aux utilisateurs de votre application de mettre à jour leur photo de profil de manière sécurisée et robuste. Assurez-vous toujours de gérer correctement les autorisations et les validations côté serveur pour éviter toute manipulation indésirable des données de profil.