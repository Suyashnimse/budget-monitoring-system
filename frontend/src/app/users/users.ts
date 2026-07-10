import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';

@Component({
  selector: 'app-users',
  imports: [CommonModule, FormsModule],
  templateUrl: './users.html',
  styleUrl: './users.css',
})
export class Users implements OnInit {
  department = { name: '', code: '', description: '' };
  departments: any[] = [];
  user = { name: '', email: '', password: '', role: 'Admin' };
  availableRoles = ['Admin', 'Finance Officer', 'Department Head'];
  message = '';
  private apiUrl = environment.apiBaseUrl;

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.seedDepartments();
    this.loadDepartments();
  }

  seedDepartments() {
    const initialDepartments = [
      { name: 'Finance', code: 'FIN', description: 'Finance department' },
      { name: 'Education', code: 'EDU', description: 'Education department' },
      { name: 'Health', code: 'HLT', description: 'Health department' },
      { name: 'Public Works', code: 'PWB', description: 'Public Works department' },
      { name: 'Agriculture', code: 'AGR', description: 'Agriculture department' }
    ];

    initialDepartments.forEach((department) => {
      this.http.post(this.apiUrl + '/department/add', department).subscribe({
        error: () => {}
      });
    });
  }

  loadDepartments() {
    this.http.get<any[]>(this.apiUrl + '/department').subscribe({
      next: (data) => this.departments = data,
      error: () => this.message = 'Unable to load departments.'
    });
  }

  saveDepartment() {
    if (!this.department.name || !this.department.code) {
      this.message = 'Empty Form';
      return;
    }

    this.http.post(this.apiUrl + '/department/add', this.department).subscribe({
      next: () => {
        this.message = 'Department Created';
        this.department = { name: '', code: '', description: '' };
        this.loadDepartments();
      },
      error: (err) => {
        this.message = err.error?.message === 'Department code already exists' ? 'Duplicate User' : err.error?.message || 'Database Error';
      }
    });
  }

  createUser() {
    if (!this.user.name || !this.user.email || !this.user.password) {
      this.message = 'Empty Form';
      return;
    }

    this.http.post(this.apiUrl + '/register', this.user).subscribe({
      next: () => {
        this.message = `User created with role ${this.user.role}`;
        this.user = { name: '', email: '', password: '', role: 'Admin' };
      },
      error: (err) => {
        this.message = err.error?.message || 'Database Error';
      }
    });
  }

  deleteDepartment(id: string) {
    this.http.delete(`https://budget-monitoring-system.onrender.com/department/delete/${id}`).subscribe({
      next: () => {
        this.message = 'Department Deleted';
        this.loadDepartments();
      },
      error: (err) => {
        this.message = err.error?.message || 'Database Error';
      }
    });
  }
}
