// Configuration file for UniLingo Website
// This file contains the public configuration that can be safely exposed to the frontend

const config = {
    supabase: {
        url: 'https://zbnozflfozvaktjlomka.supabase.co',
        anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpibm96Zmxmb3p2YWt0amxvbWthIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ5MTkxODIsImV4cCI6MjA3MDQ5NTE4Mn0.D-kYtY35Tmp3tZ6hU-O2IeZVXMzBvsYr7drUfeKjMkM'
    },
    stripe: {
        publishableKey: 'pk_live_51S2eNaCet5xFhEZPc6LLLDuMYQPG8eurbdZm0UidSuvjcQqHrGOYtnFdBEyTyPSFbgUuR4vQ5EN6ScMHUCBLk5oD00BZLNCzKf'
    },
    app: {
        name: 'UniLingo',
        version: '1.0.0',
        supportEmail: 'unilingo.help@gmail.com'
    }
};

// Make config available globally
if (typeof window !== 'undefined') {
    window.UNILINGO_CONFIG = config;
}

// Export for Node.js environments
if (typeof module !== 'undefined' && module.exports) {
    module.exports = config;
}
