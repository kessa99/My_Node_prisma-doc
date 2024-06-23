Exactement ! Pour mettre en place une plateforme comme la vôtre (Cross) facilitant les transactions entre différents opérateurs mobiles, vous devez vous documenter sur les APIs spécifiques des opérateurs mobiles avec lesquels vous souhaitez intégrer. Voici les étapes générales que vous devriez suivre :

1. **Identifier les opérateurs mobiles** :
   - Déterminez les opérateurs mobiles avec lesquels vous souhaitez permettre des transactions. Cela peut dépendre des régions géographiques que vous ciblez et des partenariats que vous pouvez établir.

2. **Documenter les APIs des opérateurs** :
   - Chaque opérateur mobile a ses propres APIs documentées pour gérer les transactions financières, telles que le transfert d'argent entre comptes. Ces APIs fournissent les méthodes et les paramètres nécessaires pour interagir avec leurs systèmes.
   - Consultez la documentation des APIs de chaque opérateur pour comprendre :
     - Les champs nécessaires pour initier une transaction.
     - Les méthodes pour vérifier les numéros de téléphone, vérifier les soldes, et effectuer des transferts.

3. **Champs nécessaires pour les transactions** :
   - Identifiez les informations requises pour initier une transaction, telles que le numéro de téléphone du destinataire, le montant, l'identifiant de l'utilisateur initiateur, etc.
   - Assurez-vous de comprendre les formats acceptés (par exemple, numéros de téléphone valides, formats de montant) et les restrictions éventuelles (par exemple, montant maximal par transaction).

4. **Gérer les autorisations et les clés d'API** :
   - Les opérateurs mobiles peuvent nécessiter des clés d'API ou d'autres mécanismes d'authentification pour accéder à leurs services. Assurez-vous de suivre les procédures appropriées pour obtenir et gérer ces autorisations.

5. **Tests et intégration** :
   - Avant de déployer votre plateforme, effectuez des tests approfondis de l'intégration avec les APIs des opérateurs. Cela garantit que toutes les fonctionnalités fonctionnent correctement et répondent aux attentes des utilisateurs.

6. **Sécurité et conformité** :
   - Assurez-vous de respecter les normes de sécurité et de conformité applicables, notamment en matière de traitement des données financières et personnelles.

En résumé, la documentation approfondie des APIs des opérateurs mobiles est essentielle pour comprendre comment interagir efficacement avec leurs systèmes et offrir une expérience utilisateur fluide et sécurisée sur votre plateforme de transactions.




# Ecommerce interface de paiemant avec tmoney

Le système TMoney Online est une solution de paiement en ligne sécurisée, protégée par une authentification forte (similaire aux règles 3D Secure).
(similaire aux règles 3D Secure) qui permet aux sites web marchands d'accepter les paiements des clients
en utilisant TMoney.

Le système TMoney Online peut être facilement intégré dans tous les systèmes de commerce électronique. Il n'y a aucun
Il n'y a pas de logiciel à installer sur le site web du commerçant ou sur l'interface du client.

Ce manuel explique l'intégration du système de TMoney en ligne à un site Web de commerce électronique.
de commerce électronique.


# la procedure de paiment


Lorsque la commande est validée sur le site de commerce électronique, le client choisit la solution de paiement TMoney
comme solution de paiement. Le site web de commerce électronique redirige alors le client vers la page de paiement en ligne TMoney et lui envoie un formulaire contenant des paramètres.
et envoie un formulaire contenant des paramètres.




Le client peut annuler l'opération à tout moment. Il sera alors redirigé vers le site web de commerce électronique avec une erreur d'annulation.
site web de commerce électronique avec une erreur d'annulation. Si le client saisit un numéro de téléphone et/ou un code pin erroné, il pourra réessayer trois fois.
code pin, il pourra réessayer 3 fois :



La troisième fois, le compte TMoney du client sera bloqué et il sera redirigé vers le site de commerce électronique avec une erreur.
site web de commerce électronique avec une erreur.
Si le client saisit un numéro de téléphone et un mot de passe corrects, une fenêtre contextuelle lancera la procédure d'authentification.
d'authentification. Un mot de passe à usage unique est envoyé par SMS au client. Le client est invité à
d'entrer ce mot de passe.



Si le client saisit un code SMS erroné, il sera redirigé vers le site web de commerce électronique avec une erreur d'annulation.
une erreur d'annulation. Si l'authentification et le paiement sont effectués avec succès, la page suivante
sera affichée au client :




Après avoir cliqué sur "Confirmer", le client sera redirigé vers le site de commerce électronique. Le client reçoit un SMS/email de confirmation du paiement de la part du système TMoney.
Le client reçoit un SMS/email de confirmation du paiement de la part du système TMoney.


# Les requetes https


## Session ID
Avant d'envoyer le formulaire de demande de paiement au système TMoney, le site de commerce électronique doit
demander un identifiant de session. Cette demande permet de sécuriser le processus puisque seul le serveur du site de commerce électronique est autorisé à effectuer cette demande.
site Web de commerce électronique est autorisé à effectuer cette demande. Le système TMoney vérifie l'adresse IP
du serveur du site Web de commerce électronique et renvoie un identifiant de session.
Le site web de commerce électronique doit stocker cet identifiant pour l'envoyer dans le formulaire de commande initial. L'URL suivante
URL suivante doit être appelée pour demander un identifiant de session (méthode GET) :
https://<Url>/online/online.php?merchantid=[MerchantID16digits]
Le système TMoney renvoie l'ID de session ou un message d'erreur commençant par OK ou NOK :
OK:27875690759565722269644474422394
NOK:UNKNOWN_MERCHANT
Le délai d'attente par défaut de l'identifiant de session est de 180 secondes.


## Formulaire de commande

Un formulaire avec des champs html cachés contenant les données de la commande doit être intégré dans la dernière page du panier d'achat.
du panier d'achat. L'URL d'action du formulaire sera TMoney Online Payment Page (POST
) :

http(s)://<Url>/online/online.php
Le site web de commerce électronique redirige l'utilisateur vers la page de paiement en ligne TMoney en envoyant
ce formulaire de commande initial.


# les champs


| Parameter         | type            | Description           | taille       |
| :-----------------| :-------------- | :---------------------| :--------------|
| `sessionid`       | `Obligatoire`   | **identifiant de session précédemment demandé pour sécuriser la transaction**     |  **comme prevu**        |
| `merchantid`      | `Obligatoire`   | **Identifiant du commerçant, fourni par l'administrateur du système.**.        |  **16 chiffres**       |
| `amount`          | `Obligatoire`   | **Montant total de l'achat sans virgule ni point décimal.**.     |  **3 a 10 chiffres**       |
| `currency`        | `Obligatoire`   | **Code de la monnaie de transaction selon la norme ISO 4217(code numérique) : "952" pour F CFA.**.|  **3 chiffres**        |
| `purchaseref`     | `Obligatoire`   | **Numéro de référence interne de la commande sur le site de commerce électronique.**.        |  **1 a 250 charactere**        |
| `phonennumber`           | `non Obligatoire`   | **Le numéro de téléphone du client, s'il est connu. Si ce champ est pré-rempli, le client ne pourra pas le modifier sur la page depage de paiement.**     |  **8 a 16 charactere**        |
| `brand`     | `Obligatoire`   | **Le nom du commerce électronique affiché juste en haut de la page de TMoney Online. S'il n'y a pas de nom, le nom du commerçant du système est affiché.**.        |  **Jusqu'à 150 caractères**       |
| `description`     | `non Obligatoire`   | **Label de la transaction, affiché dans le journal des transactions du client.**.        |  **Jusqu'à 255 caractères, texte texte brut (pas de HTML)**       |
| `accepturl`       | `non Obligatoire`   | **Page de retour de TMoney vers votre site après acceptation du paiement. Si elle est manquante, l'url configurée dans les paramètres du marchand TMoney sera utilisée.**.     |  **jusqu'a 150 charactere**       |
| `declineurl`      | `non Obligatoire`   | **Page de retour de TMoney vers votre site après que le paiement a été refusé. Si elle est manquante, l'url configurée dans les paramètres du marchand TMoney sera utilisée.**.        |**jusqu'a 150 charactere**        |
| `cancelurl`       | `non Obligatoire`   | **Page de retour de TMoney vers votre site après l'annulation du paiement annulé. Si elle est manquante, l'url configurée dans les paramètres TMoney sera utilisée.**.        |  **jusqu'a 150 charactere**        |
| `text`            | `non Obligatoire`   | **Texte à afficher en haut de la page de paiement en ligne TMoney.**     |  **jusqu'a 250 charactere**        |
| `language`        | `non Obligatoire`   | **Langue utilisée par TMoney pour afficher la page de paiement. Les valeurs possibles aujourd'hui sont limitées à fr (français), en (anglais). Le code de la langue est alpha-2 de la norme ISO 639.**.        |  **2 chars**       |




## notification url

Lorsqu'un paiement est validé, refusé ou annulé, le système TMoney en informe l'eCommerce
en appelant l'" URL de notification ".
Cette "URL de notification" doit être configurée par l'administrateur du système et ne peut pas être gérée dynamiquement comme les trois URL de retour.
être gérée dynamiquement comme les 3 URL de retour.
L'avantage de cette URL est qu'elle est appelée d'un serveur à l'autre (back to back) dès que
les clients valident leur paiement (que le paiement soit validé, refusé ou annulé).
Cela signifie que le bon de commande peut être validé automatiquement même si le client éteint ou décide de ne pas utiliser son téléphone portable.
ou décide de ne pas



| Paramètre        | Valeur                                                      |
|------------------|--------------------------------------------------------------|
| purchaseref      | Référence de commande du site web eCommerce                  |
| amount           | Montant de la commande                                       |
| currency         | Devise de la commande                                        |
| status           | Statut de la transaction                                     |
|                  | - OK : Le paiement est confirmé                              |
|                  | - NOK : Le paiement a été refusé par le système TMoney ou annulé par le client. La cause de l'erreur est détaillée dans le paramètre "error". |
| clientid         | Numéro de compte client dans le système TMoney               |
| cname            | Nom du client tel qu'enregistré dans le système TMoney, encodé en URL (les espaces sont remplacés par des '+' par exemple) |
| mobile           | Numéro de téléphone du client au format international (228XXXXXXXX) |
| paymentref       | Référence de paiement dans le système TMoney                 |
| payid            | Identifiant de transaction dans le système TMoney            |
| timestamp        | Horodatage de la transaction. Exemple : 1469024554           |

Ces paramètres sont envoyés à l'URL de notification en utilisant la méthode GET.




| Paramètre        | Valeur                                                                 |
|------------------|-------------------------------------------------------------------------|
| error            | Code d'erreur, inclut la raison de l'erreur. Valeurs possibles :         |
|                  | - Empty : Aucune erreur                                                  |
|                  | - CANCEL : Le client a annulé le processus de paiement                  |
|                  | - AUTHENTICATION : L'authentification du client n'a pas été réalisée correctement |
|                  | - PAYMENT_FAILED : Le paiement n'a pas été réussi sur le système TMoney  |
|                  | - EXPIRED_SESSION : La session du client a expiré                       |

Note : Pour ajouter un niveau supplémentaire de sécurité, il est recommandé au site web eCommerce de :

- Autoriser uniquement l'adresse IP des paiements en ligne TMoney à appeler l'URL de notification.
- Vérifier que le montant total de l'achat (montant envoyé à la plateforme TMoney via le formulaire de commande) est égal au montant envoyé par la plateforme TMoney dans l'URL de notification. Le montant envoyé dans l'URL de notification est le montant réellement payé par le client.


## URL DE RETOUR
Le client est redirigé vers le site web de commerce électronique dans les trois cas suivants :
1. Paiement validé : Le client effectue le paiement avec succès et clique sur le bouton "Confirmer" de la dernière page.
Le client effectue le paiement avec succès et clique sur le bouton "Confirmer" sur la dernière page. Il est alors redirigé vers l'URL d'acceptation.
2. Paiement annulé : Le client clique sur le bouton "Annuler" de la page de paiement en ligne.
Il est ensuite redirigé vers l'URL d'annulation.
3. Paiement refusé : Une erreur se produit au cours de la procédure de paiement.
automatiquement redirigé vers l'URL de refus.
Note 1 : Les trois URL "Accept URL", "Cancel URL" et "Decline URL" peuvent être configurées dynamiquement dans le formulaire de commande.
configurées dynamiquement dans le formulaire de commande. Si le formulaire de commande ne contient pas ces paramètres, les 3 URL configurés par l'administrateur du système seront appelés.
configurées par l'administrateur du système seront appelées.
Note 2 : Dans ces 3 cas, même si le client ferme le paiement en ligne après avoir annulé l'opération ou effectué le paiement, l'argent TMoney est conservé.
l'opération ou après avoir effectué le paiement, le système TMoney enverra aussi automatiquement une notification au site Web de commerce électronique.
au site Web de commerce électronique à l'aide de l'URL de notification. Dans d'autres cas, si le client ferme son navigateur avant de commencer le processus, aucun avis ne sera envoyé.
avant de commencer le processus, aucun avis ne sera envoyé.














# MBANKING
TMoney est le service de paiement mobile de TOGO CELLULAIRE, offrant plusieurs modes de paiement :
- USSD : paiement effectué depuis le parcours client USSD.
- WEB : paiement effectué depuis les sites marchands via une passerelle de paiement native (flux e-commerce).
- 3rd PARTY APP : paiement effectué à partir d'applications tierces via une passerelle de paiement développée en interne (flux crédit + débit). développée en interne (flux crédit + débit/push USSD).
Pour échanger sur la nouvelle plateforme TMoney, il est essentiel d'implémenter ses fonctionnalités spécifiques.
À cette fin, les composants à développer devront assurer la non-régression des services actuellement offerts.

Ce document décrit les spécifications détaillées du projet appelé "MBANKING" qui est
intéressé par des opérations en partenariat avec des partenaires bancaires.
Les résultats attendus de ce projet sont :
▪ Intégration avec WSO2.
▪ Stockage de la configuration de la banque,
▪ Mise en œuvre des fonctionnalités actuelles de mbanking sans impact sur le côté partenaire.


## caractéristiques
Le principe technique repose sur la division de la solution en microservices. Les composants
Les composants retenus sont les suivants :
- Créditer le compte du client (bankcashin) en faveur du compte d'un partenaire.
- Débiter le compte du client (bankcashout/push-ussd) en faveur du compte d'un partenaire.
- Rechercher le résultat d'une transaction donnée (check-transaction).

## Encaissement bancaire
Cette fonction permet d'envoyer une demande pour recharger le compte TMoney d'un client à partir du compte TMoney d'un partenaire. A la fin de l'opération, le montant débité du compte du partenaire est égal au montant crédité sur le compte du client.


## DÉBIT (PUSH USSD) et CRÉDIT PORTFEUILLE

"DEBIT (PUSH USSD)" fait référence à une opération de débit réalisée via USSD (Unstructured Supplementary Service Data), souvent utilisé pour les transactions mobiles.

"CREDIT WALLET" signifie créditer un portefeuille électronique, c'est-à-dire ajouter des fonds au compte électronique d'un utilisateur pour effectuer des paiements ou des transactions ultérieures.




3 PRÉSENTATION DE LA SOLUTION

Afin de répondre aux attentes exprimées, il est essentiel de décomposer ce bloc en plusieurs services indépendants avec la possibilité de communication entre eux.
Ce choix est motivé par la performance globale du système, l'élimination du point de défaillance unique, la scalabilité du système et la facilité de maintenance.
3.1 Authentification
L'authentification est basée sur JWT (JSON Web Token).
3.1.1 Mécanisme
Pour accéder à l'API, le Tiers doit obtenir un compte d'accès (nom d'utilisateur, mot de passe) auprès de TOGOCEL.
Le Tiers initie une demande d'autorisation vers le serveur d'autorisation.
Lorsque l'autorisation est accordée, le serveur d'autorisation renvoie un jeton d'accès au Tiers.
Le Tiers doit ensuite utiliser ce jeton d'accès pour accéder aux ressources exposées par l'API.




Le principe technique repose sur la division de la solution en microservices. Les composants
composants retenus sont les suivants :
- Créditer le compte du client (credit) en faveur du compte d'un partenaire.
- Débiter le compte du client (debit/push-ussd) en faveur du compte d'un partenaire.
- Rechercher le résultat d'une transaction donnée (check-transaction).


## Service de crédit
Cette fonction permet d'envoyer une demande pour recharger le compte TMoney d'un client à partir du compte TMoney d'un partenaire. A la fin de l'opération, le montant débité du compte du partenaire est égal au montant crédité sur le compte du client.

version 1(ancienne version)

a- input
type: get
format: json

parameter
- merchantid or agentid
- password
- client
- amount
- currency
- trxcode
- type
- description
- referenceid
- sms
- email

b-ouput
type: post
format: json

paramatre:
- merchantid or agentid
- client
- amount
- currency
- referenceid
- result
- transactionid


version 2(nouvelle version)

a-input
type: post
format: json

parametre
- idrequete
-numeroClient
- montant
- refCommande
- dateheureRequete
-description

b-output
type: post
format: json

parametre
- code
- message
- refTmoney
- da

## Service USSD de débit/poussée
Cette ressource est utilisée pour envoyer une demande de débit du compte TMoney d'un client et de crédit des comptes des partenaires pour le paiement d'un service.


## Vérifier la transaction
Ce module permet aux partenaires de vérifier l'état de leurs transactions sur la plateforme TMoney. Cela permet aux
partenaires de prendre des mesures de leur côté en conséquence





















Objectif et champ d'application
Le présent guide du programmeur d'applications a pour objet de décrire la manière de gérer les enregistrements 
sur le serveur web qu'une application cliente peut appeler en effectuant des requêtes HTTP sur le réseau à l'aide des ressources POST/GET. 
réseau en utilisant les ressources POST/GET. Le service produira une réponse sous forme de JSON.
Les documents suivants sont inclus : 
 Service web de transaction Flooz en ligne
 Syntaxe de la demande et de la réponse 
 Codes de réponse
Les utilisateurs de cette API sont : 
 L'assistance technique de Flooz 
 Administrateurs de Flooz 
 Les partenaires qui s'intègrent à l'API
Les objectifs de cette API sont :
 API standard pour l'intégration basée sur JSON