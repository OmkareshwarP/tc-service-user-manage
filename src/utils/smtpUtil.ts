import { getRedisClient } from '../database/redisUtil.js';
import { IBrevoMailOptions } from '../typeDefs.js';
import { getCurrentISODate_YYYYMMDD, logError } from './index.js';
import axios from 'axios';

export const sendBrevoMailAPI = async (mailOptions: IBrevoMailOptions) => {
  const _isBrevoEmailOTPEnabled = await isBrevoEmailOTPEnabled();

  if (!_isBrevoEmailOTPEnabled) {
    throw new Error('You have reached maximum limit.');
  }

  const emailData = {
    sender: { email: process.env.BREVO_SENDER_EMAIL },
    to: [{ email: mailOptions.receiverEmail }],
    subject: mailOptions.subject,
    htmlContent: mailOptions.bodyHtml,
    text: mailOptions.bodyText
  };

  try {
    await axios.post(
      'https://api.brevo.com/v3/smtp/email',
      emailData,
      {
        headers: {
          'Api-Key': process.env.BREVO_API_KEY,
          'Content-Type': 'application/json',
        },
      }
    );
    const redisClient = getRedisClient();
    await redisClient.incr(`${process.env.REDIS_KEY_BrevoGlobalEmailCount}:${getCurrentISODate_YYYYMMDD()}`);
  } catch (error) {
    logError(error.message, 'sendBrevoMailAPIError', 5, error, { receiverEmail: mailOptions.receiverEmail, subject: mailOptions.subject });
    throw (error)
  }
}

export const isBrevoEmailOTPEnabled = async (): Promise<boolean> => {
  const redisClient = getRedisClient();
  const redisKey = `${process.env.REDIS_KEY_BrevoGlobalEmailCount}:${getCurrentISODate_YYYYMMDD()}`;

  const emailCount = await redisClient.get(redisKey);

  if (!emailCount) {
    await redisClient.set(redisKey, 0, { EX: 24 * 60 * 60 }); // Expiry in seconds
    return true;
  }
  return parseInt(emailCount) < 3
}

export const getBrevoOTPMailOptions = (receiverEmail: string, otp: string): IBrevoMailOptions => {
  if (!otp && otp?.length < 4) {
    throw new Error('otp not found');
  }
  const websiteUrl = process.env.TWEETER_CLUB_DOMAIN;
  const logoUrl = process.env.TWEETER_CLUB_LOGO_URL_SM;
  const bodyHtml = `
  <!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Verify Your Email - Tweeter Club</title>
    <style>
      /* General Styles */
      .main-container {
        font-family: 'Arial', sans-serif;
        margin: 0;
        background-color: #f5f5f5;
        display: flex;
        justify-content: center;
        align-items: center;
        height: auto;
        width: auto;
        padding: 50px 20px;
        background: linear-gradient(45deg, #202328, #050d19);
        color: #fff;
      }
      .container {
        background-color: #ffffff;
        color: #333;
        padding: 30px;
        margin: 0 auto;
        border-radius: 10px;
        box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
        width: 100%;
        max-width: 400px;
        text-align: center;
      }
      h1 {
        background: linear-gradient(45deg, #202328, #ec6218);
        -webkit-background-clip: text;
        background-clip: text;
        color: transparent;
        margin-bottom: 20px;
      }
      p {
        font-size: 16px;
        line-height: 1.5;
        margin-bottom: 10px;
      }
      .otp {
        font-size: 24px;
        font-weight: bold;
        padding: 15px;
        background-color: #f1f1f1;
        border-radius: 8px;
        margin-top: 20px;
        color: #333;
      }
      .logo {
        width: 60px;
        margin-bottom: 20px;
      }
      .footer {
        margin-top: 30px;
        font-size: 14px;
        color: #888;
      }
      .footer a {
        color: #00bcd4;
        text-decoration: none;
      }
    </style>
  </head>
  <body>
  <div class="main-container">
    <div class="container">
      <!-- Logo Section -->
      <img src="${logoUrl}" alt="Tweeter Club Logo" class="logo">
      <!-- Main Title -->
      <h1>Verify your email to complete your Tweeter Club Sign-Up</h1>
      <!-- Information -->
      <p>To finish your registration, please enter the <strong>${otp?.length}</strong>-digit code in the verification window.</p>
      <!-- OTP Display -->
      <p class="otp" id="otp-code">${otp}</p>
      <!-- Footer -->
      <div class="footer">
        <p>Website : <a href="${websiteUrl}" target="_blank">${websiteUrl}</a></p>
      </div>
    </div>
  </div>
  </body>
  </html>`;

  const options = {
    receiverEmail: receiverEmail,
    subject: `${otp} - OTP for Tweeter Club Sign-Up`,
    bodyHtml,
    bodyText: `Verify your email to complete your Tweeter Club Sign-Up. To finish your registration, please enter the ${otp?.length}-digit code in the verification window. Your OTP-Code is ${otp}. Website : ${websiteUrl}`
  }
  return options;
}
