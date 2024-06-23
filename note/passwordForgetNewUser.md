Compris, pour implémenter le processus de réinitialisation de mot de passe (forgot password) basé sur le numéro de téléphone et l'email, voici comment vous pouvez structurer votre contrôleur et les étapes nécessaires :

### Étapes de mise en œuvre :

1. **Vérification de l'existence du numéro de téléphone :**
   - Demandez à l'utilisateur de saisir son numéro de téléphone.
   - Vérifiez en base de données si ce numéro de téléphone existe.

2. **Vérification de l'email associé au numéro de téléphone :**
   - Si le numéro de téléphone est valide, demandez à l'utilisateur de saisir l'email associé au compte.
   - Vérifiez que cet email correspond bien au numéro de téléphone.

3. **Envoi du code OTP par email :**
   - Générez un code OTP (One Time Password) aléatoire.
   - Envoyez ce code par email à l'adresse associée au compte.

4. **Validation du code OTP :**
   - L'utilisateur saisit le code reçu par email pour vérifier son compte.

5. **Mise à jour du mot de passe :**
   - Si le code OTP est validé avec succès, permettez à l'utilisateur de définir un nouveau mot de passe pour son compte.

### Implémentation dans le contrôleur :

Voici comment vous pouvez implémenter ces étapes dans votre contrôleur :

```typescript
import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';
import bcrypt from 'bcrypt';
import prisma from '../prisma';
import { sendOTPEmail } from '../utils/emailUtils'; // Fonction pour envoyer l'email avec le code OTP
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
            message: 'Numéro de téléphone vérifié. Veuillez saisir l\'email associé à votre compte.',
        });
    } catch (err) {
        next(err);
    }
};

// Étape 2: Vérification de l'email associé au compte
export const forgotPasswordStep2 = async (req: Request, res: Response, next: NextFunction) => {
    const { email } = req.body;
    const { phoneNumber } = req.session;

    try {
        const user = await prisma.user.findFirst({
            where: {
                email,
                phoneNumber,
            },
        });

        if (!user) {
            return next(new BadRequestException('Email non associé au numéro de téléphone fourni', ErrorCodes.EMAIL_NOT_FOUND));
        }

        // Stocker l'email dans la session ou dans une variable pour l'étape suivante
        req.session.email = email;

        // Génération et envoi du code OTP par email
        const otp = generateOTP(); // Fonction à implémenter pour générer le code OTP
        await sendOTPEmail(email, otp); // Fonction à implémenter pour envoyer l'email avec le code OTP

        // Stocker le code OTP dans la session pour la vérification ultérieure
        req.session.otp = otp;

        res.json({
            status: 'success',
            message: 'Email vérifié. Un code OTP a été envoyé à votre adresse email.',
        });
    } catch (err) {
        next(err);
    }
};

// Étape 3: Validation du code OTP et mise à jour du mot de passe
export const forgotPasswordStep3 = async (req: Request, res: Response, next: NextFunction) => {
    const { otp, newPassword } = req.body;
    const { email, phoneNumber } = req.session;

    try {
        // Vérifier que le code OTP saisi correspond à celui envoyé par email
        if (otp !== req.session.otp) {
            return next(new BadRequestException('Code OTP incorrect', ErrorCodes.INVALID_OTP));
        }

        // Générer un nouveau mot de passe hashé
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        // Mettre à jour le mot de passe dans la base de données
        await prisma.user.update({
            where: {
                email,
                phoneNumber,
            },
            data: {
                password: hashedPassword,
            },
        });

        res.json({
            status: 'success',
            message: 'Mot de passe réinitialisé avec succès.',
        });
    } catch (err) {
        next(err);
    }
};
```

### Points clés :

- **Sessions :** Utilisez `req.session` ou une méthode similaire pour stocker temporairement des données entre les requêtes (comme le numéro de téléphone, l'email et le code OTP).
- **Fonctions utilitaires :** Vous aurez besoin de fonctions utilitaires pour générer le code OTP et pour envoyer des emails.
- **Gestion des erreurs :** Ajoutez des messages d'erreur appropriés pour guider l'utilisateur tout au long du processus.
- **Sécurité :** Assurez-vous de sécuriser la gestion des sessions et de vérifier les données entrantes pour éviter les attaques par injection.

En suivant cette approche, vous devriez pouvoir implémenter avec succès le processus de réinitialisation de mot de passe basé sur l'email et le numéro de téléphone pour vos utilisateurs. Assurez-vous de tester chaque étape pour vous assurer que tout fonctionne comme prévu.


















Je comprends, vous souhaitez que le processus de réinitialisation de mot de passe commence par la vérification du numéro de téléphone, puis une fois que le numéro de téléphone est vérifié dans la base de données, vous demandez à l'utilisateur de saisir l'email associé au compte. Ensuite, un code OTP sera envoyé à cet email pour finaliser la réinitialisation du mot de passe. Voici comment vous pouvez implémenter cela :

### Processus de réinitialisation de mot de passe

1. **Vérification du numéro de téléphone :**
   - Demandez à l'utilisateur de saisir son numéro de téléphone.
   - Vérifiez en base de données si ce numéro de téléphone existe.

2. **Saisie de l'email :**
   - Si le numéro de téléphone est valide, demandez à l'utilisateur de saisir l'email associé à son compte.

3. **Envoi du code OTP par email :**
   - Une fois que l'email est saisi et validé, générez un code OTP (One Time Password) aléatoire.
   - Envoyez ce code par email à l'adresse saisie.

4. **Validation du code OTP :**
   - L'utilisateur saisit le code OTP reçu par email pour vérifier son compte.

5. **Mise à jour du mot de passe :**
   - Si le code OTP est validé avec succès, permettez à l'utilisateur de définir un nouveau mot de passe pour son compte.

### Implémentation dans le contrôleur

Voici comment vous pouvez implémenter ces étapes dans votre contrôleur :

```typescript
import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';
import bcrypt from 'bcrypt';
import prisma from '../prisma';
import { sendOTPEmail } from '../utils/emailUtils'; // Fonction pour envoyer l'email avec le code OTP
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
            message: 'Numéro de téléphone vérifié. Veuillez saisir l\'email associé à votre compte pour continuer.',
        });
    } catch (err) {
        next(err);
    }
};

// Étape 2: Envoi du code OTP par email et validation
export const forgotPasswordStep2 = async (req: Request, res: Response, next: NextFunction) => {
    const { email } = req.body;
    const { phoneNumber } = req.session;

    try {
        // Vérifier que le numéro de téléphone est déjà vérifié dans la session
        if (!phoneNumber) {
            return next(new BadRequestException('Numéro de téléphone non vérifié', ErrorCodes.PHONE_NUMBER_NOT_VERIFIED));
        }

        // Vérifier l'email associé au numéro de téléphone
        const user = await prisma.user.findFirst({
            where: {
                phoneNumber,
                email,
            },
        });

        if (!user) {
            return next(new BadRequestException('Email non associé au numéro de téléphone fourni', ErrorCodes.EMAIL_NOT_FOUND));
        }

        // Générer un code OTP
        const otp = generateOTP(); // Fonction à implémenter pour générer le code OTP

        // Envoyer le code OTP par email
        await sendOTPEmail(email, otp); // Fonction à implémenter pour envoyer l'email avec le code OTP

        // Stocker le code OTP dans la session pour la vérification ultérieure
        req.session.otp = otp;

        res.json({
            status: 'success',
            message: 'Email vérifié. Un code OTP a été envoyé à votre adresse email.',
        });
    } catch (err) {
        next(err);
    }
};

// Étape 3: Validation du code OTP et mise à jour du mot de passe
export const forgotPasswordStep3 = async (req: Request, res: Response, next: NextFunction) => {
    const { otp, newPassword } = req.body;
    const { email } = req.session;

    try {
        // Vérifier que le code OTP saisi correspond à celui envoyé par email
        if (otp !== req.session.otp) {
            return next(new BadRequestException('Code OTP incorrect', ErrorCodes.INVALID_OTP));
        }

        // Générer un nouveau mot de passe hashé
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        // Mettre à jour le mot de passe dans la base de données
        await prisma.user.update({
            where: {
                email,
            },
            data: {
                password: hashedPassword,
            },
        });

        res.json({
            status: 'success',
            message: 'Mot de passe réinitialisé avec succès.',
        });
    } catch (err) {
        next(err);
    }
};
```

### Points clés :

- **Sessions :** Utilisez `req.session` ou une méthode similaire pour stocker temporairement des données entre les requêtes, comme le numéro de téléphone, l'email et le code OTP.
- **Fonction utilitaire :** Vous aurez besoin de fonctions pour générer le code OTP (`generateOTP`) et pour envoyer des emails (`sendOTPEmail`).
- **Validation :** Assurez-vous de valider chaque étape du processus pour garantir la sécurité et l'intégrité des données.
- **Messages d'erreur :** Fournissez des messages d'erreur clairs pour guider l'utilisateur en cas de numéro de téléphone, d'email ou de code OTP incorrects.

En suivant cette approche, vous pouvez implémenter un processus de réinitialisation de mot de passe robuste qui permet également de récupérer l'email pour les utilisateurs qui ne l'ont pas fourni initialement. Assurez-vous de tester soigneusement chaque étape pour vous assurer que tout fonctionne correctement dans votre application.














Pour compléter les étapes de réinitialisation de mot de passe et de récupération d'email, voici comment vous pourriez structurer les données JSON que l'utilisateur doit saisir à chaque étape du processus :

### Étapes JSON pour la réinitialisation de mot de passe

#### Étape 1 : Saisie du numéro de téléphone

```json
{
  "phoneNumber": "1234567890"
}
```

#### Étape 2 : Saisie de l'email

```json
{
  "email": "utilisateur@example.com"
}
```

#### Étape 3 : Saisie du code OTP et du nouveau mot de passe

```json
{
  "otp": "123456",
  "newPassword": "nouveaumotdepasse"
}
```

### Points clés à considérer :

- **Validation :** Assurez-vous que chaque champ (numéro de téléphone, email, OTP et nouveau mot de passe) est valide avant de procéder à la prochaine étape.
- **Gestion des erreurs :** Fournissez des messages d'erreur clairs si les données saisies ne sont pas valides ou si une étape précédente n'a pas été complétée correctement.
- **Sécurité :** Utilisez des mécanismes appropriés pour gérer les données sensibles comme le mot de passe et le code OTP (par exemple, le hachage du mot de passe et l'expiration du code OTP).

En utilisant ces structures JSON et en suivant les étapes décrites précédemment dans le contrôleur, vous pouvez mettre en place un processus sécurisé et convivial pour la réinitialisation de mot de passe, tout en permettant la récupération de l'email pour les utilisateurs qui ne l'ont pas initialement fourni. Assurez-vous de tester soigneusement chaque étape pour vous assurer que tout fonctionne correctement dans votre application.



























Je comprends mieux maintenant. Vous avez deux types d'utilisateurs dans votre application : les nouveaux utilisateurs qui auront un email associé à leur compte dès leur inscription, et les anciens utilisateurs qui n'ont pas d'email associé et qui devront fournir leur email lors du processus de réinitialisation de mot de passe.

Pour gérer cette distinction dans le processus de réinitialisation de mot de passe, vous pouvez procéder comme suit :

### Processus de réinitialisation de mot de passe différencié

#### Pour les nouveaux utilisateurs (avec email déjà associé) :

1. **Saisie de l'identifiant (email ou numéro de téléphone) :**
   - L'utilisateur saisit son email ou son numéro de téléphone.
   - Vérifiez en base de données si l'identifiant existe.

2. **Envoi du code OTP ou lien de réinitialisation :**
   - Si l'identifiant est valide, envoyez un code OTP par email ou un lien de réinitialisation directement à l'email associé.

3. **Validation du code OTP ou du lien de réinitialisation :**
   - L'utilisateur utilise le code OTP reçu par email ou le lien pour valider son compte et accéder à la réinitialisation de mot de passe.

#### Pour les anciens utilisateurs (sans email associé) :

1. **Saisie du numéro de téléphone :**
   - L'utilisateur saisit son numéro de téléphone.
   - Vérifiez en base de données si le numéro de téléphone existe pour un utilisateur ancien.

2. **Saisie de l'email :**
   - Si le numéro de téléphone est valide, demandez à l'utilisateur de saisir l'email qu'il souhaite associer à son compte.

3. **Envoi du code OTP par email :**
   - Une fois l'email saisi et validé, envoyez un code OTP à cet email pour finaliser la réinitialisation de mot de passe.

4. **Validation du code OTP et mise à jour du mot de passe :**
   - L'utilisateur utilise le code OTP reçu par email pour valider son compte et peut ensuite définir un nouveau mot de passe.

### Implémentation dans le contrôleur

Voici comment vous pourriez structurer les fonctions dans votre contrôleur pour gérer les deux types d'utilisateurs :

```typescript
import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';
import bcrypt from 'bcrypt';
import prisma from '../prisma';
import { sendOTPEmail } from '../utils/emailUtils'; // Fonction pour envoyer l'email avec le code OTP
import { sendOTPSMS } from '../utils/smsUtils'; // Fonction pour envoyer le SMS avec le code OTP
import { BadRequestException, ErrorCodes } from '../exceptions';

// Pour les nouveaux utilisateurs avec email associé
export const forgotPasswordForNewUser = async (req: Request, res: Response, next: NextFunction) => {
    const { identify } = req.body; // email ou numéro de téléphone

    try {
        // Vérifiez si l'identifiant (email ou numéro de téléphone) existe
        const user = await prisma.user.findFirst({
            where: {
                OR: [
                    { email: identify },
                    { phoneNumber: identify }
                ]
            }
        });

        if (!user) {
            return next(new BadRequestException('Utilisateur non trouvé', ErrorCodes.USER_NOT_FOUND));
        }

        // Générer et envoyer le code OTP par email (ou lien de réinitialisation)
        const otp = generateOTP(); // Fonction à implémenter pour générer le code OTP
        await sendOTPEmail(user.email, otp); // Fonction à implémenter pour envoyer l'email avec le code OTP

        // Stocker le code OTP dans la session pour la vérification ultérieure
        req.session.otp = otp;
        req.session.userId = user.id; // Stocker l'ID de l'utilisateur pour la mise à jour du mot de passe

        res.json({
            status: 'success',
            message: 'Un code OTP a été envoyé à votre adresse email pour réinitialiser votre mot de passe.',
        });
    } catch (err) {
        next(err);
    }
};

// Pour les anciens utilisateurs sans email associé
export const forgotPasswordForOldUser = async (req: Request, res: Response, next: NextFunction) => {
    const { phoneNumber, email } = req.body;

    try {
        // Vérifiez si le numéro de téléphone existe pour un utilisateur ancien
        const user = await prisma.user.findFirst({
            where: {
                phoneNumber,
            },
        });

        if (!user) {
            return next(new BadRequestException('Numéro de téléphone non trouvé', ErrorCodes.PHONE_NUMBER_NOT_FOUND));
        }

        // Demander à l'utilisateur de saisir l'email pour association au compte
        if (!user.email) {
            // Mettre à jour l'email dans la base de données
            await prisma.user.update({
                where: {
                    id: user.id,
                },
                data: {
                    email,
                },
            });
        }

        // Générer et envoyer le code OTP par email
        const otp = generateOTP(); // Fonction à implémenter pour générer le code OTP
        await sendOTPEmail(email, otp); // Fonction à implémenter pour envoyer l'email avec le code OTP

        // Stocker le code OTP dans la session pour la vérification ultérieure
        req.session.otp = otp;
        req.session.userId = user.id; // Stocker l'ID de l'utilisateur pour la mise à jour du mot de passe

        res.json({
            status: 'success',
            message: 'Un code OTP a été envoyé à votre nouvelle adresse email pour réinitialiser votre mot de passe.',
        });
    } catch (err) {
        next(err);
    }
};

// Étape de validation du code OTP et mise à jour du mot de passe (commune)
export const validateOTPAndUpdatePassword = async (req: Request, res: Response, next: NextFunction) => {
    const { otp, newPassword } = req.body;
    const { userId } = req.session;

    try {
        // Vérifier que le code OTP saisi correspond à celui stocké en session
        if (otp !== req.session.otp) {
            return next(new BadRequestException('Code OTP incorrect', ErrorCodes.INVALID_OTP));
        }

        // Générer un nouveau mot de passe hashé
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        // Mettre à jour le mot de passe dans la base de données
        await prisma.user.update({
            where: {
                id: userId,
            },
            data: {
                password: hashedPassword,
            },
        });

        res.json({
            status: 'success',
            message: 'Mot de passe réinitialisé avec succès.',
        });
    } catch (err) {
        next(err);
    }
};
```

### Points clés :

- **Distinction entre nouveaux et anciens utilisateurs :** Utilisez des fonctions de contrôleur distinctes (`forgotPasswordForNewUser` et `forgotPasswordForOldUser`) pour gérer les différents scénarios de réinitialisation de mot de passe.
- **Gestion des sessions :** Utilisez `req.session` pour stocker temporairement l'ID de l'utilisateur et le code OTP entre les étapes du processus.
- **Sécurité :** Utilisez des mécanismes sécurisés pour générer et vérifier le code OTP, ainsi que pour hacher le nouveau mot de passe.
- **Messages d'erreur :** Fournissez des messages d'erreur adaptés aux différentes situations, comme un utilisateur non trouvé ou un code OTP incorrect.

En implémentant ces ajustements, vous pouvez gérer efficacement les processus de réinitialisation de mot de passe pour les nouveaux et anciens utilisateurs dans votre application, en prenant en compte la présence ou l'absence d'email associé aux comptes des utilisateurs. Assurez-vous de tester chaque étape pour garantir que tout fonctionne correctement dans votre application.











































Votre idée est bonne et elle simplifie le processus en utilisant le numéro de téléphone comme point de départ pour vérifier si l'utilisateur dispose déjà d'un email associé à son compte ou non. Voici comment vous pouvez implémenter cette approche :

### Processus de réinitialisation de mot de passe basé sur l'idée proposée :

1. **Vérification du numéro de téléphone :**
   - L'utilisateur saisit son numéro de téléphone.
   - Vous vérifiez en base de données si ce numéro de téléphone existe.

2. **Décision basée sur l'association email-numéro de téléphone :**
   - Si l'utilisateur a un email associé à son compte, envoyez directement un code OTP pour réinitialiser le mot de passe.
   - Si aucun email n'est associé au numéro de téléphone, demandez à l'utilisateur de saisir son email pour l'associer au compte.

3. **Envoi du code OTP :**
   - Dans les deux cas (avec ou sans email associé), envoyez un code OTP à l'email enregistré ou nouvellement saisi pour finaliser la réinitialisation du mot de passe.

4. **Validation du code OTP et mise à jour du mot de passe :**
   - L'utilisateur utilise le code OTP reçu par email pour valider son compte et peut ensuite définir un nouveau mot de passe.

### Implémentation dans le contrôleur

Voici comment vous pourriez structurer les fonctions dans votre contrôleur pour implémenter cette approche :

```typescript
import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';
import bcrypt from 'bcrypt';
import prisma from '../prisma';
import { sendOTPEmail } from '../utils/emailUtils'; // Fonction pour envoyer l'email avec le code OTP
import { BadRequestException, ErrorCodes } from '../exceptions';

// Processus de réinitialisation de mot de passe
export const forgotPassword = async (req: Request, res: Response, next: NextFunction) => {
    const { phoneNumber, email } = req.body;

    try {
        // Vérifier si le numéro de téléphone existe pour un utilisateur
        const user = await prisma.user.findFirst({
            where: {
                phoneNumber,
            },
        });

        if (!user) {
            return next(new BadRequestException('Numéro de téléphone non trouvé', ErrorCodes.PHONE_NUMBER_NOT_FOUND));
        }

        // Vérifier si l'utilisateur a déjà un email associé à son compte
        if (user.email) {
            // Envoyer le code OTP par email associé pour la réinitialisation de mot de passe
            const otp = generateOTP(); // Fonction à implémenter pour générer le code OTP
            await sendOTPEmail(user.email, otp); // Fonction à implémenter pour envoyer l'email avec le code OTP

            // Stocker le code OTP dans la session pour la vérification ultérieure
            req.session.otp = otp;
            req.session.userId = user.id; // Stocker l'ID de l'utilisateur pour la mise à jour du mot de passe

            return res.json({
                status: 'success',
                message: 'Un code OTP a été envoyé à votre adresse email pour réinitialiser votre mot de passe.',
            });
        }

        // Si aucun email n'est associé, demander à l'utilisateur de saisir son email
        // Ceci pourrait être une étape supplémentaire dans votre application

        // Exemple : retourner un message demandant de saisir l'email pour associer au compte

        res.json({
            status: 'pending',
            message: 'Veuillez saisir votre email pour associer au compte et recevoir un code OTP pour réinitialiser votre mot de passe.',
        });

    } catch (err) {
        next(err);
    }
};

// Étape de validation du code OTP et mise à jour du mot de passe
export const validateOTPAndUpdatePassword = async (req: Request, res: Response, next: NextFunction) => {
    const { otp, newPassword } = req.body;
    const { userId } = req.session;

    try {
        // Vérifier que le code OTP saisi correspond à celui stocké en session
        if (otp !== req.session.otp) {
            return next(new BadRequestException('Code OTP incorrect', ErrorCodes.INVALID_OTP));
        }

        // Générer un nouveau mot de passe hashé
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        // Mettre à jour le mot de passe dans la base de données
        await prisma.user.update({
            where: {
                id: userId,
            },
            data: {
                password: hashedPassword,
            },
        });

        res.json({
            status: 'success',
            message: 'Mot de passe réinitialisé avec succès.',
        });
    } catch (err) {
        next(err);
    }
};
```

### Points clés :

- **Simplicité du processus :** Utilisez le numéro de téléphone pour déterminer si un email est déjà associé au compte de l'utilisateur avant de procéder à l'envoi du code OTP.
- **Flexibilité :** Si aucun email n'est associé, vous pouvez ajouter une étape supplémentaire dans votre application pour demander à l'utilisateur de saisir son email.
- **Gestion des sessions :** Utilisez `req.session` pour stocker temporairement l'ID de l'utilisateur et le code OTP entre les étapes du processus.
- **Sécurité :** Utilisez des mécanismes sécurisés pour générer et vérifier le code OTP, ainsi que pour hacher le nouveau mot de passe.
- **Messages d'erreur :** Fournissez des messages d'erreur adaptés si le numéro de téléphone n'est pas trouvé ou si le code OTP est incorrect.

Cette approche devrait répondre à votre besoin de gérer à la fois les nouveaux utilisateurs avec un email associé dès l'inscription, ainsi que les anciens utilisateurs qui peuvent choisir d'associer un email lors de la réinitialisation de leur mot de passe. Assurez-vous de tester soigneusement chaque étape pour garantir que tout fonctionne correctement dans votre application.