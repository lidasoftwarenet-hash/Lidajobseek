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
}
