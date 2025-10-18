// DOM Elements
const form = document.getElementById('stressForm');
const randomBtn = document.getElementById('randomBtn');
const loadingOverlay = document.getElementById('loadingOverlay');
const smartwatch = document.getElementById('smartwatch');
const heartIcon = document.getElementById('heartIcon');
const statusText = document.getElementById('statusText');
const confidenceText = document.getElementById('confidenceText');
const resultCard = document.getElementById('resultCard');
const resultStatus = document.getElementById('resultStatus');
const resultConfidence = document.getElementById('resultConfidence');
const suggestionsCard = document.getElementById('suggestionsCard');
const suggestionsContent = document.getElementById('suggestionsContent');
const darkModeToggle = document.getElementById('darkModeToggle');
const toggleIcon = document.getElementById('toggleIcon');
const petTherapist = document.getElementById('petTherapist');
const petCloseBtn = document.getElementById('petCloseBtn');
const petEmoji = document.getElementById('petEmoji');
const petMessage = document.getElementById('petMessage');

// Stress relief suggestions
const stressSuggestions = [
    { text: "Take a short walk in nature 🌿", icon: "fas fa-walking" },
    { text: "Practice deep breathing exercises 🧘", icon: "fas fa-lungs" },
    { text: "Drink a warm cup of herbal tea ☕", icon: "fas fa-coffee" },
    { text: "Listen to calming music 🎵", icon: "fas fa-music" },
    { text: "Do some gentle stretching 🧘‍♀️", icon: "fas fa-spa" },
    { text: "Take a 5-minute meditation break 🧘‍♂️", icon: "fas fa-om" },
    { text: "Call or text a friend 📞", icon: "fas fa-phone" },
    { text: "Write down your thoughts in a journal 📝", icon: "fas fa-pen" }
];

const noStressSuggestions = [
    { text: "Keep up the excellent mood! 😃", icon: "fas fa-smile" },
    { text: "Stay hydrated and maintain this energy 💧", icon: "fas fa-tint" },
    { text: "Consider helping someone else today 🤝", icon: "fas fa-hands-helping" },
    { text: "Plan something fun for later 🎉", icon: "fas fa-calendar-check" },
    { text: "Share your positive energy with others ✨", icon: "fas fa-share-alt" }
];

// Pet therapist messages and emojis
const petMessages = [
    "Don't worry, I got your back! 🐾",
    "Take a deep breath 🌬️",
    "Grab some water 💧",
    "You're stronger than you think! 💪",
    "Let's take this one step at a time 🚶‍♀️",
    "I believe in you! ✨",
    "Remember to breathe deeply 🫁",
    "You've got this! 🌟"
];

const petEmojis = ['🐶', '🐱', '🐹', '🐰', '🦊', '🐨', '🐼', '🦝'];

// Initialize the app
document.addEventListener('DOMContentLoaded', function() {
    updateWatchDisplay('waiting', 'Waiting for input', '');
    setupEventListeners();
    initializeDarkMode();
});

// Setup event listeners
function setupEventListeners() {
    form.addEventListener('submit', handleFormSubmit);
    randomBtn.addEventListener('click', handleRandomSample);
    darkModeToggle.addEventListener('click', toggleDarkMode);
    petCloseBtn.addEventListener('click', hidePetTherapist);
    
    // Close pet therapist when clicking outside
    petTherapist.addEventListener('click', function(e) {
        if (e.target === petTherapist) {
            hidePetTherapist();
        }
    });
}

// Handle form submission
async function handleFormSubmit(e) {
    e.preventDefault();
    
    const formData = new FormData(form);
    const data = {};
    
    // Collect form data and convert to numbers
    for (let [key, value] of formData.entries()) {
        data[key] = parseFloat(value);
    }
    
    // Validate form data
    if (!validateFormData(data)) {
        showError('Please fill in all fields with valid values.');
        return;
    }
    
    // Show loading and make prediction
    showLoading();
    try {
        const response = await fetch('/predict', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data)
        });
        
        const result = await response.json();
        
        if (result.status === 'success') {
            displayResults(result);
        } else {
            showError(result.error || 'An error occurred during prediction.');
        }
    } catch (error) {
        showError('Network error. Please try again.');
    } finally {
        hideLoading();
    }
}

// Handle random sample generation
async function handleRandomSample() {
    showLoading();
    try {
        const response = await fetch('/random_sample');
        const result = await response.json();
        
        if (result.status === 'success') {
            populateFormWithSample(result.sample);
            
            // Automatically make prediction with the random sample
            const predictionResponse = await fetch('/predict', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    HR: result.sample.HR,
                    EDA: result.sample.EDA,
                    TEMP: result.sample.TEMP,
                    ACC_X: result.sample.ACC_X,
                    ACC_Y: result.sample.ACC_Y,
                    ACC_Z: result.sample.ACC_Z,
                    BVP: result.sample.BVP,
                    IBI: result.sample.IBI
                })
            });
            
            const predictionResult = await predictionResponse.json();
            if (predictionResult.status === 'success') {
                displayResults(predictionResult);
            }
        } else {
            showError(result.error || 'Failed to generate random sample.');
        }
    } catch (error) {
        showError('Network error. Please try again.');
    } finally {
        hideLoading();
    }
}

// Validate form data
function validateFormData(data) {
    const requiredFields = ['HR', 'EDA', 'TEMP', 'ACC_X', 'ACC_Y', 'ACC_Z', 'BVP', 'IBI'];
    
    for (let field of requiredFields) {
        if (!data[field] || data[field] === '') {
            return false;
        }
        
        const value = parseFloat(data[field]);
        if (isNaN(value)) {
            return false;
        }
    }
    
    return true;
}

// Populate form with random sample
function populateFormWithSample(sample) {
    document.getElementById('HR').value = sample.HR;
    document.getElementById('EDA').value = sample.EDA;
    document.getElementById('TEMP').value = sample.TEMP;
    document.getElementById('ACC_X').value = sample.ACC_X;
    document.getElementById('ACC_Y').value = sample.ACC_Y;
    document.getElementById('ACC_Z').value = sample.ACC_Z;
    document.getElementById('BVP').value = sample.BVP;
    document.getElementById('IBI').value = sample.IBI;
}

// Display prediction results
function displayResults(result) {
    const prediction = result.prediction;
    const confidence = result.confidence;
    
    // Update watch display
    updateWatchDisplay(prediction, prediction === 'stress' ? 'STRESS' : 'NO STRESS', `${confidence}%`);
    
    // Update result card
    updateResultCard(prediction, confidence);
    
    // Update suggestions
    updateSuggestions(prediction);
    
    // Show result cards
    resultCard.style.display = 'block';
    suggestionsCard.style.display = 'block';
    
    // Show pet therapist only for stress
    if (prediction === 'stress') {
        showPetTherapist();
    } else {
        hidePetTherapist();
    }
    
    // Scroll to results
    resultCard.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// Update watch display
function updateWatchDisplay(status, text, confidence) {
    // Remove existing classes
    smartwatch.classList.remove('stress-glow', 'no-stress-glow');
    heartIcon.classList.remove('stress', 'no-stress');
    
    // Update text
    statusText.textContent = text;
    confidenceText.textContent = confidence;
    
    // Update styling based on status
    if (status === 'stress') {
        smartwatch.classList.add('stress-glow');
        heartIcon.classList.add('stress');
    } else if (status === 'no_stress') {
        smartwatch.classList.add('no-stress-glow');
        heartIcon.classList.add('no-stress');
    }
}

// Update result card
function updateResultCard(prediction, confidence) {
    resultStatus.textContent = prediction === 'stress' ? 'STRESS DETECTED' : 'NO STRESS';
    resultStatus.className = `result-status ${prediction}`;
    resultConfidence.textContent = `Confidence: ${confidence}%`;
}

// Update suggestions
function updateSuggestions(prediction) {
    suggestionsContent.innerHTML = '';
    
    const suggestions = prediction === 'stress' ? stressSuggestions : noStressSuggestions;
    
    // Show 4 random suggestions
    const shuffledSuggestions = suggestions.sort(() => 0.5 - Math.random()).slice(0, 4);
    
    shuffledSuggestions.forEach(suggestion => {
        const suggestionElement = document.createElement('div');
        suggestionElement.className = `suggestion-item ${prediction}`;
        suggestionElement.innerHTML = `
            <i class="${suggestion.icon}"></i>
            <span>${suggestion.text}</span>
        `;
        suggestionsContent.appendChild(suggestionElement);
    });
}

// Show loading overlay
function showLoading() {
    loadingOverlay.style.display = 'flex';
}

// Hide loading overlay
function hideLoading() {
    loadingOverlay.style.display = 'none';
}

// Show error message
function showError(message) {
    // Create a custom styled error message instead of basic alert
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.innerHTML = `
        <div class="error-content">
            <i class="fas fa-exclamation-triangle"></i>
            <span>Error: ${message}</span>
            <button class="error-close" onclick="this.parentElement.parentElement.remove()">×</button>
        </div>
    `;
    
    // Add to body
    document.body.appendChild(errorDiv);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        if (errorDiv.parentElement) {
            errorDiv.remove();
        }
    }, 5000);
}

// Add some interactive animations
function addInteractiveEffects() {
    // Add hover effects to form inputs
    const inputs = document.querySelectorAll('.input-group input');
    inputs.forEach(input => {
        input.addEventListener('focus', function() {
            this.parentElement.style.transform = 'translateY(-2px)';
        });
        
        input.addEventListener('blur', function() {
            this.parentElement.style.transform = 'translateY(0)';
        });
    });
    
    // Add click animation to buttons
    const buttons = document.querySelectorAll('.btn');
    buttons.forEach(button => {
        button.addEventListener('click', function() {
            this.style.transform = 'scale(0.95)';
            setTimeout(() => {
                this.style.transform = 'scale(1)';
            }, 150);
        });
    });
}

// Initialize interactive effects
document.addEventListener('DOMContentLoaded', addInteractiveEffects);

// Add keyboard shortcuts
document.addEventListener('keydown', function(e) {
    // Enter key submits form
    if (e.key === 'Enter' && e.target.tagName === 'INPUT') {
        e.preventDefault();
        form.dispatchEvent(new Event('submit'));
    }
    
    // R key generates random sample
    if (e.key === 'r' || e.key === 'R') {
        if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            randomBtn.click();
        }
    }
});

// Add form validation feedback
function addFormValidation() {
    const inputs = document.querySelectorAll('.input-group input');
    
    inputs.forEach(input => {
        input.addEventListener('input', function() {
            const value = parseFloat(this.value);
            const min = parseFloat(this.min);
            const max = parseFloat(this.max);
            
            if (this.value && (isNaN(value) || value < min || value > max)) {
                this.style.borderColor = '#ff4757';
                this.style.backgroundColor = '#ffe6e6';
            } else {
                this.style.borderColor = '#e2e8f0';
                this.style.backgroundColor = 'white';
            }
        });
    });
}

// Initialize form validation
document.addEventListener('DOMContentLoaded', addFormValidation);

// Dark Mode Functions
function initializeDarkMode() {
    // Check for saved theme preference or default to light mode
    const savedTheme = localStorage.getItem('theme') || 'light';
    setTheme(savedTheme);
}

function toggleDarkMode() {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
}

function setTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    
    // Update toggle icon
    if (theme === 'dark') {
        toggleIcon.className = 'fas fa-sun';
        darkModeToggle.title = 'Switch to Light Mode';
    } else {
        toggleIcon.className = 'fas fa-moon';
        darkModeToggle.title = 'Switch to Dark Mode';
    }
}

// Pet Therapist Functions
function showPetTherapist() {
    // Randomly select a pet emoji and message
    const randomEmoji = petEmojis[Math.floor(Math.random() * petEmojis.length)];
    const randomMessage = petMessages[Math.floor(Math.random() * petMessages.length)];
    
    // Update pet content
    petEmoji.textContent = randomEmoji;
    petMessage.textContent = randomMessage;
    
    // Show the pet therapist with a slight delay for better UX
    setTimeout(() => {
        petTherapist.style.display = 'flex';
    }, 500);
}

function hidePetTherapist() {
    petTherapist.style.display = 'none';
}
