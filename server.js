const express = require('express');
const nodemailer = require('nodemailer');
const twilio = require('twilio');
const cors = require('cors');
const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('.')); // Serve static files from current directory

// Email configuration - only initialize if credentials are available
let transporter = null;
if (process.env.EMAIL_PASSWORD) {
    transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: 'ookobrighton1@gmail.com',
            pass: process.env.EMAIL_PASSWORD
        }
    });
}

// Twilio configuration - only initialize if credentials are available
let twilioClient = null;
if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
    twilioClient = twilio(
        process.env.TWILIO_ACCOUNT_SID,
        process.env.TWILIO_AUTH_TOKEN
    );
}

// Handle form submission
app.post('/send-message', async (req, res) => {
    const { name, email, phone, subject, message } = req.body;

    // Validate required fields
    if (!name || !email || !phone || !subject || !message) {
        return res.status(400).json({ 
            success: false, 
            message: 'All fields are required' 
        });
    }

    try {
        const results = [];

        // Send email if transporter is configured
        if (transporter) {
            try {
                await transporter.sendMail({
                    from: 'ookobrighton1@gmail.com',
                    to: 'ookobrighton1@gmail.com',
                    subject: `New Contact Form Submission: ${subject}`,
                    text: `
                        Name: ${name}
                        Email: ${email}
                        Phone: ${phone}
                        Subject: ${subject}
                        Message: ${message}
                    `
                });
                results.push('email');
            } catch (emailError) {
                console.error('Error sending email:', emailError);
                // Continue even if email fails
            }
        }

        // Send SMS if Twilio client is configured
        if (twilioClient && process.env.TWILIO_PHONE_NUMBER) {
            try {
                await twilioClient.messages.create({
                    body: `New contact form submission from ${name} (${email}). Subject: ${subject}`,
                    from: process.env.TWILIO_PHONE_NUMBER,
                    to: '+254746059970'
                });
                results.push('sms');
            } catch (smsError) {
                console.error('Error sending SMS:', smsError);
                // Continue even if SMS fails
            }
        }

        // If neither service is configured, return error
        if (!transporter && !twilioClient) {
            return res.status(500).json({ 
                success: false, 
                message: 'Email and SMS services are not configured. Please set environment variables.' 
            });
        }

        res.status(200).json({ 
            success: true, 
            message: 'Message sent successfully',
            services: results
        });
    } catch (error) {
        console.error('Error sending message:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error sending message',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// Export the app for Vercel serverless functions
// Vercel expects a handler function when using @vercel/node
module.exports = app;

// For local development
if (require.main === module) {
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
    });
}
