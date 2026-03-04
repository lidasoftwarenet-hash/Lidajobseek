import {
  ArgumentsHost,
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
  Catch,
  ExceptionFilter,
  UseFilters,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ResourcesService } from './resources.service';
import { memoryStorage, MulterError } from 'multer';

const MAX_UPLOAD_FILE_SIZE_BYTES = 5 * 1024 * 1024;

@Catch(MulterError)
class MulterBadRequestFilter implements ExceptionFilter {
  catch(exception: MulterError, host: ArgumentsHost) {
    if (exception.code === 'LIMIT_FILE_SIZE') {
      throw new BadRequestException('File too large. Maximum allowed size is 5MB.');
    }

    throw new BadRequestException(exception.message);
  }
}

@Controller('resources')
export class ResourcesController {
  constructor(private readonly resourcesService: ResourcesService) { }

  @Post()
  @UseFilters(MulterBadRequestFilter)
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: {
        fileSize: MAX_UPLOAD_FILE_SIZE_BYTES,
      },
    }),
  )
  create(@Body() body: any, @UploadedFile() file: Express.Multer.File, @Req() req: any) {
    return this.resourcesService.create(body, req.user.userId, file);
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
