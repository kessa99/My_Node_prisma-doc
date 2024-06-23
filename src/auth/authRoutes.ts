import { Router } from 'express';
import { userRegisterCtrl, userLoginCtrl } from '../controllers/authController';

import { body } from 'express-validator';

const router = Router();

router.post(
    '/register',
    [
        body('email').isEmail().withMessage('Email invalide'),
        body('password').isLength({ min: 6 }).withMessage('Le mot de passe doit contenir au moins 6 caractere')
    ],
    userRegisterCtrl
);

router.post(
    '/login',
    [
      body('email').isEmail().withMessage('Email invalide'),
      body('password').not().isEmpty().withMessage('Le mot de passe est requis')
    ],
    userLoginCtrl
);

export default router;