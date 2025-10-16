# 🚀 Guide de démarrage rapide - Sana-Care Infi As Pro

## Pour votre environnement (npm + Node v18)

### 1. Cloner les fichiers sur votre machine

Copiez tous les fichiers de ce projet dans votre repository local.

### 2. Installation Backend

```bash
cd backend

# Créer un environnement virtuel (optionnel mais recommandé)
python -m venv venv
source venv/bin/activate  # Sur Windows: venv\Scripts\activate

# Installer les dépendances
pip install -r requirements.txt

# Vérifier que MongoDB est en cours d'exécution
# Si MongoDB n'est pas installé, installez-le depuis https://www.mongodb.com/
```

### 3. Configuration Backend

Vérifiez le fichier `backend/.env` :

```env
MONGO_URL="mongodb://localhost:27017"
DB_NAME="sanacare_db"
CORS_ORIGINS="*"
SECRET_KEY="sanacare-secret-key-change-in-production-2025"
```

### 4. Installation Frontend

```bash
cd frontend

# Option A : Avec yarn (recommandé - plus stable)
yarn install
# OU
# Option B : Avec npm
npm install --legacy-peer-deps
```

**Note importante** : L'application utilise actuellement yarn car React Scripts 5.0.1 a des problèmes de compatibilité avec npm. Si vous voulez utiliser npm exclusivement, suivez [INSTALLATION_NPM.md](INSTALLATION_NPM.md).

### 5. Démarrer l'application

Ouvrez 2 terminaux :

**Terminal 1 - Backend** :
```bash
cd backend
uvicorn server:app --reload --host 0.0.0.0 --port 8001
```

Vous verrez :
```
INFO:     Uvicorn running on http://0.0.0.0:8001
INFO:     Application startup complete.
```

**Terminal 2 - Frontend** :
```bash
cd frontend
yarn start  # ou npm start
```

Vous verrez :
```
Compiled successfully!
You can now view frontend in the browser.
  Local:            http://localhost:3000
```

### 6. Accéder à l'application

Ouvrez votre navigateur : **http://localhost:3000**

### 7. Premier test

1. **Créer un compte admin** :
   - Cliquez sur "S'inscrire"
   - Remplissez le formulaire
   - Pour le rôle, ouvrez la console du navigateur (F12) et tapez :
     ```javascript
     document.querySelector('[data-testid="register-role-select"]').innerHTML += '<option value="admin">Administrateur</option>'
     ```
   - Sélectionnez "Administrateur"
   - Inscrivez-vous

2. **Se connecter** :
   - Utilisez vos identifiants
   - Vous accédez au dashboard admin

3. **Créer un établissement** :
   - Allez dans "Établissements"
   - Cliquez sur "Ajouter"
   - Remplissez les informations

4. **Approuver des utilisateurs** :
   - Allez dans "Utilisateurs"
   - Approuvez les demandes en attente

## Résolution de problèmes

### Frontend ne démarre pas

```bash
cd frontend
rm -rf node_modules package-lock.json yarn.lock
yarn install  # ou npm install --legacy-peer-deps
yarn start
```

### Backend erreur de connexion MongoDB

Vérifiez que MongoDB est démarré :
```bash
# Sur Linux/Mac
sudo systemctl status mongodb

# Sur Windows
# Vérifiez dans les Services
```

### Port déjà utilisé

Si le port 3000 ou 8001 est utilisé :

```bash
# Trouver le processus
lsof -i :3000  # ou :8001

# Le tuer
kill -9 <PID>
```

## Scripts utiles

### Backend
```bash
# Démarrer en mode développement
uvicorn server:app --reload

# Démarrer en production
uvicorn server:app --host 0.0.0.0 --port 8001
```

### Frontend
```bash
# Développement
yarn start  # ou npm start

# Build production
yarn build  # ou npm run build

# Le build est dans frontend/build/
```

## Structure des fichiers importants

```
votre-repo/
├── backend/
│   ├── server.py          ← API principale
│   ├── .env              ← Configuration
│   └── requirements.txt   ← Dépendances Python
│
├── frontend/
│   ├── src/
│   │   ├── App.js        ← Point d'entrée
│   │   ├── App.css       ← Styles globaux
│   │   ├── pages/        ← 12 pages de l'app
│   │   └── components/   ← Composants réutilisables
│   ├── package.json      ← Dépendances Node
│   └── .env             ← Config frontend
│
├── README.md             ← Documentation complète
├── INSTALLATION_NPM.md   ← Guide npm/Node v18
└── QUICKSTART.md         ← Ce fichier
```

## Prochaines étapes

1. ✅ L'application fonctionne en local
2. 📝 Lisez le [README.md](README.md) pour la documentation complète
3. 🔧 Personnalisez les couleurs dans `frontend/src/App.css`
4. 🚀 Déployez en production (voir README.md)

## Support

- 📧 Questions ? Consultez le README.md principal
- 🐛 Bugs ? Vérifiez les logs :
  - Backend : Dans le terminal où vous avez lancé uvicorn
  - Frontend : Console du navigateur (F12)

---

**Bon développement ! 🎉**
