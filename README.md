# EGO TRANSFERT DOCUMENTATION

## TECHNOLOGIE
__Server:__ Node, Express, MongoDB, Prisma, JWT

## AUTHORS


## CARACTÉRISTIQUES DE L'API POUR LES UTILISATEURS SIMPLE(client)
- Creation d'un utilisateur simple
- OTP via email
- Renvoyer un autre code d'OTP
- Connexion d'un utilisateur simple via email
- Obtention d'un profile d'utilisateur simple
- Mise a jour du profil d'un utilisateur
- Suppression d'un utilisateur simple
- Mot de passe oublié

## CARACTÉRISTIQUES DE L'API POUR LE SUPERADMIN
- Connexion d'un utilisateur simple
- Obtention du profil d'un superadmin
- Mise a jour du profile du super admin
- Obtention de la liste de tous les utilisateurs crées
- Creation d'un Admin
- Creation d'un client

## ENDPOINTS

### CLIENT

- [Authentication](#authentication)


# Authentication

## CREATION D'UN CLIENT

* **url**
```javascript
POST /api/v1/users/register/
```

| Parameter         | Type         | Description           | Required       |
| :-----------------| :------------| :---------------------| :--------------|
| `authentication`  | `string`     | **Your token**        |  **no**        |
| `firstanme`       | `string`     | **Your firstname**.   |  **yes**       |
| `lastname`        | `string`     | **Yoir lastname**.    |  **yes**       |
| `email`           | `string`     | **Your email**.       |  **yes**       |
| `password`        | `string`     | **Your password**.    |  **yes**       |
| `role`            | `string`     | **Your role**.        |  **yes**       |

* **Data**
```javascript
{
	"firstname": `string`,
	"lastname": `string`,
	"email": `string`,
    "phoneNumber": `string`,
	"password": `string`,
	"role": `string`, (['superadmin', 'admin', 'user']) default(user)
}
```

* Exemple:
```javascript
{
	"firstname": "dave",
	"lastname": "dave",
	"email": "kipre325@gmail.com",
	"phoneNumber": "0022892152900",
	"password": "12345"
}
```

* Reponse:
```javascript
{
	"status": "pending",
	"message": "Utilisateur enregistré. Veuillez vérifier votre email pour l'OTP."
}
```

## VERIFICATION OTP PAR EMAIL

* **url**
```javascript
POST /api/v1/users/verify-otp/
```

| Parameter         | Type         | Description           | Required       |
| :-----------------| :------------| :---------------------| :--------------|
| `authentication`  | `string`     | **ton token JWT**        |  **no**        |
| `email`           | `string`     | **ton email**.       |  **yes**       |
| `otp`        | `string`     | **ton code otp**.    |  **yes**       |
| `role`            | `string`     | **Your role**.        |  **no**       |

* **Data**
```javascript
{
	"email": `string`,
    "otp": `string`,
}
```

* Exemple:
```javascript
{
	"email": "kipre325@gmail.com",
	"otp": "7E557A"
}
```

* Reponse:
```javascript
{
	"status": "success",
	"message": "Code OTP vérifié avec succès"
}
```


## CONNEXION A L'APPLICATION

* **url**
```javascript
POST /api/v1/users/login/
```

| Parameter         | Type         | Description           | Required       |
| :-----------------| :------------| :---------------------| :--------------|
| `authentication`  | `string`     | **ton token JWT**        |  **no**        |
| `email`           | `string`     | **ton email**.       |  **yes**       |
| `password`        | `string`     | **ton email**.    |  **yes**       |
| `role`            | `string`     | **Your role**.        |  **no**       |

* **Data**
```javascript
{
	"email": `string`,
    "password": `string`,
}
```

* Exemple:
```javascript
{
	"email": "kipre325@gmail.com",
	"password": "new_password123"
}
```

* Reponse:
```javascript
{
	"status": "success",
	"data": {
		"firstname": "dave",
		"lastname": "dave",
		"email": "kipre325@gmail.com",
		"role": "user",
		"token": {
			"accessToken":
                "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2NjZiMThhZmM2ZmIyNWMyMTMzN2I3MTEiLCJyb2xlIjoidXNlciIsImlhdCI6MTcxODI5OTgyMiwiZXhwIjoxNzE4MzAxNjIyfQ.eMbxA5cGj0HED7siA9WriP_o8UOMirRHyWmJ5wg9Ew8",
			"refreshToken": 
                "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2NjZiMThhZmM2ZmIyNWMyMTMzN2I3MTEiLCJyb2xlIjoidXNlciIsImlhdCI6MTcxODI5OTgyMywiZXhwIjoxNzE4OTA0NjIzfQ.7NuPExqQztO0HRxinnLucFkliXpUURKFc3mQPsuyUoU"
		}
	}
}
```

## RENVOYER LE CODE OTP

* **url**
```javascript
POST /api/v1/users/resend-otp/
```

| Parameter         | Type         | Description           | Required       |
| :-----------------| :------------| :---------------------| :--------------|
| `authentication`  | `string`     | **ton token JWT**        |  **no**        |
| `email`           | `string`     | **ton email**.       |  **yes**       |
| `password`        | `string`     | **ton email**.    |  **no**       |
| `role`            | `string`     | **Your role**.        |  **no**       |

* **Data**
```javascript
{
    "email": `string`,
}
```

* Exemple:
```javascript
{
	"email": "kipre325@gmail.com",
}
```

* Reponse:
```javascript
{
	"message": "Nouvel OTP envoyé avec succès"
}
```

## MOT DE PASSE OUBLIE

* **url**
```javascript
POST /api/v1/users/request-reset-password/
```

| Parameter         | Type         | Description           | Required       |
| :-----------------| :------------| :---------------------| :--------------|
| `authentication`  | `string`     | **ton token JWT**        |  **no**        |
| `email`           | `string`     | **ton email**.       |  **yes**       |
| `password`        | `string`     | **ton email**.    |  **no**       |
| `role`            | `string`     | **Your role**.        |  **no**       |

* **Data**
```javascript
{
    "email": `string`,
}
```

* Exemple:
```javascript
{
	"email": "kipre325@gmail.com",
}
```

* Reponse:
```javascript
{
	"status": "pending",
	"message": "Un email a été envoyé pour réinitialiser votre mot de passe"
}
```

## REINITIALISATION DU MOT DE PASSE

* **url**
```javascript
POST /api/v1/users/reset-password/
```

| Parameter         | Type         | Description           | Required       |
| :-----------------| :------------| :---------------------| :--------------|
| `authentication`  | `string`     | **ton token JWT**        |  **no**        |
| `token`           | `string`     | **ton token**.       |  **yes**       |
| `newpassword`        | `string`     | **Nouveau mot de passe**.    |  **no**       |
| `role`            | `string`     | **Your role**.        |  **no**       |

* **Data**
```javascript
{
    "token": `string`,
    "newPasseord": `string`
}
```

* Exemple:
```javascript
{
  "token": "250d5a",
  "newPassword": "new_password123"
}
```

* Reponse:
```javascript
{
	"status": "sucess",
	"message": "Password reinitialié avec succes"
}
```

## MISE A JOUR DU PROFIL

* **url**
```javascript
POST /api/v1/users/update/
```

| Parameter         | Type         | Description           | Required       |
| :-----------------| :------------| :---------------------| :--------------|
| `authentication`  | `string`     | **ton token JWT**        |  **Yes**        |
| ``           | `string`     | **ton token**.       |  **firstname**       |
| `lastname`        | `string`     | **Nouveau mot de passe**.    |  **yes**       |
| `role`            | `string`     | **Your role**.        |  **no**       |

* **Data**
```javascript
{
	"firstname": `string`
}
```

* Exemple:
```javascript
{
    "firstname": "tolp"
}
```

* Reponse:
```javascript
{
	"status": "success",
	"data": {
		"address": null,
		"id": "6669af5f18479578b0b4588a",
		"firstname": "tolp",
		"lastname": "dave",
		"email": "dave@tt.com",
		"phoneNumber": "0022892152900",
		"password": "$2b$10$iNJG77crhaR3Hw7cIu59DueBOjQcI/9E/1C2lwlEVUB/TxsVxEVeK",
		"role": "USER",
		"profession": null,
		"birth": null,
		"profilePhoto": null,
		"ipAdress": [],
		"deviceId": [],
		"status": "inactive",
		"isVerified": false,
		"isApproved": false,
		"isBlocked": false,
		"referrralCode": null,
		"emailVerifiedAt": null,
		"profileComplete": null,
		"isSuperuser": false,
		"identificationType": null,
		"identificationExpiry": null,
		"documentIdentityImage": null,
		"statusKyc": "none",
		"dateOfVerification": null,
		"sponsorShipCode": null,
		"lastLogin": null,
		"twoFactorAuth": false,
		"failedLoginAttempts": 0,
		"lastFailedLogin": null,
		"createdAt": "2024-06-12T14:23:27.598Z",
		"updatedAt": "2024-06-12T14:26:11.209Z"
	}
}
```


## REINITIALISATION DU MOT DE PASSE

* **url**
```javascript
POST /api/v1/users/delete/
```

| Parameter         | Type         | Description           | Required       |
| :-----------------| :------------| :---------------------| :--------------|
| `authentication`  | `string`     | **ton token JWT**        |  **no**        |
| `token`           | `string`     | **ton token**.       |  **no**       |
| `newpassword`        | `string`     | **Nouveau mot de passe**.    |  **no**       |
| `role`            | `string`     | **Your role**.        |  **no**       |


* Exemple:

* Reponse:
```javascript
{
	"status": "success",
	"message": "suppression reussie"
}
```
















```javascript
{
	"status": "success",
	"data": {
		"firstname": "Viiane",
		"lastname": "Kuki",
		"email": "kuki@gmail.com",
		"profilePhoto": "default.jpg",
		"password": "$2b$10$nFz..loQqzSDOwinQNA.EOXTS9ltDELUm89zJpxxHE3Dcjn/.aRX.",
		"isBlocked": false,
		"isAdmin": false,
		"role": "Admin",
		"viewers": [],
		"followers": [],
		"following": [],
		"comments": [],
		"posts": [],
		"blocked": [],
		"userAward": "Bronze",
		"_id": "665deccf9fd26696cff4fe04",
		"createdAt": "2024-06-03T16:18:23.547Z",
		"updatedAt": "2024-06-03T16:18:23.547Z",
		"__v": 0,
		"fullname": "Viiane Kuki",
		"initials": 0,
		"postCounts": "VK",
		"followersCount": 0,
		"viewersCount": 0,
		"blockCount": 0,
		"id": "665deccf9fd26696cff4fe04",
		"lastPost": "Invalid Date",
		"isInActive": false,
		"lastActive": null
	}
}
```