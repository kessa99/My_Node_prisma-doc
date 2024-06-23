// const express = require('express');
import express, { Request, Response, NextFunction } from 'express';

// const dotenv = require('dotenv');
import dotenv from 'dotenv';

// importation d'un function pour s'assurer que
// la base de données est connectée avec succes
import { connectToDatabase } from './utils/erroData/runserver';
import { PrismaClient } from '@prisma/client'
import { BadRequestException } from "./exceptions/bad-request";
import bcrypt from 'bcrypt';
import { ErrorCodes } from "./exceptions/root";

const prisma = new PrismaClient()

dotenv.config();
const app = express();

// impote routes
import userRoutes from './routes/users/userRoutes';
import { errorMiddleware } from './middleware/error';

// Middleware
app.use(express.json());
app.use('/api/v1/users', userRoutes);
// routes

// error handler middleware
app.use(errorMiddleware);

// 404 error
app.use('*', (req, res) => {
    res.status(404).json({
        message: `${req.originalUrl} - 404 Route Not Found`
    });
});

const initializeSuperAdmin = async () => {
    const { SUPER_ADMIN_EMAIL, SUPER_ADMIN_PASSWORD } = process.env;

    if (!SUPER_ADMIN_EMAIL || !SUPER_ADMIN_PASSWORD) {
        return false;
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
                phoneNumber: '0000000000',
                role: 'superadmin',
                isVerified: true,
                status: 'active',
                isSuperuser: true,
            }
        });
        console.log('Super admin created automatiquement dans la base de donnee');
    } else {
        console.log('Super admin already exists Connectez-vous directement');
    }
};

// Appelez cette fonction au démarrage de l'application
initializeSuperAdmin().catch((err) => {
    console.error('Error initializing super admin:', err);
});


// listen server
const PORT = process.env.PORT || 3000;

connectToDatabase().then(() => {
    app.listen(PORT, () => {
        console.log(`Server is running on port http://localhost:${PORT}`);
    });
}).catch((error) => {
    console.error('connexion impossible à la base de données');
    process.exit(1);
});
