import { ContactsService } from './contacts.service';
export declare class ContactsController {
    private readonly contactsService;
    constructor(contactsService: ContactsService);
    create(data: any): Promise<{
        id: number;
        name: string;
        processId: number;
        role: string | null;
        linkedIn: string | null;
        socialHooks: string | null;
        email: string | null;
    }>;
    findAll(processId: string): Promise<{
        id: number;
        name: string;
        processId: number;
        role: string | null;
        linkedIn: string | null;
        socialHooks: string | null;
        email: string | null;
    }[]>;
    update(id: string, data: any): Promise<{
        id: number;
        name: string;
        processId: number;
        role: string | null;
        linkedIn: string | null;
        socialHooks: string | null;
        email: string | null;
    }>;
    remove(id: string): Promise<{
        id: number;
        name: string;
        processId: number;
        role: string | null;
        linkedIn: string | null;
        socialHooks: string | null;
        email: string | null;
    }>;
}
