import { Controller, Post, Body, Patch, Param, Delete, Get, Query } from '@nestjs/common';
import { ContactsService } from './contacts.service';

@Controller('contacts')
export class ContactsController {
    constructor(private readonly contactsService: ContactsService) { }

    @Post()
    create(@Body() data: any) {
        return this.contactsService.create(data);
    }

    @Get()
    findAll(@Query('processId') processId: string) {
        return this.contactsService.findAllByProcess(+processId);
    }

    @Patch(':id')
    update(@Param('id') id: string, @Body() data: any) {
        return this.contactsService.update(+id, data);
    }

    @Delete(':id')
    remove(@Param('id') id: string) {
        return this.contactsService.remove(+id);
    }
}
