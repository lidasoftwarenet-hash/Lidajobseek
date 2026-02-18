import { ProfilesService } from '../src/profiles/profiles.service';

describe('ProfilesService.sendCvByEmail', () => {
  const usersServiceMock = {
    findById: jest.fn(async () => ({ id: 1, email: 'sender@example.com', name: 'Sender' })),
  };

  const mailServiceMock = {
    sendCvByEmail: jest.fn(async () => undefined),
  };

  const service = new ProfilesService(
    {} as any,
    {} as any,
    usersServiceMock as any,
    { isEnabled: jest.fn(() => false), generateProfessionalCv: jest.fn() } as any,
    mailServiceMock as any,
  );

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('accepts only Buffer payloads and forwards to mail service', async () => {
    const pdfBuffer = Buffer.from('%PDF-1.4\nsmall');

    await service.sendCvByEmail(1, 'recipient@example.com', pdfBuffer);

    expect(mailServiceMock.sendCvByEmail).toHaveBeenCalledWith(
      'recipient@example.com',
      pdfBuffer,
      'Sender',
    );
  });

  it('rejects non-buffer payloads at runtime', async () => {
    await expect(
      service.sendCvByEmail(1, 'recipient@example.com', 'not-buffer' as any),
    ).rejects.toThrow('PDF content is required');
  });
});
