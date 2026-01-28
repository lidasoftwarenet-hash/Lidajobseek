import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CreateInteractionDto } from './dto/create-interaction.dto';

@Injectable()
export class InteractionsService {
  constructor(private prisma: PrismaService) { }

  async create(dto: CreateInteractionDto) {
    const interaction = await this.prisma.interaction.create({
      data: {
        processId: dto.processId,
        date: new Date(dto.date),
        interviewType: dto.interviewType,
        participants: dto.participants,
        summary: dto.summary,
        testsAssessment: dto.testsAssessment,
        roleInsights: dto.roleInsights,
        notes: dto.notes,
        headsup: dto.headsup,
        nextInviteStatus: dto.nextInviteStatus,
        nextInviteDate: dto.nextInviteDate
          ? new Date(dto.nextInviteDate)
          : null,
        nextInviteLink: dto.nextInviteLink,
        nextInviteType: dto.nextInviteType,
        invitationExtended: dto.invitationExtended,
      },
    });

    // Auto-add network contacts
    if (dto.participants && Array.isArray(dto.participants)) {
      for (const p of dto.participants) {
        const participant = p as any;
        if (participant.name) {
          // Check if this contact already exists for this process
          const existingContact = await this.prisma.contact.findFirst({
            where: {
              processId: dto.processId,
              name: participant.name
            }
          });

          if (!existingContact) {
            await this.prisma.contact.create({
              data: {
                processId: dto.processId,
                name: participant.name,
                role: participant.role || 'Interviewer',
                // We don't have email/linkedIn here yet, can be updated later
              }
            });
          }
        }
      }
    }

    return interaction;
  }

  async findAll(startDate?: string, endDate?: string, processId?: number) {
    const where: any = {};

    if (processId) {
      where.processId = processId;
    }

    if (startDate && endDate) {
      where.date = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      };
    } else if (startDate) {
      where.date = {
        gte: new Date(startDate),
      };
    } else if (endDate) {
      where.date = {
        lte: new Date(endDate),
      };
    }

    return this.prisma.interaction.findMany({
      where,
      include: {
        process: {
          select: {
            companyName: true,
            roleTitle: true,
          },
        },
      },
      orderBy: { date: 'asc' },
    });
  }

  async findByProcess(processId: number) {
    return this.prisma.interaction.findMany({
      where: { processId },
      orderBy: { date: 'desc' },
    });
  }

  async update(id: number, dto: any) {
    const data: any = { ...dto };
    if (dto.date) data.date = new Date(dto.date);
    if (dto.nextInviteDate) data.nextInviteDate = new Date(dto.nextInviteDate);

    return this.prisma.interaction.update({
      where: { id },
      data,
    });
  }

  async remove(id: number) {
    return this.prisma.interaction.delete({
      where: { id },
    });
  }

  async exportData() {
    return this.prisma.interaction.findMany({
      include: {
        process: {
          select: {
            companyName: true,
            roleTitle: true,
          },
        },
      },
    });
  }

  async importData(interactions: any[], mode: 'overwrite' | 'append') {
    if (mode === 'overwrite') {
      await this.prisma.interaction.deleteMany({});
    }

    let count = 0;
    for (const i of interactions) {
      const { id, process, ...interactionData } = i;

      // Convert date strings to Date objects
      if (interactionData.date) interactionData.date = new Date(interactionData.date);
      if (interactionData.nextInviteDate) interactionData.nextInviteDate = new Date(interactionData.nextInviteDate);
      if (interactionData.createdAt) interactionData.createdAt = new Date(interactionData.createdAt);

      // Check if process exists
      const processExists = await this.prisma.process.findUnique({
        where: { id: interactionData.processId },
      });

      if (processExists) {
        await this.prisma.interaction.create({
          data: interactionData,
        });
        count++;
      }
    }
    return { count };
  }
}
