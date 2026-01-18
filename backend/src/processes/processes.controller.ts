import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  ParseIntPipe,
  Patch,
  Delete,
} from '@nestjs/common';
import { ProcessesService } from './processes.service';
import { CreateProcessDto } from './dto/create-process.dto';

@Controller('processes')
export class ProcessesController {
  constructor(private readonly processesService: ProcessesService) {}

  @Post()
  create(@Body() createProcessDto: CreateProcessDto) {
    return this.processesService.create(createProcessDto);
  }

  @Get()
  findAll() {
    return this.processesService.findAll();
  }

  @Get('export')
  exportData() {
    return this.processesService.exportData();
  }

  @Post('import')
  importData(@Body() data: { processes: any[]; mode: 'overwrite' | 'append' }) {
    return this.processesService.importData(data.processes, data.mode);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.processesService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() updateProcessDto: any) {
    return this.processesService.update(id, updateProcessDto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.processesService.remove(id);
  }
}
