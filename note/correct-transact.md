Je comprends mieux maintenant. Vous avez besoin de gérer deux types de transactions simultanément lors d'un transfert d'argent :

1. **Débit du client** : C'est le processus où vous débitez le compte du client pour transférer de l'argent vers un autre compte.
2. **Crédit du marchand (et commission)** : En plus du transfert vers le destinataire final, votre application doit également créditer son propre compte avec une commission.

Pour gérer cela efficacement dans votre modèle de données et votre logique métier, voici comment vous pouvez structurer cela avec Prisma, Node.js, TypeScript et MongoDB :

### Modèle de Données (schema.prisma)

Vous devez avoir des entités distinctes pour représenter les différentes parties impliquées dans le processus de transfert :

```prisma
// schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "mongodb"
  url      = env("DATABASE_URL")
}

model Transaction {
  id               String   @id @default(auto()) @map("_id") @db.ObjectId
  idRequete        String   @unique
  expediteur       String   // Numéro de téléphone du client
  destinataire     String   // Numéro de téléphone du bénéficiaire du transfert
  montant          Float
  commission       Float
  montantNet       Float
  dateHeureRequete DateTime
  statutRequete    String   @default("EN_ATTENTE")
  description      String
  refCommande      String
  codeDebit        String?  // Code de traitement du débit
  messageDebit     String?  // Message de traitement du débit
  codeCreditApp    String?  // Code de traitement du crédit pour votre application (commission)
  messageCreditApp String?  // Message de traitement du crédit pour votre application (commission)
  codeCreditMarchand String? // Code de traitement du crédit pour le marchand (destinataire final)
  messageCreditMarchand String? // Message de traitement du crédit pour le marchand (destinataire final)
  createdAt        DateTime @default(now())
  updatedAt        DateTime @updatedAt
}
```

### Logique de Gestion des Transactions

Vous devez implémenter la logique pour gérer simultanément le débit du client et le crédit vers votre compte (pour la commission) et vers le compte du marchand (pour le montant net).

Voici un exemple de fonction qui pourrait être utilisée pour gérer cette transaction :

```typescript
// src/services/transactionService.ts

import prisma from '../prisma';

interface TransferDetails {
  idRequete: string;
  expediteur: string;
  destinataire: string;
  montant: number;
  commission: number;
  montantNet: number;
  dateHeureRequete: Date;
  description: string;
  refCommande: string;
}

async function transferMoney(details: TransferDetails): Promise<any> {
  const {
    idRequete,
    expediteur,
    destinataire,
    montant,
    commission,
    montantNet,
    dateHeureRequete,
    description,
    refCommande,
  } = details;

  try {
    // Enregistrement de la transaction de débit dans la base de données
    const transactionDebit = await prisma.transaction.create({
      data: {
        idRequete,
        expediteur,
        destinataire,
        montant,
        commission,
        montantNet,
        dateHeureRequete,
        statutRequete: 'EN_ATTENTE',
        description,
        refCommande,
      },
    });

    // Ici, vous appelleriez l'API TogoCom pour effectuer le débit vers le destinataire final
    // Exemple simplifié de l'appel à l'API TogoCom pour le débit
    // const debitResponse = await togoComService.debitAccount({ idRequete, expediteur, destinataire, montant, refCommande, dateHeureRequete });

    // Enregistrement de la transaction de crédit pour votre application (commission)
    const commissionTransaction = await prisma.transaction.create({
      data: {
        idRequete,
        expediteur,
        destinataire: 'Votre compte', // Remplacez par l'identifiant de votre compte d'application
        montant: commission,
        commission,
        montantNet: 0,
        dateHeureRequete,
        statutRequete: 'EN_ATTENTE',
        description: 'Commission pour la transaction',
        refCommande: `REF-${Math.random().toString(36).substring(7)}`, // Générez une référence de commande aléatoire
      },
    });

    // Ici, vous mettriez en œuvre le crédit sur votre compte pour la commission

    // Exemple simplifié de retour réussi pour la réponse à l'utilisateur
    const response = {
      code: '2000',
      message: 'Demande en cours de traitement',
      idRequete,
      refCommande,
    };

    return response;
  } catch (error) {
    console.error('Erreur lors du transfert d\'argent :', error);
    throw error;
  }
}

export { transferMoney };
```

### Explication :

1. **`transferMoney` :** Cette fonction représente le processus complet de transfert d'argent. Elle enregistre d'abord les détails de la transaction dans la base de données (pour le débit et la commission). Ensuite, elle appellerait l'API TogoCom pour effectuer le débit vers le destinataire final. Enfin, elle enregistre également la commission pour votre application.

2. **Logique d'API TogoCom :** Vous devrez implémenter ou adapter l'appel à l'API TogoCom pour effectuer le débit vers le destinataire final. Cela implique d'utiliser les informations telles que `idRequete`, `expediteur`, `destinataire`, `montant`, etc.

3. **Gestion de la Commission :** Vous enregistrez également la commission dans la base de données et effectuez le crédit sur votre propre compte (représenté ici par "Votre compte").

4. **Réponse :** Vous retournez une réponse appropriée indiquant que la demande est en cours de traitement.

### Conclusion :

Ce modèle vous permet de gérer simultanément le débit vers le destinataire final et le crédit pour la commission dans votre application. Assurez-vous de suivre les spécifications et les mécanismes fournis par TogoCom pour effectuer ces opérations de manière sécurisée et efficace. Adapté à votre environnement Prisma, Node.js, TypeScript et MongoDB, cela devrait vous fournir une base solide pour implémenter la fonctionnalité de transfert d'argent avec gestion de commission dans votre application.



















































# bonne version

Pour implémenter une transaction atomique avec Prisma, MongoDB, Node.js, et TypeScript, en prenant en compte les opérations de débit, de crédit vers le destinataire, et de crédit vers le marchand, voici comment vous pourriez organiser votre code :

### Prérequis
Assurez-vous d'avoir configuré correctement Prisma pour utiliser MongoDB et que vous disposez des dépendances nécessaires comme Axios pour les appels HTTP.

### Code de `transactionService.ts`

```typescript
import prisma from '../prisma'; // Importez votre client Prisma configuré pour MongoDB
import axios from 'axios';

interface TransferDetails {
  idRequete: string;
  expediteur: string;
  destinataire: string;
  montant: number;
  commission: number;
  montantNet: number;
  dateHeureRequete: Date;
  description: string;
  refCommande: string;
}

async function creditRecipient(details: TransferDetails): Promise<any> {
  const {
    idRequete,
    destinataire,
    montant,
    refCommande,
    dateHeureRequete,
    description,
  } = details;

  try {
    // Appel à l'API TogoCom pour effectuer le crédit vers le destinataire
    const creditResponse = await axios.post('https://ms-tpc-prep.togocom.tg/api/tpcredit', {
      idRequete,
      numeroClient: destinataire,
      montant,
      refCommande,
      dateHeureRequete: dateHeureRequete.toISOString(),
      description,
    });

    // Enregistrement de la réponse de crédit dans la base de données
    const transactionCredit = await prisma.transaction.create({
      data: {
        idRequete,
        expediteur: 'Votre compte', // Changer pour l'expéditeur réel si nécessaire
        destinataire,
        montant,
        commission: 0, // La commission n'est pas applicable pour le crédit
        montantNet: montant, // Montant net crédité au destinataire
        dateHeureRequete,
        statutRequete: 'EN_ATTENTE', // Ou le statut approprié en fonction de la réponse de l'API
        description: 'Crédit vers le destinataire',
        refCommande: `REF-${Math.random().toString(36).substring(7)}`, // Générez une référence de commande aléatoire
      },
    });

    return creditResponse.data; // Retourne la réponse de l'API TogoCom
  } catch (error) {
    console.error('Erreur lors du crédit vers le destinataire :', error);
    throw error;
  }
}

async function creditMerchant(details: TransferDetails): Promise<void> {
  const {
    idRequete,
    expediteur,
    commission,
    dateHeureRequete,
    refCommande,
  } = details;

  try {
    // Enregistrement de la transaction de crédit pour le marchand
    const merchantTransaction = await prisma.transaction.create({
      data: {
        idRequete,
        expediteur,
        destinataire: 'Votre compte', // Remplacez par l'identifiant de votre compte marchand
        montant: commission,
        commission,
        montantNet: 0,
        dateHeureRequete,
        statutRequete: 'EN_ATTENTE',
        description: 'Commission pour la transaction',
        refCommande: `REF-${Math.random().toString(36).substring(7)}`, // Générez une référence de commande aléatoire
      },
    });

    // Implémentez ici la logique pour créditer le compte du marchand
    // Cela pourrait inclure l'envoi de fonds vers le compte bancaire du marchand, par exemple
    // Assurez-vous de gérer cette opération de manière sécurisée et atomique si possible
    // (par exemple, en utilisant des transactions bancaires ou des services de paiement tiers)

  } catch (error) {
    console.error('Erreur lors du crédit vers le marchand :', error);
    throw error;
  }
}

async function transferMoney(details: TransferDetails): Promise<any> {
  const {
    idRequete,
    expediteur,
    destinataire,
    montant,
    commission,
    montantNet,
    dateHeureRequete,
    description,
    refCommande,
  } = details;

  const session = await prisma.$connect(); // Démarrer une session Prisma pour la transaction

  try {
    await session.startTransaction();

    // Enregistrement de la transaction de débit dans la base de données
    const transactionDebit = await prisma.transaction.create({
      data: {
        idRequete,
        expediteur,
        destinataire,
        montant,
        commission,
        montantNet,
        dateHeureRequete,
        statutRequete: 'EN_ATTENTE',
        description,
        refCommande,
      },
    });

    // Appeler la fonction pour créditer le destinataire
    const creditResult = await creditRecipient(details);

    // Enregistrer la transaction de commission pour votre application (marchand)
    const commissionTransaction = await prisma.transaction.create({
      data: {
        idRequete,
        expediteur,
        destinataire: 'Votre compte', // Remplacez par l'identifiant de votre compte d'application
        montant: commission,
        commission,
        montantNet: 0,
        dateHeureRequete,
        statutRequete: 'EN_ATTENTE',
        description: 'Commission pour la transaction',
        refCommande: `REF-${Math.random().toString(36).substring(7)}`, // Générez une référence de commande aléatoire
      },
    });

    // Appeler la fonction pour créditer le marchand
    await creditMerchant({
      idRequete,
      expediteur,
      commission,
      dateHeureRequete,
      refCommande,
    });

    await session.commitTransaction();

    // Exemple simplifié de retour réussi pour la réponse à l'utilisateur
    const response = {
      code: '2000',
      message: 'Demande en cours de traitement',
      idRequete,
      refCommande,
    };

    return response;
  } catch (error) {
    await session.abortTransaction();
    console.error('Erreur lors du transfert d\'argent :', error);
    throw error;
  } finally {
    await session.close(); // Fermer la session Prisma après la transaction
  }
}

export { transferMoney };
```

### Explication

1. **Fonction `creditRecipient` :**
   - Cette fonction envoie une requête HTTP POST à l'API TogoCom pour créditer le destinataire avec les détails fournis.
   - Elle enregistre ensuite la transaction de crédit dans la base de données à l'aide de Prisma.

2. **Fonction `creditMerchant` :**
   - Cette fonction enregistre une transaction de crédit pour le marchand dans la base de données à l'aide de Prisma.
   - Vous devrez implémenter la logique spécifique pour créditer le compte du marchand selon les exigences de votre application (par exemple, en utilisant une API bancaire ou un service de paiement).

3. **Fonction `transferMoney` :**
   - Cette fonction orchestre l'ensemble du processus de transfert d'argent.
   - Elle commence par enregistrer la transaction de débit dans la base de données.
   - Ensuite, elle appelle `creditRecipient` pour créditer le destinataire.
   - Elle enregistre également la transaction de commission pour votre application (marchand).
   - Enfin, elle appelle `creditMerchant` pour créditer le marchand.
   - Tout cela est encapsulé dans une transaction Prisma, assurant ainsi que toutes les opérations réussissent ou échouent ensemble de manière atomique.

4. **Gestion des transactions avec Prisma :**
   - `await session.startTransaction()` démarre une transaction Prisma pour encapsuler toutes les opérations dans une unité atomique.
   - `await session.commitTransaction()` confirme la transaction si toutes les opérations sont réussies.
   - `await session.abortTransaction()` annule la transaction en cas d'erreur pour revenir à un état cohérent.
   - `await session.close()` ferme la session Prisma après la transaction pour libérer les ressources.

### Conseils supplémentaires

- **Tests :** Testez rigoureusement cette implémentation pour vous assurer qu'elle fonctionne correctement dans divers scénarios (succès, échecs, erreurs réseau, etc.).
- **Sécurité :** Assurez-vous de sécuriser les appels API et les transactions bancaires en utilisant des méthodes appropriées de gestion des erreurs et de vérification des autorisations.
- **Optimisation :** Optimisez le code et gérez les performances selon les besoins de votre application, en tenant compte des aspects comme la gestion des erreurs et les temps de réponse.

En suivant ces étapes, vous devriez être en mesure de mettre en place efficacement une transaction atomique pour les opérations de débit, de crédit vers le destinataire et de crédit vers le marchand dans votre application backend. Assurez-vous de personnaliser et de tester le code en fonction des exigences spéc











































































Pour implémenter de manière cohérente les services, le contrôleur et les routes pour votre application de transfert d'argent en utilisant TypeScript avec Prisma et Axios, voici comment vous pouvez organiser votre code :

### Services (transactionService.ts)

Voici votre fichier `transactionService.ts` ajusté pour gérer les transactions de manière sécurisée et atomique :

```typescript
import prisma from '../prisma'; // Importez votre client Prisma configuré pour MongoDB
import axios from 'axios';

interface TransferDetails {
  idRequete: string;
  expediteur: string;
  destinataire: string;
  montant: number;
  commission: number;
  montantNet: number;
  dateHeureRequete: Date;
  description: string;
  refCommande: string;
}

async function creditRecipient(details: TransferDetails): Promise<any> {
  const {
    idRequete,
    destinataire,
    montant,
    refCommande,
    dateHeureRequete,
    description,
  } = details;

  try {
    // Appel à l'API TogoCom pour effectuer le crédit vers le destinataire
    const creditResponse = await axios.post('https://ms-tpc-prep.togocom.tg/api/tpcredit', {
      idRequete,
      numeroClient: destinataire,
      montant,
      refCommande,
      dateHeureRequete: dateHeureRequete.toISOString(),
      description,
    });

    // Enregistrement de la réponse de crédit dans la base de données
    const transactionCredit = await prisma.transaction.create({
      data: {
        idRequete,
        expediteur: 'Votre compte', // Changer pour l'expéditeur réel si nécessaire
        destinataire,
        montant,
        commission: 0, // La commission n'est pas applicable pour le crédit
        montantNet: montant, // Montant net crédité au destinataire
        dateHeureRequete,
        statutRequete: 'EN_ATTENTE', // Ou le statut approprié en fonction de la réponse de l'API
        description: 'Crédit vers le destinataire',
        refCommande: `REF-${Math.random().toString(36).substring(7)}`, // Générez une référence de commande aléatoire
      },
    });

    return creditResponse.data; // Retourne la réponse de l'API TogoCom
  } catch (error) {
    console.error('Erreur lors du crédit vers le destinataire :', error);
    throw error;
  }
}

async function creditMerchant(details: TransferDetails): Promise<void> {
  const {
    idRequete,
    expediteur,
    commission,
    dateHeureRequete,
    refCommande,
  } = details;

  try {
    // Enregistrement de la transaction de crédit pour le marchand
    const merchantTransaction = await prisma.transaction.create({
      data: {
        idRequete,
        expediteur,
        destinataire: 'Votre compte', // Remplacez par l'identifiant de votre compte marchand
        montant: commission,
        commission,
        montantNet: 0,
        dateHeureRequete,
        statutRequete: 'EN_ATTENTE',
        description: 'Commission pour la transaction',
        refCommande: `REF-${Math.random().toString(36).substring(7)}`, // Générez une référence de commande aléatoire
      },
    });

    // Implémentez ici la logique pour créditer le compte du marchand
    // Cela pourrait inclure l'envoi de fonds vers le compte bancaire du marchand, par exemple
    // Assurez-vous de gérer cette opération de manière sécurisée et atomique si possible
    // (par exemple, en utilisant des transactions bancaires ou des services de paiement tiers)

  } catch (error) {
    console.error('Erreur lors du crédit vers le marchand :', error);
    throw error;
  }
}

async function transferMoney(details: TransferDetails): Promise<any> {
  const {
    idRequete,
    expediteur,
    destinataire,
    montant,
    commission,
    montantNet,
    dateHeureRequete,
    description,
    refCommande,
  } = details;

  const session = await prisma.$connect(); // Démarrer une session Prisma pour la transaction

  try {
    await session.startTransaction();

    // Enregistrement de la transaction de débit dans la base de données
    const transactionDebit = await prisma.transaction.create({
      data: {
        idRequete,
        expediteur,
        destinataire,
        montant,
        commission,
        montantNet,
        dateHeureRequete,
        statutRequete: 'EN_ATTENTE',
        description,
        refCommande,
      },
    });

    // Appeler la fonction pour créditer le destinataire
    const creditResult = await creditRecipient(details);

    // Enregistrer la transaction de commission pour votre application (marchand)
    const commissionTransaction = await prisma.transaction.create({
      data: {
        idRequete,
        expediteur,
        destinataire: 'Votre compte', // Remplacez par l'identifiant de votre compte d'application
        montant: commission,
        commission,
        montantNet: 0,
        dateHeureRequete,
        statutRequete: 'EN_ATTENTE',
        description: 'Commission pour la transaction',
        refCommande: `REF-${Math.random().toString(36).substring(7)}`, // Générez une référence de commande aléatoire
      },
    });

    // Appeler la fonction pour créditer le marchand
    await creditMerchant({
      idRequete,
      expediteur,
      commission,
      dateHeureRequete,
      refCommande,
    });

    await session.commitTransaction();

    // Exemple simplifié de retour réussi pour la réponse à l'utilisateur
    const response = {
      code: '2000',
      message: 'Demande en cours de traitement',
      idRequete,
      refCommande,
    };

    return response;
  } catch (error) {
    await session.abortTransaction();
    console.error('Erreur lors du transfert d\'argent :', error);
    throw error;
  } finally {
    await session.close(); // Fermer la session Prisma après la transaction
  }
}

export { transferMoney };
```

### Contrôleur (transactionController.ts)

Votre contrôleur (`transactionController.ts`) pour gérer les requêtes HTTP :

```typescript
import { Request, Response } from 'express';
import { transferMoney } from '../services/transactionService';

async function transferMoneyController(req: Request, res: Response): Promise<void> {
  try {
    // Récupérer les données nécessaires de la requête HTTP
    const { expediteur, destinataire, montant, description } = req.body;

    // Appel de la fonction de service pour effectuer le transfert d'argent
    const result = await transferMoney({
      expediteur,
      destinataire,
      montant,
      description,
    });

    // Répondre avec le résultat de la transaction
    res.status(200).json(result);
  } catch (error) {
    console.error('Erreur lors du transfert d\'argent :', error);
    res.status(500).json({ message: 'Erreur lors du transfert d\'argent', error: error.message });
  }
}

export { transferMoneyController };
```

### Routes (routes.ts)

Vos routes (`routes.ts`) pour diriger les requêtes HTTP vers les contrôleurs appropriés :

```typescript
import express from 'express';
import { transferMoneyController } from './controllers/transactionController';

const router = express.Router();

// Endpoint pour transférer de l'argent
router.post('/transfer', transferMoneyController);

export default router;
```

### Explication

1. **Services (`transactionService.ts`)** : Gère la logique métier des transactions en utilisant Prisma pour interagir avec la base de données et Axios pour faire des appels HTTP à l'API externe.

2. **Contrôleur (`transactionController.ts`)** : Traite les requêtes HTTP, récupère les données nécessaires, appelle les fonctions appropriées du service et renvoie la réponse.

3. **Routes (`routes.ts`)** : Définit les routes HTTP de l'API, associant les méthodes HTTP aux fonctions de contrôleur correspondantes.

Assurez-vous d'avoir configuré Express correctement pour utiliser ces routes dans votre application. Ces ajustements devraient vous permettre de mettre en œuvre un système de transfert d'argent robuste et sécurisé. Assurez-vous également de tester soigneusement toutes les fonctionnalités pour garantir leur bon fonctionnement dans votre environnement de production.



























Oui, il est tout à fait possible et recommandé de stocker les clés d'API et autres informations sensibles dans un fichier `.env` pour les appeler dans votre code au besoin. Voici comment vous pouvez le faire :

### 1. Installation de `dotenv`

Tout d'abord, installez le package `dotenv` qui permet de charger les variables d'environnement à partir d'un fichier `.env` :

```bash
npm install dotenv
```

### 2. Création du Fichier `.env`

Créez un fichier `.env` à la racine de votre projet et ajoutez-y vos clés d'API :

```
API_KEY=Votre_Cle_API_TogoCel
```

### 3. Chargement des Variables d'Environnement

Dans votre fichier principal, généralement `index.ts` ou `app.ts`, chargez les variables d'environnement au début du fichier :

```typescript
import dotenv from 'dotenv';

dotenv.config();
```

### 4. Utilisation des Variables d'Environnement dans Votre Code

Vous pouvez maintenant accéder aux variables d'environnement en utilisant `process.env`. Voici comment vous pouvez modifier la fonction `creditRecipient` pour utiliser la clé d'API stockée dans le fichier `.env` :

```typescript
import prisma from '../prisma';
import axios from 'axios';

interface TransferDetails {
  idRequete: string;
  expediteur: string;
  destinataire: string;
  montant: number;
  commission: number;
  montantNet: number;
  dateHeureRequete: Date;
  description: string;
  refCommande: string;
}

async function creditRecipient(details: TransferDetails): Promise<any> {
  const {
    idRequete,
    destinataire,
    montant,
    refCommande,
    dateHeureRequete,
    description,
  } = details;

  try {
    // Appel à l'API TogoCom pour effectuer le crédit vers le destinataire
    const creditResponse = await axios.post(
      'https://ms-tpc-prep.togocom.tg/api/tpcredit',
      {
        idRequete,
        numeroClient: destinataire,
        montant,
        refCommande,
        dateHeureRequete: dateHeureRequete.toISOString(),
        description,
      },
      {
        headers: {
          'Authorization': `Bearer ${process.env.API_KEY}`, // Utilisation de la clé d'API depuis le fichier .env
          'Content-Type': 'application/json', // Spécification du type de contenu JSON
        },
      }
    );

    // Enregistrement de la réponse de crédit dans la base de données
    const transactionCredit = await prisma.transaction.create({
      data: {
        idRequete,
        expediteur: 'Votre compte', // Changer pour l'expéditeur réel si nécessaire
        destinataire,
        montant,
        commission: 0, // La commission n'est pas applicable pour le crédit
        montantNet: montant, // Montant net crédité au destinataire
        dateHeureRequete,
        statutRequete: 'EN_ATTENTE', // Ou le statut approprié en fonction de la réponse de l'API
        description: 'Crédit vers le destinataire',
        refCommande: `REF-${Math.random().toString(36).substring(7)}`, // Générez une référence de commande aléatoire
      },
    });

    return creditResponse.data; // Retourne la réponse de l'API TogoCom
  } catch (error) {
    console.error('Erreur lors du crédit vers le destinataire :', error);
    throw error;
  }
}

export { creditRecipient };
```

### Exemple Complet avec le Contrôleur et les Routes

Voici comment vous pouvez organiser l'ensemble de votre code, y compris les services, le contrôleur et les routes :

#### services/transactionService.ts

```typescript
import prisma from '../prisma';
import axios from 'axios';
import { TransferDetails } from '../interfaces/TransferDetails';

async function creditRecipient(details: TransferDetails): Promise<any> {
  const {
    idRequete,
    destinataire,
    montant,
    refCommande,
    dateHeureRequete,
    description,
  } = details;

  try {
    const creditResponse = await axios.post(
      'https://ms-tpc-prep.togocom.tg/api/tpcredit',
      {
        idRequete,
        numeroClient: destinataire,
        montant,
        refCommande,
        dateHeureRequete: dateHeureRequete.toISOString(),
        description,
      },
      {
        headers: {
          'Authorization': `Bearer ${process.env.API_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );

    const transactionCredit = await prisma.transaction.create({
      data: {
        idRequete,
        expediteur: 'Votre compte',
        destinataire,
        montant,
        commission: 0,
        montantNet: montant,
        dateHeureRequete,
        statutRequete: 'EN_ATTENTE',
        description: 'Crédit vers le destinataire',
        refCommande: `REF-${Math.random().toString(36).substring(7)}`,
      },
    });

    return creditResponse.data;
  } catch (error) {
    console.error('Erreur lors du crédit vers le destinataire :', error);
    throw error;
  }
}

export { creditRecipient };
```

#### controllers/transactionController.ts

```typescript
import { Request, Response } from 'express';
import { transferMoney } from '../services/transactionService';

async function transferMoneyController(req: Request, res: Response) {
  try {
    const { expediteur, destinataire, montant } = req.body;

    const details = {
      idRequete: `REQ-${Date.now()}`,
      expediteur,
      destinataire,
      montant,
      commission: montant * 0.05, // Exemple de calcul de la commission
      montantNet: montant * 0.95,
      dateHeureRequete: new Date(),
      description: 'Transfert d\'argent',
      refCommande: `CMD-${Date.now()}`,
    };

    const result = await transferMoney(details);

    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

export { transferMoneyController };
```

#### routes/transactionRoutes.ts

```typescript
import { Router } from 'express';
import { transferMoneyController } from '../controllers/transactionController';

const router = Router();

router.post('/transfer', transferMoneyController);

export default router;
```

#### app.ts (ou index.ts)

```typescript
import express from 'express';
import dotenv from 'dotenv';
import transactionRoutes from './routes/transactionRoutes';

dotenv.config();

const app = express();
app.use(express.json());

app.use('/api/transactions', transactionRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
```

### Conclusion

En suivant ces étapes, vous pourrez gérer les clés d'API de manière sécurisée en les stockant dans un fichier `.env`. Cela facilite également la gestion de vos configurations et vous permet de modifier les clés d'API sans avoir à changer le code source.






















































# correct correct

### Explication détaillée des étapes du nouveau processus

1. **Réception de la demande de transfert :**
   - Un utilisateur demande de transférer de l'argent. Les détails de la transaction incluent l'ID du marchand, l'ID du destinataire, le montant à transférer, la commission à prélever, une description et une référence de commande.

2. **Enregistrement de la transaction de débit (vers le compte marchand) :**
   - La totalité du montant est débitée du compte de l'utilisateur (expéditeur) et créditée sur le compte du marchand. Cela inclut également l'enregistrement de la commission.

3. **Enregistrement de la transaction de crédit (du compte marchand vers le destinataire) :**
   - Immédiatement après avoir crédité le compte du marchand, une transaction de crédit est initiée du compte du marchand vers le compte du destinataire, en déduisant la commission.

4. **Retour de la réponse à l'utilisateur :**
   - Le système renvoie une réponse indiquant que la transaction est en cours de traitement.

### Schéma des transactions

1. **Débit initial :**
   - `expéditeur (utilisateur)` → `compte marchand` (montant total)

2. **Crédit après déduction de la commission :**
   - `compte marchand` → `destinataire` (montant net après commission)

### Code adapté pour le nouveau processus

Voici comment implémenter ce processus en utilisant Node.js, TypeScript, MongoDB et Prisma.

```typescript
// src/services/transactionService.ts

import prisma from '../prisma';
import { Prisma } from '@prisma/client';

interface TransferDetails {
  idRequete: string;
  expediteur: string; // L'expéditeur sera l'ID de l'utilisateur
  destinataire: string; // Le destinataire est l'ID du bénéficiaire
  montant: number;
  commission: number;
  description: string;
  refCommande: string;
}

async function transferMoney(details: TransferDetails): Promise<any> {
  const {
    idRequete,
    expediteur,
    destinataire,
    montant,
    commission,
    description,
    refCommande,
  } = details;

  const marchandId = 'MARCHAND_ID'; // Remplacez par l'ID de votre compte marchand
  const montantNet = montant - commission;

  try {
    // Début de la transaction Prisma
    const transaction = await prisma.$transaction(async (prisma) => {
      // Enregistrement de la transaction de débit vers le compte marchand
      const debitTransaction = await prisma.transaction.create({
        data: {
          idRequete,
          expediteur,
          destinataire: marchandId,
          montant,
          commission,
          montantNet: montant, // Le montant total est crédité sur le compte marchand
          dateHeureRequete: new Date(),
          statutRequete: 'EN_ATTENTE',
          description,
          refCommande,
        },
      });

      // Enregistrement de la transaction de crédit vers le destinataire
      const creditTransaction = await prisma.transaction.create({
        data: {
          idRequete,
          expediteur: marchandId,
          destinataire,
          montant: montantNet,
          commission: 0,
          montantNet,
          dateHeureRequete: new Date(),
          statutRequete: 'EN_ATTENTE',
          description: 'Crédit vers le bénéficiaire',
          refCommande: `REF-${Math.random().toString(36).substring(7)}`, // Générez une référence de commande aléatoire
        },
      });

      return { debitTransaction, creditTransaction };
    });

    // Exemple simplifié de retour réussi pour la réponse à l'utilisateur
    const response = {
      code: '2000',
      message: 'Demande en cours de traitement',
      idRequete,
      refCommande,
    };

    return response;
  } catch (error) {
    console.error('Erreur lors du transfert d\'argent :', error);
    throw error;
  }
}

export { transferMoney };
```

### Explication du Code :

1. **Interface `TransferDetails` :**
   - Définit la structure des détails nécessaires pour une transaction de transfert d'argent.

2. **Fonction `transferMoney` :**
   - Fonction asynchrone qui prend en paramètre `details` de type `TransferDetails` et retourne une promesse résolue avec un objet de réponse.

3. **ID du marchand :**
   - `marchandId` représente l'ID du compte marchand, où le montant total est d'abord crédité.

4. **Début de la transaction Prisma :**
   - Utilisation de `prisma.$transaction` pour s'assurer que les deux enregistrements de transaction (débit et crédit) sont atomiques. Si l'une échoue, l'autre est annulée.

5. **Transaction de débit :**
   - Enregistrement de la transaction où le montant total est crédité sur le compte du marchand.

6. **Transaction de crédit :**
   - Enregistrement de la transaction où le montant net (après déduction de la commission) est crédité sur le compte du destinataire.

7. **Retour de la réponse :**
   - Retourne une réponse indiquant que la transaction est en cours de traitement, avec l'ID de la requête et la référence de commande.

Ce code assure que le transfert d'argent est géré correctement en deux étapes, en maintenant la cohérence des transactions dans la base de données grâce à Prisma.

























# debit client vers marchand




Bien sûr ! Pour intégrer la fonctionnalité de débit vers le compte partenaire dans votre application Node.js, vous pouvez suivre les étapes suivantes. Assurez-vous d'avoir configuré correctement votre environnement avec les dépendances nécessaires et que vous avez une gestion appropriée des erreurs et des réponses.

### 1. Configuration de l'environnement et des dépendances

Assurez-vous d'avoir installé les dépendances suivantes si ce n'est pas déjà fait :

```bash
npm install axios dotenv
```

`axios` sera utilisé pour effectuer des requêtes HTTP vers l'API TMoney, et `dotenv` pour charger les variables d'environnement depuis un fichier `.env`.

### 2. Structure du projet

Votre structure de dossier pourrait ressembler à ceci :

```
- src/
  - controllers/
    - transactionController.ts
  - services/
    - tmoneyService.ts
  - utils/
    - axiosInstance.ts
  - routes.ts
  - index.ts
- .env
- package.json
- tsconfig.json
```

### 3. Configuration d'axios et des variables d'environnement

Dans `src/utils/axiosInstance.ts`, configurez axios pour gérer les requêtes HTTP vers l'API TMoney :

```typescript
import axios from 'axios';

const instance = axios.create({
  baseURL: 'https://ms-push-api-prep.togocom.tg/tmoney-middleware',
  headers: {
    'Content-Type': 'application/json',
  },
});

export default instance;
```

Dans votre fichier `.env`, définissez les variables d'environnement nécessaires :

```
TMONEY_API_URL=https://ms-push-api-prep.togocom.tg/tmoney-middleware
TMONEY_PARTNER_USERNAME=votre_nom_utilisateur
TMONEY_PARTNER_PASSWORD=votre_mot_de_passe
```

### 4. Implémentation du service TMoney

Dans `src/services/tmoneyService.ts`, créez un service pour gérer les requêtes de débit :

```typescript
import axiosInstance from '../utils/axiosInstance';
import dotenv from 'dotenv';

dotenv.config();

const TMONEY_API_URL = process.env.TMONEY_API_URL || '';
const TMONEY_PARTNER_USERNAME = process.env.TMONEY_PARTNER_USERNAME || '';
const TMONEY_PARTNER_PASSWORD = process.env.TMONEY_PARTNER_PASSWORD || '';

export const debitToPartnerAccount = async (
  numeroClient: string,
  montant: number,
  refCommande: string,
  idRequete: string,
  dateHeureRequete: string,
  description: string
) => {
  try {
    const response = await axiosInstance.post('/debit', {
      numeroClient,
      montant,
      refCommande,
      idRequete,
      dateHeureRequete,
      description,
    }, {
      auth: {
        username: TMONEY_PARTNER_USERNAME,
        password: TMONEY_PARTNER_PASSWORD,
      },
    });

    return response.data;
  } catch (error) {
    console.error('Erreur lors du débit vers le compte partenaire:', error);
    throw error;
  }
};
```

### 5. Contrôleur pour gérer la requête

Dans `src/controllers/transactionController.ts`, utilisez le service TMoney pour déclencher le débit :

```typescript
import { Request, Response } from 'express';
import { debitToPartnerAccount } from '../services/tmoneyService';

export const debitPartnerAccount = async (req: Request, res: Response) => {
  const {
    numeroClient,
    montant,
    refCommande,
    idRequete,
    dateHeureRequete,
    description,
  } = req.body;

  try {
    const result = await debitToPartnerAccount(
      numeroClient,
      montant,
      refCommande,
      idRequete,
      dateHeureRequete,
      description
    );

    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ error: 'Erreur lors du débit vers le compte partenaire' });
  }
};
```

### 6. Configuration des routes

Dans `src/routes.ts`, configurez la route pour gérer la demande de débit :

```typescript
import express from 'express';
import { debitPartnerAccount } from './controllers/transactionController';

const router = express.Router();

router.post('/debit-partner', debitPartnerAccount);

export default router;
```

### 7. Point d'entrée de l'application

Dans `src/index.ts`, configurez Express pour utiliser les routes définies :

```typescript
import express from 'express';
import dotenv from 'dotenv';
import routes from './routes';

dotenv.config();

const app = express();
app.use(express.json());

app.use('/api', routes);

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Serveur en écoute sur le port ${PORT}`);
});
```

### 8. Utilisation dans votre application

Vous pouvez maintenant utiliser cette API dans votre application pour débiter le compte partenaire en envoyant une requête POST à `/api/debit-partner` avec les données nécessaires (comme spécifié dans la documentation TMoney).

Assurez-vous de gérer les erreurs de manière appropriée et de tester soigneusement votre intégration avant de la déployer en production.







































## other version

### 1
Bien sûr ! Pour intégrer la fonctionnalité de débit vers le compte partenaire dans votre application Node.js, vous pouvez suivre les étapes suivantes. Assurez-vous d'avoir configuré correctement votre environnement avec les dépendances nécessaires et que vous avez une gestion appropriée des erreurs et des réponses.

### 1. Configuration de l'environnement et des dépendances

Assurez-vous d'avoir installé les dépendances suivantes si ce n'est pas déjà fait :

```bash
npm install axios dotenv
```

`axios` sera utilisé pour effectuer des requêtes HTTP vers l'API TMoney, et `dotenv` pour charger les variables d'environnement depuis un fichier `.env`.

### 2. Structure du projet

Votre structure de dossier pourrait ressembler à ceci :

```
- src/
  - controllers/
    - transactionController.ts
  - services/
    - tmoneyService.ts
  - utils/
    - axiosInstance.ts
  - routes.ts
  - index.ts
- .env
- package.json
- tsconfig.json
```

### 3. Configuration d'axios et des variables d'environnement

Dans `src/utils/axiosInstance.ts`, configurez axios pour gérer les requêtes HTTP vers l'API TMoney :

```typescript
import axios from 'axios';

const instance = axios.create({
  baseURL: 'https://ms-push-api-prep.togocom.tg/tmoney-middleware',
  headers: {
    'Content-Type': 'application/json',
  },
});

export default instance;
```

Dans votre fichier `.env`, définissez les variables d'environnement nécessaires :

```
TMONEY_API_URL=https://ms-push-api-prep.togocom.tg/tmoney-middleware
TMONEY_PARTNER_USERNAME=votre_nom_utilisateur
TMONEY_PARTNER_PASSWORD=votre_mot_de_passe
```

### 4. Implémentation du service TMoney

Dans `src/services/tmoneyService.ts`, créez un service pour gérer les requêtes de débit :

```typescript
import axiosInstance from '../utils/axiosInstance';
import dotenv from 'dotenv';

dotenv.config();

const TMONEY_API_URL = process.env.TMONEY_API_URL || '';
const TMONEY_PARTNER_USERNAME = process.env.TMONEY_PARTNER_USERNAME || '';
const TMONEY_PARTNER_PASSWORD = process.env.TMONEY_PARTNER_PASSWORD || '';

export const debitToPartnerAccount = async (
  numeroClient: string,
  montant: number,
  refCommande: string,
  idRequete: string,
  dateHeureRequete: string,
  description: string
) => {
  try {
    const response = await axiosInstance.post('/debit', {
      numeroClient,
      montant,
      refCommande,
      idRequete,
      dateHeureRequete,
      description,
    }, {
      auth: {
        username: TMONEY_PARTNER_USERNAME,
        password: TMONEY_PARTNER_PASSWORD,
      },
    });

    return response.data;
  } catch (error) {
    console.error('Erreur lors du débit vers le compte partenaire:', error);
    throw error;
  }
};
```

### 5. Contrôleur pour gérer la requête

Dans `src/controllers/transactionController.ts`, utilisez le service TMoney pour déclencher le débit :

```typescript
import { Request, Response } from 'express';
import { debitToPartnerAccount } from '../services/tmoneyService';

export const debitPartnerAccount = async (req: Request, res: Response) => {
  const {
    numeroClient,
    montant,
    refCommande,
    idRequete,
    dateHeureRequete,
    description,
  } = req.body;

  try {
    const result = await debitToPartnerAccount(
      numeroClient,
      montant,
      refCommande,
      idRequete,
      dateHeureRequete,
      description
    );

    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ error: 'Erreur lors du débit vers le compte partenaire' });
  }
};
```

### 6. Configuration des routes

Dans `src/routes.ts`, configurez la route pour gérer la demande de débit :

```typescript
import express from 'express';
import { debitPartnerAccount } from './controllers/transactionController';

const router = express.Router();

router.post('/debit-partner', debitPartnerAccount);

export default router;
```

### 7. Point d'entrée de l'application

Dans `src/index.ts`, configurez Express pour utiliser les routes définies :

```typescript
import express from 'express';
import dotenv from 'dotenv';
import routes from './routes';

dotenv.config();

const app = express();
app.use(express.json());

app.use('/api', routes);

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Serveur en écoute sur le port ${PORT}`);
});
```

### 8. Utilisation dans votre application

Vous pouvez maintenant utiliser cette API dans votre application pour débiter le compte partenaire en envoyant une requête POST à `/api/debit-partner` avec les données nécessaires (comme spécifié dans la documentation TMoney).

Assurez-vous de gérer les erreurs de manière appropriée et de tester soigneusement votre intégration avant de la déployer en production.
















# crediter compte marchand



Pour mettre en place la logique de crédit vers le compte depuis le compte marchand dans votre application Node.js, vous pouvez suivre une approche similaire à celle utilisée pour le débit. Voici comment vous pouvez procéder :

### 1. Ajout du Service de Crédit TMoney

Dans `src/services/tmoneyService.ts`, créez une fonction pour gérer les requêtes de crédit :

```typescript
import axiosInstance from '../utils/axiosInstance';
import dotenv from 'dotenv';

dotenv.config();

const TMONEY_API_URL = process.env.TMONEY_API_URL || '';
const TMONEY_PARTNER_USERNAME = process.env.TMONEY_PARTNER_USERNAME || '';
const TMONEY_PARTNER_PASSWORD = process.env.TMONEY_PARTNER_PASSWORD || '';
const ID_REQUETE = 'votre_id_statique'; // ID de requête statique pour le suivi interne

export const creditFromMerchantAccount = async (
  numeroClient: string,
  montant: number,
  refCommande: string,
  dateHeureRequete: string,
  description: string
) => {
  try {
    const response = await axiosInstance.post('/api/tpcredit', {
      idRequete: ID_REQUETE,
      numeroClient,
      montant,
      refCommande,
      dateHeureRequete,
      description,
    }, {
      auth: {
        username: TMONEY_PARTNER_USERNAME,
        password: TMONEY_PARTNER_PASSWORD,
      },
    });

    return response.data;
  } catch (error) {
    console.error('Erreur lors du crédit vers le compte marchand :', error);
    throw error;
  }
};
```

### 2. Contrôleur pour Gérer la Requête de Crédit

Dans `src/controllers/transactionController.ts`, ajoutez une fonction pour gérer le crédit :

```typescript
import { Request, Response } from 'express';
import { creditFromMerchantAccount } from '../services/tmoneyService';

export const creditMerchantAccount = async (req: Request, res: Response) => {
  const { numeroClient, montant, refCommande } = req.body;
  const dateHeureRequete = new Date().toISOString();
  const description = "Paiement pour le service XYZ"; // Adapter selon votre besoin

  try {
    const result = await creditFromMerchantAccount(numeroClient, montant, refCommande, dateHeureRequete, description);
    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ error: 'Erreur lors du crédit vers le compte marchand' });
  }
};
```

### 3. Configuration des Routes

Dans `src/routes.ts`, ajoutez une nouvelle route pour le crédit :

```typescript
import express from 'express';
import { creditMerchantAccount } from './controllers/transactionController';

const router = express.Router();

router.post('/credit-merchant', creditMerchantAccount);

export default router;
```

### 4. Intégration dans l'Application Principale

Assurez-vous que votre point d'entrée principal (`src/index.ts`) utilise correctement les routes configurées :

```typescript
import express from 'express';
import dotenv from 'dotenv';
import routes from './routes';

dotenv.config();

const app = express();
app.use(express.json());

app.use('/api', routes);

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Serveur en écoute sur le port ${PORT}`);
});
```

### 5. Utilisation dans Votre Application

Vous pouvez maintenant envoyer une requête POST à votre application Express à l'endpoint `/api/credit-merchant` avec les données suivantes :

```json
{
  "numeroClient": "22890990990",
  "montant": 300,
  "refCommande": "credit_cmd_merchant_01" // Adapter selon votre besoin
}
```

### Conclusion

En suivant ces étapes, vous avez mis en place la logique nécessaire pour effectuer des crédits depuis le compte marchand vers d'autres comptes à travers l'API TMoney. Assurez-vous de tester votre intégration de manière approfondie avant de la déployer en production, en particulier en vérifiant la gestion des erreurs et la sécurité des données sensibles.














### 2

Il semble que vous souhaitiez simplifier le processus en automatisant la génération de la plupart des paramètres, tout en maintenant l'ID de requête statique pour votre propre suivi. Voici comment vous pouvez ajuster le code pour atteindre cet objectif :

### 1. Configuration de l'environnement et des dépendances

Assurez-vous d'avoir installé les dépendances nécessaires (`axios` et `dotenv`) comme expliqué précédemment.

### 2. Structure du projet

Assurez-vous que votre structure de dossier et vos fichiers sont bien organisés comme mentionné précédemment.

### 3. Service TMoney pour le débit

Dans `src/services/tmoneyService.ts`, ajustez le service pour automatiser la plupart des paramètres :

```typescript
import axiosInstance from '../utils/axiosInstance';
import dotenv from 'dotenv';

dotenv.config();

const TMONEY_API_URL = process.env.TMONEY_API_URL || '';
const TMONEY_PARTNER_USERNAME = process.env.TMONEY_PARTNER_USERNAME || '';
const TMONEY_PARTNER_PASSWORD = process.env.TMONEY_PARTNER_PASSWORD || '';
const ID_REQUETE = 'votre_id_statique'; // ID de requête statique pour le suivi interne

export const debitToPartnerAccount = async (numeroClient: string, montant: number, codePin: string) => {
  const refCommande = generateRefCommande();
  const dateHeureRequete = new Date().toISOString();
  const description = "Paiement pour le service XXX";

  try {
    const response = await axiosInstance.post('/debit', {
      numeroClient,
      montant,
      refCommande,
      idRequete: ID_REQUETE,
      dateHeureRequete,
      description,
    }, {
      auth: {
        username: TMONEY_PARTNER_USERNAME,
        password: TMONEY_PARTNER_PASSWORD,
      },
    });

    return response.data;
  } catch (error) {
    console.error('Erreur lors du débit vers le compte partenaire :', error);
    throw error;
  }
};

const generateRefCommande = () => {
  // Génération de la référence de commande unique
  return `REF-${Math.random().toString(36).substr(2, 10).toUpperCase()}`;
};
```

### 4. Contrôleur pour gérer la requête

Dans `src/controllers/transactionController.ts`, utilisez le service TMoney pour débiter le compte partenaire :

```typescript
import { Request, Response } from 'express';
import { debitToPartnerAccount } from '../services/tmoneyService';

export const debitPartnerAccount = async (req: Request, res: Response) => {
  const { numeroClient, montant, codePin } = req.body;

  try {
    const result = await debitToPartnerAccount(numeroClient, montant, codePin);
    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ error: 'Erreur lors du débit vers le compte partenaire' });
  }
};
```

### 5. Configuration des routes

Dans `src/routes.ts`, configurez la route pour gérer la demande de débit :

```typescript
import express from 'express';
import { debitPartnerAccount } from './controllers/transactionController';

const router = express.Router();

router.post('/debit-partner', debitPartnerAccount);

export default router;
```

### 6. Point d'entrée de l'application

Dans `src/index.ts`, configurez Express pour utiliser les routes définies :

```typescript
import express from 'express';
import dotenv from 'dotenv';
import routes from './routes';

dotenv.config();

const app = express();
app.use(express.json());

app.use('/api', routes);

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Serveur en écoute sur le port ${PORT}`);
});
```

### 7. Utilisation dans votre application

Vous pouvez maintenant envoyer une requête POST à votre application Express à l'endpoint `/api/debit-partner` avec les données suivantes :

```json
{
  "numeroClient": "22890990990",
  "montant": 40000,
  "codePin": "1234" // Remplacez par le vrai code PIN sécurisé
}
```

### Conclusion

En suivant ces étapes, vous avez automatisé la plupart des paramètres de la requête de débit vers le compte partenaire, tout en maintenant l'ID de requête statique pour un suivi interne. Assurez-vous de tester rigoureusement votre application avant de la déployer en production, en particulier la gestion des erreurs et la sécurité autour des données sensibles comme le code PIN.









Si vous avez déjà obtenu le JWT et que vous souhaitez l'envoyer avec vos requêtes Axios, vous devez l'ajouter à l'en-tête `Authorization` comme suit :

```javascript
import axios from 'axios';

const axiosInstance = axios.create({
  baseURL: 'https://ms-tpc-prep.togocom.tg/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
    // Autres en-têtes peuvent être ajoutés ici si nécessaire
  },
});

const token = 'votre_token_jwt'; // Remplacez par votre token JWT

axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${token}`;

export default axiosInstance;
```

### Explication :

1. **Création de l'instance Axios :** Vous créez une instance Axios avec `axios.create()` et configurez la `baseURL` ainsi que d'autres options comme le `timeout` et les `headers`.

2. **Ajout du JWT dans les en-têtes :** Vous pouvez ajouter le JWT dans les en-têtes de deux manières principales :
   - Utiliser `axiosInstance.defaults.headers.common['Authorization']` pour configurer globalement l'en-tête d'authentification pour toutes les requêtes sortantes.
   - Ajouter dynamiquement l'en-tête `Authorization` à chaque requête individuellement.

Dans l'exemple ci-dessus, nous avons utilisé `axiosInstance.defaults.headers.common['Authorization']` pour configurer globalement l'en-tête `Authorization` avec le JWT. Cela signifie que chaque fois qu'une requête est faite avec `axiosInstance`, le JWT sera inclus automatiquement dans les en-têtes.

Si vous préférez ajouter l'en-tête `Authorization` dynamiquement pour chaque requête individuelle, vous pouvez le faire dans votre méthode ou fonction où vous utilisez `axiosInstance.post()` :

```javascript
const url = 'https://ms-tpc-prep.togocom.tg/api/tpcredit';
const data = {
  idRequete: "credit_request_biller_5",
  numeroClient: "22890990990",
  montant: 300,
  refCommande: "credit_cmd_biller_05",
  dateHeureRequete: "2021-03-30 17:09:03",
  description: "Paying command 05"
};

const token = 'votre_token_jwt'; // Remplacez par votre token JWT

try {
  const response = await axiosInstance.post(url, data, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      // Autres en-têtes peuvent être ajoutés ici si nécessaire
    }
  });
  console.log(response.data);
} catch (error) {
  console.error('Erreur lors de la requête:', error);
}
```

### Points Importants à Considérer :

- **Sécurité :** Assurez-vous que le JWT est obtenu et stocké de manière sécurisée, par exemple dans un cookie sécurisé ou un espace de stockage sécurisé comme `localStorage`.
  
- **Intercepteurs :** Les intercepteurs Axios sont toujours utiles pour la gestion globale des en-têtes, mais vous pouvez également ajouter des en-têtes spécifiques à chaque requête individuelle si nécessaire.
  
- **Gestion des Erreurs :** Assurez-vous de gérer les erreurs potentielles liées à l'authentification, telles que les tokens expirés ou invalides, de manière appropriée dans votre application.

En intégrant votre JWT de cette manière avec Axios, vous pouvez sécuriser efficacement vos requêtes HTTP tout en garantissant que le serveur recevant la requête peut identifier et authentifier correctement l'utilisateur ou l'application.






# etapes
 utils/axiosInstance.ts

















# modele trans

Compris ! Voici le modèle Prisma pour MongoDB, en tenant compte de toutes les informations précédemment discutées, y compris les détails sur les frais de transaction et les données spécifiques requises par l'intégration avec TMoney :

```prisma
// Définition du modèle pour les transactions TMoney
model TMoneyTransaction {
  // Identifiant unique généré automatiquement par MongoDB
  id               String      @id @default(auto()) @map("_id") @db.ObjectId
  // Référence TMoney de l'opération
  refTmoney        Int
  // Montant de la transaction en FCFA
  amount           Int
  // Numéro de téléphone du client au format international
  numberClient     String
  // Statut de la requête (SUCCES, ECHEC, etc.)
  statutRequete    String
  // Date et heure de l'opération TMoney
  dateHeureTmoney  DateTime
  // Identifiant unique de la requête du partenaire
  idRequete        String
  // Référence de la commande du partenaire
  refCommande      String
  // Type de l'opération sur le compte (DEBIT ou CREDIT)
  typeRequete      String
  // Code du traitement de la transaction
  code             String
  // Message associé au traitement de la transaction
  message          String
  // ID du partenaire dans le système de l'opérateur
  idPartenaire     String
  // Nom du partenaire dans le système de l'opérateur
  nomPartenaire    String
  // Frais de transaction appliqués
  fraisTransaction Float
  // Montant net crédité ou débité
  montantNet       Int
  // Relation avec l'utilisateur associé à la transaction
  user             User        @relation(fields: [userId], references: [id])
  // Identifiant de l'utilisateur associé à cette transaction
  userId           String      @db.ObjectId
}

// Définition du modèle pour les utilisateurs de l'application
model User {
  // Identifiant unique généré automatiquement par MongoDB
  id        String   @id @default(auto()) @map("_id") @db.ObjectId
  // Nom de l'utilisateur
  name      String
  // Numéro de téléphone de l'utilisateur au format international
  phoneNumber String
  // Email de l'utilisateur
  email     String?
  // Transactions associées à l'utilisateur
  transactions TMoneyTransaction[]
}
```

### Explications détaillées :

- **`TMoneyTransaction` :**
  - **`id` :** Identifiant unique de la transaction, généré automatiquement par MongoDB.
  - **`refTmoney` :** Référence TMoney associée à l'opération.
  - **`amount` :** Montant de la transaction en FCFA.
  - **`numberClient` :** Numéro de téléphone du client en format international.
  - **`statutRequete` :** Statut de la requête de l'opération (SUCCES, ECHEC, etc.).
  - **`dateHeureTmoney` :** Date et heure de l'opération TMoney.
  - **`idRequete` :** Identifiant unique de la requête du partenaire.
  - **`refCommande` :** Référence de la commande associée à la transaction.
  - **`typeRequete` :** Type de requête (DEBIT ou CREDIT).
  - **`code` :** Code du traitement de la transaction.
  - **`message` :** Message associé au traitement de la transaction.
  - **`idPartenaire` :** Identifiant du partenaire dans le système de l'opérateur.
  - **`nomPartenaire` :** Nom du partenaire dans le système de l'opérateur.
  - **`fraisTransaction` :** Frais de transaction calculés en fonction du montant de la transaction.
  - **`montantNet` :** Montant net crédité ou débité après déduction des frais.
  - **`user` :** Relation avec l'utilisateur associé à cette transaction.
  - **`userId` :** Identifiant de l'utilisateur associé à cette transaction.

- **`User` :**
  - **`id` :** Identifiant unique de l'utilisateur, généré automatiquement par MongoDB.
  - **`name` :** Nom de l'utilisateur.
  - **`phoneNumber` :** Numéro de téléphone de l'utilisateur au format international.
  - **`email` :** Email de l'utilisateur (optionnel).
  - **`transactions` :** Liste des transactions associées à cet utilisateur.

### Remarques :

- Le modèle `TMoneyTransaction` intègre tous les champs nécessaires pour enregistrer et gérer les détails des transactions effectuées via TMoney, y compris les frais appliqués et le montant net.
- La relation `user` lie chaque transaction à l'utilisateur correspondant via l'identifiant `userId`, permettant ainsi de suivre l'historique des transactions pour chaque utilisateur.
- Assurez-vous d'adapter ce modèle en fonction des spécificités de votre application et des besoins exacts de l'intégration avec TMoney.











# axiosIntance

L'erreur "Cannot find name 'axiosInstance'" indique que le compilateur ou l'interpréteur JavaScript ne reconnaît pas le nom `axiosInstance` comme une variable définie. Cela peut être dû à plusieurs raisons courantes :

1. **Importation manquante :** Assurez-vous que vous avez correctement importé `axiosInstance` depuis le fichier où il est défini. Dans notre exemple précédent, `axiosInstance` est défini dans le fichier `axiosInstance.ts`. Vous devez l'importer correctement dans le fichier où vous souhaitez l'utiliser.

   Par exemple :
   ```typescript
   import axiosInstance from './utils/axiosInstance';
   ```

   Assurez-vous que le chemin d'importation (`'./utils/axiosInstance'` dans cet exemple) est correct par rapport à l'emplacement réel du fichier `axiosInstance.ts`.

2. **Mauvaise portée de variable :** Vérifiez que `axiosInstance` est accessible dans la portée où vous essayez de l'utiliser. Si `axiosInstance` est défini dans un module ou un fichier différent, assurez-vous que votre fichier actuel peut y accéder.

3. **Typo dans le nom :** Assurez-vous qu'il n'y a pas de fautes de frappe dans le nom `axiosInstance` lorsque vous l'utilisez dans votre code.

Voici un exemple de correction possible en supposant que `axiosInstance` est correctement importé depuis le fichier `axiosInstance.ts` :

```typescript
import axiosInstance from './utils/axiosInstance';

const url = 'https://ms-tpc-prep.togocom.tg/api/tpcredit';
const data = {
  idRequete: "credit_request_biller_5",
  numeroClient: "22890990990",
  montant: 300,
  refCommande: "credit_cmd_biller_05",
  dateHeureRequete: "2021-03-30 17:09:03",
  description: "Paying command 05"
};

try {
  const response = await axiosInstance.post(url, data);
  console.log(response.data);
} catch (error) {
  console.error('Erreur lors de la requête:', error);
}
```

Assurez-vous également que votre `axiosInstance.ts` est correctement configuré pour gérer les requêtes POST vers l'URL spécifiée avec les bonnes configurations d'en-tête si nécessaire.

















# test final


Oui, il est tout à fait possible de mettre en place une logique où lorsqu'un compte est automatiquement débité, les fonds sont d'abord transférés vers le compte marchand de votre plateforme, puis sont ensuite envoyés au destinataire final. Cela peut être réalisé en orchestrant deux opérations distinctes dans votre application :

### 1. Débit du Compte de l'Utilisateur

Tout d'abord, vous débitez le compte de l'utilisateur à l'aide de l'API TMoney comme décrit précédemment. Une fois que cette opération est réussie et que vous avez reçu la confirmation (via le callback par exemple), vous pouvez procéder à l'étape suivante.

### 2. Crédit du Compte Marchand et Transfert au Destinataire Final

Après avoir reçu la confirmation du débit sur le compte de l'utilisateur, vous pouvez procéder à l'étape suivante dans votre logique backend :

#### 2.1. Crédit du Compte Marchand

Utilisez l'API TMoney pour créditer le compte marchand de votre plateforme. Voici comment cela pourrait être implémenté dans votre service TMoney :

```typescript
export const creditMerchantAccount = async (
  numeroClient: string,
  montant: number,
  refCommande: string,
  dateHeureRequete: string,
  description: string
) => {
  try {
    const response = await axiosInstance.post('/api/tpcredit', {
      idRequete: ID_REQUETE,
      numeroClient,
      montant,
      refCommande,
      dateHeureRequete,
      description,
    }, {
      auth: {
        username: TMONEY_PARTNER_USERNAME,
        password: TMONEY_PARTNER_PASSWORD,
      },
    });

    return response.data;
  } catch (error) {
    console.error('Erreur lors du crédit vers le compte marchand :', error);
    throw error;
  }
};
```

#### 2.2. Transfert au Destinataire Final

Une fois que le compte marchand est crédité avec succès, vous pouvez ensuite utiliser l'API TMoney pour transférer le montant correspondant au destinataire final. Voici comment cela pourrait être implémenté :

```typescript
export const transferToFinalRecipient = async (
  numeroClientDestinataire: string,
  montant: number,
  refCommande: string,
  dateHeureRequete: string,
  description: string
) => {
  try {
    const response = await axiosInstance.post('/api/transfer', {
      idRequete: ID_REQUETE,
      numeroClient: numeroClientDestinataire,
      montant,
      refCommande,
      dateHeureRequete,
      description,
    }, {
      auth: {
        username: TMONEY_PARTNER_USERNAME,
        password: TMONEY_PARTNER_PASSWORD,
      },
    });

    return response.data;
  } catch (error) {
    console.error('Erreur lors du transfert vers le destinataire final :', error);
    throw error;
  }
};
```

### 3. Orchestration dans le Contrôleur

Dans votre contrôleur (`transactionController.ts`), vous pouvez orchestrer ces étapes une fois que vous recevez la demande de transfert d'argent :

```typescript
import { Request, Response } from 'express';
import { debitFromUserAccount } from '../services/tmoneyService';
import { creditMerchantAccount, transferToFinalRecipient } from '../services/tmoneyService';

export const initiateMoneyTransfer = async (req: Request, res: Response) => {
  const { numeroClientDebiteur, montant, refCommande, numeroClientDestinataire } = req.body;
  const dateHeureRequete = new Date().toISOString();
  const description = "Transfert d'argent vers le destinataire final";

  try {
    // Débiter le compte de l'utilisateur
    await debitFromUserAccount(numeroClientDebiteur, montant, refCommande, dateHeureRequete, description);

    // Créditer le compte marchand
    await creditMerchantAccount(numeroClientDebiteur, montant, refCommande, dateHeureRequete, description);

    // Transférer au destinataire final
    const transferResult = await transferToFinalRecipient(numeroClientDestinataire, montant, refCommande, dateHeureRequete, description);

    // Envoyer la réponse au client
    res.status(200).json(transferResult);
  } catch (error) {
    console.error('Erreur lors du transfert d\'argent :', error);
    res.status(500).json({ error: 'Erreur lors du transfert d\'argent' });
  }
};
```

### 4. Configurer la Route

Assurez-vous de configurer une nouvelle route dans `src/routes.ts` pour gérer cette opération :

```typescript
import express from 'express';
import { initiateMoneyTransfer } from './controllers/transactionController';

const router = express.Router();

router.post('/money-transfer', initiateMoneyTransfer);

export default router;
```

### Conclusion

En suivant cette approche, vous pouvez mettre en œuvre un flux de transfert d'argent où votre plateforme agit en tant que marchand intermédiaire, facilitant ainsi le débit du compte utilisateur, le crédit de votre compte marchand et le transfert ultérieur des fonds vers le destinataire final. Assurez-vous de gérer les erreurs de manière appropriée et de tester minutieusement votre intégration avant de la déployer en production.









































# frais

Pour implémenter la logique des frais pour les transactions dans votre application, vous pouvez suivre les étapes suivantes :

### 1. Définition des Frais en Fonction du Montant du Transfert

Tout d'abord, définissez une fonction ou une méthode qui calculera les frais en fonction du montant du transfert. Voici comment vous pouvez le faire :

```typescript
const calculateTransactionFee = (montant: number): number => {
  if (montant <= 5000) {
    return montant * 0.005; // 0.5% pour les transferts jusqu'à 5000 FCFA
  } else if (montant <= 10000) {
    return montant * 0.003; // 0.3% pour les transferts de 5001 à 10000 FCFA
  } else if (montant <= 15000) {
    return montant * 0.0025; // 0.25% pour les transferts de 10001 à 15000 FCFA
  } else if (montant <= 20000) {
    return montant * 0.002; // 0.2% pour les transferts de 15001 à 20000 FCFA
  } else if (montant <= 30000) {
    return montant * 0.0015; // 0.15% pour les transferts de 20001 à 30000 FCFA
  } else if (montant <= 50000) {
    return montant * 0.001; // 0.1% pour les transferts de 30001 à 50000 FCFA
  } else if (montant <= 100000) {
    return montant * 0.001; // 0.1% pour les transferts de 50001 à 100000 FCFA
  } else if (montant <= 150000) {
    return montant * 0.0005; // 0.05% pour les transferts de 100001 à 150000 FCFA
  } else if (montant <= 200000) {
    return montant * 0.0005; // 0.05% pour les transferts de 150001 à 200000 FCFA
  } else if (montant <= 250000) {
    return montant * 0.0005; // 0.05% pour les transferts de 200001 à 250000 FCFA
  } else if (montant <= 300000) {
    return montant * 0.0005; // 0.05% pour les transferts de 250001 à 300000 FCFA
  } else if (montant <= 500000) {
    return montant * 0.0005; // 0.05% pour les transferts de 300001 à 500000 FCFA
  } else if (montant <= 1000000) {
    return montant * 0.0005; // 0.05% pour les transferts de 500001 à 1000000 FCFA
  } else {
    return montant * 0.0005; // 0.05% pour les transferts au-delà de 1000000 FCFA
  }
};
```

### 2. Intégration des Frais dans la Logique de Transfert

Utilisez cette fonction pour calculer les frais à chaque fois qu'une transaction est initiée dans votre contrôleur `initiateMoneyTransfer`. Voici comment vous pouvez l'intégrer :

```typescript
import { Request, Response } from 'express';
import { debitFromUserAccount } from '../services/tmoneyService';
import { creditMerchantAccount, transferToFinalRecipient } from '../services/tmoneyService';

// Fonction de calcul des frais
const calculateTransactionFee = (montant: number): number => {
  // Logique de calcul des frais basée sur le tableau fourni
  // Retourne le montant des frais en FCFA
};

export const initiateMoneyTransfer = async (req: Request, res: Response) => {
  const { numeroClientDebiteur, montant, refCommande, numeroClientDestinataire } = req.body;
  const dateHeureRequete = new Date().toISOString();
  const description = "Transfert d'argent vers le destinataire final";

  try {
    // Calculer les frais de transaction
    const frais = calculateTransactionFee(montant);

    // Calculer le montant total à débiter du compte de l'utilisateur
    const montantTotal = montant + frais;

    // Débiter le compte de l'utilisateur
    await debitFromUserAccount(numeroClientDebiteur, montantTotal, refCommande, dateHeureRequete, description);

    // Créditer le compte marchand (facultatif selon votre modèle)
    await creditMerchantAccount(numeroClientDebiteur, montantTotal, refCommande, dateHeureRequete, description);

    // Transférer au destinataire final
    const transferResult = await transferToFinalRecipient(numeroClientDestinataire, montant, refCommande, dateHeureRequete, description);

    // Envoyer la réponse au client
    res.status(200).json(transferResult);
  } catch (error) {
    console.error('Erreur lors du transfert d\'argent :', error);
    res.status(500).json({ error: 'Erreur lors du transfert d\'argent' });
  }
};
```

### 3. Intégration dans l'Application

Assurez-vous de mettre à jour votre modèle de données et votre logique applicative pour prendre en compte ces frais lors de chaque transaction. Vous pouvez également envisager de stocker les informations sur les frais facturés dans votre base de données pour des rapports et une traçabilité ultérieurs.

En suivant cette approche, votre application pourra appliquer les frais appropriés en fonction du montant de chaque transfert d'argent, tout en assurant la transparence et la conformité avec les règlements en vigueur.



























# frais ameliorer

Pour optimiser la fonction de calcul des frais de transaction en fonction du montant, vous pouvez simplifier le processus en utilisant un tableau qui définit les plages de montants et les pourcentages correspondants. Cela rendra le code plus lisible et plus facile à maintenir. Voici comment vous pouvez procéder :

```typescript
const calculateTransactionFee = (montant: number): number => {
  // Tableau des plages de montants et des pourcentages de frais
  const feeTable = [
    { maxAmount: 5000, feePercentage: 0.005 },
    { maxAmount: 10000, feePercentage: 0.003 },
    { maxAmount: 15000, feePercentage: 0.0025 },
    { maxAmount: 20000, feePercentage: 0.002 },
    { maxAmount: 30000, feePercentage: 0.0015 },
    { maxAmount: 50000, feePercentage: 0.001 },
    { maxAmount: 100000, feePercentage: 0.001 },
    { maxAmount: 150000, feePercentage: 0.0005 },
    { maxAmount: 200000, feePercentage: 0.0005 },
    { maxAmount: 250000, feePercentage: 0.0005 },
    { maxAmount: 300000, feePercentage: 0.0005 },
    { maxAmount: 500000, feePercentage: 0.0005 },
    { maxAmount: 1000000, feePercentage: 0.0005 },
    { maxAmount: Infinity, feePercentage: 0.0005 } // Pour les montants au-delà de 1000000 FCFA
  ];

  // Trouver le pourcentage de frais correspondant au montant donné
  const { feePercentage } = feeTable.find(item => montant <= item.maxAmount) || { feePercentage: 0 };

  // Calculer et retourner les frais
  return montant * feePercentage;
};
```

### Explication :

- **Tableau des plages de montants et des pourcentages de frais :** C'est un tableau qui contient des objets définissant chaque plage de montants et le pourcentage de frais correspondant.
- **Utilisation de `Array.find` :** La fonction `Array.find` est utilisée pour rechercher dans le tableau l'objet qui correspond à la première plage de montants supérieure ou égale au montant donné.
- **Gestion du montant au-delà de 1 000 000 FCFA :** Le dernier objet du tableau utilise `Infinity` comme `maxAmount`, ce qui signifie que pour tout montant supérieur à 1 000 000 FCFA, le pourcentage de frais sera de 0.05%.
- **Calcul des frais :** Une fois que le bon pourcentage de frais est trouvé, les frais sont calculés en multipliant le montant par ce pourcentage.

Cette approche est plus concise, facile à comprendre et à maintenir. Assurez-vous de tester la fonction avec différents montants pour vous assurer qu'elle fonctionne comme prévu dans tous les cas de figure.