import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-auditlogs',
  imports: [CommonModule],
  templateUrl: './auditlogs.html',
  styleUrl: './auditlogs.css',
})
export class Auditlogs implements OnInit {
  logs: any[] = [];

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.loadLogs();
  }

  loadLogs() {
    this.http.get<any[]>('http://localhost:3000/auditlogs').subscribe({
      next: (data) => this.logs = data,
      error: () => this.logs = []
    });
  }
}
