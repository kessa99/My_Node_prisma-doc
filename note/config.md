Pour gérer la configuration des variables d'environnement en TypeScript avec Prisma et MongoDB, vous pouvez suivre les mêmes concepts de base que ceux décrits précédemment, mais en utilisant des types TypeScript pour garantir une meilleure sécurité et une meilleure expérience de développement. Voici comment vous pouvez le faire :

### Étape 1 : Installer les dépendances nécessaires

Installez `dotenv` si ce n'est pas déjà fait.

```bash
npm install dotenv
```

### Étape 2 : Créer un fichier `.env`

Créez un fichier `.env` à la racine de votre projet et ajoutez-y vos variables d'environnement. Par exemple :

```env
PORT=3000
DATABASE_URL=mongodb://localhost:27017/mydatabase
JWT_SECRET=your_jwt_secret
RATE_LIMIT_WINDOW_MS=900000  # 15 minutes
RATE_LIMIT_MAX_REQUESTS=100
```

### Étape 3 : Créer un fichier de configuration TypeScript

Créez un fichier `config.ts` pour centraliser toutes vos configurations. Ce fichier lira les variables d'environnement et les exposera sous forme d'objet.

```typescript
// config.ts
import dotenv from 'dotenv';

// Charger les variables d'environnement depuis le fichier .env
dotenv.config();

interface Config {
    port: number;
    databaseUrl: string;
    jwtSecret: string;
    rateLimit: {
        windowMs: number;
        max: number;
    };
}

const config: Config = {
    port: parseInt(process.env.PORT || '3000', 10),
    databaseUrl: process.env.DATABASE_URL as string,
    jwtSecret: process.env.JWT_SECRET as string,
    rateLimit: {
        windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10), // 15 minutes par défaut
        max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10) // 100 requêtes par défaut
    }
};

export default config;
```

### Étape 4 : Utiliser le fichier de configuration dans votre application

Importez et utilisez le fichier de configuration dans votre application TypeScript.

```typescript
// server.ts (ou app.ts)
import express, { Request, Response, NextFunction } from 'express';
import rateLimit from 'express-rate-limit';
import xss from 'xss-clean';
import helmet from 'helmet';
import config from './config';

const app = express();

// Middleware de limitation des requêtes
const limiter = rateLimit({
    windowMs: config.rateLimit.windowMs,
    max: config.rateLimit.max,
    message: 'Trop de requêtes créées à partir de cette IP, veuillez réessayer après 15 minutes.'
});

app.use(limiter);

// Middleware de protection contre les injections XSS
app.use(xss());

// Middleware de sécurité HTTP headers
app.use(helmet());

// Autres middlewares et routes
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Exemple de route
app.get('/', (req: Request, res: Response) => {
    res.send('Hello, world!');
});

// Gestion des erreurs
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
    console.error(err.stack);
    res.status(500).send('Something broke!');
});

// Démarrer le serveur
const PORT = config.port;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
```

### Explication

1. **`dotenv`** : Ce package charge les variables d'environnement depuis le fichier `.env` et les injecte dans `process.env`.
2. **Fichier de configuration (`config.ts`)** : Ce fichier centralise toutes les configurations et lit les variables d'environnement depuis `process.env`, en utilisant des types pour garantir que les variables sont correctement définies.
3. **Utilisation des configurations** : Le fichier de configuration est importé et utilisé dans l'application pour configurer des middlewares et d'autres parties de l'application.

Cette approche assure que votre application est bien structurée, maintenable et que les variables d'environnement sont correctement typées et faciles à gérer.