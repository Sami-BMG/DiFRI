// app.js - DiFRI - Dimensionnement Frigorifique - VERSION COMPLÈTE

// Données de l'application
const AppState = {
    currentStep: 1,
    totalSteps: 4,
    calculationData: {},
    savedCalculations: []
};

// Coefficients de conductivité thermique des matériaux (W/m.K)
const MATERIAL_COEFFICIENTS = {
    polyurethane: 0.022,
    polystyrene: 0.035,
    glasswool: 0.040,
    handsoil: 0.500 // Valeur approximative pour le sol à main
};

// Chaleurs spécifiques des produits (kJ/kg.K)
const PRODUCT_SPECIFIC_HEAT = {
    fruits: 3.77,
    vegetables: 3.94,
    meat: 3.14,
    fish: 3.98,
    dairy: 3.93,
    frozen: 2.00,
    other: 3.50
};

// Noms des matériaux pour l'affichage
const MATERIAL_NAMES = {
    polyurethane: "Polyuréthane injecté",
    polystyrene: "Polystyrène",
    glasswool: "Laine de verre",
    handsoil: "À main le sol"
};

// Noms des types de produits
const PRODUCT_TYPE_NAMES = {
    fruits: "Fruits frais",
    vegetables: "Légumes",
    meat: "Viande",
    fish: "Poisson",
    dairy: "Produits laitiers",
    frozen: "Produits surgelés",
    other: "Autre"
};

// Initialisation
document.addEventListener('DOMContentLoaded', function() {
    initApp();
});

function initApp() {
    // Charger les calculs sauvegardés
    loadSavedCalculations();
    
    // Initialiser les écouteurs d'événements
    initEventListeners();
    
    // Initialiser le graphique (vide pour l'instant)
    initChart();
    
    // Vérifier si Chart.js est chargé
    if (typeof Chart === 'undefined') {
        console.error('Chart.js n\'est pas chargé !');
        showChartError();
    }
}

function showChartError() {
    const chartContainer = document.querySelector('.chart-container');
    if (chartContainer) {
        chartContainer.innerHTML = `
            <div style="text-align: center; padding: 2rem; color: #6b7280;">
                <p>⚠️ Le graphique ne peut pas s'afficher</p>
                <p style="font-size: 0.875rem;">Veuillez vérifier votre connexion internet</p>
            </div>
        `;
    }
}

function initEventListeners() {
    // Calcul automatique des surfaces
    const lengthInput = document.getElementById('length');
    const widthInput = document.getElementById('width');
    const heightInput = document.getElementById('height');
    
    if (lengthInput && widthInput && heightInput) {
        lengthInput.addEventListener('input', calculateAreas);
        widthInput.addEventListener('input', calculateAreas);
        heightInput.addEventListener('input', calculateAreas);
    }
    
    // Validation en temps réel
    const inputs = document.querySelectorAll('input[type="number"]');
    inputs.forEach(input => {
        input.addEventListener('blur', function() {
            if (this.value < 0) this.value = 0;
        });
    });
}

function calculateAreas() {
    const length = parseFloat(document.getElementById('length').value) || 0;
    const width = parseFloat(document.getElementById('width').value) || 0;
    const height = parseFloat(document.getElementById('height').value) || 0;
    
    if (length > 0 && width > 0 && height > 0) {
        // Surface des murs (4 murs)
        const wallArea = 2 * (length * height) + 2 * (width * height);
        const wallsAreaInput = document.getElementById('wallsArea');
        if (wallsAreaInput) wallsAreaInput.value = wallArea.toFixed(1);
        
        // Surface du plafond et sol
        const ceilingFloorArea = length * width;
        const ceilingAreaInput = document.getElementById('ceilingArea');
        const floorAreaInput = document.getElementById('floorArea');
        if (ceilingAreaInput) ceilingAreaInput.value = ceilingFloorArea.toFixed(1);
        if (floorAreaInput) floorAreaInput.value = ceilingFloorArea.toFixed(1);
        
        // Surface de la porte (estimation basée sur les dimensions)
        const doorArea = Math.min(2.0, Math.min(length, width) * 2).toFixed(1);
        const doorAreaInput = document.getElementById('doorArea');
        if (doorAreaInput) doorAreaInput.value = doorArea;
    }
}

// Gestion du wizard
function startNewCalculation() {
    // Réinitialiser les données
    AppState.calculationData = {
        id: Date.now().toString(),
        date: new Date().toLocaleDateString('fr-FR'),
        name: 'Nouveau calcul',
        stepData: {}
    };
    
    // Réinitialiser les formulaires
    document.getElementById('projectName').value = '';
    document.getElementById('length').value = '';
    document.getElementById('width').value = '';
    document.getElementById('height').value = '';
    document.getElementById('interiorTemp').value = '4';
    document.getElementById('exteriorTemp').value = '25';
    
    showPage('wizardPage');
    updateProgress();
    showStep(1);
}

function showPage(pageId) {
    document.querySelectorAll('.page').forEach(page => {
        page.classList.remove('active');
    });
    const pageElement = document.getElementById(pageId);
    if (pageElement) {
        pageElement.classList.add('active');
    }
}

function showStep(step) {
    AppState.currentStep = step;
    
    // Masquer toutes les étapes
    document.querySelectorAll('.step').forEach(stepElement => {
        stepElement.classList.remove('active');
    });
    
    // Afficher l'étape courante
    const currentStepElement = document.getElementById(`step${step}`);
    if (currentStepElement) {
        currentStepElement.classList.add('active');
    }
    
    // Mettre à jour l'affichage
    updateProgress();
    updateNavigationButtons();
}

function updateProgress() {
    const percent = (AppState.currentStep / AppState.totalSteps) * 100;
    
    const currentStepElement = document.getElementById('currentStep');
    const progressPercentElement = document.getElementById('progressPercent');
    const progressFillElement = document.getElementById('progressFill');
    const stepTitleElement = document.getElementById('stepTitle');
    
    if (currentStepElement) currentStepElement.textContent = AppState.currentStep;
    if (progressPercentElement) progressPercentElement.textContent = Math.round(percent);
    if (progressFillElement) progressFillElement.style.width = `${percent}%`;
    
    // Mettre à jour le titre de l'étape
    const stepTitles = [
        '', // index 0
        'Définissez les caractéristiques de base de votre chambre froide',
        'Configurez l\'isolation thermique de chaque paroi',
        'Spécifiez les produits stockés et les charges additionnelles',
        'Vérifiez toutes les informations avant le calcul'
    ];
    
    if (stepTitleElement) {
        stepTitleElement.textContent = stepTitles[AppState.currentStep] || '';
    }
}

function updateNavigationButtons() {
    const btnPrevious = document.getElementById('btnPrevious');
    const btnNext = document.getElementById('btnNext');
    const btnCalculate = document.getElementById('btnCalculate');
    
    if (btnPrevious) {
        btnPrevious.style.display = AppState.currentStep > 1 ? 'flex' : 'none';
    }
    
    if (btnNext) {
        btnNext.style.display = AppState.currentStep < AppState.totalSteps ? 'flex' : 'none';
    }
    
    if (btnCalculate) {
        btnCalculate.style.display = AppState.currentStep === AppState.totalSteps ? 'flex' : 'none';
    }
}

function nextStep() {
    if (AppState.currentStep < AppState.totalSteps) {
        if (validateCurrentStep()) {
            saveCurrentStepData();
            showStep(AppState.currentStep + 1);
            
            // Si c'est la dernière étape, générer le récapitulatif
            if (AppState.currentStep === AppState.totalSteps) {
                generateValidationSummary();
            }
        }
    }
}

function previousStep() {
    if (AppState.currentStep > 1) {
        showStep(AppState.currentStep - 1);
    }
}

function validateCurrentStep() {
    const step = AppState.currentStep;
    
    if (step === 1) {
        const projectName = document.getElementById('projectName').value.trim();
        const length = document.getElementById('length').value;
        const width = document.getElementById('width').value;
        const height = document.getElementById('height').value;
        
        if (!projectName) {
            alert('Veuillez saisir un nom pour votre projet');
            return false;
        }
        
        if (!length || !width || !height || parseFloat(length) <= 0 || parseFloat(width) <= 0 || parseFloat(height) <= 0) {
            alert('Veuillez saisir des dimensions valides pour la chambre froide');
            return false;
        }
    }
    
    if (step === 2) {
        // Validation optionnelle pour l'isolation
        const wallsArea = document.getElementById('wallsArea').value;
        if (wallsArea && parseFloat(wallsArea) <= 0) {
            alert('Veuillez calculer les surfaces en remplissant les dimensions à l\'étape 1');
            return false;
        }
    }
    
    return true;
}

function saveCurrentStepData() {
    const step = AppState.currentStep;
    
    if (!AppState.calculationData.stepData) {
        AppState.calculationData.stepData = {};
    }
    
    try {
        switch(step) {
            case 1:
                AppState.calculationData.stepData.step1 = {
                    projectName: document.getElementById('projectName').value,
                    dimensions: {
                        length: parseFloat(document.getElementById('length').value) || 0,
                        width: parseFloat(document.getElementById('width').value) || 0,
                        height: parseFloat(document.getElementById('height').value) || 0
                    },
                    temperatures: {
                        interior: parseFloat(document.getElementById('interiorTemp').value) || 4,
                        exterior: parseFloat(document.getElementById('exteriorTemp').value) || 25
                    }
                };
                break;
                
            case 2:
                AppState.calculationData.stepData.step2 = {
                    walls: {
                        material: document.getElementById('wallsMaterial').value,
                        area: parseFloat(document.getElementById('wallsArea').value) || 0,
                        thickness: parseFloat(document.getElementById('wallsThickness').value) || 100
                    },
                    ceiling: {
                        material: document.getElementById('ceilingMaterial').value,
                        area: parseFloat(document.getElementById('ceilingArea').value) || 0,
                        thickness: parseFloat(document.getElementById('ceilingThickness').value) || 100
                    },
                    floor: {
                        material: document.getElementById('floorMaterial').value,
                        area: parseFloat(document.getElementById('floorArea').value) || 0,
                        thickness: parseFloat(document.getElementById('floorThickness').value) || 100
                    },
                    door: {
                        material: document.getElementById('doorMaterial').value,
                        area: parseFloat(document.getElementById('doorArea').value) || 0,
                        thickness: parseFloat(document.getElementById('doorThickness').value) || 100
                    }
                };
                break;
                
            case 3:
                AppState.calculationData.stepData.step3 = {
                    product: {
                        type: document.getElementById('productType').value,
                        quantity: parseFloat(document.getElementById('quantity').value) || 0,
                        entryTemp: parseFloat(document.getElementById('entryTemp').value) || 15
                    },
                    openingFrequency: parseFloat(document.getElementById('openingFrequency').value) || 10,
                    personnel: {
                        number: parseFloat(document.getElementById('personnelNumber').value) || 0
                    },
                    lighting: {
                        number: parseFloat(document.getElementById('lightingNumber').value) || 0,
                        power: parseFloat(document.getElementById('lightingPower').value) || 0
                    }
                };
                break;
        }
    } catch (error) {
        console.error('Erreur lors de la sauvegarde des données:', error);
    }
}

function generateValidationSummary() {
    const summary = document.getElementById('validationSummary');
    const data = AppState.calculationData.stepData;
    
    if (!summary || !data) return;
    
    try {
        let html = `
            <div class="validation-grid">
                <!-- Informations générales -->
                <div class="validation-section">
                    <h3>
                        <svg class="icon-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                            <line x1="9" y1="3" x2="9" y2="21"/>
                        </svg>
                        Informations générales
                    </h3>
                    <div class="validation-details">
                        <div class="validation-item">
                            <span>Nom du projet</span>
                            <p>${data.step1?.projectName || 'Non spécifié'}</p>
                        </div>
                        <div class="validation-item">
                            <span>Dimensions (L × l × H)</span>
                            <p>${data.step1?.dimensions?.length || 0} × ${data.step1?.dimensions?.width || 0} × ${data.step1?.dimensions?.height || 0} m</p>
                        </div>
                        <div class="validation-item">
                            <span>Volume</span>
                            <p>${((data.step1?.dimensions?.length || 0) * (data.step1?.dimensions?.width || 0) * (data.step1?.dimensions?.height || 0)).toFixed(1)} m³</p>
                        </div>
                        <div class="validation-item">
                            <span>Températures (int/ext)</span>
                            <p>${data.step1?.temperatures?.interior || 4}°C / ${data.step1?.temperatures?.exterior || 25}°C</p>
                        </div>
                    </div>
                </div>

                <!-- Isolation -->
                <div class="validation-section">
                    <h3>
                        <svg class="icon-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
                        </svg>
                        Isolation thermique
                    </h3>
                    <div class="validation-details">
                        <div class="validation-item">
                            <span>Murs</span>
                            <p>${MATERIAL_NAMES[data.step2?.walls?.material] || 'Non spécifié'}, ${data.step2?.walls?.area || 0} m², ${data.step2?.walls?.thickness || 0} mm</p>
                        </div>
                        <div class="validation-item">
                            <span>Plafond</span>
                            <p>${MATERIAL_NAMES[data.step2?.ceiling?.material] || 'Non spécifié'}, ${data.step2?.ceiling?.area || 0} m², ${data.step2?.ceiling?.thickness || 0} mm</p>
                        </div>
                        <div class="validation-item">
                            <span>Sol</span>
                            <p>${MATERIAL_NAMES[data.step2?.floor?.material] || 'Non spécifié'}, ${data.step2?.floor?.area || 0} m², ${data.step2?.floor?.thickness || 0} mm</p>
                        </div>
                        <div class="validation-item">
                            <span>Porte</span>
                            <p>${MATERIAL_NAMES[data.step2?.door?.material] || 'Non spécifié'}, ${data.step2?.door?.area || 0} m², ${data.step2?.door?.thickness || 0} mm</p>
                        </div>
                    </div>
                </div>

                <!-- Produits et charges -->
                <div class="validation-section">
                    <h3>
                        <svg class="icon-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
                        </svg>
                        Produits et charges
                    </h3>
                    <div class="validation-details">
                        <div class="validation-item">
                            <span>Type de produit</span>
                            <p>${PRODUCT_TYPE_NAMES[data.step3?.product?.type] || 'Non spécifié'}</p>
                        </div>
                        <div class="validation-item">
                            <span>Quantité</span>
                            <p>${data.step3?.product?.quantity || 0} kg</p>
                        </div>
                        <div class="validation-item">
                            <span>Température d'entrée</span>
                            <p>${data.step3?.product?.entryTemp || 15}°C</p>
                        </div>
                        <div class="validation-item">
                            <span>Fréquence d'ouverture</span>
                            <p>${data.step3?.openingFrequency || 10} fois/jour</p>
                        </div>
                        <div class="validation-item">
                            <span>Personnel</span>
                            <p>${data.step3?.personnel?.number || 0} personne(s)</p>
                        </div>
                        <div class="validation-item">
                            <span>Éclairage</span>
                            <p>${data.step3?.lighting?.number || 0} × ${data.step3?.lighting?.power || 0} W</p>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        summary.innerHTML = html;
    } catch (error) {
        console.error('Erreur lors de la génération du récapitulatif:', error);
        summary.innerHTML = '<p style="color: #dc2626; text-align: center;">Erreur lors de la génération du récapitulatif</p>';
    }
}

// Calcul des résultats
function calculateResults() {
    saveCurrentStepData();
    
    if (!AppState.calculationData.stepData) {
        alert('Veuillez compléter toutes les étapes');
        return;
    }
    
    const data = AppState.calculationData.stepData;
    
    // Vérifier les données minimales
    if (!data.step1 || !data.step1.projectName) {
        alert('Veuillez remplir au moins les informations générales');
        return;
    }
    
    try {
        // Effectuer les calculs
        const results = performCalculations(data);
        
        // Sauvegarder les résultats
        AppState.calculationData.results = results;
        AppState.calculationData.name = data.step1.projectName;
        AppState.calculationData.date = new Date().toLocaleDateString('fr-FR');
        
        // Sauvegarder dans le stockage local
        saveCalculation();
        
        // Afficher les résultats
        displayResults(results);
    } catch (error) {
        console.error('Erreur lors du calcul:', error);
        alert('Une erreur est survenue lors du calcul. Veuillez vérifier vos données.');
    }
}

function performCalculations(data) {
    const results = {
        components: {},
        total: 0
    };
    
    // 1. Calcul des déperditions à travers les parois
    results.components.walls = calculateWallLosses(data.step1, data.step2);
    results.components.ceiling = calculateCeilingLosses(data.step1, data.step2);
    results.components.floor = calculateFloorLosses(data.step1, data.step2);
    results.components.door = calculateDoorLosses(data.step1, data.step2);
    
    // 2. Calcul de la charge produit
    results.components.product = calculateProductLoad(data.step1, data.step3);
    
    // 3. Calcul des charges additionnelles
    results.components.opening = calculateOpeningLoad(data.step1, data.step3);
    results.components.personnel = calculatePersonnelLoad(data.step3);
    results.components.lighting = calculateLightingLoad(data.step3);
    
    // Calcul du total (arrondi à 2 décimales)
    results.total = Object.values(results.components).reduce((sum, value) => sum + value, 0);
    results.total = Math.round(results.total * 100) / 100;
    
    return results;
}

function calculateWallLosses(step1, step2) {
    if (!step1 || !step2 || !step2.walls) return 0;
    
    const deltaT = step1.temperatures.exterior - step1.temperatures.interior;
    const lambda = MATERIAL_COEFFICIENTS[step2.walls.material] || 0.035;
    const thickness = step2.walls.thickness / 1000; // Conversion mm en m
    
    if (deltaT <= 0 || thickness <= 0 || step2.walls.area <= 0) return 0;
    
    // Formule: Q = (lambda × A × ΔT) / e
    const power = (lambda * step2.walls.area * deltaT) / thickness / 1000; // Conversion en kW
    return Math.round(power * 100) / 100;
}

function calculateCeilingLosses(step1, step2) {
    if (!step1 || !step2 || !step2.ceiling) return 0;
    
    const deltaT = step1.temperatures.exterior - step1.temperatures.interior;
    const lambda = MATERIAL_COEFFICIENTS[step2.ceiling.material] || 0.035;
    const thickness = step2.ceiling.thickness / 1000;
    
    if (deltaT <= 0 || thickness <= 0 || step2.ceiling.area <= 0) return 0;
    
    const power = (lambda * step2.ceiling.area * deltaT) / thickness / 1000;
    return Math.round(power * 100) / 100;
}

function calculateFloorLosses(step1, step2) {
    if (!step1 || !step2 || !step2.floor) return 0;
    
    // Pour le sol, on considère une différence de température plus faible
    const deltaT = step1.temperatures.exterior - step1.temperatures.interior;
    const lambda = MATERIAL_COEFFICIENTS[step2.floor.material] || 0.035;
    const thickness = step2.floor.thickness / 1000;
    
    if (deltaT <= 0 || thickness <= 0 || step2.floor.area <= 0) return 0;
    
    // Réduction pour le sol (coefficient 0.7)
    const power = (lambda * step2.floor.area * deltaT * 0.7) / thickness / 1000;
    return Math.round(power * 100) / 100;
}

function calculateDoorLosses(step1, step2) {
    if (!step1 || !step2 || !step2.door) return 0;
    
    const deltaT = step1.temperatures.exterior - step1.temperatures.interior;
    const lambda = MATERIAL_COEFFICIENTS[step2.door.material] || 0.035;
    const thickness = step2.door.thickness / 1000;
    
    if (deltaT <= 0 || thickness <= 0 || step2.door.area <= 0) return 0;
    
    const power = (lambda * step2.door.area * deltaT) / thickness / 1000;
    return Math.round(power * 100) / 100;
}

function calculateProductLoad(step1, step3) {
    if (!step1 || !step3 || !step3.product) return 0;
    
    const deltaT = step3.product.entryTemp - step1.temperatures.interior;
    const specificHeat = PRODUCT_SPECIFIC_HEAT[step3.product.type] || 3.5;
    
    if (deltaT <= 0 || step3.product.quantity <= 0) return 0;
    
    // Formule: Q = m × Cp × ΔT / temps de refroidissement (24h)
    // Conversion: 1 kJ = 0.0002778 kWh
    const power = (step3.product.quantity * specificHeat * deltaT * 0.0002778) / 24 * 1000; // en kW
    return Math.round(power * 100) / 100;
}

function calculateOpeningLoad(step1, step3) {
    if (!step1 || !step3) return 0;
    
    const volume = step1.dimensions.length * step1.dimensions.width * step1.dimensions.height;
    const deltaT = step1.temperatures.exterior - step1.temperatures.interior;
    
    if (volume <= 0 || deltaT <= 0) return 0;
    
    // Estimation basée sur la fréquence d'ouverture
    // 1.2: coefficient pour les infiltrations d'air
    const power = (step3.openingFrequency * volume * deltaT * 1.2 * 0.0002778) / 24;
    return Math.round(power * 100) / 100;
}

function calculatePersonnelLoad(step3) {
    if (!step3 || !step3.personnel) return 0;
    
    // Chaque personne génère environ 200 W de chaleur
    const power = (step3.personnel.number * 200 * 0.25) / 1000; // 25% du temps, en kW
    return Math.round(power * 100) / 100;
}

function calculateLightingLoad(step3) {
    if (!step3 || !step3.lighting) return 0;
    
    const totalPower = step3.lighting.number * step3.lighting.power;
    const power = (totalPower * 0.25) / 1000; // 25% du temps allumé, en kW
    return Math.round(power * 100) / 100;
}

// Affichage des résultats
function displayResults(results) {
    showPage('resultsPage');
    
    // Afficher le nom du projet
    const projectNameDisplay = document.getElementById('projectNameDisplay');
    if (projectNameDisplay) {
        projectNameDisplay.textContent = AppState.calculationData.name || 'Sans nom';
    }
    
    // Afficher la puissance totale
    const totalPowerElement = document.getElementById('totalPower');
    if (totalPowerElement) {
        totalPowerElement.textContent = results.total.toFixed(2) + ' kW';
    }
    
    // Mettre à jour le tableau
    updateResultsTable(results);
    
    // Mettre à jour les détails du projet
    updateProjectDetails();
    
    // Mettre à jour le graphique
    updateChart(results);
}

function updateResultsTable(results) {
    const tbody = document.querySelector('#resultsTable tbody');
    if (!tbody) return;
    
    let html = '';
    
    const components = [
        { name: 'Déperditions murs', value: results.components.walls, color: '#ef4444' },
        { name: 'Déperditions plafond', value: results.components.ceiling, color: '#f59e0b' },
        { name: 'Déperditions sol', value: results.components.floor, color: '#10b981' },
        { name: 'Déperditions porte', value: results.components.door, color: '#3b82f6' },
        { name: 'Charge produit', value: results.components.product, color: '#8b5cf6' },
        { name: 'Charges ouverture', value: results.components.opening, color: '#ec4899' },
        { name: 'Charges personnel', value: results.components.personnel, color: '#6366f1' },
        { name: 'Charges éclairage', value: results.components.lighting, color: '#14b8a6' }
    ];
    
    components.forEach(component => {
        if (component.value > 0) {
            html += `
                <tr>
                    <td>
                        <div class="load-indicator">
                            <div class="color-dot" style="background-color: ${component.color}"></div>
                            ${component.name}
                        </div>
                    </td>
                    <td class="text-right">${component.value.toFixed(2)}</td>
                </tr>
            `;
        }
    });
    
    // Ligne du total
    html += `
        <tr>
            <td><strong>Puissance totale nécessaire</strong></td>
            <td class="text-right"><strong>${results.total.toFixed(2)} kW</strong></td>
        </tr>
    `;
    
    tbody.innerHTML = html;
}

function updateProjectDetails() {
    const data = AppState.calculationData.stepData;
    const details = document.getElementById('projectDetails');
    
    if (!details || !data) return;
    
    try {
        let html = '';
        
        // Section dimensions
        html += `
            <div class="detail-section">
                <h4>Dimensions</h4>
                <p>Longueur: ${data.step1?.dimensions?.length || 0} m</p>
                <p>Largeur: ${data.step1?.dimensions?.width || 0} m</p>
                <p>Hauteur: ${data.step1?.dimensions?.height || 0} m</p>
                <p>Volume: ${((data.step1?.dimensions?.length || 0) * (data.step1?.dimensions?.width || 0) * (data.step1?.dimensions?.height || 0)).toFixed(1)} m³</p>
            </div>
        `;
        
        // Section températures
        html += `
            <div class="detail-section">
                <h4>Températures</h4>
                <p>Intérieure: ${data.step1?.temperatures?.interior || 4}°C</p>
                <p>Extérieure: ${data.step1?.temperatures?.exterior || 25}°C</p>
                <p>Écart: ${((data.step1?.temperatures?.exterior || 25) - (data.step1?.temperatures?.interior || 4)).toFixed(1)}°C</p>
            </div>
        `;
        
        // Section produits
        html += `
            <div class="detail-section">
                <h4>Produits</h4>
                <p>Type: ${PRODUCT_TYPE_NAMES[data.step3?.product?.type] || 'Non spécifié'}</p>
                <p>Quantité: ${data.step3?.product?.quantity || 0} kg</p>
                <p>Temp. entrée: ${data.step3?.product?.entryTemp || 15}°C</p>
                <p>Fréquence ouverture: ${data.step3?.openingFrequency || 10}/jour</p>
            </div>
        `;
        
        details.innerHTML = html;
    } catch (error) {
        console.error('Erreur lors de la mise à jour des détails:', error);
        details.innerHTML = '<p style="color: #dc2626; text-align: center;">Erreur lors du chargement des détails</p>';
    }
}

// Graphique
let pieChart = null;

function initChart() {
    const ctx = document.getElementById('pieChart');
    if (!ctx) return;
    
    try {
        pieChart = new Chart(ctx.getContext('2d'), {
            type: 'pie',
            data: {
                labels: [],
                datasets: [{
                    data: [],
                    backgroundColor: [
                        '#ef4444', '#f59e0b', '#10b981', '#3b82f6',
                        '#8b5cf6', '#ec4899', '#6366f1', '#14b8a6'
                    ],
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: window.innerWidth < 768 ? 'bottom' : 'right',
                        labels: {
                            boxWidth: 12,
                            padding: 15,
                            font: {
                                size: window.innerWidth < 768 ? 11 : 12
                            }
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const label = context.label || '';
                                const value = context.raw || 0;
                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                const percentage = total > 0 ? Math.round((value / total) * 100) : 0;
                                return `${label}: ${value.toFixed(2)} kW (${percentage}%)`;
                            }
                        }
                    }
                }
            }
        });
    } catch (error) {
        console.error('Erreur lors de l\'initialisation du graphique:', error);
        showChartError();
    }
}

function updateChart(results) {
    if (!pieChart) return;
    
    try {
        const labels = [];
        const data = [];
        const colors = [];
        
        const components = [
            { name: 'Murs', value: results.components.walls, color: '#ef4444' },
            { name: 'Plafond', value: results.components.ceiling, color: '#f59e0b' },
            { name: 'Sol', value: results.components.floor, color: '#10b981' },
            { name: 'Porte', value: results.components.door, color: '#3b82f6' },
            { name: 'Produit', value: results.components.product, color: '#8b5cf6' },
            { name: 'Ouverture', value: results.components.opening, color: '#ec4899' },
            { name: 'Personnel', value: results.components.personnel, color: '#6366f1' },
            { name: 'Éclairage', value: results.components.lighting, color: '#14b8a6' }
        ];
        
        components.forEach(component => {
            if (component.value > 0) {
                labels.push(component.name);
                data.push(component.value);
                colors.push(component.color);
            }
        });
        
        // Si aucune donnée, afficher un message
        if (data.length === 0) {
            pieChart.data.labels = ['Aucune donnée'];
            pieChart.data.datasets[0].data = [1];
            pieChart.data.datasets[0].backgroundColor = ['#e5e7eb'];
        } else {
            pieChart.data.labels = labels;
            pieChart.data.datasets[0].data = data;
            pieChart.data.datasets[0].backgroundColor = colors;
        }
        
        pieChart.update();
    } catch (error) {
        console.error('Erreur lors de la mise à jour du graphique:', error);
    }
}

// Gestion des sauvegardes
function saveCalculation() {
    try {
        // Récupérer les calculs existants
        let saved = JSON.parse(localStorage.getItem('difri_calculations') || '[]');
        
        // Vérifier si ce calcul existe déjà
        const existingIndex = saved.findIndex(c => c.id === AppState.calculationData.id);
        if (existingIndex >= 0) {
            // Mettre à jour le calcul existant
            saved[existingIndex] = AppState.calculationData;
        } else {
            // Ajouter le nouveau calcul
            saved.push(AppState.calculationData);
        }
        
        // Limiter à 10 calculs
        if (saved.length > 10) {
            saved = saved.slice(-10);
        }
        
        // Sauvegarder
        localStorage.setItem('difri_calculations', JSON.stringify(saved));
        
        // Mettre à jour l'affichage
        loadSavedCalculations();
    } catch (error) {
        console.error('Erreur lors de la sauvegarde:', error);
    }
}

function loadSavedCalculations() {
    try {
        const saved = JSON.parse(localStorage.getItem('difri_calculations') || '[]');
        AppState.savedCalculations = saved;
        
        const container = document.getElementById('savedCalculations');
        if (!container) return;
        
        if (saved.length === 0) {
            container.innerHTML = '<p style="text-align: center; color: #6b7280; padding: 1rem;">Aucun calcul sauvegardé</p>';
            return;
        }
        
        let html = '<h3 style="margin-bottom: 1rem; color: #374151; font-size: 1.125rem;">Calculs sauvegardés</h3>';
        
        saved.reverse().forEach(calc => {
            html += `
                <div class="saved-item">
                    <div class="saved-item-info">
                        <h3>${calc.name || 'Sans nom'}</h3>
                        <p>Créé le ${calc.date || 'Date inconnue'} - Puissance: ${calc.results?.total?.toFixed(2) || '0.00'} kW</p>
                    </div>
                    <div class="saved-item-actions">
                        <button onclick="loadCalculation('${calc.id}')" title="Charger">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                                <polyline points="7 10 12 15 17 10"/>
                                <line x1="12" y1="15" x2="12" y2="3"/>
                            </svg>
                        </button>
                        <button onclick="deleteCalculation('${calc.id}')" title="Supprimer">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                            </svg>
                        </button>
                    </div>
                </div>
            `;
        });
        
        container.innerHTML = html;
    } catch (error) {
        console.error('Erreur lors du chargement des calculs:', error);
    }
}

function loadCalculation(id) {
    try {
        const saved = JSON.parse(localStorage.getItem('difri_calculations') || '[]');
        const calc = saved.find(c => c.id === id);
        
        if (calc) {
            AppState.calculationData = calc;
            
            // Remplir les formulaires avec les données sauvegardées
            if (calc.stepData?.step1) {
                const s1 = calc.stepData.step1;
                document.getElementById('projectName').value = s1.projectName || '';
                document.getElementById('length').value = s1.dimensions?.length || '';
                document.getElementById('width').value = s1.dimensions?.width || '';
                document.getElementById('height').value = s1.dimensions?.height || '';
                document.getElementById('interiorTemp').value = s1.temperatures?.interior || '4';
                document.getElementById('exteriorTemp').value = s1.temperatures?.exterior || '25';
                
                // Calculer les surfaces
                calculateAreas();
            }
            
            if (calc.stepData?.step2) {
                const s2 = calc.stepData.step2;
                document.getElementById('wallsMaterial').value = s2.walls?.material || 'polyurethane';
                document.getElementById('wallsThickness').value = s2.walls?.thickness || '100';
                document.getElementById('ceilingMaterial').value = s2.ceiling?.material || 'polyurethane';
                document.getElementById('ceilingThickness').value = s2.ceiling?.thickness || '100';
                document.getElementById('floorMaterial').value = s2.floor?.material || 'polyurethane';
                document.getElementById('floorThickness').value = s2.floor?.thickness || '100';
                document.getElementById('doorMaterial').value = s2.door?.material || 'polyurethane';
                document.getElementById('doorThickness').value = s2.door?.thickness || '100';
                
                // Mettre à jour les surfaces si elles existent
                if (s2.walls?.area) document.getElementById('wallsArea').value = s2.walls.area;
                if (s2.ceiling?.area) document.getElementById('ceilingArea').value = s2.ceiling.area;
                if (s2.floor?.area) document.getElementById('floorArea').value = s2.floor.area;
                if (s2.door?.area) document.getElementById('doorArea').value = s2.door.area;
            }
            
            if (calc.stepData?.step3) {
                const s3 = calc.stepData.step3;
                document.getElementById('productType').value = s3.product?.type || 'fruits';
                document.getElementById('quantity').value = s3.product?.quantity || '';
                document.getElementById('entryTemp').value = s3.product?.entryTemp || '15';
                document.getElementById('openingFrequency').value = s3.openingFrequency || '10';
                document.getElementById('personnelNumber').value = s3.personnel?.number || '0';
                document.getElementById('lightingNumber').value = s3.lighting?.number || '0';
                document.getElementById('lightingPower').value = s3.lighting?.power || '0';
            }
            
            // Aller à la première étape
            showPage('wizardPage');
            showStep(1);
            
            // Si on a des résultats, on peut directement les afficher
            if (calc.results) {
                displayResults(calc.results);
            }
        }
    } catch (error) {
        console.error('Erreur lors du chargement du calcul:', error);
        alert('Erreur lors du chargement du calcul');
    }
}

function deleteCalculation(id) {
    if (confirm('Voulez-vous vraiment supprimer ce calcul ? Cette action est irréversible.')) {
        try {
            let saved = JSON.parse(localStorage.getItem('difri_calculations') || '[]');
            saved = saved.filter(c => c.id !== id);
            localStorage.setItem('difri_calculations', JSON.stringify(saved));
            loadSavedCalculations();
            
            // Si on supprime le calcul courant, revenir à l'accueil
            if (AppState.calculationData.id === id) {
                goHome();
            }
        } catch (error) {
            console.error('Erreur lors de la suppression:', error);
            alert('Erreur lors de la suppression du calcul');
        }
    }
}

function goHome() {
    showPage('homePage');
}

// Gestion de l'impression
window.addEventListener('beforeprint', function() {
    // Ajuster les styles pour l'impression
    const chartContainer = document.querySelector('.chart-container');
    if (chartContainer && pieChart) {
        pieChart.resize();
    }
});

// Redimensionnement responsive
window.addEventListener('resize', function() {
    if (pieChart) {
        pieChart.resize();
    }
});

// Export pour utilisation globale
window.startNewCalculation = startNewCalculation;
window.nextStep = nextStep;
window.previousStep = previousStep;
window.calculateResults = calculateResults;
window.goHome = goHome;
window.loadCalculation = loadCalculation;
window.deleteCalculation = deleteCalculation;

// Message de bienvenue
console.log('DiFRI - Dimensionnement Frigorifique chargé avec succès !');