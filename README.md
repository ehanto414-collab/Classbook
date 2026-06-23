ClasseBook — persistance Firestore + Storage

Ce que j'ai ajouté
- firebase-utils.js : initialisation Firebase, fonctions : setState, getStateOnce, listenState, uploadImage.
- app.js (branche feature/db) : utilise Storage pour uploader les images et Firestore pour stocker l'état global.
- Modif index.html : chargement du script en tant que module (type="module").
- firestore.rules / storage.rules : exemples de règles (actuellement permissives pour tests).

Étapes rapides pour tester localement
1) Récupère la branche :
   git fetch origin
   git checkout feature/db

2) Ouvre un serveur local (optionnel mais recommandé) :
   python -m http.server 8000
   puis ouvre http://localhost:8000

3) Utilise la console Firebase (https://console.firebase.google.com) -> Firestore / Storage pour voir les données et images uploadées.

Sécurité — important
- Les règles dans firestore.rules et storage.rules sont permissives pour faciliter les tests. NE PAS LES LAISSER AINSI EN PRODUCTION.
- Recommandation : activer Firebase Authentication (anonyme ou par provider), puis modifier les règles pour n'autoriser les écritures qu'aux utilisateurs authentifiés ou aux appareils enregistrés.

Règles exemples à durcir (suggestion rapide)
- Firestore : n'autoriser les écritures que si le document comporte un champ ownerDeviceId égal à request.auth.token.deviceId (ou si request.auth != null).
- Storage : autoriser l'écriture seulement à des utilisateurs authentifiés.

Déploiement sur GitHub Pages (rapide)
1) La page est statique — GitHub Pages peut servir `index.html` depuis la branche `main` ou `gh-pages`.
2) Si tu veux déployer depuis `main` :
   - Paramètres du repo -> Pages -> Source -> Branch: main / root
   - Ou : créer une action qui build/publie sur gh-pages si besoin.

Je peux automatiser le déploiement :
- Option A (rapide) : créer un workflow GitHub Action qui déploie la branche feature/db vers la branche gh-pages à chaque push.
- Option B : te guider pour activer Pages depuis la branche `main`.

Dis-moi ce que tu veux maintenant :
- Je pousse une PR depuis feature/db vers main (avec description + checklist) ? Réponds "OK PR".
- Je crée un workflow GitHub Action pour déployer automatiquement sur gh-pages ? Réponds "OK deploy action".
- Tu veux que je verrouille les règles Firestore/Storage et active l'auth (anonyme) automatiquement ? Réponds "Sécuriser maintenant".

Je peux faire plusieurs choses enchaînées si tu veux — dis simplement les étapes (par ex. "OK PR, deploy action, Sécuriser maintenant").
