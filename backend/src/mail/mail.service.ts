import { Injectable } from '@nestjs/common';
import * as SibApiV3Sdk from 'sib-api-v3-sdk';

@Injectable()
export class MailService {
  private emailApi: SibApiV3Sdk.TransactionalEmailsApi;

  constructor() {
    const apiInstance = new SibApiV3Sdk.TransactionalEmailsApi();
    apiInstance.setApiKey(
      SibApiV3Sdk.TransactionalEmailsApiApiKeys.apiKey,
      process.env.BREVO_API_KEY || '',
    );
    this.emailApi = apiInstance;
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

    const email = new SibApiV3Sdk.SendSmtpEmail();
    email.sender = {
      name: 'JobSeek',
      email: 'no-reply@jobseek.app',
    };
    email.to = [{ email: to }];
    email.subject = 'Your CV from JobSeek';
    email.htmlContent = html;
    email.attachment = [
      {
        name: 'cv.pdf',
        content: pdfBuffer.toString('base64'),
      },
    ];

    await this.emailApi.sendTransacEmail(email);
  }
}
