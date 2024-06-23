# BIENVENU DANS LE PROJET DE EGO TRANSFERT

## ETAPE 1: CONFIGURATION DE BASE
### Initialisation projet avec prisma
```javascript
npx prisma init
```
**Attention**🚩
assure toi de pouvoir avoir la version nodejs superieur a 16.


### Initialisation projet typecript
```javascript
npm init -y
npm install typescript ts-node @types/node --save-dev
```

### Initialisation typescript
```javascript
npx tsc --init
```
### Install le client prisma pour les dependance en dev dans le projet
```javascript
npm install prisma --save-dev
```
### installation de express
```javascript
npm install express
npm install @types/express --save-dev
```
### Installation Nodemon
```javascript
npm install nodemon --save-dev
```
```javascript
npm install @prisma/client
```
```javascript
npm i express dotenv
```



## ETAPE 2: configuration dans le package.json
De base nous avons
```javascript
"scripts": {
    "test": "echo \"Error: no test specified\" && exit 1"
},
```

Ensuite nous passons a ceci
```javascript
  "scripts": {
    "test": "echo \"Error: no test specified\" && exit 1",
    "dev": "nodemon src/index.ts",
    "migrate": "prisma migrate dev"
  },
```
## ETAPE 2: CONNECTION A LA BASE DE DONNEE MONGODB

Dans le `schema.prisma` On a:
```javascript
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

Il doit maintenant etre change en:
```javascript
datasource db {
  provider = "mongodb"
  url      = env("DATABASE_URL")
}
```

## ETAPE 2: CREATION DE L'ARCHITECTURE DE BASE DANS LE INDEX.TS

```javascript
const express = require('express');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`Server is running on port http://localhost:${PORT}`);
});
```
```javascript
1- configuration installation
2- simple connextion server in index.ts
3- connection to ddatabase( updrage index,ts)
4- Prisma generate
5- message de connexion correct a la database
6- simple routes dans le index et test

partie 2

7- creation des fichier routes/users/userRoutes.ts et test

```


### PRISMA GENERATE

```javascript
npx prisma generate
```
**8- inscription**
lorsque l'on fait un 
```javascript
console.log(req.body)
```
nous obtenons une reponse vide. Pour avoir qu'elles sont les elements qui pourront etre qui vont etre pris en compte pour la creation d'un utilisateur on fait comme ceci

**Code v1: Simple creation**

* Register
```javascript
export const userRegisterCtrl = async (req: Request, res: Response) => {
    const { firstname, lastname, email, phone, password } = req.body
    try {
        res.json({
            status: 'success',
            message: 'Inscription reussie'
        })
    } catch (err) {
        const error = err as Error;
        res.json({
            status: 'fail',
            message: error.message
        })
    }
}
```


**Code v2: seconde avance**

* Register
```javascript
export const userRegisterCtrl = async (req: Request, res: Response) => {
    const { firstname, lastname, email, phone, password } = req.body
    console.log('Received data:', { firstname, lastname, email, phone, password });
    try {
        // verifions si l'email exist deja
        const emailFound = await prisma.user.findUnique({
            where: { 
                email: email 
            }
        });
        if (emailFound) {
            return res.json({
                message: 'email existe'
            })
        }
        // Vérifions si le numéro de téléphone existe déjà
        const phoneFound = await prisma.user.findUnique({
            where: {
                phone: phone
            }
        });


        if (phoneFound) {
            return res.json({
                message: 'phone existe'
            })
        }
        // cryptage du mot de passe
        // creation d'un utilisateur
        const newUser = await prisma.user.create({
            data: {
                firstname,
                lastname,
                email,
                phone,
                password
            }
        })
        res.json({
            status: 'success',
            data: newUser
        })
    } catch (err) {
        const error = err as Error;
        res.json({
            status: 'fail',
            message: error.message
        })
    }
}  
```

* Login
```javascript
export const userLoginCtrl = async (req: Request, res: Response) => {
    const { email, password } = req.body
    try {
        const user = await prisma.user.findUnique({
            where: {
                email
            }
        })
        if (!user) {
            return res.json({
                status: 'fail',
                message: 'email incorrect'
            })
        }
        if (user.password !== password) {
            return res.json({
                status: 'fail',
                message: 'mot de passe incorrect'
            })
        }
        res.json({
            status: 'success',
            message: 'Connexion reussie'
        })
    } catch (err) {
        const error = err as Error;
        res.json({
            status: 'fail',
            message: error.message
        })
    }
}
```

* GET ONE USER
```javascript
export const getOneUserCtrl = async (req: Request, res: Response) => {
    const { id } = req.params;
    console.log('Received data:', { id });
    try {
        const user = await prisma.user.findUnique({
            where: {
                id: id
            }
        });
        res.json({
            status: 'success',
            data: {
                firstane: user?.firstname,
                lastname: user?.lastname,
                email: user?.email,
                phone: user?.phone,
                role: user?.role,
                isSuperuser: user?.isSuperuser,
                isblocked: user?.isBlocked
            }
        })
    } catch (err) {
        const error = err as Error;
        res.json({
            status: 'fail',
            message: error.message
        })
    }
}
```

* Get all
```javascript
export const getAllUserCtrl = async (req: Request, res: Response) => {
    try {
        const allUser = await prisma.user.findMany();
        res.json({
            status: 'success',
            data: allUser
        })
    } catch (err) {
        const error = err as Error;
        res.json({
            status: 'fail',
            message: error.message
        })
    }
}
```

* Updata
```javascript
export const updateUserCtrl = async (req: Request, res: Response) => {
    const userId = req.params.id
    const { firstname, lastname, password, email } = req.body
    if (!firstname && !lastname && !email && !password) {
        return res.json({
            status: 'fail',
            message: 'aucune donnee a mettre a jour'
        });
    }
    try {
        // verifier si le user existe
        const user = await prisma.user.findUnique({
            where: {
                id: userId
            }
        });
        if (!user) {
            return res.json({
                status: 'fail',
                message: 'utilisateur non trouve'
            });
        }

        // mettre a jour l'utilisateur
        const updateUser = await prisma.user.update({
            where: {
                id: userId
            },
            data: {
                ...(firstname && { firstname }),
                ...(lastname && { lastname }),
                ...(email && { email }),
                ...(password && { password }),
            }
        });
        console.log('mise a jour reussi')
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
```

```javascript
export const deleteUserCtrl = async (req: Request, res: Response) => {
    const userId = req.params.id
    try {
        await prisma.user.delete({
            where: {
                id: userId
            }
        })
        res.json({
            status: 'success',
            message: 'suppression reussie'
        })
    } catch (err) {
        const error = err as Error;
        res.json({
            status: 'fail',
            message: error.message
        })
    }
}
```


```javascript
import { Router, Request, Response } from 'express';
import {
    getOneUserCtrl,
    getAllUserCtrl,
    updateUserCtrl,
    deleteUserCtrl,
    logoutCtrl,
    updatePasswordCtrl,
} from '../../controllers/userCtrl';

const router = Router();

router.get('/profile/:id', getOneUserCtrl);

router.get('/all/', getAllUserCtrl);

router.put('/update/:id', updateUserCtrl);

router.delete('/delete/:id', deleteUserCtrl)
// updatePasswordCtrl
router.put('/update-password/', updatePasswordCtrl)

router.get('/logout/', logoutCtrl);

export default router;
```


ancien

```javascript
export const getOneUserCtrl = async (req: Request, res: Response) => {
    const { id } = req.params;
    console.log('Received data:', { id });
    try {
        const user = await prisma.user.findUnique({
            where: {
                id: id
            }
        });
        res.json({
            status: 'success',
            data: {
                firstname: user?.firstname,
                lastname: user?.lastname,
                email: user?.email,
                role: user?.role,
                isSuperuser: user?.isSuperuser,
                isblocked: user?.isBlocked
            }
        })
    } catch (err) {
        const error = err as Error;
        res.json({
            status: 'fail',
            message: error.message
        })
    }
}
```

nouveau
```javascript
```
```javascript
```
```javascript
```
```javascript
```
```javascript
```
```javascript
```
```javascript
```
```javascript
```
```javascript
```
```javascript
```
```javascript
```
```javascript
```
```javascript
```
```javascript
```
```javascript
```
```javascript
```
```javascript
```
**9- authentification et authorisation**

```javascript
npm install @prisma/client bcrypt jsonwebtoken uuid
```


Je comprends mieux maintenant. Vous avez raison, rechercher l'utilisateur par son id n'est pas la bonne approche dans ce cas. Puisque vous souhaitez vérifier si le numéro de téléphone est déjà utilisé par un autre utilisateur lors de l'inscription, vous devez effectuer une recherche directe dans la base de données en utilisant le numéro de téléphone comme critère de recherche.

Voici comment vous pouvez le faire :

```typescript
export const userRegisterCtrl = async (req: Request, res: Response) => {
    const { firstname, lastname, email, phone, password } = req.body;

    try {
        // Vérifions si l'email existe déjà
        const emailFound = await prisma.user.findUnique({
            where: { email: email }
        });

        if (emailFound) {
            return res.json({
                status: 'fail',
                message: 'Email existe déjà'
            });
        }

        // Vérifions si le numéro de téléphone existe déjà
        const phoneFound = await prisma.user.findUnique({
            where: { phone: phone }
        });

        if (phoneFound) {
            return res.json({
                status: 'fail',
                message: 'Numéro de téléphone existe déjà'
            });
        }

        // Cryptage du mot de passe
        const hashedPassword = await bcrypt.hash(password, 10);

        // Création d'un utilisateur
        const newUser = await prisma.user.create({
            data: {
                firstname,
                lastname,
                email,
                phone,
                password: hashedPassword
            }
        });

        res.json({
            status: 'success',
            data: newUser
        });
    } catch (err) {
        const error = err as Error;
        res.json({
            status: 'fail',
            message: error.message
        });
    }
};
```

Dans ce code, nous utilisons `prisma.user.findUnique()` pour rechercher un utilisateur par son numéro de téléphone. Si un utilisateur est trouvé avec ce numéro de téléphone, cela signifie que le numéro est déjà utilisé par un autre utilisateur, donc nous renvoyons un message d'échec approprié. Sinon, nous continuons avec la création de l'utilisateur.

Cette approche est la bonne pour s'assurer que le numéro de téléphone est unique pour chaque utilisateur lors de l'inscription. J'espère que cela répond à votre question ! N'hésitez pas si vous avez d'autres interrogations.


Bien sûr, voici un exemple de code pour mettre en œuvre l'authentification JWT avec Prisma en TypeScript, en utilisant à la fois un jeton d'accès (access token) et un jeton de rafraîchissement (refresh token) :

Tout d'abord, vous devez installer les dépendances nécessaires :

```bash
npm install jsonwebtoken bcryptjs
```

Ensuite, voici le code :

```typescript
// userCtrl.ts

import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();

const JWT_SECRET = 'your_secret_key';
const ACCESS_TOKEN_EXPIRATION = '1h';
const REFRESH_TOKEN_EXPIRATION = '7d';

export const registerUser = async (req: Request, res: Response) => {
    try {
        const { email, password } = req.body;

        // Vérifier si l'utilisateur existe déjà
        const existingUser = await prisma.user.findUnique({
            where: { email: email }
        });

        if (existingUser) {
            return res.status(400).json({ message: 'Email already exists' });
        }

        // Hasher le mot de passe
        const hashedPassword = await bcrypt.hash(password, 10);

        // Créer l'utilisateur
        const newUser = await prisma.user.create({
            data: {
                email,
                password: hashedPassword
            }
        });

        res.status(201).json({ message: 'User created successfully' });
    } catch (error) {
        console.error('Error registering user:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

export const loginUser = async (req: Request, res: Response) => {
    try {
        const { email, password } = req.body;

        // Rechercher l'utilisateur par email
        const user = await prisma.user.findUnique({
            where: { email: email }
        });

        // Vérifier si l'utilisateur existe
        if (!user) {
            return res.status(401).json({ message: 'Invalid email or password' });
        }

        // Vérifier le mot de passe
        const passwordMatch = await bcrypt.compare(password, user.password);

        if (!passwordMatch) {
            return res.status(401).json({ message: 'Invalid email or password' });
        }

        // Générer le jeton d'accès
        const accessToken = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: ACCESS_TOKEN_EXPIRATION });

        // Générer le jeton de rafraîchissement
        const refreshToken = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: REFRESH_TOKEN_EXPIRATION });

        res.json({ accessToken, refreshToken });
    } catch (error) {
        console.error('Error logging in user:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};
```

Ce code fournit deux endpoints : un pour l'enregistrement d'un nouvel utilisateur (`registerUser`) et un pour la connexion d'un utilisateur existant (`loginUser`). Lorsqu'un utilisateur se connecte avec succès, il reçoit à la fois un jeton d'accès et un jeton de rafraîchissement.

Assurez-vous de remplacer `'your_secret_key'` par une clé secrète sécurisée dans la variable `JWT_SECRET`. Vous pouvez également ajuster les durées d'expiration des jetons d'accès et de rafraîchissement en modifiant les valeurs des constantes `ACCESS_TOKEN_EXPIRATION` et `REFRESH_TOKEN_EXPIRATION`.








Ce code est un contrôleur qui gère l'action de visualisation du profil d'un utilisateur par un autre utilisateur. Voici une explication étape par étape du code :

1. **Recherche de l'utilisateur original** : Le contrôleur commence par rechercher l'utilisateur original (dont le profil est visualisé) en utilisant l'identifiant passé dans les paramètres de la requête (`req.params.id`). Il utilise `User.findById` pour rechercher cet utilisateur dans la base de données.

2. **Recherche de l'utilisateur qui visualise** : Ensuite, le contrôleur recherche l'utilisateur qui visualise le profil. Il utilise `User.findById` en utilisant `req.userAuth` pour obtenir cet utilisateur. Il est probable que `req.userAuth` soit un middleware précédent qui a extrait l'utilisateur à partir du jeton JWT ou d'autres moyens d'authentification.

3. **Vérification des utilisateurs trouvés** : Le contrôleur vérifie si les deux utilisateurs sont trouvés dans la base de données.

4. **Vérification si l'utilisateur a déjà été visualisé** : Il vérifie si l'utilisateur qui visualise est déjà présent dans le tableau des "viewers" de l'utilisateur original. Pour cela, il utilise la méthode `find` sur le tableau `user.viewers`. Il compare l'identifiant de chaque "viewer" avec l'identifiant de l'utilisateur qui visualise.

5. **Ajout de l'utilisateur visualisant** : Si l'utilisateur qui visualise n'a pas déjà été enregistré comme "viewer", il est ajouté au tableau des "viewers" de l'utilisateur original en utilisant `user.viewers.push(userWhoView._id)`.

6. **Sauvegarde des modifications** : Les modifications apportées à l'utilisateur original sont sauvegardées en appelant `user.save()`.

7. **Réponse de réussite** : Enfin, une réponse JSON est renvoyée indiquant que la visualisation du profil a réussi.

Concernant la ligne que vous avez mentionnée :

```javascript
const isUserAlreadyViewed = user.viewers.find(
    viewer => viewer.toString() === userWhoView._id.toString()
);
```

Cela recherche dans le tableau `user.viewers` si l'identifiant de l'utilisateur qui visualise (`userWhoView._id`) est déjà présent. Il utilise `toString()` pour comparer les identifiants sous forme de chaînes de caractères. Si l'utilisateur est déjà présent dans le tableau, `isUserAlreadyViewed` sera défini sur cet utilisateur, sinon il sera `undefined`.












L'erreur indique que la valeur de `phoneNumber` est `null` dans votre requête. Assurez-vous que le champ `phoneNumber` est inclus dans le corps de la requête (request body) et qu'il n'est pas `null`.

### Solution :

1. **Validation de la Requête** : Ajoutez une validation pour vérifier que tous les champs requis sont présents et ne sont pas `null`.
2. **Utilisation d'Opérateurs Optionnels** : Vous pouvez utiliser des opérateurs optionnels pour mettre à jour uniquement les champs fournis.

### Mise à Jour du Code avec Validation :

```typescript
import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const updateUserCtrl = async (req: Request, res: Response) => {
    const userId = req.params.id;
    const { firstname, lastname, email, phoneNumber, password } = req.body;

    // Validation des champs requis
    if (!userId) {
        return res.status(400).json({ status: 'fail', message: 'User ID is required' });
    }
    if (!firstname && !lastname && !email && !phoneNumber && !password) {
        return res.status(400).json({ status: 'fail', message: 'At least one field is required to update' });
    }

    try {
        // Vérifier si l'utilisateur existe
        const user = await prisma.user.findUnique({
            where: {
                id: userId,
            },
        });

        if (!user) {
            return res.status(404).json({
                status: 'fail',
                message: 'Utilisateur non trouvé',
            });
        }

        // Mettre à jour l'utilisateur avec des champs optionnels
        const updatedUser = await prisma.user.update({
            where: {
                id: userId,
            },
            data: {
                ...(firstname && { firstname }),
                ...(lastname && { lastname }),
                ...(email && { email }),
                ...(phoneNumber && { phone: phoneNumber }),
                ...(password && { password }),
            },
        });

        res.json({
            status: 'success',
            data: updatedUser,
        });
    } catch (err) {
        const error = err as Error;
        res.status(500).json({
            status: 'fail',
            message: error.message,
        });
    }
};
```

### Explications :

1. **Validation des Champs Requis** :
   - Vérifiez que `userId` est fourni.
   - Vérifiez qu'au moins un champ (firstname, lastname, email, phoneNumber, password) est fourni dans le corps de la requête.

2. **Utilisation d'Opérateurs Optionnels** :
   - Utilisez l'opérateur de décomposition `...` pour ajouter des champs uniquement s'ils ne sont pas `null` ou `undefined`. Par exemple, `...(firstname && { firstname })` ajoute `firstname` au champ `data` seulement si `firstname` est une valeur véridique (non `null` ou `undefined`).

Cela permet de mettre à jour seulement les champs fournis et d'éviter des erreurs si certains champs ne sont pas inclus dans la requête.


L'erreur indique que le champ `phoneNumber` est défini comme non nullable dans votre schéma de base de données, mais la valeur fournie est `null`, ce qui est incompatible.

Il semble que votre application s'attend à ce que le champ `phoneNumber` ne soit pas `null`, mais les données que vous envoyez contiennent probablement une valeur `null` pour ce champ.

Pour résoudre ce problème, vous pouvez effectuer les actions suivantes :

1. Vérifiez le contenu de la requête que vous envoyez pour vous assurer que le champ `phoneNumber` est défini et qu'il contient une valeur non nulle.

2. Si le champ `phoneNumber` peut être facultatif, vous pouvez le modifier dans votre schéma Prisma en le déclarant comme nullable (`String?` au lieu de `String`).

3. Assurez-vous que la clé correspondant au champ `phoneNumber` dans le corps de la requête JSON est correctement définie et ne contient pas de valeur `null`.

Une fois que vous avez vérifié et éventuellement corrigé ces points, réessayez d'envoyer la requête et voyez si l'erreur persiste. Si vous rencontrez toujours des problèmes, assurez-vous de fournir plus de détails sur la structure de votre requête et de votre schéma de base de données pour une assistance plus précise.







L'erreur indique que Prisma reçoit une valeur `null` pour le champ `phoneNumber`, mais ce champ est défini comme non nullable dans votre schéma. 

Pour résoudre ce problème, vous pouvez suivre ces étapes :

1. **Corriger la clé `phoneNumber`** :
   Assurez-vous que la clé `phoneNumber` dans votre schéma correspond bien à la clé que vous utilisez dans votre code. Si votre schéma utilise `phone` et non `phoneNumber`, modifiez votre code pour utiliser la bonne clé.

2. **Vérifier la structure de la requête** :
   Assurez-vous que toutes les clés de la requête HTTP sont bien définies et correspondent à ce qui est attendu dans votre base de données.

Voici un exemple mis à jour pour refléter correctement les noms de champs et éviter les erreurs de type null :

### Code mis à jour pour la mise à jour de l'utilisateur

```typescript
import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

export const updateUserCtrl = async (req: Request, res: Response) => {
    const userId = req.params.id;
    const { firstname, lastname, email, phone, password } = req.body;

    try {
        // Vérifier si l'utilisateur existe
        const user = await prisma.user.findUnique({
            where: {
                id: userId
            }
        });

        if (!user) {
            return res.json({
                status: 'fail',
                message: 'utilisateur non trouvé'
            });
        }

        // Mettre à jour l'utilisateur
        const updatedUser = await prisma.user.update({
            where: {
                id: userId
            },
            data: {
                firstname,
                lastname,
                email,
                phone,
                password
            },
        });

        res.json({
            status: 'success',
            data: updatedUser
        });
    } catch (err) {
        const error = err as Error;
        res.json({
            status: 'fail',
            message: error.message
        });
    }
};
```

### Schéma Prisma corrigé

Assurez-vous que votre schéma Prisma est correct et que les champs `phone` et `email` sont définis comme nullable si nécessaire. Voici un exemple :

```prisma
model User {
  id        String   @id @default(auto()) @map("_id") @db.ObjectId
  firstname String?
  lastname  String?
  email     String   @unique
  phone     String   @unique
  password  String
  // autres champs...
}
```

### Assurez-vous que les données envoyées dans la requête ne contiennent pas de `null`

Lorsque vous envoyez une requête pour mettre à jour un utilisateur, assurez-vous que les données ne contiennent pas de valeurs `null` pour des champs qui ne doivent pas l'être. Par exemple :

```json
{
  "firstname": "RITA",
  "lastname": "debo",
  "email": "debo@tt.com",
  "phone": "0022892152921",
  "password": "12345"
}
```

### Testez la mise à jour de l'utilisateur

Avec ces corrections, essayez de mettre à jour un utilisateur en envoyant une requête POST/PUT avec les données appropriées et vérifiez si l'erreur persiste. Assurez-vous également que le champ `phone` est correctement renseigné et n'est pas `null`.



L'erreur indique que Prisma reçoit une valeur `null` pour le champ `phoneNumber`, mais ce champ est défini comme non nullable dans votre schéma. 

Pour résoudre ce problème, vous pouvez suivre ces étapes :

1. **Corriger la clé `phoneNumber`** :
   Assurez-vous que la clé `phoneNumber` dans votre schéma correspond bien à la clé que vous utilisez dans votre code. Si votre schéma utilise `phone` et non `phoneNumber`, modifiez votre code pour utiliser la bonne clé.

2. **Vérifier la structure de la requête** :
   Assurez-vous que toutes les clés de la requête HTTP sont bien définies et correspondent à ce qui est attendu dans votre base de données.

Voici un exemple mis à jour pour refléter correctement les noms de champs et éviter les erreurs de type null :

### Code mis à jour pour la mise à jour de l'utilisateur

```typescript
import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

export const updateUserCtrl = async (req: Request, res: Response) => {
    const userId = req.params.id;
    const { firstname, lastname, email, phone, password } = req.body;

    try {
        // Vérifier si l'utilisateur existe
        const user = await prisma.user.findUnique({
            where: {
                id: userId
            }
        });

        if (!user) {
            return res.json({
                status: 'fail',
                message: 'utilisateur non trouvé'
            });
        }

        // Mettre à jour l'utilisateur
        const updatedUser = await prisma.user.update({
            where: {
                id: userId
            },
            data: {
                firstname,
                lastname,
                email,
                phone,
                password
            },
        });

        res.json({
            status: 'success',
            data: updatedUser
        });
    } catch (err) {
        const error = err as Error;
        res.json({
            status: 'fail',
            message: error.message
        });
    }
};
```

### Schéma Prisma corrigé

Assurez-vous que votre schéma Prisma est correct et que les champs `phone` et `email` sont définis comme nullable si nécessaire. Voici un exemple :

```prisma
model User {
  id        String   @id @default(auto()) @map("_id") @db.ObjectId
  firstname String?
  lastname  String?
  email     String   @unique
  phone     String   @unique
  password  String
  // autres champs...
}
```

### Assurez-vous que les données envoyées dans la requête ne contiennent pas de `null`

Lorsque vous envoyez une requête pour mettre à jour un utilisateur, assurez-vous que les données ne contiennent pas de valeurs `null` pour des champs qui ne doivent pas l'être. Par exemple :

```json
{
  "firstname": "RITA",
  "lastname": "debo",
  "email": "debo@tt.com",
  "phone": "0022892152921",
  "password": "12345"
}
```

### Testez la mise à jour de l'utilisateur

Avec ces corrections, essayez de mettre à jour un utilisateur en envoyant une requête POST/PUT avec les données appropriées et vérifiez si l'erreur persiste. Assurez-vous également que le champ `phone` est correctement renseigné et n'est pas `null`.




Pour un projet comme le vôtre, qui semble impliquer la gestion des utilisateurs et probablement l'authentification, l'utilisation de tokens et de refresh tokens est une approche courante et sécurisée. Voici une explication détaillée de leur fonctionnement et de leur utilisation.

### Token et Refresh Token

#### 1. Token d'Accès (Access Token)
- **Description**: Un access token est un jeton d'authentification à courte durée de vie. Il est utilisé pour accéder aux ressources protégées et pour authentifier les requêtes de l'utilisateur.
- **Durée de vie**: Généralement courte (quelques minutes à quelques heures) pour réduire le risque en cas de compromission.
- **Stockage**: Il est souvent stocké côté client, dans la mémoire ou dans un cookie sécurisé (httpOnly).

#### 2. Refresh Token
- **Description**: Un refresh token est un jeton utilisé pour obtenir un nouveau token d'accès sans nécessiter une nouvelle authentification. Il a une durée de vie plus longue que l'access token.
- **Durée de vie**: Plus longue (jours, semaines ou mois).
- **Stockage**: Il doit être stocké de manière sécurisée côté client, souvent dans un cookie httpOnly pour réduire le risque d'accès par des scripts malveillants.

### Flux de Travail Typique
1. **Authentification Initiale**:
   - L'utilisateur se connecte avec ses identifiants (par exemple, nom d'utilisateur et mot de passe).
   - Le serveur authentifie l'utilisateur et génère un access token et un refresh token.
   - Le serveur envoie les tokens au client.

2. **Accès aux Ressources**:
   - Le client utilise l'access token pour accéder aux ressources protégées.
   - L'access token est envoyé dans l'en-tête `Authorization` de chaque requête HTTP (par exemple, `Authorization: Bearer <access_token>`).

3. **Renouvellement du Token**:
   - Lorsque l'access token expire, le client envoie une requête au serveur avec le refresh token pour obtenir un nouveau access token.
   - Si le refresh token est valide, le serveur génère un nouveau access token et éventuellement un nouveau refresh token.
   - Le client utilise le nouveau access token pour les requêtes futures.

### Sécurisation des Tokens
- **HTTP Only Cookies**: Stocker les tokens dans des cookies HTTP Only pour éviter qu'ils ne soient accessibles via JavaScript.
- **Expiration et Révocation**: Définir des durées d'expiration appropriées et permettre la révocation des tokens en cas de besoin.
- **HTTPS**: Utiliser HTTPS pour chiffrer les communications et protéger les tokens en transit.
- **Scopes et Permissions**: Définir des scopes et des permissions pour les tokens afin de limiter les actions qu'un token peut autoriser.

### Exemple de Mise en Œuvre avec Node.js et Prisma
Voici un exemple simplifié d'implémentation des access et refresh tokens avec Node.js et Prisma:

```javascript
// Installation des dépendances nécessaires
const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const prisma = require('@prisma/client');

const app = express();
app.use(express.json());

// Clés secrètes pour les tokens
const ACCESS_TOKEN_SECRET = 'your-access-token-secret';
const REFRESH_TOKEN_SECRET = 'your-refresh-token-secret';

// Fonction pour générer les tokens
function generateAccessToken(user) {
    return jwt.sign({ userId: user.id }, ACCESS_TOKEN_SECRET, { expiresIn: '15m' });
}

function generateRefreshToken(user) {
    return jwt.sign({ userId: user.id }, REFRESH_TOKEN_SECRET, { expiresIn: '7d' });
}

// Endpoint de login
app.post('/login', async (req, res) => {
    const { email, password } = req.body;
    const user = await prisma.user.findUnique({ where: { email } });

    if (user && await bcrypt.compare(password, user.password)) {
        const accessToken = generateAccessToken(user);
        const refreshToken = generateRefreshToken(user);
        // Enregistrer ou retourner les tokens selon votre logique
        res.json({ accessToken, refreshToken });
    } else {
        res.status(401).send('Email ou mot de passe incorrect');
    }
});

// Endpoint pour rafraîchir le token
app.post('/token', (req, res) => {
    const { token } = req.body;
    if (!token) return res.sendStatus(401);

    jwt.verify(token, REFRESH_TOKEN_SECRET, (err, user) => {
        if (err) return res.sendStatus(403);
        const accessToken = generateAccessToken({ id: user.userId });
        res.json({ accessToken });
    });
});

// Middleware d'authentification
function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) return res.sendStatus(401);

    jwt.verify(token, ACCESS_TOKEN_SECRET, (err, user) => {
        if (err) return res.sendStatus(403);
        req.user = user;
        next();
    });
}

// Exemple d'endpoint protégé
app.get('/protected', authenticateToken, (req, res) => {
    res.send('Accès accordé à l\'utilisateur authentifié');
});

app.listen(3000, () => {
    console.log('Server running on port 3000');
});
```

Dans cet exemple, nous avons:
- Un endpoint `/login` pour l'authentification de l'utilisateur et la génération des tokens.
- Un endpoint `/token` pour renouveler l'access token à l'aide du refresh token.
- Un middleware `authenticateToken` pour protéger les endpoints en vérifiant l'access token.

Cette approche améliore la sécurité en minimisant l'exposition des tokens et en fournissant un mécanisme pour rafraîchir les tokens sans nécessiter une nouvelle authentification complète.






La fonction `main` est utilisée principalement comme point d'entrée pour exécuter des requêtes Prisma et gérer la connexion à la base de données dans des scripts ou des configurations de démarrage simples. Dans un projet de développement backend API plus structuré, comme celui que nous avons décrit, vous n'avez généralement pas besoin de cette fonction `main` car les requêtes Prisma sont exécutées directement dans les contrôleurs et les middlewares.

### Utilisation de `main` dans des Scripts Simples

La fonction `main` est souvent utilisée dans des scripts simples pour des tests rapides ou des tâches spécifiques. Par exemple, si vous voulez initialiser la base de données avec des données de test, vous pouvez écrire un script comme ceci :

```typescript
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    await prisma.user.create({
        data: {
            name: 'Alice',
            email: 'alice@example.com'
        }
    });

    const allUsers = await prisma.user.findMany();
    console.log(allUsers);
}

main()
    .catch(async (e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
```

Dans ce contexte, `main` est utile pour encapsuler l'ensemble des opérations Prisma afin de gérer correctement les erreurs et assurer la déconnexion de la base de données à la fin du script.

### Utilisation de Prisma dans une API Structurée

Dans une API structurée, vous gérez les requêtes Prisma directement dans les contrôleurs et les middlewares. Voici un rappel des différentes parties et leur rôle :

1. **Controllers (`src/controllers/userController.ts`)** :
   - Les contrôleurs contiennent la logique des requêtes Prisma.
   - Exemple : récupérer tous les utilisateurs, créer un nouvel utilisateur, etc.

   ```typescript
   import { Request, Response, NextFunction } from 'express';
   import prisma from '../prisma';

   export const getUsers = async (req: Request, res: Response, next: NextFunction) => {
       try {
           const users = await prisma.user.findMany();
           res.json(users);
       } catch (error) {
           next(error);
       }
   };

   export const createUser = async (req: Request, res: Response, next: NextFunction) => {
       try {
           const { name, email } = req.body;
           const newUser = await prisma.user.create({
               data: { name, email }
           });
           res.status(201).json(newUser);
       } catch (error) {
           next(error);
       }
   };
   ```

2. **Routes (`src/routes/userRoutes.ts`)** :
   - Les routes définissent les points d'entrée de votre API.
   - Exemple : définir les routes pour obtenir tous les utilisateurs, créer un utilisateur, etc.

   ```typescript
   import { Router } from 'express';
   import { getUsers, createUser } from '../controllers/userController';

   const router = Router();

   router.get('/', getUsers);
   router.post('/', createUser);

   export default router;
   ```

3. **Middleware d'Erreur (`src/middlewares/errorHandler.ts`)** :
   - Le middleware d'erreur gère les erreurs globales de l'application.

   ```typescript
   import { Request, Response, NextFunction } from 'express';

   const errorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
       console.error(err);
       res.status(500).json({ message: 'Internal Server Error' });
   };

   export default errorHandler;
   ```

4. **Configuration de l'Application (`src/app.ts`)** :
   - Le fichier de configuration de l'application initialise Express, configure les middlewares et définit les routes.

   ```typescript
   import express from 'express';
   import userRoutes from './routes/userRoutes';
   import errorHandler from './middlewares/errorHandler';

   const app = express();

   app.use(express.json());
   app.use('/users', userRoutes);
   app.use(errorHandler);

   export default app;
   ```

5. **Point d'Entrée (`src/index.ts`)** :
   - Le point d'entrée démarre le serveur.

   ```typescript
   import app from './app';

   const PORT = process.env.PORT || 3000;

   app.listen(PORT, () => {
       console.log(`Server is running on port ${PORT}`);
   });
   ```

### Conclusion

Dans une application structurée de type backend API, les opérations Prisma sont intégrées directement dans les contrôleurs et les middlewares. La fonction `main` est plus adaptée pour des scripts isolés, des tâches ponctuelles ou des tests rapides. Dans le cadre d'une API, vous gérez la connexion à la base de données et les requêtes Prisma au niveau des contrôleurs pour une meilleure organisation et maintenabilité du code.


Créer un middleware `isLogin` pour vérifier si un utilisateur est connecté est une excellente idée. Ce middleware interceptera les requêtes entrantes, vérifiera la validité du token d'accès et permettra l'accès aux routes protégées uniquement si l'utilisateur est authentifié.

Voici comment vous pouvez implémenter un middleware `isLogin` dans votre projet Node.js avec Express et Prisma :

### 1. Installer les Dépendances Nécessaires
Assurez-vous d'avoir les packages nécessaires installés :
```sh
npm install express jsonwebtoken prisma @prisma/client
```

### 2. Créer le Middleware `isLogin`
Le middleware vérifiera la présence du token dans les en-têtes de la requête, le validera et ajoutera les informations de l'utilisateur à la requête pour un usage ultérieur.

```javascript
const jwt = require('jsonwebtoken');

const ACCESS_TOKEN_SECRET = 'your-access-token-secret'; // Remplacez par votre clé secrète

// Middleware isLogin
function isLogin(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.sendStatus(401).json({ message: 'Access Token Manquant' });
    }

    jwt.verify(token, ACCESS_TOKEN_SECRET, (err, user) => {
        if (err) {
            return res.sendStatus(403).json({ message: 'Token Invalide' });
        }

        req.user = user; // Ajoute les informations de l'utilisateur à la requête
        next(); // Passe à la prochaine middleware ou route
    });
}

module.exports = isLogin;
```

### 3. Utiliser le Middleware `isLogin` dans vos Routes
Intégrez le middleware dans vos routes protégées pour vérifier que l'utilisateur est connecté avant de permettre l'accès.

```javascript
const express = require('express');
const app = express();
const isLogin = require('./middlewares/isLogin'); // Chemin vers votre middleware
const prisma = require('@prisma/client');

app.use(express.json());

// Exemple d'endpoint protégé
app.get('/protected', isLogin, (req, res) => {
    res.send('Accès accordé à l\'utilisateur authentifié');
});

// Autre exemple avec une route qui retourne les informations de l'utilisateur connecté
app.get('/profile', isLogin, async (req, res) => {
    try {
        const user = await prisma.user.findUnique({ where: { id: req.user.userId } });
        res.json(user);
    } catch (err) {
        res.status(500).json({ message: 'Erreur interne du serveur' });
    }
});

app.listen(3000, () => {
    console.log('Server running on port 3000');
});
```

### Explications :
1. **Token d'Accès** : Le middleware `isLogin` extrait le token d'accès de l'en-tête `Authorization`.
2. **Validation du Token** : Utilisation de `jwt.verify()` pour vérifier la validité du token. Si le token est invalide ou absent, le middleware renvoie une réponse appropriée.
3. **Ajout d'Informations à la Requête** : Si le

```javascript
```













# JSONWEBTOKEN





Bien sûr ! Voici un résumé des étapes pour implémenter l'authentification JWT avec Prisma et MongoDB en utilisant TypeScript :

### 1. Configuration initiale
- **Installation des dépendances :**
  ```bash
  npm install express prisma @prisma/client bcrypt jsonwebtoken body-parser express-validator
  npm install -D typescript @types/express @types/bcrypt @types/jsonwebtoken @types/body-parser @types/express-validator
  ```

- **Configuration de Prisma :**
  ```bash
  npx prisma init
  ```
  Configurez `schema.prisma` pour utiliser MongoDB et définissez votre modèle `User` et `RefreshTokens`.

### 2. Configuration du projet TypeScript
- **Configuration de `tsconfig.json` :**
  ```json
  {
    "compilerOptions": {
      "target": "ES2020",
      "module": "commonjs",
      "strict": true,
      "esModuleInterop": true,
      "skipLibCheck": true,
      "outDir": "./dist"
    },
    "include": ["src/**/*"]
  }
  ```

### 3. Création des utilitaires JWT
- **Création de `src/utils/tokenJwt/jwt.ts` :**
  ```typescript
  import jwt from 'jsonwebtoken';
  import { User } from '@prisma/client';

  const ACCESS_TOKEN_SECRET = process.env.ACCESS_TOKEN_SECRET || 'youraccesstokensecret';
  const REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET || 'yourrefreshtokensecret';

  interface JwtPayload {
    userId: string;
  }

  export const generateAccessToken = (user: User): string => {
    return jwt.sign({ userId: user.id }, ACCESS_TOKEN_SECRET, { expiresIn: '15m' });
  };

  export const generateRefreshToken = (user: User): string => {
    return jwt.sign({ userId: user.id }, REFRESH_TOKEN_SECRET, { expiresIn: '7d' });
  };

  export const verifyToken = (token: string, secret: string): JwtPayload | null => {
    try {
      return jwt.verify(token, secret) as JwtPayload;
    } catch (error) {
      return null;
    }
  };
  ```

### 4. Création des contrôleurs d'authentification
- **Création de `src/controllers/authController.ts` :**
```typescript
import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import { generateAccessToken, generateRefreshToken } from '../utils/tokenJwt/jwt';
import { validationResult } from 'express-validator';

const prisma = new PrismaClient();

// Controller pour l'inscription des utilisateurs
export const userRegisterCtrl = async (req: Request, res: Response) => {
    // Validation des entrées
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    // Récupération des données du corps de la requête
    const { firstname, lastname, email, phoneNumber, password } = req.body;

    try {
        // Vérification de l'existence de l'email
        const emailFound = await prisma.user.findUnique({
            where: { email: email }
        });
        if (emailFound) {
            return res.status(400).json({ message: 'L\'email existe déjà' });
        }

        // Vérification de l'existence du numéro de téléphone
        const phoneNumberFound = await prisma.user.findUnique({
            where: { phoneNumber: phoneNumber }
        });
        if (phoneNumberFound) {
            return res.status(400).json({ message: 'Le numéro de téléphone existe déjà' });
        }

        // Cryptage du mot de passe
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Création de l'utilisateur dans la base de données
        const newUser = await prisma.user.create({
            data: { firstname, lastname, email, phoneNumber, password: hashedPassword }
        });

        // Génération des tokens JWT
        const accessToken = generateAccessToken(newUser);
        const refreshToken = generateRefreshToken(newUser);

        // Sauvegarde du refresh token dans la base de données
        await prisma.refreshTokens.create({
            data: { hashedToken: refreshToken, userId: newUser.id }
        });

        // Réponse avec les informations de l'utilisateur et les tokens
        res.json({
            status: 'success',
            data: { user: newUser, accessToken, refreshToken }
        });
    } catch (err) {
        // Gestion des erreurs
        const error = err as Error;
        res.status(500).json({ status: 'fail', message: error.message });
    }
};

// Controller pour la connexion des utilisateurs
export const userLoginCtrl = async (req: Request, res: Response) => {
    // Validation des entrées
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    // Récupération des données du corps de la requête
    const { email, password } = req.body;
    
    try {
        // Vérification de l'existence de l'utilisateur par email
        const user = await prisma.user.findUnique({
            where: { email: email }
        });
        if (!user) {
            return res.status(400).json({ status: 'fail', message: 'Email incorrect' });
        }

        // Vérification du mot de passe
        const validatePassword = await bcrypt.compare(password, user.password);
        if (!validatePassword) {
            return res.status(400).json({ status: 'fail', message: 'Mot de passe incorrect' });
        }

        // Génération des tokens JWT
        const accessToken = generateAccessToken(user);
        const refreshToken = generateRefreshToken(user);

        // Sauvegarde du refresh token dans la base de données
        await prisma.refreshTokens.create({
            data: { hashedToken: refreshToken, userId: user.id }
        });

        // Réponse avec les informations de l'utilisateur et les tokens
        res.json({
            status: 'success',
            data: {
                firstname: user.firstname,
                lastname: user.lastname,
                email: user.email,
                role: user.role,
                accessToken,
                refreshToken
            }
        });
    } catch (err) {
        // Gestion des erreurs
        const error = err as Error;
        res.status(500).json({ status: 'fail', message: error.message });
    }
};

  ```

### 5. Création du middleware d'authentification
- **Création de `src/middleware/authMiddleware.ts` :**
  ```typescript
  import { Request, Response, NextFunction } from 'express';
  import { verifyToken } from '../utils/tokenJwt/jwt';

  const ACCESS_TOKEN_SECRET = process.env.ACCESS_TOKEN_SECRET || 'youraccesstokensecret';

  interface JwtPayload {
    userId: string;
  }

  export const authenticateToken = (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (token == null) {
      return res.status(401).json({ message: 'Token manquant' });
    }

    const decoded = verifyToken(token, ACCESS_TOKEN_SECRET);
    if (!decoded) {
      return res.status(403).json({ message: 'Token non valide' });
    }

    (req as any).userId = decoded.userId;
    next();
  };
  ```

### 6. Création des routes
- **Création de `src/routes/authRoutes.ts` :**
  ```typescript
  import { Router } from 'express';
  import { userRegisterCtrl, userLoginCtrl } from '../controllers/authController';
  import { body } from 'express-validator';

  const router = Router();

  router.post(
    '/register',
    [
      body('email').isEmail().withMessage('Email invalide'),
      body('password').isLength({ min: 6 }).withMessage('Le mot de passe doit contenir au moins 6 caractères')
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
  ```

- **Création de `src/routes/userRoutes.ts` :**
  ```typescript
  import { Router } from 'express';
  import { getUserProfile } from '../controllers/userController';
  import { authenticateToken } from '../middleware/authMiddleware';

  const router = Router();

  router.get('/profile', authenticateToken, getUserProfile);

  export default router;
  ```

### 7. Configuration du contrôleur de profil utilisateur
- **Création de `src/controllers/userController.ts` :**
  ```typescript
  import { Request, Response } from 'express';
  import { PrismaClient } from '@prisma/client';

  const prisma = new PrismaClient();

  export const getUserProfile = async (req: Request, res: Response) => {
    const userId = (req as any).userId;

    try {
      const user = await prisma.user.findUnique({
        where: { id: userId }
      });

      if (!user) {
        return res.status(404).json({ status: 'fail', message: 'Utilisateur non trouvé' });
      }

      res.json({
        status: 'success',
        data: {
          firstname: user.firstname,
          lastname: user.lastname,
          email: user.email,
          phoneNumber: user.phoneNumber,
          role: user.role
        }
      });
    } catch (err) {
      const error = err as Error;
      res.status(500).json({ status: 'fail', message: error.message });
    }
  };
  ```

###



















Les messages d'erreur de validation sont conçus pour être utilisés par le front-end afin de fournir des feedbacks clairs aux utilisateurs. Lors de la conception d'une API, vous voulez que les messages d'erreur soient facilement compréhensibles pour que les développeurs front-end puissent les utiliser pour informer les utilisateurs finaux de ce qui doit être corrigé.

Quand vous testez l'API avec des outils comme Postman ou Insomnia, les messages d'erreur de validation apparaîtront dans la réponse JSON. Voici un exemple de ce à quoi cela ressemblera :

### Exemple de test avec Postman ou Insomnia

1. **Configuration de la requête :**
    - Méthode : `POST`
    - URL : `http://votre-api.com/register`
    - Body (format JSON) :
      ```json
      {
          "email": "mauvaisformatemail",
          "password": "123"
      }
      ```

2. **Exécution de la requête :**
    - Si les données envoyées ne respectent pas les règles de validation, la réponse sera comme suit :

      ```json
      {
          "errors": [
              {
                  "msg": "Email invalide",
                  "param": "email",
                  "location": "body"
              },
              {
                  "msg": "Le mot de passe doit contenir au moins 6 caractères",
                  "param": "password",
                  "location": "body"
              }
          ]
      }
      ```

### Mise en place des règles de validation avec `express-validator`

Pour s'assurer que les messages d'erreur s'affichent comme prévu, voici comment vous pouvez mettre en place les règles de validation dans vos routes et contrôleurs.

#### Route d'inscription (`register`)

```typescript
import { body } from 'express-validator';
import express from 'express';
import { userRegisterCtrl } from '../controllers/authController';

const router = express.Router();

router.post('/register', [
    body('email').isEmail().withMessage('Email invalide'),
    body('password').isLength({ min: 6 }).withMessage('Le mot de passe doit contenir au moins 6 caractères'),
    body('phoneNumber').isMobilePhone().withMessage('Numéro de téléphone invalide'),
], userRegisterCtrl);

export default router;
```

#### Route de connexion (`login`)

```typescript
import { body } from 'express-validator';
import express from 'express';
import { userLoginCtrl } from '../controllers/authController';

const router = express.Router();

router.post('/login', [
    body('email').isEmail().withMessage('Email invalide'),
    body('password').isLength({ min: 6 }).withMessage('Le mot de passe doit contenir au moins 6 caractères'),
], userLoginCtrl);

export default router;
```

#### Contrôleur d'inscription

```typescript
import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import { generateAccessToken, generateRefreshToken } from '../utils/tokenJwt/jwt';
import { validationResult } from 'express-validator';

const prisma = new PrismaClient();

// Contrôleur pour l'inscription des utilisateurs
export const userRegisterCtrl = async (req: Request, res: Response) => {
    // Validation des entrées
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { firstname, lastname, email, phoneNumber, password } = req.body;

    try {
        // Vérification de l'existence de l'email
        const emailFound = await prisma.user.findUnique({
            where: { email: email }
        });
        if (emailFound) {
            return res.status(400).json({ message: 'L\'email existe déjà' });
        }

        // Vérification de l'existence du numéro de téléphone
        const phoneNumberFound = await prisma.user.findUnique({
            where: { phoneNumber: phoneNumber }
        });
        if (phoneNumberFound) {
            return res.status(400).json({ message: 'Le numéro de téléphone existe déjà' });
        }

        // Cryptage du mot de passe
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Création de l'utilisateur
        const newUser = await prisma.user.create({
            data: { firstname, lastname, email, phoneNumber, password: hashedPassword }
        });

        // Génération des tokens JWT
        const accessToken = generateAccessToken(newUser);
        const refreshToken = generateRefreshToken(newUser);

        // Sauvegarde du refresh token dans la base de données
        await prisma.refreshTokens.create({
            data: { hashedToken: refreshToken, userId: newUser.id }
        });

        res.json({
            status: 'success',
            data: { user: newUser, accessToken, refreshToken }
        });
    } catch (err) {
        const error = err as Error;
        res.status(500).json({ status: 'fail', message: error.message });
    }
};

// Contrôleur pour la connexion des utilisateurs
export const userLoginCtrl = async (req: Request, res: Response) => {
    // Validation des entrées
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;
    
    try {
        const user = await prisma.user.findUnique({
            where: { email: email }
        });
        if (!user) {
            return res.status(400).json({ status: 'fail', message: 'Email incorrect' });
        }

        const validatePassword = await bcrypt.compare(password, user.password);
        if (!validatePassword) {
            return res.status(400).json({ status: 'fail', message: 'Mot de passe incorrect' });
        }

        // Génération des tokens JWT
        const accessToken = generateAccessToken(user);
        const refreshToken = generateRefreshToken(user);

        // Sauvegarde du refresh token dans la base de données
        await prisma.refreshTokens.create({
            data: { hashedToken: refreshToken, userId: user.id }
        });

        res.json({
            status: 'success',
            data: {
                firstname: user.firstname,
                lastname: user.lastname,
                email: user.email,
                role: user.role,
                accessToken,
                refreshToken
            }
        });
    } catch (err) {
        const error = err as Error;
        res.status(500).json({ status: 'fail', message: error.message });
    }
};
```

### Explication des Commentaires

Les commentaires insérés dans le code expliquent chaque étape, de la validation des entrées à la génération des tokens JWT, ce qui peut vous aider à comprendre ce que fait chaque partie du code et comment les différentes étapes sont liées entre elles. Les erreurs de validation seront automatiquement affichées dans la réponse JSON lors des tests avec Postman, Insomnia ou toute autre interface front-end, facilitant ainsi le retour d'information pour les utilisateurs finaux.

















































# ERROR HANDLING



Bien sûr, pour une gestion des erreurs et un formatage cohérent, il est recommandé d'utiliser un middleware de gestion des erreurs dans Express. Cela permet de centraliser la logique de gestion des erreurs et de garantir que toutes les réponses d'erreur ont un format cohérent.

### Étapes pour la gestion des erreurs

1. **Créer un middleware de gestion des erreurs global**
2. **Utiliser le middleware de gestion des erreurs dans votre application Express**
3. **Mettre à jour les contrôleurs pour utiliser une gestion des erreurs cohérente**

### 1. Créer un middleware de gestion des erreurs global

Créez un fichier `src/middleware/errorMiddleware.ts` pour gérer les erreurs :

```typescript
import { Request, Response, NextFunction } from 'express';

interface ErrorWithStatus extends Error {
  status?: number;
}

export const errorHandler = (err: ErrorWithStatus, req: Request, res: Response, next: NextFunction) => {
  const status = err.status || 500;
  const message = err.message || 'Internal Server Error';

  res.status(status).json({
    status: 'fail',
    message: message,
  });
};
```

### 2. Utiliser le middleware de gestion des erreurs dans votre application Express

Mettez à jour votre fichier `src/server.ts` pour utiliser ce middleware :

```typescript
import express from 'express';
import bodyParser from 'body-parser';
import authRoutes from './routes/authRoutes';
import userRoutes from './routes/userRoutes';
import { errorHandler } from './middleware/errorMiddleware';

const app = express();
app.use(bodyParser.json());

app.use('/auth', authRoutes);
app.use('/user', userRoutes);

// Utilisation du middleware de gestion des erreurs
app.use(errorHandler);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
```

### 3. Mettre à jour les contrôleurs pour utiliser une gestion des erreurs cohérente

Pour gérer les erreurs dans vos contrôleurs et les transmettre au middleware de gestion des erreurs, vous pouvez utiliser `next()` pour passer l'erreur.

#### Exemple : Mise à jour de `authController.ts`

```typescript
import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import { generateAccessToken, generateRefreshToken } from '../utils/tokenJwt/jwt';
import { validationResult } from 'express-validator';

const prisma = new PrismaClient();

export const userRegisterCtrl = async (req: Request, res: Response, next: NextFunction) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { firstname, lastname, email, phoneNumber, password } = req.body;

  try {
    const emailFound = await prisma.user.findUnique({ where: { email: email } });
    if (emailFound) {
      const error = new Error('L\'email existe déjà') as ErrorWithStatus;
      error.status = 400;
      throw error;
    }

    const phoneNumberFound = await prisma.user.findUnique({ where: { phoneNumber: phoneNumber } });
    if (phoneNumberFound) {
      const error = new Error('Le numéro de téléphone existe déjà') as ErrorWithStatus;
      error.status = 400;
      throw error;
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = await prisma.user.create({
      data: { firstname, lastname, email, phoneNumber, password: hashedPassword }
    });

    const accessToken = generateAccessToken(newUser);
    const refreshToken = generateRefreshToken(newUser);

    await prisma.refreshTokens.create({
      data: { hashedToken: refreshToken, userId: newUser.id }
    });

    res.json({
      status: 'success',
      data: { user: newUser, accessToken, refreshToken }
    });
  } catch (err) {
    next(err);
  }
};

export const userLoginCtrl = async (req: Request, res: Response, next: NextFunction) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { email, password } = req.body;

  try {
    const user = await prisma.user.findUnique({ where: { email: email } });
    if (!user) {
      const error = new Error('Email incorrect') as ErrorWithStatus;
      error.status = 400;
      throw error;
    }

    const validatePassword = await bcrypt.compare(password, user.password);
    if (!validatePassword) {
      const error = new Error('Mot de passe incorrect') as ErrorWithStatus;
      error.status = 400;
      throw error;
    }

    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    await prisma.refreshTokens.create({
      data: { hashedToken: refreshToken, userId: user.id }
    });

    res.json({
      status: 'success',
      data: {
        firstname: user.firstname,
        lastname: user.lastname,
        email: user.email,
        role: user.role,
        accessToken,
        refreshToken
      }
    });
  } catch (err) {
    next(err);
  }
};
```

### Conclusion

En suivant ces étapes, vous avez :

1. Créé un middleware global de gestion des erreurs.
2. Ajouté ce middleware à votre application Express.
3. Mis à jour vos contrôleurs pour utiliser `next()` afin de transmettre les erreurs au middleware de gestion des erreurs.

Cela garantit que toutes les erreurs sont gérées de manière cohérente et renvoyées avec un format standardisé, ce qui facilite le débogage et améliore l'expérience des utilisateurs.
```javascript
```





```javascript
export const userRegisterCtrl = async( req: Request, res: Response) => {

    // 1. Validation des entrer pour s'assurer que les frmat sont bon
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    // 2. Recuperation des donnes du cors de la requete
    const {
        firstname,
        lastname,
        email,
        phoneNumber,
        password
    } = req.body

    try {
        // 3. validation ou verification de l'existance de l'email
        const emailFound = await prisma.user.findUnique({
            where: {
                email: email
            }
        });
        if (emailFound) {
            return res.status(400).json({
                message: 'Ce email est deja dans la base. Merci d\'en prendre un autre'
            });
        }

        // 4. pareil pour le numero de telephone
        const researchPhoneNumber = await prisma.user.findUnique({
            where: {
                phoneNumber: phoneNumber
            }
        });
        if (researchPhoneNumber) {
            return res.status(400).json({
                message: 'Ce numero de telephon est déjà utilisé, Merci d\'en choisir un autre'
            });
        }

        // 5.cryptage du mot de passe
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // 6. Creation d'un nouvelle user dans la base
        const newUser = await prisma.user.create({
            data: {
                firstname,
                lastname,
                email,
                phoneNumber,
                password: hashedPassword
            }
        })

    } catch (err) {
        // 7. Gestion des erreurs
        const error = err as Error;
        res.status(500).json({
            status: 'fail',
            message: error.message
        })
    }
}
```

nouveau

```javascript
```






# PAGINATION



Pour ajouter la pagination lors de l'affichage de tous les utilisateurs, nous pouvons utiliser les paramètres de requête (`query parameters`) pour définir la page et la limite. Voici comment vous pouvez le faire :

### 1. Ajouter une route pour obtenir tous les utilisateurs avec pagination

Créez une nouvelle route dans `src/routes/userRoutes.ts` :

```typescript
import { Router } from 'express';
import { getUserProfile, getAllUsers } from '../controllers/userController';
import { authenticateToken } from '../middleware/authMiddleware';

const router = Router();

router.get('/profile', authenticateToken, getUserProfile);

// Route pour obtenir tous les utilisateurs avec pagination
router.get('/all', authenticateToken, getAllUsers);

export default router;
```

### 2. Créer le contrôleur pour obtenir tous les utilisateurs avec pagination

Ajoutez une nouvelle fonction dans `src/controllers/userController.ts` :

```typescript
import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const getUserProfile = async (req: Request, res: Response, next: NextFunction) => {
  const userId = (req as any).userId;

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      return res.status(404).json({ status: 'fail', message: 'Utilisateur non trouvé' });
    }

    res.json({
      status: 'success',
      data: {
        firstname: user.firstname,
        lastname: user.lastname,
        email: user.email,
        phoneNumber: user.phoneNumber,
        role: user.role
      }
    });
  } catch (err) {
    next(err);
  }
};

export const getAllUsers = async (req: Request, res: Response, next: NextFunction) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  const skip = (page - 1) * limit;

  try {
    const users = await prisma.user.findMany({
      skip: skip,
      take: limit,
    });

    const totalUsers = await prisma.user.count();

    res.json({
      status: 'success',
      data: {
        users: users,
        totalUsers: totalUsers,
        page: page,
        totalPages: Math.ceil(totalUsers / limit)
      }
    });
  } catch (err) {
    next(err);
  }
};
```

### 3. Tester la pagination

Pour tester la pagination, lancez votre serveur et utilisez une application de test de l'API comme Postman ou Curl pour faire une requête GET à l'URL :

```
GET http://localhost:3000/user/all?page=1&limit=10
```

Cela devrait renvoyer les utilisateurs paginés avec les informations suivantes :
- `users`: La liste des utilisateurs pour la page actuelle.
- `totalUsers`: Le nombre total d'utilisateurs dans la base de données.
- `page`: La page actuelle.
- `totalPages`: Le nombre total de pages.

### Exemple de réponse JSON pour la pagination

```json
{
  "status": "success",
  "data": {
    "users": [
      {
        "id": "1",
        "firstname": "John",
        "lastname": "Doe",
        "email": "john.doe@example.com",
        "phoneNumber": "123456789",
        "role": "USER"
      },
      {
        "id": "2",
        "firstname": "Jane",
        "lastname": "Doe",
        "email": "jane.doe@example.com",
        "phoneNumber": "987654321",
        "role": "ADMIN"
      }
    ],
    "totalUsers": 50,
    "page": 1,
    "totalPages": 5
  }
}
```

Avec cette configuration, vous pouvez facilement gérer la pagination pour afficher les utilisateurs par lots, ce qui rend la gestion des utilisateurs plus efficace et conviviale.
```javascript
```








# email verification

Pour valider les adresses email et s'assurer qu'elles sont valides et existent, il existe plusieurs approches. Une méthode courante consiste à envoyer un email de vérification contenant un lien que l'utilisateur doit cliquer pour vérifier son adresse email. Cela ne garantit pas que l'adresse email est de Google, mais cela garantit que l'adresse email existe et que l'utilisateur a accès à celle-ci.

Cependant, si vous voulez vous assurer qu'une adresse email appartient à Google (comme une adresse Gmail), vous pouvez vérifier le domaine de l'email. Ensuite, pour valider l'email, vous devez envoyer un email de vérification.

### Étapes pour l'authentification par email

1. **Ajouter un champ `verificationToken` et `emailVerified` au modèle `User`**
2. **Créer une fonction pour générer des tokens de vérification**
3. **Mettre à jour le contrôleur de registre pour envoyer un email de vérification**
4. **Créer une route pour vérifier le token de l'email**
5. **Configurer un service d'envoi d'emails**

### 1. Ajouter un champ `verificationToken` et `emailVerified` au modèle `User`

Mettez à jour votre schéma Prisma pour inclure ces champs :

```prisma
model User {
  id                    String          @id @default(auto()) @map("_id") @db.ObjectId
  firstname             String?
  lastname              String?
  email                 String          @unique
  phoneNumber           String          @unique
  password              String
  role                  Role            @default(USER)
  refreshTokens         RefreshTokens[]
  address               Address?
  profession            String?
  birth                 DateTime?
  profilePhoto          String?
  ipAdress              String[]
  deviceId              String[]
  status                Status          @default(inactive)
  isVerified            Boolean         @default(false)
  isApproved            Boolean         @default(false)
  isBlocked             Boolean         @default(false)
  referrralCode         String?
  emailVerifiedAt       DateTime?
  profileComplete       DateTime?
  isSuperuser           Boolean         @default(false)
  identificationType    String?
  identificationExpiry  DateTime?
  documentIdentityImage String?
  statusKyc             Kyc             @default(none)
  dateOfVerification    DateTime?
  sponsorShipCode       String?
  lastLogin             DateTime?
  twoFactorAuth         Boolean         @default(false)
  failedLoginAttempts   Int             @default(0)
  lastFailedLogin       DateTime?
  createdAt             DateTime        @default(now())
  updatedAt             DateTime        @updatedAt

  // Nouveaux champs pour l'authentification par email
  verificationToken     String?
  emailVerified         Boolean         @default(false)
}
```

### 2. Créer une fonction pour générer des tokens de vérification

Ajoutez une fonction dans `src/utils/tokenJwt/jwt.ts` :

```typescript
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret_key';

export const generateEmailVerificationToken = (user: { id: string; email: string }) => {
  return jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET, { expiresIn: '1h' });
};
```

### 3. Mettre à jour le contrôleur de registre pour envoyer un email de vérification

Mettez à jour `src/controllers/authController.ts` :

```typescript
import nodemailer from 'nodemailer';
import { generateEmailVerificationToken } from '../utils/tokenJwt/jwt';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_PASS,
  },
});

export const userRegisterCtrl = async (req: Request, res: Response, next: NextFunction) => {
  const { firstname, lastname, email, phoneNumber, password } = req.body;

  try {
    const emailFound = await prisma.user.findUnique({ where: { email: email } });
    if (emailFound) {
      const error = new Error('L\'email existe déjà') as ErrorWithStatus;
      error.status = 400;
      throw error;
    }

    const phoneNumberFound = await prisma.user.findUnique({ where: { phoneNumber: phoneNumber } });
    if (phoneNumberFound) {
      const error = new Error('Le numéro de téléphone existe déjà') as ErrorWithStatus;
      error.status = 400;
      throw error;
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const verificationToken = generateEmailVerificationToken({ id: newUser.id, email: email });

    const newUser = await prisma.user.create({
      data: {
        firstname,
        lastname,
        email,
        phoneNumber,
        password: hashedPassword,
        verificationToken,
      },
    });

    const verificationLink = `${process.env.BASE_URL}/auth/verify-email?token=${verificationToken}`;

    await transporter.sendMail({
      from: process.env.GMAIL_USER,
      to: newUser.email,
      subject: 'Verify your email',
      text: `Please verify your email by clicking the following link: ${verificationLink}`,
    });

    res.json({
      status: 'success',
      data: newUser,
    });
    console.log('Utilisateur créé avec succès');
  } catch (err) {
    next(err);
  }
};
```

### 4. Créer une route pour vérifier le token de l'email

Ajoutez une nouvelle route dans `src/routes/authRoutes.ts` :

```typescript
router.get('/verify-email', async (req: Request, res: Response, next: NextFunction) => {
  const token = req.query.token as string;

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string; email: string };

    const user = await prisma.user.update({
      where: { id: decoded.userId },
      data: { emailVerified: true, emailVerifiedAt: new Date() },
    });

    res.json({
      status: 'success',
      message: 'Email verified successfully',
    });
  } catch (err) {
    const error = new Error('Invalid or expired token') as ErrorWithStatus;
    error.status = 400;
    next(error);
  }
});
```

### 5. Configurer un service d'envoi d'emails

Assurez-vous d'avoir configuré `nodemailer` et d'avoir les variables d'environnement appropriées dans votre fichier `.env` :

```
GMAIL_USER=your_gmail_account@gmail.com
GMAIL_PASS=your_gmail_password
BASE_URL=http://localhost:3000
```

### Conclusion

Avec ces étapes, vous avez mis en place un système pour vérifier les adresses email des utilisateurs. Cela inclut l'envoi d'un email de vérification après l'inscription et la vérification du token de l'email pour activer l'adresse email. Cela garantit que les adresses email sont valides et que l'utilisateur a accès à l'email fourni lors de l'inscription.
```javascript
```






















# reset password
Pour implémenter la fonctionnalité de réinitialisation de mot de passe (mot de passe oublié) dans votre application, vous pouvez suivre ces étapes :

### 1. Demande de réinitialisation de mot de passe

Créez une route dans votre application pour que les utilisateurs puissent demander la réinitialisation de leur mot de passe. Cette route peut être accessible via un formulaire sur votre frontend.

### 2. Génération d'un jeton de réinitialisation de mot de passe

Lorsqu'un utilisateur demande la réinitialisation de son mot de passe, générez un jeton de réinitialisation de mot de passe unique associé à cet utilisateur. Ce jeton doit expirer après une certaine durée pour des raisons de sécurité.

### 3. Envoi d'un email de réinitialisation de mot de passe

Envoyez un email à l'utilisateur contenant un lien spécial qui inclut le jeton de réinitialisation de mot de passe. Ce lien doit pointer vers une page où l'utilisateur pourra saisir un nouveau mot de passe.

### 4. Réception de la demande de réinitialisation de mot de passe

Créez une route dans votre application pour gérer la réception du jeton de réinitialisation de mot de passe et permettre à l'utilisateur de saisir un nouveau mot de passe.

### 5. Validation du jeton de réinitialisation de mot de passe

Vérifiez si le jeton de réinitialisation de mot de passe est valide et n'a pas expiré. Si le jeton est valide, permettez à l'utilisateur de saisir un nouveau mot de passe.

### 6. Réinitialisation du mot de passe

Une fois que l'utilisateur a saisi un nouveau mot de passe, mettez à jour le mot de passe de l'utilisateur dans votre base de données.

### Exemple de processus dans le contrôleur :

```typescript
// controllers/authController.ts

import { Request, Response } from 'express';
import { generateResetToken, hashPassword } from '../utils/password';
import { sendPasswordResetEmail } from '../utils/email';

export const requestPasswordReset = async (req: Request, res: Response) => {
  const { email } = req.body;

  // Vérifier si l'utilisateur avec cet email existe
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }

  // Générer un jeton de réinitialisation de mot de passe
  const resetToken = generateResetToken(user.id);

  // Enregistrer le jeton de réinitialisation de mot de passe dans la base de données
  await prisma.passwordReset.create({
    data: {
      userId: user.id,
      token: resetToken,
      expiresAt: new Date(Date.now() + 3600000), // Expiration dans 1 heure
    },
  });

  // Envoyer un email de réinitialisation de mot de passe à l'utilisateur
  await sendPasswordResetEmail(email, resetToken);

  res.json({ message: 'Password reset email sent' });
};

export const resetPassword = async (req: Request, res: Response) => {
  const { token, newPassword } = req.body;

  // Trouver le jeton de réinitialisation de mot de passe dans la base de données
  const resetToken = await prisma.passwordReset.findUnique({ where: { token } });
  if (!resetToken || resetToken.expiresAt < new Date()) {
    return res.status(400).json({ message: 'Invalid or expired token' });
  }

  // Mettre à jour le mot de passe de l'utilisateur dans la base de données
  const hashedPassword = await hashPassword(newPassword);
  await prisma.user.update({
    where: { id: resetToken.userId },
    data: { password: hashedPassword },
  });

  // Supprimer le jeton de réinitialisation de mot de passe de la base de données
  await prisma.passwordReset.delete({ where: { token } });

  res.json({ message: 'Password reset successfully' });
};
```

Assurez-vous d'ajouter la gestion des erreurs et les fonctionnalités supplémentaires nécessaires, telles que la validation des entrées utilisateur et la protection contre les attaques par force brute, dans votre implémentation réelle.
```javascript
```
```javascript
```






# connexion soit email soit password

Pour permettre aux utilisateurs de se connecter à la plateforme en utilisant soit leur adresse e-mail soit leur numéro de téléphone, vous pouvez suivre ces étapes :

### 1. Modification du modèle User

Modifiez votre modèle `User` pour inclure le numéro de téléphone en tant que champ unique, en plus de l'adresse e-mail.

```typescript
// Prisma schema
model User {
  id           String   @id @default(auto()) @map("_id") @db.ObjectId
  firstname    String?
  lastname     String?
  email        String   @unique
  phoneNumber  String?  @unique // Ajout du champ numéro de téléphone
  password     String
  role         String
}
```

### 2. Création d'une route de connexion

Créez une route dans votre application qui accepte l'adresse e-mail ou le numéro de téléphone, ainsi que le mot de passe de l'utilisateur pour l'authentification.

### 3. Contrôleur de connexion

Implémentez un contrôleur qui vérifie si l'utilisateur existe dans la base de données en utilisant soit son adresse e-mail soit son numéro de téléphone, puis vérifie si le mot de passe fourni correspond au mot de passe enregistré.

```typescript
// controllers/authController.ts

export const loginUser = async (req: Request, res: Response) => {
  const { identifier, password } = req.body;

  // Vérifier si l'identifiant est un email ou un numéro de téléphone
  const user = await prisma.user.findFirst({
    where: {
      OR: [
        { email: identifier },
        { phoneNumber: identifier }
      ]
    }
  });
  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }

  // Vérifier si le mot de passe est correct
  const validPassword = await bcrypt.compare(password, user.password);
  if (!validPassword) {
    return res.status(401).json({ message: 'Incorrect password' });
  }

  // Authentification réussie, générer un token JWT
  const token = generateAccessToken(user.id);

  res.json({ token });
};
```

### Exemple de données JSON pour la connexion

Voici un exemple de données JSON que vous pouvez utiliser pour tester la fonctionnalité de connexion dans Insomnia :

```json
{
  "identifier": "john.doe@example.com",
  "password": "password123"
}
```

Vous pouvez modifier la valeur de `identifier` pour tester la connexion à l'aide de l'adresse e-mail ou du numéro de téléphone de l'utilisateur. Assurez-vous que le mot de passe correspond à celui enregistré dans votre base de données.
```javascript
```
```javascript
```



D'accord, je comprends mieux maintenant. Voici comment vous pouvez implémenter le processus de vérification du numéro de téléphone avec envoi d'un code OTP et validation lors de l'inscription :

### 1. Route pour la demande de code OTP

Créez une route dans votre application pour que l'utilisateur puisse demander l'envoi du code OTP après avoir saisi son numéro de téléphone lors de l'inscription.

```typescript
// routes/authRoutes.ts

import { Router } from 'express';
import { requestOTP } from '../controllers/authController';

const router = Router();

router.post('/request-otp', requestOTP);

export default router;
```

### 2. Contrôleur pour la demande de code OTP

Implémentez un contrôleur qui génère et envoie le code OTP à l'utilisateur via SMS, puis stocke ce code dans la base de données associé à l'utilisateur.

```typescript
// controllers/authController.ts

export const requestOTP = async (req: Request, res: Response) => {
  const { phoneNumber } = req.body;

  // Générer un code OTP
  const otp = generateOTP(); // À implémenter selon votre méthode de génération

  // Envoyer le code OTP à l'utilisateur via SMS (utilisez un service comme Twilio)

  // Stocker le code OTP dans la base de données associé à l'utilisateur
  await prisma.user.update({
    where: { phoneNumber },
    data: { otp }
  });

  res.json({ message: 'Code OTP envoyé avec succès.' });
};
```

### 3. Route pour la validation du code OTP

Créez une autre route pour que l'utilisateur puisse soumettre le code OTP qu'il a reçu afin de valider son numéro de téléphone.

```typescript
// routes/authRoutes.ts

import { Router } from 'express';
import { verifyOTP } from '../controllers/authController';

const router = Router();

router.post('/verify-otp', verifyOTP);

export default router;
```

### 4. Contrôleur pour la validation du code OTP

Implémentez un contrôleur qui vérifie si le code OTP soumis par l'utilisateur correspond à celui stocké dans la base de données. Si la correspondance est réussie, marquez le numéro de téléphone comme vérifié.

```typescript
// controllers/authController.ts

export const verifyOTP = async (req: Request, res: Response) => {
  const { phoneNumber, otp } = req.body;

  // Vérifier le code OTP dans la base de données
  const user = await prisma.user.findFirst({
    where: { phoneNumber, otp }
  });

  if (!user) {
    return res.status(401).json({ message: 'Code OTP invalide.' });
  }

  // Marquer le numéro de téléphone comme vérifié
  await prisma.user.update({
    where: { phoneNumber },
    data: { phoneNumberVerified: true, otp: null } // Réinitialiser le code OTP après vérification
  });

  res.json({ message: 'Numéro de téléphone vérifié avec succès.' });
};
```

### Exemple de données JSON pour la demande de code OTP

Voici un exemple de données JSON que vous pouvez utiliser pour tester la demande de code OTP dans Insomnia :

```json
{
  "phoneNumber": "+1234567890"
}
```

Vous pouvez ajuster la valeur de `"phoneNumber"` en fonction du numéro de téléphone pour lequel vous souhaitez demander l'envoi du code OTP. Assurez-vous que votre contrôleur envoie réellement le code OTP via SMS.
```javascript
```
```javascript
```
```javascript
```



Bien sûr, je vais développer cette fonction `requestOTP` pour vous :

```typescript
// controllers/authController.ts

import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { generateOTP } from '../utils/otp'; // Importez la fonction de génération de code OTP

const prisma = new PrismaClient();

export const requestOTP = async (req: Request, res: Response) => {
  const { phoneNumber } = req.body;

  try {
    // Génération d'un code OTP
    const otp = generateOTP(); // À implémenter selon votre méthode de génération

    // Envoyer le code OTP à l'utilisateur via SMS (utilisez un service comme Twilio)
    // Ici, vous devez appeler un service externe comme Twilio pour envoyer le code OTP

    // Stocker le code OTP dans la base de données associé à l'utilisateur
    await prisma.user.update({
      where: { phoneNumber },
      data: { otp }
    });

    res.json({ message: 'Code OTP envoyé avec succès.' });
  } catch (error) {
    console.error('Erreur lors de la demande de code OTP :', error);
    res.status(500).json({ message: 'Une erreur est survenue lors de l\'envoi du code OTP.' });
  }
};
```

Dans cette fonction `requestOTP`, nous générons un code OTP, puis nous devons envoyer ce code à l'utilisateur via SMS. Cette partie dépend d'un service externe comme Twilio pour l'envoi de SMS. Une fois que le code OTP est envoyé avec succès, nous le stockons dans la base de données associé à l'utilisateur.

Assurez-vous d'adapter cette fonction en fonction de votre méthode de génération de code OTP et de votre service d'envoi de SMS. Et n'oubliez pas de gérer les erreurs de manière appropriée pour fournir des réponses claires à l'utilisateur en cas de problème lors de l'envoi du code OTP.
```javascript
```
```javascript
```

# migration sql vs mongo

Pour migrer une base de données SQL vers MongoDB avec Prisma et prendre en compte les cas où les anciens utilisateurs n'ont pas d'adresse e-mail et peuvent continuer à utiliser leur méthode de connexion actuelle, vous devrez suivre plusieurs étapes :

### 1. Mettre à jour le schéma Prisma :

Ajoutez le champ `email` dans votre modèle `User` et assurez-vous qu'il n'est pas défini comme `@unique` si vous souhaitez permettre aux anciens utilisateurs de ne pas avoir d'adresse e-mail.

```prisma
model User {
  id           String   @id @default(auto()) @map("_id") @db.ObjectId
  firstname    String?
  lastname     String?
  email        String?
  phoneNumber  String  @unique
  password     String
  role         String
}
```

### 2. Migration des données :

Migrez vos données de la base de données SQL vers MongoDB en prenant soin de conserver les données des anciens utilisateurs. Si un utilisateur n'a pas d'adresse e-mail, vous pouvez laisser ce champ vide ou le remplir avec une valeur par défaut, selon vos besoins.

### 3. Mettre à jour la logique de connexion :

Dans votre logique de connexion, vérifiez si l'utilisateur a un e-mail. Si c'est le cas, autorisez la connexion par e-mail. Sinon, autorisez la connexion par numéro de téléphone.

### 4. Mettre à jour le processus d'inscription :

Pour les nouveaux utilisateurs, demandez obligatoirement une adresse e-mail lors de l'inscription. Si vous utilisez un formulaire d'inscription, ajoutez un champ pour l'e-mail et assurez-vous que ce champ est valide avant de créer le nouvel utilisateur.

### 5. Autoriser les anciens utilisateurs à renseigner leur e-mail :

Créez une fonctionnalité dans votre application qui permet aux anciens utilisateurs de renseigner leur adresse e-mail ultérieurement. Cette fonctionnalité peut être une page de profil où les utilisateurs peuvent mettre à jour leurs informations personnelles.

En suivant ces étapes, vous pourrez migrer votre base de données SQL vers MongoDB avec Prisma tout en tenant compte des différences dans les méthodes de connexion entre les anciens et les nouveaux utilisateurs. Assurez-vous de tester soigneusement la migration pour éviter toute perte de données ou tout dysfonctionnement dans votre application.
```javascript
```
```javascript
```
Pour migrer les données d'une base de données SQL vers MongoDB avec Prisma, vous pouvez suivre ces étapes générales :

### 1. Exporter les données de la base de données SQL :

Utilisez des outils de migration de données ou des scripts SQL pour extraire les données de votre base de données SQL dans un format adapté à l'importation dans MongoDB. Vous pouvez exporter les données sous forme de fichiers CSV, JSON ou tout autre format pris en charge par MongoDB.

### 2. Transformer les données si nécessaire :

Si les données exportées ne sont pas directement compatibles avec le schéma MongoDB, vous devrez peut-être les transformer pour les adapter. Par exemple, vous pourriez avoir besoin de reformater les dates ou de normaliser les valeurs pour correspondre au schéma MongoDB.

### 3. Importer les données dans MongoDB :

Utilisez les outils de gestion de base de données ou les API fournis par MongoDB pour importer les données exportées dans votre base de données MongoDB. Assurez-vous de suivre les instructions spécifiques à votre environnement et de vérifier que les données sont importées correctement.

### 4. Mettre à jour le schéma Prisma :

Une fois les données importées dans MongoDB, assurez-vous que votre schéma Prisma est mis à jour pour refléter les changements. Cela peut inclure l'ajout de nouveaux modèles, de nouveaux champs ou la modification des contraintes existantes pour correspondre à la structure de données dans MongoDB.

### 5. Tester la migration :

Effectuez des tests exhaustifs pour vous assurer que les données ont été migrées avec succès et que votre application fonctionne correctement avec la nouvelle base de données MongoDB. Vérifiez que toutes les fonctionnalités sont opérationnelles et que les données sont accessibles comme prévu.

### 6. Gérer les erreurs et les incohérences :

Pendant le processus de migration et de test, il est probable que vous rencontriez des erreurs ou des incohérences dans les données. Assurez-vous d'avoir des mécanismes en place pour gérer ces problèmes, que ce soit en corrigeant manuellement les données, en mettant à jour les scripts de migration ou en apportant des modifications au schéma Prisma.

En suivant ces étapes, vous devriez être en mesure de migrer les données de votre base de données SQL vers MongoDB avec Prisma de manière efficace et sans perte de données importantes. Assurez-vous de sauvegarder vos données et de planifier la migration pendant une période de faible trafic pour minimiser les perturbations potentielles pour vos utilisateurs.
```javascript
```
```javascript
```

















# Verifier que l'otp du user a ete verifier


Pour vérifier que l'OTP a bien été vérifié, vous pouvez ajouter un champ `isVerified` par défaut à `false` dans le modèle `User`. Ce champ sera mis à jour à `true` lorsque l'utilisateur vérifiera son OTP. Voici comment vous pouvez le faire :

### Mise à Jour du Modèle `User`

Ajoutez le champ `isVerified` dans votre modèle `User` :

```prisma
model User {
  id                    String                @id @default(auto()) @map("_id") @db.ObjectId
  firstname             String?
  lastname              String?
  email                 String                @unique
  phoneNumber           String                @unique
  password              String
  role                  Role                  @default(USER)
  refreshTokens         RefreshTokens[]
  address               Address?
  profession            String?
  birth                 DateTime?
  profilePhoto          String?
  ipAdress              String[]
  deviceId              String[]
  status                Status                @default(inactive)
  isApproved            Boolean               @default(false)
  isBlocked             Boolean               @default(false)
  referrralCode         String?
  otpVerifications      UserOtpVerification[]
  profileComplete       DateTime?
  isSuperuser           Boolean               @default(false)
  identificationType    String?
  identificationExpiry  DateTime?
  documentIdentityImage String?
  statusKyc             Kyc                   @default(none)
  dateOfVerification    DateTime?
  sponsorShipCode       String?
  lastLogin             DateTime?
  twoFactorAuth         Boolean               @default(false)
  failedLoginAttempts   Int                   @default(0)
  lastFailedLogin       DateTime?
  createdAt             DateTime              @default(now())
  updatedAt             DateTime              @updatedAt
  isVerified            Boolean               @default(false) // Ajout du champ isVerified
}
```

### Mise à Jour du Contrôleur de Vérification de l'OTP

Modifiez le contrôleur de vérification de l'OTP pour mettre à jour le champ `isVerified` :

```typescript
import { Request, Response, NextFunction } from 'express';
import prisma from '../prisma'; // Assurez-vous que le chemin est correct

export const verifyOtpCtrl = async (req: Request, res: Response, next: NextFunction) => {
    const { email, otp } = req.body;

    try {
        // Rechercher l'utilisateur par email
        const user = await prisma.user.findUnique({
            where: { email },
            include: {
                otpVerifications: true,
            }
        });

        if (!user) {
            return res.status(400).json({ error: 'User not found' });
        }

        // Vérifier que l'OTP existe et n'est pas expiré
        const validOtp = user.otpVerifications.find((verification) => 
            verification.otp === otp && verification.otpExpires > new Date()
        );

        if (!validOtp) {
            return res.status(400).json({ error: 'Invalid or expired OTP' });
        }

        // Mettre à jour le statut de l'utilisateur
        await prisma.user.update({
            where: { email },
            data: {
                status: 'active',
                isVerified: true, // Met à jour isVerified à true
                otpVerifications: {
                    delete: { id: validOtp.id } // Supprime l'OTP après vérification
                }
            }
        });

        res.status(200).json({
            status: 'success',
            message: 'OTP verified successfully. User is now active and verified.'
        });

    } catch (err) {
        next(err);
    }
}
```

### Mise à Jour du Contrôleur de Connexion

Modifiez le contrôleur de connexion pour vérifier que `isVerified` est `true` avant de permettre la connexion :

```typescript
import { Request, Response, NextFunction } from 'express';
import prisma from '../prisma'; // Assurez-vous que le chemin est correct
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken'; // Si vous utilisez JWT pour l'authentification

export const userLoginCtrl = async (req: Request, res: Response, next: NextFunction) => {
    const { email, password } = req.body;

    try {
        // Rechercher l'utilisateur par email
        const user = await prisma.user.findUnique({
            where: { email }
        });

        if (!user) {
            return res.status(400).json({ error: 'Invalid email or password' });
        }

        // Vérifier que l'utilisateur a vérifié son OTP
        if (!user.isVerified) {
            return res.status(403).json({ error: 'Account not verified. Please check your email for the OTP.' });
        }

        // Vérifier le mot de passe
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(400).json({ error: 'Invalid email or password' });
        }

        // Générer un token JWT (ou utiliser une autre méthode d'authentification)
        const token = jwt.sign({ userId: user.id }, 'your-secret-key', { expiresIn: '1h' });

        // Répondre avec le token
        res.status(200).json({
            status: 'success',
            message: 'Login successful',
            token
        });

    } catch (err) {
        next(err);
    }
};
```

### Exemple de Requête HTTP pour Vérifier l'OTP

Pour vérifier l'OTP, vous pouvez envoyer une requête POST avec le payload JSON :

```bash
curl -X POST http://localhost:3000/verify-otp -H "Content-Type: application/json" -d '{"email":"user@gmail.com", "otp":"ABC123"}'
```

### Exemple de Requête HTTP pour se Connecter

Pour se connecter, vous pouvez envoyer une requête POST avec le payload JSON :

```bash
curl -X POST http://localhost:3000/login -H "Content-Type: application/json" -d '{"email":"user@gmail.com", "password":"yourpassword"}'
```

En suivant ces étapes, vous vous assurez que seuls les utilisateurs qui ont vérifié leur adresse email via OTP peuvent se connecter. Le champ `isVerified` dans le modèle `User` permet de suivre l'état de vérification de chaque utilisateur.


















































OTP EMAIL

Pour configurer l'envoi d'e-mails à l'aide de Nodemailer avec les informations stockées dans un fichier `.env`, vous devez suivre ces étapes :

1. **Installer les dépendances nécessaires :**

   Assurez-vous d'avoir les bibliothèques `dotenv` et `nodemailer` installées :

   ```bash
   npm install dotenv nodemailer
   ```

2. **Configurer le fichier `.env` :**

   Créez un fichier `.env` à la racine de votre projet si ce n'est pas déjà fait. Ajoutez-y les variables d'environnement nécessaires pour la configuration de Nodemailer. Par exemple, pour une configuration avec Gmail :

   ```env
   EMAIL_HOST=smtp.gmail.com
   EMAIL_PORT=587
   EMAIL_USER=your-email@gmail.com
   EMAIL_PASS=your-email-password
   ```

   Remplacez `your-email@gmail.com` et `your-email-password` par vos informations de compte Gmail. Notez que pour utiliser Gmail, vous devrez peut-être configurer des mots de passe d'application ou autoriser l'accès à des applications moins sécurisées.

3. **Charger les variables d'environnement dans votre application :**

   Utilisez la bibliothèque `dotenv` pour charger les variables d'environnement au démarrage de votre application.

   ```typescript
   // server.ts or app.ts (your main entry point)

   import dotenv from 'dotenv';

   dotenv.config();
   ```

4. **Configurer Nodemailer avec les variables d'environnement :**

   Créez un fichier de service pour configurer et envoyer des e-mails en utilisant Nodemailer avec les variables d'environnement.

   ```typescript
   // email.service.ts

   import nodemailer from 'nodemailer';

   // Configurer le transporteur d'e-mails
   const transporter = nodemailer.createTransport({
       host: process.env.EMAIL_HOST,
       port: Number(process.env.EMAIL_PORT),
       secure: false, // true pour 465, false pour d'autres ports
       auth: {
           user: process.env.EMAIL_USER,
           pass: process.env.EMAIL_PASS,
       },
   });

   // Fonction pour envoyer un e-mail
   export const sendEmail = async (to: string, subject: string, text: string, html?: string) => {
       const mailOptions = {
           from: process.env.EMAIL_USER, // adresse e-mail de l'expéditeur
           to: to,
           subject: subject,
           text: text,
           html: html, // Si le contenu HTML est fourni
       };

       try {
           const info = await transporter.sendMail(mailOptions);
           console.log('Email sent: ' + info.response);
       } catch (error) {
           console.error('Error sending email: ', error);
       }
   };
   ```

5. **Utilisation du service d'e-mail :**

   Vous pouvez maintenant utiliser la fonction `sendEmail` dans votre application pour envoyer des e-mails. Par exemple, pour envoyer un e-mail de vérification OTP :

   ```typescript
   import { sendEmail } from './email.service';

   const sendOtpEmail = async (email: string, otp: string) => {
       const subject = 'Votre code OTP de vérification';
       const text = `Votre code OTP est : ${otp}`;
       const html = `<p>Votre code OTP est : <strong>${otp}</strong></p>`;

       await sendEmail(email, subject, text, html);
   };

   // Exemple d'appel
   sendOtpEmail('user@example.com', '123456');
   ```

### Résumé

1. Installez `dotenv` et `nodemailer`.
2. Configurez le fichier `.env` avec les informations d'email.
3. Chargez les variables d'environnement dans votre application.
4. Configurez Nodemailer en utilisant ces variables.
5. Utilisez le service d'email pour envoyer des e-mails.

Cette méthode vous permet de sécuriser les informations sensibles (comme les identifiants d'email) dans le fichier `.env` et de les utiliser de manière sécurisée dans votre application.












# format gmail

Pour vérifier que l'email saisi par l'utilisateur est bien du format `@gmail.com`, vous pouvez utiliser une expression régulière (regex) pour valider le format de l'email. Voici comment vous pouvez le faire en Node.js :

### Utilisation d'une Regex pour Valider le Format de l'Email

1. **Créer une Regex pour le format `@gmail.com`** :
   ```javascript
   const gmailRegex = /^[a-zA-Z0-9._%+-]+@gmail\.com$/;
   ```

   Cette regex vérifie que l'email commence par des caractères alphanumériques ou des caractères spéciaux autorisés, suivi de `@gmail.com`.

2. **Valider l'Email Saisi** :
   ```javascript
   const validateGmail = (email) => {
       return gmailRegex.test(email);
   };
   ```

3. **Intégrer cette Validation dans votre Code** :
   ```javascript
   const email = 'user@gmail.com'; // Exemple d'email saisi par l'utilisateur

   if (validateGmail(email)) {
       console.log('Email is valid and from gmail.com');
       // Continuez avec le reste de votre logique, comme l'envoi d'un email
   } else {
       console.log('Invalid email format or not a gmail.com address');
       // Gérez l'erreur, par exemple en demandant à l'utilisateur de ressaisir l'email
   }
   ```

### Exemple Complet avec Node.js

Voici un exemple complet d'un simple serveur Express qui vérifie que l'email saisi est bien un `@gmail.com` :

1. **Installer Express** :
   ```bash
   npm install express
   ```

2. **Créer le Serveur Express** :
   ```javascript
   const express = require('express');
   const bodyParser = require('body-parser');
   const app = express();
   const port = 3000;

   app.use(bodyParser.json());

   const gmailRegex = /^[a-zA-Z0-9._%+-]+@gmail\.com$/;

   const validateGmail = (email) => {
       return gmailRegex.test(email);
   };

   app.post('/validate-email', (req, res) => {
       const { email } = req.body;

       if (validateGmail(email)) {
           res.send('Email is valid and from gmail.com');
       } else {
           res.status(400).send('Invalid email format or not a gmail.com address');
       }
   });

   app.listen(port, () => {
       console.log(`Server running on http://localhost:${port}`);
   });
   ```

3. **Tester l'Application** :
   Vous pouvez tester cette application en envoyant une requête POST avec un email au format JSON à l'endpoint `/validate-email`.

   Exemple avec `curl` :
   ```bash
   curl -X POST http://localhost:3000/validate-email -H "Content-Type: application/json" -d '{"email":"user@gmail.com"}'
   ```

   Cela devrait renvoyer `Email is valid and from gmail.com` si l'email est valide, ou une erreur `Invalid email format or not a gmail.com address` si ce n'est pas le cas.

En utilisant cette méthode, vous pouvez facilement valider que les emails saisis par les utilisateurs sont bien au format `@gmail.com` avant de procéder à toute autre opération, comme l'envoi d'emails.














Pour ajouter la validation du format de l'email `@gmail.com` dans votre contrôleur `userRegisterCtrl`, vous pouvez intégrer une fonction de validation juste après avoir récupéré les données du corps de la requête. Voici comment faire cela :

### Code Modifié

```typescript
import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';
import prisma from '../prisma'; // Assurez-vous que le chemin est correct
import bcrypt from 'bcrypt';
import crypto from 'crypto';
import sendOTPEmail from '../utils/sendOTPEmail'; // Assurez-vous que le chemin est correct
import { BadRequestException, ErrorCodes } from '../exceptions'; // Assurez-vous que le chemin est correct

export const userRegisterCtrl = async (req: Request, res: Response, next: NextFunction) => {

    // 1. Validation des entrées pour s'assurer que les formats sont bons
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    // 2. Récupération des données du corps de la requête
    const { firstname, lastname, email, phoneNumber, password } = req.body;

    // Vérification du format de l'email
    const gmailRegex = /^[a-zA-Z0-9._%+-]+@gmail\.com$/;
    if (!gmailRegex.test(email)) {
        return res.status(400).json({ error: 'Invalid email format or not a gmail.com address' });
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
            status: 'success',
            message: 'Utilisateur enregistré. Veuillez vérifier votre email pour l\'OTP.'
        });

    } catch (err) {
        // 7. Gestion des erreurs
        next(err);
    }
}
```

### Explication des Modifications

1. **Importations** :
   - Assurez-vous que tous les modules nécessaires sont correctement importés, notamment `Request`, `Response`, `NextFunction`, `prisma`, `bcrypt`, `crypto`, et votre fonction utilitaire pour envoyer les emails OTP (`sendOTPEmail`).

2. **Validation du Format de l'Email** :
   - J'ai ajouté une regex pour vérifier que l'email est bien du format `@gmail.com`. Si l'email ne correspond pas, une réponse avec le statut 400 et un message d'erreur est envoyée.

3. **Contrôle de l'Email** :
   - Avant de vérifier l'existence de l'email dans la base de données, le format est validé.

4. **Gestion des Erreurs** :
   - Si l'email n'est pas valide, une réponse avec une erreur appropriée est renvoyée avant toute autre vérification ou opération.

Ces modifications garantissent que seuls les emails de format `@gmail.com` seront acceptés lors de l'inscription.

















# OTP EMAIL

Pour implémenter l'authentification par OTP (One-Time Password) avec Nodemailer, Node.js, TypeScript, Prisma et MongoDB, suivez ces étapes :

### 1. Initialiser le Projet

Commencez par initialiser un projet Node.js et installez les dépendances nécessaires.

```bash
mkdir otp-authentication
cd otp-authentication
npm init -y
npm install express @prisma/client prisma nodemailer dotenv typescript @types/node @types/express ts-node-dev
npx tsc --init
npx prisma init
```

### 2. Configurer TypeScript

Modifiez le fichier `tsconfig.json` pour adapter la configuration TypeScript à votre projet. Assurez-vous que les options suivantes sont activées :

```json
{
  "compilerOptions": {
    "target": "ES6",
    "module": "commonjs",
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true
  }
}
```

### 3. Configurer Prisma

Modifiez le fichier `prisma/schema.prisma` pour définir le modèle d'utilisateur en utilisant MongoDB comme source de données.

```prisma
datasource db {
  provider = "mongodb"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

model User {
  id          String   @id @default(auto()) @map("_id") @db.ObjectId
  email       String   @unique
  otp         String?
  otpExpires  DateTime?
}
```
ou

```javascript
datasource db {
  provider = "mongodb"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

model User {
  id       String  @id @default(auto()) @map("_id") @db.ObjectId
  email    String  @unique
  password String
  otpVerifications UserOtpVerification[]
}

model UserOtpVerification {
  id        String   @id @default(auto()) @map("_id") @db.ObjectId
  otp       String
  otpExpires DateTime
  userId    String   @db.ObjectId
  user      User     @relation(fields: [userId], references: [id])
}

```

Exécutez les commandes Prisma pour générer le client.

```bash
npx prisma migrate dev --name init
npx prisma generate
```

### 4. Configurer l'Application Express

Créez le fichier `src/app.ts` et configurez Express et Prisma.

```typescript
import express from 'express';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';

dotenv.config();

const app = express();
const prisma = new PrismaClient();

app.use(express.json());

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
```

### 5. Configurer Nodemailer

Créez un fichier `src/config/nodemailer.ts` pour configurer Nodemailer.

```typescript
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

export const sendOTPEmail = async (email: string, otp: string) => {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: 'Your OTP Code',
    text: `Your OTP code is ${otp}`,
  };

  await transporter.sendMail(mailOptions);
};
```

### 6. Créer les Contrôleurs d'Authentification

Créez le fichier `src/controllers/authController.ts` pour gérer l'inscription et l'envoi d'OTP.

```typescript
import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { sendOTPEmail } from '../config/nodemailer';
import crypto from 'crypto';

const prisma = new PrismaClient();

export const registerUser = async (req: Request, res: Response, next: NextFunction) => {
  const { email } = req.body;

  try {
    const userExists = await prisma.user.findUnique({ where: { email } });

    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const otp = crypto.randomBytes(3).toString('hex');
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    await prisma.user.create({
      data: {
        email,
        otp,
        otpExpires,
      },
    });

    await sendOTPEmail(email, otp);

    res.status(201).json({ message: 'User registered. Please check your email for the OTP.' });
  } catch (error) {
    next(error);
  }
};

export const verifyOTP = async (req: Request, res: Response, next: NextFunction) => {
  const { email, otp } = req.body;

  try {
    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      return res.status(400).json({ message: 'User not found' });
    }

    if (user.otp !== otp || user.otpExpires < new Date()) {
      return res.status(400).json({ message: 'Invalid or expired OTP' });
    }

    await prisma.user.update({
      where: { email },
      data: {
        otp: null,
        otpExpires: null,
      },
    });

    res.status(200).json({ message: 'OTP verified successfully' });
  } catch (error) {
    next(error);
  }
};
```

### 7. Définir les Routes

Créez le fichier `src/routes/authRoutes.ts` pour définir les routes d'authentification.

```typescript
import { Router } from 'express';
import { registerUser, verifyOTP } from '../controllers/authController';

const router = Router();

router.post('/register', registerUser);
router.post('/verify-otp', verifyOTP);

export default router;
```

### 8. Ajouter les Routes à l'Application

Mettez à jour `src/app.ts` pour utiliser les routes d'authentification.

```typescript
import authRoutes from './routes/authRoutes';

app.use('/api/auth', authRoutes);
```

### 9. Créer un Middleware de Gestion des Erreurs

Créez un fichier `src/middleware/errorHandler.ts` pour gérer les erreurs.

```typescript
import { Request, Response, NextFunction } from 'express';

export const errorHandler = (err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error(err);
  res.status(500).json({ message: err.message });
};
```

Ajoutez ce middleware à votre application dans `src/app.ts`.

```typescript
import { errorHandler } from './middleware/errorHandler';

app.use(errorHandler);
```

### 10. Configurer les Variables d'Environnement

Créez un fichier `.env` pour stocker vos variables d'environnement.

```
DATABASE_URL="mongodb+srv://<username>:<password>@cluster0.mongodb.net/mydatabase?retryWrites=true&w=majority"
EMAIL_USER="your-email@gmail.com"
EMAIL_PASS="your-email-password"
PORT=5000
```

### 11. Tester l'Application

Lancez l'application et testez les différentes routes.

```bash
npm run dev
```

Vous devriez maintenant pouvoir vous inscrire avec un email, recevoir un OTP par email, et vérifier cet OTP pour terminer l'inscription.
```javascript
```
```javascript
```


OPT EMAIL V2

Vous avez deux options pour stocker les informations relatives à l'OTP (One-Time Password) : vous pouvez soit les intégrer directement dans le modèle `User`, soit créer un modèle séparé pour gérer les OTP. 

### Option 1: Intégrer les informations OTP dans le modèle `User`

Cette approche est plus simple et évite la création d'un modèle supplémentaire. Cependant, elle peut rendre le modèle `User` plus complexe.

```prisma
model User {
  id          String   @id @default(auto()) @map("_id") @db.ObjectId
  email       String   @unique
  password    String
  otp         String?
  otpExpires  DateTime?
}
```

### Option 2: Créer un modèle séparé pour les OTP

Cette approche est plus modulaire et suit le principe de séparation des préoccupations, ce qui peut rendre le code plus facile à maintenir à long terme. Dans ce cas, vous aurez un modèle `User` et un modèle `UserOtpVerification`.

#### Modèle `User`

```prisma
model User {
  id       String  @id @default(auto()) @map("_id") @db.ObjectId
  email    String  @unique
  password String
  otpVerifications UserOtpVerification[]
}
```

#### Modèle `UserOtpVerification`

```prisma
model UserOtpVerification {
  id        String   @id @default(auto()) @map("_id") @db.ObjectId
  otp       String
  otpExpires DateTime
  userId    String   @db.ObjectId
  user      User     @relation(fields: [userId], references: [id])
}
```

### Choix de l'Approche

#### Intégration dans le modèle `User`

**Avantages:**
- Simplicité.
- Moins de requêtes de base de données.

**Inconvénients:**
- Le modèle `User` peut devenir encombré.

#### Modèle séparé pour les OTP

**Avantages:**
- Modèle plus propre et modulaire.
- Facilite l'extension des fonctionnalités liées aux OTP.

**Inconvénients:**
- Complexité accrue.
- Requêtes de base de données supplémentaires.

### Mise en Place

Pour cet exemple, nous allons utiliser la deuxième option (modèle séparé pour les OTP) car elle est plus modulaire et extensible.

### 1. Configurer les Modèles Prisma

Modifiez votre fichier `schema.prisma` :

```prisma
datasource db {
  provider = "mongodb"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

model User {
  id       String  @id @default(auto()) @map("_id") @db.ObjectId
  email    String  @unique
  password String
  otpVerifications UserOtpVerification[]
}

model UserOtpVerification {
  id        String   @id @default(auto()) @map("_id") @db.ObjectId
  otp       String
  otpExpires DateTime
  userId    String   @db.ObjectId
  user      User     @relation(fields: [userId], references: [id])
}
```

### 2. Migrer la Base de Données

Générez le client Prisma et appliquez les migrations :

```bash
npx prisma migrate dev --name add_user_otp_verification
npx prisma generate
```

### 3. Créer les Contrôleurs d'OTP

#### `registerUser`

```typescript
import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { sendOTPEmail } from '../config/nodemailer';
import crypto from 'crypto';
import { BadRequestException } from '../exceptions/root';
import { ErrorCodes } from '../exceptions/errorCodes';

const prisma = new PrismaClient();

export const registerUser = async (req: Request, res: Response, next: NextFunction) => {
  const { email, password } = req.body;

  try {
    const userExists = await prisma.user.findUnique({ where: { email } });

    if (userExists) {
      return next(new BadRequestException('Utilisateur exite deja!', ErrorCodes.USER_ALREADY_EXIST));
    }

    const otp = crypto.randomBytes(3).toString('hex');
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    const newUser = await prisma.user.create({
      data: {
        email,
        password,
        otpVerifications: {
          create: {
            otp,
            otpExpires,
          },
        },
      },
    });

    await sendOTPEmail(email, otp);

    res.status(201).json({ message: 'Utilisateur enregistré. Veuillez vérifier votre email pour l\'OTP.' });
  } catch (error) {
    next(error);
  }
};
```

#### `verifyOTP`

```typescript
import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { BadRequestException } from '../exceptions/root';
import { ErrorCodes } from '../exceptions/errorCodes';

const prisma = new PrismaClient();

export const verifyOTP = async (req: Request, res: Response, next: NextFunction) => {
  const { email, otp } = req.body;

  try {
    const user = await prisma.user.findUnique({
      where: { email },
      include: { otpVerifications: true },
    });

    if (!user) {
      return next(new BadRequestException('Utilisateur non trouvé', ErrorCodes.USER_NOT_FOUND));
    }

    const userOtpVerification = user.otpVerifications.find((otpVerification) => otpVerification.otp === otp);

    if (!userOtpVerification || userOtpVerification.otpExpires < new Date()) {
      return next(new BadRequestException('OTP invalide ou expiré', ErrorCodes.INVALID_OTP));
    }

    await prisma.user.update({
      where: { email },
      data: {
        otpVerifications: {
          deleteMany: {},
        },
      },
    });

    res.status(200).json({ message: 'OTP vérifié avec succès' });
  } catch (error) {
    next(error);
  }
};
```

### 4. Définir les Routes

Créez les routes pour l'inscription et la vérification OTP dans `src/routes/authRoutes.ts`.

```typescript
import { Router } from 'express';
import { registerUser, verifyOTP } from '../controllers/authController';

const router = Router();

router.post('/register', registerUser);
router.post('/verify-otp', verifyOTP);

export default router;
```

### 5. Ajouter les Routes à l'Application

Mettez à jour `src/app.ts` pour utiliser les routes d'authentification.

```typescript
import authRoutes from './routes/authRoutes';
import { errorHandler } from './middleware/errorHandler';

app.use('/api/auth', authRoutes);
app.use(errorHandler);
```

### 6. Gérer les Erreurs

Créez un fichier `src/exceptions/errorCodes.ts` pour les codes d'erreur.

```typescript
export enum ErrorCodes {
  USER_NOT_FOUND = 1001,
  USER_ALREADY_EXIST = 1002,
  INCORRECT_PASSWORD = 1003,
  INVALID_OTP = 1004,
}
```

Créez un fichier `src/exceptions/root.ts` pour les classes d'exception.

```typescript
export class HttpException extends Error {
  message: string;
  errorCode: ErrorCodes;
  statusCode: number;
  errors: any;

  constructor(message: string, errorCode: ErrorCodes, statusCode: number, errors: any) {
    super(message);
    this.message = message;
    this.errorCode = errorCode;
    this.statusCode = statusCode;
    this.errors = errors;
  }
}

export class BadRequestException extends HttpException {
  constructor(message: string, errorCode: ErrorCodes) {
    super(message, errorCode, 400, null);
  }
}
```

### 7. Configurer Nodemailer

Configurez Nodemailer pour envoyer des emails d'OTP. Mettez à jour votre fichier `.env` avec vos informations d'email.

### 8. Tester l'Application

Lancez l'application et testez les différentes routes.

```bash
npm run dev
```

Vous devriez maintenant pouvoir vous inscrire avec un email, recevoir un OTP par email, et vérifier cet OTP pour terminer l'inscription.

```javascript
```
```javascript
```



# resending otp






Pour implémenter la fonctionnalité de renvoi d'OTP, nous allons ajouter un nouveau contrôleur et une route spécifique pour cette fonctionnalité. Cette fonctionnalité permet à l'utilisateur de demander un nouvel OTP s'il n'a pas reçu ou a perdu le précédent.

### Modifications nécessaires :

1. **Créer un contrôleur pour le renvoi de l'OTP.**
2. **Ajouter une route pour le renvoi de l'OTP.**

### 1. Créer un contrôleur pour le renvoi de l'OTP

Ajoutons la fonction `resendOTP` dans le fichier `authController.ts` :

```typescript
import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { sendOTPEmail } from '../config/nodemailer';
import crypto from 'crypto';
import { BadRequestException } from '../exceptions/root';
import { ErrorCodes } from '../exceptions/errorCodes';

const prisma = new PrismaClient();

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
```

### 2. Ajouter une route pour le renvoi de l'OTP

Ajoutons une nouvelle route dans `authRoutes.ts` pour permettre le renvoi de l'OTP :

```typescript
import { Router } from 'express';
import { registerUser, verifyOTP, resendOTP } from '../controllers/authController';

const router = Router();

router.post('/register', registerUser);
router.post('/verify-otp', verifyOTP);
router.post('/resend-otp', resendOTP);

export default router;
```

### 3. Gérer les Erreurs

Assurez-vous que vos classes d'exception et codes d'erreur sont bien définis. Voici un rappel :

#### errorCodes.ts

```typescript
export enum ErrorCodes {
  USER_NOT_FOUND = 1001,
  USER_ALREADY_EXIST = 1002,
  INCORRECT_PASSWORD = 1003,
  INVALID_OTP = 1004,
}
```

#### root.ts

```typescript
export class HttpException extends Error {
  message: string;
  errorCode: ErrorCodes;
  statusCode: number;
  errors: any;

  constructor(message: string, errorCode: ErrorCodes, statusCode: number, errors: any) {
    super(message);
    this.message = message;
    this.errorCode = errorCode;
    this.statusCode = statusCode;
    this.errors = errors;
  }
}

export class BadRequestException extends HttpException {
  constructor(message: string, errorCode: ErrorCodes) {
    super(message, errorCode, 400, null);
  }
}
```

### 4. Mettre à jour Nodemailer

Si ce n'est pas encore fait, configurez Nodemailer pour envoyer des emails. Assurez-vous d'avoir vos informations d'email correctes dans le fichier `.env`.

Voici un exemple de configuration de Nodemailer dans `nodemailer.ts` :

```typescript
import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  service: 'Gmail',
  auth: {
    user: process.env.EMAIL_USERNAME,
    pass: process.env.EMAIL_PASSWORD,
  },
});

export const sendOTPEmail = async (email: string, otp: string) => {
  const mailOptions = {
    from: process.env.EMAIL_USERNAME,
    to: email,
    subject: 'Your OTP Code',
    text: `Your OTP code is ${otp}`,
  };

  await transporter.sendMail(mailOptions);
};
```

### 5. Tester la fonctionnalité de renvoi d'OTP

1. Assurez-vous que votre application est en cours d'exécution :
    ```bash
    npm run dev
    ```

2. Effectuez une requête POST à `/api/auth/resend-otp` avec l'email de l'utilisateur dans le corps de la requête.

3. Vérifiez que l'utilisateur reçoit un nouvel OTP par email.

En suivant ces étapes, vous devriez maintenant avoir une fonctionnalité complète de renvoi d'OTP dans votre application.
```javascript
```
```javascript
```
```javascript
```


Pour créer un middleware qui vérifie si l'utilisateur connecté est un administrateur, nous devons d'abord ajouter un champ `role` ou `isAdmin` dans notre modèle `User`. Ensuite, nous allons créer un middleware qui vérifie le rôle de l'utilisateur à partir du token JWT.

### 1. Ajouter un champ `role` à votre modèle `User`

Ajoutons un champ `role` dans notre modèle `User` dans Prisma :

#### `schema.prisma`

```prisma
model User {
  id        String   @id @default(uuid())
  firstname String
  lastname  String
  email     String   @unique
  phoneNumber String @unique
  password  String
  role      String   @default("user") // Ajout du champ rôle
  otpVerifications UserOtpVerification[]
}

model UserOtpVerification {
  id         String   @id @default(uuid())
  otp        String
  otpExpires DateTime
  userId     String
  user       User     @relation(fields: [userId], references: [id])
}
```

N'oubliez pas de migrer votre base de données après avoir modifié le schéma :

```bash
npx prisma migrate dev --name add-role-to-user
```

### 2. Créer le middleware `isAdmin`

Ensuite, nous allons créer un middleware pour vérifier si l'utilisateur est un administrateur.

#### `middlewares/isAdmin.ts`

```typescript
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const ACCESS_TOKEN_SECRET = process.env.ACCESS_TOKEN || 'youraccesstokensecret';

export const isAdmin = async (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, ACCESS_TOKEN_SECRET) as { userId: string };

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.role !== 'admin') {
      return res.status(403).json({ message: 'Forbidden: Admins only' });
    }

    (req as any).user = user; // Attacher l'utilisateur à la requête
    next();
  } catch (error) {
    return res.status(403).json({ message: 'Forbidden' });
  }
};
```

### 3. Utiliser le middleware dans vos routes

Utilisez ce middleware dans vos routes qui nécessitent une vérification d'administrateur.

#### `routes/adminRoutes.ts`

```typescript
import { Router } from 'express';
import { isAdmin } from '../middlewares/isAdmin';
import { someAdminController } from '../controllers/adminController';

const router = Router();

// Protéger les routes avec le middleware isAdmin
router.get('/admin/dashboard', isAdmin, someAdminController);

export default router;
```

### 4. Exemple de contrôleur admin

Voici un exemple de contrôleur pour une route d'admin.

#### `controllers/adminController.ts`

```typescript
import { Request, Response } from 'express';

export const someAdminController = async (req: Request, res: Response) => {
  res.json({ message: 'Welcome to the admin dashboard', user: (req as any).user });
};
```

### 5. Mise à jour de votre serveur

Assurez-vous d'ajouter le nouveau routeur admin à votre serveur Express.

#### `server.ts`

```typescript
import express from 'express';
import bodyParser from 'body-parser';
import adminRoutes from './routes/adminRoutes';
import authRoutes from './routes/authRoutes';

const app = express();
const port = process.env.PORT || 9000;

app.use(bodyParser.json());

app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);

app.listen(port, () => {
  console.log(`Server is running on port http://localhost:${port}`);
});
```

En suivant ces étapes, vous avez maintenant un middleware `isAdmin` qui vérifie si l'utilisateur est un administrateur avant de lui permettre d'accéder à certaines routes protégées.
```javascript
```
```javascript
```



# Forgot password

1. L'utilisateur demande à réinitialiser son mot de passe en fournissant son email.
2. Un token de réinitialisation est généré et envoyé à l'email de l'utilisateur.
3. L'utilisateur utilise le token pour réinitialiser son mot de passe.

### 1. Ajouter un modèle pour le token de réinitialisation de mot de passe

Nous devons créer un modèle pour stocker les tokens de réinitialisation de mot de passe dans Prisma.

#### `schema.prisma`

```prisma
model User {
  id              String   @id @default(uuid())
  firstname       String
  lastname        String
  email           String   @unique
  phoneNumber     String   @unique
  password        String
  role            String   @default("user")
  passwordResets  PasswordReset[]
  otpVerifications UserOtpVerification[]
}

model PasswordReset {
  id         String   @id @default(uuid())
  token      String
  expiresAt  DateTime
  userId     String
  user       User     @relation(fields: [userId], references: [id])
}
```

N'oubliez pas de migrer votre base de données après avoir modifié le schéma :

```bash
npx prisma migrate dev --name add-password-reset
```

### 2. Créer les contrôleurs pour le mot de passe oublié

Nous allons créer deux contrôleurs : un pour demander la réinitialisation du mot de passe et un pour réinitialiser le mot de passe.

#### `controllers/authController.ts`

```typescript
import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import nodemailer from 'nodemailer';
import crypto from 'crypto';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL,
    pass: process.env.EMAIL_PASSWORD,
  },
});

export const forgotPassword = async (req: Request, res: Response, next: NextFunction) => {
  const { email } = req.body;

  try {
    // 1. Vérifier si l'utilisateur existe
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }

    // 2. Générer un token de réinitialisation de mot de passe
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 3600000); // Token expire dans 1 heure

    // 3. Sauvegarder le token dans la base de données
    await prisma.passwordReset.create({
      data: {
        token,
        expiresAt,
        userId: user.id,
      },
    });

    // 4. Envoyer l'email de réinitialisation
    const resetUrl = `http://localhost:3000/reset-password?token=${token}&id=${user.id}`;
    await transporter.sendMail({
      to: user.email,
      subject: 'Réinitialisation du mot de passe',
      html: `<p>Vous avez demandé une réinitialisation de mot de passe. Cliquez sur ce lien pour réinitialiser votre mot de passe :</p><a href="${resetUrl}">Réinitialiser le mot de passe</a>`,
    });

    res.json({ message: 'Email de réinitialisation envoyé' });
  } catch (error) {
    next(error);
  }
};

export const resetPassword = async (req: Request, res: Response, next: NextFunction) => {
  const { token, id } = req.query;
  const { newPassword } = req.body;

  try {
    // 1. Vérifier si le token est valide
    const passwordReset = await prisma.passwordReset.findFirst({
      where: {
        token: token as string,
        userId: id as string,
        expiresAt: { gte: new Date() },
      },
    });

    if (!passwordReset) {
      return res.status(400).json({ message: 'Token invalide ou expiré' });
    }

    // 2. Hacher le nouveau mot de passe
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    // 3. Mettre à jour le mot de passe de l'utilisateur
    await prisma.user.update({
      where: { id: passwordReset.userId },
      data: { password: hashedPassword },
    });

    // 4. Supprimer le token de réinitialisation de la base de données
    await prisma.passwordReset.delete({
      where: { id: passwordReset.id },
    });

    res.json({ message: 'Mot de passe réinitialisé avec succès' });
  } catch (error) {
    next(error);
  }
};
```

### 3. Ajouter les routes pour le mot de passe oublié

Nous allons créer des routes pour les deux contrôleurs.

#### `routes/authRoutes.ts`

```typescript
import { Router } from 'express';
import { forgotPassword, resetPassword } from '../controllers/authController';

const router = Router();

router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);

export default router;
```

### 4. Mettre à jour votre serveur

Assurez-vous d'ajouter le nouveau routeur d'authentification à votre serveur Express.

#### `server.ts`

```typescript
import express from 'express';
import bodyParser from 'body-parser';
import authRoutes from './routes/authRoutes';
import adminRoutes from './routes/adminRoutes';
import { errorMiddleware } from './middlewares/errorMiddleware';

const app = express();
const port = process.env.PORT || 9000;

app.use(bodyParser.json());

app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);

// Middleware de gestion des erreurs
app.use(errorMiddleware);

app.listen(port, () => {
  console.log(`Server is running on port http://localhost:${port}`);
});
```

### 5. Middleware de gestion des erreurs

Assurez-vous d'avoir un middleware de gestion des erreurs dans votre application.

#### `middlewares/errorMiddleware.ts`

```typescript
import { Request, Response, NextFunction } from 'express';
import { HttpException } from '../exceptions/root';

export const errorMiddleware = (error: HttpException, req: Request, res: Response, next: NextFunction) => {
  const statusCode = error.statusCode || 500;
  res.status(statusCode).json({
    message: error.message,
    errorCode: error.errorCode,
    errors: error.errors,
  });
};
```

Avec ces étapes, vous devriez maintenant avoir une fonctionnalité de "mot de passe oublié" pleinement fonctionnelle dans votre application utilisant TypeScript, Prisma, MongoDB et Nodemailer.
```javascript
```
```javascript
```



otp phone

Pour l'envoi de SMS dans votre application Node.js avec TypeScript et Prisma, vous pouvez gérer la configuration de l'envoi de SMS de plusieurs manières. Voici une approche typique :

### 1. Configuration des variables d'environnement

Tout d'abord, utilisez des variables d'environnement pour stocker vos informations sensibles telles que les clés d'API SMS, les numéros de téléphone de l'expéditeur, etc. Assurez-vous de ne jamais stocker ces informations directement dans votre code source pour des raisons de sécurité.

Créez un fichier `.env` à la racine de votre projet et ajoutez-y vos variables :

```plaintext
TWILIO_ACCOUNT_SID=your_twilio_account_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_PHONE_NUMBER=your_twilio_phone_number
```

### 2. Installation des dépendances

Utilisez `dotenv` pour charger les variables d'environnement à partir de votre fichier `.env` :

```bash
npm install dotenv
```

Installez également la bibliothèque `twilio` pour l'intégration avec Twilio (ou utilisez une autre bibliothèque de votre choix pour l'envoi de SMS) :

```bash
npm install twilio
```

### 3. Configuration du service d'envoi de SMS

Créez un service ou un fichier dédié pour gérer l'envoi de SMS. Voici un exemple de service utilisant Twilio :

```typescript
// sms.service.ts

import { Twilio } from 'twilio';
import dotenv from 'dotenv';

dotenv.config();

const twilioAccountSid = process.env.TWILIO_ACCOUNT_SID;
const twilioAuthToken = process.env.TWILIO_AUTH_TOKEN;
const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER;

const twilioClient = twilio(twilioAccountSid, twilioAuthToken);

export async function sendSMS(phoneNumber: string, message: string): Promise<void> {
  try {
    await twilioClient.messages.create({
      body: message,
      from: twilioPhoneNumber,
      to: phoneNumber,
    });
    console.log(`SMS envoyé à ${phoneNumber}`);
  } catch (error) {
    console.error(`Erreur lors de l'envoi de SMS à ${phoneNumber} :`, error);
    throw new Error('Erreur lors de l\'envoi de SMS.');
  }
}
```

### 4. Utilisation dans votre service OTP

Intégrez ce service dans votre service OTP pour envoyer l'OTP par SMS :

```typescript
// otp.service.ts

import otpGenerator from 'otp-generator';
import { PrismaClient } from '@prisma/client';
import { sendSMS } from './sms.service';

const prisma = new PrismaClient();

export async function generateAndSendOTP(userId: number): Promise<void> {
  const otp = otpGenerator.generate(6, { upperCase: false, specialChars: false, alphabets: false });

  // Mettre à jour l'utilisateur avec l'OTP généré
  await prisma.user.update({
    where: { id: userId },
    data: { otp },
  });

  // Envoyer l'OTP par SMS
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (user?.phoneNumber) {
    const message = `Votre code OTP est : ${otp}. Ne le partagez avec personne.`;
    await sendSMS(user.phoneNumber, message);
  } else {
    throw new Error('L\'utilisateur n\'a pas de numéro de téléphone.');
  }
}
```

### Points à considérer

- **Sécurité :** Assurez-vous de sécuriser vos clés d'API et numéros de téléphone en les stockant dans des variables d'environnement.
- **Gestion des erreurs :** Capturez et gérez les erreurs de manière appropriée pour assurer la fiabilité de l'envoi de SMS.
- **Tests :** Testez l'envoi de SMS dans différents scénarios pour vous assurer que tout fonctionne correctement.

Cette approche vous permet de séparer clairement la configuration et l'envoi de SMS dans votre application, rendant le code plus modulaire et plus facile à maintenir. Assurez-vous d'adapter ce code à vos besoins spécifiques et de suivre les meilleures pratiques pour l'intégration d'API SMS dans votre application.
```javascript
```
```javascript
```

Generer parrain link
Pour générer un lien de parrainage qui commence par "Ego" suivi de 7 caractères alphanumériques aléatoires, vous pouvez utiliser la méthode suivante en TypeScript avec Node.js. Voici comment vous pourriez le faire :

### Étapes pour générer le lien de parrainage

1. **Installation de la bibliothèque `randomstring` :**

   Utilisez la bibliothèque `randomstring` pour générer facilement des chaînes aléatoires.

   ```bash
   npm install randomstring
   ```

2. **Code pour générer le lien de parrainage :**

   Créez une fonction ou un service dédié qui génère le lien de parrainage comme requis.

   ```typescript
   // referral.service.ts

   import randomstring from 'randomstring';

   export function generateReferralLink(): string {
       const prefix = 'Ego';
       const randomChars = randomstring.generate({ length: 7, charset: 'alphanumeric' });
       return `${prefix}${randomChars}`;
   }
   ```

   Cette fonction `generateReferralLink` utilise `randomstring` pour générer une chaîne alphanumérique aléatoire de 7 caractères. Elle préfixe ensuite cette chaîne avec "Ego" pour former le lien de parrainage complet.

3. **Utilisation dans votre application :**

   Vous pouvez maintenant utiliser cette fonction où vous avez besoin de générer des liens de parrainage. Par exemple, dans une route de création de compte ou dans un service de gestion des utilisateurs :

   ```typescript
   import { generateReferralLink } from './referral.service';

   // Exemple d'utilisation
   const referralLink = generateReferralLink();
   console.log('Referral Link:', referralLink);
   // Output: Referral Link: Ego1aB2cD
   ```

### Points à considérer :

- **Sécurité :** Bien que ce lien ne soit pas un secret, il est généré de manière aléatoire et doit être unique pour chaque utilisateur.
- **Validation :** Assurez-vous que le lien généré respecte vos exigences en matière de format et de longueur.
- **Stockage :** Si vous avez besoin de stocker ces liens dans une base de données, assurez-vous d'avoir une colonne adéquate pour les stocker en toute sécurité.

Cette approche vous permet de générer facilement des liens de parrainage uniques conformes à vos spécifications, en utilisant des outils simples et largement disponibles dans l'écosystème Node.js. Assurez-vous de tester et d'intégrer cette fonctionnalité selon les besoins spécifiques de votre application.
```javascript
```
```javascript
```
```javascript
```
```javascript
```











# SUSUSUSUSUPERADMIN


Configurer un super admin directement dans le code ou dans le fichier `.env` est une approche courante pour des raisons de sécurité et de contrôle. Cela garantit que le super admin n'a pas besoin de s'inscrire comme un utilisateur normal et que les informations sensibles telles que les identifiants peuvent être sécurisées correctement. Voici une bonne pratique pour gérer le super admin dans une application Node.js utilisant Prisma et JWT :

### 1. Configuration du Super Admin dans `.env`

Ajoutez les informations du super admin dans votre fichier `.env` :

```env
SUPER_ADMIN_EMAIL=superadmin@example.com
SUPER_ADMIN_PASSWORD=supersecurepassword
```

### 2. Initialisation du Super Admin dans le Code

Ajoutez une fonction qui s'exécute au démarrage de l'application pour créer le super admin s'il n'existe pas déjà. Cela peut être fait dans le fichier principal de votre application (par exemple, `server.ts` ou `app.ts`).

```typescript
import prisma from './prisma'; // Assurez-vous que le chemin est correct
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';

dotenv.config();

const initializeSuperAdmin = async () => {
    const { SUPER_ADMIN_EMAIL, SUPER_ADMIN_PASSWORD } = process.env;

    if (!SUPER_ADMIN_EMAIL || !SUPER_ADMIN_PASSWORD) {
        throw new Error('Super admin credentials are not set in the environment variables.');
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
                role: 'SUPER_ADMIN',
                isVerified: true,
                status: 'active'
            }
        });

        console.log('Super admin created');
    } else {
        console.log('Super admin already exists');
    }
};

// Appelez cette fonction au démarrage de l'application
initializeSuperAdmin().catch((err) => {
    console.error('Error initializing super admin:', err);
});
```

### 3. Middleware d'Authentification

Créez un middleware pour vérifier les rôles des utilisateurs, notamment pour protéger les routes réservées aux administrateurs :

```typescript
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import prisma from './prisma'; // Assurez-vous que le chemin est correct

export const authenticate = async (req: Request, res: Response, next: NextFunction) => {
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
        return res.status(401).json({ error: 'Access denied. No token provided.' });
    }

    try {
        const decoded = jwt.verify(token, 'your-secret-key') as { userId: string };
        const user = await prisma.user.findUnique({
            where: { id: decoded.userId }
        });

        if (!user) {
            return res.status(401).json({ error: 'Access denied. Invalid token.' });
        }

        req.user = user;
        next();
    } catch (err) {
        res.status(400).json({ error: 'Invalid token' });
    }
};

export const authorize = (role: string) => {
    return (req: Request, res: Response, next: NextFunction) => {
        if (req.user.role !== role) {
            return res.status(403).json({ error: 'Access denied. You do not have the required role.' });
        }
        next();
    };
};
```

### 4. Protéger les Routes

Utilisez les middlewares `authenticate` et `authorize` pour protéger les routes réservées aux administrateurs :

```typescript
import express from 'express';
import { authenticate, authorize } from './middlewares/authMiddleware'; // Assurez-vous que le chemin est correct

const router = express.Router();

router.post('/admin-route', authenticate, authorize('ADMIN'), (req, res) => {
    // Route réservée aux administrateurs
    res.status(200).json({ message: 'Welcome, admin!' });
});

router.post('/super-admin-route', authenticate, authorize('SUPER_ADMIN'), (req, res) => {
    // Route réservée aux super administrateurs
    res.status(200).json({ message: 'Welcome, super admin!' });
});

export default router;
```

### Explications

1. **Configuration dans `.env`** : Les informations sensibles du super admin sont stockées dans le fichier `.env` pour une meilleure gestion de la configuration et la sécurité.
   
2. **Initialisation du Super Admin** : Au démarrage de l'application, une fonction vérifie si le super admin existe déjà dans la base de données. Si ce n'est pas le cas, elle le crée avec les informations fournies dans le fichier `.env`.

3. **Middleware d'Authentification et d'Autorisation** : Deux middlewares sont créés : un pour vérifier l'authentification et un autre pour vérifier les autorisations basées sur les rôles.

4. **Protéger les Routes** : Les routes réservées aux administrateurs et super administrateurs sont protégées à l'aide des middlewares d'authentification et d'autorisation.

En suivant ces étapes, vous vous assurez que le super admin est correctement configuré et sécurisé, sans nécessiter une création de compte traditionnelle.






```javascript
```
```javascript
```
```javascript
```
```javascript
```
```javascript
```
```javascript
```
## ETAPE 4: ETABLIE LE MODEL USER

```javascript
```
```javascript
```
```javascript
```
```javascript
```
```javascript
```
```javascript
```
```javascript
```
```javascript
```
```javascript
```
```javascript
```
```javascript
```
```javascript
```
```javascript
```
```javascript
```
```javascript
```
```javascript
```
```javascript
```
```javascript
```
```javascript
```
```javascript
```
```javascript
```
```javascript
```
```javascript
```
```javascript
```
```javascript
```
```javascript
```
```javascript
```
```javascript
```
```javascript
```
```javascript
```
```javascript
```
```javascript
```
```javascript
```
```javascript
```
```javascript
```
```javascript
```
```javascript
```
```javascript
```
```javascript
```
```javascript
```
```javascript
```
```javascript
```
```javascript
```
```javascript
```
```javascript
```
```javascript
```
```javascript
```
```javascript
```
```javascript
```
```javascript
```
```javascript
```
```javascript
```
```javascript
```
```javascript
```
```javascript
```
```javascript
```
```javascript
```
```javascript
```