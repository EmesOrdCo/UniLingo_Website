# Testing Guide for i18n Implementation

## 🚀 Quick Start

Your testing environment is now running!

### Access the Website

**Main URL**: http://localhost:8000

**Direct Pages**:
- Homepage: http://localhost:8000/index.html
- How It Works: http://localhost:8000/how-it-works.html
- Sign In: http://localhost:8000/sign-in.html
- Privacy Policy: http://localhost:8000/privacy-policy.html
- Terms of Service: http://localhost:8000/terms-of-service.html

## ✅ Testing Checklist

### 1. Homepage Translation (index.html)

**Open**: http://localhost:8000

**Steps**:
1. Page loads in English by default
2. Look for the language switcher button in the navigation (should show "🇩🇪 Deutsch")
3. Click the language switcher
4. Verify all content translates to German:
   - ✅ Navigation menu
   - ✅ Hero section (main tagline)
   - ✅ University trust text
   - ✅ Features section (6 feature cards)
   - ✅ Screenshots section (4 screenshots)
   - ✅ Pricing section (2 plans)
   - ✅ Footer

5. **Reload the page** - language preference should persist
6. Switch back to English and reload - should stay in English
7. Switch to German and reload - should stay in German

**Expected Result**: All text should seamlessly translate between English and German

### 2. Mobile Menu Testing

**Steps**:
1. Resize browser to mobile width (< 768px)
2. Click the hamburger menu icon
3. Find the language switcher in mobile menu
4. Click it - page should translate
5. Close mobile menu and verify translation persists

**Expected Result**: Mobile menu translation works correctly

### 3. Language Persistence Testing

**Steps**:
1. Set language to German
2. Open browser DevTools (F12)
3. Go to Application > Local Storage
4. Verify `unilingo_lang` is set to `"de"`
5. Close browser and reopen
6. Navigate to http://localhost:8000
7. Page should load in German

**Expected Result**: Language preference persists across sessions

### 4. Edge Cases

**Test**:
- Switch language multiple times rapidly
- Check that all elements update correctly
- Verify no broken text or missing translations
- Test in different browsers (Chrome, Safari, Firefox, Edge)

### 5. Translation Quality Check

**Review German translations for**:
- Accurate meanings (not just word-for-word translations)
- Proper German grammar and sentence structure
- Professional tone appropriate for the target audience
- Consistency in terminology

## 🐛 Troubleshooting

### Language Switcher Not Working

**Check**:
1. Open browser console (F12 > Console)
2. Look for JavaScript errors
3. Verify `i18n.js` is loading correctly
4. Check that elements have `data-i18n` attributes

### Translations Not Appearing

**Check**:
1. Verify `i18n.js` is loaded before the page content
2. Check that `window.i18n.init()` is called on page load
3. Open console and run: `window.i18n.currentLanguage`
4. Should return either 'en' or 'de'

### Language Not Persisting

**Check**:
1. Verify localStorage is enabled in browser
2. Check browser privacy settings
3. Look for any localStorage errors in console

## 📋 Manual Test Script

Copy and run this in the browser console:

```javascript
// Test translation system
console.log('Current language:', window.i18n.currentLanguage);

// Switch to German
window.i18n.changeLanguage('de');
console.log('Switched to:', window.i18n.currentLanguage);

// Get a translation
console.log('Translation test:', window.i18n.t('nav.features'));

// Switch back to English
window.i18n.changeLanguage('en');
console.log('Switched to:', window.i18n.currentLanguage);
```

**Expected Output**:
```
Current language: en
Switched to: de
Translation test: Funktionen
Switched to: en
```

## 🌐 Browser Compatibility

Test in these browsers:
- ✅ Chrome (recommended)
- ✅ Safari
- ✅ Firefox
- ✅ Edge
- ✅ Mobile Safari (iOS)
- ✅ Chrome Mobile (Android)

## 📱 Responsive Testing

Test at these screen sizes:
- Mobile: 375px width
- Tablet: 768px width
- Desktop: 1200px width
- Large Desktop: 1920px width

Verify that language switcher is accessible at all sizes.

## 🔍 Visual Inspection

Check for:
- ✅ Proper text wrapping in German (longer text)
- ✅ No overflow or layout breaks
- ✅ Consistent spacing
- ✅ All buttons and links still clickable
- ✅ Proper alignment of text

## 📊 Success Criteria

✅ **Pass** if:
- All translations work correctly
- Language switches instantly without page reload
- Language preference persists across sessions
- No console errors
- All UI elements remain functional
- Mobile menu works correctly
- Visual layout is maintained

❌ **Fail** if:
- Translations don't appear
- Errors in browser console
- Language preference doesn't persist
- Layout breaks with German text
- Buttons/links stop working

## 🎯 Performance Testing

**Check**:
- Language switch time: should be instant (< 100ms)
- Initial page load: no significant delay
- Memory usage: no memory leaks

## 📝 Known Issues

None currently reported.

## 🚀 Next Steps After Testing

If all tests pass:
1. ✅ Ready for production
2. Consider adding more pages to i18n
3. Consider adding more languages

---

**Server Status**: Running on http://localhost:8000  
**Test Date**: Run tests now  
**Notes**: Keep server running to test the implementation

