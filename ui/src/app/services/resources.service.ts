import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
    providedIn: 'root'
})
export class ResourcesService {
    private apiUrl = `${environment.apiUrl}/api/resources`;

    constructor(private http: HttpClient) { }

    getAll(): Observable<any[]> {
        return this.http.get<any[]>(this.apiUrl);
    }

    getFolders(): Observable<any[]> {
        return this.http.get<any[]>(`${this.apiUrl}/folders`);
    }

    createFolder(name: string, parentId?: number): Observable<any> {
        return this.http.post<any>(`${this.apiUrl}/folders`, { name, parentId });
    }

    updateFolder(id: number, name: string): Observable<any> {
        return this.http.put<any>(`${this.apiUrl}/folders/${id}`, { name });
    }

    removeFolder(id: number): Observable<any> {
        return this.http.delete<any>(`${this.apiUrl}/folders/${id}`);
    }

    create(resource: any | FormData): Observable<any> {
        return this.http.post<any>(this.apiUrl, resource);
    }

    update(id: number, resource: any): Observable<any> {
        return this.http.put<any>(`${this.apiUrl}/${id}`, resource);
    }

    delete(id: number): Observable<any> {
        return this.http.delete<any>(`${this.apiUrl}/${id}`);
    }
}
