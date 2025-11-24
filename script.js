// ============================================
// DEVICEFINDER - JAVASCRIPT
// Gère toute l'interactivité du site
// ============================================

// ============================================
// 1. VARIABLES GLOBALES
// ============================================

let selectedFile = null;
let currentBriefId = null;

// ============================================
// 2. INITIALISATION AU CHARGEMENT DE LA PAGE
// ============================================

document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 DeviceFinder initialisé !');
    
    // Récupérer tous les éléments du DOM
    const dropZone = document.getElementById('drop-zone');
    const fileInput = document.getElementById('file-input');
    const fileInfo = document.getElementById('file-info');
    const analyzeBtn = document.getElementById('analyze-btn');
    const removeFileBtn = document.getElementById('remove-file');
    const restartBtn = document.getElementById('restart-btn');
    const retryBtn = document.getElementById('retry-btn');
    
    // ========================================
    // GESTION DU DRAG & DROP
    // ========================================
    
    // Quand on clique sur la zone
    dropZone.addEventListener('click', () => {
        fileInput.click();
    });
    
    // Quand un fichier glisse au-dessus
    dropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropZone.classList.add('drag-over');
    });
    
    // Quand le fichier quitte la zone
    dropZone.addEventListener('dragleave', () => {
        dropZone.classList.remove('drag-over');
    });
    
    // Quand on lâche le fichier
    dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropZone.classList.remove('drag-over');
        
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            handleFileSelection(files[0]);
        }
    });
    
    // Quand on sélectionne un fichier via le bouton
    fileInput.addEventListener('change', (e) => {
        if (e.target.files.length > 0) {
            handleFileSelection(e.target.files[0]);
        }
    });
    
    // ========================================
    // BOUTONS D'ACTION
    // ========================================
    
    // Bouton pour retirer le fichier
    removeFileBtn.addEventListener('click', () => {
        resetFileSelection();
    });
    
    // Bouton pour analyser le brief
    analyzeBtn.addEventListener('click', () => {
        if (selectedFile) {
            uploadAndAnalyze();
        }
    });
    
    // Bouton pour recommencer
    restartBtn.addEventListener('click', () => {
        location.reload();
    });
    
    // Bouton pour réessayer en cas d'erreur
    retryBtn.addEventListener('click', () => {
        hideError();
        if (selectedFile) {
            uploadAndAnalyze();
        }
    });
});

// ============================================
// 3. GESTION DE LA SÉLECTION DE FICHIER
// ============================================

function handleFileSelection(file) {
    // Vérifier le type de fichier
    const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain'];
    const fileExtension = file.name.split('.').pop().toLowerCase();
    const allowedExtensions = ['pdf', 'doc', 'docx', 'txt'];
    
    if (!allowedTypes.includes(file.type) && !allowedExtensions.includes(fileExtension)) {
        showError('Type de fichier non supporté. Utilise un PDF, Word ou TXT.');
        return;
    }
    
    // Vérifier la taille (10 Mo max)
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
        showError('Fichier trop volumineux. Maximum 10 Mo.');
        return;
    }
    
    // Fichier OK, on le garde
    selectedFile = file;
    
    // Afficher les infos du fichier
    document.querySelector('.file-name').textContent = file.name;
    document.querySelector('.file-size').textContent = formatFileSize(file.size);
    
    // Cacher la zone de drop, montrer les infos
    document.getElementById('drop-zone').style.display = 'none';
    document.getElementById('file-info').style.display = 'block';
    
    // Activer le bouton d'analyse
    document.getElementById('analyze-btn').disabled = false;
    
    addLog('✅ Fichier sélectionné : ' + file.name, 'success');
}

function resetFileSelection() {
    selectedFile = null;
    
    // Réinitialiser l'input
    document.getElementById('file-input').value = '';
    
    // Réafficher la zone de drop
    document.getElementById('drop-zone').style.display = 'block';
    document.getElementById('file-info').style.display = 'none';
    
    // Désactiver le bouton
    document.getElementById('analyze-btn').disabled = true;
}

// ============================================
// 4. UPLOAD ET ANALYSE
// ============================================

async function uploadAndAnalyze() {
    try {
        // Cacher la section d'upload
        document.getElementById('upload-section').style.display = 'none';
        
        // Afficher la section d'analyse
        document.getElementById('analysis-section').style.display = 'block';
        
        // Réinitialiser les logs
        document.getElementById('logs').innerHTML = '';
        
        // Étape 1 : Upload du fichier
        addLog('📤 Envoi du fichier au serveur...', 'info');
        updateProgress(10, 'Envoi du fichier...');
        
        const uploadResult = await uploadFile(selectedFile);
        
        if (!uploadResult.success) {
            throw new Error(uploadResult.error || 'Erreur lors de l\'upload');
        }
        
        currentBriefId = uploadResult.brief_id;
        addLog('✅ Fichier uploadé avec succès !', 'success');
        updateProgress(30, 'Extraction du texte...');
        
        // Petite pause pour laisser le temps de lire
        await sleep(1000);
        
        // Étape 2 : Extraction du texte
        addLog('📄 Extraction du contenu du fichier...', 'info');
        const extractResult = await extractText(currentBriefId);
        
        if (!extractResult.success) {
            throw new Error(extractResult.error || 'Erreur lors de l\'extraction');
        }
        
        addLog('✅ Texte extrait : ' + extractResult.text_length + ' caractères', 'success');
        updateProgress(50, 'Analyse par l\'IA...');
        
        await sleep(1000);
        
        // Étape 3 : Analyse IA
        addLog('🤖 L\'IA analyse le brief...', 'info');
        const analysisResult = await analyzeWithAI(currentBriefId);
        
        if (!analysisResult.success) {
            throw new Error(analysisResult.error || 'Erreur lors de l\'analyse');
        }
        
        const devicesCount = analysisResult.devices.length;
        addLog(`✅ ${devicesCount} appareil(s) détecté(s) !`, 'success');
        updateProgress(70, 'Recherche sur le web...');
        
        await sleep(1000);
        
        // Étape 4 : Recherche pour chaque appareil
        addLog('🔍 Recherche des appareils sur internet...', 'info');
        
        for (let i = 0; i < analysisResult.devices.length; i++) {
            const device = analysisResult.devices[i];
            addLog(`🔎 Recherche: ${device.name}...`, 'info');
            
            const searchResult = await searchDevice(device.id);
            
            if (searchResult.success) {
                const resultsCount = searchResult.results_count || 0;
                if (resultsCount > 0) {
                    addLog(`✅ ${resultsCount} résultat(s) trouvé(s) pour ${device.name}`, 'success');
                } else {
                    addLog(`⚠️ Aucun résultat pour ${device.name}, recherche de contacts...`, 'warning');
                }
            }
            
            // Mise à jour de la progression
            const progress = 70 + ((i + 1) / devicesCount * 20);
            updateProgress(progress, `Recherche ${i + 1}/${devicesCount}...`);
            
            // Petite pause entre chaque recherche
            await sleep(500);
        }
        
        updateProgress(100, 'Analyse terminée !');
        addLog('🎉 Recherche terminée avec succès !', 'success');
        
        await sleep(1000);
        
        // Afficher les résultats
        displayResults(currentBriefId);
        
    } catch (error) {
        console.error('Erreur:', error);
        showError(error.message);
        addLog('❌ Erreur : ' + error.message, 'error');
    }
}

// ============================================
// 5. APPELS API AU SERVEUR
// ============================================

async function uploadFile(file) {
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await fetch('includes/upload.php', {
        method: 'POST',
        body: formData
    });
    
    return await response.json();
}

async function extractText(briefId) {
    const response = await fetch('includes/extract.php', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ brief_id: briefId })
    });
    
    return await response.json();
}

async function analyzeWithAI(briefId) {
    const response = await fetch('includes/analyze.php', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ brief_id: briefId })
    });
    
    return await response.json();
}

async function searchDevice(deviceId) {
    const response = await fetch('includes/search.php', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ device_id: deviceId })
    });
    
    return await response.json();
}

async function getResults(briefId) {
    const response = await fetch('includes/results.php', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ brief_id: briefId })
    });
    
    return await response.json();
}

// ============================================
// 6. AFFICHAGE DES RÉSULTATS
// ============================================

async function displayResults(briefId) {
    try {
        const resultsData = await getResults(briefId);
        
        if (!resultsData.success) {
            throw new Error('Impossible de récupérer les résultats');
        }
        
        // Cacher l'analyse, montrer les résultats
        document.getElementById('analysis-section').style.display = 'none';
        document.getElementById('results-section').style.display = 'block';
        
        const container = document.getElementById('results-container');
        container.innerHTML = '';
        
        // Pour chaque appareil
        resultsData.devices.forEach(device => {
            const deviceDiv = createDeviceResultHTML(device);
            container.appendChild(deviceDiv);
        });
        
    } catch (error) {
        showError('Erreur lors de l\'affichage des résultats: ' + error.message);
    }
}

// ============================================
// PATCH POUR script.js - Affichage des contacts
// Remplace la fonction createDeviceResultHTML (ligne ~344)
// ============================================

function createDeviceResultHTML(device) {
    const div = document.createElement('div');
    div.className = 'device-result';
    
    // Déterminer le statut
    let statusClass = 'status-not-found';
    let statusText = 'Non trouvé';
    let statusIcon = '❌';
    
    if (device.results && device.results.length > 0) {
        statusClass = 'status-found';
        statusText = `${device.results.length} résultat(s)`;
        statusIcon = '✅';
    }
    
    // En-tête de l'appareil
    div.innerHTML = `
        <div class="device-header">
            <h3 class="device-name">${statusIcon} ${device.name}</h3>
            <span class="device-status ${statusClass}">${statusText}</span>
        </div>
    `;
    
    // Spécifications requises
    if (device.required_specs && device.required_specs.length > 0) {
        const specsDiv = document.createElement('div');
        specsDiv.className = 'specs-info';
        specsDiv.innerHTML = `
            <strong>🎯 Spécifications obligatoires:</strong><br>
            ${device.required_specs.join(', ')}
        `;
        div.appendChild(specsDiv);
    }
    
    // Résultats de recherche
    if (device.results && device.results.length > 0) {
        device.results.forEach(result => {
            const resultDiv = document.createElement('div');
            resultDiv.className = 'result-item';
            
            // HTML de base du résultat
            let resultHTML = `
                <div class="result-title">
                    <a href="${result.url}" target="_blank">${result.title}</a>
                </div>
                <div class="result-snippet">${result.snippet}</div>
                <div class="result-meta">
                    <span>⭐ Pertinence: ${result.relevance_score}%</span>
                    ${result.has_required_specs ? '<span style="color: var(--success-color)">✅ Toutes les specs OK</span>' : '<span style="color: var(--warning-color)">⚠️ Specs incomplètes</span>'}
                </div>
            `;
            
            // NOUVEAU : Afficher les contacts si disponibles
            if (result.contacts) {
                const contacts = result.contacts;
                const hasContacts = contacts.company || contacts.email || contacts.phone || contacts.address;
                
                if (hasContacts) {
                    resultHTML += `
                        <div class="contact-info">
                            <strong>📞 Informations de contact :</strong><br>
                            ${contacts.company ? `<div class="contact-item">🏢 <strong>Entreprise:</strong> ${contacts.company}</div>` : ''}
                            ${contacts.email ? `<div class="contact-item">✉️ <strong>Email:</strong> <a href="mailto:${contacts.email}">${contacts.email}</a></div>` : ''}
                            ${contacts.phone ? `<div class="contact-item">📱 <strong>Téléphone:</strong> <a href="tel:${contacts.phone}">${contacts.phone}</a></div>` : ''}
                            ${contacts.address ? `<div class="contact-item">📍 <strong>Adresse:</strong> ${contacts.address}</div>` : ''}
                        </div>
                    `;
                }
            }
            
            resultDiv.innerHTML = resultHTML;
            div.appendChild(resultDiv);
        });
    } else {
        // Aucun résultat trouvé
        const noResultDiv = document.createElement('div');
        noResultDiv.className = 'result-item';
        noResultDiv.innerHTML = `
            <p style="color: var(--text-muted);">
                😔 Aucun résultat pertinent trouvé pour cet appareil. Essaie de reformuler ta recherche ou contacte directement des fournisseurs spécialisés.
            </p>
        `;
        div.appendChild(noResultDiv);
    }
    
    return div;
}


// ============================================
// 7. GESTION DES LOGS
// ============================================

function addLog(message, type = 'info') {
    const logsContainer = document.getElementById('logs');
    const logEntry = document.createElement('div');
    logEntry.className = `log-entry log-${type}`;
    
    let icon = 'ℹ️';
    if (type === 'success') icon = '✅';
    if (type === 'warning') icon = '⚠️';
    if (type === 'error') icon = '❌';
    
    logEntry.innerHTML = `<i class="fas fa-chevron-right"></i> ${icon} ${message}`;
    logsContainer.appendChild(logEntry);
    
    // Scroll automatique vers le bas
    logsContainer.scrollTop = logsContainer.scrollHeight;
}

// ============================================
// 8. GESTION DE LA PROGRESSION
// ============================================

function updateProgress(percent, text) {
    document.getElementById('progress-fill').style.width = percent + '%';
    document.getElementById('progress-text').textContent = text;
}

// ============================================
// 9. GESTION DES ERREURS
// ============================================

function showError(message) {
    document.getElementById('error-message').textContent = message;
    document.getElementById('error-section').style.display = 'block';
    document.getElementById('upload-section').style.display = 'none';
    document.getElementById('analysis-section').style.display = 'none';
}

function hideError() {
    document.getElementById('error-section').style.display = 'none';
    document.getElementById('upload-section').style.display = 'block';
}

// ============================================
// 10. FONCTIONS UTILITAIRES
// ============================================

function formatFileSize(bytes) {
    if (bytes === 0) return '0 Octets';
    
    const k = 1024;
    const sizes = ['Octets', 'Ko', 'Mo', 'Go'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// ============================================
// 11. CONSOLE INFO
// ============================================

console.log('%c🤖 DeviceFinder v1.0 ', 'background: #6366f1; color: white; font-size: 20px; padding: 10px;');
console.log('%cPropulsé par Google Gemini AI', 'color: #10b981; font-size: 12px;');