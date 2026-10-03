const crypto = require('crypto');
const express = require('express');
const mongoose = require('mongoose');
const nodemailer = require('nodemailer');
const axios = require('axios');
const jwt = require('jsonwebtoken');
const OtpChallenge = require('../models/OtpChallenge');
const User = require('../models/User');

const router = express.Router();

const OTP_TTL_MS = 10 * 60 * 1000;
const MAX_ATTEMPTS = 5;
const JWT_SECRET = process.env.JWT_SECRET || 'budget-monitoring-secret';

function normalizeMobile(value) {
  return String(value || '').replace(/[\s()-]/g, '');
}

function hashCode(code) {
  return crypto.createHash('sha256').update(code).digest('hex');
}

function createEmailTransport() {
  if (
    !process.env.SMTP_HOST ||
    !process.env.SMTP_USER ||
    !process.env.SMTP_PASS
  ) {
    return null;
  }

  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    },
    tls: {
      rejectUnauthorized: false
    }
  });
}

async function sendEmailOtp(email, code) {
  const transport = createEmailTransport();

  if (!transport) {
    throw new Error('Email OTP service is not configured');
  }

  try {
    await transport.sendMail({
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to: email,
      subject: 'Your Budget Monitor verification code',
      text: `Your verification code is ${code}. It expires in 10 minutes. Do not share this code.`
    });
  } catch (error) {
    throw new Error(`Email delivery failed: ${error.message}`);
  }
}

async function sendSmsOtp(mobile, code) {
  const {
    TWILIO_ACCOUNT_SID,
    TWILIO_AUTH_TOKEN,
    TWILIO_VERIFY_SERVICE_SID
  } = process.env;

  if (
    !TWILIO_ACCOUNT_SID ||
    !TWILIO_AUTH_TOKEN ||
    !TWILIO_VERIFY_SERVICE_SID
  ) {
    throw new Error('Twilio Verify SMS service is not configured');
  }

  const body = new URLSearchParams({
    To: mobile,
    Channel: 'sms'
  });

  try {
    await axios.post(
      `https://verify.twilio.com/v2/Services/${TWILIO_VERIFY_SERVICE_SID}/Verifications`,
      body.toString(),
      {
        auth: {
          username: TWILIO_ACCOUNT_SID,
          password: TWILIO_AUTH_TOKEN
        },
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      }
    );
  } catch (error) {
    console.log(
      'Twilio SMS sending error:',
      error.response?.data || error.message
    );

    throw new Error(`SMS delivery failed: ${error.message}`);
  }
}

async function verifySmsOtp(mobile, code) {
  const {
    TWILIO_ACCOUNT_SID,
    TWILIO_AUTH_TOKEN,
    TWILIO_VERIFY_SERVICE_SID
  } = process.env;

  if (
    !TWILIO_ACCOUNT_SID ||
    !TWILIO_AUTH_TOKEN ||
    !TWILIO_VERIFY_SERVICE_SID
  ) {
    throw new Error('Twilio Verify SMS service is not configured');
  }

  const body = new URLSearchParams({
    To: mobile,
    Code: code
  });

  try {
    const response = await axios.post(
      `https://verify.twilio.com/v2/Services/${TWILIO_VERIFY_SERVICE_SID}/VerificationCheck`,
      body.toString(),
      {
        auth: {
          username: TWILIO_ACCOUNT_SID,
          password: TWILIO_AUTH_TOKEN
        },
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      }
    );

    console.log('Twilio verification response:', response.data);

    return response.data.status === 'approved';
  } catch (error) {
    console.log(
      'Twilio verification error:',
      error.response?.data || error.message
    );

    throw new Error('SMS verification failed');
  }
}

router.post('/request', async (req, res) => {
  try {
    const email = String(req.body.email || '').trim().toLowerCase();
    const mobile = normalizeMobile(req.body.mobile);
    const purpose = String(req.body.purpose || 'registration');

    if (
      !/^\S+@\S+\.\S+$/.test(email) ||
      !/^\+[1-9]\d{7,14}$/.test(mobile)
    ) {
      return res.status(400).json({
        message:
          'Enter a valid email and mobile number in international format, for example +919876543210.'
      });
    }

    if (!['registration', 'login'].includes(purpose)) {
      return res.status(400).json({ message: 'Invalid verification purpose' });
    }

    const existingUser = await User.findOne({ email });
    if (purpose === 'registration' && existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }
    if (purpose === 'login' && (!existingUser || normalizeMobile(existingUser.mobile) !== mobile)) {
      return res.status(400).json({ message: 'Unable to send verification codes' });
    }

    const emailCode = String(
      crypto.randomInt(100000, 1000000)
    );

    const mobileCode = String(
      crypto.randomInt(100000, 1000000)
    );

    await OtpChallenge.deleteMany({
      email,
      mobile
    });

    const challenge = await OtpChallenge.create({
      purpose,
      email,
      mobile,
      emailCodeHash: hashCode(emailCode),
      mobileCodeHash: hashCode(mobileCode),
      expiresAt: new Date(Date.now() + OTP_TTL_MS)
    });

    try {
      await Promise.all([
        sendEmailOtp(email, emailCode),
        sendSmsOtp(mobile, mobileCode)
      ]);
    } catch (deliveryError) {
      await OtpChallenge.deleteOne({
        _id: challenge._id
      });

      return res.status(503).json({
        message: deliveryError.message
      });
    }

    res.status(201).json({
      challengeId: challenge._id,
      message:
        'Separate verification codes were sent to your email and mobile number.'
    });
  } catch (error) {
    console.log('OTP request error:', error);

    res.status(500).json({
      message: 'Unable to send verification codes'
    });
  }
});

router.post('/verify', async (req, res) => {
  try {
    const {
      challengeId,
      channel,
      code
    } = req.body;

    if (
      !challengeId ||
      !['email', 'mobile'].includes(channel) ||
      !/^\d{6}$/.test(String(code || ''))
    ) {
      return res.status(400).json({
        message:
          'Challenge ID, channel, and six-digit code are required'
      });
    }

    const challenge = await OtpChallenge.findById(challengeId);

    if (!challenge || challenge.expiresAt < new Date()) {
      return res.status(400).json({
        message:
          'This verification request has expired. Request new codes.'
      });
    }

    if (challenge.attempts >= MAX_ATTEMPTS) {
      return res.status(429).json({
        message:
          'Too many incorrect attempts. Request new codes.'
      });
    }

    let codeValid = false;

    if (channel === 'email') {
      codeValid =
        hashCode(String(code)) === challenge.emailCodeHash;
    }

    if (channel === 'mobile') {
      codeValid = await verifySmsOtp(
        challenge.mobile,
        String(code)
      );
    }

    if (!codeValid) {
      challenge.attempts += 1;
      await challenge.save();

      return res.status(400).json({
        message: 'Incorrect verification code'
      });
    }

    if (channel === 'email') {
      challenge.emailVerified = true;
    }

    if (channel === 'mobile') {
      challenge.mobileVerified = true;
    }

    await challenge.save();

    res.json({
      emailVerified: challenge.emailVerified,
      mobileVerified: challenge.mobileVerified
    });

  } catch (error) {
    console.log('OTP verification error:', error);

    res.status(400).json({
      message: error.message || 'Unable to verify code'
    });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { challengeId } = req.body;
    if (!mongoose.Types.ObjectId.isValid(challengeId)) {
      return res.status(401).json({ message: 'OTP login could not be verified' });
    }

    const challenge = await OtpChallenge.findOne({
      _id: challengeId,
      purpose: 'login',
      emailVerified: true,
      mobileVerified: true,
      expiresAt: { $gt: new Date() }
    });
    if (!challenge) {
      return res.status(401).json({ message: 'Both OTP codes must be verified before signing in' });
    }

    const user = await User.findOne({ email: challenge.email });
    if (!user || normalizeMobile(user.mobile) !== challenge.mobile) {
      return res.status(401).json({ message: 'OTP login could not be verified' });
    }

    const token = jwt.sign({ id: user._id, role: user.role }, JWT_SECRET, { expiresIn: '1h' });
    const safeUser = user.toObject();
    delete safeUser.password;
    await OtpChallenge.deleteOne({ _id: challenge._id });
    res.json({ message: 'Login successful', token, user: safeUser });
  } catch (error) {
    res.status(401).json({ message: 'OTP login could not be verified' });
  }
});

module.exports = router;