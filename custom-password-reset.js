// Custom Password Reset System
// This bypasses Supabase's email template issues by implementing a custom flow

class CustomPasswordReset {
    constructor(config) {
        this.supabaseClient = config.supabase;
        this.supabaseUrl = config.supabaseUrl;
        this.supabaseKey = config.supabaseKey;
    }

    async requestPasswordReset(email) {
        try {
            console.log('=== CUSTOM PASSWORD RESET REQUEST ===');
            console.log('Email:', email);
            
            // Method 1: Try standard Supabase method with proper configuration
            let result = await this.supabaseClient.auth.resetPasswordForEmail(email.trim().toLowerCase(), {
                redirectTo: `https://unilingo.co.uk/reset-password.html?custom=true`
            });
            
            if (result.error) {
                console.log('Standard method failed:', result.error.message);
                
                // Method 2: Try with different URL format
                result = await this.supabaseClient.auth.resetPasswordForEmail(email.trim().toLowerCase(), {
                    redirectTo: `https://unilingo.co.uk/reset-password.html`,
                    emailRedirectTo: `https://unilingo.co.uk/reset-password.html`
                });
                
                if (result.error) {
                    console.log('Alternative method failed:', result.error.message);
                    
                    // Method 3: Direct API call
                    result = await this.directAPICall(email);
                }
            }
            
            if (result.error) {
                throw new Error(result.error.message);
            }
            
            console.log('Password reset request successful');
            return { success: true, data: result.data };
            
        } catch (error) {
            console.error('Custom password reset failed:', error);
            throw error;
        }
    }
    
    async directAPICall(email) {
        try {
            console.log('Attempting direct API call...');
            
            const response = await fetch(`${this.supabase.supabaseUrl}/auth/v1/recover`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'apikey': this.supabase.supabaseKey,
                    'Authorization': `Bearer ${this.supabase.supabaseKey}`
                },
                body: JSON.stringify({
                    email: email.trim().toLowerCase(),
                    redirectTo: `https://unilingo.co.uk/reset-password.html`
                })
            });
            
            const data = await response.json();
            
            if (!response.ok) {
                return { error: { message: data.error_description || data.msg || 'Direct API failed' } };
            }
            
            console.log('Direct API call successful');
            return { data: data };
            
        } catch (error) {
            console.error('Direct API call failed:', error);
            return { error: { message: error.message } };
        }
    }
    
    async validateResetToken(token, type = 'recovery') {
        try {
            console.log('=== VALIDATING RESET TOKEN ===');
            console.log('Token:', token ? 'Present' : 'Missing');
            console.log('Type:', type);
            
            if (!token) {
                throw new Error('No token provided');
            }
            
            // Try to verify the OTP token
            const { data, error } = await this.supabaseClient.auth.verifyOtp({
                token_hash: token,
                type: type
            });
            
            if (error) {
                console.error('Token validation failed:', error);
                throw error;
            }
            
            console.log('Token validation successful');
            return { success: true, data: data };
            
        } catch (error) {
            console.error('Token validation error:', error);
            throw error;
        }
    }
    
    async updatePassword(newPassword) {
        try {
            console.log('=== UPDATING PASSWORD ===');
            
            // Check if we have a valid session
            const { data: { session }, error: sessionError } = await this.supabaseClient.auth.getSession();
            
            if (sessionError || !session) {
                throw new Error('No valid reset session found. Please request a new password reset.');
            }
            
            // Update the password
            const { data, error } = await this.supabaseClient.auth.updateUser({
                password: newPassword
            });
            
            if (error) {
                throw error;
            }
            
            console.log('Password updated successfully');
            
            // Sign out the user after password update
            await this.supabaseClient.auth.signOut();
            
            return { success: true, data: data };
            
        } catch (error) {
            console.error('Password update error:', error);
            throw error;
        }
    }
}

// Make it available globally
window.CustomPasswordReset = CustomPasswordReset;
