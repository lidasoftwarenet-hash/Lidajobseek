import { Injectable } from '@nestjs/common';
import { Resend } from 'resend';

@Injectable()
export class MailService {
  private resend = new Resend(process.env.RESEND_API_KEY || '');

  async sendCvByEmail(
    to: string,
    pdfBuffer: Buffer,
    senderName?: string,
  ): Promise<void> {
    const fromEmail = process.env.RESEND_FROM_EMAIL || 'lidasoftwarenet@gmail.com';
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

    await this.resend.emails.send({
      from: `"JobSeek" <${fromEmail}>`,
      to,
      subject: 'Your CV from JobSeek',
      html,
      attachments: [
        {
          filename: 'cv.pdf',
          content: pdfBuffer.toString('base64'),
        },
      ],
    });
  }
}
