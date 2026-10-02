import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class GovernmentExpenditureService {
  private readonly apiUrl = `${environment.apiBaseUrl}/api/government-expenditure`;

  constructor(private http: HttpClient) {}

  getRecords(financialYear = '', governmentLevel = '', estimateType = '') {
    let params = new HttpParams();
    if (financialYear) params = params.set('financialYear', financialYear);
    if (governmentLevel) params = params.set('governmentLevel', governmentLevel);
    if (estimateType) params = params.set('estimateType', estimateType);
    return this.http.get<{ records: any[]; summary: Record<string, number> }>(this.apiUrl, { params });
  }
}
