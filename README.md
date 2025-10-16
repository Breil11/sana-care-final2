# Sana-Care Infi As Pro

Application complète de gestion pour professionnels de santé (infirmiers, aides-soignants et établissements de santé).

## 🌟 Fonctionnalités complètes

✨ **Gestion utilisateurs** - Inscription, approbation admin, profils avec photos
💬 **Messagerie intégrée** - Communication temps réel entre professionnels  
📅 **Horaires & disponibilités** - Gestion complète des plannings
🏥 **Gestion établissements** - CRUD complet des institutions
💰 **Tarification** - Taux horaires + frais déplacement
📋 **Fiches de paie** - Génération auto avec commission 7%
🔔 **Notifications** - Système centralisé temps réel
📊 **Dashboard** - Statistiques et KPIs en direct
🔄 **Échanges prestations** - Entre professionnels
🎨 **Design moderne** - Thème or élégant et responsive

## 🛠 Stack technique

**Backend**: FastAPI + MongoDB + JWT + Motor  
**Frontend**: React 19 + Tailwind CSS + Shadcn UI + Axios  
**Base de données**: MongoDB

## 🚀 Installation rapide

### Installation automatique (recommandé)

**Windows** :
```powershell
.\install-windows.ps1
```

**Linux/Mac** :
```bash
chmod +x install.sh
./install.sh
```

### Installation manuelle

**Backend** :
```bash
cd backend
pip install -r requirements.txt
uvicorn server:app --reload --host 0.0.0.0 --port 8001
```

**Frontend** :
```bash
cd frontend

# Avec npm (Node v18+)
npm install --legacy-peer-deps
npm start

# Avec yarn
yarn install
yarn start
```

Application accessible sur `http://localhost:3000`

**Erreur npm ERESOLVE ?** → Voir [FIX-NPM-ERROR.md](FIX-NPM-ERROR.md)

## 👥 Rôles

- **Admin** : Gestion complète, approbations, validations
- **Infirmier/Aide-soignant** : Horaires, prestations, messagerie, échanges

## 📁 Structure

```
/app/
├── backend/
│   ├── server.py          # API FastAPI
│   ├── .env              # Configuration
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── App.js
│   │   ├── components/   # Layout, UI
│   │   └── pages/        # 12 pages complètes
│   ├── package.json
│   └── .env
└── README.md
```

## 🎯 Endpoints API principaux

- `/api/auth/*` - Authentification
- `/api/users/*` - Gestion utilisateurs
- `/api/institutions/*` - Établissements
- `/api/schedules/*` - Horaires
- `/api/shifts/*` - Prestations
- `/api/payslips/*` - Fiches de paie
- `/api/messages/*` - Messagerie
- `/api/notifications/*` - Notifications
- `/api/exchanges/*` - Échanges
- `/api/dashboard/stats` - Statistiques

## 🔐 Sécurité

✓ JWT avec expiration  
✓ Mots de passe Bcrypt  
✓ Validation Pydantic  
✓ CORS configuré  
✓ Contrôle d'accès par rôles

## 🧪 Tests

- ✅ 100% endpoints backend fonctionnels (17/17)
- ✅ Tous workflows validés
- ✅ Intégration frontend/backend testée

## 📱 Responsive

Mobile, tablette et desktop entièrement supportés.

---

**Sana-Care Infi As Pro** - Gestion professionnelle de santé simplifiée 🏥✨
