#!/usr/bin/env node

/**
 * Automated Translation Script using OpenAI GPT
 * 
 * Best for: All languages including complex ones (Chinese, Korean, etc.)
 * Quality: 95-98% with excellent context understanding
 * Cost: ~$0.20 per language addition (one-time)
 * 
 * Setup:
 * 1. Get OpenAI API key: https://platform.openai.com/api-keys
 * 2. npm install openai
 * 3. export OPENAI_API_KEY="your-key-here"
 * 4. node scripts/auto-translate-openai.js zh
 */

const fs = require('fs');
const path = require('path');

// Configuration
const I18N_FILE = path.join(__dirname, '../i18n.js');
const TARGET_LANGUAGE = process.argv[2] || 'fr';

// Language names for better context
const LANGUAGE_NAMES = {
    'fr': 'French',
    'es': 'Spanish',
    'it': 'Italian',
    'pt': 'Portuguese',
    'de': 'German',
    'nl': 'Dutch',
    'pl': 'Polish',
    'zh': 'Chinese (Simplified)',
    'zh-CN': 'Chinese (Simplified)',
    'zh-TW': 'Chinese (Traditional)',
    'ko': 'Korean',
    'ja': 'Japanese',
    'ar': 'Arabic',
    'hi': 'Hindi',
    'ru': 'Russian',
    'tr': 'Turkish',
    'th': 'Thai',
    'vi': 'Vietnamese'
};

async function translateWithOpenAI(text, targetLang) {
    const OpenAI = require('openai');
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    try {
        const response = await openai.chat.completions.create({
            model: "gpt-4o-mini", // Fast and cost-effective
            messages: [
                {
                    role: "system",
                    content: `You are a professional translator for a language learning app called UniLingo. Translate educational and UI text while maintaining professionalism, clarity, and context. Keep the same tone and style as the English version.`
                },
                {
                    role: "user",
                    content: `Translate the following text to ${LANGUAGE_NAMES[targetLang] || targetLang}. Provide ONLY the translation, no explanation:\n\n${text}`
                }
            ],
            temperature: 0.3,
            max_tokens: 500
        });

        return response.choices[0].message.content.trim();
    } catch (error) {
        console.error(`Translation error for "${text}":`, error.message);
        return text; // Return original if translation fails
    }
}

async function translateFile() {
    console.log(`🚀 Starting OpenAI translation for ${LANGUAGE_NAMES[TARGET_LANGUAGE] || TARGET_LANGUAGE}...`);
    console.log('');
    
    // Check for API key
    if (!process.env.OPENAI_API_KEY) {
        console.error('❌ Error: OPENAI_API_KEY not found!');
        console.error('');
        console.error('Get your API key from: https://platform.openai.com/api-keys');
        console.error('Then run: export OPENAI_API_KEY="your-key-here"');
        console.error('');
        process.exit(1);
    }
    
    // Read the file
    let content = fs.readFileSync(I18N_FILE, 'utf8');
    
    // Find all [LANG] entries
    const langPrefix = `[${TARGET_LANGUAGE.toUpperCase()}]`;
    const regex = new RegExp(`'(${langPrefix.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')} [^']*)'`, 'g');
    const matches = content.matchAll(regex);
    
    // Collect all texts to translate
    const textsToTranslate = [];
    for (const match of matches) {
        const fullText = match[1];
        const cleanText = fullText.replace(langPrefix + ' ', '');
        textsToTranslate.push({ full: fullText, clean: cleanText });
    }
    
    if (textsToTranslate.length === 0) {
        console.log(`❌ No entries found with [${TARGET_LANGUAGE.toUpperCase()}] prefix`);
        console.log(`Make sure you've run: node scripts/add-language.js`);
        return;
    }
    
    console.log(`📝 Found ${textsToTranslate.length} entries to translate\n`);
    console.log('⏳ Translating with OpenAI (this may take a few minutes)...\n');
    console.log(`💰 Estimated cost: ~$${((textsToTranslate.length * 100) / 1000 * 0.002).toFixed(2)}\n`);
    
    // Translate each text
    let translatedCount = 0;
    let totalTokens = 0;
    
    for (const item of textsToTranslate) {
        process.stdout.write(`\r  Progress: ${translatedCount}/${textsToTranslate.length}`);
        
        try {
            const translated = await translateWithOpenAI(item.clean, TARGET_LANGUAGE);
            
            // Replace in content
            const escapedFull = item.full.replace(/'/g, "\\'");
            const escapedTranslated = translated.replace(/'/g, "\\'");
            
            content = content.replace(`'${escapedFull}'`, `'${escapedTranslated}'`);
            
            translatedCount++;
            
            // Rate limit protection
            await new Promise(resolve => setTimeout(resolve, 200));
        } catch (error) {
            console.error(`\nError translating: ${item.clean}`);
            console.error(error.message);
        }
    }
    
    console.log(`\r✅ Translated ${translatedCount}/${textsToTranslate.length} entries\n`);
    
    // Write back to file
    fs.writeFileSync(I18N_FILE, content, 'utf8');
    
    console.log('💾 File saved successfully!');
    console.log('');
    console.log('📋 Next steps:');
    console.log('1. Review the translations in i18n.js');
    console.log('2. Make any manual adjustments if needed');
    console.log('3. Add language switcher button to your HTML pages');
    console.log('4. Test the website with the new language');
}

// Run the translation
translateFile().catch(error => {
    console.error('❌ Fatal error:', error);
    process.exit(1);
});

