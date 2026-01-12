const express = require('express');
const nodemailer = require('nodemailer');
const twilio = require('twilio');
const cors = require('cors');
const path = require('path');
const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Determine the correct base path for Vercel vs local
// In Vercel serverless functions, files are in the project root (process.cwd())
const basePath = process.cwd();

// Serve static files (CSS, JS, images) from project root
app.use(express.static(basePath));

// Serve the main HTML file at root for all HTTP methods
// This ensures POST, PUT, etc. to / also serve the HTML (maintains old behavior)
app.all('/', (req, res) => {
    const htmlPath = path.resolve(basePath, 'profile.html');
    res.sendFile(htmlPath, (err) => {
        if (err) {
            console.error('Error serving profile.html:', err);
            console.error('Base path:', basePath);
            console.error('Attempted path:', htmlPath);
            res.status(500).send('Error loading page. Check server logs.');
        }
    });
});

// Also serve profile.html directly if accessed
app.get('/profile.html', (req, res) => {
    const htmlPath = path.resolve(basePath, 'profile.html');
    res.sendFile(htmlPath);
});

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

        // If neither service is configured, still return success but log the message
        // This allows the form to work for testing even without email/SMS configured
        if (!transporter && !twilioClient) {
            console.log('Contact form submission (no email/SMS configured):', {
                name,
                email,
                phone,
                subject,
                message
            });
            return res.status(200).json({ 
                success: true, 
                message: 'Message received successfully. We will get back to you soon!',
                services: [],
                note: 'Email/SMS services not configured - message logged to console'
            });
        }

        // If at least one service attempted but both failed, return error
        if (results.length === 0 && (transporter || twilioClient)) {
            return res.status(500).json({ 
                success: false, 
                message: 'Failed to send message. Please try again later.' 
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
