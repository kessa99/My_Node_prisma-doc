Pour éviter la répétition de code dans votre contrôleur `userLoginCtrl`, vous pouvez organiser votre logique de manière à séparer les différentes étapes de vérification et de traitement. Cela rendra votre code plus lisible, maintenable et réutilisable. Voici comment vous pouvez le refactoriser :

1. **Extraction des Fonctions de Vérification** : Créez des fonctions distinctes pour gérer chaque étape de vérification et de traitement. Cela vous permettra de réutiliser facilement le code et de réduire la duplication.

2. **Utilisation des Fonctions Extractées dans le Contrôleur** : Appelez ces fonctions extractées dans votre contrôleur principal (`userLoginCtrl`) pour effectuer les différentes étapes de vérification et de traitement en fonction des conditions.

Voici comment vous pourriez procéder :

### Extraction des Fonctions de Vérification

```typescript
// Fonction pour vérifier l'existence de l'utilisateur et les détails de connexion
const verifyUserAndLogin = async (identify: string, password: string, res: Response, next: NextFunction) => {
    try {
        const user = await prisma.user.findFirst({
            where: {
                OR: [
                    { email: identify },
                    { phoneNumber: identify }
                ],
            },
            include: {
                role: true
            }
        });

        if (!user) {
            return next(new BadRequestException('Cet utilisateur n\'existe pas, veuillez créer un compte!', ErrorCodes.USER_NOT_FOUND));
        }

        if (identify === user.phoneNumber) {
            return handlePhoneLogin(user, password, res, next);
        }

        if (identify === user.email) {
            return handleEmailLogin(user, password, res, next);
        }

        // Par défaut, retourner une erreur si l'identification ne correspond ni à un email ni à un numéro de téléphone
        return next(new BadRequestException('Identifiant invalide', ErrorCodes.INVALID_INPUT));
    } catch (err) {
        next(err);
    }
};

// Fonction pour gérer la connexion via le numéro de téléphone
const handlePhoneLogin = async (user: any, password: string, res: Response, next: NextFunction) => {
    if (!user.email) {
        return next(new BadRequestException('Veuillez fournir votre email pour associer au compte et recevoir un lien de réinitialisation de mot de passe', ErrorCodes.EMAIL_REQUIRED));
    }

    if (!user.emailVerified) {
        await sendOTPEmail(user.email, generateOTP());
        return res.status(201).json({
            status: 'pending',
            message: 'Veuillez vérifier votre email pour l\'authentification.'
        });
    }

    return handleSuccessfulLogin(user, password, res, next);
};

// Fonction pour gérer la connexion via l'email
const handleEmailLogin = async (user: any, password: string, res: Response, next: NextFunction) => {
    if (!user.emailVerified) {
        await sendOTPEmail(user.email, generateOTP());
        return res.status(201).json({
            status: 'pending',
            message: 'Veuillez vérifier votre email pour l\'authentification.'
        });
    }

    return handleSuccessfulLogin(user, password, res, next);
};

// Fonction pour traiter une connexion réussie
const handleSuccessfulLogin = async (user: any, password: string, res: Response, next: NextFunction) => {
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
        return next(new BadRequestException('Mot de passe incorrect!', ErrorCodes.INCORRECT_PASSWORD));
    }

    const updatedUser = await prisma.user.update({
        where: { id: user.id },
        data: {
            status: 'active',
            lastLogin: new Date()
        }
    });

    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

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
            phoneNumber: user.phoneNumber,
            role: user.role ? user.role.name : 'Role non trouvé',
            status: updatedUser.status,
            isSuperAdmin: updatedUser.isSuperAdmin,
            isAdmin: updatedUser.isAdmin,
            isBlocked: updatedUser.isBlocked,
            token: {
                accessToken,
                refreshToken
            }
        }
    });
};

// Fonction utilitaire pour générer un OTP
const generateOTP = () => {
    return crypto.randomBytes(3).toString('hex');
};
```

### Contrôleur `userLoginCtrl` Refactorisé

```typescript
export const userLoginCtrl = async (req: Request, res: Response, next: NextFunction) => {
    const { identify, password } = req.body;

    if (!identify || !password) {
        return next(new BadRequestException('Identifiant et mot de passe sont nécessaires', ErrorCodes.INVALID_INPUT));
    }

    await verifyUserAndLogin(identify, password, res, next);
};
```

### Explications

- **`verifyUserAndLogin`**: Cette fonction centrale vérifie d'abord l'existence de l'utilisateur en fonction de l'`identify` (qui peut être un email ou un numéro de téléphone). Ensuite, elle détermine si l'utilisateur utilise un numéro de téléphone ou un email pour se connecter et appelle les fonctions appropriées (`handlePhoneLogin` ou `handleEmailLogin`) pour effectuer les vérifications nécessaires et gérer la connexion.
  
- **`handlePhoneLogin` et `handleEmailLogin`**: Ces fonctions gèrent respectivement les cas où l'utilisateur utilise un numéro de téléphone ou un email pour se connecter. Elles vérifient si l'email est associé et/ou vérifié, envoient un OTP si nécessaire, puis appellent `handleSuccessfulLogin` pour finaliser la connexion si toutes les vérifications sont passées avec succès.

- **`handleSuccessfulLogin`**: Cette fonction est appelée lorsque l'utilisateur a passé toutes les vérifications et que le mot de passe est valide. Elle met à jour le statut de l'utilisateur, génère les tokens d'accès et de rafraîchissement, puis renvoie la réponse JSON avec les données de l'utilisateur et les tokens.

En résumé, ce refactoring simplifie votre contrôleur principal en décomposant la logique en fonctions réutilisables et spécifiques, améliorant ainsi la lisibilité, la maintenabilité et la réutilisabilité de votre code. Assurez-vous de personnaliser les messages d'erreur, les codes d'erreur et les autres détails selon les besoins spécifiques de votre application.






























Pour intégrer la nouvelle logique refactorisée dans votre route, vous devez simplement appeler la fonction `userLoginCtrl` dans votre définition de route. Voici comment vous pouvez procéder :

### Exemple de Route avec Express

Assumons que vous utilisez Express pour gérer vos routes. Voici comment vous pouvez intégrer votre contrôleur `userLoginCtrl` refactorisé :

```typescript
import express from 'express';
import { userLoginCtrl } from './controllers/userController'; // Assurez-vous d'importer correctement votre contrôleur

const router = express.Router();

// Route pour la connexion de l'utilisateur
router.post('/login', userLoginCtrl);

export default router;
```

### Explications

1. **Import du Contrôleur** : Vous devez importer votre contrôleur `userLoginCtrl` depuis votre fichier où il est défini. Assurez-vous que le chemin d'importation (`'./controllers/userController'`) correspond à l'emplacement réel de votre fichier contenant le contrôleur.

2. **Définition de la Route** : Utilisez `express.Router()` pour créer une instance de routeur dans Express. Ensuite, définissez la route POST `/login` qui appelle directement votre contrôleur `userLoginCtrl` lorsque des requêtes POST sont reçues sur cette route.

3. **Export du Routeur** : Exportez le routeur afin qu'il puisse être intégré dans votre application principale Express (ou utilisé comme un module dans d'autres fichiers, selon votre structure).

### Utilisation dans votre Application Express principale

Dans votre application Express principale (habituellement dans votre fichier `app.ts` ou `index.ts`), vous devez intégrer ce routeur comme suit :

```typescript
import express from 'express';
import userRouter from './routes/userRoutes'; // Assurez-vous d'importer correctement votre routeur

const app = express();

// Middleware pour parser le corps des requêtes JSON
app.use(express.json());

// Middleware pour gérer les routes liées aux utilisateurs
app.use('/api/users', userRouter);

// Autres middlewares et configurations...

// Démarrage du serveur Express
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Serveur en écoute sur le port ${PORT}`);
});
```

### Explications

- **Importation du Routeur** : Importez le routeur `userRouter` que vous avez défini précédemment.

- **Utilisation du Middleware de Routeur** : Utilisez `app.use('/api/users', userRouter)` pour monter votre routeur sur le chemin `/api/users`. Cela signifie que toutes les routes définies dans `userRouter` seront préfixées par `/api/users`.

- **Autres Configurations** : Vous pouvez ajouter d'autres middlewares et configurations nécessaires à votre application Express.

- **Démarrage du Serveur** : Enfin, utilisez `app.listen(PORT, ...)` pour démarrer votre serveur Express et écouter les connexions entrantes sur le port spécifié (`PORT`).

En résumé, en intégrant votre contrôleur refactorisé dans un routeur Express et en l'important dans votre application principale, vous organisez efficacement votre code et suivez les bonnes pratiques pour structurer une application web basée sur Express. Assurez-vous d'adapter cela à votre structure de projet et aux besoins spécifiques de votre application.



























































Oui, il est tout à fait possible de structurer votre API de manière à renvoyer des réponses spécifiques correspondant à chaque étape du processus d'authentification. Cela permet à votre front-end de savoir comment réagir en fonction des différentes conditions rencontrées lors de l'authentification.

Voici comment vous pouvez structurer votre API pour cela :

### Structure de l'API pour l'Authentification

1. **Endpoints** :
   - Créez des endpoints spécifiques pour gérer différentes parties du processus d'authentification. Par exemple :
     - `/api/auth/login` : Endpoint principal pour l'authentification.
     - `/api/auth/verify-email` : Endpoint pour vérifier l'email avec OTP.
     - `/api/auth/reset-password` : Endpoint pour réinitialiser le mot de passe.
     - `/api/auth/send-otp` : Endpoint pour envoyer un nouvel OTP.

2. **Réponses Structurées** :
   - Chaque endpoint devrait renvoyer une réponse structurée adaptée à la situation :
     - Utilisez des codes de statut HTTP appropriés (200 OK, 400 Bad Request, etc.).
     - Incluez des messages clairs dans les réponses JSON pour indiquer ce que le front-end doit faire ensuite.
     - Fournissez des détails supplémentaires si nécessaire, comme des messages d'erreur détaillés ou des données supplémentaires sur l'utilisateur connecté.

3. **Gestion des Erreurs** :
   - Assurez-vous de gérer correctement les erreurs en renvoyant des réponses appropriées avec les bons codes d'erreur et des messages explicatifs. Cela aide le front-end à comprendre pourquoi une requête a échoué et comment corriger le problème.

### Exemple d'implémentation

Voici un exemple simplifié de la façon dont vous pourriez implémenter votre API pour gérer l'authentification avec des réponses structurées :

```typescript
import express, { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcrypt';
import crypto from 'crypto';
import { prisma } from './prisma'; // Assurez-vous d'importer correctement votre instance de Prisma
import {
    BadRequestException,
    ErrorCodes,
    ErrorCode,
} from './exceptions'; // Assurez-vous d'importer vos exceptions personnalisées et codes d'erreur
import {
    generateAccessToken,
    generateRefreshToken,
    sendOTPEmail,
} from './utils'; // Assurez-vous d'importer vos fonctions utilitaires

const router = express.Router();

// Endpoint pour la connexion
router.post('/login', async (req: Request, res: Response, next: NextFunction) => {
    const { identify, password } = req.body;

    // Vérifier si l'identifiant et le mot de passe sont fournis
    if (!identify || !password) {
        return res.status(400).json({
            status: 'error',
            message: 'Identifiant et mot de passe sont nécessaires',
        });
    }

    try {
        // Rechercher l'utilisateur par email ou numéro de téléphone
        const user = await prisma.user.findFirst({
            where: {
                OR: [{ email: identify }, { phoneNumber: identify }],
            },
            include: {
                role: true,
            },
        });

        // Vérifier si l'utilisateur existe
        if (!user) {
            return res.status(404).json({
                status: 'error',
                message: 'Cet utilisateur n\'existe pas, veuillez créer un compte!',
            });
        }

        // Vérifier si l'identifiant correspond au numéro de téléphone de l'utilisateur
        if (identify === user.phoneNumber) {
            // Vérifier si un email est associé à ce numéro de téléphone
            if (user.email) {
                // Vérifier si l'email est vérifié
                if (user.emailVerified) {
                    // Vérifier le mot de passe
                    const validatePassword = await bcrypt.compare(password, user.password);
                    if (!validatePassword) {
                        return res.status(400).json({
                            status: 'error',
                            message: 'Mot de passe incorrect!',
                        });
                    }

                    // Mettre à jour le statut de l'utilisateur
                    await prisma.user.update({
                        where: { id: user.id },
                        data: {
                            status: 'active',
                            lastLogin: new Date(),
                        },
                    });

                    // Générer les tokens d'accès et de rafraîchissement
                    const accessToken = generateAccessToken(user);
                    const refreshToken = generateRefreshToken(user);

                    // Enregistrer le token de rafraîchissement
                    await prisma.refreshTokens.create({
                        data: {
                            hashedToken: refreshToken,
                            userId: user.id,
                        },
                    });

                    // Répondre avec succès
                    return res.status(200).json({
                        status: 'success',
                        data: {
                            firstname: user.firstname,
                            lastname: user.lastname,
                            email: user.email,
                            phoneNumber: user.phoneNumber,
                            role: user.role ? user.role.name : 'Role non trouvé',
                            token: {
                                accessToken,
                                refreshToken,
                            },
                        },
                    });
                }

                // Si l'email n'est pas vérifié, envoyer un nouvel OTP
                const otp = crypto.randomBytes(3).toString('hex');
                const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

                await prisma.user.update({
                    where: { id: user.id },
                    data: {
                        email: user.email,
                        otpVerifications: {
                            create: {
                                otp,
                                otpExpires,
                            },
                        },
                    },
                });

                // Envoyer l'email de vérification
                await sendOTPEmail(user.email, otp);

                // Répondre avec un statut indiquant que l'email doit être vérifié
                return res.status(201).json({
                    status: 'pending',
                    message: 'Veuillez vérifier votre email pour l\'authentification de ce dernier.',
                });
            }

            // Si aucun email n'est associé à ce numéro de téléphone, demander à l'utilisateur de fournir son email
            return res.status(400).json({
                status: 'error',
                message: 'Veuillez fournir votre email pour associer au compte et recevoir un lien de réinitialisation de mot de passe',
            });
        }

        // Si l'identifiant correspond à l'email de l'utilisateur
        if (identify === user.email) {
            // Vérifier si l'email est vérifié
            if (!user.emailVerified) {
                // Si l'email n'est pas vérifié, envoyer un nouvel OTP
                const otp = crypto.randomBytes(3).toString('hex');
                const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

                await prisma.user.update({
                    where: { id: user.id },
                    data: {
                        email: user.email,
                        otpVerifications: {
                            create: {
                                otp,
                                otpExpires,
                            },
                        },
                    },
                });

                // Envoyer l'email de vérification
                await sendOTPEmail(user.email, otp);

                // Répondre avec un statut indiquant que l'email doit être vérifié
                return res.status(201).json({
                    status: 'pending',
                    message: 'Veuillez vérifier votre email pour l\'authentification de ce dernier.',
                });
            }

            // Si l'email est vérifié, générer les tokens d'accès et de rafraîchissement
            await prisma.user.update({
                where: { id: user.id },
                data: {
                    status: 'active',
                    lastLogin: new Date(),
                },
            });

            const accessToken = generateAccessToken(user);
            const refreshToken = generateRefreshToken(user);

            await prisma.refreshTokens.create({
                data: {
                    hashedToken: refreshToken,
                    userId: user.id,
                },
            });

            // Répondre avec succès
            return res.status(200).json({
                status: 'success',
                data: {
                    firstname: user.firstname,
                    lastname: user.lastname,
                    email: user.email,
                    phoneNumber: user.phoneNumber,
                    role: user.role ? user.role.name : 'Role non trouvé',
                    token: {
                        accessToken,
                        refreshToken,
                    },
                },
            });
        }

        // Si aucune condition précédente n'a été remplie, retourner une erreur générique
        return res.status(400).json({
            status: 'error',
            message: 'Identifiant invalide. Veuillez fournir un email ou un numéro de téléphone valide.',
        });
    } catch (err) {
        next(err);
    }
});

// Autres endpoints pour la vérification d'email, la réinitialisation du mot de passe, etc.
// Exemple: /api/auth/verify-email, /api/auth/reset-password, /api/auth/send-otp

export default router;
```

### Explication

- **Structure de l'API** : Dans cet exemple, j'ai créé un endpoint `/api/auth/login` pour gérer le processus de connexion. Ce endpoint renvoie des réponses structurées en fonction de chaque scénario (succès, erreur, besoin de vérification par OTP, etc.).
  
- **Réponses Structurées** : Chaque réponse JSON contient un `status` pour indiquer le statut de l'opération (