import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CreateProcessDto } from './dto/create-process.dto';

@Injectable()
export class ProcessesService {
    constructor(private prisma: PrismaService) { }

    async create(data: CreateProcessDto) {
        return this.prisma.process.create({
            data,
        });
    }

    async findAll() {
        // First, check and update any processes that need automatic stage update
        await this.updateStaleProcesses();
        
        return this.prisma.process.findMany({
            include: {
                interactions: true,
                reviews: true,
                _count: {
                    select: { interactions: true }
                }
            },
            orderBy: { updatedAt: 'desc' }
        });
    }

    async findOne(id: number) {
        // First, check and update any processes that need automatic stage update
        await this.updateStaleProcesses();
        
        return this.prisma.process.findUnique({
            where: { id },
            include: {
                interactions: { orderBy: { date: 'desc' } },
                reviews: { orderBy: { createdAt: 'desc' } },
                contacts: true
            }
        });
    }

    async update(id: number, data: any) {
        return this.prisma.process.update({
            where: { id },
            data,
        });
    }

    async remove(id: number) {
        return this.prisma.process.delete({
            where: { id },
        });
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
                        lte: fourteenDaysAgo
                    },
                    currentStage: {
                        notIn: ['Rejected', 'Withdrawn', 'No Response (14+ Days)']
                    }
                }
            });

            if (staleProcesses.length > 0) {
                const updatePromises = staleProcesses.map(process =>
                    this.prisma.process.update({
                        where: { id: process.id },
                        data: {
                            currentStage: 'No Response (14+ Days)',
                            // Keep the original updatedAt timestamp to avoid infinite updates
                            // We'll update a different field or add a note if needed
                        }
                    })
                );

                await Promise.all(updatePromises);
                console.log(`Automatically updated ${staleProcesses.length} process(es) to "No Response (14+ Days)"`);
            }
        } catch (error) {
            console.error('Error updating stale processes:', error);
            // Don't throw error to avoid breaking the main query
        }
    }
}
