import { TemplatesService } from './templates.service';
export declare class TemplatesController {
    private readonly templatesService;
    constructor(templatesService: TemplatesService);
    create(data: any): import("@prisma/client").Prisma.Prisma__TemplateClient<{
        createdAt: Date;
        updatedAt: Date;
        id: number;
        title: string;
        content: string;
        tags: string | null;
        category: string | null;
    }, never, import("@prisma/client/runtime/library").DefaultArgs, import("@prisma/client").Prisma.PrismaClientOptions>;
    findAll(search?: string): import("@prisma/client").Prisma.PrismaPromise<{
        createdAt: Date;
        updatedAt: Date;
        id: number;
        title: string;
        content: string;
        tags: string | null;
        category: string | null;
    }[]>;
    findOne(id: number): import("@prisma/client").Prisma.Prisma__TemplateClient<{
        createdAt: Date;
        updatedAt: Date;
        id: number;
        title: string;
        content: string;
        tags: string | null;
        category: string | null;
    } | null, null, import("@prisma/client/runtime/library").DefaultArgs, import("@prisma/client").Prisma.PrismaClientOptions>;
    update(id: number, data: any): import("@prisma/client").Prisma.Prisma__TemplateClient<{
        createdAt: Date;
        updatedAt: Date;
        id: number;
        title: string;
        content: string;
        tags: string | null;
        category: string | null;
    }, never, import("@prisma/client/runtime/library").DefaultArgs, import("@prisma/client").Prisma.PrismaClientOptions>;
    remove(id: number): import("@prisma/client").Prisma.Prisma__TemplateClient<{
        createdAt: Date;
        updatedAt: Date;
        id: number;
        title: string;
        content: string;
        tags: string | null;
        category: string | null;
    }, never, import("@prisma/client/runtime/library").DefaultArgs, import("@prisma/client").Prisma.PrismaClientOptions>;
}
