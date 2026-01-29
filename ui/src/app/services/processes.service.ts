import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class ProcessesService {
    private apiUrl = `${environment.apiUrl}/api/processes`;

    constructor(private http: HttpClient) { }

    getAll() {
        return this.http.get<any[]>(this.apiUrl);
    }

    create(data: any) {
        return this.http.post(this.apiUrl, data);
    }

    getById(id: number) {
        return this.http.get<any>(`${this.apiUrl}/${id}`);
    }

    update(id: number, data: any) {
        return this.http.patch(`${this.apiUrl}/${id}`, data);
    }

    delete(id: number) {
        return this.http.delete(`${this.apiUrl}/${id}`);
    }

    exportData() {
        return this.http.get<any[]>(`${this.apiUrl}/export`);
    }

    importData(processes: any[], mode: 'overwrite' | 'append') {
        return this.http.post(`${this.apiUrl}/import`, { processes, mode });
    }
}
