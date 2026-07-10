import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-expense',
  imports: [CommonModule, FormsModule],
  templateUrl: './expense.html',
  styleUrl: './expense.css',
})
export class Expense {
  expense = {
    budgetId: '',
    amount: null as number | null,
    category: '',
    date: ''
  };
  message = '';

  constructor(private http: HttpClient) {}

  submitExpense() {
    this.http.post('https://budget-monitoring-system.onrender.com/expense/add', this.expense).subscribe({
      next: () => {
        this.message = 'Expense Added';
        this.expense = {
          budgetId: '',
          amount: null,
          category: '',
          date: ''
        };
        window.dispatchEvent(new Event('expense-updated'));
      },
      error: (err) => {
        this.message = err.error?.message || 'Failed to submit expense';
      }
    });
  }
}
