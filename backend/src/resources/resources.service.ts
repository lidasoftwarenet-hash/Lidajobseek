import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@mikro-orm/nestjs';
import { EntityRepository, EntityManager, QueryOrder } from '@mikro-orm/postgresql';
import { Resource } from './resource.entity';
import { supabase, supabaseBucket } from '../config/supabase';
import { extname } from 'path';
import { randomUUID } from 'crypto';

const SIGNED_URL_TTL_SECONDS = 60;

const ALLOWED_FILE_TYPES: Record<string, string[]> = {
  '.pdf': ['application/pdf'],
  '.png': ['image/png'],
  '.jpg': ['image/jpeg'],
  '.jpeg': ['image/jpeg'],
  '.doc': ['application/msword'],
  '.docx': ['application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
  '.xls': ['application/vnd.ms-excel'],
  '.xlsx': ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'],
  '.csv': ['text/csv', 'application/csv', 'application/vnd.ms-excel'],
};

const GENERIC_BINARY_MIME = 'application/octet-stream';

@Injectable()
export class ResourcesService {
  private readonly logger = new Logger(ResourcesService.name);

  constructor(
    @InjectRepository(Resource)
    private readonly resourceRepository: EntityRepository<Resource>,
    private readonly em: EntityManager,
  ) { }

  async create(data: any, userId: number, file?: Express.Multer.File): Promise<Resource> {
    const payload = { ...data };
    let storagePath: string | null = null;

    if (file) {
      const extension = this.validateUploadedFile(file);
      storagePath = this.buildStoragePath(userId, extension);
      await this.uploadFileToSupabase(storagePath, file, userId);
      payload.content = storagePath;

      if (!payload.title) {
        payload.title = file.originalname;
      }
    }

    try {
      const resource = this.resourceRepository.create({ ...payload, user: userId } as any);
      await this.em.persistAndFlush(resource);

      if (storagePath) {
        this.logger.log(
          JSON.stringify({
            event: 'resource_upload_success',
            userId,
            resourceId: resource.id,
            storagePath,
          }),
        );
      }

      return resource;
    } catch (dbError: unknown) {
      if (storagePath) {
        await this.rollbackUploadedFile(storagePath, userId, dbError);
      }

      throw new InternalServerErrorException('Failed to create resource record.');
    }
  }

  async getSignedUrl(resourceId: string, userId: string): Promise<string> {
    const parsedResourceId = Number(resourceId);
    const parsedUserId = Number(userId);

    if (!Number.isInteger(parsedResourceId) || !Number.isInteger(parsedUserId)) {
      throw new BadRequestException('Invalid resourceId or userId.');
    }

    const resource = await this.resourceRepository.findOne({
      id: parsedResourceId,
      user: parsedUserId,
    } as any);

    if (!resource) {
      throw new NotFoundException('Resource not found.');
    }

    const { data, error } = await supabase.storage
      .from(supabaseBucket)
      .createSignedUrl(resource.content, SIGNED_URL_TTL_SECONDS);

    if (error || !data?.signedUrl) {
      this.logger.error(
        JSON.stringify({
          event: 'resource_signed_url_failed',
          userId: parsedUserId,
          resourceId: parsedResourceId,
          storagePath: resource.content,
          error: error?.message ?? 'Missing signed URL response',
        }),
      );
      throw new InternalServerErrorException('Failed to generate signed URL.');
    }

    return data.signedUrl;
  }

  async findAll(userId: number): Promise<Resource[]> {
    return this.resourceRepository.find(
      { user: userId } as any,
      { orderBy: { updatedAt: QueryOrder.DESC } },
    );
  }

  async findOne(id: number, userId: number): Promise<Resource | null> {
    return this.resourceRepository.findOne({ id, user: userId } as any);
  }

  async update(id: number, data: any, userId: number): Promise<Resource | null> {
    const resource = await this.resourceRepository.findOne({ id, user: userId } as any);
    if (!resource) {
      return null;
    }
    Object.assign(resource, data);
    await this.em.flush();
    return resource;
  }

  async remove(id: number, userId: number): Promise<Resource | null> {
    const resource = await this.resourceRepository.findOne({ id, user: userId } as any);
    if (resource) {
      await this.em.removeAndFlush(resource);
    }
    return resource;
  }

  private validateUploadedFile(file: Express.Multer.File): string {
    const extension = extname(file.originalname || '').toLowerCase();
    const allowedMimeTypes = ALLOWED_FILE_TYPES[extension];

    if (!allowedMimeTypes) {
      throw new BadRequestException('Unsupported file type.');
    }

    const normalizedMimeType = (file.mimetype || '').toLowerCase();
    const isMimeAllowed =
      allowedMimeTypes.includes(normalizedMimeType) ||
      normalizedMimeType === GENERIC_BINARY_MIME;

    if (!isMimeAllowed) {
      throw new BadRequestException('File MIME type does not match file extension.');
    }

    return extension;
  }

  private buildStoragePath(userId: number, extension: string): string {
    const fileId = randomUUID();
    return `${userId}/${fileId}${extension}`;
  }

  private async uploadFileToSupabase(
    storagePath: string,
    file: Express.Multer.File,
    userId: number,
  ): Promise<void> {
    const { error } = await supabase.storage
      .from(supabaseBucket)
      .upload(storagePath, file.buffer, {
        contentType: file.mimetype,
        upsert: false,
      });

    if (error) {
      const isRlsError = error.message.toLowerCase().includes('row-level security policy');
      this.logger.error(
        JSON.stringify({
          event: 'resource_upload_failed',
          userId,
          bucket: supabaseBucket,
          storagePath,
          mimeType: file.mimetype,
          error: error.message,
          hint: isRlsError
            ? 'Check that SUPABASE_SERVICE_ROLE_KEY is the service role key and bucket policies allow server uploads.'
            : undefined,
        }),
      );
      throw new InternalServerErrorException('Failed to upload file to storage.');
    }
  }

  private async rollbackUploadedFile(
    storagePath: string,
    userId: number,
    dbError: unknown,
  ): Promise<void> {
    const { error } = await supabase.storage.from(supabaseBucket).remove([storagePath]);

    if (error) {
      this.logger.error(
        JSON.stringify({
          event: 'resource_upload_rollback_failed',
          userId,
          storagePath,
          dbError: dbError instanceof Error ? dbError.message : 'Unknown DB error',
          rollbackError: error.message,
        }),
      );
      return;
    }

    this.logger.warn(
      JSON.stringify({
        event: 'resource_upload_rollback_success',
        userId,
        storagePath,
        dbError: dbError instanceof Error ? dbError.message : 'Unknown DB error',
      }),
    );
  }
}
