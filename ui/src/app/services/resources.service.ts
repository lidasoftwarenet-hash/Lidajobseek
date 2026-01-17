import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
    providedIn: 'root'
})
export class ResourcesService {
    private apiUrl = 'http://localhost:3000/resources';

    constructor(private http: HttpClient) { }

    getAll(): Observable<any[]> {
        return this.http.get<any[]>(this.apiUrl);
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
