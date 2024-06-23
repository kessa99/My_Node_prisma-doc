import nodemailer from 'nodemailer';
// import { EmailOptions } from './types';
import dotenv from 'dotenv';

dotenv.config();

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_EGO,
    pass: process.env.PASSWORD_EMAIL_EGO,
  },
});

export const sendOTPEmail = async (email: string, otp: string) => {
    const mailOptions = {
        from: process.env.EMAIL,
        to: email,
        subject: 'Verification OTP',
        text: `Votre code de verification est ${otp} pour vous connecter a EgoTransfert. Ce code expire dans 10 min`,
    };
    
    try {
        await transporter.sendMail(mailOptions);
        console.log('Email sent: ' + email);
    } catch (error) {
        console.log(error);
    }
    }
