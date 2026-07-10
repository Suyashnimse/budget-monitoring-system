import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BudgetService } from '../services/budget';

@Component({
  selector: 'app-budget',
  imports: [CommonModule, FormsModule],
  templateUrl: './budget.html',
  styleUrl: './budget.css',
})
export class Budget implements OnInit {
  budget = {
    financialYear: '',
    department: '',
    allocatedAmount: null as number | null,
    allocationDate: ''
  };
  departmentOptions = ['Finance', 'Education', 'Health', 'Public Works', 'Agriculture'];
  departmentBudgets: Record<string, number> = {
    Finance: 1000000,
    Education: 2500000,
    Health: 3000000,
    Agriculture: 1500000
  };
  message = '';

  constructor(private budgetService: BudgetService) {}

  ngOnInit() {
    this.budgetService.getBudgets().subscribe(data => {
      console.log(data);
    });

    this.budget.department = 'Finance';
    this.budget.allocatedAmount = this.departmentBudgets['Finance'];
    this.budget.financialYear = '2026';
    this.budget.allocationDate = '2026-07-01';
  }

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
      error: (err: any) => {
        this.message = err.error?.message || 'Database Error';
      }
    });
  }
}
