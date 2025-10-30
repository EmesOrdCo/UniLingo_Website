#!/usr/bin/env node

/**
 * Translate French placeholders using AI
 * This script reads i18n.js and translates all [FR] entries to actual French
 */

const fs = require('fs');
const path = require('path');

const I18N_FILE = path.join(__dirname, '../i18n.js');

// Read the file
let content = fs.readFileSync(I18N_FILE, 'utf8');

// Store translations for bulk replacement
const translations = {
    // How It Works Cards
    'Create your account, personalize your learning path, and take a quick assessment to begin at the perfect level.': 
        'Créez votre compte, personnalisez votre parcours d\'apprentissage et passez une évaluation rapide pour commencer au niveau parfait.',
    'Getting Started': 'Pour commencer',
    'Learn on the go with high-quality audio lessons, podcasts, and comprehension exercises perfect for commutes.': 
        'Apprenez en déplacement avec des leçons audio de haute qualité, des podcasts et des exercices de compréhension parfaits pour les trajets.',
    'Audio Lessons': 'Leçons audio',
    'Spend your XP on cosmetic items, avatar customization, backgrounds, and bonus content to showcase your achievements.': 
        'Dépensez vos XP en objets cosmétiques, personnalisation d\'avatar, arrière-plans et contenu bonus pour mettre en valeur vos réalisations.',
    'The Arcade': 'L\'arcade',
    'Personalize your avatar character that guides you through lessons with encouragement, animations, and visual feedback.': 
        'Personnalisez votre personnage avatar qui vous guide à travers les leçons avec des encouragements, des animations et des retours visuels.',
    'Avatar': 'Avatar',
    'Structured lessons organized by CEFR levels with interactive exercises in words, listening, writing, speaking, and roleplay.': 
        'Leçons structurées organisées par niveaux CECRL avec des exercices interactifs en mots, écoute, écriture, expression orale et jeux de rôle.',
    'CEFR Lessons': 'Leçons CECRL',
    'Create your own custom content by uploading PDFs, images, or photos. The app extracts vocabulary and generates a tailored course just for you.': 
        'Créez votre propre contenu personnalisé en téléchargeant des PDF, images ou photos. L\'application extrait le vocabulaire et génère un cours sur mesure pour vous.',
    'Personal Lessons': 'Leçons personnelles',
    'Upload photos of documents and let AI extract key vocabulary to create personalized flashcards from your materials.': 
        'Téléchargez des photos de documents et laissez l\'IA extraire le vocabulaire clé pour créer des flashcards personnalisées à partir de vos documents.',
    'Image Upload & OCR': 'Téléchargement d\'images et OCR',
    
    // Navigation
    'Features': 'Fonctionnalités',
    'How It Works': 'Comment ça marche',
    'Screenshots': 'Captures d\'écran',
    'Pricing': 'Tarifs',
    'Contact': 'Contact',
    'Manage Your Account': 'Gérer votre compte',
    
    // Screenshots
    'See UniLingo in Action': 'Découvrez UniLingo en action',
    'Explore the intuitive interface and powerful features that make learning enjoyable and effective.': 
        'Explorez l\'interface intuitive et les fonctionnalités puissantes qui rendent l\'apprentissage agréable et efficace.',
    'Dashboard': 'Tableau de bord',
    'Personalized overview with daily goals': 'Vue d\'ensemble personnalisée avec objectifs quotidiens',
    'Games & Flashcards': 'Jeux et flashcards',
    'Interactive learning games and flashcards': 'Jeux d\'apprentissage interactifs et flashcards',
    'Lessons': 'Leçons',
    'AI-powered structured lessons': 'Leçons structurées alimentées par l\'IA',
    'Progress Analytics': 'Analyse de progression',
    'Track your learning journey': 'Suivez votre parcours d\'apprentissage',
    
    // Trust
    'Trusted by students from top institutions:': 'Approuvé par les étudiants des meilleures institutions :',
    
    // Language switcher
    'Switch to': 'Passer à',
    'English': 'Anglais',
    'Deutsch': 'Allemand',
    
    // How It Works Hero
    'How UniLingo Works': 'Comment fonctionne UniLingo',
    'Your complete guide to mastering language learning. Explore our features and start your journey today.': 
        'Votre guide complet pour maîtriser l\'apprentissage des langues. Explorez nos fonctionnalités et commencez votre parcours dès aujourd\'hui.',
};

// Function to translate text
function translateText(text) {
    // Remove [FR] prefix if present
    const cleanText = text.replace(/^\[FR\] /, '');
    
    // Check if we have a direct translation
    if (translations[cleanText]) {
        return translations[cleanText];
    }
    
    // Return original text if no translation found
    return text;
}

// Replace all [FR] entries
const result = content.replace(/'(\[FR\] [^']*)'/g, (match, captured) => {
    const translated = translateText(captured);
    return `'${translated}'`;
});

// Write back to file
fs.writeFileSync(I18N_FILE, result, 'utf8');

console.log('✅ French translation completed for basic entries.');
console.log('⚠️  Still need to add translations for remaining [FR] entries.');
console.log(`Run: grep -c "\\[FR\\]" i18n.js`);

