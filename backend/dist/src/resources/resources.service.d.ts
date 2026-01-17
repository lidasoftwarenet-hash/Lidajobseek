import { PrismaService } from '../prisma.service';
export declare class ResourcesService {
    private prisma;
    constructor(prisma: PrismaService);
    create(data: any): import("@prisma/client").Prisma.Prisma__ResourceClient<{
        createdAt: Date;
        updatedAt: Date;
        id: number;
        title: string;
        type: string;
        content: string;
        tags: string | null;
    }, never, import("@prisma/client/runtime/library").DefaultArgs, import("@prisma/client").Prisma.PrismaClientOptions>;
    findAll(): import("@prisma/client").Prisma.PrismaPromise<{
        createdAt: Date;
        updatedAt: Date;
        id: number;
        title: string;
        type: string;
        content: string;
        tags: string | null;
    }[]>;
    findOne(id: number): import("@prisma/client").Prisma.Prisma__ResourceClient<{
        createdAt: Date;
        updatedAt: Date;
        id: number;
        title: string;
        type: string;
        content: string;
        tags: string | null;
    } | null, null, import("@prisma/client/runtime/library").DefaultArgs, import("@prisma/client").Prisma.PrismaClientOptions>;
    update(id: number, data: any): import("@prisma/client").Prisma.Prisma__ResourceClient<{
        createdAt: Date;
        updatedAt: Date;
        id: number;
        title: string;
        type: string;
        content: string;
        tags: string | null;
    }, never, import("@prisma/client/runtime/library").DefaultArgs, import("@prisma/client").Prisma.PrismaClientOptions>;
    remove(id: number): import("@prisma/client").Prisma.Prisma__ResourceClient<{
        createdAt: Date;
        updatedAt: Date;
        id: number;
        title: string;
        type: string;
        content: string;
        tags: string | null;
    }, never, import("@prisma/client/runtime/library").DefaultArgs, import("@prisma/client").Prisma.PrismaClientOptions>;
}
