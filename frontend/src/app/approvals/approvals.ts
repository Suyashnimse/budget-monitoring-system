import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute } from '@angular/router';
import { BudgetService } from '../services/budget';
import { environment } from '../../environments/environment';

@Component({
  selector: 'app-approvals',
  imports: [CommonModule, FormsModule],
  templateUrl: './approvals.html',
  styleUrl: './approvals.css',
})
export class Approvals implements OnInit {
  approvals: any[] = [];
  authorities: any[] = [];
  selectedAuthorityByBudget: Record<string, string> = {};
  selectedAuthorityId = '';
  authority = {
    name: '',
    role: '',
    constituency: '',
    constituencyNumber: '',
    state: 'Maharashtra',
    party: '',
    ministry: '',
    contact: '',
    source: 'User-provided manual registration',
    sourceUrl: ''
  };
  roles = ['CM', 'DCM', 'MLA', 'PM', 'MP', 'Minister', 'Minister of State'];
  selectedStatus = 'All';
  authoritySearch = '';
  selectedRole = 'All roles';
  selectedState = 'All states';
  activeTab: 'approvals' | 'minister-departments' | 'authorized-members' = 'approvals';
  authorityTab: 'directory' | 'register' = 'directory';
  ministerDepartmentSearch = '';
  message = '';
  currentUser: any = null;
  highlightedBudgetId = '';

  constructor(
    private budgetService: BudgetService,
    private http: HttpClient,
    private changeDetector: ChangeDetectorRef,
    private route: ActivatedRoute
  ) {}

  ngOnInit() {
    const savedUser = localStorage.getItem('loggedInUser');
    this.currentUser = savedUser ? JSON.parse(savedUser) : null;
    const navigationMessage = history.state?.budgetSubmissionMessage;
    if (navigationMessage) {
      this.message = navigationMessage;
    }
    this.route.queryParamMap.subscribe((params) => {
      this.selectedStatus = params.get('status') || 'All';
      this.highlightedBudgetId = params.get('budgetId') || '';
    });
    this.loadAuthorities();
  }

  loadAuthorities() {
    this.http.get<any>(`${environment.apiBaseUrl}/api/approval-authorities`).subscribe({
      next: (data) => {
        const records = Array.isArray(data) ? data : data?.authorities;
        this.authorities = Array.isArray(records) ? records : [];
        if (!this.selectedAuthorityId && this.authorities.length) {
          this.selectedAuthorityId = this.authorities[0].authorityId;
        }
        this.loadApprovals();
        this.changeDetector.detectChanges();
      },
      error: () => {
        this.message = 'Unable to load the authority directory. Check that the backend is running.';
        this.loadApprovals();
        this.changeDetector.detectChanges();
      }
    });
  }

  createAuthority() {
    if (!this.authority.name.trim() || !this.roles.includes(this.authority.role) || !this.authority.constituency.trim() || !this.authority.state.trim()) {
      this.message = 'Name, role, constituency, and state are required.';
      return;
    }
    this.http.post(`${environment.apiBaseUrl}/api/approval-authorities`, this.authority).subscribe({
      next: () => { this.message = 'Authority registered and ID generated. Matching pending department budgets will be routed to this authority.'; this.authority = { name: '', role: '', constituency: '', constituencyNumber: '', state: 'Maharashtra', party: '', ministry: '', contact: '', source: 'User-provided manual registration', sourceUrl: '' }; this.loadAuthorities(); },
      error: (error: any) => this.message = error.error?.message || 'Unable to register authority.'
    });
  }

  loadApprovals() {
    this.budgetService.getBudgets().subscribe({
      next: (stored: any[]) => {
        this.approvals = (stored || [])
          .filter((item: any) => this.canViewDepartment(item.department))
          .map((item: any) => ({
            ...item,
            status: item.status || 'Pending Approval',
            assignedAuthorities: this.getAssignedAuthorities(item)
          }));
        for (const item of this.approvals) {
          if (!this.selectedAuthorityByBudget[item._id] && item.assignedAuthorities.length) {
            this.selectedAuthorityByBudget[item._id] = item.assignedAuthorities[0].authorityId;
          }
        }
        this.changeDetector.detectChanges();
      },
      error: (error: any) => {
        this.message = error?.error?.message || 'Unable to load budget approvals.';
        this.changeDetector.detectChanges();
      }
    });
  }

  approve(item: any) {
    this.decide(item, 'Approved');
  }

  reject(item: any) {
    this.decide(item, 'Rejected');
  }

  private decide(item: any, status: string) {
    if (!this.canViewDepartment(item.department)) {
      this.message = 'You can only act on budgets assigned to your department.';
      return;
    }
    const authorityId = this.selectedAuthorityByBudget[item._id];
    const assignedAuthority = (item.assignedAuthorities || [])
      .find((member: any) => member.authorityId === authorityId);
    if (!assignedAuthority) {
      this.message = 'No active authority is assigned to this budget department and state.';
      return;
    }
    this.budgetService.updateBudgetStatus(item._id, status, authorityId).subscribe({
      next: () => { this.message = `Budget ${status.toLowerCase()} by ${assignedAuthority.name} (${assignedAuthority.authorityId}).`; this.loadApprovals(); },
      error: (error: any) => this.message = error.error?.message || 'Authority action was rejected.'
    });
  }

  private getAssignedAuthorities(budget: any): any[] {
    const assignedIds = new Set(budget.assignedAuthorityIds || []);
    return this.authorities.filter(
      (authority) => authority.active !== false && assignedIds.has(authority.authorityId)
    );
  }

  private canViewDepartment(department: string): boolean {
    const role = String(this.currentUser?.role || '').toLowerCase();
    const assignedDepartment = String(this.currentUser?.departmentId || this.currentUser?.department || '').trim().toLowerCase();
    if (role === 'admin' || role === 'finance officer') return true;
    if (!assignedDepartment) return false;
    return String(department || '').toLowerCase().includes(assignedDepartment) || assignedDepartment.includes(String(department || '').toLowerCase());
  }

  get filteredApprovals() {
    if (this.selectedStatus === 'All') {
      return this.approvals;
    }
    return this.approvals.filter((item: any) => item.status === this.selectedStatus);
  }

  get filteredAuthorities() {
    const search = this.authoritySearch.trim().toLowerCase();
    return this.authorities.filter((member: any) => {
      const matchesSearch = !search || [member.name, member.authorityId, member.role, member.party, member.constituency, member.constituencyNumber, member.ministry]
        .some((value) => String(value || '').toLowerCase().includes(search));
      const matchesRole = this.selectedRole === 'All roles' || member.role === this.selectedRole;
      const matchesState = this.selectedState === 'All states' || member.state === this.selectedState;
      return matchesSearch && matchesRole && matchesState;
    });
  }

  get filteredMinisterDepartments() {
    const query = this.ministerDepartmentSearch.trim().toLowerCase();
    const ministerRoles = ['CM', 'DCM', 'Minister', 'Minister of State'];
    const titleLabels = ['chief minister', 'deputy chief minister', 'minister of state'];

    return this.authorities
      .filter((member: any) => ministerRoles.includes(member.role))
      .flatMap((member: any) => String(member.ministry || '').split(';')
        .map((department: string) => department.trim())
        .filter((department: string) => department && !titleLabels.includes(department.toLowerCase()))
        .map((department: string) => ({ ...member, department })))
      .filter((assignment: any) => !query || [assignment.department, assignment.name, assignment.role, assignment.party, assignment.constituency]
        .some((value) => String(value || '').toLowerCase().includes(query)))
      .sort((first: any, second: any) => first.department.localeCompare(second.department) || first.name.localeCompare(second.name));
  }

  get authorityRoles() {
    return ['All roles', ...new Set(this.authorities.map((member: any) => member.role))];
  }

  get authorityStates() {
    return ['All states', ...new Set(this.authorities.map((member: any) => member.state))];
  }

  selectAuthority(member: any) {
    this.selectedAuthorityId = member.authorityId;
  }

}
