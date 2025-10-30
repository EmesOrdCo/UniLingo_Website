# UniLingo i18n System

## Overview

The i18n system has been refactored from a single monolithic file (`i18n.js`) into a modular structure that's much easier to maintain when adding multiple languages.

## Architecture

### Modular Structure

```
i18n/
├── README.md (this file)
└── languages/
    ├── en.js (English - source language)
    ├── de.js (German)
    └── fr.js (French)
```

### Build System

The `i18n.js` file is now **auto-generated** from the modular language files using the build script:

```bash
node scripts/build-i18n.js
```

This allows us to:
- ✅ Work with separate language files during development
- ✅ Generate a single optimized file for production
- ✅ Keep git history clean with language-specific changes
- ✅ Easily add new languages without one huge file

## Adding a New Language

### Step 1: Create Language File

Run the script to create a new language file with all English keys:

```bash
node scripts/add-language.js <lang-code> <display-name>

# Examples:
node scripts/add-language.js es Spanish
node scripts/add-language.js zh "Chinese (Simplified)"
node scripts/add-language.js ko Korean
```

This will:
- Create `i18n/languages/<lang-code>.js`
- Add placeholders with `[LANG]` prefix
- Rebuild `i18n.js` automatically

### Step 2: Translate Content

You have two options:

#### Option A: Automated Translation (Recommended)

```bash
# Using OpenAI (best quality)
TRANSLATION_SERVICE=openai node scripts/auto-translate.js <lang-code>

# Using DeepL (excellent for European languages)
TRANSLATION_SERVICE=deepl node scripts/auto-translate.js <lang-code>

# Using Google Translate (good quality, free)
TRANSLATION_SERVICE=google node scripts/auto-translate.js <lang-code>
```

This will:
- Read the language file
- Translate all `[LANG]` entries
- Rebuild `i18n.js` automatically

#### Option B: Manual Translation

1. Open `i18n/languages/<lang-code>.js`
2. Find entries with `[LANG]` prefix
3. Replace with actual translations
4. Run `node scripts/build-i18n.js` when done

### Step 3: Add Language Display Name

Update `scripts/build-i18n.js` to add your language to the `LANG_NAMES` mapping:

```javascript
const LANG_NAMES = {
    // ... existing languages
    'es': '🇪🇸 Español',
};
```

### Step 4: Rebuild

```bash
node scripts/build-i18n.js
```

## Git Workflow

### Files to Track

✅ **Track** (committed to git):
- `i18n/languages/*.js` - Source language files
- `scripts/*.js` - Build and translation scripts
- `.gitignore` - Configuration

❌ **Don't Track** (auto-generated):
- `i18n.js` - Generated file (in `.gitignore`)

### Development

1. Edit language files in `i18n/languages/`
2. Rebuild: `node scripts/build-i18n.js`
3. Test locally
4. Commit language files
5. Don't commit `i18n.js`

### Production Deployment

**Important**: Your deployment process needs to build `i18n.js`!

Add to your build script or CI/CD:

```bash
npm run build  # or your existing build
node scripts/build-i18n.js  # Add this line
```

Or update `package.json`:

```json
{
  "scripts": {
    "build": "node scripts/build-i18n.js"
  }
}
```

## File Structure

### Language File Format

Each language file (`i18n/languages/*.js`) contains:

```javascript
// EN Language Translations for UniLingo

const translations_en = {
    // Navigation
    'nav.features': 'Features',
    'nav.howItWorks': 'How It Works',
    // ... more keys
};

// Export for use in main i18n.js
if (typeof module !== 'undefined' && module.exports) {
    module.exports = translations_en;
}
```

### Generated i18n.js Structure

```javascript
// Internationalization (i18n) System for UniLingo
// Auto-generated from modular language files

const translations = {
    en: { /* ... */ },
    de: { /* ... */ },
    fr: { /* ... */ }
};

const i18n = {
    // ... translation logic
};
```

## Supported Languages

Currently implemented:
- 🇬🇧 English (en) - Source language
- 🇩🇪 German (de) - Complete
- 🇫🇷 French (fr) - Complete

Supported by build system:
- 🇪🇸 Spanish (es)
- 🇮🇹 Italian (it)
- 🇵🇹 Portuguese (pt)
- 🇳🇱 Dutch (nl)
- 🇵🇱 Polish (pl)
- 🇷🇺 Russian (ru)
- 🇨🇳 Chinese (zh)
- 🇰🇷 Korean (ko)
- 🇯🇵 Japanese (ja)
- 🇸🇦 Arabic (ar)
- 🇮🇳 Hindi (hi)

## Scripts Reference

### `scripts/build-i18n.js`
Builds `i18n.js` from language files.

**Usage**: `node scripts/build-i18n.js`

### `scripts/add-language.js`
Creates a new language file with placeholders.

**Usage**: `node scripts/add-language.js <lang-code> <display-name>`

### `scripts/auto-translate.js`
Automatically translates placeholder entries.

**Usage**: `TRANSLATION_SERVICE=openai node scripts/auto-translate.js <lang-code>`

**Services**: `openai`, `deepl`, `google`, `azure`

### `scripts/split-translations.js`
Utility to split old monolithic `i18n.js` into modular files (one-time use).

## Environment Variables

Create a `.env` file:

```bash
# OpenAI (recommended for complex languages)
OPENAI_API_KEY=sk-...
# or
EXPO_PUBLIC_OPENAI_API_KEY=sk-...

# DeepL (excellent for European languages)
DEEPL_API_KEY=...

# Google Translate
GOOGLE_TRANSLATE_API_KEY=...

# Azure Translator
AZURE_TRANSLATOR_KEY=...
AZURE_LOCATION=global
```

## Benefits of Modular Structure

### Before (Monolithic)
- ❌ Single 1200+ line file
- ❌ Hard to navigate with 5+ languages
- ❌ Merge conflicts on large file
- ❌ Difficult to add new languages

### After (Modular)
- ✅ Separate files per language
- ✅ Easy to navigate and manage
- ✅ Clean git history
- ✅ Simple to add languages
- ✅ Auto-generated production file
- ✅ Scales to 20+ languages easily

## Troubleshooting

### "No entries found with [LANG] prefix"
Run `node scripts/add-language.js <lang-code>` first.

### "Language file not found"
Make sure language file exists in `i18n/languages/<lang-code>.js`.

### Website shows untranslated content
Rebuild: `node scripts/build-i18n.js`

### Deployment shows wrong language
Ensure build step runs: `node scripts/build-i18n.js`

## Questions?

Check the main README or create an issue on GitHub.

