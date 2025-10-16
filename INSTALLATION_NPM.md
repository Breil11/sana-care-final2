# Installation avec NPM et Node v18

## Prérequis

- Node.js v18.x
- NPM (inclus avec Node.js)
- Python 3.11+
- MongoDB

## Installation Frontend avec NPM

### Option 1 : Installation directe (recommandée)

```bash
cd /app/frontend

# Supprimer node_modules si existant
rm -rf node_modules package-lock.json yarn.lock

# Installer avec yarn (car react-scripts 5.0.1 a des problèmes de compatibilité avec npm)
yarn install

# Démarrer l'application
yarn start
```

**Note importante** : React Scripts 5.0.1 avec Create React App a des problèmes de compatibilité avec npm en raison de conflits de dépendances peer (notamment `date-fns` et `react-day-picker`). Yarn gère mieux ces conflits.

### Option 2 : Utiliser npm avec --legacy-peer-deps

Si vous préférez absolument npm :

```bash
cd /app/frontend

# Supprimer les lockfiles existants
rm -rf node_modules package-lock.json yarn.lock

# Installer avec --legacy-peer-deps
npm install --legacy-peer-deps

# Démarrer
npm start
```

⚠️ **Attention** : Cette méthode peut causer des problèmes de stabilité dus aux résolutions de dépendances.

## Scripts disponibles

Une fois les dépendances installées :

```bash
# Démarrer en développement
npm start  # ou yarn start

# Build production
npm run build  # ou yarn build

# Tests
npm test  # ou yarn test
```

## Backend (inchangé)

```bash
cd /app/backend

# Installer les dépendances
pip install -r requirements.txt

# Démarrer le serveur
uvicorn server:app --reload --host 0.0.0.0 --port 8001
```

## Problèmes connus avec npm

### Erreur : "Cannot find module 'ajv/dist/compile/codegen'"

**Cause** : Conflit entre les versions d'ajv installées par npm.

**Solution** :
```bash
cd /app/frontend
rm -rf node_modules package-lock.json
npm install --legacy-peer-deps
```

### Erreur : "ERESOLVE unable to resolve dependency tree"

**Cause** : Conflits de peer dependencies entre date-fns@4.x et react-day-picker@8.x.

**Solution recommandée** : Utiliser yarn qui gère mieux ces conflits.

**Solution alternative** :
```bash
npm install --legacy-peer-deps
```

## Migration vers npm (si nécessaire)

Si vous voulez vraiment migrer vers npm uniquement :

1. Mettre à jour `package.json` pour résoudre les conflits :

```json
{
  "dependencies": {
    "date-fns": "^3.6.0",  // Downgrade de 4.1.0 à 3.6.0
    "react-day-picker": "8.10.1"
  }
}
```

2. Supprimer `yarn.lock` et installer :

```bash
rm yarn.lock
npm install --legacy-peer-deps
```

## Compatibilité Node.js

L'application est compatible avec :
- ✅ Node.js v18.x (votre version)
- ✅ Node.js v20.x
- ✅ Node.js v22.x

## Vérification de l'installation

```bash
# Vérifier Node.js
node -v  # Devrait afficher v18.x.x

# Vérifier npm
npm -v

# Tester le frontend
cd /app/frontend
npm start  # ou yarn start

# Tester le backend
cd /app/backend
python -c "import fastapi; print('FastAPI OK')"
```

## En production

Pour déployer en production :

```bash
cd /app/frontend

# Build
npm run build  # ou yarn build

# Les fichiers statiques sont dans /app/frontend/build
```

## Support

L'application fonctionne avec npm et Node v18, mais yarn est recommandé pour éviter les problèmes de dépendances.

Pour toute question, consultez le README.md principal.
