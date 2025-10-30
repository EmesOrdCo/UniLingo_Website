#!/usr/bin/env node

/**
 * Build i18n.js from modular language files
 * This allows us to work with separate files during development
 * but generate a single file for production
 */

const fs = require('fs');
const path = require('path');

const LANGS_DIR = path.join(__dirname, '../i18n/languages');
const OUTPUT_FILE = path.join(__dirname, '../i18n.js');

// Language display names mapping
const LANG_NAMES = {
    'en': '🇬🇧 English',
    'de': '🇩🇪 Deutsch',
    'fr': '🇫🇷 Français',
    'es': '🇪🇸 Español',
    'it': '🇮🇹 Italiano',
    'pt': '🇵🇹 Português',
    'nl': '🇳🇱 Nederlands',
    'pl': '🇵🇱 Polski',
    'ru': '🇷🇺 Русский',
    'zh': '🇨🇳 简体中文',
    'zh-TW': '🇹🇼 繁體中文',
    'ko': '🇰🇷 한국어',
    'ja': '🇯🇵 日本語',
    'ar': '🇸🇦 العربية',
    'hi': '🇮🇳 हिन्दी'
};

// Get all language files
const languageFiles = fs.readdirSync(LANGS_DIR)
    .filter(file => file.endsWith('.js'))
    .map(file => ({
        code: file.replace('.js', ''),
        path: path.join(LANGS_DIR, file)
    }));

console.log(`📝 Building i18n.js from ${languageFiles.length} language files...\n`);

// Start building the combined file
let combinedContent = `// Internationalization (i18n) System for UniLingo
// Auto-generated from modular language files
// Generated: ${new Date().toISOString()}

const translations = {

`;

// Read and add each language file
languageFiles.forEach((lang, index) => {
    console.log(`  Adding ${lang.code}...`);
    
    const content = fs.readFileSync(lang.path, 'utf8');
    
    // Extract just the translations object content
    // Support language codes with hyphens (e.g., zh-TW becomes zh_TW in variable name)
    const match = content.match(/const translations_[\w_]+ = \{([\s\S]*)\};/);
    
    if (match) {
        const translationsContent = match[1];
        
        // Quote language codes that contain hyphens or special characters
        const langKey = lang.code.includes('-') ? `'${lang.code}'` : lang.code;
        
        combinedContent += `    ${langKey}: {${translationsContent}
    }`;
        
        // Add comma if not last language
        if (index < languageFiles.length - 1) {
            combinedContent += ',\n\n';
        } else {
            combinedContent += '\n\n';
        }
    }
});

// Build langNames object dynamically
let langNamesContent = '{\n';
languageFiles.forEach((lang, index) => {
    const displayName = LANG_NAMES[lang.code] || lang.code;
    langNamesContent += `            '${lang.code}': '${displayName}'`;
    if (index < languageFiles.length - 1) {
        langNamesContent += ',\n';
    } else {
        langNamesContent += '\n';
    }
});
langNamesContent += '        }';

// Add the rest of the i18n system
combinedContent += `};

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
        return translations[this.currentLanguage]?.[key] || translations.en[key] || key;
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
        const langNames = ${langNamesContent};
        
        // Update current language display (for dropdown button)
        const currentLangDisplay = document.getElementById('current-lang');
        const currentLangMobile = document.getElementById('current-lang-mobile');
        
        if (currentLangDisplay) {
            currentLangDisplay.textContent = langNames[this.currentLanguage];
        }
        
        if (currentLangMobile) {
            currentLangMobile.textContent = langNames[this.currentLanguage];
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
}
`;

// Write the combined file
fs.writeFileSync(OUTPUT_FILE, combinedContent, 'utf8');

console.log(`\n✅ Built ${OUTPUT_FILE}`);
console.log(`   Total lines: ${combinedContent.split('\\n').length}`);
console.log(`   Languages: ${languageFiles.map(l => l.code).join(', ')}`);

