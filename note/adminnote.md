K K, [13/06/2024 16:18]
Pour créer un super admin avec un champ de rôle et un indicateur isSuperAdmin, nous allons ajouter un champ role au modèle utilisateur dans Prisma. Ensuite, nous allons mettre à jour la route et le contrôleur pour créer le super admin avec ces champs.

### Étape 1: Modifier le modèle utilisateur dans Prisma

Ajoutez les champs role et isSuperAdmin à votre modèle utilisateur dans schema.prisma :

model User {
  id                String   @id @default(auto()) @map("_id") @db.ObjectId
  email             String   @unique
  password          String
  role              String
  isSuperAdmin      Boolean  @default(false)
  resetToken        String?  @unique
  resetTokenExpiry  DateTime?
}
N'oubliez pas de régénérer le client Prisma après avoir modifié le schéma :

npx prisma generate
### Étape 2: Créer une route pour générer le super admin

Dans votre fichier src/routes/userRoutes.ts, ajoutez une nouvelle route pour créer le super admin :

router.post('/create-super-admin', createSuperAdmin);
### Étape 3: Implémenter le contrôleur pour créer le super admin

Créez une fonction createSuperAdmin dans votre fichier src/controllers/userController.ts :

`typescript
import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../prisma';
import nodemailer from 'nodemailer';
import crypto from 'crypto';
import dotenv from 'dotenv';

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || 'default_jwt_secret';

const transporter = nodemailer.createTransport({
  service: 'Gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

export const register = async (req: Request, res: Response) => {
  const { email, password } = req.body;
  const hashedPassword = await bcrypt.hash(password, 10);
  try {
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        role: 'user', // default role
        isSuperAdmin: false,
      },
    });
    res.status(201).json({ user });
  } catch (error) {
    res.status(400).json({ error: 'User already exists' });
  }
};

export const login = async (req: Request, res: Response) => {
  const { email, password } = req.body;
  const user = await prisma.user.findUnique({ where: { email } });

  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  const isValid = await bcrypt.compare(password, user.password);
  if (!isValid) {
    return res.status(401).json({ error: 'Invalid password' });
  }

  const token = jwt.sign({ userId: user.id, role: user.role, isSuperAdmin: user.isSuperAdmin }, JWT_SECRET, { expiresIn: '1h' });
  res.json({ token });
};

export const requestPasswordReset = async (req: Request, res: Response) => {
  const { email } = req.body;
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }
  const resetToken = crypto.randomBytes(32).toString('hex');
  const resetTokenExpiry = new Date(Date.now() + 3600000); // 1 hour from now

  await prisma.user.update({
    where: { email },
    data: {
      resetToken,
      resetTokenExpiry,
    },
  });

  const resetURL = `http://localhost:3000/reset-password?token=${resetToken}`;

  await transporter.sendMail({
    to: email,
    subject: 'Password Reset',
    html: `You requested a password reset. Click <a href="${resetURL}">here</a> to reset your password.`,
  });

  res.json({ message: 'Password reset link sent' });
};

export const resetPassword = async (req: Request, res: Response) => {
  const { token, newPassword } = req.body;
  const user = await prisma.user.findUnique({ where: { resetToken: token } });
  if (!user || user.resetTokenExpiry! < new Date()) {

K K, [13/06/2024 16:18]
return res.status(400).json({ error: 'Token is invalid or has expired' });
  }
  const hashedPassword = await bcrypt.hash(newPassword, 10);
  await prisma.user.update({
    where: { resetToken: token },
    data: {
      password: hashedPassword,
      resetToken: null,
      resetTokenExpiry: null,
    },
  });
  res.json({ message: 'Password has been reset' });
};

export const createSuperAdmin = async (req: Request, res: Response) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  try {
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        role: 'superadmin', // role for super admin
        isSuperAdmin: true,
      },
    });
    res.status(201).json({ user });
  } catch (error) {
    res.status(400).json({ error: 'Error creating super admin' });
  }
};

### Étape 4: Protéger la route de création de super admin

Pour des raisons de sécurité, vous devriez restreindre l'accès à la route de création de super admin afin que seuls les utilisateurs autorisés puissent y accéder. Voici un exemple de middleware simple pour vérifier un secret d'administration :

typescript
import { Request, Response, NextFunction } from 'express';

const ADMIN_SECRET = process.env.ADMIN_SECRET || 'default_admin_secret';

export const adminAuth = (req: Request, res: Response, next: NextFunction) => {
  const adminSecret = req.headers['x-admin-secret'];

  if (!adminSecret || adminSecret !== ADMIN_SECRET) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  next();
};

Appliquez ce middleware à la route de création de super admin :

typescript
import { Router } from 'express';
import { register, login, requestPasswordReset, resetPassword, createSuperAdmin } from '../controllers/userController';
import { adminAuth } from '../middleware/adminAuth';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.post('/request-password-reset', requestPasswordReset);
router.post('/reset-password', resetPassword);
router.post('/create-super-admin', adminAuth, createSuperAdmin);

export default router;

Ensuite, ajoutez la variable `ADMIN_SECRET` dans votre fichier `.env` :

env
ADMIN_SECRET="your_admin_secret"
`

### Conclusion

Avec ces modifications, vous avez maintenant une route sécurisée pour créer un super admin en définissant son rôle et son statut de super admin. Le super admin peut ensuite se connecter en utilisant la route de connexion standard, et son token JWT inclura les informations nécessaires pour différencier un super admin d'un utilisateur normal.






Oui, le login du super admin est pris en compte dans la configuration que nous avons définie. La logique de login que nous avons implémentée dans la fonction login permet à la fois aux utilisateurs normaux et aux super admins de se connecter.

Voici un rappel de la fonction login mise à jour pour gérer les super admins :

### Fonction login mise à jour

export const login = async (req: Request, res: Response) => {
  const { email, password } = req.body;
  const user = await prisma.user.findUnique({ where: { email } });

  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  const isValid = await bcrypt.compare(password, user.password);
  if (!isValid) {
    return res.status(401).json({ error: 'Invalid password' });
  }

  const token = jwt.sign({ userId: user.id, isSuperAdmin: user.isSuperAdmin }, process.env.JWT_SECRET || 'default_jwt_secret', { expiresIn: '1h' });
  res.json({ token });
};
### Explication

1. Recherche de l'utilisateur : La fonction recherche l'utilisateur dans la base de données en utilisant l'email fourni.
2. Vérification de l'existence de l'utilisateur : Si l'utilisateur n'est pas trouvé, une réponse d'erreur est renvoyée.
3. Vérification du mot de passe : Le mot de passe fourni est comparé avec le mot de passe haché stocké dans la base de données.
4. Génération du token JWT : Si le mot de passe est valide, un token JWT est généré. Le token inclut le userId et un champ isSuperAdmin pour indiquer si l'utilisateur est un super admin.

### Utilisation de la fonction login

Pour connecter un super admin, vous pouvez utiliser la même route de connexion que pour un utilisateur normal. Voici comment tester la connexion d'un super admin :

1. Connexion du super admin : POST /api/users/login

   
    {
      "email": "superadmin@example.com",
      "password": "superadminpassword"
    }
    
Si l'email et le mot de passe sont corrects, la réponse contiendra un token JWT. Ce token inclut l'information indiquant si l'utilisateur est un super admin, ce qui peut être utilisé pour autoriser l'accès à des routes ou des fonctionnalités spécifiques aux super admins dans votre application.

### Exemple de réponse pour un super admin

{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIxMjM0NTY3ODkwIiwiaXNTdXBlckFkbWluIjp0cnVlLCJpYXQiOjE1MTYyMzkwMjJ9.4Nf2wKv5v6y3nDmgvw4Nz6Dsz9xQ3z2DBXvz3Q4YomU"
}
Ce token peut ensuite être utilisé pour accéder à des routes protégées dans votre application. Vous pouvez vérifier le champ isSuperAdmin dans les middlewares d'autorisation pour garantir que seuls les super admins peuvent accéder à certaines fonctionnalités.

### Conclusion

En résumé, le processus de connexion prend en compte à la fois les utilisateurs normaux et les super admins. La principale différence est que les super admins ont un champ supplémentaire isSuperAdmin dans leur token JWT, ce qui peut être utilisé pour des contrôles d'accès supplémentaires dans votre application.































Pour créer un super admin sans passer par le processus d'inscription, vous pouvez suivre ces étapes :

1. **Ajouter un champ isSuperAdmin à votre modèle utilisateur dans Prisma.**Créer une route sécurisée pour générer le super admin.n.**Configurer un login spécial pour le super admin.n.**

Voici un guide détaillé pour chaque étape :

### Étape 1: Modifier le modèle utilisateur pour inclure un champ isSuperAdmin

Modifiez votre schema.prisma pour ajouter un champ isSuperAdmin :

model User {
  id                String   @id @default(auto()) @map("_id") @db.ObjectId
  email             String   @unique
  password          String
  resetToken        String?  @unique
  resetTokenExpiry  DateTime?
  isSuperAdmin      Boolean  @default(false)
}
N'oubliez pas de régénérer le client Prisma après avoir modifié le schéma :

npx prisma generate
### Étape 2: Créer une route pour générer le super admin

Dans votre fichier src/routes/userRoutes.ts, ajoutez une nouvelle route pour créer le super admin :

router.post('/create-super-admin', createSuperAdmin);
### Étape 3: Implémenter le contrôleur pour créer le super admin

Créez une fonction createSuperAdmin dans votre fichier src/controllers/userController.ts :

export const createSuperAdmin = async (req: Request, res: Response) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  try {
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        isSuperAdmin: true,
      },
    });
    res.status(201).json({ user });
  } catch (error) {
    res.status(400).json({ error: 'Error creating super admin' });
  }
};
Pour des raisons de sécurité, cette route devrait être sécurisée et accessible uniquement par des administrateurs autorisés. Pour simplifier, cet exemple n'inclut pas les mesures de sécurité supplémentaires, mais il est crucial de les ajouter dans une application réelle.

### Étape 4: Modifier la logique de login pour les super admins

Mettez à jour votre fonction login pour gérer les super admins dans src/controllers/userController.ts :

export const login = async (req: Request, res: Response) => {
  const { email, password } = req.body;
  const user = await prisma.user.findUnique({ where: { email } });

  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  const isValid = await bcrypt.compare(password, user.password);
  if (!isValid) {
    return res.status(401).json({ error: 'Invalid password' });
  }

  if (user.isSuperAdmin) {
    const token = jwt.sign({ userId: user.id, isSuperAdmin: true }, JWT_SECRET, { expiresIn: '1h' });
    return res.json({ token, message: 'Super admin logged in' });
  }

  const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '1h' });
  res.json({ token });
};
### Étape 5: Tester les modifications
Créer le super admin:n:** POST /api/users/create-super-admin
   
    {
      "email": "superadmin@example.com",
      "password": "superadminpassword"
    }
    
Connexion du super admin:n:** POST /api/users/login
   
    {
      "email": "superadmin@example.com",
      "password": "superadminpassword"
    }
    
Cette configuration permet de créer et de gérer un super admin sans passer par le processus d'inscription normal. N'oubliez pas d'ajouter des mesures de sécurité pour protéger la route de création du super admin.

































































K K, [13/06/2024 14:46]
Créer un système de réinitialisation de mot de passe avec Node.js, Prisma, MongoDB et TypeScript implique plusieurs étapes, notamment la mise en place du serveur, la gestion des utilisateurs et l'implémentation du flux de réinitialisation de mot de passe. Voici un guide détaillé avec des explications pour chaque étape.

### Étape 1: Initialiser le projet

1. Créer un nouveau projet Node.js
   
    mkdir password-reset
    cd password-reset
    npm init -y
    
2. Installer les dépendances nécessaires
   
    npm install express prisma @prisma/client bcryptjs jsonwebtoken nodemailer
    npm install -D typescript ts-node @types/node @types/express @types/bcryptjs @types/jsonwebtoken @types/nodemailer
    
3. Initialiser TypeScript
   
    npx tsc --init
    
### Étape 2: Configurer Prisma et MongoDB

1. Initialiser Prisma
   
    npx prisma init
    
2. Configurer Prisma pour utiliser MongoDB

    Dans prisma/schema.prisma, configurez la source de données:
   
    datasource db {
      provider = "mongodb"
      url      = env("DATABASE_URL")
    }

    generator client {
      provider = "prisma-client-js"
    }

    model User {
      id                String   @id @default(auto()) @map("_id") @db.ObjectId
      email             String   @unique
      password          String
      resetToken        String?  @unique
      resetTokenExpiry  DateTime?
    }
    
3. **Configurer la base de données dans .env**
   
    DATABASE_URL="mongodb+srv://<username>:<password>@cluster0.mongodb.net/myDatabase?retryWrites=true&w=majority"
    Générer le client Prismama**
   
    npx prisma generate
    
### Étape 3: Mettre en place le serveur Express
Créer la structure du projetet**
   
    src/
      ├── index.ts
      ├── prisma.ts
      ├── routes/
      └── controllers/
    
2. **Configurer Prisma et Express dans src/index.ts**
   
    import express from 'express';
    import { PrismaClient } from '@prisma/client';

    const app = express();
    const prisma = new PrismaClient();

    app.use(express.json());

    // Routes
    import userRoutes from './routes/userRoutes';
    app.use('/api/users', userRoutes);

    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
    
3. **Prisma Client dans src/prisma.ts**
   
    import { PrismaClient } from '@prisma/client';
    const prisma = new PrismaClient();
    export default prisma;
    
### Étape 4: Créer les routes et contrôleurs

1. **Définir les routes utilisateur dans src/routes/userRoutes.ts**
   
    import { Router } from 'express';
    import { register, login, requestPasswordReset, resetPassword } from '../controllers/userController';

    const router = Router();

    router.post('/register', register);
    router.post('/login', login);
    router.post('/request-password-reset', requestPasswordReset);
    router.post('/reset-password', resetPassword);

    export default router;
    
2. **Implémenter les contrôleurs dans src/controllers/userController.ts**

    `typescript
    import { Request, Response } from 'express';
    import bcrypt from 'bcryptjs';
    import jwt from 'jsonwebtoken';
    import prisma from '../prisma';
    import nodemailer from 'nodemailer';
    import crypto from 'crypto';

    const JWT_SECRET = 'your_jwt_secret';
    const transporter = nodemailer.createTransport({
      service: 'Gmail',
      auth: {
        user: 'your_email@gmail.com',
        pass: 'your_email_password',
      },
    });

    export const register = async (req: Request, res: Response) => {
      const { email, password } = req.body;

K K, [13/06/2024 14:46]
const hashedPassword = await bcrypt.hash(password, 10);
      try {
        const user = await prisma.user.create({
          data: {
            email,
            password: hashedPassword,
          },
        });
        res.status(201).json({ user });
      } catch (error) {
        res.status(400).json({ error: 'User already exists' });
      }
    };

    export const login = async (req: Request, res: Response) => {
      const { email, password } = req.body;
      const user = await prisma.user.findUnique({ where: { email } });
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
      const isValid = await bcrypt.compare(password, user.password);
      if (!isValid) {
        return res.status(401).json({ error: 'Invalid password' });
      }
      const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '1h' });
      res.json({ token });
    };

    export const requestPasswordReset = async (req: Request, res: Response) => {
      const { email } = req.body;
      const user = await prisma.user.findUnique({ where: { email } });
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
      const resetToken = crypto.randomBytes(32).toString('hex');
      const resetTokenExpiry = new Date(Date.now() + 3600000); // 1 hour from now

      await prisma.user.update({
        where: { email },
        data: {
          resetToken,
          resetTokenExpiry,
        },
      });

      const resetURL = http://localhost:3000/reset-password?token=${resetToken};

      await transporter.sendMail({
        to: email,
        subject: 'Password Reset',
        html: You requested a password reset. Click <a href="${resetURL}">here</a> to reset your password.,
      });

      res.json({ message: 'Password reset link sent' });
    };

    export const resetPassword = async (req: Request, res: Response) => {
      const { token, newPassword } = req.body;
      const user = await prisma.user.findUnique({ where: { resetToken: token } });
      if (!user || user.resetTokenExpiry! < new Date()) {
        return res.status(400).json({ error: 'Token is invalid or has expired' });
      }
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      await prisma.user.update({
        where: { resetToken: token },
        data: {
          password: hashedPassword,
          resetToken: null,
          resetTokenExpiry: null,
        },
      });
      res.json({ message: 'Password has been reset' });
    };
   

### Étape 5: Exécuter et tester

1. **Lancer le serveur**
    
bash
    npx ts-node src/index.ts
   

2. **Tester les endpoints**

    - **Inscription:** POST `/api/users/register`
      
json
      {
        "email": "user@example.com",
        "password": "password123"
      }
     

    - **Connexion:** POST `/api/users/login`
      
json
      {
        "email": "user@example.com",
        "password": "password123"
      }
     

    - **Demande de réinitialisation de mot de passe:** POST `/api/users/request-password-reset`
      
json
      {
        "email": "user@example.com"
      }
     

    - **Réinitialisation de mot de passe:** POST `/api/users/reset-password`
      
json
      {
        "token": "reset_token_from_email",
        "newPassword": "new_password123"
      }
      `

Ce guide couvre les bases pour mettre en place un système de réinitialisation de mot de passe avec Node.js, Prisma, MongoDB et TypeScript. Vous pouvez étendre et personnaliser cette implémentation selon vos besoins spécifiques.


K K, [13/06/2024 15:26]
Oui, il est nécessaire de configurer certaines informations sensibles dans le fichier .env pour sécuriser votre application. Ces informations incluent des secrets tels que les détails de connexion à la base de données, le secret JWT, et les informations d'authentification pour le service de messagerie. Voici un guide sur la manière de configurer et d'utiliser le fichier .env :

### Étape 1: Créer le fichier .env

Créez un fichier .env à la racine de votre projet et ajoutez-y les configurations suivantes :

DATABASE_URL="mongodb+srv://<username>:<password>@cluster0.mongodb.net/myDatabase?retryWrites=true&w=majority"
JWT_SECRET="your_jwt_secret"
EMAIL_USER="your_email@gmail.com"
EMAIL_PASS="your_email_password"
### Étape 2: Charger les variables d'environnement dans votre application

Installez le package dotenv pour charger les variables d'environnement à partir du fichier .env :

npm install dotenv
Ensuite, configurez votre application pour utiliser ces variables. Ajoutez le code suivant au début de votre fichier src/index.ts :

import dotenv from 'dotenv';
dotenv.config();
### Étape 3: Utiliser les variables d'environnement dans votre code

Modifiez les parties de votre code qui nécessitent des informations sensibles pour utiliser les variables d'environnement.

1. **Configuration de la base de données dans prisma/schema.prisma :**

   
    datasource db {
      provider = "mongodb"
      url      = env("DATABASE_URL")
    }

    generator client {
      provider = "prisma-client-js"
    }
    
2. **Utiliser le secret JWT dans src/controllers/userController.ts :**

   
    const JWT_SECRET = process.env.JWT_SECRET || 'default_jwt_secret';
    
3. **Configurer Nodemailer avec les variables d'environnement dans src/controllers/userController.ts :**

   
    const transporter = nodemailer.createTransport({
      service: 'Gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });
    
### Code complet avec les variables d'environnement

Voici la version mise à jour du fichier src/controllers/userController.ts :

`typescript
import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../prisma';
import nodemailer from 'nodemailer';
import crypto from 'crypto';
import dotenv from 'dotenv';

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || 'default_jwt_secret';

const transporter = nodemailer.createTransport({
  service: 'Gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

export const register = async (req: Request, res: Response) => {
  const { email, password } = req.body;
  const hashedPassword = await bcrypt.hash(password, 10);
  try {
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
      },
    });
    res.status(201).json({ user });
  } catch (error) {
    res.status(400).json({ error: 'User already exists' });
  }
};

export const login = async (req: Request, res: Response) => {
  const { email, password } = req.body;
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }
  const isValid = await bcrypt.compare(password, user.password);
  if (!isValid) {
    return res.status(401).json({ error: 'Invalid password' });
  }
  const token = jwt.sign({ userId: user.id, isSuperAdmin: user.isSuperAdmin }, JWT_SECRET, { expiresIn: '1h' });
  res.json({ token });
};

export const requestPasswordReset = async (req: Request, res: Response) => {
  const { email } = req.body;
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }
  const resetToken = crypto.randomBytes(32).toString('hex');
  const resetTokenExpiry = new Date(Date.now() + 3600000); // 1 hour from now

K K, [13/06/2024 15:26]
await prisma.user.update({
    where: { email },
    data: {
      resetToken,
      resetTokenExpiry,
    },
  });

  const resetURL = http://localhost:3000/reset-password?token=${resetToken};

  await transporter.sendMail({
    to: email,
    subject: 'Password Reset',
    html: You requested a password reset. Click <a href="${resetURL}">here</a> to reset your password.,
  });

  res.json({ message: 'Password reset link sent' });
};

export const resetPassword = async (req: Request, res: Response) => {
  const { token, newPassword } = req.body;
  const user = await prisma.user.findUnique({ where: { resetToken: token } });
  if (!user || user.resetTokenExpiry! < new Date()) {
    return res.status(400).json({ error: 'Token is invalid or has expired' });
  }
  const hashedPassword = await bcrypt.hash(newPassword, 10);
  await prisma.user.update({
    where: { resetToken: token },
    data: {
      password: hashedPassword,
      resetToken: null,
      resetTokenExpiry: null,
    },
  });
  res.json({ message: 'Password has been reset' });
};

export const createSuperAdmin = async (req: Request, res: Response) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  try {
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        isSuperAdmin: true,
      },
    });
    res.status(201).json({ user });
  } catch (error) {
    res.status(400).json({ error: 'Error creating super admin' });
  }
};

### Étape 6: Protéger la route de création de super admin

Pour des raisons de sécurité, vous devriez restreindre l'accès à la route de création de super admin afin que seuls les utilisateurs autorisés puissent y accéder. Voici un exemple de middleware simple pour vérifier un secret d'administration :

typescript
import { Request, Response, NextFunction } from 'express';

const ADMIN_SECRET = process.env.ADMIN_SECRET || 'default_admin_secret';

export const adminAuth = (req: Request, res: Response, next: NextFunction) => {
  const adminSecret = req.headers['x-admin-secret'];

  if (!adminSecret || adminSecret !== ADMIN_SECRET) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  next();
};

Appliquez ce middleware à la route de création de super admin :

typescript
import { Router } from 'express';
import { register, login, requestPasswordReset, resetPassword, createSuperAdmin } from '../controllers/userController';
import { adminAuth } from '../middleware/adminAuth';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.post('/request-password-reset', requestPasswordReset);
router.post('/reset-password', resetPassword);
router.post('/create-super-admin', adminAuth, createSuperAdmin);

export default router;

Ensuite, ajoutez la variable `ADMIN_SECRET` dans votre fichier `.env` :

env
ADMIN_SECRET="your_admin_secret"
`

Avec cette configuration, seuls les utilisateurs qui fournissent le bon secret d'administration dans les en-têtes de leur requête pourront créer un super admin.

K K, [13/06/2024 15:28]
login admin

K K, [13/06/2024 15:28]
































##############################################3












Pour permettre à un super administrateur de créer un administrateur, nous devons ajouter quelques fonctionnalités spécifiques :

1. Vérifier si l'utilisateur est un super administrateur.
2. Permettre au super administrateur de créer un nouvel administrateur.

### Modèle de l'utilisateur avec rôles

Assurez-vous que votre modèle d'utilisateur supporte les rôles. Nous allons utiliser un champ `role` pour définir si un utilisateur est un super administrateur ou un administrateur.

#### `schema.prisma`

```prisma
model User {
  id              String   @id @default(uuid())
  firstname       String
  lastname        String
  email           String   @unique
  phoneNumber     String   @unique
  password        String
  role            String   @default("user") // 'user', 'admin', 'super-admin'
  passwordResets  PasswordReset[]
  otpVerifications UserOtpVerification[]
}
```

### Middleware pour vérifier si l'utilisateur est un super administrateur

Nous allons créer un middleware qui vérifiera si l'utilisateur est un super administrateur.

#### `middlewares/isSuperAdmin.ts`

```typescript
import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const isSuperAdmin = async (req: Request, res: Response, next: NextFunction) => {
  const userId = (req as any).userAuth; // Assurez-vous que userAuth est défini dans votre middleware d'authentification
  const user = await prisma.user.findUnique({ where: { id: userId } });

  if (!user || user.role !== 'super-admin') {
    return res.status(403).json({ message: 'Accès refusé. Super administrateur uniquement.' });
  }

  next();
};
```

### Contrôleur pour créer un administrateur

Ensuite, nous allons créer un contrôleur pour que le super administrateur puisse créer un nouvel administrateur.

#### `controllers/adminController.ts`

```typescript
import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import { BadRequestException } from '../exceptions/root';
import { ErrorCodes } from '../exceptions/root';

const prisma = new PrismaClient();

export const createAdmin = async (req: Request, res: Response, next: NextFunction) => {
  const { firstname, lastname, email, phoneNumber, password } = req.body;

  try {
    // Vérifier si l'email existe déjà
    const emailFound = await prisma.user.findUnique({ where: { email } });
    if (emailFound) {
      return next(new BadRequestException('Email déjà utilisé', ErrorCodes.USER_ALREADY_EXIST));
    }

    // Vérifier si le numéro de téléphone existe déjà
    const phoneNumberFound = await prisma.user.findUnique({ where: { phoneNumber } });
    if (phoneNumberFound) {
      return next(new BadRequestException('Numéro de téléphone déjà utilisé', ErrorCodes.PHONE_NUMBER_ALREADY_EXISTS));
    }

    // Cryptage du mot de passe
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Créer un nouvel administrateur
    const newAdmin = await prisma.user.create({
      data: {
        firstname,
        lastname,
        email,
        phoneNumber,
        password: hashedPassword,
        role: 'admin',
      },
    });

    res.status(201).json({ message: 'Administrateur créé avec succès', data: newAdmin });
  } catch (error) {
    next(error);
  }
};
```

### Routes pour les super administrateurs

Ensuite, nous allons créer des routes pour que le super administrateur puisse créer un nouvel administrateur.

#### `routes/superAdminRoutes.ts`

```typescript
import { Router } from 'express';
import { createAdmin } from '../controllers/adminController';
import { isSuperAdmin } from '../middlewares/isSuperAdmin';
import { isAuthenticated } from '../middlewares/isAuthenticated'; // Middleware d'authentification

const router = Router();

// Route pour créer un administrateur
router.post('/create-admin', isAuthenticated, isSuperAdmin, createAdmin);

export default router;
```

### Mise à jour du serveur

Enfin, nous devons ajouter le nouveau routeur au serveur Express.

#### `server.ts`

```typescript
import express from 'express';
import bodyParser from 'body-parser';
import authRoutes from './routes/authRoutes';
import adminRoutes from './routes/adminRoutes';
import superAdminRoutes from './routes/superAdminRoutes'; // Importer les routes super admin
import { errorMiddleware } from './middlewares/errorMiddleware';

const app = express();
const port = process.env.PORT || 9000;

app.use(bodyParser.json());

app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/super-admin', superAdminRoutes); // Utiliser les routes super admin

// Middleware de gestion des erreurs
app.use(errorMiddleware);

app.listen(port, () => {
  console.log(`Server is running on port http://localhost:${port}`);
});
```

### Résumé des étapes

1. **Modèle Prisma** : Ajoutez un champ `role` au modèle `User` et ajoutez un modèle `PasswordReset` pour gérer les réinitialisations de mot de passe.
2. **Middleware `isSuperAdmin`** : Créez un middleware pour vérifier si l'utilisateur est un super administrateur.
3. **Contrôleur `createAdmin`** : Implémentez la logique pour permettre à un super administrateur de créer un nouvel administrateur.
4. **Routes `superAdminRoutes`** : Ajoutez les routes nécessaires pour gérer les fonctionnalités du super administrateur.
5. **Serveur** : Assurez-vous que votre serveur utilise les nouvelles routes et le middleware de gestion des erreurs.

Cela permet à un super administrateur de créer de nouveaux administrateurs, tout en s'assurant que les utilisateurs normaux et les administrateurs ne peuvent pas effectuer cette action.
```javascript
```
```javascript
```
```javascript
```

Pour gérer la migration des utilisateurs qui se connectaient initialement avec leur numéro de téléphone vers une méthode où ils pourront se connecter soit avec leur email, soit avec leur numéro de téléphone, vous pouvez suivre cette approche :

### 1. Mise à jour du modèle de données avec Prisma

Si votre modèle de données actuel dans Prisma ne contient pas d'e-mail pour tous les utilisateurs, vous devrez ajouter ce champ. Voici comment vous pourriez procéder :

```typescript
// Assurez-vous que votre modèle User dans Prisma contient un champ email
model User {
  id        Int      @id @default(autoincrement())
  firstname String
  lastname  String
  email     String?  // Le ? indique que ce champ est facultatif pour les anciens utilisateurs
  phoneNumber String
  password  String
  // Ajoutez d'autres champs si nécessaire
}
```

### 2. Migration des utilisateurs existants

Pour les utilisateurs existants qui n'ont pas d'e-mail enregistré :

- Lorsque l'utilisateur se connecte via son numéro de téléphone :
  - À la demande de réinitialisation du mot de passe (forget password), si l'utilisateur fournit son numéro de téléphone, vous devez vérifier dans votre base de données s'il n'y a pas déjà un enregistrement avec cet e-mail associé à ce numéro de téléphone. Si c'est le cas, vous pouvez enregistrer cet e-mail dans votre base de données Prisma pour cet utilisateur.

### 3. Implémentation du processus de réinitialisation de mot de passe (Forget Password)

Voici un exemple simplifié de la logique que vous pourriez utiliser pour gérer la réinitialisation de mot de passe :

#### Contrôleur pour le Forget Password

```typescript
import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const forgetPasswordCtrl = async (req: Request, res: Response) => {
  const { phoneNumber, email } = req.body;

  try {
    // Vérifier si un utilisateur avec ce numéro de téléphone existe
    const user = await prisma.user.findUnique({
      where: { phoneNumber },
    });

    if (!user) {
      return res.status(400).json({ message: 'Utilisateur non trouvé avec ce numéro de téléphone.' });
    }

    // Si l'utilisateur existe mais n'a pas d'email, enregistrer l'email fourni
    if (!user.email && email) {
      await prisma.user.update({
        where: { phoneNumber },
        data: { email },
      });
    }

    // Générer et envoyer le code OTP ou le lien pour réinitialiser le mot de passe
    // Code OTP ou lien serait envoyé par email ou SMS, selon votre implémentation

    res.json({ message: 'Un code de réinitialisation a été envoyé à votre email ou téléphone.' });
  } catch (error) {
    console.error('Erreur lors de la réinitialisation du mot de passe :', error);
    res.status(500).json({ message: 'Erreur lors de la réinitialisation du mot de passe.' });
  }
};
```

Dans cet exemple :

- Vous vérifiez si l'utilisateur existe avec le numéro de téléphone fourni.
- Si l'utilisateur existe mais n'a pas d'e-mail enregistré et qu'un e-mail est fourni dans la demande, vous mettez à jour cet utilisateur avec l'e-mail fourni.
- Ensuite, vous générez et envoyez le code OTP ou le lien de réinitialisation par email ou SMS.

Assurez-vous d'adapter ce code à votre logique métier spécifique et à vos besoins de sécurité, notamment en gérant de manière sécurisée l'envoi et la validation du code OTP ou du lien de réinitialisation.

Cette approche devrait vous permettre de migrer progressivement les utilisateurs existants vers un modèle où ils peuvent se connecter soit avec leur e-mail, soit avec leur numéro de téléphone, tout en maintenant la compatibilité avec les anciennes méthodes de connexion.
```javascript
```
```javascript
```



# creation d'un superadmin


Pour l'authentification de l'administrateur (super admin) en utilisant un token JWT stocké dans le fichier `.env`, vous pouvez suivre ces étapes :

### 1. Configuration dans le fichier `.env`

Tout d'abord, définissez une variable d'environnement dans votre fichier `.env` pour stocker le token JWT de l'administrateur super admin. Par exemple :

```
SUPER_ADMIN_TOKEN=your_super_admin_jwt_token
```

### 2. Middleware d'authentification de l'administrateur

Créez un middleware pour vérifier si le token JWT envoyé dans l'en-tête de la requête correspond au token du super admin défini dans le fichier `.env`. Si le token est valide, l'utilisateur est considéré comme un administrateur authentifié.

```typescript
// middleware/authMiddleware.ts

import { Request, Response, NextFunction } from 'express';

export const authenticateAdminToken = (req: Request, res: Response, next: NextFunction) => {
  const adminToken = req.headers.authorization?.split(' ')[1];
  const superAdminToken = process.env.SUPER_ADMIN_TOKEN;

  if (!adminToken || adminToken !== superAdminToken) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  next();
};
```

### 3. Routes pour l'administration

Créez des routes spécifiques pour les fonctionnalités d'administration, et utilisez le middleware d'authentification de l'administrateur pour protéger ces routes.

```typescript
// routes/adminRoutes.ts

import { Router } from 'express';
import { authenticateAdminToken } from '../middleware/authMiddleware';
import { getAllUsers, deleteUser } from '../controllers/adminController';

const router = Router();

router.get('/users', authenticateAdminToken, getAllUsers);
router.delete('/users/:userId', authenticateAdminToken, deleteUser);

export default router;
```

### 4. Contrôleur pour les fonctionnalités d'administration

Implémentez les fonctions de contrôleur nécessaires pour les fonctionnalités d'administration, telles que la récupération de tous les utilisateurs ou la suppression d'un utilisateur.

```typescript
// controllers/adminController.ts

import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const getAllUsers = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const users = await prisma.user.findMany();
    res.json(users);
  } catch (error) {
    next(error);
  }
};

export const deleteUser = async (req: Request, res: Response, next: NextFunction) => {
  const userId = req.params.userId;
  
  try {
    await prisma.user.delete({
      where: { id: userId },
    });
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    next(error);
  }
};
```

### 5. Utilisation des routes d'administration dans l'application

Montez les routes d'administration dans votre application principale.

```typescript
// server.ts

import express from 'express';
import adminRoutes from './routes/adminRoutes';

const app = express();

// Autres configurations de l'application...

app.use('/admin', adminRoutes);

// Autres configurations de l'application...

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
```

Avec ces étapes, vous pouvez créer un système d'authentification pour les administrateurs (super admins) en utilisant un token JWT stocké dans le fichier `.env`. Les routes d'administration sont protégées par le middleware d'authentification de l'administrateur, qui vérifie si le token envoyé correspond au token du super admin défini dans le fichier `.env`.
```javascript
```


# SUPERADMIN CREATION ADMIN


Pour permettre à un super administrateur de créer un administrateur avec des droits spécifiques, vous pouvez suivre ces étapes :

### 1. Définir les rôles et les autorisations

Tout d'abord, définissez les rôles et les autorisations disponibles dans votre système. Par exemple, vous pourriez avoir des rôles tels que "super admin", "admin" et "utilisateur", avec des autorisations spécifiques pour chaque rôle, comme la création et la suppression d'utilisateurs.

### 2. Ajouter un champ de rôle à votre modèle `User`

Modifiez votre modèle `User` pour inclure un champ de rôle qui spécifie le rôle de chaque utilisateur.

```typescript
// Prisma schema
model User {
  id         String   @id @default(auto()) @map("_id") @db.ObjectId
  firstname  String?
  lastname   String?
  email      String   @unique
  password   String
  role       String   // Champ pour spécifier le rôle de l'utilisateur
}
```

### 3. Créer une fonctionnalité pour la création d'un administrateur

Ajoutez une fonctionnalité dans votre application permettant à un super administrateur de créer un nouvel administrateur avec des droits spécifiques. Cette fonctionnalité peut être une route API avec un contrôleur correspondant.

### 4. Contrôleur pour la création d'un administrateur

Implémentez un contrôleur qui permet au super administrateur de créer un nouvel administrateur en spécifiant le rôle et les autorisations correspondantes.

```typescript
// controllers/adminController.ts

export const createAdmin = async (req: Request, res: Response, next: NextFunction) => {
  const { firstname, lastname, email, password, role } = req.body;

  try {
    // Vérifier si l'utilisateur actuel est un super administrateur
    if (req.user.role !== 'super admin') {
      return res.status(403).json({ message: 'Permission denied' });
    }

    // Créer un nouvel administrateur avec le rôle spécifié
    const newAdmin = await prisma.user.create({
      data: {
        firstname,
        lastname,
        email,
        password,
        role,
      },
    });

    res.json({ message: 'Admin created successfully', data: newAdmin });
  } catch (error) {
    next(error);
  }
};
```

### 5. Utiliser des mécanismes d'authentification et d'autorisation

Assurez-vous que seuls les super administrateurs ont la possibilité d'accéder à la fonctionnalité de création d'administrateur. Vous pouvez utiliser des mécanismes d'authentification et d'autorisation pour gérer cela, par exemple en utilisant des tokens JWT avec des rôles et des autorisations.

### 6. Test de la fonctionnalité

Testez la fonctionnalité de création d'administrateur pour vous assurer qu'elle fonctionne comme prévu et que seuls les super administrateurs peuvent créer de nouveaux administrateurs avec les droits appropriés.

En suivant ces étapes, vous pouvez permettre à un super administrateur de créer un administrateur avec des droits spécifiques, tels que la création et la suppression d'utilisateurs, dans votre application.










Bien sûr ! Pour mettre en place des mécanismes d'authentification et d'autorisation basés sur des tokens JWT avec des rôles et des autorisations, vous pouvez suivre ces étapes :

### 1. Authentification avec JWT

Lorsqu'un utilisateur se connecte avec succès en tant que super administrateur, générez un token JWT qui contient des informations sur l'utilisateur, telles que son identifiant et son rôle. Signez ce token avec une clé secrète et renvoyez-le à l'utilisateur.

### 2. Gestion des rôles et des autorisations

Définissez des rôles dans votre système, tels que "super admin", "admin" et "utilisateur", et associez des autorisations spécifiques à chaque rôle. Par exemple, seuls les super administrateurs devraient avoir la possibilité de créer de nouveaux administrateurs.

### 3. Middleware d'authentification

Créez un middleware d'authentification qui vérifie la présence du token JWT dans l'en-tête de la requête et le valide. Si le token est valide, extrayez les informations sur l'utilisateur, y compris son rôle, à partir du token et stockez-les dans l'objet de requête (`req`).

```typescript
// middleware/authMiddleware.ts

import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';

const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret_key';

export const authenticateToken = (req: Request, res: Response, next: NextFunction) => {
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(403).json({ message: 'Invalid token' });
    }
    // Stocker les informations de l'utilisateur dans l'objet de requête
    (req as any).user = decoded;
    next();
  });
};
```

### 4. Middleware d'autorisation

Créez un middleware d'autorisation qui vérifie si l'utilisateur a le bon rôle et les bonnes autorisations pour accéder à la fonctionnalité de création d'administrateur. Vous pouvez utiliser les informations sur l'utilisateur stockées dans l'objet de requête (`req`) pour cela.

```typescript
// middleware/authorizationMiddleware.ts

import { Request, Response, NextFunction } from 'express';

export const authorizeSuperAdmin = (req: Request, res: Response, next: NextFunction) => {
  const userRole = (req as any).user.role;

  if (userRole !== 'super admin') {
    return res.status(403).json({ message: 'Permission denied' });
  }

  next();
};
```

### 5. Utilisation des middlewares dans les routes

Utilisez ces middlewares dans vos routes pour protéger les fonctionnalités sensibles, telles que la création d'administrateurs.

```typescript
// routes/adminRoutes.ts

import { Router } from 'express';
import { authenticateToken } from '../middleware/authMiddleware';
import { authorizeSuperAdmin } from '../middleware/authorizationMiddleware';
import { createAdmin } from '../controllers/adminController';

const router = Router();

router.post('/admin', authenticateToken, authorizeSuperAdmin, createAdmin);

export default router;
```

Avec ces étapes, seuls les super administrateurs authentifiés auront la possibilité d'accéder à la fonctionnalité de création d'administrateurs. Les autres utilisateurs seront empêchés d'y accéder en raison des middlewares d'authentification et d'autorisation que nous avons mis en place.
```javascript
```
```javascript
```







Bien sûr ! Voici un exemple de donnée JSON que vous pouvez utiliser pour tester la création d'un nouvel administrateur avec Insomnia :

```json
{
  "firstname": "John",
  "lastname": "Doe",
  "email": "john.doe@example.com",
  "password": "password123",
  "role": "admin"
}
```

Assurez-vous d'envoyer cette requête à votre endpoint correspondant à la création d'un administrateur. Vous pouvez personnaliser les valeurs des champs selon vos besoins, mais assurez-vous que le champ `role` correspond à un rôle valide dans votre système, tel que "admin".
```javascript
```
```javascript
```
```javascript
```








Les permissions sont souvent incluses dans les rôles, en particulier dans les systèmes où les autorisations sont relativement simples et peuvent être directement associées à un rôle spécifique. Dans de nombreux cas, les rôles eux-mêmes déterminent ce que les utilisateurs peuvent faire dans l'application.

Cependant, dans des systèmes plus complexes où les autorisations sont plus granulaires et où différents utilisateurs peuvent avoir des droits différents même au sein du même rôle, il peut être nécessaire d'utiliser à la fois des rôles et des permissions.

### Utilisation des rôles et des permissions :

1. **Rôles** : Les rôles définissent les ensembles d'autorisations associées à un type d'utilisateur. Par exemple, vous pourriez avoir des rôles tels que "super admin", "admin" et "utilisateur".

2. **Permissions** : Les permissions décrivent les actions spécifiques qu'un utilisateur peut effectuer dans l'application. Elles peuvent être attribuées individuellement à chaque utilisateur ou associées à un rôle. Par exemple, une permission pourrait être "créer un utilisateur", "supprimer un utilisateur", etc.

### Exemple de combinaison de rôles et de permissions :

- Un utilisateur avec le rôle "super admin" a généralement toutes les permissions dans l'application.
- Un utilisateur avec le rôle "admin" peut avoir des autorisations limitées par rapport au super admin, par exemple, il peut ne pas avoir la permission de supprimer d'autres administrateurs.
- Un utilisateur avec le rôle "utilisateur" aura un ensemble encore plus limité de permissions, par exemple, il peut ne pas avoir la permission de créer ou de supprimer des utilisateurs.

Dans un système basé sur les rôles et les permissions, vous pouvez utiliser des middlewares d'autorisation pour vérifier si l'utilisateur possède les autorisations requises pour accéder à une fonctionnalité spécifique, en plus de vérifier son rôle. Cela vous donne plus de flexibilité dans la gestion des autorisations et vous permet de définir des règles plus précises pour chaque type d'utilisateur.
```javascript
```
```javascript
```
```javascript
```

















Configurer un super admin directement dans le code ou dans le fichier `.env` est une approche courante pour des raisons de sécurité et de contrôle. Cela garantit que le super admin n'a pas besoin de s'inscrire comme un utilisateur normal et que les informations sensibles telles que les identifiants peuvent être sécurisées correctement. Voici une bonne pratique pour gérer le super admin dans une application Node.js utilisant Prisma et JWT :

### 1. Configuration du Super Admin dans `.env`

Ajoutez les informations du super admin dans votre fichier `.env` :

```env
SUPER_ADMIN_EMAIL=superadmin@example.com
SUPER_ADMIN_PASSWORD=supersecurepassword
```

### 2. Initialisation du Super Admin dans le Code

Ajoutez une fonction qui s'exécute au démarrage de l'application pour créer le super admin s'il n'existe pas déjà. Cela peut être fait dans le fichier principal de votre application (par exemple, `server.ts` ou `app.ts`).

```typescript
import prisma from './prisma'; // Assurez-vous que le chemin est correct
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';

dotenv.config();

const initializeSuperAdmin = async () => {
    const { SUPER_ADMIN_EMAIL, SUPER_ADMIN_PASSWORD } = process.env;

    if (!SUPER_ADMIN_EMAIL || !SUPER_ADMIN_PASSWORD) {
        throw new Error('Super admin credentials are not set in the environment variables.');
    }

    // Vérifiez si le super admin existe déjà
    const existingAdmin = await prisma.user.findUnique({
        where: { email: SUPER_ADMIN_EMAIL }
    });

    if (!existingAdmin) {
        // Créez le super admin
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(SUPER_ADMIN_PASSWORD, salt);

        await prisma.user.create({
            data: {
                email: SUPER_ADMIN_EMAIL,
                password: hashedPassword,
                role: 'SUPER_ADMIN',
                isVerified: true,
                status: 'active'
            }
        });

        console.log('Super admin created');
    } else {
        console.log('Super admin already exists');
    }
};

// Appelez cette fonction au démarrage de l'application
initializeSuperAdmin().catch((err) => {
    console.error('Error initializing super admin:', err);
});
```

### 3. Middleware d'Authentification

Créez un middleware pour vérifier les rôles des utilisateurs, notamment pour protéger les routes réservées aux administrateurs :

```typescript
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import prisma from './prisma'; // Assurez-vous que le chemin est correct

export const authenticate = async (req: Request, res: Response, next: NextFunction) => {
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
        return res.status(401).json({ error: 'Access denied. No token provided.' });
    }

    try {
        const decoded = jwt.verify(token, 'your-secret-key') as { userId: string };
        const user = await prisma.user.findUnique({
            where: { id: decoded.userId }
        });

        if (!user) {
            return res.status(401).json({ error: 'Access denied. Invalid token.' });
        }

        req.user = user;
        next();
    } catch (err) {
        res.status(400).json({ error: 'Invalid token' });
    }
};

export const authorize = (role: string) => {
    return (req: Request, res: Response, next: NextFunction) => {
        if (req.user.role !== role) {
            return res.status(403).json({ error: 'Access denied. You do not have the required role.' });
        }
        next();
    };
};
```

### 4. Protéger les Routes

Utilisez les middlewares `authenticate` et `authorize` pour protéger les routes réservées aux administrateurs :

```typescript
import express from 'express';
import { authenticate, authorize } from './middlewares/authMiddleware'; // Assurez-vous que le chemin est correct

const router = express.Router();

router.post('/admin-route', authenticate, authorize('ADMIN'), (req, res) => {
    // Route réservée aux administrateurs
    res.status(200).json({ message: 'Welcome, admin!' });
});

router.post('/super-admin-route', authenticate, authorize('SUPER_ADMIN'), (req, res) => {
    // Route réservée aux super administrateurs
    res.status(200).json({ message: 'Welcome, super admin!' });
});

export default router;
```

### Explications

1. **Configuration dans `.env`** : Les informations sensibles du super admin sont stockées dans le fichier `.env` pour une meilleure gestion de la configuration et la sécurité.
   
2. **Initialisation du Super Admin** : Au démarrage de l'application, une fonction vérifie si le super admin existe déjà dans la base de données. Si ce n'est pas le cas, elle le crée avec les informations fournies dans le fichier `.env`.

3. **Middleware d'Authentification et d'Autorisation** : Deux middlewares sont créés : un pour vérifier l'authentification et un autre pour vérifier les autorisations basées sur les rôles.

4. **Protéger les Routes** : Les routes réservées aux administrateurs et super administrateurs sont protégées à l'aide des middlewares d'authentification et d'autorisation.

En suivant ces étapes, vous vous assurez que le super admin est correctement configuré et sécurisé, sans nécessiter une création de compte traditionnelle.




import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import prisma from '../prisma'; // Assurez-vous que le chemin vers Prisma est correct

export const adminLoginCtrl = async (req: Request, res: Response, next: NextFunction) => {
    const { email, password } = req.body;

    try {
        // Rechercher l'utilisateur par email dans la base de données
        const user = await prisma.user.findUnique({
            where: { email }
        });

        // Vérifier si l'utilisateur existe
        if (!user) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        // Vérifier si le mot de passe est correct
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        // Générer un token JWT
        const token = jwt.sign({ userId: user.id }, 'your-secret-key', { expiresIn: '1h' });

        // Répondre avec le token JWT
        res.status(200).json({
            status: 'success',
            message: 'Login successful',
            token
        });

    } catch (err) {
        next(err);
    }
};




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
        if (! user.isVerified) {
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




## Code de login superAdmin

```javascript
const loginSuperAdminCtrl = async (req: Request, res: Response, next: NextFunction) => {
    
    const { SUPER_ADMIN_EMAIL, SUPER_ADMIN_PASSWORD } = process.env
    const { superAdminMail, superAdminPassword } = req.body

    try {
        // check pour la connexion de l'utilisateur
        if (!SUPER_ADMIN_EMAIL || !SUPER_ADMIN_PASSWORD) {
            return next(new BadRequestException('Les données du superadmin n\'ont pas été correctment insere dans la variable d\'environnement', ErrorCodes.SUPER_ADMIN_NOT_FOUND));
        }

        if (superAdminMail !== SUPER_ADMIN_EMAIL) {
            return next(new BadRequestException('Email de l\'admin incorrect', ErrorCodes.EMAIL_ADMIN_NOT_FOUND))
        }

        const isPasswordValid = await bcrypt.compare(superAdminPassword, SUPER_ADMIN_PASSWORD);
        if (!isPasswordValid) {
            return next(new BadRequestException('Mot de passe incorrect', ErrorCodes.INCORRECT_PASSWORD))
        }
        // hashed password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(SUPER_ADMIN_PASSWORD, salt)

        // Generer des tokens JWT pour la connexion de l'admin
        await prisma.user.create({
            data: {
                email: SUPER_ADMIN_EMAIL,
                password: hashedPassword,
                phoneNumber: '0022892152971',
                role: 'superamin',
                isVerified: true,
                status: 'active'
            }
        })

    } catch (err) {
        next(err);
    }
}
```

les routes










L'erreur que vous rencontrez indique que la valeur `'superadmin'` (ou similaire) n'a pas été trouvée dans l'énumération `'Role'` définie dans votre schéma Prisma. Voici comment vous pouvez résoudre ce problème :

### Étape 1 : Vérifiez votre schéma Prisma

Assurez-vous que le rôle `'superadmin'` (ou le nom exact que vous utilisez) est bien défini dans l'énumération `'Role'` de votre fichier Prisma (`schema.prisma`). Voici un exemple de comment cela devrait être défini :

```prisma
enum Role {
  USER
  ADMIN
  SUPERADMIN // Assurez-vous que ce rôle est défini ici
}

model User {
  id    Int    @id @default(autoincrement())
  email String @unique
  name  String
  role  Role
}
```

### Étape 2 : Vérifiez votre code d'initialisation

Assurez-vous que lorsque vous vérifiez l'existence du super administrateur, vous utilisez correctement l'énumération `'Role'`. Voici un exemple de ce à quoi cela pourrait ressembler :

```typescript
const existingAdmin = await prisma.user.findUnique({
  where: {
    role: 'SUPERADMIN' // Assurez-vous que cela correspond à la définition dans votre enum
  }
});
```

### Exemple de correction

Voici un exemple de code complet qui vérifie l'existence d'un super administrateur et crée un utilisateur avec le rôle `'SUPERADMIN'` si nécessaire :

#### Schéma Prisma (`schema.prisma`)

```prisma
enum Role {
  USER
  ADMIN
  SUPERADMIN
}

model User {
  id    Int    @id @default(autoincrement())
  email String @unique
  name  String
  role  Role
}
```

#### Code TypeScript

```typescript
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function initializeSuperAdmin() {
  try {
    // Vérifiez si le super admin existe déjà
    const existingAdmin = await prisma.user.findUnique({
      where: {
        role: 'SUPERADMIN' // Utilisez correctement l'énumération
      }
    });

    // Si le super admin n'existe pas, créez-le
    if (!existingAdmin) {
      const superAdmin = await prisma.user.create({
        data: {
          email: 'superadmin@example.com',
          name: 'Super Admin',
          role: 'SUPERADMIN' // Assurez-vous que cela correspond à l'énum
        }
      });
      console.log('Super admin created:', superAdmin);
    } else {
      console.log('Super admin already exists.');
    }
  } catch (error) {
    console.error('Error initializing super admin:', error);
  } finally {
    await prisma.$disconnect();
  }
}

initializeSuperAdmin();
```

### Conclusion

En vous assurant que le rôle `'SUPERADMIN'` est bien défini dans votre énumération Prisma et que vous l'utilisez correctement dans votre code TypeScript, vous devriez pouvoir résoudre l'erreur que vous rencontrez. Si vous continuez à rencontrer des problèmes, assurez-vous que votre schéma Prisma est correctement synchronisé avec votre base de données en exécutant les commandes de migration appropriées (`prisma migrate dev`, par exemple).