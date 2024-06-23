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