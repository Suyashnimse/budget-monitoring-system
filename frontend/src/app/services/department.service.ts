import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class DepartmentService {
  private readonly apiUrl = `${environment.apiBaseUrl}/department`;

  constructor(private http: HttpClient) {}

  getDepartments() {
    return this.http.get(this.apiUrl);
  }

  createDepartment(data: any) {
    return this.http.post(`${this.apiUrl}/add`, data);
  }

  deleteDepartment(id: string) {
    return this.http.delete(`${this.apiUrl}/delete/${id}`);
  }
}
