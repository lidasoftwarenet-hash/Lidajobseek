import {
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
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ResourcesService } from './resources.service';
import { diskStorage } from 'multer';
import { extname } from 'path';

@Controller('resources')
export class ResourcesController {
  constructor(private readonly resourcesService: ResourcesService) { }

  @Post()
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './uploads',
        filename: (req, file, cb) => {
          const uniqueSuffix =
            Date.now() + '-' + Math.round(Math.random() * 1e9);
          cb(null, `${uniqueSuffix}${extname(file.originalname).toLowerCase()}`);
        },
      }),
      limits: {
        fileSize: 5 * 1024 * 1024, // 5MB
      },
      fileFilter: (req, file, cb) => {
        const allowedExtensions = ['.pdf', '.doc', '.docx', '.xls', '.xlsx'];
        const ext = extname(file.originalname).toLowerCase();
        if (!allowedExtensions.includes(ext)) {
          return cb(new BadRequestException('Unsupported file type. Allowed: PDF, Word, Excel.'), false);
        }
        cb(null, true);
      },
    }),
  )
  create(@Body() body: any, @UploadedFile() file: Express.Multer.File, @Req() req: any) {
    if (file) {
      body.content = `/uploads/${file.filename}`;
      // Allow overriding title if not provided
      if (!body.title) body.title = file.originalname;
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
  update(@Param('id', ParseIntPipe) id: number, @Body() data: any, @Req() req: any) {
    return this.resourcesService.update(id, data, req.user.userId);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number, @Req() req: any) {
    return this.resourcesService.remove(id, req.user.userId);
  }
}
