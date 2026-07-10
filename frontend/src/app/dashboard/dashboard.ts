import { Component, OnInit } from '@angular/core';
import { NgIf } from '@angular/common';
import { BudgetService } from '../services/budget';
import { ExpenseService } from '../services/expense';

@Component({
  selector: 'app-dashboard',
  imports: [NgIf],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.css',
})
export class Dashboard implements OnInit {
  totalBudget = 8000000;
  totalExpense = 4200000;
  utilizationPercent = 52.5;
  totalAlerts = 3;
  alert = '';
  recentExpenseAverage = 0;

  constructor(private budgetService: BudgetService, private expenseService: ExpenseService) {}

  ngOnInit(): void {
    this.loadSummary();
    window.addEventListener('expense-updated', () => this.loadSummary());
  }

  loadSummary() {
    this.budgetService.getBudgets().subscribe({
      next: (budgets: any) => {
        this.totalBudget = budgets.reduce((sum: number, item: any) => sum + (item.allocatedAmount || 0), 0);
        this.refreshUtilization();
      }
    });

    this.expenseService.getExpenses().subscribe({
      next: (expenses: any) => {
        this.totalExpense = expenses.reduce((sum: number, item: any) => sum + (item.amount || 0), 0);
        const recentExpenses = expenses.slice(-3);
        this.recentExpenseAverage = recentExpenses.length > 0
          ? recentExpenses.reduce((sum: number, item: any) => sum + (item.amount || 0), 0) / recentExpenses.length
          : 0;
        this.refreshUtilization();
      }
    });
  }

  private refreshUtilization() {
    this.utilizationPercent = this.totalBudget > 0 ? (this.totalExpense / this.totalBudget) * 100 : 0;

    this.totalAlerts = this.alert ? 1 : 0;

    if (this.totalExpense > this.totalBudget) {
      this.alert = 'Expenses > Allocated Budget';
    } else if (this.utilizationPercent < 40) {
      this.alert = 'Utilization < 40%';
    } else if (this.recentExpenseAverage > 0 && this.totalExpense > 0 && this.recentExpenseAverage > this.totalExpense / Math.max(1, this.totalBudget > 0 ? 4 : 1) * 2) {
      this.alert = 'Large sudden expense';
    } else {
      this.alert = '';
    }

    this.totalAlerts = this.alert ? 1 : 0;
  }
}
