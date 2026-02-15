import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@mikro-orm/nestjs';
import { EntityRepository, EntityManager, QueryOrder } from '@mikro-orm/postgresql';
import { Interaction } from './interaction.entity';
import { Process } from '../processes/process.entity';
import { Contact } from '../contacts/contact.entity';
import { CreateInteractionDto } from './dto/create-interaction.dto';
import { UpdateInteractionDto } from './dto/update-interaction.dto';

@Injectable()
export class InteractionsService {
  constructor(
    @InjectRepository(Interaction)
    private readonly interactionRepository: EntityRepository<Interaction>,
    @InjectRepository(Contact)
    private readonly contactRepository: EntityRepository<Contact>,
    @InjectRepository(Process)
    private readonly processRepository: EntityRepository<Process>,
    private readonly em: EntityManager,
  ) { }

  private parseDateOrThrow(value: string, fieldName: string): Date {
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) {
      throw new BadRequestException(`${fieldName} must be a valid date`);
    }
    return parsed;
  }

  async create(dto: CreateInteractionDto, userId: number): Promise<Interaction> {
    const process = await this.processRepository.findOne({ id: dto.processId, user: userId });
    if (!process) {
      throw new Error('Process not found');
    }

    const {
      processId,
      date,
      nextInviteDate,
      ...rest
    } = dto;

    const interaction = this.interactionRepository.create({
      ...rest,
      date: this.parseDateOrThrow(date, 'date'),
      nextInviteDate: nextInviteDate
        ? this.parseDateOrThrow(nextInviteDate, 'nextInviteDate')
        : undefined,
      process,
    } as any);

    await this.em.persistAndFlush(interaction);

    // Auto-add network contacts
    if (dto.participants && Array.isArray(dto.participants)) {
      for (const p of dto.participants) {
        const participant = p as any;
        if (participant.name) {
          // Check if this contact already exists for this process
          const existingContact = await this.contactRepository.findOne({
            process: dto.processId,
            name: participant.name,
          });

          if (!existingContact) {
            const contact = this.contactRepository.create({
              name: participant.name,
              role: participant.role || 'Interviewer',
              process,
            } as any);
            await this.em.persistAndFlush(contact);
          }
        }
      }
    }

    return interaction;
  }

  async findAll(userId: number, startDate?: string, endDate?: string, processId?: number): Promise<any[]> {
    const where: any = {};

    if (processId) {
      where.process = processId;
    }

    if (startDate && endDate) {
      where.date = {
        $gte: this.parseDateOrThrow(startDate, 'startDate'),
        $lte: this.parseDateOrThrow(endDate, 'endDate'),
      };
    } else if (startDate) {
      where.date = {
        $gte: this.parseDateOrThrow(startDate, 'startDate'),
      };
    } else if (endDate) {
      where.date = {
        $lte: this.parseDateOrThrow(endDate, 'endDate'),
      };
    }

    const interactions = await this.interactionRepository.find({
      ...where,
      process: { user: userId },
    }, {
      populate: ['process'],
      orderBy: { date: QueryOrder.ASC },
    });

    // Format response to match expected structure
    return interactions.map(interaction => ({
      ...interaction,
      process: {
        companyName: interaction.process.companyName,
        roleTitle: interaction.process.roleTitle,
      },
    }));
  }

  async findByProcess(processId: number, userId: number): Promise<Interaction[]> {
    return this.interactionRepository.find(
      { process: { id: processId, user: userId } },
      { orderBy: { date: QueryOrder.DESC } },
    );
  }

  async update(id: number, dto: UpdateInteractionDto, userId: number): Promise<Interaction | null> {
    const interaction = await this.interactionRepository.findOne({ id, process: { user: userId } });
    if (!interaction) {
      return null;
    }

    const data: any = { ...dto };
    if (dto.date) data.date = this.parseDateOrThrow(dto.date, 'date');
    if (dto.nextInviteDate) data.nextInviteDate = this.parseDateOrThrow(dto.nextInviteDate, 'nextInviteDate');

    Object.assign(interaction, data);
    await this.em.flush();
    return interaction;
  }

  async remove(id: number, userId: number): Promise<Interaction | null> {
    const interaction = await this.interactionRepository.findOne({ id, process: { user: userId } });
    if (interaction) {
      await this.em.removeAndFlush(interaction);
    }
    return interaction;
  }

  async exportData(userId: number): Promise<any[]> {
    const interactions = await this.interactionRepository.find({
      process: { user: userId },
    }, {
      populate: ['process'],
    });

    return interactions.map(interaction => ({
      ...interaction,
      process: {
        companyName: interaction.process.companyName,
        roleTitle: interaction.process.roleTitle,
      },
    }));
  }

  async importData(interactions: any[], mode: 'overwrite' | 'append', userId: number): Promise<{ count: number }> {
    return this.em.transactional(async (em) => {
      if (mode === 'overwrite') {
        const allInteractions = await em.find(Interaction, { process: { user: userId } });
        await em.removeAndFlush(allInteractions);
      }

      let count = 0;
      for (const i of interactions) {
        const { id, process, ...interactionData } = i;

        if (interactionData.date) {
          interactionData.date = this.parseDateOrThrow(interactionData.date, 'date');
        }
        if (interactionData.nextInviteDate) {
          interactionData.nextInviteDate = this.parseDateOrThrow(interactionData.nextInviteDate, 'nextInviteDate');
        }
        if (interactionData.createdAt) {
          interactionData.createdAt = this.parseDateOrThrow(interactionData.createdAt, 'createdAt');
        }

        const processExists = await em.findOne(Process, {
          id: interactionData.processId,
          user: userId,
        });

        if (processExists) {
          const { processId, ...data } = interactionData;
          const interaction = em.create(Interaction, {
            ...data,
            process: processExists,
          } as any);
          em.persist(interaction);
          count++;
        }
      }

      await em.flush();
      return { count };
    });
  }
}