import { Component, OnInit } from '@angular/core';
import { NgIf } from '@angular/common';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-dashboard',
  imports: [NgIf],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.css',
})
export class Dashboard implements OnInit {
  totalBudget = 0;
  totalExpense = 0;
  utilizationPercent = 0;
  alert = '';
  recentExpenseAverage = 0;

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.loadSummary();
    window.addEventListener('expense-updated', () => this.loadSummary());
  }

  loadSummary() {
    this.http.get<any[]>('https://budget-monitoring-system.onrender.com/budget').subscribe({
      next: (budgets) => {
        this.totalBudget = budgets.reduce((sum, item) => sum + (item.allocatedAmount || 0), 0);
        this.refreshUtilization();
      }
    });

    this.http.get<any[]>('https://budget-monitoring-system.onrender.com/expense').subscribe({
      next: (expenses) => {
        this.totalExpense = expenses.reduce((sum, item) => sum + (item.amount || 0), 0);
        const recentExpenses = expenses.slice(-3);
        this.recentExpenseAverage = recentExpenses.length > 0
          ? recentExpenses.reduce((sum, item) => sum + (item.amount || 0), 0) / recentExpenses.length
          : 0;
        this.refreshUtilization();
      }
    });
  }

  private refreshUtilization() {
    this.utilizationPercent = this.totalBudget > 0 ? (this.totalExpense / this.totalBudget) * 100 : 0;

    if (this.totalExpense > this.totalBudget) {
      this.alert = 'Overspending';
    } else if (this.utilizationPercent < 40) {
      this.alert = 'Under Utilization';
    } else if (this.recentExpenseAverage > 0 && this.totalExpense > 0 && this.recentExpenseAverage > this.totalExpense / Math.max(1, this.totalBudget > 0 ? 4 : 1) * 2) {
      this.alert = 'Spending Spike';
    } else {
      this.alert = '';
    }
  }
}
