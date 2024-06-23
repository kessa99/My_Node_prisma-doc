Je comprends mieux maintenant. Vous souhaitez utiliser le processus de réinitialisation de mot de passe pour récupérer l'email des utilisateurs qui ne l'ont pas fourni lors de leur inscription initiale. Voici comment vous pouvez ajuster le processus pour atteindre cet objectif :

### Processus de réinitialisation de mot de passe avec récupération de l'email

Pour les utilisateurs qui se sont inscrits sans fournir d'email, vous pouvez mettre en œuvre le processus de réinitialisation de mot de passe comme suit :

1. **Vérification du numéro de téléphone :**
   - Demandez à l'utilisateur de saisir son numéro de téléphone.
   - Vérifiez en base de données si ce numéro de téléphone existe.

2. **Envoi du code OTP par SMS :**
   - Si le numéro de téléphone est valide, envoyez le code OTP par SMS au numéro de téléphone enregistré.

3. **Validation du code OTP :**
   - L'utilisateur saisit le code OTP reçu par SMS pour vérifier son compte.

4. **Récupération de l'email :**
   - Après validation du code OTP, demandez à l'utilisateur de saisir l'email associé à son compte.
   - Mettez à jour le compte de l'utilisateur avec l'email saisi.

5. **Mise à jour du mot de passe :**
   - Permettez à l'utilisateur de définir un nouveau mot de passe une fois l'email validé et mis à jour.

### Implémentation dans le contrôleur pour récupérer l'email

Voici comment vous pouvez implémenter ces étapes dans votre contrôleur :

```typescript
import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';
import bcrypt from 'bcrypt';
import prisma from '../prisma';
import { sendOTPSMS } from '../utils/smsUtils'; // Fonction pour envoyer le SMS avec le code OTP
import { BadRequestException, ErrorCodes } from '../exceptions';

// Étape 1: Vérification du numéro de téléphone
export const forgotPasswordStep1 = async (req: Request, res: Response, next: NextFunction) => {
    const { phoneNumber } = req.body;

    try {
        const user = await prisma.user.findFirst({
            where: {
                phoneNumber,
            },
        });

        if (!user) {
            return next(new BadRequestException('Numéro de téléphone non trouvé', ErrorCodes.PHONE_NUMBER_NOT_FOUND));
        }

        // Stocker le numéro de téléphone dans la session ou dans une variable pour l'étape suivante
        req.session.phoneNumber = phoneNumber;

        res.json({
            status: 'success',
            message: 'Numéro de téléphone vérifié. Un code OTP a été envoyé à votre numéro par SMS.',
        });

        // Envoi du code OTP par SMS
        const otp = generateOTP(); // Fonction à implémenter pour générer le code OTP
        await sendOTPSMS(phoneNumber, otp); // Fonction à implémenter pour envoyer le SMS avec le code OTP

        // Stocker le code OTP dans la session pour la vérification ultérieure
        req.session.otp = otp;
    } catch (err) {
        next(err);
    }
};

// Étape 2: Validation du code OTP et récupération de l'email
export const forgotPasswordStep2 = async (req: Request, res: Response, next: NextFunction) => {
    const { otp, email, newPassword } = req.body;
    const { phoneNumber } = req.session;

    try {
        // Vérifier que le code OTP saisi correspond à celui envoyé par SMS
        if (otp !== req.session.otp) {
            return next(new BadRequestException('Code OTP incorrect', ErrorCodes.INVALID_OTP));
        }

        // Mettre à jour l'email dans la base de données
        const updatedUser = await prisma.user.update({
            where: {
                phoneNumber,
            },
            data: {
                email,
            },
        });

        // Générer un nouveau mot de passe hashé
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        // Mettre à jour le mot de passe dans la base de données
        await prisma.user.update({
            where: {
                id: updatedUser.id,
            },
            data: {
                password: hashedPassword,
            },
        });

        res.json({
            status: 'success',
            message: 'Email vérifié et mot de passe réinitialisé avec succès.',
        });
    } catch (err) {
        next(err);
    }
};
```

### Points clés :

- **Récupération de l'email :** Après avoir validé le code OTP, demandez à l'utilisateur de saisir l'email associé à son compte. Assurez-vous de mettre à jour le compte de l'utilisateur avec cet email.
- **Sécurité :** Utilisez des mécanismes sécurisés pour l'envoi du code OTP par SMS et pour le stockage des informations sensibles comme les mots de passe hashés.
- **Gestion des sessions :** Utilisez `req.session` ou une méthode similaire pour stocker temporairement des données entre les requêtes, comme le numéro de téléphone et le code OTP.
- **Messages d'erreur :** Fournissez des messages d'erreur clairs pour guider l'utilisateur lorsqu'un numéro de téléphone, un code OTP ou un email incorrect est saisi.

En suivant cette approche, vous pouvez gérer efficacement la réinitialisation de mot de passe tout en récupérant l'email pour les utilisateurs qui ne l'ont pas fourni lors de leur inscription initiale. Assurez-vous de tester chaque étape pour garantir que le processus fonctionne correctement dans tous les scénarios possibles.