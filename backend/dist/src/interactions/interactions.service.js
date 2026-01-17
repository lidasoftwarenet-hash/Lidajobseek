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
exports.InteractionsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma.service");
let InteractionsService = class InteractionsService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async create(dto) {
        return this.prisma.interaction.create({
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
                nextInviteDate: dto.nextInviteDate ? new Date(dto.nextInviteDate) : null,
                nextInviteLink: dto.nextInviteLink,
                nextInviteType: dto.nextInviteType,
                invitationExtended: dto.invitationExtended,
            },
        });
    }
    async findAll(startDate, endDate, processId) {
        const where = {};
        if (processId) {
            where.processId = processId;
        }
        if (startDate && endDate) {
            where.date = {
                gte: new Date(startDate),
                lte: new Date(endDate),
            };
        }
        else if (startDate) {
            where.date = {
                gte: new Date(startDate),
            };
        }
        else if (endDate) {
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
    async findByProcess(processId) {
        return this.prisma.interaction.findMany({
            where: { processId },
            orderBy: { date: 'desc' },
        });
    }
    async update(id, dto) {
        const data = { ...dto };
        if (dto.date)
            data.date = new Date(dto.date);
        return this.prisma.interaction.update({
            where: { id },
            data,
        });
    }
    async remove(id) {
        return this.prisma.interaction.delete({
            where: { id },
        });
    }
};
exports.InteractionsService = InteractionsService;
exports.InteractionsService = InteractionsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], InteractionsService);
//# sourceMappingURL=interactions.service.js.map