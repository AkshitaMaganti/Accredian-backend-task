const express = require('express');
const { PrismaClient } = require('@prisma/client');
const nodemailer = require('nodemailer');
const cors = require('cors');
require('dotenv').config();

const app = express();
const prisma = new PrismaClient();

app.use(express.json());
app.use(cors({ origin: 'http://localhost:3000' }));

app.post('/api/referrals', async (req, res) => {
  try {
    const { referrerName, referrerEmail, refereeName, refereeEmail, course } = req.body;

    if (!referrerName || !referrerEmail || !refereeName || !refereeEmail || !course) {
      return res.status(400).json({ error: 'All fields are required' });
    }
    if (!/\S+@\S+\.\S+/.test(referrerEmail) || !/\S+@\S+\.\S+/.test(refereeEmail)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }

    const referral = await prisma.referral.create({
      data: {
        referrerName,
        referrerEmail,
        refereeName,
        refereeEmail,
        course,
      },
    });

    await sendReferralEmail(referrerEmail, refereeEmail, course);

    res.status(201).json({ message: 'Referral submitted successfully', referral });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

async function sendReferralEmail(referrerEmail, refereeEmail, course) {
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: refereeEmail,
    cc: referrerEmail,
    subject: 'You’ve Been Referred to a Great Course!',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #4F46E5;">Referral Invitation</h2>
        <p style="color: #1F2937;">Hi ${refereeEmail.split('@')[0]},</p>
        <p style="color: #1F2937;">
          Your friend ${referrerEmail} has referred you to our <strong>${course}</strong> course! 
          Join now and start your learning journey with us.
        </p>
        <a href="http://localhost:3000" style="display: inline-block; padding: 10px 20px; background-color: #4F46E5; color: #FFFFFF; text-decoration: none; border-radius: 5px;">Learn More</a>
        <p style="color: #6B7280; font-size: 12px; margin-top: 20px;">© 2025 Refer & Earn</p>
      </div>
    `,
  };

  await transporter.sendMail(mailOptions);
}

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));