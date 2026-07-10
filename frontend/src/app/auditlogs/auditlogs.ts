import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';

@Component({
  selector: 'app-auditlogs',
  imports: [CommonModule],
  templateUrl: './auditlogs.html',
  styleUrl: './auditlogs.css',
})
export class Auditlogs implements OnInit {
  logs: any[] = [];
  private apiUrl = environment.apiBaseUrl;

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.loadLogs();
  }

  loadLogs() {
    this.http.get<any[]>(this.apiUrl + '/auditlogs').subscribe({
      next: (data) => this.logs = data,
      error: () => this.logs = []
    });
  }
}
