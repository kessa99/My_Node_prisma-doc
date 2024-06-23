import { NextFunction, Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import bcrypt from 'bcrypt';
import { generateAccessToken, generateRefreshToken } from '../utils/tokenJwt/jwt';
import { validationResult } from "express-validator";
import { BadRequestException } from "../exceptions/bad-request";
import { ErrorCodes } from "../exceptions/root";
import { sendOTPEmail } from "../utils/nodemailer/nodemailer";
import crypto from 'crypto';
import nodemailer from 'nodemailer';
import { generateAccessTokenAdmin, generateRefreshTokenAdmin } from "../utils/tokenJwt/generateTokenAdmin";
const prisma = new PrismaClient();
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_EGO,
        pass: process.env.PASSWORD_EMAIL_EGO
    }
});


export const userRegisterCtrl = async (req: Request, res: Response, next: NextFunction) => {

    // 1. Validation des entrées pour s'assurer que les formats sont bons
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    // 2. Récupération des données du corps de la requête
    const { firstname, lastname, email, phoneNumber, password } = req.body;

    // x. verification du format de l'email
    const gmailRegex = /^[a-zA-Z0-9._%+-]+@gmail\.com$/;
    if (!gmailRegex.test(email)) {
        return next(new BadRequestException('Ce format d\'email est invalid', ErrorCodes.INVALID_FORMAT_EMAIL));
    }

    try {
        // 3. Validation ou vérification de l'existence de l'email
        const emailFound = await prisma.user.findUnique({
            where: { email }
        });
        if (emailFound) {
            // Créer une nouvelle erreur avec un statut personnalisé
            return next(new BadRequestException('Utilisateur existe déjà!', ErrorCodes.USER_ALREADY_EXIST));
        }

        // 4. Pareil pour le numéro de téléphone
        const researchPhoneNumber = await prisma.user.findUnique({
            where: { phoneNumber }
        });
        if (researchPhoneNumber) {
            return next(new BadRequestException('Ce numéro de téléphone est déjà utilisé, merci d\'en choisir un autre', ErrorCodes.PHONE_NUMBER_ALREADY_EXISTS));
        }

        // 5. Cryptage du mot de passe
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // x. Génération d'un code OTP
        const otp = crypto.randomBytes(3).toString('hex').toUpperCase();
        const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10min

        // 6. Création d'un nouvel utilisateur dans la base
        const newUser = await prisma.user.create({
            data: {
                firstname,
                lastname,
                email,
                phoneNumber,
                password: hashedPassword,
                otpVerifications: {
                    create: {
                        otp,
                        otpExpires
                    }
                }
            }
        });

        // Envoi de l'email de vérification
        await sendOTPEmail(email, otp);

        // Réponse en cas de succès
        res.status(201).json({
            status: 'pending',
            message: 'Utilisateur enregistré. Veuillez vérifier votre email pour l\'OTP.'
        });

    } catch (err) {
        // 7. Gestion des erreurs
        next(err);
    }
}


export const verifyOTP = async (req: Request, res: Response, next: NextFunction) => {
    const { email, otp } = req.body;
    try {
        // rechercher l'utilisateur par mail
        const user = await prisma.user.findUnique({
            where: { email },
            include: {
                otpVerifications: true
            }
        });
        if (!user) {
            return next(new BadRequestException('Utilisateur non trouvé', ErrorCodes.USER_NOT_FOUND));
        }

        // const userOtpVerification = user.otpVerifications[0];
        // if (!userOtpVerification) {
        //     return next(new BadRequestException('Aucun code OTP trouvé', ErrorCodes.INVALID_OTP));
        // }

        // verifier que l'otp existe et n'est pas expire
        const userOtpVerification = user.otpVerifications.find(
            (otpVerification) => otpVerification.otp === otp
        );

        if (!userOtpVerification || userOtpVerification.otpExpires < new Date()) {
            return next(new BadRequestException('Code OTP invalide ou expiré', ErrorCodes.INVALID_OTP));
        }

        // const now = new Date();
        // if (now > otpVerification.otpExpires) {
        //     return next(new BadRequestException('Code OTP expiré', ErrorCodes.OTP_EXPIRED));
        // }

        await prisma.user.update({
            where: { email },
            data: {
                isVerified: true,

                // suppression de l'otp apres verification
                otpVerifications: {
                    delete: {
                        id: userOtpVerification.id
                        // deleteMany: {},
                    }
                }
            }
        });

        res.json({
            status: 'success',
            message: 'Code OTP vérifié avec succès'
        });
    } catch (err) {
        next(err);
    }
}

export const resendOTP = async (req: Request, res: Response, next: NextFunction) => {
    const { email } = req.body;

    try {
        const user = await prisma.user.findUnique({
            where: { email },
            include: { otpVerifications: true },
        });

        if (!user) {
            return next(new BadRequestException('Utilisateur non trouvé', ErrorCodes.USER_NOT_FOUND));
        }

        const otp = crypto.randomBytes(3).toString('hex');
        const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

        await prisma.userOtpVerification.create({
            data: {
                otp,
                otpExpires,
                userId: user.id,
            },
        });

        await sendOTPEmail(email, otp);

        res.status(200).json({ message: 'Nouvel OTP envoyé avec succès' });
    } catch (error) {
        next(error);
    }
};

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



export const requestPasswordReset = async (req: Request, res: Response, next: NextFunction) => {
    const { email } = req.body;

    try {
        const user = await prisma.user.findUnique({
            where: { email }
        });

        if (!user) {
            return next(new BadRequestException('Utilisateur non trouvé', ErrorCodes.USER_NOT_FOUND));
        }

        const resetToken = crypto.randomBytes(3).toString('hex');
        const resetTokenExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

        await prisma.user.update({
            where: { email },
            data: {
                resetToken,
                resetTokenExpiry
            }
        });

        const resetUrl = `http://localhost:3000/reset-password?token=${resetToken}`;
        await transporter.sendMail({
            from: process.env.EMAIL_EGO,
            to: email,
            subject: 'Réinitialisation du mot de passe',
            text: `Vous avez demandé une réinitialisation de mot de passe. Veuillez cliquer sur ce lien pour réinitialiser votre mot de passe: </p> <a href="${resetUrl}">Réinitialiser le mot de passe </a>`
        });

        res.json({
            status: 'pending',
            message: 'Un email a été envoyé pour réinitialiser votre mot de passe'
        });

    } catch (error) {
        next(error);
    }
}

export const resetPassword = async (req: Request, res: Response, next: NextFunction) => {

    try {
        // 1. verifier si le user existe
        const { token, newPassword } = req.body;

        const user = await prisma.user.findUnique({
            where: { resetToken: token }
        });

        if (!user || user.resetTokenExpiry! < new Date()) {
            return next(new BadRequestException('Le token est invalid ou a expiré', ErrorCodes.USER_NOT_FOUND));
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);
        await prisma.user.update({
            where: { resetToken: token },
            data: {
                password: hashedPassword,
                resetToken: null,
                resetTokenExpiry: null
            }
        });
        res.json({
            status: 'sucess',
            message: 'Password reinitialié avec succes'
        });

    } catch (err) {
        next(err);
    }
}


export const loginSuperAdminCtrl = async (req: Request, res: Response, next: NextFunction) => {
    const { email, password } = req.body;
    try {
        const user = await prisma.user.findUnique({
            where: { email }
        });

        if (!user) {
            return next(new BadRequestException('Super admin non trouvé', ErrorCodes.SUPER_ADMIN_NOT_FOUND));
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return next(new BadRequestException('Mot de passe incorrect', ErrorCodes.INCORRECT_PASSWORD));
        }

        const accessToken = generateAccessTokenAdmin(user);
        const refreshToken = generateRefreshTokenAdmin(user);

        await prisma.refreshTokens.create({
            data: {
                hashedToken: refreshToken,
                userId: user.id
            }
        });

        return res.json({
            status: 'success',
            data: {
                email: email,
                token: {
                    accessToken,
                    refreshToken
                }
            }
        });
    } catch (err) {
        return next(err);
    }
};