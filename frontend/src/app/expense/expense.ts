import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BudgetService } from '../services/budget';
import { ExpenseService } from '../services/expense';

interface ExpenseRecord {
  id?: string;
  budgetId: string;
  amount: number | null;
  category: string;
  date: string;
  description: string;
  status: string;
}

@Component({
  selector: 'app-expense',
  imports: [CommonModule, FormsModule],
  templateUrl: './expense.html',
  styleUrl: './expense.css',
})
export class Expense implements OnInit {
  expense = {
    budgetId: '',
    amount: null as number | null,
    category: '',
    date: '',
    description: '',
    status: 'Pending Approval'
  };
  categoryOptions = ['Medical Supplies', 'Office Equipment', 'Road Maintenance', 'Training Program', 'Farmer Subsidy'];
  budgets: any[] = [];
  expenses: ExpenseRecord[] = [];
  message = '';
  totalSpent = 0;

  constructor(private budgetService: BudgetService, private expenseService: ExpenseService) {}

  ngOnInit() {
    this.loadBudgets();
    this.expenseService.getExpenses().subscribe((data: any) => {
      this.expenses = data || [];
      this.totalSpent = this.expenses.reduce((sum, item) => sum + (item.amount || 0), 0);
    });
  }

  loadBudgets() {
    this.budgetService.getBudgets().subscribe((data: any) => {
      this.budgets = (data || []).map((item: any) => ({
        ...item,
        title: item.title || `${item.department || 'Budget'} Budget`,
        status: item.status || 'Pending Approval'
      }));
      this.totalSpent = this.expenses.reduce((sum: number, item: ExpenseRecord) => sum + (item.amount || 0), 0);
    });
  }

  submitExpense() {
    if (!this.expense.budgetId || !this.expense.amount || !this.expense.category || !this.expense.date) {
      this.message = 'Please complete the expense form.';
      return;
    }

    const selectedBudget = this.budgets.find((item: any) => item.id === this.expense.budgetId || item.title === this.expense.budgetId);
    if (!selectedBudget) {
      this.message = 'Select a valid budget record.';
      return;
    }

    const amount = Number(this.expense.amount || 0);
    const remaining = (selectedBudget.allocatedAmount || 0) - amount;
    this.expenseService.createExpense({ ...this.expense, amount }).subscribe({
      next: () => {
        this.message = `Expense submitted. Remaining budget: ₹${remaining}`;
        this.expense = { budgetId: '', amount: null, category: '', date: '', description: '', status: 'Pending Approval' };
        this.expenseService.getExpenses().subscribe((data: any) => {
          this.expenses = data || [];
          this.totalSpent = this.expenses.reduce((sum, item) => sum + (item.amount || 0), 0);
        });
      },
      error: (err: any) => this.message = err.error?.message || 'Unable to save expense to the backend.'
    });
  }
}
