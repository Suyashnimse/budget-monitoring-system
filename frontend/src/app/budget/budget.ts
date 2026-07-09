import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BudgetService } from '../services/budget';

@Component({
  selector: 'app-budget',
  imports: [CommonModule, FormsModule],
  templateUrl: './budget.html',
  styleUrl: './budget.css',
})
export class Budget {
  budget = {
    financialYear: '',
    department: '',
    allocatedAmount: null as number | null,
    allocationDate: ''
  };
  message = '';

  constructor(private budgetService: BudgetService) {}

  submitBudget() {
    if (!this.budget.financialYear || !this.budget.department || !this.budget.allocatedAmount || !this.budget.allocationDate) {
      this.message = 'Empty Form';
      return;
    }

    if ((this.budget.allocatedAmount || 0) <= 0) {
      this.message = 'Invalid Budget';
      return;
    }

    this.budgetService.createBudget(this.budget).subscribe({
      next: () => {
        this.message = 'Budget Created';
        this.budget = {
          financialYear: '',
          department: '',
          allocatedAmount: null,
          allocationDate: ''
        };
      },
      error: (err) => {
        this.message = err.error?.message || 'Database Error';
      }
    });
  }
}
