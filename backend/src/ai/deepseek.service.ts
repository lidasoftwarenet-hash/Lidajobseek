import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

interface DeepSeekChatMessage {
  role: 'system' | 'user';
  content: string;
}

interface DeepSeekChatResponse {
  choices?: Array<{
    message?: {
      content?: string;
    };
  }>;
}

@Injectable()
export class DeepSeekService {
  private readonly logger = new Logger(DeepSeekService.name);
  private readonly apiKey: string | undefined;

  constructor(private readonly configService: ConfigService) {
    this.apiKey = this.configService.get<string>('DEEPSEEK_API_KEY');
  }

  isEnabled(): boolean {
    return Boolean(this.apiKey);
  }

  async generateProfessionalCv(prompt: string): Promise<string> {
    const apiKey = this.apiKey;
    const apiUrl = this.configService.get<string>('DEEPSEEK_API_URL') ?? 'https://api.deepseek.com';

    if (!apiKey) {
      this.logger.warn('DeepSeek API key is missing. Falling back to raw prompt.');
      return prompt;
    }

    const messages: DeepSeekChatMessage[] = [
      {
        role: 'system',
        content: 'You are a professional resume writer. Improve the CV sections to sound polished, concise, and recruiter-friendly. Keep it factual and avoid adding information not in the profile.',
      },
      {
        role: 'user',
        content: prompt,
      },
    ];

    const response = await fetch(`${apiUrl}/v1/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages,
        temperature: 0.4,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      this.logger.error(`DeepSeek API error: ${response.status} ${errorText}`);
      return prompt;
    }

    const data = (await response.json()) as DeepSeekChatResponse;
    const content = data.choices?.[0]?.message?.content?.trim();
    return content || prompt;
  }
}