import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AlertService } from '../services/alert.service';

@Component({
  selector: 'app-alerts',
  imports: [CommonModule],
  templateUrl: './alerts.html',
  styleUrl: './alerts.css',
})
export class Alerts implements OnInit {
  alerts: string[] = [];
  totalAlerts = 0;
  errorMessage = '';

  constructor(private alertService: AlertService) {}

  ngOnInit(): void {
    this.alertService.getAlerts().subscribe({
      next: (data: any) => {
        this.alerts = data.alerts || [];
        this.totalAlerts = data.totalAlerts || 0;
      },
      error: () => {
        this.errorMessage = 'Unable to load alerts';
      }
    });
  }
}
