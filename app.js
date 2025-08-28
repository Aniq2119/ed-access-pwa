// ==================================================
// ============== SERVICE WORKER ====================
// ==================================================
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/service-worker.js').then(registration => {
            console.log('ServiceWorker registration successful with scope: ', registration.scope);
        }, err => {
            console.log('ServiceWorker registration failed: ', err);
        });
    });
}

// ==================================================
// ============== GLOBAL VARIABLES ==================
// ==================================================
let patientData = {};
let drugDatabase = [];

// ==================================================
// ============== PAGE ELEMENTS =====================
// ==================================================
const allPages = document.querySelectorAll('section');
const body = document.body;

// Buttons
const startButton = document.getElementById('startButton');
const devModeButton = document.getElementById('devModeButton');
const formStartButton = document.getElementById('formStartButton');
const continueButton = document.getElementById('continueButton');
const broselowButton = document.getElementById('broselowButton');
const menuBackButton = document.getElementById('menuBackButton');
const hollidaySegarButton = document.getElementById('hollidaySegarButton');
const fluidResultBackButton = document.getElementById('fluidResultBackButton');
const calculateParklandButton = document.getElementById('calculateParklandButton');
const calculateGcsButton = document.getElementById('calculateGcsButton');
const calculateQsofaButton = document.getElementById('calculateQsofaButton');
const calculateWellsDvtButton = document.getElementById('calculateWellsDvtButton');
const checkPercButton = document.getElementById('checkPercButton');
const backButtons = document.querySelectorAll('.back-button');
const menuButtons = document.querySelectorAll('#menuButtons .menu-button');

// Modal
const broselowModal = document.getElementById('broselowModal');
const closeButton = document.querySelector('.close-button');

// Patient Persistence
const resumePatientBar = document.getElementById('resumePatientBar');
const startNewPatient = document.getElementById('startNewPatient');

// Inputs and Outputs
const ageInput = document.getElementById('age');
const weightInput = document.getElementById('weight');
const heightInput = document.getElementById('height');
const genderInput = document.getElementById('gender');
const bmiOutput = document.getElementById('bmiOutput');
const adjBwOutput = document.getElementById('adjBwOutput');
const idealBwOutput = document.getElementById('idealBwOutput');
const formError = document.getElementById('formError');
const drugSearchInput = document.getElementById('drugSearch');
const autocompleteList = document.getElementById('autocompleteList');
const drugInfo = document.getElementById('drugInfo');
const fluidResultTitle = document.getElementById('fluidResultTitle');
const fluidResultDetails = document.getElementById('fluidResultDetails');
const medicalEquipmentsMain = document.getElementById('medicalEquipmentsMain');
const resuscitationMain = document.getElementById('resuscitationMain');
const menuSearchInput = document.getElementById('menuSearch');


// ==================================================
// ============== PAGE NAVIGATION ===================
// ==================================================
function showPage(pageId) {
    const pageToShow = document.getElementById(pageId);
    if (!pageToShow) {
        console.error("Page not found:", pageId);
        return;
    }

    allPages.forEach(page => page.classList.add('hidden'));
    pageToShow.classList.remove('hidden');

    const nonAppBgs = ['landingPage', 'drugDosePage', 'scoresPage', 'medicalEquipmentsPage', 'resuscitationPage', 'fluidRegimenPage', 'hollidaySegarPage', 'parklandPage'];
    if (nonAppBgs.includes(pageId)) {
        body.classList.remove('app-bg');
        body.classList.add('landing-bg');
    } else {
        body.classList.remove('landing-bg');
        body.classList.add('app-bg');
    }
}

// ==================================================
// ============== EVENT LISTENERS ===================
// ==================================================
document.addEventListener('DOMContentLoaded', () => {
    fetchDrugs();

    startButton.addEventListener('click', () => {
        loadPatientData();
        showPage('formPage');
    });

    devModeButton.addEventListener('click', () => {
        patientData = { age: 5, weight: 18, height: 110, gender: 'Male' };
        savePatientData();
        showPage('menuPage');
    });

    formStartButton.addEventListener('click', () => {
        if (calculateAndShowResults()) {
            showPage('resultsPage');
        }
    });

    continueButton.addEventListener('click', () => showPage('menuPage'));
    broselowButton.addEventListener('click', () => broselowModal.style.display = 'block');
    closeButton.addEventListener('click', () => broselowModal.style.display = 'none');
    window.addEventListener('click', (event) => {
        if (event.target == broselowModal) {
            broselowModal.style.display = 'none';
        }
    });

    menuBackButton.addEventListener('click', () => showPage('formPage'));
    hollidaySegarButton.addEventListener('click', () => showPage('hollidaySegarPage'));
    
    fluidResultBackButton.addEventListener('click', () => {
        const hollidayPage = document.getElementById('hollidaySegarPage');
        if (!hollidayPage.classList.contains('hidden')) {
             showPage('hollidaySegarPage');
        } else {
             showPage('fluidRegimenPage');
        }
    });

    backButtons.forEach(button => {
        button.addEventListener('click', () => {
            const targetPageId = button.getAttribute('data-target');
            showPage(targetPageId);
        });
    });
    
    menuButtons.forEach(button => {
        button.addEventListener('click', () => {
            const targetPageId = button.getAttribute('data-target');
            if (targetPageId === 'medicalEquipmentsPage') calculateMedicalEquipments();
            if (targetPageId === 'resuscitationPage') calculateResuscitationDrugs();
            showPage(targetPageId);
        });
    });

    calculateParklandButton.addEventListener('click', () => showFluidResult('parkland'));
    calculateGcsButton.addEventListener('click', calculateGcsScore);
    calculateQsofaButton.addEventListener('click', calculateQsofaScore);
    calculateWellsDvtButton.addEventListener('click', calculateWellsDvtScore);
    checkPercButton.addEventListener('click', checkPercRule);

    startNewPatient.addEventListener('click', () => {
        localStorage.removeItem('edAccessPatientData');
        patientData = {};
        document.getElementById('patientForm').reset();
        resumePatientBar.classList.add('hidden');
    });
    
    menuSearchInput.addEventListener('input', filterMenu);
});


// ==================================================
// =========== PATIENT DATA & CALCULATIONS ==========
// ==================================================
function savePatientData() {
    localStorage.setItem('edAccessPatientData', JSON.stringify(patientData));
}

function loadPatientData() {
    const savedData = localStorage.getItem('edAccessPatientData');
    if (savedData) {
        patientData = JSON.parse(savedData);
        ageInput.value = patientData.age;
        weightInput.value = patientData.weight;
        heightInput.value = patientData.height;
        genderInput.value = patientData.gender;
        resumePatientBar.classList.remove('hidden');
    }
}

function calculateAndShowResults() {
    const age = parseFloat(ageInput.value);
    const weightKg = parseFloat(weightInput.value);
    const heightCm = parseFloat(heightInput.value);
    const gender = genderInput.value;

    if (isNaN(age) || isNaN(weightKg) || isNaN(heightCm) || age < 0 || weightKg <= 0 || heightCm <= 0) {
        formError.innerText = "Please enter valid, positive patient data.";
        return false;
    }
    if (age > 120 || weightKg > 300 || heightCm > 250) {
         formError.innerText = "Values are outside a realistic range.";
         return false;
    }
    formError.innerText = "";
    
    patientData = { age, weight: weightKg, height: heightCm, gender };
    savePatientData();

    const heightM = heightCm / 100;
    const bmi = weightKg / (heightM * heightM);
    const heightIn = heightCm / 2.54;
    let idealBw = 0;
    if (heightIn > 60) {
        const inchesOver5Feet = heightIn - 60;
        idealBw = (gender === 'Male') ? 50 + (2.3 * inchesOver5Feet) : 45.5 + (2.3 * inchesOver5Feet);
    } else {
        idealBw = (gender === 'Male') ? 50 : 45.5;
    }
    const adjBw = idealBw + 0.4 * (weightKg - idealBw);

    bmiOutput.innerText = `${bmi.toFixed(1)} kg/m²`;
    adjBwOutput.innerText = `${adjBw.toFixed(1)} kg`;
    idealBwOutput.innerText = `${idealBw.toFixed(1)} kg`;

    return true;
}

// ==================================================
// ============ FLUID CALCULATIONS ==================
// ==================================================
function showFluidResult(type) {
    if (!patientData.weight || patientData.weight <= 0) {
        fluidResultDetails.innerHTML = "<p>Patient weight not set. Please go back and enter patient details.</p>";
        showPage('fluidResultPage');
        return;
    }

    let title = '';
    let details = '';
    const weight = patientData.weight;

    switch (type) {
        case 'daily':
        case 'maintenance': {
            title = 'Maintenance Fluid Calculation';
            let dailyFluid = 0;
            if (weight <= 10) {
                dailyFluid = weight * 100;
            } else if (weight <= 20) {
                dailyFluid = 1000 + ((weight - 10) * 50);
            } else {
                dailyFluid = 1500 + ((weight - 20) * 20);
            }
            const hourlyRate = dailyFluid / 24;
            details = `
                <p><strong>Patient Weight:</strong> ${weight.toFixed(1)} kg</p>
                <p><strong>Type of Fluid:</strong> Isotonic crystalloid (e.g., Normal Saline, Lactated Ringer's) is typically used.</p>
                <p><strong>Total Daily Fluid:</strong> ${dailyFluid.toFixed(0)} ml/day</p>
                <p><strong>Specific Rate:</strong> ${hourlyRate.toFixed(1)} ml/hr</p>
                <p><strong>Duration of Infusion:</strong> Continuous maintenance.</p>
            `;
            break;
        }
        case 'bolus': {
            title = 'Fluid Bolus Calculation';
            const bolusAmount = weight * 20; // 20 ml/kg
            details = `
                <p><strong>Patient Weight:</strong> ${weight.toFixed(1)} kg</p>
                <p><strong>Type of Fluid:</strong> Isotonic crystalloid (e.g., Normal Saline).</p>
                <p><strong>Bolus Volume:</strong> ${bolusAmount.toFixed(0)} ml</p>
                <p><strong>Administration:</strong> Administer over 20-30 minutes. Reassess patient after bolus.</p>
            `;
            break;
        }
        case 'deficit': {
            title = 'Deficit Correction Calculation';
            const deficit = weight * 100; // Assuming 10% dehydration
            const halfDeficit = deficit / 2;
            const first8hRate = halfDeficit / 8;
            const next16hRate = halfDeficit / 16;
             details = `
                <p><strong>Patient Weight:</strong> ${weight.toFixed(1)} kg</p>
                <p><strong>Assuming 10% Dehydration:</strong></p>
                <p><strong>Total Deficit:</strong> ${deficit.toFixed(0)} ml</p>
                <p><strong>Correction Plan:</strong></p>
                <ul>
                    <li>- Replace 50% (${halfDeficit.toFixed(0)} ml) over the first 8 hours at <strong>${first8hRate.toFixed(1)} ml/hr</strong>.</li>
                    <li>- Replace remaining 50% (${halfDeficit.toFixed(0)} ml) over the next 16 hours at <strong>${next16hRate.toFixed(1)} ml/hr</strong>.</li>
                </ul>
                <p><em>Note: This does not include maintenance fluids.</em></p>
            `;
            break;
        }
        case 'dengue': {
            title = 'Dengue Fluid Regime (Hypotensive Shock)';
            const dengueBolus = weight * 20;
            details = `
                <p><strong>Patient Weight:</strong> ${weight.toFixed(1)} kg</p>
                <p><strong>For Dengue Shock Syndrome:</strong></p>
                <p><strong>Initial Bolus:</strong> Start with an isotonic crystalloid bolus of ${dengueBolus.toFixed(0)} ml (20 ml/kg) over 15-30 minutes.</p>
                <p><strong>Reassessment:</strong> Reassess clinical status. If improving, start maintenance with crystalloids at 5-7 ml/kg/hr. If not improving, consider a second bolus.</p>
                <p><strong>Important:</strong> Fluid management in dengue is critical and must be guided by clinical signs, hematocrit, and hemodynamic status. This is a simplified guideline.</p>
            `;
            break;
        }
        case 'parkland': {
            const bsa = parseFloat(document.getElementById('bsaInput').value);
            if (!bsa || bsa <= 0 || bsa > 100) {
                alert("Please enter a valid Body Surface Area percentage.");
                return;
            }
            title = 'Parkland Formula for Burns';
            const totalFluid = 4 * weight * bsa;
            const first8hFluid = totalFluid / 2;
            const next16hFluid = totalFluid / 2;
            const first8hRate = first8hFluid / 8;
            const next16hRate = next16hFluid / 16;
            details = `
                <p><strong>Patient Weight:</strong> ${weight.toFixed(1)} kg</p>
                <p><strong>TBSA:</strong> ${bsa}%</p>
                <p><strong>Total Fluid in 24h:</strong> ${totalFluid.toFixed(0)} ml</p>
                <p><strong>First 8 hours:</strong> ${first8hFluid.toFixed(0)} ml at <strong>${first8hRate.toFixed(1)} ml/hr</strong></p>
                <p><strong>Next 16 hours:</strong> ${next16hFluid.toFixed(0)} ml at <strong>${next16hRate.toFixed(1)} ml/hr</strong></p>
            `;
            break;
        }
    }

    fluidResultTitle.innerText = title;
    fluidResultDetails.innerHTML = details;
    
    showPage('fluidResultPage');
}


// ==================================================
// ============ MEDICAL EQUIPMENT SIZING ============
// ==================================================
function calculateMedicalEquipments() {
    const { age, weight } = patientData;
    let content = `<p class="font-bold mb-2">Suitable equipment sizes for a ${age.toFixed(1)}-year-old weighing ${weight} kg:</p><ul class="list-disc list-inside space-y-2">`;

    if (age > 16) {
        content += `<li>Adult sizes are typically used. Clinical judgment is required.</li>`;
    } else {
        let bladeSize, bladeType;
        if (age < 1) { bladeSize = 1; bladeType = 'Miller'; }
        else if (age < 2) { bladeSize = 1.5; bladeType = 'Miller/Mac'; }
        else if (age < 6) { bladeSize = 2; bladeType = 'Mac'; }
        else if (age < 12) { bladeSize = 2; bladeType = 'Mac'; }
        else { bladeSize = 3; bladeType = 'Mac'; }
        content += `<li><strong>Laryngoscope Blade:</strong> Size ${bladeSize} (${bladeType})</li>`;

        let ettUncuffed = (age / 4) + 4;
        let ettCuffed = (age / 4) + 3.5;
        content += `<li><strong>ETT Size (Uncuffed):</strong> ${ettUncuffed.toFixed(1)} mm</li>`;
        content += `<li><strong>ETT Size (Cuffed):</strong> ${ettCuffed.toFixed(1)} mm</li>`;
        content += `<li><strong>ETT Anchor (at lips):</strong> ${((age / 2) + 12).toFixed(1)} cm or ETT size x 3</li>`;

        let npaSize = ettCuffed + 1;
        content += `<li><strong>Nasopharyngeal Airway:</strong> Approx. ${npaSize.toFixed(1)} Fr</li>`;
    }
    content += '</ul>';
    medicalEquipmentsMain.innerHTML = content;
}

// ==================================================
// ============ RESUSCITATION DRUGS =================
// ==================================================
function calculateResuscitationDrugs() {
    const { weight, age } = patientData;
    let content = `<p class="font-bold mb-2">Calculated doses for a ${weight} kg patient:</p><ul class="list-disc list-inside space-y-2">`;
    
    if (age > 16) {
        content += `
            <li><strong>Adrenaline (Cardiac Arrest):</strong> 1 mg (10 ml of 1:10,000)</li>
            <li><strong>Amiodarone (VF/VT):</strong> 300 mg bolus, second dose 150 mg</li>
            <li><strong>Atropine (Bradycardia):</strong> 1 mg bolus, repeat every 3-5 mins</li>
            <li><strong>Dextrose (Hypoglycemia):</strong> 25g (50ml of D50W)</li>
            <li><strong>Lorazepam (Seizures):</strong> 2-4 mg IV</li>
        `;
    } else {
        const adrenalineDose = (weight * 0.01).toFixed(2);
        const adrenalineVol = (weight * 0.1).toFixed(2);
        content += `<li><strong>Adrenaline (Cardiac Arrest):</strong> ${adrenalineDose} mg (${adrenalineVol} ml of 1:10,000)</li>`;

        const amiodaroneDose = (weight * 5).toFixed(1);
        content += `<li><strong>Amiodarone (VF/VT):</strong> ${amiodaroneDose} mg</li>`;

        const atropineDose = (weight * 0.02).toFixed(2);
        content += `<li><strong>Atropine (Bradycardia):</strong> ${atropineDose} mg</li>`;

        let dextroseDose, dextroseType;
        if (age < 1) { 
            dextroseDose = (weight * 5).toFixed(1); // 5ml/kg of D10W
            dextroseType = 'D10W';
        } else {
            dextroseDose = (weight * 2).toFixed(1); // 2ml/kg of D25W or 1ml/kg of D50W
            dextroseType = 'D25W/D50W';
        }
        content += `<li><strong>Dextrose (Hypoglycemia):</strong> ${dextroseDose} ml of ${dextroseType}</li>`;

        const lorazepamDose = (weight * 0.1).toFixed(2);
        content += `<li><strong>Lorazepam (Seizures):</strong> ${lorazepamDose} mg</li>`;
    }
    content += '</ul>';
    resuscitationMain.innerHTML = content;
}

// ==================================================
// ============ SCORE CALCULATORS ===================
// ==================================================
function calculateGcsScore() {
    const eye = parseInt(document.getElementById('gcsEye').value);
    const verbal = parseInt(document.getElementById('gcsVerbal').value);
    const motor = parseInt(document.getElementById('gcsMotor').value);
    const total = eye + verbal + motor;
    let interpretation = '';
    if (total >= 13) interpretation = 'Mild';
    else if (total >= 9) interpretation = 'Moderate';
    else interpretation = 'Severe';
    document.getElementById('gcsResult').innerHTML = `Total Score: ${total} <br> (${interpretation} Head Injury)`;
}

function calculateQsofaScore() {
    let score = 0;
    if (document.getElementById('qsofaRR').checked) score++;
    if (document.getElementById('qsofaGCS').checked) score++;
    if (document.getElementById('qsofaSBP').checked) score++;
    let resultText = `qSOFA Score: ${score}. `;
    if (score >= 2) {
        resultText += "High risk for poor outcome with sepsis.";
    } else {
        resultText += "Low risk.";
    }
    document.getElementById('qsofaResult').innerText = resultText;
}

function calculateWellsDvtScore() {
    let score = 0;
    document.querySelectorAll('.wells-dvt-check:checked').forEach(checkbox => {
        score += parseInt(checkbox.getAttribute('data-score'));
    });
    let resultText = `Wells' Score: ${score}. `;
    if (score >= 3) {
        resultText += "High probability of DVT.";
    } else if (score >= 1) {
        resultText += "Moderate probability of DVT.";
    } else {
        resultText += "Low probability of DVT.";
    }
    document.getElementById('wellsDvtResult').innerText = resultText;
}

function checkPercRule() {
    const isPositive = Array.from(document.querySelectorAll('.perc-check')).some(checkbox => checkbox.checked);
    let resultText = '';
    if (isPositive) {
        resultText = "PERC Rule POSITIVE. PE cannot be ruled out by this rule alone.";
    } else {
        resultText = "PERC Rule NEGATIVE. PE unlikely.";
    }
    document.getElementById('percResult').innerText = resultText;
}

// ==================================================
// ============ DRUG SEARCH FUNCTIONALITY ===========
// ==================================================
async function fetchDrugs() {
    try {
        const response = await fetch('drugs.json');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        drugDatabase = await response.json();
        console.log("Drug database loaded successfully.");
    } catch (error) {
        console.error("Could not load drug database:", error);
        // Fallback to a minimal list or show an error
        drugInfo.innerHTML = "<p class='text-red-500'>Error loading drug database. Please check your connection and the 'drugs.json' file.</p>";
    }
}


drugSearchInput.addEventListener('input', () => {
    const query = drugSearchInput.value.toLowerCase();
    autocompleteList.innerHTML = '';
    if (query.length === 0) {
        autocompleteList.classList.add('hidden');
        return;
    }
    const filteredDrugs = drugDatabase.filter(drug => drug.name.toLowerCase().startsWith(query));
    if (filteredDrugs.length > 0) {
        autocompleteList.classList.remove('hidden');
        filteredDrugs.forEach(drug => {
            const item = document.createElement('div');
            item.classList.add('p-2', 'hover:bg-gray-200', 'cursor-pointer');
            item.innerText = drug.name;
            item.addEventListener('click', () => {
                drugSearchInput.value = drug.name;
                autocompleteList.classList.add('hidden');
                showDrugDetails(drug);
            });
            autocompleteList.appendChild(item);
        });
    } else {
        autocompleteList.classList.add('hidden');
    }
});

function showDrugDetails(drug) {
    let detailsHtml = `<h3 class="text-xl font-bold mb-2">${drug.name.toUpperCase()}</h3>`;
    
    if (patientData.age > 16 && drug.adult_dose) {
        detailsHtml += `<p><strong>Standard Adult Dose:</strong> ${drug.adult_dose}</p>`;
    } else if (drug.dose_per_kg) {
        const dose = (patientData.weight * drug.dose_per_kg).toFixed(2);
        detailsHtml += `<p><strong>Calculated Dose:</strong> ${dose} ${drug.unit} (for ${patientData.weight} kg patient)</p>`;
    }

    if (drug.details) detailsHtml += `<p><strong>Details:</strong> ${drug.details}</p>`;
    if (drug.concentration) detailsHtml += `<p><strong>Concentration:</strong> ${drug.concentration}</p>`;
    if (drug.prep) detailsHtml += `<p><strong>Preparation:</strong> ${drug.prep}</p>`;
    if (drug.indications) detailsHtml += `<p><strong>Indications:</strong> ${drug.indications}</p>`;
    if (drug.contraindications) detailsHtml += `<p><strong>Contraindications:</strong> ${drug.contraindications}</p>`;

    drugInfo.innerHTML = detailsHtml;
    drugInfo.classList.remove('hidden');
}

// ==================================================
// ================ MENU FILTER =====================
// ==================================================
function filterMenu() {
    const filter = menuSearchInput.value.toUpperCase();
    const buttons = document.querySelectorAll('#menuButtons .menu-button');
    buttons.forEach(button => {
        const text = button.textContent || button.innerText;
        if (text.toUpperCase().indexOf(filter) > -1) {
            button.style.display = "";
        } else {
            button.style.display = "none";
        }
    });
}

// ==================================================
// ================= INITIAL LOAD ===================
// ==================================================
showPage('landingPage');
