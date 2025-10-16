# Script d'installation pour npm (Windows PowerShell)
# Compatible Node v18

Write-Host "==================================" -ForegroundColor Cyan
Write-Host "Installation Sana-Care Infi As Pro" -ForegroundColor Cyan
Write-Host "==================================" -ForegroundColor Cyan
Write-Host ""

# Vérifier Node.js
Write-Host "Vérification de Node.js..." -ForegroundColor Yellow
$nodeVersion = node -v
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERREUR: Node.js n'est pas installé!" -ForegroundColor Red
    Write-Host "Téléchargez Node.js v18 depuis: https://nodejs.org/" -ForegroundColor Red
    exit 1
}
Write-Host "Node.js version: $nodeVersion" -ForegroundColor Green

# Vérifier npm
Write-Host "Vérification de npm..." -ForegroundColor Yellow
$npmVersion = npm -v
Write-Host "npm version: $npmVersion" -ForegroundColor Green
Write-Host ""

# Installation Frontend
Write-Host "Installation du Frontend..." -ForegroundColor Cyan
Set-Location frontend

# Supprimer les anciens fichiers
Write-Host "Nettoyage des anciens fichiers..." -ForegroundColor Yellow
if (Test-Path "node_modules") { Remove-Item -Recurse -Force node_modules }
if (Test-Path "package-lock.json") { Remove-Item -Force package-lock.json }
if (Test-Path "yarn.lock") { Remove-Item -Force yarn.lock }

# Installer avec --legacy-peer-deps
Write-Host "Installation des dépendances (cela peut prendre 2-3 minutes)..." -ForegroundColor Yellow
npm install --legacy-peer-deps

if ($LASTEXITCODE -ne 0) {
    Write-Host "ERREUR lors de l'installation!" -ForegroundColor Red
    exit 1
}

Write-Host "Frontend installé avec succès!" -ForegroundColor Green
Write-Host ""

# Installation Backend
Write-Host "Installation du Backend..." -ForegroundColor Cyan
Set-Location ../backend

Write-Host "Vérification de Python..." -ForegroundColor Yellow
$pythonVersion = python --version
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERREUR: Python n'est pas installé!" -ForegroundColor Red
    Write-Host "Téléchargez Python 3.11+ depuis: https://www.python.org/" -ForegroundColor Red
    exit 1
}
Write-Host "Python version: $pythonVersion" -ForegroundColor Green

Write-Host "Installation des dépendances Python..." -ForegroundColor Yellow
pip install -r requirements.txt

if ($LASTEXITCODE -ne 0) {
    Write-Host "ERREUR lors de l'installation Python!" -ForegroundColor Red
    exit 1
}

Write-Host "Backend installé avec succès!" -ForegroundColor Green
Write-Host ""

# Instructions finales
Write-Host "==================================" -ForegroundColor Cyan
Write-Host "Installation terminée avec succès!" -ForegroundColor Green
Write-Host "==================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Pour démarrer l'application:" -ForegroundColor Yellow
Write-Host ""
Write-Host "1. Démarrer MongoDB (si pas déjà démarré)" -ForegroundColor White
Write-Host ""
Write-Host "2. Dans un terminal PowerShell:" -ForegroundColor White
Write-Host "   cd backend" -ForegroundColor Cyan
Write-Host "   uvicorn server:app --reload" -ForegroundColor Cyan
Write-Host ""
Write-Host "3. Dans un autre terminal PowerShell:" -ForegroundColor White
Write-Host "   cd frontend" -ForegroundColor Cyan
Write-Host "   npm start" -ForegroundColor Cyan
Write-Host ""
Write-Host "4. Ouvrez votre navigateur: http://localhost:3000" -ForegroundColor White
Write-Host ""
Write-Host "Consultez QUICKSTART.md pour plus d'infos!" -ForegroundColor Yellow

Set-Location ..
