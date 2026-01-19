import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class ContactsService {
    private apiUrl = '/api/contacts';

    constructor(private http: HttpClient) { }

    create(data: any) {
        return this.http.post(this.apiUrl, data);
    }

    update(id: number, data: any) {
        return this.http.patch(`${this.apiUrl}/${id}`, data);
    }

    delete(id: number) {
        return this.http.delete(`${this.apiUrl}/${id}`);
    }
}
