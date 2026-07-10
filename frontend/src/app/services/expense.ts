import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ExpenseService {
  private readonly apiUrl = environment.apiBaseUrl;

  constructor(private http: HttpClient) {}

  getExpenses() {
    return this.http.get(this.apiUrl + '/expense');
  }

  createExpense(data: any) {
    return this.http.post(this.apiUrl + '/expense/add', data);
  }
}
