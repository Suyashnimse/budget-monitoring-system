import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class DepartmentService {
  private readonly apiUrl = environment.apiBaseUrl;

  constructor(private http: HttpClient) {}

  getDepartments() {
    return this.http.get(this.apiUrl + '/department');
  }

  createDepartment(data: any) {
    return this.http.post(this.apiUrl + '/department/add', data);
  }

  deleteDepartment(id: string) {
    return this.http.delete(this.apiUrl + '/department/delete/' + id);
  }
}
