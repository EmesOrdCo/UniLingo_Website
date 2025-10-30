# Translation System Setup

## Overview
This UniLingo website now includes a comprehensive internationalization (i18n) system that supports English and German translations.

## Files Created/Modified

### New Files
- **`i18n.js`** - Core translation system with English and German translations

### Modified Files
- **`index.html`** - Updated with i18n support and language switcher

## How It Works

### Translation System
The i18n system uses a simple attribute-based approach:
- Elements with a `data-i18n` attribute are automatically translated
- Translation keys follow a hierarchical naming convention (e.g., `nav.features`, `features.ai.title`)
- Language preference is saved to localStorage for persistence across sessions

### Language Switcher
A language switcher button has been added to the navigation bar that:
- Appears in both desktop and mobile menus
- Switches between English and German
- Persists the selected language across page reloads

## Adding Translations

To add a new translation:

1. Add the English text to `translations.en` in `i18n.js`
2. Add the German equivalent to `translations.de` in `i18n.js`
3. Add the `data-i18n="your.key.here"` attribute to the HTML element

Example:
```javascript
// In i18n.js
translations = {
    en: {
        'your.key.here': 'Your English Text'
    },
    de: {
        'your.key.here': 'Ihr deutscher Text'
    }
}
```

```html
<!-- In HTML -->
<p data-i18n="your.key.here">Your English Text</p>
```

## Supported Languages

Currently supported:
- 🇬🇧 **English (en)** - Default language
- 🇩🇪 **German (de)** - Full translation

## Testing

To test the translation system:

1. Open `index.html` in a web browser
2. Click the language switcher button in the navigation
3. The entire page should translate to German
4. Refresh the page - your language preference should be saved
5. Navigate to other pages and verify translations persist

## Future Enhancements

Potential additions for other pages:
- `how-it-works.html` - Add i18n attributes
- `sign-in.html` - Add i18n attributes
- `privacy-policy.html` - Add i18n attributes
- `terms-of-service.html` - Add i18n attributes
- Other pages as needed

## Translation Keys Reference

Main translation key categories:
- `nav.*` - Navigation items
- `hero.*` - Hero section content
- `trust.*` - University trust section
- `features.*` - Feature descriptions
- `screenshots.*` - Screenshot captions
- `pricing.*` - Pricing information
- `footer.*` - Footer content
- `common.*` - Common UI elements
- `lang.*` - Language switcher

