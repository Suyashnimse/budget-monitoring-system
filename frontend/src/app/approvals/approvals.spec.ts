import { HttpClient } from '@angular/common/http';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { of } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Approvals } from './approvals';
import { BudgetService } from '../services/budget';
import { environment } from '../../environments/environment';

describe('Department budget approvals', () => {
  let budgetService: {
    getBudgets: ReturnType<typeof vi.fn>;
    updateBudgetStatus: ReturnType<typeof vi.fn>;
  };
  let fixture: ComponentFixture<Approvals>;
  let component: Approvals;

  beforeEach(() => {
    localStorage.setItem('loggedInUser', JSON.stringify({ role: 'Admin' }));
    budgetService = {
      getBudgets: vi.fn().mockReturnValue(of([{
        _id: 'budget-1',
        department: 'Agriculture Department, Maharashtra',
        state: 'Maharashtra',
        financialYear: '2026',
        allocatedAmount: 5000,
        status: 'Pending Approval',
        assignedAuthorityIds: ['AGRI-AUTHORITY']
      }])),
      updateBudgetStatus: vi.fn().mockReturnValue(of({ status: 'Approved' }))
    };

    TestBed.configureTestingModule({
      imports: [Approvals],
      providers: [
        { provide: BudgetService, useValue: budgetService },
        {
          provide: ActivatedRoute,
          useValue: { queryParamMap: of({ get: () => null }) }
        },
        {
          provide: HttpClient,
          useValue: {
            get: () => of([
              { authorityId: 'AGRI-AUTHORITY', name: 'Agriculture Minister', role: 'Minister', state: 'Maharashtra', ministry: 'Agriculture' },
              { authorityId: 'FIN-AUTHORITY', name: 'Finance Minister', role: 'Minister', state: 'Maharashtra', ministry: 'Finance' }
            ]),
            post: () => of({})
          }
        }
      ]
    });

    fixture = TestBed.createComponent(Approvals);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('shows only the authorities assigned to the budget', () => {
    expect(component.approvals[0].assignedAuthorities.map((authority: any) => authority.authorityId))
      .toEqual(['AGRI-AUTHORITY']);
    expect(component.selectedAuthorityByBudget['budget-1']).toBe('AGRI-AUTHORITY');
  });

  it('sends approval using the selected assigned department authority', () => {
    component.approve(component.approvals[0]);

    expect(budgetService.updateBudgetStatus).toHaveBeenCalledWith(
      'budget-1',
      'Approved',
      'AGRI-AUTHORITY'
    );
  });
});
