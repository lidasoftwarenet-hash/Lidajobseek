import { Controller, Get, Post, Body, Param, Delete, Put, ParseIntPipe, UseInterceptors, UploadedFile } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ResourcesService } from './resources.service';
import { diskStorage } from 'multer';
import { extname } from 'path';

@Controller('resources')
export class ResourcesController {
    constructor(private readonly resourcesService: ResourcesService) { }

    @Post()
    @UseInterceptors(FileInterceptor('file', {
        storage: diskStorage({
            destination: './uploads',
            filename: (req, file, cb) => {
                const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
                cb(null, `${uniqueSuffix}${extname(file.originalname)}`);
            }
        })
    }))
    create(@Body() body: any, @UploadedFile() file: Express.Multer.File) {
        if (file) {
            body.content = `/uploads/${file.filename}`;
            // Allow overriding title if not provided
            if (!body.title) body.title = file.originalname;
        }
        return this.resourcesService.create(body);
    }

    @Get()
    findAll() {
        return this.resourcesService.findAll();
    }

    @Get(':id')
    findOne(@Param('id', ParseIntPipe) id: number) {
        return this.resourcesService.findOne(id);
    }

    @Put(':id')
    update(@Param('id', ParseIntPipe) id: number, @Body() data: any) {
        return this.resourcesService.update(id, data);
    }

    @Delete(':id')
    remove(@Param('id', ParseIntPipe) id: number) {
        return this.resourcesService.remove(id);
    }
}
