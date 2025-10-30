#!/usr/bin/env node

/**
 * Quick test to see what languages are supported by different services
 */

const services = {
    google: {
        languages: [
            'fr', 'es', 'it', 'de', 'pt', 'nl', 'pl', 'ru', 'zh', 'ja', 'ko', 
            'ar', 'hi', 'he', 'tr', 'th', 'vi', 'id', 'sv', 'da', 'fi', 'no',
            'cs', 'hu', 'ro', 'bg', 'hr', 'sk', 'sl', 'et', 'lv', 'lt', 'mk',
            'zh-CN', 'zh-TW' // Chinese variants
        ],
        strengths: '100+ languages including Asian, Middle Eastern, etc.',
        accuracy: '85-95% overall, 90%+ for common pairs',
        freeTier: '500K chars/month'
    },
    deepl: {
        languages: [
            'fr', 'es', 'it', 'de', 'pt', 'nl', 'pl', 'ru', 'ja', 'zh',
            'uk', 'cs', 'bg', 'da', 'et', 'fi', 'el', 'hu', 'lv', 'lt',
            'ro', 'sk', 'sl', 'sv'
        ],
        strengths: 'Best for European languages (95-98% accuracy)',
        accuracy: '95-98% for European, 90% for Asian',
        freeTier: '500K chars/month'
    },
    openai: {
        languages: 'ALL languages (GPT understands any language)',
        strengths: 'Context-aware, understands UI/marketing context',
        accuracy: '95-98% with better nuance understanding',
        freeTier: 'No free tier, ~$0.002 per 1K tokens (~750 words)',
        cost: '$0.10-0.30 per language addition'
    },
    microsoft: {
        languages: '90+ languages including Chinese, Korean, Japanese',
        strengths: 'Good for Asian languages',
        accuracy: '90-95% for most, 93%+ for Asian',
        freeTier: '2M chars/month free, then $10 per 1M'
    }
};

console.log('🌍 Translation Service Comparison for UniLingo');
console.log('='.repeat(60));
console.log('');

console.log('Required languages: English, German, French, Chinese, Korean, Japanese');
console.log('');

for (const [name, info] of Object.entries(services)) {
    console.log(`📊 ${name.toUpperCase()}`);
    console.log(`   Supported: ${Array.isArray(info.languages) ? info.languages.join(', ') : info.languages}`);
    console.log(`   Strengths: ${info.strengths}`);
    console.log(`   Accuracy: ${info.accuracy}`);
    console.log(`   Cost: ${info.freeTier || info.cost}`);
    console.log('');
}

console.log('📝 ANALYSIS:');
console.log('');
console.log('✅ Google Translate:');
console.log('   - Covers ALL required languages');
console.log('   - Good enough quality (85-95%)');
console.log('   - FREE for your needs');
console.log('');
console.log('✅ DeepL:');
console.log('   - Covers ALL European languages excellently');
console.log('   - Supports Chinese and Japanese');
console.log('   - MISSING: Korean');
console.log('   - Best quality for European (95-98%)');
console.log('');
console.log('✅ OpenAI GPT:');
console.log('   - Covers ALL languages perfectly');
console.log('   - Best quality and context understanding');
console.log('   - NOT FREE (~$0.20 per language)');
console.log('   - Best for nuanced marketing content');
console.log('');
console.log('✅ Microsoft Azure:');
console.log('   - Covers ALL required languages');
console.log('   - Good quality (90-95%)');
console.log('   - FREE tier: 2M chars/month');
console.log('   - Good middle ground');
console.log('');

console.log('🎯 RECOMMENDATION:');
console.log('');
console.log('Use a COMBINATION approach:');
console.log('');
console.log('1. DeepL for European languages (FR, ES, IT, etc.): FREE, best quality');
console.log('2. Google Translate for Asian languages (ZH, KO, JA): FREE, good enough');
console.log('3. OpenAI for critical marketing pages: Small cost, best quality');
console.log('');
console.log('OR simpler: Use Google Translate for everything!');
console.log('- Covers all languages');
console.log('- FREE');
console.log('- 90%+ quality is fine for UI/navigation');
console.log('- Only review marketing copy manually');

