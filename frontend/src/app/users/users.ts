import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-users',
  imports: [CommonModule, FormsModule],
  templateUrl: './users.html',
  styleUrl: './users.css',
})
export class Users implements OnInit {
  department = { name: '', code: '', description: '' };
  departments: any[] = [];
  message = '';

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.loadDepartments();
  }

  loadDepartments() {
    this.http.get<any[]>('http://localhost:3000/department').subscribe({
      next: (data) => this.departments = data,
      error: () => this.message = 'Unable to load departments.'
    });
  }

  saveDepartment() {
    if (!this.department.name || !this.department.code) {
      this.message = 'Empty Form';
      return;
    }

    this.http.post('http://localhost:3000/department/add', this.department).subscribe({
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
  deleteDepartment(id: string) {
    this.http.delete(`http://localhost:3000/department/delete/${id}`).subscribe({
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
