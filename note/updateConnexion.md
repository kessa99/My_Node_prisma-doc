Pour migrer une base de données SQL vers une base de données NoSQL tout en permettant aux utilisateurs de se connecter soit par email soit par numéro de téléphone, vous devez adopter une approche progressive et sécurisée. Voici un plan pour y parvenir :

### 1. Migration des Données

- **Exporter les données de l'ancienne base SQL vers la nouvelle base NoSQL**. Utilisez des scripts ou des outils ETL (Extract, Transform, Load) pour cette migration.
- **Mettre à jour le schéma NoSQL** pour inclure à la fois les emails et les numéros de téléphone des utilisateurs.

### 2. Mise à Jour des Contrôleurs de Connexion et d'Inscription

#### Schéma de la Base de Données NoSQL

Assurez-vous que votre schéma NoSQL (par exemple, MongoDB) ressemble à ceci :

```javascript
{
  "_id": ObjectId,
  "email": String,
  "phoneNumber": String,
  "password": String,
  "role": String,
  "isVerified": Boolean,
  "status": String,
  "isSuperuser": Boolean
}
```

### 3. Contrôleur de Connexion

Mettons à jour le contrôleur de connexion pour permettre la connexion par email ou numéro de téléphone.

#### controllers/authController.ts

```typescript
import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { generateAccessToken, generateRefreshToken } from '../utils/jwt'; // Assumez que vous avez ces utilitaires

const prisma = new PrismaClient();

export const loginUserCtrl = async (req: Request, res: Response, next: NextFunction) => {
  const { identifier, password } = req.body; // "identifier" peut être un email ou un numéro de téléphone

  try {
    // Rechercher l'utilisateur par email ou numéro de téléphone
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: identifier },
          { phoneNumber: identifier }
        ],
      },
    });

    if (!user) {
      return res.status(400).json({ error: 'Utilisateur non trouvé.' });
    }

    // Vérifier le mot de passe
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(400).json({ error: 'Mot de passe incorrect.' });
    }

    // Générer les tokens d'accès et de rafraîchissement
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    res.json({
      status: 'success',
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

### 4. Contrôleur de Mise à Jour du Profil

Ajoutez une route pour permettre aux utilisateurs de mettre à jour leur profil, y compris l'ajout ou la modification de leur email.

#### controllers/userController.ts

```typescript
import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const updateUserProfileCtrl = async (req: Request, res: Response, next: NextFunction) => {
  const userId = req.user.id; // Assumez que l'ID utilisateur est stocké dans le jeton JWT
  const { email, phoneNumber } = req.body;

  try {
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        email: email || undefined,
        phoneNumber: phoneNumber || undefined
      }
    });

    res.json({
      status: 'success',
      data: updatedUser
    });
  } catch (err) {
    next(err);
  }
};
```

### 5. Routes

Ajoutez les routes nécessaires pour la connexion et la mise à jour du profil utilisateur.

#### routes/auth.ts

```typescript
import express from 'express';
import { loginUserCtrl } from '../controllers/authController';
import { validateLogin } from '../middleware/validators';

const router = express.Router();

// Route de connexion
router.post('/login', validateLogin, loginUserCtrl);

export default router;
```

#### routes/user.ts

```typescript
import express from 'express';
import { updateUserProfileCtrl } from '../controllers/userController';
import { validateUpdateProfile } from '../middleware/validators'; // Assumez que vous avez ce validateur
import { authMiddleware } from '../middleware/authMiddleware'; // Assumez que vous avez ce middleware d'authentification

const router = express.Router();

// Route de mise à jour du profil
router.put('/profile', authMiddleware, validateUpdateProfile, updateUserProfileCtrl);

export default router;
```

### 6. Validation des Entrées

Mettez à jour les validateurs pour inclure les nouvelles routes.

#### middleware/validators.ts

```typescript
import { body, validationResult } from 'express-validator';

export const validateRegister = [
  body('email').optional().isEmail().withMessage('Email invalide.'),
  body('phoneNumber').optional().isMobilePhone().withMessage('Numéro de téléphone invalide.'),
  body('password').isLength({ min: 6 }).withMessage('Le mot de passe doit contenir au moins 6 caractères.'),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  }
];

export const validateLogin = [
  body('identifier').notEmpty().withMessage('Email ou numéro de téléphone requis.'),
  body('password').notEmpty().withMessage('Mot de passe requis.'),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  }
];

export const validateUpdateProfile = [
  body('email').optional().isEmail().withMessage('Email invalide.'),
  body('phoneNumber').optional().isMobilePhone().withMessage('Numéro de téléphone invalide.'),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  }
];
```

### 7. Authentification Middleware

Assurez-vous que l'utilisateur est authentifié avant de lui permettre de mettre à jour son profil.

#### middleware/authMiddleware.ts

```typescript
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const authMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  const token = req.headers['authorization']?.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Accès refusé. Aucun token fourni.' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'default_jwt_secret');
    req.user = await prisma.user.findUnique({
      where: { id: decoded.userId },
    });

    if (!req.user) {
      return res.status(401).json({ error: 'Utilisateur non trouvé.' });
    }

    next();
  } catch (err) {
    res.status(400).json({ error: 'Token invalide.' });
  }
};
```

Avec cette mise en place, vous pouvez migrer votre base de données, permettre la connexion par email ou numéro de téléphone, et permettre aux utilisateurs de mettre à jour leurs informations de profil. Assurez-vous de bien tester toutes les routes et les fonctionnalités pour garantir une transition en douceur.