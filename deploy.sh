#!/bin/bash

# UniLingo Website Deployment Script
echo "🚀 Deploying UniLingo website to Netlify..."

# Deploy to production
npx netlify-cli deploy --prod --dir=.

echo "✅ Deployment complete!"
echo "🌐 Your website is live at: https://unilingo-website.netlify.app"
echo "📝 To connect your domain (unilingo.co.uk), go to Netlify dashboard and add custom domain"
