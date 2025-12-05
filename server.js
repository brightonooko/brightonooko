const express = require('express');
const nodemailer = require('nodemailer');
const twilio = require('twilio');
const cors = require('cors');
const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('.')); // Serve static files from current directory

// Email configuration
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'ookobrighton1@gmail.com',
        pass: process.env.EMAIL_PASSWORD // You'll need to set this environment variable
    }
});

// Twilio configuration
const twilioClient = twilio(
    process.env.TWILIO_ACCOUNT_SID,
    process.env.TWILIO_AUTH_TOKEN
);

// Handle form submission
app.post('/send-message', async (req, res) => {
    const { name, email, phone, subject, message } = req.body;

    try {
        // Send email
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

        // Send SMS
        await twilioClient.messages.create({
            body: `New contact form submission from ${name} (${email}). Subject: ${subject}`,
            from: process.env.TWILIO_PHONE_NUMBER,
            to: '+254746059970'
        });

        res.status(200).json({ success: true, message: 'Message sent successfully' });
    } catch (error) {
        console.error('Error sending message:', error);
        res.status(500).json({ success: false, message: 'Error sending message' });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
}); 