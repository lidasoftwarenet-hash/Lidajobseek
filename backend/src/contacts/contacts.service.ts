import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@mikro-orm/nestjs';
import { EntityRepository, EntityManager } from '@mikro-orm/postgresql';
import { Contact } from './contact.entity';
import { Process } from '../processes/process.entity';

@Injectable()
export class ContactsService {
  constructor(
    @InjectRepository(Contact)
    private readonly contactRepository: EntityRepository<Contact>,
    @InjectRepository(Process)
    private readonly processRepository: EntityRepository<Process>,
    private readonly em: EntityManager,
  ) {}

  async create(data: any, userId: number): Promise<Contact> {
    const process = await this.processRepository.findOne({ id: data.processId, user: userId });
    if (!process) {
      throw new Error('Process not found');
    }
    const { processId, ...payload } = data;
    const contact = this.contactRepository.create({
      ...payload,
      process,
    });
    await this.em.persistAndFlush(contact);
    return contact;
  }

  async findAllByProcess(processId: number, userId: number): Promise<Contact[]> {
    return this.contactRepository.find({ process: { id: processId, user: userId } });
  }

  async update(id: number, data: any, userId: number): Promise<Contact | null> {
    const contact = await this.contactRepository.findOne({ id, process: { user: userId } });
    if (!contact) {
      return null;
    }
    Object.assign(contact, data);
    await this.em.flush();
    return contact;
  }

  async remove(id: number, userId: number): Promise<Contact | null> {
    const contact = await this.contactRepository.findOne({ id, process: { user: userId } });
    if (contact) {
      await this.em.removeAndFlush(contact);
    }
    return contact;
  }
}
