import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@mikro-orm/nestjs';
import { EntityRepository, EntityManager, QueryOrder } from '@mikro-orm/postgresql';
import { Process } from './process.entity';
import { Interaction } from '../interactions/interaction.entity';
import { SelfReview } from '../reviews/self-review.entity';
import { Contact } from '../contacts/contact.entity';
import { User } from '../users/user.entity';
import { CreateProcessDto } from './dto/create-process.dto';
import { UpdateProcessDto } from './dto/update-process.dto';

@Injectable()
export class ProcessesService {
  constructor(
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

  async create(dto: CreateProcessDto, userId: number): Promise<Process> {
    const data: any = { ...dto, user: this.em.getReference(User, userId) };
    
    // Convert date strings to Date objects
    if (dto.initialInviteDate) {
      data.initialInviteDate = this.parseDateOrThrow(dto.initialInviteDate, 'initialInviteDate');
    }
    if (dto.nextFollowUp) {
      data.nextFollowUp = this.parseDateOrThrow(dto.nextFollowUp, 'nextFollowUp');
    }

    // Convert empty strings to null for numeric fields
    if (data.salaryExpectation === '' || data.salaryExpectation === undefined) {
      data.salaryExpectation = null;
    }
    if (data.daysFromOffice === '' || data.daysFromOffice === undefined) {
      data.daysFromOffice = null;
    }
    if (data.scoreTech === '' || data.scoreTech === undefined) {
      data.scoreTech = 0;
    }
    if (data.scoreWLB === '' || data.scoreWLB === undefined) {
      data.scoreWLB = 0;
    }
    if (data.scoreGrowth === '' || data.scoreGrowth === undefined) {
      data.scoreGrowth = 0;
    }
    if (data.scoreVibe === '' || data.scoreVibe === undefined) {
      data.scoreVibe = 0;
    }

    const process = this.processRepository.create(data);
    await this.em.persistAndFlush(process);
    return process;
  }

  async findAll(userId: number): Promise<any[]> {
    const processes = await this.processRepository.find(
      { user: userId },
      {
        populate: ['interactions', 'reviews'],
        orderBy: { updatedAt: QueryOrder.DESC },
      },
    );

    // Add interaction count manually
    return processes.map(process => ({
      ...process,
      _count: {
        interactions: process.interactions.length,
      },
    }));
  }

  async findOne(id: number, userId: number): Promise<Process | null> {
    const process = await this.processRepository.findOne(
      { id, user: userId },
      {
        populate: ['interactions', 'reviews', 'contacts'],
      },
    );

    if (process) {
      // Sort interactions and reviews
      process.interactions.getItems().sort((a, b) => b.date.getTime() - a.date.getTime());
      process.reviews.getItems().sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    }

    return process;
  }

  async update(id: number, dto: UpdateProcessDto, userId: number): Promise<Process | null> {
    const process = await this.processRepository.findOne({ id, user: userId });
    if (!process) {
      return null;
    }

    const data: any = { ...dto };
    
    // Convert date strings to Date objects
    if (dto.initialInviteDate) {
      data.initialInviteDate = this.parseDateOrThrow(dto.initialInviteDate, 'initialInviteDate');
    }
    if (dto.nextFollowUp) {
      data.nextFollowUp = this.parseDateOrThrow(dto.nextFollowUp, 'nextFollowUp');
    }
    if (dto.offerDeadline) {
      data.offerDeadline = this.parseDateOrThrow(dto.offerDeadline, 'offerDeadline');
    }

    // Convert empty strings to null for numeric fields
    if (data.salaryExpectation === '') {
      data.salaryExpectation = null;
    }
    if (data.daysFromOffice === '') {
      data.daysFromOffice = null;
    }
    if (data.baseSalary === '') {
      data.baseSalary = null;
    }
    if (data.signingBonus === '') {
      data.signingBonus = null;
    }

    Object.assign(process, data);
    await this.em.flush();
    return process;
  }

  async remove(id: number, userId: number): Promise<Process | null> {
    const process = await this.processRepository.findOne({ id, user: userId });
    if (process) {
      await this.em.removeAndFlush(process);
    }
    return process;
  }

  async exportData(userId: number): Promise<Process[]> {
    return this.processRepository.find(
      { user: userId },
      {
        populate: ['interactions', 'reviews', 'contacts'],
      },
    );
  }

  async importData(processes: any[], mode: 'overwrite' | 'append', userId: number): Promise<{ count: number }> {
    return this.em.transactional(async (em) => {
      if (mode === 'overwrite') {
        const userProcesses = await em.find(Process, { user: userId });
        await em.removeAndFlush(userProcesses);
      }

      let count = 0;
      for (const p of processes) {
        const {
          id,
          interactions,
          reviews,
          contacts,
          _count,
          userId: oldUserId,
          ...processData
        } = p;

        if (processData.createdAt) {
          processData.createdAt = this.parseDateOrThrow(processData.createdAt, 'createdAt');
        }
        if (processData.updatedAt) {
          processData.updatedAt = this.parseDateOrThrow(processData.updatedAt, 'updatedAt');
        }
        if (processData.initialInviteDate) {
          processData.initialInviteDate = this.parseDateOrThrow(processData.initialInviteDate, 'initialInviteDate');
        }
        if (processData.offerDeadline) {
          processData.offerDeadline = this.parseDateOrThrow(processData.offerDeadline, 'offerDeadline');
        }
        if (processData.nextFollowUp) {
          processData.nextFollowUp = this.parseDateOrThrow(processData.nextFollowUp, 'nextFollowUp');
        }

        const process = em.create(Process, {
          ...processData,
          user: em.getReference(User, userId),
        });

        if (Array.isArray(interactions) && interactions.length > 0) {
          for (const i of interactions) {
            const { id, processId, ...iData } = i;
            if (iData.date) iData.date = this.parseDateOrThrow(iData.date, 'date');
            if (iData.nextInviteDate) {
              iData.nextInviteDate = this.parseDateOrThrow(iData.nextInviteDate, 'nextInviteDate');
            }
            if (iData.createdAt) {
              iData.createdAt = this.parseDateOrThrow(iData.createdAt, 'createdAt');
            }

            const interaction = em.create(Interaction, { ...iData, process });
            process.interactions.add(interaction);
          }
        }

        if (Array.isArray(reviews) && reviews.length > 0) {
          for (const r of reviews) {
            const { id, processId, ...rData } = r;
            if (rData.createdAt) {
              rData.createdAt = this.parseDateOrThrow(rData.createdAt, 'createdAt');
            }

            const review = em.create(SelfReview, { ...rData, process });
            process.reviews.add(review);
          }
        }

        if (Array.isArray(contacts) && contacts.length > 0) {
          for (const c of contacts) {
            const { id, processId, ...cData } = c;
            const contact = em.create(Contact, { ...cData, process });
            process.contacts.add(contact);
          }
        }

        em.persist(process);
        count++;
      }

      await em.flush();
      return { count };
    });
  }
}