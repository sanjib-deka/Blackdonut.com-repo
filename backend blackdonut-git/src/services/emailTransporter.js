const { Resend } = require('resend');

let resend = null;
let emailConfigured = false;
const resendApiKey = process.env.RESEND_API_KEY ? process.env.RESEND_API_KEY.trim() : null;
// Use onboarding@resend.dev for free tier (works immediately, no domain verification needed)
const fromEmail = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';

console.log('📧 Email Configuration (Resend):');
console.log('   - RESEND_API_KEY:', resendApiKey ? '✓ Set' : '✗ Missing');
console.log('   - From Email:', fromEmail);

if (resendApiKey) {
    try {
        resend = new Resend(resendApiKey);
        emailConfigured = true;
        console.log('✅ Resend email service configured successfully');
        console.log('   Works on Render free tier - uses HTTPS API (no SMTP blocking)');
    } catch (error) {
        console.error('❌ Error configuring Resend:', error.message);
        emailConfigured = false;
    }
} else {
    console.log('⚠️  Resend API key not found. Password reset emails will not work.');
    console.log('   Get FREE API key: https://resend.com/api-keys');
    console.log('   No credit card required - 3,000 emails/month free forever');
}

// Function to send reset password email
async function sendResetPasswordEmail(email, resetLink, userName) {
    const sendStartTime = Date.now();
    console.log(`📨 Sending password reset email to: ${email}`);
    console.log(`   Reset link: ${resetLink.substring(0, 50)}...`);
    
    try {
        // Check if Resend is configured
        if (!emailConfigured || !resend) {
            console.error('❌ Email service not configured. Set RESEND_API_KEY in environment variables');
            throw new Error('Email service not configured. Contact administrator.');
        }

        console.log(`⏱️  Sending email via Resend API...`);
        
        const { data, error } = await resend.emails.send({
            from: `Black Donut <${fromEmail}>`,
            to: email, // Email from forgot password controller (user's email)
            subject: 'Reset Your Password - Black Donut',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f5f5f5;">
                    <div style="background-color: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                        <h2 style="color: #2a2a2a; margin-bottom: 20px;">Password Reset Request</h2>
                        
                        <p style="color: #555; font-size: 14px; line-height: 1.6; margin-bottom: 20px;">
                            Hi <strong>${userName}</strong>,
                        </p>
                        
                        <p style="color: #555; font-size: 14px; line-height: 1.6; margin-bottom: 20px;">
                            We received a request to reset your password. Click the button below to create a new password.
                        </p>
                        
                        <div style="text-align: center; margin: 30px 0;">
                            <a href="${resetLink}" 
                               style="display: inline-block; background-color: #2a2a2a; color: white; padding: 12px 30px; text-decoration: none; border-radius: 4px; font-weight: bold;">
                                Reset Password
                            </a>
                        </div>
                        
                        <p style="color: #555; font-size: 14px; line-height: 1.6; margin-bottom: 20px;">
                            Or copy and paste this link in your browser:<br>
                            <span style="color: #0066cc; word-break: break-all;">${resetLink}</span>
                        </p>
                        
                        <p style="color: #999; font-size: 12px; margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd;">
                            This link will expire in 15 minutes. If you didn't request a password reset, please ignore this email.
                        </p>
                        
                        <p style="color: #999; font-size: 12px;">
                            © 2025 Black Donut. All rights reserved.
                        </p>
                    </div>
                </div>
            `
        });

        if (error) {
            throw error;
        }

        const sendDuration = Date.now() - sendStartTime;
        console.log(`✅ Reset password email sent successfully!`);
        console.log(`   Duration: ${sendDuration}ms`);
        console.log(`   Email ID: ${data?.id || 'N/A'}`);
        
        return true;
    } catch (error) {
        const sendDuration = Date.now() - sendStartTime;
        console.error(`❌ Error sending email (after ${sendDuration}ms):`);
        console.error(`   Error message: ${error.message}`);
        
        if (error.message?.includes('API key') || error.message?.includes('Unauthorized')) {
            console.error(`   🔴 AUTHENTICATION ERROR - Invalid API key`);
            console.error(`   Fix: Check RESEND_API_KEY in environment variables`);
        } else if (error.message?.includes('domain') || error.message?.includes('from')) {
            console.error(`   🔴 DOMAIN ERROR - From email domain not verified`);
            console.error(`   Fix: Use onboarding@resend.dev for testing, or verify your domain in Resend dashboard`);
        }
        
        throw error;
    }
}

// Export transporter for backward compatibility (not used with Resend)
const transporter = null;

module.exports = {
    transporter,
    sendResetPasswordEmail
};
