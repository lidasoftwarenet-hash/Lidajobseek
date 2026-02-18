import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Delete,
  Query,
  Req,
} from '@nestjs/common';
import { InteractionsService } from './interactions.service';
import { CreateInteractionDto } from './dto/create-interaction.dto';
import { UpdateInteractionDto } from './dto/update-interaction.dto';
import { ImportInteractionsDto } from './dto/import-interactions.dto';

@Controller('interactions')
export class InteractionsController {
  constructor(private readonly interactionsService: InteractionsService) {}

  @Post()
  create(@Body() dto: CreateInteractionDto, @Req() req: any) {
    console.log('REQ.USER:', req.user);
    return this.interactionsService.create(dto, req.user.userId);
  }

  @Get()
  findAll(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('processId', new ParseIntPipe({ optional: true })) processId?: number,
    @Req() req?: any,
  ) {
    // If startDate and endDate are provided, return interactions within date range
    // Otherwise return all interactions
    return this.interactionsService.findAll(
      req.user.userId,
      startDate,
      endDate,
      processId,
    );
  }

  @Get('export')
  exportData(@Req() req: any) {
    return this.interactionsService.exportData(req.user.userId);
  }

  @Post('import')
  importData(@Body() data: ImportInteractionsDto, @Req() req: any) {
    return this.interactionsService.importData(data.interactions, data.mode, req.user.userId);
  }

  @Get('process/:processId')
  findByProcess(@Param('processId', ParseIntPipe) processId: number, @Req() req: any) {
    return this.interactionsService.findByProcess(processId, req.user.userId);
  }

  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateInteractionDto, @Req() req: any) {
    return this.interactionsService.update(id, dto, req.user.userId);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number, @Req() req: any) {
    return this.interactionsService.remove(id, req.user.userId);
  }
}
