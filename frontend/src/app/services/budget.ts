import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class BudgetService {
  private readonly apiUrl = `${environment.apiBaseUrl}/api/budget`;

  constructor(private http: HttpClient) {}

  getBudgets(state = '') {
    const query = state ? `?state=${encodeURIComponent(state)}` : '';
    return this.http.get<any[]>(`${this.apiUrl}${query}`);
  }

  createBudget(data: any) {
    return this.http.post(`${this.apiUrl}/add`, data);
  }

  updateBudgetStatus(id: string, status: string, authorityId: string) {
    return this.http.patch(`${this.apiUrl}/${id}/status`, { status, authorityId });
  }
}
