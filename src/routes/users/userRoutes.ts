import { Router } from 'express';

import {
    getOneUserCtrl,
    getAllUserCtrl,
    updateUserCtrl,
    deleteUserCtrl,
    userLogoutCtrl,
    updatePasswordCtrl,
    dashbordCtrl,
} from '../../controllers/userCtrl';

import { userRegisterCtrl, userLoginCtrl, verifyOTP, resendOTP, requestPasswordReset, resetPassword } from '../../controllers/authController';

import { loginSuperAdminCtrl } from '../../controllers/authController';

import { loginMiddleware } from '../../middleware/loginMiddleware';

import { isSuperAdmin } from '../../middleware/isSuperAdmin';

const router = Router();


router.post('/register/', userRegisterCtrl);

router.post('/verify-otp/', verifyOTP);

router.post('/resend-otp/', resendOTP);

router.post('/login/', userLoginCtrl);

router.get('/profile/', loginMiddleware, getOneUserCtrl);

router.get('/all/', loginMiddleware, getAllUserCtrl);

router.put('/update/', loginMiddleware, updateUserCtrl);

router.delete('/delete/', loginMiddleware, deleteUserCtrl)
// updatePasswordCtrl
router.put('/update-password/', loginMiddleware, updatePasswordCtrl)

router.post('/logout/', loginMiddleware, userLogoutCtrl);

router.post('/request-reset-password', requestPasswordReset);

router.post('/reset-password', resetPassword);

router.post('/ad-login/', loginSuperAdminCtrl);

router.post('/superadmin/', loginMiddleware, isSuperAdmin, dashbordCtrl);

export default router;