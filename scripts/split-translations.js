#!/usr/bin/env node

/**
 * Split large i18n.js into separate language files
 * This makes it easier to manage multiple languages
 */

const fs = require('fs');
const path = require('path');

const I18N_FILE = path.join(__dirname, '../i18n.js');
const LANGS_DIR = path.join(__dirname, '../i18n/languages');

// Create languages directory
if (!fs.existsSync(LANGS_DIR)) {
    fs.mkdirSync(LANGS_DIR, { recursive: true });
}

// Read the original file
let content = fs.readFileSync(I18N_FILE, 'utf8');

// Extract each language section
const languages = ['en', 'de', 'fr'];

for (const lang of languages) {
    // Match the language section
    const regex = new RegExp(`    ${lang}: {([\\s\\S]*?)    },`, 'm');
    const match = content.match(regex);
    
    if (match) {
        // Get just the translations object
        const langContent = match[1];
        
        // Create the individual language file
        const langFile = `// ${lang.toUpperCase()} Language Translations for UniLingo

const translations_${lang} = {
${langContent}};

// Export for use in main i18n.js
if (typeof module !== 'undefined' && module.exports) {
    module.exports = translations_${lang};
}
`;
        
        fs.writeFileSync(
            path.join(LANGS_DIR, `${lang}.js`),
            langFile,
            'utf8'
        );
        
        console.log(`✅ Created i18n/languages/${lang}.js`);
    }
}

console.log('\n✅ All language files created!');

