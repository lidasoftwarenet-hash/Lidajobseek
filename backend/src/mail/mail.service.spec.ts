import { Test, TestingModule } from '@nestjs/testing';
import { MailService } from './mail.service';
import * as nodemailer from 'nodemailer';

jest.mock('nodemailer');

describe('MailService', () => {
  let service: MailService;
  const mockSendMail = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (nodemailer.createTransport as jest.Mock).mockReturnValue({
      sendMail: mockSendMail,
    });
  });

  describe('Configuration', () => {
    it('should be configured if all environment variables are present', async () => {
      process.env.SMTP_HOST = 'smtp.test.com';
      process.env.SMTP_USER = 'user';
      process.env.SMTP_PASS = 'pass';
      
      service = new MailService();
      expect(service.isConfigured()).toBe(true);
      expect(nodemailer.createTransport).toHaveBeenCalled();
    });

    it('should NOT be configured if environment variables are missing', async () => {
      delete process.env.SMTP_HOST;
      delete process.env.SMTP_USER;
      delete process.env.SMTP_PASS;

      service = new MailService();
      expect(service.isConfigured()).toBe(false);
      expect(nodemailer.createTransport).not.toHaveBeenCalled();
    });
  });

  describe('sendMail', () => {
    beforeEach(() => {
      process.env.SMTP_HOST = 'smtp.test.com';
      process.env.SMTP_USER = 'user';
      process.env.SMTP_PASS = 'pass';
      process.env.SMTP_FROM = 'robot@test.com';
      service = new MailService();
    });

    it('should return true if email is sent successfully', async () => {
      mockSendMail.mockResolvedValue({ messageId: '123' });

      const result = await service.sendMail({
        to: 'target@example.com',
        subject: 'Hello',
        text: 'Body',
      });

      expect(result).toBe(true);
      expect(mockSendMail).toHaveBeenCalledWith(expect.objectContaining({
        from: 'robot@test.com',
        to: 'target@example.com',
      }));
    });

    it('should return false and log error if sendMail throws', async () => {
      mockSendMail.mockRejectedValue(new Error('SMTP Failure'));

      const result = await service.sendMail({
        to: 'target@example.com',
        subject: 'Hello',
        text: 'Body',
      });

      expect(result).toBe(false);
    });

    it('should return false if transporter is not initialized', async () => {
      delete process.env.SMTP_HOST;
      delete process.env.SMTP_USER;
      delete process.env.SMTP_PASS;

      const unconfiguredService = new MailService();
      const result = await unconfiguredService.sendMail({
        to: 'target@example.com',
        subject: 'Hello',
        text: 'Body',
      });

      expect(result).toBe(false);
      expect(mockSendMail).not.toHaveBeenCalled();
    });
  });
});
