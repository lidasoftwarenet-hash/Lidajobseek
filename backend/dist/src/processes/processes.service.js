"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProcessesService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma.service");
let ProcessesService = class ProcessesService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async create(data) {
        return this.prisma.process.create({
            data,
        });
    }
    async findAll() {
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
    async findOne(id) {
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
    async update(id, data) {
        return this.prisma.process.update({
            where: { id },
            data,
        });
    }
    async remove(id) {
        return this.prisma.process.delete({
            where: { id },
        });
    }
    async updateStaleProcesses() {
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
                const updatePromises = staleProcesses.map(process => this.prisma.process.update({
                    where: { id: process.id },
                    data: {
                        currentStage: 'No Response (14+ Days)',
                    }
                }));
                await Promise.all(updatePromises);
                console.log(`Automatically updated ${staleProcesses.length} process(es) to "No Response (14+ Days)"`);
            }
        }
        catch (error) {
            console.error('Error updating stale processes:', error);
        }
    }
};
exports.ProcessesService = ProcessesService;
exports.ProcessesService = ProcessesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ProcessesService);
//# sourceMappingURL=processes.service.js.map