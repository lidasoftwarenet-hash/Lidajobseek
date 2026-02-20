import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  ParseIntPipe,
  Patch,
  Delete,
  Req,
} from '@nestjs/common';
import { ProcessesService } from './processes.service';
import { CreateProcessDto } from './dto/create-process.dto';
import { UpdateProcessDto } from './dto/update-process.dto';
import { ImportProcessesDto } from './dto/import-processes.dto';
import { UpdateProcessStagesDto } from './dto/update-process-stages.dto';

@Controller('processes')
export class ProcessesController {
  constructor(private readonly processesService: ProcessesService) { }

  @Post()
  create(@Body() createProcessDto: CreateProcessDto, @Req() req: any) {
    return this.processesService.create(createProcessDto, req.user.userId);
  }

  @Get()
  findAll(@Req() req: any) {
    return this.processesService.findAll(req.user.userId);
  }

  @Get('stages')
  getStages(@Req() req: any) {
    return this.processesService.getProcessStages(req.user.userId);
  }

  @Patch('stages')
  updateStages(@Body() dto: UpdateProcessStagesDto, @Req() req: any) {
    return this.processesService.updateProcessStages(dto, req.user.userId);
  }

  @Get('export')
  exportData(@Req() req: any) {
    return this.processesService.exportData(req.user.userId);
  }

  @Post('import')
  importData(@Body() data: ImportProcessesDto, @Req() req: any) {
    return this.processesService.importData(data.processes, data.mode, req.user.userId);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number, @Req() req: any) {
    return this.processesService.findOne(id, req.user.userId);
  }

  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() updateProcessDto: UpdateProcessDto, @Req() req: any) {
    return this.processesService.update(id, updateProcessDto, req.user.userId);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number, @Req() req: any) {
    return this.processesService.remove(id, req.user.userId);
  }
}
