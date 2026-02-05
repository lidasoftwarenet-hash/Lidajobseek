import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService {
  private transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: Number(process.env.SMTP_PORT || 587),
    secure: false,
    auth: {
      user: process.env.SMTP_USER || 'lidasoftwarenet@gmail.com',
      pass: process.env.SMTP_PASS || '',
    },
  });

  async sendCvByEmail(
    to: string,
    pdfBuffer: Buffer,
    senderName?: string,
  ): Promise<void> {
    const mailOptions = {
      from: `"JobSeek" <${process.env.SMTP_USER || 'lidasoftwarenet@gmail.com'}>`,
      to,
      subject: 'Your CV from JobSeek',
      html: `
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
      `,
      attachments: [
        {
          filename: 'cv.pdf',
          content: pdfBuffer,
          contentType: 'application/pdf',
        },
      ],
    };

    await this.transporter.sendMail(mailOptions);
  }
}
