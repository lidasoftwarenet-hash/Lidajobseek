import { Injectable } from '@nestjs/common';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const SibApiV3Sdk: any = require('sib-api-v3-sdk');

@Injectable()
export class MailService {
  private emailApi: any;

  constructor() {
    const client = SibApiV3Sdk.ApiClient.instance;
    client.authentications['api-key'].apiKey =
      process.env.BREVO_API_KEY || '';

    this.emailApi = new SibApiV3Sdk.TransactionalEmailsApi();
  }

  async sendCvByEmail(
    to: string,
    pdfBuffer: Buffer,
    senderName?: string,
  ): Promise<void> {
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #3b82f6;">Your CV</h2>
        <p>Hello,</p>
        <p>${
          senderName
            ? `${senderName} has shared their CV with you.`
            : 'You have been sent a CV from JobSeek.'
        }</p>
        <p>Please find the CV attached as a PDF file.</p>
        <p>Best regards,<br>JobSeek Team</p>
      </div>
    `;

    await this.emailApi.sendTransacEmail({
      sender: {
        name: 'Lida Software',
        email: 'lidasoftwarenet@gmail.com',
      },
      
      to: [{ email: to }],
      subject: 'CV from Lida Software JobAssistant Application',
      htmlContent: html,
      attachment: [
        {
          name: 'cv.pdf',
          content: pdfBuffer.toString('base64'),
        },
      ],
    });
  }

  async sendAccountActivationEmail(
    to: string,
    userName: string,
    activationLink: string,
  ): Promise<void> {
    const html = `
      <div style="font-family: Inter, Arial, sans-serif; max-width: 620px; margin: 0 auto; background: #f8fafc; padding: 24px; border-radius: 16px; border: 1px solid #e2e8f0;">
        <h2 style="margin-top: 0; color: #1e293b;">Welcome to Lida Job Assistance</h2>
        <p style="color: #334155; font-size: 15px;">Hi ${userName || 'there'},</p>
        <p style="color: #334155; font-size: 15px; line-height: 1.6;">
          Your account has been created successfully. To activate your account and start using the platform,
          please verify your email address.
        </p>
        <div style="margin: 28px 0; text-align: center;">
          <a href="${activationLink}" style="display: inline-block; background: linear-gradient(135deg, #2563eb, #4f46e5); color: #fff; text-decoration: none; font-weight: 600; padding: 12px 20px; border-radius: 10px;">Activate My Account</a>
        </div>
        <p style="color: #64748b; font-size: 13px; line-height: 1.6;">
          This activation link will expire in 24 hours. If you did not create this account, you can safely ignore this email.
        </p>
        <p style="color: #94a3b8; font-size: 12px; margin-top: 20px;">Lida Software • Job Assistance Platform</p>
      </div>
    `;

    await this.emailApi.sendTransacEmail({
      sender: {
        name: 'Lida Software',
        email: 'lidasoftwarenet@gmail.com',
      },
      to: [{ email: to }],
      subject: 'Activate your Lida Job Assistance account',
      htmlContent: html,
    });
  }
}
