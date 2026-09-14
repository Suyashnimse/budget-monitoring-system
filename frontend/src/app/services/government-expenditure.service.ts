import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class GovernmentExpenditureService {
  private readonly apiUrl = `${environment.apiBaseUrl}/api/government-expenditure`;

  constructor(private http: HttpClient) {}

  getRecords(financialYear = '') {
    const query = financialYear ? `?financialYear=${encodeURIComponent(financialYear)}` : '';
    return this.http.get<{ records: any[]; summary: { allocatedAmount: number; actualAmount: number; variance: number } }>(`${this.apiUrl}${query}`);
  }
}
