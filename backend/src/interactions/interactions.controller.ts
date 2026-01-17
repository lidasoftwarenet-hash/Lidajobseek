import { Controller, Post, Body, Get, Param, ParseIntPipe, Patch, Delete, Query } from '@nestjs/common';
import { InteractionsService } from './interactions.service';
import { CreateInteractionDto } from './dto/create-interaction.dto';

@Controller('interactions')
export class InteractionsController {
    constructor(private readonly interactionsService: InteractionsService) { }

    @Post()
    create(@Body() dto: CreateInteractionDto) {
        return this.interactionsService.create(dto);
    }

    @Get()
    findAll(
        @Query('startDate') startDate?: string,
        @Query('endDate') endDate?: string,
        @Query('processId') processId?: string,
    ) {
        // If startDate and endDate are provided, return interactions within date range
        // Otherwise return all interactions
        return this.interactionsService.findAll(startDate, endDate, processId ? parseInt(processId) : undefined);
    }

    @Get('process/:processId')
    findByProcess(@Param('processId', ParseIntPipe) processId: number) {
        return this.interactionsService.findByProcess(processId);
    }

    @Patch(':id')
    update(@Param('id', ParseIntPipe) id: number, @Body() dto: any) {
        return this.interactionsService.update(id, dto);
    }

    @Delete(':id')
    remove(@Param('id', ParseIntPipe) id: number) {
        return this.interactionsService.remove(id);
    }
}
