import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CreateProcessDto } from './dto/create-process.dto';

@Injectable()
export class ProcessesService {
  constructor(private prisma: PrismaService) { }

  create(dto: CreateProcessDto, userId: number) {
    const data: any = { ...dto, userId };
    if (dto.initialInviteDate) {
      data.initialInviteDate = new Date(dto.initialInviteDate);
    }
    if (dto.nextFollowUp) {
      data.nextFollowUp = new Date(dto.nextFollowUp);
    }

    return this.prisma.process.create({
      data,
    });
  }

  async findAll(userId: number) {
    // First, check and update any processes that need automatic stage update
    await this.updateStaleProcesses();

    return this.prisma.process.findMany({
      where: { userId },
      include: {
        interactions: true,
        reviews: true,
        _count: {
          select: { interactions: true },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });
  }

  async findOne(id: number, userId: number) {
    // First, check and update any processes that need automatic stage update
    await this.updateStaleProcesses();

    return this.prisma.process.findFirst({
      where: { id, userId },
      include: {
        interactions: { orderBy: { date: 'desc' } },
        reviews: { orderBy: { createdAt: 'desc' } },
        contacts: true,
      },
    });
  }

  update(id: number, dto: any, userId: number) {
    const data: any = { ...dto };
    if (dto.initialInviteDate) {
      data.initialInviteDate = new Date(dto.initialInviteDate);
    }
    if (dto.nextFollowUp) {
      data.nextFollowUp = new Date(dto.nextFollowUp);
    }
    if (dto.offerDeadline) {
      data.offerDeadline = new Date(dto.offerDeadline);
    }

    return this.prisma.process.updateMany({
      where: { id, userId },
      data,
    });
  }

  remove(id: number, userId: number) {
    return this.prisma.process.deleteMany({
      where: { id, userId },
    });
  }

  async exportData(userId: number) {
    return this.prisma.process.findMany({
      where: { userId },
      include: {
        interactions: true,
        reviews: true,
        contacts: true,
      },
    });
  }

  async importData(processes: any[], mode: 'overwrite' | 'append', userId: number) {
    if (mode === 'overwrite') {
      // Delete interactions, reviews, contacts explicitly first? Or rely on Cascade?
      // Delete user's processes
      const userProcesses = await this.prisma.process.findMany({ where: { userId }, select: { id: true } });
      const ids = userProcesses.map(p => p.id);

      // Since cascade delete is configured in schema, deleting processes should suffice
      await this.prisma.process.deleteMany({ where: { userId } });
    }

    let count = 0;
    for (const p of processes) {
      const { id, interactions, reviews, contacts, _count, userId: oldUserId, ...processData } = p;

      // Convert date strings to Date objects
      if (processData.createdAt) processData.createdAt = new Date(processData.createdAt);
      if (processData.updatedAt) processData.updatedAt = new Date(processData.updatedAt);
      if (processData.initialInviteDate) processData.initialInviteDate = new Date(processData.initialInviteDate);
      if (processData.offerDeadline) processData.offerDeadline = new Date(processData.offerDeadline);
      if (processData.nextFollowUp) processData.nextFollowUp = new Date(processData.nextFollowUp);

      await this.prisma.process.create({
        data: {
          ...processData,
          userId, // Force current user ID
          interactions: {
            create: interactions?.map((i: any) => {
              const { id, processId, ...iData } = i;
              if (iData.date) iData.date = new Date(iData.date);
              if (iData.nextInviteDate) iData.nextInviteDate = new Date(iData.nextInviteDate);
              if (iData.createdAt) iData.createdAt = new Date(iData.createdAt);
              return iData;
            }),
          },
          reviews: {
            create: reviews?.map((r: any) => {
              const { id, processId, ...rData } = r;
              if (rData.createdAt) rData.createdAt = new Date(rData.createdAt);
              return rData;
            }),
          },
          contacts: {
            create: contacts?.map((c: any) => {
              const { id, processId, ...cData } = c;
              return cData;
            }),
          },
        },
      });
      count++;
    }
    return { count };
  }

  /**
   * Automatically update processes to "No Response (14+ Days)" if:
   * - Last update was 14+ days ago
   * - Current stage is NOT "Rejected" or "Withdrawn"
   * - Current stage is NOT already "No Response (14+ Days)"
   */
  private async updateStaleProcesses() {
    const fourteenDaysAgo = new Date();
    fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);

    try {
      const staleProcesses = await this.prisma.process.findMany({
        where: {
          updatedAt: {
            lte: fourteenDaysAgo,
          },
          currentStage: {
            notIn: ['Rejected', 'Withdrawn', 'No Response (14+ Days)'],
          },
        },
      });

      if (staleProcesses.length > 0) {
        const updatePromises = staleProcesses.map((process: any) =>
          this.prisma.process.update({
            where: { id: process.id },
            data: {
              currentStage: 'No Response (14+ Days)',
              // Keep the original updatedAt timestamp to avoid infinite updates
              // We'll update a different field or add a note if needed
            },
          }),
        );

        await Promise.all(updatePromises);
        console.log(
          `Automatically updated ${staleProcesses.length} process(es) to "No Response (14+ Days)"`,
        );
      }
    } catch (error) {
      console.error('Error updating stale processes:', error);
      // Don't throw error to avoid breaking the main query
    }
  }
}
