// i18n Loader - Dynamically loads modular language files
// This replaces the monolithic i18n.js file

// Language display names mapping
const LANG_NAMES = {
    'en': '🇬🇧 English',
    'de': '🇩🇪 Deutsch',
    'fr': '🇫🇷 Français',
    'es': '🇪🇸 Español',
    'it': '🇮🇹 Italiano',
    'pt': '🇵🇹 Português',
    'pl': '🇵🇱 Polski',
    'hi': '🇮🇳 हिन्दी',
    'yue': '🇭🇰 粵語',
    'zh': '🇨🇳 简体中文',
    'zh-TW': '🇹🇼 繁體中文'
};

// Translations object - will be populated by loaded language files
const translations = {};

// Available language codes
const LANGUAGE_CODES = ['en', 'de', 'fr', 'es', 'it', 'pt', 'pl', 'hi', 'yue', 'zh', 'zh-TW'];

// Variable name mapping for each language
const VAR_NAME_MAP = {
    'en': 'translations_en',
    'de': 'translations_de',
    'fr': 'translations_fr',
    'es': 'translations_es',
    'it': 'translations_it',
    'pt': 'translations_pt',
    'pl': 'translations_pl',
    'hi': 'translations_hi',
    'yue': 'translations_yue',
    'zh': 'translations_zh',
    'zh-TW': 'translations_zh_TW'  // Use underscore instead of hyphen
};

// Load all language files dynamically
function loadAllLanguages() {
    return new Promise((resolve) => {
        let loadedCount = 0;
        const totalLanguages = LANGUAGE_CODES.length;
        
        LANGUAGE_CODES.forEach(langCode => {
            const script = document.createElement('script');
            script.src = `i18n/languages/${langCode}.js`;
            script.async = true;
            
            script.onload = () => {
                // Get the translations from window object
                const varName = VAR_NAME_MAP[langCode];
                // Use bracket notation to handle hyphenated variable names
                const langTranslations = window[varName] || window[`translations_${langCode}`] || window['translations_' + langCode];
                
                if (langTranslations) {
                    translations[langCode] = langTranslations;
                }
                
                loadedCount++;
                if (loadedCount === totalLanguages) {
                    resolve();
                }
            };
            
            script.onerror = () => {
                console.warn(`Failed to load language file: ${langCode}.js`);
                loadedCount++;
                if (loadedCount === totalLanguages) {
                    resolve();
                }
            };
            
            document.head.appendChild(script);
        });
    });
}

// Language management
const i18n = {
    currentLanguage: 'en',
    
    // Initialize i18n system
    init() {
        // Get saved language preference or default to English
        this.currentLanguage = localStorage.getItem('unilingo_lang') || 'en';
        
        // Apply translations
        this.translatePage();
        
        // Update language switcher UI
        this.updateLanguageSwitcher();
    },
    
    // Translate the entire page
    translatePage() {
        // Find all elements with data-i18n attribute
        const elements = document.querySelectorAll('[data-i18n]');
        
        elements.forEach(element => {
            const key = element.getAttribute('data-i18n');
            const translation = this.t(key);
            
            if (translation) {
                // Handle different element types
                if (element.tagName === 'INPUT' && element.type === 'submit') {
                    element.value = translation;
                } else if (element.tagName === 'SPAN' && element.parentElement.tagName === 'BUTTON') {
                    // Preserve button icon if span is inside a button
                    element.textContent = translation;
                } else {
                    element.textContent = translation;
                }
            }
        });
        
        // Handle data-i18n-placeholder attributes
        const placeholderElements = document.querySelectorAll('[data-i18n-placeholder]');
        placeholderElements.forEach(element => {
            const key = element.getAttribute('data-i18n-placeholder');
            const translation = this.t(key);
            if (translation) {
                element.placeholder = translation;
            }
        });
        
        // Update HTML lang attribute
        document.documentElement.lang = this.currentLanguage;
    },
    
    // Get translation by key
    t(key) {
        return translations[this.currentLanguage]?.[key] || translations.en?.[key] || key;
    },
    
    // Change language
    changeLanguage(lang) {
        if (translations[lang]) {
            this.currentLanguage = lang;
            localStorage.setItem('unilingo_lang', lang);
            this.translatePage();
            this.updateLanguageSwitcher();
            
            // Close all dropdowns
            document.querySelectorAll('.lang-dropdown').forEach(dropdown => {
                dropdown.style.display = 'none';
            });
        }
    },
    
    // Update language switcher button
    updateLanguageSwitcher() {
        const langNames = LANG_NAMES;
        
        // Update current language display (for dropdown button)
        const currentLangDisplay = document.getElementById('current-lang');
        const currentLangMobile = document.getElementById('current-lang-mobile');
        
        if (currentLangDisplay) {
            currentLangDisplay.textContent = langNames[this.currentLanguage] || this.currentLanguage;
        }
        
        if (currentLangMobile) {
            currentLangMobile.textContent = langNames[this.currentLanguage] || this.currentLanguage;
        }
        
        // Update active state for dropdown options
        const allOptions = document.querySelectorAll('.lang-option');
        allOptions.forEach(option => {
            const optionLang = option.getAttribute('data-lang');
            if (optionLang === this.currentLanguage) {
                option.classList.add('active');
            } else {
                option.classList.remove('active');
            }
        });
    }
};

// Expose to window for global access
if (typeof window !== 'undefined') {
    window.i18n = i18n;
    window.translations = translations; // Also expose translations for debugging
    
    // Load languages and initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', async () => {
            await loadAllLanguages();
            i18n.init();
        });
    } else {
        loadAllLanguages().then(() => {
            i18n.init();
        });
    }
}
