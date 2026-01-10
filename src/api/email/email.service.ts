import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { SendEmailCommand, SESClient } from '@aws-sdk/client-ses';


@Injectable()
export class EmailService {
  private ses: SESClient;
  private sourceEmail = process.env.SES_EMAIL_SOURCE || 'no-reply@outreachhubs.com';

  constructor() {
    this.ses = new SESClient({
      region: 'us-east-1', // Force static region, no fallback
      endpoint: 'https://email.us-east-1.amazonaws.com', // Explicit SES endpoint
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      },
    });
  }

  async forgotPasswordEmail(to: string, resetUrl: string) {
    const htmlContent = `
      <html>
        <body style="font-family: Arial, sans-serif; background-color: #f4f4f4;">
          <div style="max-width: 600px; margin: 0 auto; background: #fff; padding: 20px; border-radius: 8px;">
            <h2 style="color: #007bff;">Password Reset</h2>
            <p>We received a request to reset your password. If you didn't make this request, you can safely ignore this email.</p>
            <p>Otherwise, click the button below to reset your password:</p>
            <p><a href="${resetUrl}" style="background: #007bff; color: #fff; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Reset Password</a></p>
            <p>If the button doesn't work, copy and paste this URL into your browser:</p>
            <p>${resetUrl}</p>
            <p>This link will expire in 7 days.</p>
          </div>
          <p style="text-align: center; color: #888;">&copy; ${new Date().getFullYear()} SubRosa Hub. All rights reserved.</p>
        </body>
      </html>
    `;

    const params = {
      Source: process.env.SES_EMAIL_SOURCE,
      Destination: {
        ToAddresses: [to],
      },
      Message: {
        Subject: { Data: 'Password Reset Request', Charset: 'UTF-8' },
        Body: {
          Html: { Data: htmlContent, Charset: 'UTF-8' },
          Text: { Data: `Reset your password here: ${resetUrl}`, Charset: 'UTF-8' },
        },
      },
    };

    try {
      await this.ses.send(new SendEmailCommand(params));
      return { message: 'Password reset email sent successfully via AWS SES.' };
    } catch (error) {
      console.error('AWS SES send error:', error);
      throw new HttpException(
        {
          success: false,
          message: 'Failed to send password reset email via AWS SES',
          error: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }



  private async sendEmail(to: string, subject: string, html: string, text?: string) {

    console.log('🔹 SES initialized in region:', process.env.AWS_REGION);
    const params = {
      Source: this.sourceEmail,
      Destination: {
        ToAddresses: [to],
      },
      Message: {
        Subject: { Data: subject },
        Body: {
          Html: { Data: html },
          Text: { Data: text || '' },
        },
      },
    };

    try {
      await this.ses.send(new SendEmailCommand(params));
      return { message: 'Email sent successfully.' };
    } catch (error) {
      console.error('SES send error:', error);
      throw new HttpException(
        {
          success: false,
          message: 'Failed to send email',
          error: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async authEmail(to: string, password: string): Promise<boolean> {
    const html = `
    <html>
      <body style="font-family: Arial, sans-serif; background-color: #f4f4f4; padding: 0; margin: 0;">
        <div style="max-width:600px;margin:auto;background:#fff;border-radius:8px;overflow:hidden">
          <div style="background:#007bff;color:#fff;padding:20px;text-align:center;">
            <h1>Welcome!</h1>
          </div>
          <div style="padding:20px;color:#333;">
            ${password ? `<p>Your password is: <strong>${password}</strong></p>` : ''}
            <p>Please verify your email by clicking below:</p>
           </div>
          <div style="background:#f1f1f1;text-align:center;padding:10px;color:#777;font-size:12px;">
            &copy; ${new Date().getFullYear()} SubRosa Hub. All rights reserved.
          </div>
        </div>
      </body>
    </html>`;

    await this.sendEmail(
      to,
      'Welcome to Our Service!',
      html,
    );
    return true;
  }

  async userSignUp(to: string, verifyUrl: string, passcode: string) {
    const html = `
    <html>
      <body style="font-family: Arial, sans-serif; background-color: #f4f4f4; padding: 0; margin: 0;">
        <div style="max-width:600px;margin:auto;background:#fff;border-radius:8px;overflow:hidden">
          <div style="background:#007bff;color:#fff;padding:20px;text-align:center;">
            <h1>Welcome!</h1>
          </div>
          <div style="padding:20px;color:#333;">
            ${passcode ? `<p>Your passcode is: <strong>${passcode}</strong></p>` : ''}
            <p>Please verify your account by clicking below:</p>
            <a href="${verifyUrl}" style="background:#ADD8E6;color:#103551;text-decoration:none;padding:10px 20px;border-radius:5px;">Verify Email</a>
          </div>
          <div style="background:#f1f1f1;text-align:center;padding:10px;color:#777;font-size:12px;">
            &copy; ${new Date().getFullYear()} SubRosa Hub. All rights reserved.
          </div>
        </div>
      </body>
    </html>`;

    return await this.sendEmail(
      to,
      'Welcome to SubRosa Hub!',
      html,
      `Your passcode is: ${passcode}. Verify your account at: ${verifyUrl}`
    );
  }

  async resendEmailVerification(to: string, verifyUrl: string, passcode: string) {
    const html = `
    <html>
      <body style="font-family: Arial, sans-serif; background-color: #f4f4f4; padding: 0; margin: 0;">
        <div style="max-width:600px;margin:auto;background:#fff;border-radius:8px;overflow:hidden">
          <div style="background:#007bff;color:#fff;padding:20px;text-align:center;">
            <h1>Verify Email</h1>
          </div>
          <div style="padding:20px;color:#333;">
            <p>We received a request to verify your email address.</p>
            ${passcode ? `<p>Your passcode is: <strong>${passcode}</strong></p>` : ''}
            <p>Please click below to verify:</p>
            <a href="${verifyUrl}" style="background:#ADD8E6;color:#103551;text-decoration:none;padding:10px 20px;border-radius:5px;">Verify Email</a>
            <p>If the button doesn't work, copy this link:</p>
            <p>${verifyUrl}</p>
          </div>
          <div style="background:#f1f1f1;text-align:center;padding:10px;color:#777;font-size:12px;">
            &copy; ${new Date().getFullYear()} SubRosa Hub. All rights reserved.
          </div>
        </div>
      </body>
    </html>`;

    return await this.sendEmail(
      to,
      'Verify Your Email Address',
      html,
      `Your passcode is: ${passcode}. Verify your email at: ${verifyUrl}`
    );
  }

  async sendInviteEmail(params: {
    to: string;
    inviterName: string;
    companyName: string;
    inviteUrl: string;
    role: string;
  }) {
    const { to, inviterName, companyName, inviteUrl, role } = params;
    const html = `
    <html>
      <body style="font-family: Arial, sans-serif; background-color: #f4f4f4; padding: 0; margin: 0;">
        <div style="max-width:600px;margin:auto;background:#fff;border-radius:8px;overflow:hidden">
          <div style="background:#007bff;color:#fff;padding:20px;text-align:center;">
            <h1>You're Invited!</h1>
          </div>
          <div style="padding:20px;color:#333;">
            <p><strong>${inviterName}</strong> has invited you to join <strong>${companyName}</strong> as a <strong>${role}</strong>.</p>
            <p>Click the button below to accept the invitation and create your account:</p>
            <p style="text-align:center;margin:30px 0;">
              <a href="${inviteUrl}" style="background:#007bff;color:#fff;text-decoration:none;padding:15px 30px;border-radius:5px;font-size:16px;">Accept Invitation</a>
            </p>
            <p>If the button doesn't work, copy and paste this link into your browser:</p>
            <p style="word-break:break-all;color:#666;">${inviteUrl}</p>
            <p style="color:#999;font-size:12px;margin-top:30px;">This invitation will expire in 7 days.</p>
          </div>
          <div style="background:#f1f1f1;text-align:center;padding:10px;color:#777;font-size:12px;">
            &copy; ${new Date().getFullYear()} SubRosa Hub. All rights reserved.
          </div>
        </div>
      </body>
    </html>`;

    return await this.sendEmail(
      to,
      `${inviterName} invited you to join ${companyName}`,
      html,
      `${inviterName} has invited you to join ${companyName} as a ${role}. Accept the invitation at: ${inviteUrl}`
    );
  }

  async sendPasswordResetEmail(to: string, resetUrl: string) {
    const html = `
    <html>
      <body style="font-family: Arial, sans-serif; background-color: #f4f4f4; padding: 0; margin: 0;">
        <div style="max-width:600px;margin:auto;background:#fff;border-radius:8px;overflow:hidden">
          <div style="background:#007bff;color:#fff;padding:20px;text-align:center;">
            <h1>Reset Your Password</h1>
          </div>
          <div style="padding:20px;color:#333;">
            <p>We received a request to reset your password. If you didn't make this request, you can safely ignore this email.</p>
            <p>Click the button below to reset your password:</p>
            <p style="text-align:center;margin:30px 0;">
              <a href="${resetUrl}" style="background:#007bff;color:#fff;text-decoration:none;padding:15px 30px;border-radius:5px;font-size:16px;">Reset Password</a>
            </p>
            <p>If the button doesn't work, copy and paste this link into your browser:</p>
            <p style="word-break:break-all;color:#666;">${resetUrl}</p>
            <p style="color:#999;font-size:12px;margin-top:30px;">This link will expire in 1 hour.</p>
          </div>
          <div style="background:#f1f1f1;text-align:center;padding:10px;color:#777;font-size:12px;">
            &copy; ${new Date().getFullYear()} SubRosa Hub. All rights reserved.
          </div>
        </div>
      </body>
    </html>`;

    return await this.sendEmail(
      to,
      'Reset Your Password',
      html,
      `Reset your password at: ${resetUrl}. This link will expire in 1 hour.`
    );
  }

}
