/**
 * Basic email service implementation
 * This is a placeholder for future implementation with a real email provider
 */

const sendVerificationEmail = (email) => {
    console.log(`[EMAIL SERVICE] Verification email would be sent to: ${email}`);
    // In a real implementation, this would send an actual email
    // using a service like Nodemailer, SendGrid, etc.
    return Promise.resolve({ success: true });
};

module.exports = {
    sendVerificationEmail
};
