import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { BudgetService } from '../services/budget';

@Component({
  selector: 'app-approvals',
  imports: [CommonModule, FormsModule],
  templateUrl: './approvals.html',
  styleUrl: './approvals.css',
})
export class Approvals implements OnInit {
  approvals: any[] = [];
  authorities: any[] = [];
  selectedAuthorityId = '';
  authorityLookup = '';
  authority = { name: '', role: 'CM', constituency: '', constituencyNumber: '', state: 'Maharashtra', ministry: '', contact: '', source: '', sourceUrl: '' };
  roles = ['CM', 'DCM', 'MLA', 'PM', 'MP', 'Minister', 'Minister of State'];
  selectedStatus = 'All';
  authoritySearch = '';
  selectedRole = 'All roles';
  selectedState = 'All states';
  message = '';
  currentUser: any = null;

  constructor(private budgetService: BudgetService, private http: HttpClient, private changeDetector: ChangeDetectorRef) {}

  ngOnInit() {
    const savedUser = localStorage.getItem('loggedInUser');
    this.currentUser = savedUser ? JSON.parse(savedUser) : null;
    this.loadApprovals();
    this.loadAuthorities();
  }

  loadAuthorities() {
    this.http.get<any>('http://localhost:3000/api/approval-authorities').subscribe({
      next: (data) => {
        const records = Array.isArray(data) ? data : data?.authorities;
        this.authorities = Array.isArray(records) ? records : [];
        if (!this.selectedAuthorityId && this.authorities.length) this.selectedAuthorityId = this.authorities[0].authorityId;
        this.changeDetector.detectChanges();
      },
      error: () => {
        this.message = 'Unable to load the authority directory. Check that the backend is running.';
        this.changeDetector.detectChanges();
      }
    });
  }

  createAuthority() {
    if (!this.authority.name || !this.authority.constituency || !this.authority.state) {
      this.message = 'Name, constituency, and state are required.';
      return;
    }
    this.http.post('http://localhost:3000/api/approval-authorities', this.authority).subscribe({
      next: () => { this.message = 'Authority registered and ID generated.'; this.authority = { name: '', role: 'CM', constituency: '', constituencyNumber: '', state: 'Maharashtra', ministry: '', contact: '', source: '', sourceUrl: '' }; this.loadAuthorities(); },
      error: (error: any) => this.message = error.error?.message || 'Unable to register authority.'
    });
  }

  loadApprovals() {
    this.budgetService.getBudgets().subscribe((stored: any[]) => {
      this.approvals = (stored || []).filter((item: any) => this.canViewDepartment(item.department)).map((item: any) => ({
      ...item,
      status: item.status || 'Pending Approval'
      }));
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
    if (!this.selectedAuthorityId) {
      this.message = 'Register or select an authorized CM, DCM, MLA, PM, or MP first.';
      return;
    }
    this.budgetService.updateBudgetStatus(item._id, status, this.selectedAuthorityId).subscribe({
      next: () => { this.message = `Budget ${status.toLowerCase()} by ${this.selectedAuthorityId}.`; this.loadApprovals(); },
      error: (error: any) => this.message = error.error?.message || 'Authority action was rejected.'
    });
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
      const matchesSearch = !search || [member.name, member.authorityId, member.role, member.constituency, member.constituencyNumber, member.ministry]
        .some((value) => String(value || '').toLowerCase().includes(search));
      const matchesRole = this.selectedRole === 'All roles' || member.role === this.selectedRole;
      const matchesState = this.selectedState === 'All states' || member.state === this.selectedState;
      return matchesSearch && matchesRole && matchesState;
    });
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

  get selectedAuthority() {
    return this.authorities.find((member: any) => member.authorityId === this.selectedAuthorityId);
  }

  get selectableAuthorities() {
    const query = this.authorityLookup.trim().toLowerCase();
    return this.authorities.filter((member: any) => !query || [member.name, member.authorityId, member.role, member.constituency, member.state]
      .some((value) => String(value || '').toLowerCase().includes(query)));
  }
}
