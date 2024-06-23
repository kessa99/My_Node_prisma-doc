import { Request, Response, NextFunction } from 'express';
import { PrismaClient, User } from '@prisma/client';
import bcrypt from 'bcrypt';
import { BadRequestException } from '../exceptions/bad-request';
import { ErrorCodes } from '../exceptions/root';
const prisma = new PrismaClient();


export const getOneUserCtrl = async (req: Request, res: Response, next: NextFunction) => {
    // const { id } = req.params;
    // console.log('Received data:', { id });
    // 1. meilleur facon de recuperer l'id depuis le token
    const userAuth = (req as any).userAuth
    try {
        // 2. recherche de l'utilisateur par id
        const user = await prisma.user.findUnique({
            where: {
                id: userAuth
            }
        });
        if (!user) {
            return next(new BadRequestException('Utilisateur n\'est pas dans la database!', ErrorCodes.USER_NOT_FOUND));
        }
        res.json({
            status: 'success',
            data: {
                firstname: user?.firstname,
                lastname: user?.lastname,
                email: user?.email,
                phoneNumber: user?.phoneNumber,
                role: user?.role,
                isSuperuser: user?.isSuperuser,
                isblocked: user?.isBlocked
            }
        })
    } catch (err) {
        next(err);
    }
}

export const getAllUserCtrl = async (req: Request, res: Response, next: NextFunction) => {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    try {
        const users = await prisma.user.findMany({
            skip: skip,
            take: limit
        });

        const totalUsers = await prisma.user.count();
        const totalPages = Math.ceil(totalUsers / limit);

        res.json({
            status: 'success',
            data: {
                allUser: users,
                totalUsers: totalUsers,
                page: page,
                totalPages: totalPages
            }
        })
    } catch (err) {
        next(err);
    }
}

export const updateUserCtrl = async (req: Request, res: Response, next: NextFunction) => {
    // const userId = req.params.id
    const userAuth = (req as any).userAuth
    const { firstname, lastname, email } = req.body
    if (!firstname && !lastname && !email) {
        return next(new BadRequestException('Aucune donne a mettre a jour saisie', ErrorCodes.NO_DATA_TO_UPDATE_FOUND));
    }
    try {
        // verifier si le user existe
        if (email) {
            const emailTaken = await prisma.user.findUnique({
                where: { email }
            });
            if (emailTaken) {
                return next(new BadRequestException('Email deja utilise', ErrorCodes.EMAIL_ALREADY_USED));
            }
        }

        // mettre a jour l'utilisateur
        const updateUser = await prisma.user.update({
            where: {
                id: userAuth
            },
            data: {
                ...(firstname && { firstname }),
                ...(lastname && { lastname }),
                ...(email && { email }),
            }
        });
        console.log('mise a jour reussi')
        res.json({
            status: 'success',
            data: updateUser
        })
    } catch (err) {
        next(err);
    }
}

export const updatePasswordCtrl = async (req: Request, res: Response, next: NextFunction) => {
    const userAuth = (req as any).userAuth
    const { password } = req.body
    try {
        // cryptage du mot de passe
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        // mettre a jour le mot de passe
        const updateUser = await prisma.user.update({
            where: {
                id: userAuth
            },
            data: {
                password: hashedPassword
            }
        });
        res.json({
            status: 'success',
            data: updateUser
        })
    } catch (err) {
        next(err);
    }

}

export const deleteUserCtrl = async (req: Request, res: Response, next: NextFunction) => {
    const userAuth = (req as any).userAuth
    try {
        await prisma.user.delete({
            where: {
                id: userAuth
            }
        })
        res.json({
            status: 'success',
            message: 'suppression reussie'
        })
    } catch (err) {
        next(err);
    }
}

export const photoProfileCtrl = async (req: Request, res: Response, next: NextFunction) => {
    const userAuth = (req as any).userAuth
    const { profilePhoto } = req.body
    try {
        const updateUser = await prisma.user.update({
            where: {
                id: userAuth
            },
            data: {
                profilePhoto: profilePhoto
            }
        });
        res.json({
            status: 'success',
            data: updateUser
        })
    } catch (err) {
        const error = err as Error;
        res.json({
            status: 'fail',
            message: error.message
        })
    }
}

export const userLogoutCtrl = async (req: Request, res: Response, next: NextFunction) => {
    const userAuth = (req as any).userAuth
    try {
        // Supprimer le refresh token de l'utilisateur de la base de données
        await prisma.refreshTokens.deleteMany({
            where: {
                id: userAuth
            }
        });

        res.json({ status: 'success', message: 'Déconnexion réussie' });
    } catch (err) {
        next(err);
    }
};

export const dashbordCtrl = async (req: Request, res: Response, next: NextFunction) => {
    res.json({
        status: 'success',
        message: 'Vous etes un super admin'
    })
}