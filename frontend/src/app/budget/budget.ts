import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BudgetService } from '../services/budget';

interface BudgetRecord {
  id?: string;
  title: string;
  financialYear: string;
  state: string;
  department: string;
  allocatedAmount: number | null;
  allocationDate: string;
  description: string;
  source: string;
  status: string;
}

@Component({
  selector: 'app-budget',
  imports: [CommonModule, FormsModule],
  templateUrl: './budget.html',
  styleUrl: './budget.css',
})
export class Budget implements OnInit {
  budget = {
    title: '',
    financialYear: '',
    state: 'All India',
    department: '',
    allocatedAmount: null as number | null,
    allocationDate: '',
    description: '',
    source: '',
    status: 'Pending Approval'
  };
  departmentOptions = [
    'Ministry of Finance',
    'Ministry of Health and Family Welfare',
    'Ministry of Education',
    'Ministry of Rural Development',
    'Ministry of Agriculture and Farmers Welfare',
    'Ministry of Road Transport and Highways',
    'Ministry of Women and Child Development',
    'Ministry of Jal Shakti'
  ];
  yearOptions = Array.from({ length: 50 }, (_, index) => 2001 + index);
  stateOptions = [
    'All India', 'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
    'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka',
    'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram',
    'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana',
    'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal', 'Andaman and Nicobar Islands',
    'Chandigarh', 'Dadra and Nagar Haveli and Daman and Diu', 'Delhi', 'Jammu and Kashmir',
    'Ladakh', 'Lakshadweep', 'Puducherry'
  ];
  selectedState = 'All India';
  budgets: BudgetRecord[] = [];
  message = '';
  totalBudget = 0;
  pendingApprovals = 0;

  constructor(private budgetService: BudgetService) {}

  ngOnInit() {
    this.loadBudgets();
    this.budget.department = 'Finance';
    this.budget.financialYear = '2026';
    this.budget.allocationDate = '2026-07-01';
  }

  loadBudgets() {
    this.budgetService.getBudgets(this.selectedState === 'All India' ? '' : this.selectedState).subscribe((data: any) => {
      this.budgets = (data || []).map((item: any) => ({
        ...item,
        title: item.title || `${item.department || 'Budget'} Budget`,
        status: item.status || 'Pending Approval'
      }));
      this.totalBudget = this.budgets.reduce((sum: number, item: any) => sum + (item.allocatedAmount || 0), 0);
      this.pendingApprovals = this.budgets.filter((item: any) => item.status === 'Pending Approval').length;
    });
  }

  submitBudget() {
    if (!this.budget.title || !this.budget.financialYear || !this.budget.department || this.budget.allocatedAmount === null || !this.budget.allocationDate) {
      this.message = 'Please complete all required fields.';
      return;
    }

    if ((this.budget.allocatedAmount || 0) <= 0) {
      this.message = 'Budget amount must be greater than zero.';
      return;
    }

    this.budgetService.createBudget(this.budget).subscribe({
      next: () => {
        this.message = 'Budget submitted successfully.';
        this.budget = {
          title: '',
          financialYear: '',
          state: 'All India',
          department: '',
          allocatedAmount: null,
          allocationDate: '',
          description: '',
          source: '',
          status: 'Pending Approval'
        };
        this.loadBudgets();
      },
      error: (err: any) => {
        this.message = err.error?.message || 'Unable to save budget.';
      }
    });
  }

}
