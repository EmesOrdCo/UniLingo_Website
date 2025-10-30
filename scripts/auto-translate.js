#!/usr/bin/env node

/**
 * Automated Translation Script for i18n.js
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
 */

const fs = require('fs');
const path = require('path');

// Load environment variables from .env file
require('dotenv').config();

// Configuration
const I18N_FILE = path.join(__dirname, '../i18n.js');
const TARGET_LANGUAGE = process.argv[2] || 'fr';
const TRANSLATION_SERVICE = process.env.TRANSLATION_SERVICE || 'google'; // 'google', 'deepl', 'openai', 'azure'

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

async function translateWithDeepL(text, targetLang) {
    const deepl = require('deepl-node');
    const translator = new deepl.Translator(process.env.DEEPL_API_KEY);
    const result = await translator.translateText(text, 'EN', targetLang.toUpperCase());
    return result.text;
}

async function translateWithOpenAI(text, targetLang) {
    const OpenAI = require('openai');
    const apiKey = process.env.OPENAI_API_KEY || process.env.EXPO_PUBLIC_OPENAI_API_KEY;
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
                content: `Translate to ${LANGUAGE_NAMES[targetLang] || targetLang}. Provide ONLY the translation:\n\n${text}`
            }
        ],
        temperature: 0.3,
        max_tokens: 500
    });

    return response.choices[0].message.content.trim();
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

async function translateText(text, targetLang) {
    try {
        switch (TRANSLATION_SERVICE) {
            case 'deepl':
                return await translateWithDeepL(text, targetLang);
            case 'openai':
                return await translateWithOpenAI(text, targetLang);
            case 'azure':
                return await translateWithAzure(text, targetLang);
            case 'google':
            default:
                return await translateWithGoogle(text, targetLang);
        }
    } catch (error) {
        console.error(`\nTranslation error for "${text}":`, error.message);
        return text;
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

async function translateFile() {
    const languageName = LANGUAGE_NAMES[TARGET_LANGUAGE] || TARGET_LANGUAGE;
    const serviceInfo = getServiceInfo();
    
    console.log(`🚀 Starting ${TRANSLATION_SERVICE.toUpperCase()} translation`);
    console.log(`   Language: ${languageName}`);
    console.log(`   Service: ${TRANSLATION_SERVICE} (${serviceInfo.quality} quality, ${serviceInfo.cost})`);
    console.log('');
    
    checkServiceAvailability();
    
    // Read the file
    let content = fs.readFileSync(I18N_FILE, 'utf8');
    
    // Find all [LANG] entries
    const langPrefix = `[${TARGET_LANGUAGE.toUpperCase()}]`;
    const regex = new RegExp(`'(${langPrefix.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')} [^']*)'`, 'g');
    const matches = Array.from(content.matchAll(regex));
    
    if (matches.length === 0) {
        console.log(`❌ No entries found with [${TARGET_LANGUAGE.toUpperCase()}] prefix`);
        console.log(`Run: node scripts/add-language.js first`);
        return;
    }
    
    console.log(`📝 Found ${matches.length} entries to translate\n`);
    console.log('⏳ Translating...\n');
    
    // Translate each text
    let translatedCount = 0;
    for (const match of matches) {
        const fullText = match[1];
        const cleanText = fullText.replace(langPrefix + ' ', '');
        
        process.stdout.write(`\r  ${translatedCount}/${matches.length}`);
        
        const translated = await translateText(cleanText, TARGET_LANGUAGE);
        
        // Replace in content
        const escapedFull = fullText.replace(/'/g, "\\'");
        const escapedTranslated = translated.replace(/'/g, "\\'");
        
        content = content.replace(`'${escapedFull}'`, `'${escapedTranslated}'`);
        
        translatedCount++;
        
        // Rate limit protection
        await new Promise(resolve => setTimeout(resolve, 200));
    }
    
    console.log(`\r✅ Translated ${translatedCount}/${matches.length} entries\n`);
    
    // Write back
    fs.writeFileSync(I18N_FILE, content, 'utf8');
    
    console.log('💾 Saved! Review and test the translations.');
}

translateFile().catch(error => {
    console.error('❌ Fatal error:', error.message);
    process.exit(1);
});
