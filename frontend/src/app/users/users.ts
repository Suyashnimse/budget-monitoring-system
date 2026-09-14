import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DepartmentService } from '../services/department.service';
import { UserService } from '../services/user.service';

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

  constructor(private departmentService: DepartmentService, private userService: UserService) {}

  ngOnInit(): void {
    this.loadDepartments();
  }

  loadDepartments() {
    this.departmentService.getDepartments().subscribe({
      next: (departments: any) => this.departments = departments || [],
      error: () => this.message = 'Unable to load departments from the backend.'
    });
  }

  saveDepartment() {
    if (!this.department.name || !this.department.code) {
      this.message = 'Empty Form';
      return;
    }

    this.departmentService.createDepartment(this.department).subscribe({
      next: () => { this.message = 'Department created'; this.department = { name: '', code: '', description: '' }; this.loadDepartments(); },
      error: (error: any) => this.message = error.error?.message || 'Unable to create department.'
    });
  }

  createUser() {
    if (!this.user.name || !this.user.email || !this.user.password) {
      this.message = 'Empty Form';
      return;
    }

    this.userService.createUser(this.user).subscribe({
      next: () => { this.message = `User created with role ${this.user.role}`; this.user = { name: '', email: '', password: '', role: 'Admin' }; },
      error: (error: any) => this.message = error.error?.message || 'Unable to create user.'
    });
  }

  deleteDepartment(id: string) {
    this.departmentService.deleteDepartment(id).subscribe({
      next: () => { this.message = 'Department deleted'; this.loadDepartments(); },
      error: (error: any) => this.message = error.error?.message || 'Unable to delete department.'
    });
  }
}
