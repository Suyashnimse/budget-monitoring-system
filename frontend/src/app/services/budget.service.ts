import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class BudgetService {
  private readonly apiUrl = `${environment.apiBaseUrl}/budget`;

  constructor(private http: HttpClient) {}

  getBudgets() {
    return this.http.get(this.apiUrl);
  }

  createBudget(data: any) {
    return this.http.post(`${this.apiUrl}/add`, data);
  }
}
