import {
  BadRequestException,
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Put,
  ParseIntPipe,
  UseInterceptors,
  UploadedFile,
  Req,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ResourcesService } from './resources.service';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { CreateResourceDto } from './dto/create-resource.dto';
import { UpdateResourceDto } from './dto/update-resource.dto';

const RESOURCE_UPLOAD_MAX_SIZE = 10 * 1024 * 1024;
const ALLOWED_RESOURCE_MIME_TYPES = [
  'application/pdf',
  'text/plain',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'image/png',
  'image/jpeg',
  'image/webp',
];

const resourceFileFilter = (
  _req: any,
  file: Express.Multer.File,
  cb: (error: Error | null, acceptFile: boolean) => void,
) => {
  if (!ALLOWED_RESOURCE_MIME_TYPES.includes(file.mimetype)) {
    return cb(new BadRequestException('Unsupported file type'), false);
  }
  cb(null, true);
};

@Controller('resources')
export class ResourcesController {
  constructor(private readonly resourcesService: ResourcesService) { }

  @Post()
  @UseInterceptors(
    FileInterceptor('file', {
      limits: {
        fileSize: RESOURCE_UPLOAD_MAX_SIZE,
      },
      fileFilter: resourceFileFilter,
      storage: diskStorage({
        destination: './uploads',
        filename: (_req, file, cb) => {
          const uniqueSuffix =
            Date.now() + '-' + Math.round(Math.random() * 1e9);
          cb(null, `${uniqueSuffix}${extname(file.originalname)}`);
        },
      }),
    }),
  )
  create(@Body() body: CreateResourceDto, @UploadedFile() file: Express.Multer.File, @Req() req: any) {
    if (file) {
      body.content = `/uploads/${file.filename}`;
      // Allow overriding title if not provided
      if (!body.title) body.title = file.originalname;
    }
    if (!body.content?.trim()) {
      throw new BadRequestException('content is required when no file is uploaded');
    }
    return this.resourcesService.create(body, req.user.userId);
  }

  @Get()
  findAll(@Req() req: any) {
    return this.resourcesService.findAll(req.user.userId);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number, @Req() req: any) {
    return this.resourcesService.findOne(id, req.user.userId);
  }

  @Put(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() data: UpdateResourceDto, @Req() req: any) {
    return this.resourcesService.update(id, data, req.user.userId);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number, @Req() req: any) {
    return this.resourcesService.remove(id, req.user.userId);
  }
}
