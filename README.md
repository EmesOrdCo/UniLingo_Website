# UniLingo Website

AI-Powered Language Learning Platform for University Students

## 🌟 Features

- **AI-Powered Learning**: Personalized study plans and intelligent recommendations
- **Smart Flashcards**: Spaced repetition technology for optimal memory retention
- **Progress Analytics**: Track your learning journey with detailed insights
- **Interactive Games**: 8 engaging games to reinforce vocabulary
- **PDF Upload & Analysis**: Upload study materials and let AI create personalized lessons
- **Ad-Free Experience**: Focus on learning without distractions

## 🌍 Internationalization (i18n)

The website now includes full internationalization support with a comprehensive translation system.

### Supported Languages
- 🇬🇧 **English** (default)
- 🇩🇪 **German** (Deutsch)

### Quick Start with Translations

1. **View in German**: Open the website and click the language switcher button (🇩🇪 Deutsch) in the navigation
2. **Language Preference**: Your language choice is saved automatically and persists across sessions
3. **Add More Languages**: See `TRANSLATION_SETUP.md` for details

### Translation Files
- `i18n.js` - Core translation system and language data
- `TRANSLATION_SETUP.md` - Complete setup and usage guide
- `I18N_IMPLEMENTATION_SUMMARY.md` - Detailed implementation summary

## 📁 Project Structure

```
├── index.html                 # Main homepage with full i18n support
├── how-it-works.html         # Feature explanations
├── sign-in.html              # User authentication
├── subscription.html         # Subscription management
├── privacy-policy.html       # Privacy policy
├── terms-of-service.html     # Terms of service
├── i18n.js                   # Translation system
├── config.js                 # Configuration (Supabase, Stripe)
├── package.json              # Dependencies
└── netlify/                  # Netlify serverless functions
    └── functions/            # Backend functions
```

## 🚀 Getting Started

### Local Development

1. Clone the repository
2. Open `index.html` in a web browser
3. For a local server: `python3 -m http.server 8000`

### Production Deployment

The site is configured for deployment on Netlify with:
- Serverless functions for Stripe integration
- Supabase for authentication and database
- Automatic deployments from git

## 🔧 Technology Stack

- **Frontend**: Vanilla JavaScript, HTML5, CSS3
- **Backend**: Netlify Functions (Node.js)
- **Database**: Supabase (PostgreSQL)
- **Payments**: Stripe
- **Hosting**: Netlify

## 📝 Documentation

- **Translation Setup**: See `TRANSLATION_SETUP.md`
- **Subscription Setup**: See `SUBSCRIPTION_SETUP.md`
- **Implementation Summary**: See `I18N_IMPLEMENTATION_SUMMARY.md`

## 🎯 Adding Translations

To add i18n support to any page:

1. Include `i18n.js` in the HTML
2. Add `data-i18n` attributes to translatable elements
3. Add translation keys to `i18n.js`
4. Initialize the i18n system

See `TRANSLATION_SETUP.md` for detailed instructions.

## 📊 Current i18n Status

- ✅ `index.html` - Fully translated (English & German)
- ⏳ `how-it-works.html` - Ready for translation
- ⏳ `sign-in.html` - Ready for translation
- ⏳ Other pages - Ready for translation

## 🌍 Future Languages

The translation system is designed to easily support additional languages:
- French
- Spanish
- Italian
- Portuguese
- And more...

## 📧 Contact

For support: unilingo.help@gmail.com

## 📄 License

© 2024 UniLingo. All rights reserved.

---

**Made with ❤️ for language learners worldwide**

