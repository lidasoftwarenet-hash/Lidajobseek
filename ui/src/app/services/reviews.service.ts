import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class ReviewsService {
    private apiUrl = `${environment.apiUrl}/api/reviews`;

    constructor(private http: HttpClient) { }

    getAll() {
        return this.http.get<any[]>(this.apiUrl);
    }

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
