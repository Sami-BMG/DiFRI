// DiFRI - Dimensionnement Frigorifique Professionnel
// Version 2.0 - Avec tous les amendements appliqués

// ===== CONFIGURATION ET DONNÉES =====
const AppState = {
    currentStep: 1,
    totalSteps: 4,
    calculationData: {},
    savedCalculations: [],
    chartInstance: null
};

// Données par défaut des produits
const PRODUCT_DEFAULTS = {
    fruits: { 
        name: "Fruits frais",
        cpAbove: 3.77, 
        cpBelow: 1.9, 
        latent: 250, 
        freezing: 0 
    },
    vegetables: { 
        name: "Légumes",
        cpAbove: 3.94, 
        cpBelow: 1.9, 
        latent: 250, 
        freezing: 0 
    },
    meat: { 
        name: "Viande",
        cpAbove: 3.14, 
        cpBelow: 1.8, 
        latent: 250, 
        freezing: -2 
    },
    fish: { 
        name: "Poisson",
        cpAbove: 3.98, 
        cpBelow: 2.0, 
        latent: 250, 
        freezing: -1 
    },
    dairy: { 
        name: "Produits laitiers",
        cpAbove: 3.93, 
        cpBelow: 2.0, 
        latent: 250, 
        freezing: 0 
    },
    frozen: { 
        name: "Produits surgelés",
        cpAbove: 2.00, 
        cpBelow: 1.8, 
        latent: 250, 
        freezing: -18 
    },
    other: { 
        name: "Autre",
        cpAbove: 3.50, 
        cpBelow: 1.9, 
        latent: 250, 
        freezing: 0 
    }
};

// Couleurs pour le graphique
const CHART_COLORS = {
    product: '#10b981',      // Vert
    walls: '#3b82f6',        // Bleu
    ceiling: '#60a5fa',      // Bleu clair
    personnel: '#f59e0b',    // Orange
    lighting: '#eab308',     // Jaune
    glazing: '#ef4444'       // Rouge
};

// ===== INITIALISATION =====
document.addEventListener('DOMContentLoaded', function() {
    console.log('DiFRI - Initialisation...');
    initApp();
});

function initApp() {
    try {
        // Initialiser les écouteurs d'événements
        initEventListeners();
        
        // Charger les calculs sauvegardés
        loadSavedCalculations();
        
        // Initialiser le graphique
        initChart();
        
        // Mettre à jour les valeurs par défaut
        updateProductDefaults();
        
        // Calculer les surfaces initiales
        calculateAreas();
        
        // Calculer Kt initial
        updateKtValue();
        
        console.log('DiFRI - Prêt à fonctionner !');
        
    } catch (error) {
        console.error('Erreur lors de l\'initialisation:', error);
        showNotification('Erreur d\'initialisation', 'danger');
    }
}

function initEventListeners() {
    // Calcul automatique des surfaces
    const dimInputs = ['length', 'width', 'height'];
    dimInputs.forEach(id => {
        const input = document.getElementById(id);
        if (input) {
            input.addEventListener('input', () => {
                calculateAreas();
                updateKtValue();
            });
        }
    });
    
    // Mise à jour des valeurs par défaut des produits
    const productTypeSelect = document.getElementById('productType');
    if (productTypeSelect) {
        productTypeSelect.addEventListener('change', updateProductDefaults);
    }
    
    // Gestion du vitrage
    const glazingTypeSelect = document.getElementById('glazingType');
    if (glazingTypeSelect) {
        glazingTypeSelect.addEventListener('change', function() {
            const areaInput = document.getElementById('glazingArea');
            const uInput = document.getElementById('glazingU');
            
            if (this.value === 'none') {
                areaInput.disabled = true;
                uInput.disabled = true;
                areaInput.value = '0';
            } else {
                areaInput.disabled = false;
                uInput.disabled = false;
            }
        });
    }
    
    // Mise à jour de Kt lorsque les coefficients changent
    const kInputs = ['k1', 'k2', 'k3', 'k4', 'k5', 'k6'];
    kInputs.forEach(id => {
        const input = document.getElementById(id);
        if (input) {
            input.addEventListener('input', updateKtValue);
        }
    });
    
    // Prévisualisation des calculs produit
    const productInputs = ['quantity', 'entryTemp', 'freezingPoint', 'cpAbove', 'cpBelow', 'latentHeat'];
    productInputs.forEach(id => {
        const input = document.getElementById(id);
        if (input) {
            input.addEventListener('input', previewProductPower);
        }
    });
}

// ===== CALCULS AUTOMATIQUES =====
function calculateAreas() {
    try {
        const length = parseFloat(document.getElementById('length').value) || 0;
        const width = parseFloat(document.getElementById('width').value) || 0;
        const height = parseFloat(document.getElementById('height').value) || 0;
        
        if (length > 0 && width > 0 && height > 0) {
            // Surface des murs (4 murs)
            const wallArea = 2 * (length * height) + 2 * (width * height);
            const wallsInput = document.getElementById('wallsSurface');
            if (wallsInput) wallsInput.value = wallArea.toFixed(1);
            
            // Surface du plafond
            const ceilingArea = length * width;
            const ceilingInput = document.getElementById('ceilingSurface');
            if (ceilingInput) ceilingInput.value = ceilingArea.toFixed(1);
        }
    } catch (error) {
        console.error('Erreur dans calculateAreas:', error);
    }
}

function updateKtValue() {
    try {
        const k1 = parseFloat(document.getElementById('k1').value) || 0;
        const k2 = parseFloat(document.getElementById('k2').value) || 0;
        const k3 = parseFloat(document.getElementById('k3').value) || 0;
        const k4 = parseFloat(document.getElementById('k4').value) || 0;
        const k5 = parseFloat(document.getElementById('k5').value) || 0;
        const k6 = parseFloat(document.getElementById('k6').value) || 0;
        
        const kt = k1 + k2 + k3 + k4 + k5 + k6;
        document.getElementById('ktValue').textContent = kt.toFixed(2);
    } catch (error) {
        console.error('Erreur dans updateKtValue:', error);
    }
}

function updateProductDefaults() {
    try {
        const productType = document.getElementById('productType').value;
        const defaults = PRODUCT_DEFAULTS[productType] || PRODUCT_DEFAULTS.other;
        
        document.getElementById('freezingPoint').value = defaults.freezing;
        document.getElementById('cpAbove').value = defaults.cpAbove;
        document.getElementById('cpBelow').value = defaults.cpBelow;
        document.getElementById('latentHeat').value = defaults.latent;
        
        // Prévisualiser la puissance produit
        previewProductPower();
    } catch (error) {
        console.error('Erreur dans updateProductDefaults:', error);
    }
}

function previewProductPower() {
    try {
        const quantity = parseFloat(document.getElementById('quantity').value) || 0;
        const entryTemp = parseFloat(document.getElementById('entryTemp').value) || 15;
        const interiorTemp = parseFloat(document.getElementById('interiorTemp').value) || 4;
        const freezingPoint = parseFloat(document.getElementById('freezingPoint').value) || 0;
        const cpAbove = parseFloat(document.getElementById('cpAbove').value) || 3.8;
        const cpBelow = parseFloat(document.getElementById('cpBelow').value) || 1.9;
        const latentHeat = parseFloat(document.getElementById('latentHeat').value) || 250;
        
        if (quantity <= 0) {
            document.getElementById('productPowerPreview').textContent = '0.00 kW';
            return;
        }
        
        // Calcul de la charge produit
        const productLoad = calculateProductLoadDetailed(
            quantity, entryTemp, interiorTemp, freezingPoint, 
            cpAbove, cpBelow, latentHeat
        );
        
        document.getElementById('productPowerPreview').textContent = 
            productLoad.toFixed(2) + ' kW';
    } catch (error) {
        console.error('Erreur dans previewProductPower:', error);
    }
}

// ===== GESTION DU WIZARD =====
function startNewCalculation() {
    console.log('Démarrage nouveau calcul...');
    
    // Réinitialiser les données
    AppState.calculationData = {
        id: Date.now().toString(),
        date: new Date().toLocaleDateString('fr-FR'),
        time: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
        name: 'Nouveau calcul',
        stepData: {}
    };
    
    // Réinitialiser les formulaires avec valeurs par défaut
    document.getElementById('projectName').value = '';
    document.getElementById('length').value = '5.0';
    document.getElementById('width').value = '3.0';
    document.getElementById('height').value = '2.5';
    document.getElementById('interiorTemp').value = '4';
    document.getElementById('exteriorTemp').value = '25';
    
    // Réinitialiser étape 3
    document.getElementById('quantity').value = '100';
    document.getElementById('entryTemp').value = '15';
    document.getElementById('personnelNumber').value = '1';
    document.getElementById('lightingPower').value = '100';
    
    // Calculer surfaces et Kt
    calculateAreas();
    updateKtValue();
    updateProductDefaults();
    
    // Afficher la page wizard
    showPage('wizardPage');
    showStep(1);
}

function showPage(pageId) {
    // Masquer toutes les pages
    document.querySelectorAll('.page').forEach(page => {
        page.classList.remove('active');
    });
    
    // Afficher la page demandée
    const pageElement = document.getElementById(pageId);
    if (pageElement) {
        pageElement.classList.add('active');
        window.scrollTo(0, 0);
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
    
    // Si étape 4, générer le récapitulatif
    if (step === 4) {
        generateValidationSummary();
        previewCalculation();
    }
}

function updateProgress() {
    const percent = (AppState.currentStep / AppState.totalSteps) * 100;
    
    // Mettre à jour les indicateurs
    document.getElementById('currentStep').textContent = AppState.currentStep;
    document.getElementById('currentStepDisplay').textContent = AppState.currentStep;
    document.getElementById('progressPercent').textContent = Math.round(percent);
    document.getElementById('progressFill').style.width = `${percent}%`;
    
    // Mettre à jour le titre de l'étape
    const stepTitles = [
        '', // index 0
        'Définissez les caractéristiques de base de votre chambre froide',
        'Configurez les coefficients thermiques des parois',
        'Spécifiez les produits et les charges internes',
        'Vérifiez et validez votre dimensionnement'
    ];
    
    const stepTitleElement = document.getElementById('stepTitle');
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
        }
    }
}

function previousStep() {
    if (AppState.currentStep > 1) {
        saveCurrentStepData();
        showStep(AppState.currentStep - 1);
    }
}

function validateCurrentStep() {
    const step = AppState.currentStep;
    
    if (step === 1) {
        const projectName = document.getElementById('projectName').value.trim();
        const length = parseFloat(document.getElementById('length').value) || 0;
        
        if (!projectName) {
            showNotification('Veuillez saisir un nom pour votre projet', 'warning');
            return false;
        }
        
        if (length <= 0) {
            showNotification('Veuillez saisir des dimensions valides', 'warning');
            return false;
        }
    }
    
    if (step === 2) {
        const wallsSurface = parseFloat(document.getElementById('wallsSurface').value) || 0;
        if (wallsSurface <= 0) {
            showNotification('Veuillez calculer les surfaces en remplissant les dimensions', 'warning');
            return false;
        }
    }
    
    if (step === 3) {
        const quantity = parseFloat(document.getElementById('quantity').value) || 0;
        if (quantity < 0) {
            showNotification('La quantité de produit ne peut pas être négative', 'warning');
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
                    coefficients: {
                        k1: parseFloat(document.getElementById('k1').value) || 0.45,
                        k2: parseFloat(document.getElementById('k2').value) || 0.23,
                        k3: parseFloat(document.getElementById('k3').value) || 0.12,
                        k4: parseFloat(document.getElementById('k4').value) || 0.16,
                        k5: parseFloat(document.getElementById('k5').value) || 0.04,
                        k6: parseFloat(document.getElementById('k6').value) || 0.05
                    },
                    surfaces: {
                        walls: parseFloat(document.getElementById('wallsSurface').value) || 0,
                        ceiling: parseFloat(document.getElementById('ceilingSurface').value) || 0
                    },
                    glazing: {
                        type: document.getElementById('glazingType').value,
                        area: parseFloat(document.getElementById('glazingArea').value) || 0,
                        uValue: parseFloat(document.getElementById('glazingU').value) || 5.7
                    }
                };
                break;
                
            case 3:
                AppState.calculationData.stepData.step3 = {
                    product: {
                        type: document.getElementById('productType').value,
                        typeName: PRODUCT_DEFAULTS[document.getElementById('productType').value]?.name || 'Autre',
                        quantity: parseFloat(document.getElementById('quantity').value) || 0,
                        entryTemp: parseFloat(document.getElementById('entryTemp').value) || 15,
                        freezingPoint: parseFloat(document.getElementById('freezingPoint').value) || 0,
                        cpAbove: parseFloat(document.getElementById('cpAbove').value) || 3.8,
                        cpBelow: parseFloat(document.getElementById('cpBelow').value) || 1.9,
                        latentHeat: parseFloat(document.getElementById('latentHeat').value) || 250
                    },
                    personnel: {
                        number: parseFloat(document.getElementById('personnelNumber').value) || 0
                    },
                    lighting: {
                        power: parseFloat(document.getElementById('lightingPower').value) || 0
                    }
                };
                break;
        }
    } catch (error) {
        console.error('Erreur saveCurrentStepData:', error);
    }
}

function generateValidationSummary() {
    const summary = document.getElementById('validationSummary');
    const data = AppState.calculationData.stepData;
    
    if (!summary || !data) return;
    
    try {
        // Calculer Kt
        const kt = (data.step2?.coefficients?.k1 || 0) +
                  (data.step2?.coefficients?.k2 || 0) +
                  (data.step2?.coefficients?.k3 || 0) +
                  (data.step2?.coefficients?.k4 || 0) +
                  (data.step2?.coefficients?.k5 || 0) +
                  (data.step2?.coefficients?.k6 || 0);
        
        // Calculer le volume
        const volume = (data.step1?.dimensions?.length || 0) * 
                      (data.step1?.dimensions?.width || 0) * 
                      (data.step1?.dimensions?.height || 0);
        
        let html = `
            <div class="validation-grid">
                <div class="validation-section">
                    <h3><i class="fas fa-info-circle"></i> Informations générales</h3>
                    <div class="validation-details">
                        <div class="validation-item">
                            <span>Nom du projet</span>
                            <p>${data.step1?.projectName || 'Non spécifié'}</p>
                        </div>
                        <div class="validation-item">
                            <span>Dimensions</span>
                            <p>${data.step1?.dimensions?.length || 0} × ${data.step1?.dimensions?.width || 0} × ${data.step1?.dimensions?.height || 0} m</p>
                        </div>
                        <div class="validation-item">
                            <span>Volume</span>
                            <p>${volume.toFixed(1)} m³</p>
                        </div>
                        <div class="validation-item">
                            <span>Températures</span>
                            <p>Int: ${data.step1?.temperatures?.interior || 4}°C / Ext: ${data.step1?.temperatures?.exterior || 25}°C</p>
                        </div>
                    </div>
                </div>
                
                <div class="validation-section">
                    <h3><i class="fas fa-thermometer-half"></i> Caractéristiques thermiques</h3>
                    <div class="validation-details">
                        <div class="validation-item">
                            <span>Kt total</span>
                            <p>${kt.toFixed(2)} W/m².K</p>
                        </div>
                        <div class="validation-item">
                            <span>Surfaces</span>
                            <p>Parois: ${data.step2?.surfaces?.walls || 0} m² / Plafond: ${data.step2?.surfaces?.ceiling || 0} m²</p>
                        </div>
                        <div class="validation-item">
                            <span>Vitrage</span>
                            <p>${data.step2?.glazing?.type === 'none' ? 'Aucun' : 'Simple vitrage'} (${data.step2?.glazing?.area || 0} m²)</p>
                        </div>
                    </div>
                </div>
                
                <div class="validation-section">
                    <h3><i class="fas fa-box-open"></i> Produits et charges</h3>
                    <div class="validation-details">
                        <div class="validation-item">
                            <span>Produit</span>
                            <p>${data.step3?.product?.typeName || 'Autre'} (${data.step3?.product?.quantity || 0} kg)</p>
                        </div>
                        <div class="validation-item">
                            <span>Températures produit</span>
                            <p>Entrée: ${data.step3?.product?.entryTemp || 15}°C / Congélation: ${data.step3?.product?.freezingPoint || 0}°C</p>
                        </div>
                        <div class="validation-item">
                            <span>Charges internes</span>
                            <p>Personnel: ${data.step3?.personnel?.number || 0} pers / Éclairage: ${data.step3?.lighting?.power || 0} W</p>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        summary.innerHTML = html;
    } catch (error) {
        console.error('Erreur generateValidationSummary:', error);
        summary.innerHTML = '<p class="text-danger">Erreur lors de la génération du récapitulatif</p>';
    }
}

// ===== CALCULS PROFESSIONNELS =====
function previewCalculation() {
    try {
        showLoading(true);
        
        // Sauvegarder les données actuelles
        saveCurrentStepData();
        
        const data = AppState.calculationData.stepData;
        if (!data.step1 || !data.step2 || !data.step3) {
            showNotification('Données incomplètes', 'warning');
            return;
        }
        
        // Effectuer les calculs
        const results = performCalculations(data);
        
        // Afficher la prévisualisation
        document.getElementById('powerPreview').textContent = 
            results.total.toFixed(2) + ' kW';
        
        // Mettre à jour l'estimation produit
        const productLoad = calculateProductLoadDetailed(
            data.step3.product.quantity,
            data.step3.product.entryTemp,
            data.step1.temperatures.interior,
            data.step3.product.freezingPoint,
            data.step3.product.cpAbove,
            data.step3.product.cpBelow,
            data.step3.product.latentHeat
        );
        
        document.getElementById('productPowerPreview').textContent = 
            productLoad.toFixed(2) + ' kW';
            
    } catch (error) {
        console.error('Erreur previewCalculation:', error);
        showNotification('Erreur de prévisualisation', 'danger');
    } finally {
        showLoading(false);
    }
}

function calculateResults() {
    try {
        showLoading(true);
        
        // Valider les données
        if (!validateCurrentStep()) {
            showLoading(false);
            return;
        }
        
        // Sauvegarder les données
        saveCurrentStepData();
        
        const data = AppState.calculationData.stepData;
        
        if (!data.step1 || !data.step1.projectName) {
            showNotification('Veuillez compléter les informations générales', 'warning');
            showLoading(false);
            return;
        }
        
        // Effectuer les calculs
        const results = performCalculations(data);
        
        // Sauvegarder les résultats
        AppState.calculationData.results = results;
        AppState.calculationData.name = data.step1.projectName;
        AppState.calculationData.date = new Date().toLocaleDateString('fr-FR');
        AppState.calculationData.time = new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
        
        // Sauvegarder dans le stockage local
        saveCalculation();
        
        // Afficher les résultats
        displayResults(results);
        
        showNotification('Calcul terminé avec succès !', 'success');
        
    } catch (error) {
        console.error('Erreur calculateResults:', error);
        showNotification('Erreur lors du calcul: ' + error.message, 'danger');
    } finally {
        showLoading(false);
    }
}

function performCalculations(data) {
    const results = {
        components: {},
        total: 0,
        details: {}
    };
    
    // Extraire les données
    const step1 = data.step1;
    const step2 = data.step2;
    const step3 = data.step3;
    
    // ΔT pour tous les calculs
    const deltaT = step1.temperatures.exterior - step1.temperatures.interior;
    
    // 1. CALCUL DES DÉPERDITIONS PAROIS (Formule 24 × S × Kt × ΔT)
    const kt = step2.coefficients.k1 + step2.coefficients.k2 + step2.coefficients.k3 + 
               step2.coefficients.k4 + step2.coefficients.k5 + step2.coefficients.k6;
    
    // Parois
    results.components.walls = calculateWallLosses(
        step2.surfaces.walls, kt, deltaT
    );
    
    // Plafond
    results.components.ceiling = calculateCeilingLosses(
        step2.surfaces.ceiling, kt, deltaT
    );
    
    // 2. CALCUL CHARGE PRODUIT (avec gestion congélation)
    results.components.product = calculateProductLoadDetailed(
        step3.product.quantity,
        step3.product.entryTemp,
        step1.temperatures.interior,
        step3.product.freezingPoint,
        step3.product.cpAbove,
        step3.product.cpBelow,
        step3.product.latentHeat
    );
    
    // 3. CALCUL CHARGES INTERNES
    // Personnel : 116 W/personne
    results.components.personnel = calculatePersonnelLoad(step3.personnel.number);
    
    // Éclairage : puissance totale en kW
    results.components.lighting = calculateLightingLoad(step3.lighting.power);
    
    // 4. CALCUL VITRAGE (si présent)
    results.components.glazing = calculateGlazingLoad(
        step2.glazing.area,
        step2.glazing.uValue,
        deltaT
    );
    
    // Calcul du total
    results.total = Object.values(results.components).reduce((sum, value) => sum + value, 0);
    results.total = Math.round(results.total * 100) / 100;
    
    // Ajouter des détails
    results.details = {
        kt: kt,
        deltaT: deltaT,
        volume: step1.dimensions.length * step1.dimensions.width * step1.dimensions.height,
        hasGlazing: step2.glazing.type !== 'none' && step2.glazing.area > 0
    };
    
    return results;
}

// ===== FONCTIONS DE CALCUL SPÉCIFIQUES =====
function calculateWallLosses(surface, kt, deltaT) {
    if (!surface || !kt || deltaT <= 0) return 0;
    
    // Formule: Q = 24 × Surface × Kt × ΔT (Wh/jour) → kWh/jour → kW
    const powerWh = 24 * surface * kt * deltaT;
    const power = powerWh / 1000; // Conversion en kW
    return Math.round(power * 100) / 100;
}

function calculateCeilingLosses(surface, kt, deltaT) {
    if (!surface || !kt || deltaT <= 0) return 0;
    
    // Même formule que les murs
    const powerWh = 24 * surface * kt * deltaT;
    const power = powerWh / 1000;
    return Math.round(power * 100) / 100;
}

function calculateProductLoadDetailed(quantity, T_entry, T_chamber, T_freezing, Cp1, Cp2, L) {
    if (!quantity || quantity <= 0) return 0;
    
    let Q = 0;
    
    // Conversion kJ → kWh: 1 kJ = 0.0002778 kWh
    const kJ_to_kWh = 0.0002778;
    
    if (T_chamber < T_freezing) {
        // Cas 1: Chambre froide < point de congélation
        // Q = m × Cp1 × (T_entrée - T_congélation) + m × L + m × Cp2 × (T_congélation - T_chambre)
        Q = quantity * Cp1 * (T_entry - T_freezing) + 
            quantity * L + 
            quantity * Cp2 * (T_freezing - T_chamber);
    } else {
        // Cas 2: Chambre froide ≥ point de congélation
        // Q = m × Cp1 × (T_entrée - T_chambre)
        Q = quantity * Cp1 * (T_entry - T_chamber);
    }
    
    // Convertir en kWh et diviser par 24h pour avoir la puissance moyenne
    const power = (Q * kJ_to_kWh) / 24;
    return Math.round(power * 100) / 100;
}

function calculatePersonnelLoad(personnelNumber) {
    if (!personnelNumber || personnelNumber <= 0) return 0;
    
    // 116 W par personne → kW
    const power = (personnelNumber * 116) / 1000;
    return Math.round(power * 100) / 100;
}

function calculateLightingLoad(lightingPower) {
    if (!lightingPower || lightingPower <= 0) return 0;
    
    // Puissance totale en kW
    const power = lightingPower / 1000;
    return Math.round(power * 100) / 100;
}

function calculateGlazingLoad(area, uValue, deltaT) {
    if (!area || area <= 0 || !uValue || deltaT <= 0) return 0;
    
    // Q = Surface × U × ΔT (W) → kW
    const power = (area * uValue * deltaT) / 1000;
    return Math.round(power * 100) / 100;
}

// ===== AFFICHAGE DES RÉSULTATS =====
function displayResults(results) {
    showPage('resultsPage');
    
    // Afficher les informations de base
    document.getElementById('projectNameDisplay').textContent = 
        AppState.calculationData.name || 'Sans nom';
    
    document.getElementById('resultsDate').textContent = 
        `Calculé le ${AppState.calculationData.date} à ${AppState.calculationData.time}`;
    
    // Afficher la puissance totale
    const totalPower = results.total;
    document.getElementById('totalPower').textContent = totalPower.toFixed(2);
    
    // Calculer l'énergie quotidienne
    const dailyEnergy = totalPower * 24;
    document.getElementById('dailyEnergy').textContent = dailyEnergy.toFixed(2) + ' kWh';
    
    // Puissance de dimensionnement (avec marge de 15%)
    const designPower = totalPower * 1.15;
    document.getElementById('designPower').textContent = designPower.toFixed(2) + ' kW';
    document.getElementById('recommendedPower').textContent = designPower.toFixed(2) + ' kW';
    
    // Mettre à jour le tableau
    updateResultsTable(results);
    
    // Mettre à jour les détails techniques
    updateTechnicalDetails(results);
    
    // Mettre à jour le graphique
    updateChart(results);
}

function updateResultsTable(results) {
    const tbody = document.querySelector('#resultsTable tbody');
    const tableTotal = document.getElementById('tableTotal');
    
    if (!tbody) return;
    
    let html = '';
    let total = 0;
    
    const components = [
        { 
            name: 'Déperditions parois', 
            key: 'walls', 
            value: results.components.walls,
            color: CHART_COLORS.walls,
            icon: 'fas fa-wall'
        },
        { 
            name: 'Déperditions plafond', 
            key: 'ceiling', 
            value: results.components.ceiling,
            color: CHART_COLORS.ceiling,
            icon: 'fas fa-grip-horizontal'
        },
        { 
            name: 'Charge produit', 
            key: 'product', 
            value: results.components.product,
            color: CHART_COLORS.product,
            icon: 'fas fa-apple-alt'
        },
        { 
            name: 'Charges personnel', 
            key: 'personnel', 
            value: results.components.personnel,
            color: CHART_COLORS.personnel,
            icon: 'fas fa-users'
        },
        { 
            name: 'Charges éclairage', 
            key: 'lighting', 
            value: results.components.lighting,
            color: CHART_COLORS.lighting,
            icon: 'fas fa-lightbulb'
        }
    ];
    
    // Ajouter le vitrage seulement si > 0
    if (results.components.glazing > 0) {
        components.push({ 
            name: 'Déperditions vitrage', 
            key: 'glazing', 
            value: results.components.glazing,
            color: CHART_COLORS.glazing,
            icon: 'fas fa-window-maximize'
        });
    }
    
    // Filtrer les composants avec valeur > 0
    const activeComponents = components.filter(c => c.value > 0);
    
    // Calculer les pourcentages
    activeComponents.forEach(component => {
        const percentage = results.total > 0 ? (component.value / results.total * 100) : 0;
        total += component.value;
        
        html += `
            <tr>
                <td>
                    <div class="load-indicator">
                        <i class="${component.icon}" style="color: ${component.color}"></i>
                        ${component.name}
                    </div>
                </td>
                <td class="text-right">${component.value.toFixed(2)}</td>
                <td class="text-right">${percentage.toFixed(1)}%</td>
            </tr>
        `;
    });
    
    tbody.innerHTML = html;
    tableTotal.textContent = results.total.toFixed(2) + ' kW';
}

function updateTechnicalDetails(results) {
    const details = document.getElementById('technicalDetails');
    const data = AppState.calculationData.stepData;
    
    if (!details || !data) return;
    
    const step1 = data.step1;
    const step2 = data.step2;
    const step3 = data.step3;
    
    // Calculer le volume
    const volume = step1.dimensions.length * step1.dimensions.width * step1.dimensions.height;
    
    // Calculer Kt
    const kt = step2.coefficients.k1 + step2.coefficients.k2 + step2.coefficients.k3 + 
               step2.coefficients.k4 + step2.coefficients.k5 + step2.coefficients.k6;
    
    let html = `
        <div class="detail-category">
            <h4><i class="fas fa-ruler-combined"></i> Géométrie</h4>
            <div class="detail-item">
                <span>Dimensions (L×l×H)</span>
                <p>${step1.dimensions.length} × ${step1.dimensions.width} × ${step1.dimensions.height} m</p>
            </div>
            <div class="detail-item">
                <span>Volume total</span>
                <p>${volume.toFixed(1)} m³</p>
            </div>
            <div class="detail-item">
                <span>Surface parois</span>
                <p>${step2.surfaces.walls.toFixed(1)} m²</p>
            </div>
            <div class="detail-item">
                <span>Surface plafond</span>
                <p>${step2.surfaces.ceiling.toFixed(1)} m²</p>
            </div>
        </div>
        
        <div class="detail-category">
            <h4><i class="fas fa-thermometer-half"></i> Températures</h4>
            <div class="detail-item">
                <span>Intérieure / Extérieure</span>
                <p>${step1.temperatures.interior}°C / ${step1.temperatures.exterior}°C</p>
            </div>
            <div class="detail-item">
                <span>Différence ΔT</span>
                <p>${(step1.temperatures.exterior - step1.temperatures.interior).toFixed(1)}°C</p>
            </div>
            <div class="detail-item">
                <span>Point congélation produit</span>
                <p>${step3.product.freezingPoint}°C</p>
            </div>
            <div class="detail-item">
                <span>Température entrée produit</span>
                <p>${step3.product.entryTemp}°C</p>
            </div>
        </div>
        
        <div class="detail-category">
            <h4><i class="fas fa-calculator"></i> Coefficients</h4>
            <div class="detail-item">
                <span>Kt total</span>
                <p>${kt.toFixed(2)} W/m².K</p>
            </div>
            <div class="detail-item">
                <span>Produit - Cp1 (au-dessus)</span>
                <p>${step3.product.cpAbove} kJ/kg.K</p>
            </div>
            <div class="detail-item">
                <span>Produit - Cp2 (en-dessous)</span>
                <p>${step3.product.cpBelow} kJ/kg.K</p>
            </div>
            <div class="detail-item">
                <span>Produit - Chaleur latente</span>
                <p>${step3.product.latentHeat} kJ/kg</p>
            </div>
        </div>
    `;
    
    details.innerHTML = html;
}

// ===== GRAPHIQUE =====
function initChart() {
    const ctx = document.getElementById('pieChart');
    if (!ctx) return;
    
    try {
        AppState.chartInstance = new Chart(ctx.getContext('2d'), {
            type: 'pie',
            data: {
                labels: [],
                datasets: [{
                    data: [],
                    backgroundColor: [],
                    borderWidth: 1,
                    borderColor: '#fff'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
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
        
        updateChartLegend([]);
    } catch (error) {
        console.error('Erreur initChart:', error);
    }
}

function updateChart(results) {
    if (!AppState.chartInstance) return;
    
    const labels = [];
    const data = [];
    const colors = [];
    const legendItems = [];
    
    const components = [
        { name: 'Charge produit', key: 'product', value: results.components.product, color: CHART_COLORS.product },
        { name: 'Déperditions parois', key: 'walls', value: results.components.walls, color: CHART_COLORS.walls },
        { name: 'Déperditions plafond', key: 'ceiling', value: results.components.ceiling, color: CHART_COLORS.ceiling },
        { name: 'Charges personnel', key: 'personnel', value: results.components.personnel, color: CHART_COLORS.personnel },
        { name: 'Charges éclairage', key: 'lighting', value: results.components.lighting, color: CHART_COLORS.lighting }
    ];
    
    // Ajouter le vitrage si présent
    if (results.components.glazing > 0) {
        components.push({ 
            name: 'Déperditions vitrage', 
            key: 'glazing', 
            value: results.components.glazing, 
            color: CHART_COLORS.glazing 
        });
    }
    
    // Filtrer et ajouter les composants avec valeur > 0
    components.forEach(component => {
        if (component.value > 0) {
            labels.push(component.name);
            data.push(component.value);
            colors.push(component.color);
            legendItems.push(component);
        }
    });
    
    // Mettre à jour le graphique
    AppState.chartInstance.data.labels = labels;
    AppState.chartInstance.data.datasets[0].data = data;
    AppState.chartInstance.data.datasets[0].backgroundColor = colors;
    AppState.chartInstance.update();
    
    // Mettre à jour la légende
    updateChartLegend(legendItems);
}

function updateChartLegend(legendItems) {
    const legend = document.getElementById('chartLegend');
    if (!legend) return;
    
    if (legendItems.length === 0) {
        legend.innerHTML = '<p class="text-muted">Aucune donnée à afficher</p>';
        return;
    }
    
    let html = '';
    legendItems.forEach(item => {
        const percentage = AppState.chartInstance?.data?.datasets[0]?.data?.reduce((a, b) => a + b, 0) > 0 
            ? (item.value / AppState.chartInstance.data.datasets[0].data.reduce((a, b) => a + b, 0) * 100).toFixed(1)
            : 0;
        
        html += `
            <div class="legend-item">
                <div class="legend-color" style="background-color: ${item.color}"></div>
                <span>${item.name}</span>
                <span class="legend-percentage">${percentage}%</span>
            </div>
        `;
    });
    
    legend.innerHTML = html;
}

// ===== GESTION DES SAUVEGARDES =====
function saveCalculation() {
    try {
        let saved = JSON.parse(localStorage.getItem('difri_calculations') || '[]');
        
        // Vérifier si ce calcul existe déjà
        const existingIndex = saved.findIndex(c => c.id === AppState.calculationData.id);
        if (existingIndex >= 0) {
            // Mettre à jour
            saved[existingIndex] = AppState.calculationData;
        } else {
            // Ajouter nouveau
            saved.push(AppState.calculationData);
        }
        
        // Limiter à 10 calculs
        if (saved.length > 10) {
            saved = saved.slice(-10);
        }
        
        localStorage.setItem('difri_calculations', JSON.stringify(saved));
        loadSavedCalculations();
        
    } catch (error) {
        console.error('Erreur saveCalculation:', error);
        showNotification('Erreur lors de la sauvegarde', 'danger');
    }
}

function loadSavedCalculations() {
    try {
        const saved = JSON.parse(localStorage.getItem('difri_calculations') || '[]');
        AppState.savedCalculations = saved;
        
        const container = document.getElementById('savedList');
        if (!container) return;
        
        if (saved.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-inbox fa-2x"></i>
                    <p>Aucun calcul sauvegardé</p>
                </div>
            `;
            return;
        }
        
        let html = '';
        saved.reverse().forEach(calc => {
            const totalPower = calc.results?.total?.toFixed(2) || '0.00';
            const date = calc.date || 'Date inconnue';
            const name = calc.name || 'Sans nom';
            
            html += `
                <div class="saved-item" data-id="${calc.id}">
                    <div class="saved-item-info">
                        <h3>${name}</h3>
                        <p>Créé le ${date} - ${totalPower} kW</p>
                    </div>
                    <div class="saved-item-actions">
                        <button onclick="loadSavedCalculation('${calc.id}')" title="Charger">
                            <i class="fas fa-upload"></i>
                        </button>
                        <button onclick="deleteSavedCalculation('${calc.id}')" title="Supprimer">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
            `;
        });
        
        container.innerHTML = html;
    } catch (error) {
        console.error('Erreur loadSavedCalculations:', error);
    }
}

function loadSavedCalculation(id) {
    try {
        const saved = JSON.parse(localStorage.getItem('difri_calculations') || '[]');
        const calc = saved.find(c => c.id === id);
        
        if (calc) {
            AppState.calculationData = { ...calc };
            
            // Remplir les formulaires
            if (calc.stepData?.step1) {
                const s1 = calc.stepData.step1;
                document.getElementById('projectName').value = s1.projectName || '';
                document.getElementById('length').value = s1.dimensions?.length || '';
                document.getElementById('width').value = s1.dimensions?.width || '';
                document.getElementById('height').value = s1.dimensions?.height || '';
                document.getElementById('interiorTemp').value = s1.temperatures?.interior || '4';
                document.getElementById('exteriorTemp').value = s1.temperatures?.exterior || '25';
            }
            
            if (calc.stepData?.step2) {
                const s2 = calc.stepData.step2;
                document.getElementById('k1').value = s2.coefficients?.k1 || 0.45;
                document.getElementById('k2').value = s2.coefficients?.k2 || 0.23;
                document.getElementById('k3').value = s2.coefficients?.k3 || 0.12;
                document.getElementById('k4').value = s2.coefficients?.k4 || 0.16;
                document.getElementById('k5').value = s2.coefficients?.k5 || 0.04;
                document.getElementById('k6').value = s2.coefficients?.k6 || 0.05;
                
                document.getElementById('wallsSurface').value = s2.surfaces?.walls || '';
                document.getElementById('ceilingSurface').value = s2.surfaces?.ceiling || '';
                
                document.getElementById('glazingType').value = s2.glazing?.type || 'none';
                document.getElementById('glazingArea').value = s2.glazing?.area || '0';
                document.getElementById('glazingU').value = s2.glazing?.uValue || 5.7;
                
                // Activer/désactiver les champs vitrage
                const glazingTypeSelect = document.getElementById('glazingType');
                if (glazingTypeSelect) {
                    glazingTypeSelect.dispatchEvent(new Event('change'));
                }
            }
            
            if (calc.stepData?.step3) {
                const s3 = calc.stepData.step3;
                document.getElementById('productType').value = s3.product?.type || 'fruits';
                document.getElementById('quantity').value = s3.product?.quantity || '';
                document.getElementById('entryTemp').value = s3.product?.entryTemp || '15';
                document.getElementById('freezingPoint').value = s3.product?.freezingPoint || '0';
                document.getElementById('cpAbove').value = s3.product?.cpAbove || '3.8';
                document.getElementById('cpBelow').value = s3.product?.cpBelow || '1.9';
                document.getElementById('latentHeat').value = s3.product?.latentHeat || '250';
                
                document.getElementById('personnelNumber').value = s3.personnel?.number || '0';
                document.getElementById('lightingPower').value = s3.lighting?.power || '0';
            }
            
            // Mettre à jour les calculs automatiques
            calculateAreas();
            updateKtValue();
            updateProductDefaults();
            
            // Aller au wizard
            showPage('wizardPage');
            showStep(1);
            
            showNotification('Calcul chargé avec succès', 'success');
        }
    } catch (error) {
        console.error('Erreur loadSavedCalculation:', error);
        showNotification('Erreur lors du chargement', 'danger');
    }
}

function deleteSavedCalculation(id) {
    if (!confirm('Voulez-vous vraiment supprimer ce calcul ? Cette action est irréversible.')) {
        return;
    }
    
    try {
        let saved = JSON.parse(localStorage.getItem('difri_calculations') || '[]');
        saved = saved.filter(c => c.id !== id);
        localStorage.setItem('difri_calculations', JSON.stringify(saved));
        
        loadSavedCalculations();
        
        // Si on supprime le calcul courant, revenir à l'accueil
        if (AppState.calculationData.id === id) {
            goHome();
        }
        
        showNotification('Calcul supprimé', 'success');
    } catch (error) {
        console.error('Erreur deleteSavedCalculation:', error);
        showNotification('Erreur lors de la suppression', 'danger');
    }
}

// ===== FONCTIONS UTILITAIRES =====
function goHome() {
    showPage('homePage');
}

function modifyCalculation() {
    showPage('wizardPage');
    showStep(1);
}

function saveAsNewCalculation() {
    const oldId = AppState.calculationData.id;
    AppState.calculationData.id = Date.now().toString();
    AppState.calculationData.date = new Date().toLocaleDateString('fr-FR');
    AppState.calculationData.time = new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    AppState.calculationData.name = `${AppState.calculationData.name} (copie)`;
    
    saveCalculation();
    showNotification('Calcul dupliqué avec succès', 'success');
}

function exportToPDF() {
    // Pour l'instant, on utilise l'impression navigateur
    // Une version future pourrait utiliser jsPDF
    window.print();
    showNotification('Utilisez l\'impression de votre navigateur pour exporter en PDF', 'info');
}

function showLoading(show) {
    const overlay = document.getElementById('loadingOverlay');
    if (overlay) {
        overlay.style.display = show ? 'flex' : 'none';
    }
}

function showNotification(message, type = 'info') {
    const notification = document.getElementById('notification');
    if (!notification) return;
    
    // Définir la couleur selon le type
    let backgroundColor = '#3b82f6'; // info par défaut
    if (type === 'success') backgroundColor = '#10b981';
    if (type === 'warning') backgroundColor = '#f59e0b';
    if (type === 'danger') backgroundColor = '#ef4444';
    
    notification.style.backgroundColor = backgroundColor;
    notification.textContent = message;
    notification.classList.add('show');
    
    // Masquer après 5 secondes
    setTimeout(() => {
        notification.classList.remove('show');
    }, 5000);
}

// ===== FONCTIONS GLOBALES =====
window.startNewCalculation = startNewCalculation;
window.nextStep = nextStep;
window.previousStep = previousStep;
window.calculateResults = calculateResults;
window.goHome = goHome;
window.loadSavedCalculation = loadSavedCalculation;
window.deleteSavedCalculation = deleteSavedCalculation;
window.previewCalculation = previewCalculation;
window.modifyCalculation = modifyCalculation;
window.saveAsNewCalculation = saveAsNewCalculation;
window.exportToPDF = exportToPDF;

console.log('DiFRI v2.0 - Tous les amendements appliqués ✓');