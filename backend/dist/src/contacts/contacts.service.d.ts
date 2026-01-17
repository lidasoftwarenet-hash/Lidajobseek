import { PrismaService } from '../prisma.service';
export declare class ContactsService {
    private prisma;
    constructor(prisma: PrismaService);
    create(data: any): Promise<{
        id: number;
        name: string;
        processId: number;
        role: string | null;
        linkedIn: string | null;
        socialHooks: string | null;
        email: string | null;
    }>;
    findAllByProcess(processId: number): Promise<{
        id: number;
        name: string;
        processId: number;
        role: string | null;
        linkedIn: string | null;
        socialHooks: string | null;
        email: string | null;
    }[]>;
    update(id: number, data: any): Promise<{
        id: number;
        name: string;
        processId: number;
        role: string | null;
        linkedIn: string | null;
        socialHooks: string | null;
        email: string | null;
    }>;
    remove(id: number): Promise<{
        id: number;
        name: string;
        processId: number;
        role: string | null;
        linkedIn: string | null;
        socialHooks: string | null;
        email: string | null;
    }>;
}
