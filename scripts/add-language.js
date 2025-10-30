#!/usr/bin/env node

/**
 * Add a new language to i18n/languages/
 * 
 * This script ensures 100% accuracy by:
 * 1. Reading the English language file
 * 2. Creating a new modular language file with all the same keys
 * 3. Creating placeholder translations based on English
 * 4. Rebuilding i18n.js
 */

const fs = require('fs');
const path = require('path');

// Configuration - get language code from command line or default to 'es' (Spanish)
const NEW_LANGUAGE_CODE = process.argv[2] || 'es';
const NEW_LANGUAGE_DISPLAY = process.argv[3] || 'Spanish';

// Paths
const LANGS_DIR = path.join(__dirname, '../i18n/languages');
const EN_FILE = path.join(LANGS_DIR, 'en.js');
const NEW_LANG_FILE = path.join(LANGS_DIR, `${NEW_LANGUAGE_CODE}.js`);

// Check if language already exists
if (fs.existsSync(NEW_LANG_FILE)) {
    console.log(`⚠️  ${NEW_LANGUAGE_DISPLAY} (${NEW_LANGUAGE_CODE}) already exists!`);
    console.log(`File: ${NEW_LANG_FILE}`);
    console.log('Please delete it first if you want to regenerate.');
    process.exit(1);
}

// Read English file
if (!fs.existsSync(EN_FILE)) {
    console.error(`❌ English file not found: ${EN_FILE}`);
    console.error('Run: node scripts/build-i18n.js first');
    process.exit(1);
}

const enContent = fs.readFileSync(EN_FILE, 'utf8');

// Extract all keys and values from English file
function parseTranslationSection(content) {
    const keys = {};
    
    // Match key-value pairs
    const regex = /'([^']*(?:\\'[^']*)*)':\s*'([^']*(?:\\'[^']*)*)'/g;
    let match;
    
    while ((match = regex.exec(content)) !== null) {
        keys[match[1]] = match[2];
    }
    
    return keys;
}

const enKeys = parseTranslationSection(enContent);
const enKeyList = Object.keys(enKeys);

console.log(`📝 Generating ${NEW_LANGUAGE_DISPLAY} (${NEW_LANGUAGE_CODE}) translations...`);
console.log(`Total keys to translate: ${enKeyList.length}\n`);

// Generate new language file with placeholders
// Replace hyphens with underscores in variable names (JavaScript doesn't allow hyphens in identifiers)
const varName = NEW_LANGUAGE_CODE.replace(/-/g, '_');
let newLangContent = `// ${NEW_LANGUAGE_CODE.toUpperCase()} Language Translations for UniLingo
// Auto-generated placeholder file

const translations_${varName} = {
`;

const langPrefix = `[${NEW_LANGUAGE_CODE.toUpperCase()}]`;

for (const key of enKeyList) {
    const englishValue = enKeys[key];
    
    // Add placeholder prefix
    const placeholderValue = `${langPrefix} ${englishValue}`;
    
    // Properly escape for JavaScript string
    const escapedValue = placeholderValue.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
    
    newLangContent += `    '${key}': '${escapedValue}',\n`;
}

newLangContent += `};

// Export for use in main i18n.js
if (typeof module !== 'undefined' && module.exports) {
    module.exports = translations_${varName};
}

// Export to window for browser use
if (typeof window !== 'undefined') {
    window.translations_${varName} = translations_${varName};
}
`;

// Write the new language file
fs.writeFileSync(NEW_LANG_FILE, newLangContent, 'utf8');
console.log(`✅ Created ${NEW_LANG_FILE}\n`);

// Rebuild i18n.js
console.log('🔨 Rebuilding i18n.js...');
const { execSync } = require('child_process');
execSync('node scripts/build-i18n.js', { stdio: 'inherit' });

console.log(`\n✅ Successfully added ${NEW_LANGUAGE_DISPLAY} (${NEW_LANGUAGE_CODE})!`);
console.log(`\n📋 Next steps:`);
console.log(`1. Run: TRANSLATION_SERVICE=openai node scripts/auto-translate.js ${NEW_LANGUAGE_CODE}`);
console.log(`2. Review the translations in i18n/languages/${NEW_LANGUAGE_CODE}.js`);
console.log(`3. Test the language switcher on your website\n`);

console.log(`💡 Alternative: Review and translate manually if preferred`);
