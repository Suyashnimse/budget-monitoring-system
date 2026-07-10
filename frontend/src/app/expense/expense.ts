import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';

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
  categoryOptions = ['Medical Supplies', 'Office Equipment', 'Road Maintenance', 'Training Program', 'Farmer Subsidy'];
  message = '';
  private apiUrl = environment.apiBaseUrl;

  constructor(private http: HttpClient) {}

  submitExpense() {
    this.http.post(this.apiUrl + '/expense/add', this.expense).subscribe({
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
