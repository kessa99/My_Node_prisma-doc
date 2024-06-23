Pour permettre à un super administrateur de créer un administrateur, vous pouvez implémenter une nouvelle route protégée par une vérification de rôle. Voici comment vous pouvez structurer cette fonctionnalité :

### Étapes Générales

1. **Définir une Route pour Créer un Administrateur** : Créez une nouvelle route où le super administrateur peut soumettre les informations pour créer un nouvel administrateur.
2. **Vérifier les Privilèges du Super Administrateur** : Utilisez un middleware pour vérifier que l'utilisateur qui fait la demande est un super administrateur.
3. **Créer l'Administrateur** : Implémentez la logique pour créer un nouvel utilisateur avec le rôle "admin" dans la base de données.

### 1. Définir la Route

Ajoutez une nouvelle route dans votre application Express :

```typescript
import express from 'express';
import { createAdminCtrl } from './controllers/adminController';
import { authenticate, isSuperAdmin } from './middlewares/auth';

const router = express.Router();

router.post('/create-admin', authenticate, isSuperAdmin, createAdminCtrl);

export default router;
```

### 2. Middlewares pour l'Authentification et la Vérification du Rôle

Créez des middlewares pour authentifier l'utilisateur et vérifier qu'il est un super administrateur :

#### `authenticate.ts`

```typescript
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const authenticate = async (req: Request, res: Response, next: NextFunction) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
        return res.status(401).json({ error: 'Access denied. No token provided.' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'default_jwt_secret');
        req.user = await prisma.user.findUnique({ where: { id: decoded.userId } });
        next();
    } catch (ex) {
        res.status(400).json({ error: 'Invalid token.' });
    }
};
```

#### `isSuperAdmin.ts`

```typescript
import { Request, Response, NextFunction } from 'express';

export const isSuperAdmin = (req: Request, res: Response, next: NextFunction) => {
    if (req.user?.role !== 'superadmin') {
        return res.status(403).json({ error: 'Access denied. You are not a super admin.' });
    }
    next();
};
```

### 3. Contrôleur pour Créer un Administrateur

Implémentez le contrôleur pour traiter la création d'un nouvel administrateur :

#### `adminController.ts`

```typescript
import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcrypt';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const createAdminCtrl = async (req: Request, res: Response, next: NextFunction) => {
    const { email, password, phoneNumber } = req.body;

    try {
        const existingAdmin = await prisma.user.findUnique({ where: { email } });
        if (existingAdmin) {
            return res.status(400).json({ error: 'Admin with this email already exists.' });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const newAdmin = await prisma.user.create({
            data: {
                email,
                password: hashedPassword,
                phoneNumber,
                role: 'admin',
                isVerified: true,
                status: 'active',
                isSuperuser: false,
            },
        });

        res.status(201).json({ message: 'Admin created successfully', data: newAdmin });
    } catch (err) {
        next(err);
    }
};
```

### Configuration de l'Application

Assurez-vous d'inclure votre nouvelle route dans l'application principale Express :

```typescript
import express from 'express';
import adminRoutes from './routes/adminRoutes';

const app = express();

app.use(express.json());
app.use('/api', adminRoutes);

// Middleware de gestion des erreurs
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
    console.error(err.stack);
    if (!res.headersSent) {
        res.status(500).json({ error: 'Internal Server Error' });
    } else {
        next(err);
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
```

### Test de la Route

Pour tester cette nouvelle fonctionnalité :

1. **Connexion en tant que Super Administrateur** : Utilisez un token JWT pour un super administrateur.
2. **Envoi d'une Requête POST** : Utilisez un client HTTP (comme Postman) pour envoyer une requête POST à `/api/create-admin` avec le token d'authentification et les données nécessaires pour créer un nouvel administrateur.

Assurez-vous que les erreurs sont correctement gérées et que les réponses appropriées sont envoyées en fonction du résultat de chaque opération.



























Oui, si vous utilisez un enum pour les rôles dans votre schéma Prisma, vous devez ajouter le rôle "admin" dans cet enum pour pouvoir l'utiliser lors de la création des utilisateurs. Voici comment vous pouvez mettre à jour votre schéma Prisma :

### Mise à Jour du Schéma Prisma

Ouvrez votre fichier `schema.prisma` et modifiez l'enum `Role` pour inclure le rôle "admin".

#### schema.prisma

```prisma
enum Role {
  USER
  ADMIN
  SUPERADMIN
}

model User {
  id          String   @id @default(uuid())
  email       String   @unique
  password    String
  phoneNumber String?
  role        Role     @default(USER)
  isVerified  Boolean  @default(false)
  status      String   @default("inactive")
  isSuperuser Boolean  @default(false)
}
```

### Mise à Jour de la Logique de Création d'Administrateur

Maintenant que le rôle "admin" est défini dans votre enum, la logique de création d'un administrateur devrait fonctionner correctement. Voici un rappel du contrôleur pour créer un administrateur :

#### adminController.ts

```typescript
import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcrypt';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const createAdminCtrl = async (req: Request, res: Response, next: NextFunction) => {
    const { email, password, phoneNumber } = req.body;

    try {
        const existingAdmin = await prisma.user.findUnique({ where: { email } });
        if (existingAdmin) {
            return res.status(400).json({ error: 'Admin with this email already exists.' });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const newAdmin = await prisma.user.create({
            data: {
                email,
                password: hashedPassword,
                phoneNumber,
                role: 'ADMIN', // Utilisation du rôle "admin"
                isVerified: true,
                status: 'active',
                isSuperuser: false,
            },
        });

        res.status(201).json({ message: 'Admin created successfully', data: newAdmin });
    } catch (err) {
        next(err);
    }
};
```

### Mise à Jour du Middleware d'Authentification

Assurez-vous que votre middleware d'authentification et de vérification des rôles utilise correctement les valeurs de l'enum :

#### isSuperAdmin.ts

```typescript
import { Request, Response, NextFunction } from 'express';

export const isSuperAdmin = (req: Request, res: Response, next: NextFunction) => {
    if (req.user?.role !== 'SUPERADMIN') {
        return res.status(403).json({ error: 'Access denied. You are not a super admin.' });
    }
    next();
};
```

### Test de la Nouvelle Fonctionnalité

1. **Connexion en tant que Super Administrateur** : Utilisez un token JWT pour un super administrateur.
2. **Envoi d'une Requête POST** : Utilisez un client HTTP (comme Postman) pour envoyer une requête POST à `/api/create-admin` avec le token d'authentification et les données nécessaires pour créer un nouvel administrateur.

#### Exemple de Requête POST

```json
POST /api/create-admin
Headers: {
  "Authorization": "Bearer <super_admin_token>"
}
Body: {
  "email": "newadmin@example.com",
  "password": "securepassword",
  "phoneNumber": "1234567890"
}
```

### Middleware de Gestion des Erreurs

Assurez-vous d'avoir un middleware de gestion des erreurs pour attraper et gérer les erreurs correctement :

```typescript
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
    console.error(err.stack);
    if (!res.headersSent) {
        res.status(500).json({ error: 'Internal Server Error' });
    } else {
        next(err);
    }
});
```

En suivant ces étapes, vous pourrez permettre à un super administrateur de créer des administrateurs dans votre application, tout en respectant la structure et les règles de votre schéma Prisma.


















































Pour implémenter le suivi des actions du super administrateur, comme la création de nouveaux administrateurs, vous pouvez ajouter une table de logs dans votre base de données. Cette table enregistrera les actions importantes effectuées par les utilisateurs. Voici comment procéder :

### 1. Mettre à Jour le Schéma Prisma

Ajoutez une table de logs dans votre `schema.prisma`.

```prisma
model User {
  id          String   @id @default(uuid())
  email       String   @unique
  password    String
  phoneNumber String?
  role        Role     @default(USER)
  isVerified  Boolean  @default(false)
  status      String   @default("inactive")
  isSuperuser Boolean  @default(false)
  logs        Log[]
}

model Log {
  id        String   @id @default(uuid())
  userId    String
  user      User     @relation(fields: [userId], references: [id])
  action    String
  timestamp DateTime @default(now())
}
```

### 2. Mettre à Jour le Contrôleur pour Créer un Administrateur

Ajoutez la logique pour enregistrer l'action dans les logs après avoir créé un nouvel administrateur.

```typescript
import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcrypt';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const createAdminCtrl = async (req: Request, res: Response, next: NextFunction) => {
    const { email, password, phoneNumber } = req.body;

    try {
        const existingAdmin = await prisma.user.findUnique({ where: { email } });
        if (existingAdmin) {
            return res.status(400).json({ error: 'Admin with this email already exists.' });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const newAdmin = await prisma.user.create({
            data: {
                email,
                password: hashedPassword,
                phoneNumber,
                role: 'ADMIN', // Utilisation du rôle "admin"
                isVerified: true,
                status: 'active',
                isSuperuser: false,
            },
        });

        // Enregistrer l'action dans les logs
        await prisma.log.create({
            data: {
                userId: req.user.id,
                action: `Created a new admin with email ${email}`,
            },
        });

        res.status(201).json({ message: 'Admin created successfully', data: newAdmin });
    } catch (err) {
        next(err);
    }
};
```

### 3. Ajout d'un Middleware pour Remplir `req.user`

Assurez-vous que le middleware d'authentification remplit `req.user` avec les détails de l'utilisateur actuel.

#### authenticate.ts

```typescript
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const authenticate = async (req: Request, res: Response, next: NextFunction) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
        return res.status(401).json({ error: 'Access denied. No token provided.' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'default_jwt_secret');
        req.user = await prisma.user.findUnique({ where: { id: decoded.userId } });
        next();
    } catch (ex) {
        res.status(400).json({ error: 'Invalid token.' });
    }
};
```

### 4. Test de la Nouvelle Fonctionnalité

1. **Connexion en tant que Super Administrateur** : Utilisez un token JWT pour un super administrateur.
2. **Envoi d'une Requête POST** : Utilisez un client HTTP (comme Postman) pour envoyer une requête POST à `/api/create-admin` avec le token d'authentification et les données nécessaires pour créer un nouvel administrateur.

### Exemple de Requête POST

```json
POST /api/create-admin
Headers: {
  "Authorization": "Bearer <super_admin_token>"
}
Body: {
  "email": "newadmin@example.com",
  "password": "securepassword",
  "phoneNumber": "1234567890"
}
```

### 5. Vérification des Logs

Après avoir exécuté ces étapes, vous pouvez vérifier que les actions ont bien été enregistrées dans la table des logs.

```typescript
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const getLogs = async () => {
    const logs = await prisma.log.findMany({
        include: {
            user: true,
        },
    });
    console.log(logs);
};

getLogs();
```

Avec ces modifications, chaque fois qu'un super administrateur crée un nouvel administrateur, l'action sera enregistrée dans les logs, ce qui permettra de suivre les actions importantes et d'assurer une meilleure traçabilité des événements dans votre application.












































Pour permettre à un administrateur de se connecter, vous devez mettre en place un processus d'authentification. Voici comment vous pouvez procéder :

1. **Configurer le schéma Prisma pour les rôles d'utilisateur** (si ce n'est pas déjà fait).
2. **Créer une route et un contrôleur pour la connexion**.
3. **Générer et gérer des tokens JWT pour l'authentification**.
4. **Ajouter un middleware pour protéger les routes nécessitant une authentification**.

### 1. Configurer le Schéma Prisma

Assurez-vous que votre `schema.prisma` contient une définition pour les rôles et les utilisateurs, comme montré précédemment :

```prisma
enum Role {
  USER
  ADMIN
  SUPERADMIN
}

model User {
  id          String   @id @default(uuid())
  email       String   @unique
  password    String
  phoneNumber String?
  role        Role     @default(USER)
  isVerified  Boolean  @default(false)
  status      String   @default("inactive")
  isSuperuser Boolean  @default(false)
}
```

### 2. Créer une Route et un Contrôleur pour la Connexion

Vous pouvez créer une route `/login` et un contrôleur `loginCtrl` pour gérer la connexion des utilisateurs, y compris les administrateurs.

#### routes/auth.ts

```typescript
import express from 'express';
import { loginCtrl } from '../controllers/authController';

const router = express.Router();

router.post('/login', loginCtrl);

export default router;
```

#### controllers/authController.ts

```typescript
import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const loginCtrl = async (req: Request, res: Response, next: NextFunction) => {
    const { email, password } = req.body;

    try {
        const user = await prisma.user.findUnique({
            where: { email }
        });

        if (!user) {
            return res.status(400).json({ error: 'Utilisateur non trouvé' });
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(400).json({ error: 'Mot de passe incorrect' });
        }

        const token = jwt.sign(
            { userId: user.id, role: user.role },
            process.env.JWT_SECRET || 'default_jwt_secret',
            { expiresIn: '1h' }
        );

        res.json({
            status: 'success',
            data: {
                email: user.email,
                token,
            },
        });
    } catch (err) {
        next(err);
    }
};
```

### 3. Générer et Gérer des Tokens JWT pour l'Authentification

Utilisez `jsonwebtoken` pour créer des tokens JWT lors de la connexion.

```typescript
import jwt from 'jsonwebtoken';

const generateAccessToken = (user) => {
    return jwt.sign(
        { userId: user.id, role: user.role },
        process.env.JWT_SECRET || 'default_jwt_secret',
        { expiresIn: '1h' }
    );
};
```

### 4. Ajouter un Middleware pour Protéger les Routes

Créez un middleware pour vérifier l'authenticité des tokens JWT et protéger les routes sensibles.

#### middleware/authenticate.ts

```typescript
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const authenticate = async (req: Request, res: Response, next: NextFunction) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
        return res.status(401).json({ error: 'Accès refusé. Aucun token fourni.' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'default_jwt_secret');
        req.user = await prisma.user.findUnique({ where: { id: decoded.userId } });
        next();
    } catch (ex) {
        res.status(400).json({ error: 'Token invalide.' });
    }
};
```

### 5. Utilisation du Middleware pour Protéger les Routes

Appliquez ce middleware aux routes qui nécessitent une authentification.

#### routes/admin.ts

```typescript
import express from 'express';
import { createAdminCtrl } from '../controllers/adminController';
import { authenticate } from '../middleware/authenticate';

const router = express.Router();

router.post('/create-admin', authenticate, createAdminCtrl);

export default router;
```

### 6. Test de la Connexion

1. **Envoi d'une Requête POST** : Utilisez un client HTTP (comme Postman) pour envoyer une requête POST à `/login` avec les informations d'identification de l'utilisateur.

#### Exemple de Requête POST

```json
POST /login
Body: {
  "email": "admin@example.com",
  "password": "securepassword"
}
```

2. **Utilisation du Token JWT** : Utilisez le token JWT obtenu pour accéder aux routes protégées.

Avec ces étapes, vous aurez mis en place un système où un administrateur peut se connecter, obtenir un token JWT et utiliser ce token pour accéder aux routes protégées.



































































