#!/usr/bin/env node

/**
 * Automated Translation Script for i18n.js
 * 
 * NEW FEATURES:
 * 1. Resume capability - saves progress incrementally, skips already-translated entries on restart
 * 2. Batching - translates multiple texts in single API call for faster, cheaper translation
 * 
 * Supports multiple translation services:
 * - Google Translate (FREE, good quality, all languages)
 * - DeepL (FREE, best quality for European languages)
 * - OpenAI GPT (PAID, best quality, all languages including complex ones)
 * - Microsoft Azure (FREE tier, good quality)
 * 
 * Usage:
 *   TRANSLATION_SERVICE=google node scripts/auto-translate.js fr
 *   TRANSLATION_SERVICE=deepl node scripts/auto-translate.js es
 *   TRANSLATION_SERVICE=openai node scripts/auto-translate.js zh
 *   TRANSLATION_SERVICE=azure node scripts/auto-translate.js ko
 * 
 * BATCH_SIZE environment variable controls how many texts to translate per batch (default: 10)
 *   BATCH_SIZE=20 TRANSLATION_SERVICE=openai node scripts/auto-translate.js zh-TW
 */

const fs = require('fs');
const path = require('path');

// Load environment variables from .env file
require('dotenv').config();

// Configuration
const LANGS_DIR = path.join(__dirname, '../i18n/languages');
const I18N_BUILD_FILE = path.join(__dirname, '../i18n.js');
const TARGET_LANGUAGE = process.argv[2] || 'fr';
const TRANSLATION_SERVICE = process.env.TRANSLATION_SERVICE || 'google'; // 'google', 'deepl', 'openai', 'azure'
const BATCH_SIZE = parseInt(process.env.BATCH_SIZE) || 10; // Number of texts to translate per batch

// Language codes mapping
const LANGUAGE_NAMES = {
    'fr': 'French', 'es': 'Spanish', 'it': 'Italian', 'pt': 'Portuguese',
    'de': 'German', 'nl': 'Dutch', 'pl': 'Polish', 'ru': 'Russian',
    'zh': 'Chinese (Simplified)', 'zh-CN': 'Chinese (Simplified)',
    'zh-TW': 'Chinese (Traditional)', 'ko': 'Korean', 'ja': 'Japanese',
    'ar': 'Arabic', 'hi': 'Hindi', 'tr': 'Turkish', 'th': 'Thai',
    'vi': 'Vietnamese', 'id': 'Indonesian', 'sv': 'Swedish',
    'da': 'Danish', 'fi': 'Finnish', 'no': 'Norwegian'
};

// Translation functions
async function translateWithGoogle(text, targetLang) {
    const { Translate } = require('@google-cloud/translate').v2;
    const translate = new Translate({ key: process.env.GOOGLE_TRANSLATE_API_KEY });
    const [translation] = await translate.translate(text, targetLang);
    return translation;
}

async function translateBatchWithGoogle(texts, targetLang) {
    const { Translate } = require('@google-cloud/translate').v2;
    const translate = new Translate({ key: process.env.GOOGLE_TRANSLATE_API_KEY });
    const [translations] = await translate.translate(texts, targetLang);
    return Array.isArray(translations) ? translations : [translations];
}

async function translateWithDeepL(text, targetLang) {
    const deepl = require('deepl-node');
    const translator = new deepl.Translator(process.env.DEEPL_API_KEY);
    const result = await translator.translateText(text, 'EN', targetLang.toUpperCase());
    return result.text;
}

async function translateBatchWithDeepL(texts, targetLang) {
    const deepl = require('deepl-node');
    const translator = new deepl.Translator(process.env.DEEPL_API_KEY);
    const results = await translator.translateText(texts, 'EN', targetLang.toUpperCase());
    return results.map(r => r.text);
}

async function translateWithOpenAI(text, targetLang) {
    const OpenAI = require('openai');
    const apiKey = process.env.OPENAI_API_KEY || process.env.EXPO_PUBLIC_OPENAI_API_KEY;
    
    if (!apiKey) {
        throw new Error('OpenAI API key not found. Set OPENAI_API_KEY or EXPO_PUBLIC_OPENAI_API_KEY');
    }
    
    const openai = new OpenAI({ apiKey });

    const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
            {
                role: "system",
                content: `You are a professional translator for a language learning app called UniLingo. Translate educational and UI text while maintaining professionalism and clarity.`
            },
            {
                role: "user",
                content: `Translate the following text to ${LANGUAGE_NAMES[targetLang] || targetLang}. Provide ONLY the translation:\n\n${text}`
            }
        ],
        temperature: 0.3,
        max_tokens: 500
    });

    return response.choices[0].message.content.trim();
}

async function translateBatchWithOpenAI(texts, targetLang) {
    const OpenAI = require('openai');
    const apiKey = process.env.OPENAI_API_KEY || process.env.EXPO_PUBLIC_OPENAI_API_KEY;
    
    if (!apiKey) {
        throw new Error('OpenAI API key not found. Set OPENAI_API_KEY or EXPO_PUBLIC_OPENAI_API_KEY');
    }
    
    const openai = new OpenAI({ apiKey });

    // Create numbered list for translation
    const numberedTexts = texts.map((text, idx) => `${idx + 1}. ${text}`).join('\n');
    
    const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
            {
                role: "system",
                content: `You are a professional translator for a language learning app called UniLingo. Translate educational and UI text while maintaining professionalism and clarity. Return ONLY the translations in the same numbered format, one per line.`
            },
            {
                role: "user",
                content: `Translate the following ${texts.length} texts to ${LANGUAGE_NAMES[targetLang] || targetLang}. Return ONLY the translations in numbered format (1. translation, 2. translation, etc.):\n\n${numberedTexts}`
            }
        ],
        temperature: 0.3,
        max_tokens: Math.min(4000, texts.length * 200) // Scale tokens with batch size
    });

    const result = response.choices[0].message.content.trim();
    
    // Parse numbered responses back into array
    const translations = [];
    const lines = result.split('\n');
    
    for (let i = 0; i < texts.length; i++) {
        // Look for line starting with "i+1."
        const pattern = new RegExp(`^${i + 1}\\.\\s*(.+)$`, 'm');
        const match = result.match(pattern);
        
        if (match) {
            translations.push(match[1].trim());
        } else {
            // Fallback: try to get by line index (in case numbering is off)
            if (lines[i]) {
                const cleaned = lines[i].replace(/^\d+\.\s*/, '').trim();
                translations.push(cleaned || texts[i]); // Use original if can't parse
            } else {
                translations.push(texts[i]); // Fallback to original
            }
        }
    }
    
    // If we didn't get enough translations, fall back to individual calls
    if (translations.length !== texts.length) {
        console.log(`  ⚠️  Batch parsing incomplete (${translations.length}/${texts.length}), falling back to individual calls...`);
        return null; // Signal to caller to fall back
    }
    
    return translations;
}

async function translateWithAzure(text, targetLang) {
    const axios = require('axios');
    const { v4: uuidv4 } = require('uuid');

    const endpoint = "https://api.cognitive.microsofttranslator.com";
    const location = process.env.AZURE_LOCATION || "global";

    const response = await axios({
        baseURL: endpoint,
        url: '/translate',
        method: 'post',
        headers: {
            'Ocp-Apim-Subscription-Key': process.env.AZURE_TRANSLATOR_KEY,
            'Ocp-Apim-Subscription-Region': location,
            'Content-type': 'application/json',
            'X-ClientTraceId': uuidv4().toString()
        },
        params: {
            'api-version': '3.0',
            'from': 'en',
            'to': targetLang
        },
        data: [{
            'text': text
        }],
        responseType: 'json'
    });

    return response.data[0].translations[0].text;
}

async function translateBatchWithAzure(texts, targetLang) {
    const axios = require('axios');
    const { v4: uuidv4 } = require('uuid');

    const endpoint = "https://api.cognitive.microsofttranslator.com";
    const location = process.env.AZURE_LOCATION || "global";

    const response = await axios({
        baseURL: endpoint,
        url: '/translate',
        method: 'post',
        headers: {
            'Ocp-Apim-Subscription-Key': process.env.AZURE_TRANSLATOR_KEY,
            'Ocp-Apim-Subscription-Region': location,
            'Content-type': 'application/json',
            'X-ClientTraceId': uuidv4().toString()
        },
        params: {
            'api-version': '3.0',
            'from': 'en',
            'to': targetLang
        },
        data: texts.map(text => ({ 'text': text })),
        responseType: 'json'
    });

    return response.data.map(item => item.translations[0].text);
}

async function translateWithTimeout(fn, timeoutMs = 60000) {
    const timeout = new Promise((_, reject) => {
        setTimeout(() => reject(new Error(`Timeout after ${timeoutMs}ms`)), timeoutMs);
    });
    const operation = fn();
    return Promise.race([operation, timeout]);
}

async function translateText(text, targetLang) {
    try {
        let translateFn;
        switch (TRANSLATION_SERVICE) {
            case 'deepl':
                translateFn = () => translateWithDeepL(text, targetLang);
                break;
            case 'openai':
                translateFn = () => translateWithOpenAI(text, targetLang);
                break;
            case 'azure':
                translateFn = () => translateWithAzure(text, targetLang);
                break;
            case 'google':
            default:
                translateFn = () => translateWithGoogle(text, targetLang);
                break;
        }
        
        // Add timeout protection
        return await translateWithTimeout(translateFn, 60000); // 60 second timeout
        
    } catch (error) {
        console.error(`\nTranslation error for "${text}":`, error.message);
        throw error;
    }
}

async function translateBatch(texts, targetLang) {
    try {
        let translateFn;
        switch (TRANSLATION_SERVICE) {
            case 'deepl':
                translateFn = () => translateBatchWithDeepL(texts, targetLang);
                break;
            case 'openai':
                translateFn = () => translateBatchWithOpenAI(texts, targetLang);
                break;
            case 'azure':
                translateFn = () => translateBatchWithAzure(texts, targetLang);
                break;
            case 'google':
            default:
                translateFn = () => translateBatchWithGoogle(texts, targetLang);
                break;
        }
        
        // Add timeout protection
        return await translateWithTimeout(translateFn, 120000); // 120 second timeout for batches
        
    } catch (error) {
        console.error(`\nBatch translation error:`, error.message);
        throw error;
    }
}

function checkServiceAvailability() {
    const checks = {
        'google': !!process.env.GOOGLE_TRANSLATE_API_KEY,
        'deepl': !!process.env.DEEPL_API_KEY,
        'openai': !!(process.env.OPENAI_API_KEY || process.env.EXPO_PUBLIC_OPENAI_API_KEY),
        'azure': !!process.env.AZURE_TRANSLATOR_KEY
    };

    if (!checks[TRANSLATION_SERVICE]) {
        console.error(`❌ Error: No API key found for ${TRANSLATION_SERVICE}!`);
        console.error('');
        
        switch (TRANSLATION_SERVICE) {
            case 'google':
                console.error('Set: GOOGLE_TRANSLATE_API_KEY');
                console.error('Get key: https://console.cloud.google.com/apis/credentials');
                break;
            case 'deepl':
                console.error('Set: DEEPL_API_KEY');
                console.error('Get key: https://www.deepl.com/pro-api');
                break;
            case 'openai':
                console.error('Set: OPENAI_API_KEY');
                console.error('Get key: https://platform.openai.com/api-keys');
                break;
            case 'azure':
                console.error('Set: AZURE_TRANSLATOR_KEY');
                console.error('Get key: https://azure.microsoft.com/en-us/products/cognitive-services/translator');
                break;
        }
        
        process.exit(1);
    }
}

function getServiceInfo() {
    const infos = {
        'google': { cost: 'FREE (500K chars/month)', quality: '85-95%' },
        'deepl': { cost: 'FREE (500K chars/month)', quality: '95-98%' },
        'openai': { cost: '~$0.20 per language', quality: '95-98%' },
        'azure': { cost: 'FREE (2M chars/month)', quality: '90-95%' }
    };
    return infos[TRANSLATION_SERVICE] || infos.google;
}

// Save content to file incrementally
function saveContent(content, langFile) {
    fs.writeFileSync(langFile, content, 'utf8');
}

async function translateFile() {
    const languageName = LANGUAGE_NAMES[TARGET_LANGUAGE] || TARGET_LANGUAGE;
    const serviceInfo = getServiceInfo();
    
    console.log(`🚀 Starting ${TRANSLATION_SERVICE.toUpperCase()} translation`);
    console.log(`   Language: ${languageName}`);
    console.log(`   Service: ${TRANSLATION_SERVICE} (${serviceInfo.quality} quality, ${serviceInfo.cost})`);
    console.log(`   Batch size: ${BATCH_SIZE} texts per API call`);
    console.log('');
    
    checkServiceAvailability();
    
    // Read the modular language file
    const langFile = path.join(LANGS_DIR, `${TARGET_LANGUAGE}.js`);
    
    if (!fs.existsSync(langFile)) {
        console.log(`❌ Language file not found: ${langFile}`);
        console.log(`Run: node scripts/add-language.js first`);
        return;
    }
    
    let content = fs.readFileSync(langFile, 'utf8');
    
    // Find all entries with [LANG] prefix (untranslated)
    const langPrefix = `[${TARGET_LANGUAGE.toUpperCase()}]`;
    const regex = new RegExp(`'([^']*)':\\s*'(${langPrefix.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')} [^']*)'`, 'g');
    
    const untranslatedEntries = [];
    let match;
    
    while ((match = regex.exec(content)) !== null) {
        const key = match[1];
        const fullText = match[2];
        const cleanText = fullText.replace(langPrefix + ' ', '');
        
        untranslatedEntries.push({
            key: key,
            fullText: fullText,
            cleanText: cleanText,
            matchStart: match.index,
            matchEnd: match.index + match[0].length
        });
    }
    
    // Check for already-translated entries
    const allKeyRegex = /'([^']*)':\s*'([^']*)'/g;
    const allMatches = Array.from(content.matchAll(allKeyRegex));
    const totalEntries = allMatches.length;
    const alreadyTranslated = totalEntries - untranslatedEntries.length;
    
    console.log(`📊 Translation Status:`);
    console.log(`   Total entries: ${totalEntries}`);
    console.log(`   Already translated: ${alreadyTranslated}`);
    console.log(`   Remaining: ${untranslatedEntries.length}`);
    console.log('');
    
    if (untranslatedEntries.length === 0) {
        console.log(`✅ All entries are already translated!`);
        console.log('🔨 Rebuilding i18n.js...');
        const { execSync } = require('child_process');
        execSync('node scripts/build-i18n.js', { stdio: 'inherit' });
        return;
    }
    
    console.log(`⏳ Translating ${untranslatedEntries.length} remaining entries in batches of ${BATCH_SIZE}...\n`);
    
    // Process in batches - re-scan after each batch to get fresh matches
    let translatedCount = 0;
    const totalToTranslate = untranslatedEntries.length;
    let batchNum = 0;
    
    while (true) {
        // Re-read content to get fresh matches (in case of file changes)
        content = fs.readFileSync(langFile, 'utf8');
        
        // Find remaining untranslated entries - recreate regex each time
        const remainingRegex = new RegExp(`'([^']*)':\\s*'(${langPrefix.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')} [^']*)'`, 'g');
        const remainingEntries = [];
        let match;
        while ((match = remainingRegex.exec(content)) !== null) {
            const key = match[1];
            const fullText = match[2];
            const cleanText = fullText.replace(langPrefix + ' ', '');
            
            remainingEntries.push({
                key: key,
                fullText: fullText,
                cleanText: cleanText
            });
        }
        
        if (remainingEntries.length === 0) {
            console.log(`\n✅ All entries translated!`);
            break;
        }
        
        const batch = remainingEntries.slice(0, BATCH_SIZE);
        batchNum++;
        const totalBatches = Math.ceil(remainingEntries.length / BATCH_SIZE);
        
        console.log(`\n📦 Batch ${batchNum} (${batch.length} texts, ${remainingEntries.length} remaining)`);
        
        try {
            // Try batch translation first
            let translations;
            let usedBatch = false;
            
            try {
                const texts = batch.map(item => item.cleanText);
                console.log(`  📡 Calling ${TRANSLATION_SERVICE.toUpperCase()} API (batch)...`);
                
                translations = await translateBatch(texts, TARGET_LANGUAGE);
                
                if (translations === null || translations.length !== batch.length) {
                    // Batch failed to parse correctly, fall back to individual
                    throw new Error('Batch parsing failed');
                }
                
                usedBatch = true;
                console.log(`  📥 Response received (${translations.length} translations)`);
                
            } catch (batchError) {
                // Fall back to individual translations
                console.log(`  ⚠️  Batch failed, using individual translations...`);
                translations = [];
                
                for (const item of batch) {
                    try {
                        const translation = await translateText(item.cleanText, TARGET_LANGUAGE);
                        translations.push(translation);
                    } catch (error) {
                        console.error(`  ❌ Failed to translate: "${item.cleanText.substring(0, 50)}..."`);
                        // Keep original placeholder on error
                        translations.push(item.fullText);
                    }
                }
            }
            
            // Update content with translations
            for (let i = 0; i < batch.length; i++) {
                const item = batch[i];
                const translated = translations[i];
                
                if (translated && translated !== item.fullText) {
                    // Replace in content - escape special regex chars
                    const escapedKey = item.key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                    const escapedFull = item.fullText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                    const escapedTranslated = translated.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
                    
                    // Use regex to find and replace the exact match
                    const oldPattern = new RegExp(`('${escapedKey}'):\\s*'${escapedFull}'`, 'g');
                    const replacement = `$1: '${escapedTranslated}'`;
                    
                    content = content.replace(oldPattern, replacement);
                    translatedCount++;
                }
            }
            
            // Save incrementally after each batch
            saveContent(content, langFile);
            console.log(`  💾 Saved progress (${translatedCount} total translated)`);
            
            // Rate limit protection (smaller delay for batches)
            if (remainingEntries.length > BATCH_SIZE) {
                await new Promise(resolve => setTimeout(resolve, usedBatch ? 500 : 200));
            }
            
        } catch (error) {
            console.error(`\n❌ ERROR in batch ${batchNum}:`);
            console.error(`   Error: ${error.message}`);
            
            // Save progress before exiting
            saveContent(content, langFile);
            console.log(`\n💾 Progress saved! You can restart the script to continue from here.`);
            console.log(`   Remaining: ${remainingEntries.length} entries`);
            process.exit(1);
        }
    }
    
    console.log(`\n✅ Translated ${translatedCount}/${totalToTranslate} entries\n`);
    
    // Rebuild i18n.js
    console.log('🔨 Rebuilding i18n.js...');
    const { execSync } = require('child_process');
    execSync('node scripts/build-i18n.js', { stdio: 'inherit' });
    
    console.log('💾 Complete! Review and test the translations.');
}

translateFile().catch(error => {
    console.error('❌ Fatal error:', error.message);
    console.error(error.stack);
    process.exit(1);
});
