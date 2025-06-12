// Configuration
const API_URL = 'https://9995-137-255-47-161.ngrok-free.app/System_badge/api/enregistrer-scan.php';
const SCAN_DELAY = 1000;

// Éléments UI
const videoElement = document.getElementById('scanner');
const resultElement = document.getElementById('resultat');
const statusIcon = resultElement.querySelector('.status-icon');
const statusText = resultElement.querySelector('.status-text');
const btnEntree = document.getElementById('btn-entree');
const btnSortie = document.getElementById('btn-sortie');

// Variables
let scanner;
let lastScanTime = 0;
let scanType = 'entrée';

// Gestion du type de scan
btnEntree.addEventListener('click', () => {
    scanType = 'entrée';
    btnEntree.classList.add('active');
    btnSortie.classList.remove('active');
});

btnSortie.addEventListener('click', () => {
    scanType = 'sortie';
    btnSortie.classList.add('active');
    btnEntree.classList.remove('active');
});

// Initialisation
document.addEventListener('DOMContentLoaded', initScanner);

async function initScanner() {
    try {
        const cameras = await Instascan.Camera.getCameras();
        
        if (cameras.length === 0) {
            showError('Aucune caméra détectée');
            return;
        }

        // Priorité à la caméra arrière
        const rearCamera = cameras.find(cam => cam.name.includes('arrière')) || cameras[cameras.length - 1];
        startScanner(rearCamera);
        
    } catch (error) {
        console.error('Erreur:', error);
        showError('Erreur d\'initialisation');
    }
}

function startScanner(camera) {
    scanner = new Instascan.Scanner({
        video: videoElement,
        mirror: false,
        scanPeriod: 5,
        backgroundScan: false
    });

    scanner.addListener('scan', async (qrCode) => {
        const now = Date.now();
        if (now - lastScanTime < SCAN_DELAY) return;
        lastScanTime = now;

        showLoading('Traitement en cours...');
        
        try {
            const response = await processScan(qrCode);
            
            if (response.success) {
                showSuccess(`Enregistré: ${response.nom} (${scanType})`);
            } else {
                showError('QR code non reconnu');
            }
        } catch (error) {
            showError('Erreur de connexion');
            console.error(error);
        }
    });

    scanner.start(camera).catch(err => {
        showError('Accès caméra refusé');
        console.error(err);
    });
}

async function processScan(qrCode) {
    const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
            qr_code: qrCode,
            type_scan: scanType 
        })
    });
    
    return await response.json();
}

// Helpers UI
function showLoading(message) {
    statusIcon.textContent = '⌛';
    statusText.textContent = message;
    resultElement.className = '';
}

function showSuccess(message) {
    const sound = document.getElementById('successSound');
    sound.currentTime = 0;
    sound.play().catch(e => console.error("Erreur son :", e));

    statusIcon.textContent = '✓';
    statusText.textContent = message;
    resultElement.classList.add('success');
    
    setTimeout(() => {
        showLoading('Prêt pour le prochain scan');
    }, 3000);
}

function showError(message) {
    statusIcon.textContent = '✗';
    statusText.textContent = message;
    resultElement.classList.add('error');
}