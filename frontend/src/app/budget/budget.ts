import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { BudgetService } from '../services/budget';
import { DepartmentService } from '../services/department.service';

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
  budget = this.createEmptyBudget();
  private generatedBudgetTitle = '';
  departmentOptions: any[] = [];
  yearOptions = ['All years', ...Array.from({ length: 50 }, (_, index) => 2001 + index)];
  selectedYear = 'All years';
  stateOptions = [
    'All India',
    'Andhra Pradesh',
    'Arunachal Pradesh',
    'Assam',
    'Bihar',
    'Chhattisgarh',
    'Goa',
    'Gujarat',
    'Haryana',
    'Himachal Pradesh',
    'Jharkhand',
    'Karnataka',
    'Kerala',
    'Madhya Pradesh',
    'Maharashtra',
    'Manipur',
    'Meghalaya',
    'Mizoram',
    'Nagaland',
    'Odisha',
    'Punjab',
    'Rajasthan',
    'Sikkim',
    'Tamil Nadu',
    'Telangana',
    'Tripura',
    'Uttar Pradesh',
    'Uttarakhand',
    'West Bengal',
    'Andaman and Nicobar Islands',
    'Chandigarh',
    'Dadra and Nagar Haveli and Daman and Diu',
    'Delhi',
    'Jammu and Kashmir',
    'Ladakh',
    'Lakshadweep',
    'Puducherry',
  ];
  selectedState = 'All India';
  budgets: BudgetRecord[] = [];
  message = '';
  totalBudget = 0;
  pendingApprovals = 0;
  isSubmitting = false;
  isLoadingDepartments = false;

  constructor(
    private budgetService: BudgetService,
    private departmentService: DepartmentService,
    private router: Router,
  ) {}

  ngOnInit() {
    this.budget.financialYear = String(this.getCurrentFinancialYear());
    this.budget.allocationDate = this.getTodayLocalDate();
    this.loadBudgets();
    this.loadDepartments();
  }

  updateBudgetTitleFromDepartment() {
    const departmentName = (this.budget.department || '').trim();
    const currentTitle = (this.budget.title || '').trim();
    if (!departmentName) {
      if (currentTitle === this.generatedBudgetTitle) {
        this.budget.title = '';
      }
      this.generatedBudgetTitle = '';
      return;
    }

    const selectedDepartment = this.departmentOptions.find(
      (department) => department.name === departmentName,
    );
    if (selectedDepartment?.governmentLevel === 'Maharashtra') {
      this.budget.state = 'Maharashtra';
    } else if (
      ['Union Ministry', 'Union Department'].includes(selectedDepartment?.governmentLevel)
    ) {
      this.budget.state = 'All India';
    }

    if (!currentTitle || currentTitle === this.generatedBudgetTitle) {
      this.generatedBudgetTitle = `${departmentName} Budget`;
      this.budget.title = this.generatedBudgetTitle;
    }
  }

  loadDepartments() {
    this.isLoadingDepartments = true;
    this.departmentService.getDepartments().subscribe({
      next: (data: any) => {
        this.isLoadingDepartments = false;
        this.departmentOptions = (data || [])
          .filter(
            (department: any) =>
              department.isOfficial ||
              ['Union Ministry', 'Union Department', 'Maharashtra'].includes(
                department.governmentLevel,
              ),
          )
          .sort(
            (first: any, second: any) =>
              String(first.governmentLevel || '').localeCompare(
                String(second.governmentLevel || ''),
              ) || String(first.name || '').localeCompare(String(second.name || '')),
          );
      },
      error: (error: any) => {
        this.isLoadingDepartments = false;
        this.message = error?.error?.message || 'Unable to load departments. Please try again.';
      },
    });
  }

  loadBudgets() {
    this.budgetService
      .getBudgets(this.selectedState === 'All India' ? '' : this.selectedState)
      .subscribe({
        next: (data: any[]) => {
          const allBudgets = (data || []).map((item: any) => ({
            ...item,
            title: item.title || `${item.department || 'Budget'} Budget`,
            status: item.status || 'Pending Approval',
          }));

          this.budgets =
            this.selectedYear === 'All years'
              ? allBudgets
              : allBudgets.filter(
                  (item: any) => String(item.financialYear) === String(this.selectedYear),
                );

          this.totalBudget = this.budgets.reduce(
            (sum: number, item: any) => sum + (item.allocatedAmount || 0),
            0,
          );
          this.pendingApprovals = this.budgets.filter(
            (item: any) => item.status === 'Pending Approval',
          ).length;
        },
        error: (error: any) => {
          this.message = error?.error?.message || 'Unable to load saved budgets. Please try again.';
        },
      });
  }

  submitBudget() {
    if (this.isSubmitting) {
      return;
    }

    if (
      !this.budget.title.trim() ||
      !this.budget.financialYear ||
      !this.budget.department ||
      this.budget.allocatedAmount === null ||
      !this.budget.allocationDate
    ) {
      this.message = 'Please complete all required fields.';
      return;
    }

    if (!Number.isFinite(Number(this.budget.allocatedAmount)) || this.budget.allocatedAmount <= 0) {
      this.message = 'Budget amount must be greater than zero.';
      return;
    }

    this.isSubmitting = true;
    this.message = 'Submitting budget for approval...';

    this.budgetService
      .createBudget({
        ...this.budget,
        title: this.budget.title.trim(),
        department: this.budget.department.trim(),
        allocatedAmount: Number(this.budget.allocatedAmount),
        status: 'Pending Approval',
        source: this.budget.source || 'Department submission',
      })
      .subscribe({
        next: (response: any) => {
          this.isSubmitting = false;
          const message = response?.assignedAuthorityCount
            ? 'Budget created and sent to the assigned department authorities for approval.'
            : 'Budget created, but no active authority is assigned to this department and state yet.';
          this.router.navigate(['/approvals'], {
            queryParams: { budgetId: response?._id, status: 'Pending Approval' },
            state: { budgetSubmissionMessage: message }
          });
        },
        error: (error: any) => {
          this.isSubmitting = false;
          this.message =
            error?.error?.message ||
            'Unable to save budget. Please check your connection and try again.';
        },
      });
  }

  private createEmptyBudget() {
    return {
      title: '',
      financialYear: '',
      state: 'All India',
      department: '',
      allocatedAmount: null as number | null,
      allocationDate: '',
      description: '',
      source: '',
      status: 'Pending Approval',
    };
  }

  private getCurrentFinancialYear(): number {
    const today = new Date();
    return today.getMonth() >= 3 ? today.getFullYear() : today.getFullYear() - 1;
  }

  private getTodayLocalDate(): string {
    const today = new Date();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${today.getFullYear()}-${month}-${day}`;
  }
}
