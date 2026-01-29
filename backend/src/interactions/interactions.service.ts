import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@mikro-orm/nestjs';
import { EntityRepository, EntityManager, QueryOrder } from '@mikro-orm/postgresql';
import { Interaction } from './interaction.entity';
import { Process } from '../processes/process.entity';
import { Contact } from '../contacts/contact.entity';
import { CreateInteractionDto } from './dto/create-interaction.dto';

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

  async create(dto: CreateInteractionDto): Promise<Interaction> {
    const process = await this.processRepository.findOne({ id: dto.processId });
    if (!process) {
      throw new Error('Process not found');
    }

    const interaction = this.interactionRepository.create({
      date: new Date(dto.date),
      interviewType: dto.interviewType,
      participants: dto.participants,
      summary: dto.summary,
      testsAssessment: dto.testsAssessment,
      roleInsights: dto.roleInsights,
      notes: dto.notes,
      headsup: dto.headsup,
      nextInviteStatus: dto.nextInviteStatus,
      nextInviteDate: dto.nextInviteDate ? new Date(dto.nextInviteDate) : undefined,
      nextInviteLink: dto.nextInviteLink,
      nextInviteType: dto.nextInviteType,
      invitationExtended: dto.invitationExtended,
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

  async findAll(startDate?: string, endDate?: string, processId?: number): Promise<any[]> {
    const where: any = {};

    if (processId) {
      where.process = processId;
    }

    if (startDate && endDate) {
      where.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      };
    } else if (startDate) {
      where.date = {
        $gte: new Date(startDate),
      };
    } else if (endDate) {
      where.date = {
        $lte: new Date(endDate),
      };
    }

    const interactions = await this.interactionRepository.find(where, {
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

  async findByProcess(processId: number): Promise<Interaction[]> {
    return this.interactionRepository.find(
      { process: processId },
      { orderBy: { date: QueryOrder.DESC } },
    );
  }

  async update(id: number, dto: any): Promise<Interaction | null> {
    const interaction = await this.interactionRepository.findOne({ id });
    if (!interaction) {
      return null;
    }

    const data: any = { ...dto };
    if (dto.date) data.date = new Date(dto.date);
    if (dto.nextInviteDate) data.nextInviteDate = new Date(dto.nextInviteDate);

    Object.assign(interaction, data);
    await this.em.flush();
    return interaction;
  }

  async remove(id: number): Promise<Interaction | null> {
    const interaction = await this.interactionRepository.findOne({ id });
    if (interaction) {
      await this.em.removeAndFlush(interaction);
    }
    return interaction;
  }

  async exportData(): Promise<any[]> {
    const interactions = await this.interactionRepository.findAll({
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

  async importData(interactions: any[], mode: 'overwrite' | 'append'): Promise<{ count: number }> {
    if (mode === 'overwrite') {
      const allInteractions = await this.interactionRepository.findAll();
      await this.em.removeAndFlush(allInteractions);
    }

    let count = 0;
    for (const i of interactions) {
      const { id, process, ...interactionData } = i;

      // Convert date strings to Date objects
      if (interactionData.date) interactionData.date = new Date(interactionData.date);
      if (interactionData.nextInviteDate) interactionData.nextInviteDate = new Date(interactionData.nextInviteDate);
      if (interactionData.createdAt) interactionData.createdAt = new Date(interactionData.createdAt);

      // Check if process exists
      const processExists = await this.processRepository.findOne({ id: interactionData.processId });

      if (processExists) {
        const { processId, ...data } = interactionData;
        const interaction = this.interactionRepository.create({ ...data, process: processExists } as any);
        this.em.persist(interaction);
        count++;
      }
    }
    
    await this.em.flush();
    return { count };
  }
}