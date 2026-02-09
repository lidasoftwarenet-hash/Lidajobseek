import {
  Controller,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Get,
  Query,
  Req,
  ParseIntPipe,
} from '@nestjs/common';
import { ContactsService } from './contacts.service';
import { CreateContactDto } from './dto/create-contact.dto';
import { UpdateContactDto } from './dto/update-contact.dto';

@Controller('contacts')
export class ContactsController {
  constructor(private readonly contactsService: ContactsService) {}

  @Post()
  create(@Body() data: CreateContactDto, @Req() req: any) {
    return this.contactsService.create(data, req.user.userId);
  }

  @Get()
  findAll(@Query('processId', ParseIntPipe) processId: number, @Req() req: any) {
    return this.contactsService.findAllByProcess(processId, req.user.userId);
  }

  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() data: UpdateContactDto, @Req() req: any) {
    return this.contactsService.update(id, data, req.user.userId);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number, @Req() req: any) {
    return this.contactsService.remove(id, req.user.userId);
  }
}
