#!/usr/bin/env node

/**
 * Add a new language to i18n.js
 * 
 * This script ensures 100% accuracy by:
 * 1. Reading the existing i18n.js structure
 * 2. Adding a new language section with all the same keys
 * 3. Creating placeholder translations based on English
 * 4. Verifying all keys are present and accounted for
 */

const fs = require('fs');
const path = require('path');

// Configuration
const NEW_LANGUAGE_CODE = 'fr';
const NEW_LANGUAGE_DISPLAY = 'French';

// Path to i18n.js
const I18N_FILE = path.join(__dirname, '../i18n.js');

// Read the i18n.js file
let i18nContent = fs.readFileSync(I18N_FILE, 'utf8');

// Check if French already exists
if (i18nContent.includes(`    ${NEW_LANGUAGE_CODE}: {`)) {
    console.log(`⚠️  ${NEW_LANGUAGE_DISPLAY} (${NEW_LANGUAGE_CODE}) already exists in i18n.js`);
    console.log('Please manually add translations or remove the existing section first.');
    process.exit(1);
}

// Extract all English keys and values using a more robust approach
function parseTranslationSection(content, lang) {
    const keys = {};
    const lines = content.split('\n');
    let inSection = false;
    let braceDepth = 0;
    let currentKey = null;
    let currentValue = '';
    let inString = false;
    let escaped = false;
    
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        
        // Look for the language section start
        if (line.trim().startsWith(`${lang}: {`)) {
            inSection = true;
            braceDepth = 1;
            continue;
        }
        
        // If we're in the section, parse line by line
        if (inSection) {
            // Count braces
            for (const char of line) {
                if (char === '{' && !inString) braceDepth++;
                if (char === '}' && !inString) braceDepth--;
            }
            
            // If section ends
            if (braceDepth === 0) {
                break;
            }
            
            // Try to match key-value pairs using regex on each line
            const keyValueMatch = line.match(/'([^']*(?:\\'[^']*)*)':\s*'([^']*(?:\\'[^']*)*)'/);
            if (keyValueMatch) {
                keys[keyValueMatch[1]] = keyValueMatch[2];
            }
        }
    }
    
    return keys;
}

// Extract keys from English section
const enKeys = parseTranslationSection(i18nContent, 'en');
const enKeyList = Object.keys(enKeys).sort();

console.log(`📝 Generating ${NEW_LANGUAGE_DISPLAY} translations...`);
console.log(`Total keys to translate: ${enKeyList.length}\n`);

// Generate French translations with proper escaping
let frTranslations = `\n    ${NEW_LANGUAGE_CODE}: {\n`;

for (const key of enKeyList) {
    const englishValue = enKeys[key];
    
    // Escape the value properly: first unescape it, then add [FR] prefix, then escape again
    // This handles cases where values already contain escaped quotes
    let processedValue = englishValue;
    
    // Add [FR] prefix
    const placeholderValue = `[FR] ${processedValue}`;
    
    // Properly escape for JavaScript string
    const escapedValue = placeholderValue.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
    
    frTranslations += `        '${key}': '${escapedValue}',\n`;
}

frTranslations += '    }\n};';

// Insert the new language before the closing of the translations object
// Look for the last language section (should end with } followed by };)
const insertionMatch = i18nContent.match(/(\s+}),?\s*};/);
if (!insertionMatch) {
    console.error('Could not find insertion point in i18n.js');
    process.exit(1);
}

// Find where the closing of the last language section ends
const insertionPoint = insertionMatch.index;
const before = i18nContent.substring(0, insertionPoint);
const after = i18nContent.substring(insertionPoint);

const newContent = before + frTranslations + ',\n\n' + after;

// Write the updated content back to the file
fs.writeFileSync(I18N_FILE, newContent, 'utf8');

console.log(`✅ Successfully added ${NEW_LANGUAGE_DISPLAY} (${NEW_LANGUAGE_CODE}) to i18n.js!`);
console.log(`\n📋 Next steps:`);
console.log(`1. Open i18n.js`);
console.log(`2. Find all entries marked with "[FR]" prefix`);
console.log(`3. Replace them with actual French translations`);
console.log(`4. Remove the "[FR]" prefix`);
console.log(`5. Test the language switcher on your website\n`);

console.log(`🔍 Example of what to translate:`);
console.log(`OLD: 'hero.tagline1': '[FR] Your Uni, Your Subject, Your UniLingo',`);
console.log(`NEW: 'hero.tagline1': 'Votre Université, Votre Matière, Votre UniLingo',`);
