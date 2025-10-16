# Installation rapide Sana-Care (Linux/Mac)

echo "=================================="
echo "Installation Sana-Care Infi As Pro"
echo "=================================="
echo ""

# Vérifier Node.js
echo "Vérification de Node.js..."
if ! command -v node &> /dev/null; then
    echo "ERREUR: Node.js n'est pas installé!"
    echo "Installez Node.js v18 depuis: https://nodejs.org/"
    exit 1
fi
echo "Node.js: $(node -v)"

# Vérifier npm
echo "npm: $(npm -v)"
echo ""

# Installation Frontend
echo "Installation du Frontend..."
cd frontend

echo "Nettoyage..."
rm -rf node_modules package-lock.json yarn.lock

echo "Installation des dépendances (2-3 minutes)..."
npm install --legacy-peer-deps

if [ $? -ne 0 ]; then
    echo "ERREUR lors de l'installation frontend!"
    exit 1
fi

echo "Frontend installé!"
echo ""

# Installation Backend
echo "Installation du Backend..."
cd ../backend

echo "Vérification de Python..."
if ! command -v python3 &> /dev/null; then
    echo "ERREUR: Python n'est pas installé!"
    exit 1
fi
echo "Python: $(python3 --version)"

echo "Installation des dépendances Python..."
pip3 install -r requirements.txt

if [ $? -ne 0 ]; then
    echo "ERREUR lors de l'installation backend!"
    exit 1
fi

echo "Backend installé!"
echo ""

# Instructions finales
echo "=================================="
echo "Installation terminée avec succès!"
echo "=================================="
echo ""
echo "Pour démarrer l'application:"
echo ""
echo "1. Terminal 1 - Backend:"
echo "   cd backend"
echo "   uvicorn server:app --reload"
echo ""
echo "2. Terminal 2 - Frontend:"
echo "   cd frontend"
echo "   npm start"
echo ""
echo "3. Ouvrez: http://localhost:3000"
echo ""
echo "Consultez QUICKSTART.md pour plus d'infos!"

cd ..
