import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { of } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Budget } from './budget';
import { BudgetService } from '../services/budget';
import { DepartmentService } from '../services/department.service';

describe('Budget allocation', () => {
  let budgetService: {
    getBudgets: ReturnType<typeof vi.fn>;
    createBudget: ReturnType<typeof vi.fn>;
  };
  let fixture: ComponentFixture<Budget>;
  let component: Budget;
  let router: Router;

  beforeEach(() => {
    budgetService = {
      getBudgets: vi.fn().mockReturnValue(of([])),
      createBudget: vi.fn().mockReturnValue(of({ _id: 'saved-budget', assignedAuthorityCount: 2 })),
    };

    TestBed.configureTestingModule({
      imports: [Budget],
      providers: [
        provideRouter([]),
        { provide: BudgetService, useValue: budgetService },
        { provide: DepartmentService, useValue: { getDepartments: () => of([]) } },
      ],
    });

    fixture = TestBed.createComponent(Budget);
    component = fixture.componentInstance;
    router = TestBed.inject(Router);
    vi.spyOn(router, 'navigate').mockResolvedValue(true);
    fixture.detectChanges();
  });

  it('generates a department title without overriding a custom title', () => {
    component.budget.department = 'Finance Department';
    component.updateBudgetTitleFromDepartment();
    expect(component.budget.title).toBe('Finance Department Budget');

    component.budget.title = 'Emergency funding';
    component.budget.department = 'Health Department';
    component.updateBudgetTitleFromDepartment();
    expect(component.budget.title).toBe('Emergency funding');
  });

  it('creates a budget with pending approval status', () => {
    component.budget = {
      ...component.budget,
      title: 'Finance Budget',
      financialYear: '2026',
      state: 'Maharashtra',
      department: 'Finance Department',
      allocatedAmount: 5000,
      allocationDate: '2026-10-04',
      description: 'Test allocation',
    };

    component.submitBudget();

    expect(budgetService.createBudget).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Finance Budget',
        department: 'Finance Department',
        allocatedAmount: 5000,
        status: 'Pending Approval',
        source: 'Department submission',
      }),
    );
    expect(router.navigate).toHaveBeenCalledWith(['/approvals'], {
      queryParams: { budgetId: 'saved-budget', status: 'Pending Approval' },
      state: { budgetSubmissionMessage: 'Budget created and sent to the assigned department authorities for approval.' }
    });
  });

  it('does not submit an invalid allocation amount', () => {
    component.budget = {
      ...component.budget,
      title: 'Finance Budget',
      financialYear: '2026',
      department: 'Finance Department',
      allocatedAmount: 0,
      allocationDate: '2026-10-04',
    };

    component.submitBudget();

    expect(budgetService.createBudget).not.toHaveBeenCalled();
    expect(component.message).toBe('Budget amount must be greater than zero.');
  });
});
