Pour permettre aux utilisateurs de se connecter soit par email soit par numéro de téléphone, nous devons adapter le schéma de la base de données, les contrôleurs d'inscription et de connexion ainsi que les routes associées. Voici comment procéder :

### 1. Mettre à Jour le Schéma Prisma

#### schema.prisma

```prisma
model User {
  id          String   @id @default(uuid())
  email       String?  @unique
  phoneNumber String?  @unique
  password    String
  role        Role     @default(USER)
  isVerified  Boolean  @default(false)
  status      String   @default("inactive")
  isSuperuser Boolean  @default(false)
  logs        Log[]
}

enum Role {
  USER
  ADMIN
  SUPERADMIN
}
```

### 2. Mise à Jour du Contrôleur d'Inscription

#### controllers/authController.ts

```typescript
import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

export const registerUserCtrl = async (req: Request, res: Response, next: NextFunction) => {
  const { email, phoneNumber, password } = req.body;

  try {
    // Vérifiez si l'email ou le numéro de téléphone est déjà utilisé
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email: email || undefined },
          { phoneNumber: phoneNumber || undefined }
        ],
      },
    });

    if (existingUser) {
      return res.status(400).json({ error: 'Email ou numéro de téléphone déjà utilisé.' });
    }

    // Hash le mot de passe
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Créez l'utilisateur
    const newUser = await prisma.user.create({
      data: {
        email: email || undefined,
        phoneNumber: phoneNumber || undefined,
        password: hashedPassword,
        role: 'USER',
        isVerified: false,
        status: 'active',
      },
    });

    res.status(201).json({ message: 'Utilisateur créé avec succès.', user: newUser });
  } catch (err) {
    next(err);
  }
};
```

### 3. Mise à Jour du Contrôleur de Connexion

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

### 4. Mettre à Jour les Routes

#### routes/auth.ts

```typescript
import express from 'express';
import { registerUserCtrl, loginUserCtrl } from '../controllers/authController';

const router = express.Router();

// Route d'inscription
router.post('/register', registerUserCtrl);

// Route de connexion
router.post('/login', loginUserCtrl);

export default router;
```

### 5. Mettre à Jour la Validation des Entrées

Pour vous assurer que les entrées sont correctement validées, vous pouvez utiliser un middleware de validation comme `express-validator`.

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
```

#### routes/auth.ts (Mise à jour)

```typescript
import express from 'express';
import { registerUserCtrl, loginUserCtrl } from '../controllers/authController';
import { validateRegister, validateLogin } from '../middleware/validators';

const router = express.Router();

// Route d'inscription
router.post('/register', validateRegister, registerUserCtrl);

// Route de connexion
router.post('/login', validateLogin, loginUserCtrl);

export default router;
```

Avec ces mises à jour, vous permettez aux utilisateurs de s'inscrire avec un email ou un numéro de téléphone, et de se connecter en utilisant soit l'un soit l'autre. Les validations garantissent que les entrées sont correctement formatées avant de tenter d'interagir avec la base de données.












ancienne version


```javascript
export const userLoginCtrl = async (req: Request, res: Response, next: NextFunction) => {

    // 1. Validation des entrees
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    // 2. recuperation des donnes de la requete
    const {
        email,
        password
    } = req.body;

    try {
        // 3. verifions bien que l'email saisie existe bel et bien
        const user = await prisma.user.findUnique({
            where: {
                email: email
            }
        });
        if (!user) {
            return next(new BadRequestException('Utilisateur existe déjà!', ErrorCodes.USER_ALREADY_EXIST));
        }

        // x. Verifions que l'otp est verifie
        if (!user.isVerified) {
            return next(new BadRequestException('Ce compte n\a pas encore été verifie', ErrorCodes.ACCOUNT_NOT_VERIFY))
        }

        // 4. comparons le mot de passe saisie pour la connexion et celui de la base de donnee
        const validatePassword = await bcrypt.compare(password, user.password);
        if (!validatePassword) {
            return next(new BadRequestException('Mot de passe Incorrect!', ErrorCodes.INCORRECT_EMAIL));

        }

        // 5. Génération des tokens JWT
        const accessToken = generateAccessToken(user);
        const refreshToken = generateRefreshToken(user);

        // Sauvegarder le refresh token dans la base de données
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
                role: user.role,
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


noivelle version 
```javascript

```