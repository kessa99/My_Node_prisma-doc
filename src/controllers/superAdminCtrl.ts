import { Router } from 'express';
import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import { BadRequestException } from '../exceptions/bad-request';
import { ErrorCodes } from '../exceptions/root';
const prisma = new PrismaClient();

import { userRegisterCtrl, userLoginCtrl, verifyOTP, resendOTP, requestPasswordReset, resetPassword } from '../../controllers/authController';


// import { loginMiddleware } from '../../middleware/loginMiddleware';

// import { isSuperAdmin } from '../../middleware/isSuperAdmin';

export const createAdminBySuperAdmin = async (req: Request, res: Response, next: NextFunction) => {
    const { firstname, lastname, email, phoneNumber, password } = req.body;

    try {
        // verifier si l'eamil existe deja
        const emailFound = await prisma.user.findUnique({
            where: {
                email
            }
        });
        if (emailFound) {
            return next(new BadRequestException('Email déjà utilisé', ErrorCodes.USER_ALREADY_EXIST));
        }

        // verifier si le numero de telephone existe deja

        const phoneNumberFound = await prisma.user.findUnique({
            where:
            {
                phoneNumber
            }
        });
        if(phoneNumberFound) {
            return next(new BadRequestException('Numero de telephone deja utilise', ErrorCodes.PHONE_NUMBER_ALREADY_EXISTS));
        }
        
        // cryptage du mot de passe
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // creation d'un nouvel adminstrateur
        const newAdmin = await prisma.user.create({
            data: {
                firstname,
                lastname,
                email,
                phoneNumber,
                password: hashedPassword,
                role: 'admin'
            }
        });
        res.json({
            message: 'Admin créé avec succès',
            data: newAdmin
        })
    } catch(err) {
        next(err);
    }
}

const router = Router();

