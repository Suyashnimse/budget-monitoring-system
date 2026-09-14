import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DepartmentService } from '../services/department.service';

@Component({
  selector: 'app-departments',
  imports: [CommonModule, FormsModule],
  templateUrl: './departments.html',
  styleUrl: './departments.css'
})
export class Departments implements OnInit {
  department = { name: '', code: '', description: '' };
  departments: any[] = [];
  message = '';
  loading = false;

  constructor(private departmentService: DepartmentService, private changeDetector: ChangeDetectorRef) {}

  ngOnInit() {
    this.loadDepartments();
  }

  loadDepartments() {
    this.loading = true;
    this.departmentService.getDepartments().subscribe({
      next: (departments: any) => {
        this.departments = departments || [];
        this.loading = false;
        this.changeDetector.detectChanges();
      },
      error: () => {
        this.message = 'Unable to load departments.';
        this.loading = false;
        this.changeDetector.detectChanges();
      }
    });
  }

  saveDepartment() {
    if (!this.department.name.trim() || !this.department.code.trim()) {
      this.message = 'Department name and code are required.';
      return;
    }

    this.departmentService.createDepartment({
      name: this.department.name.trim(),
      code: this.department.code.trim().toUpperCase(),
      description: this.department.description.trim()
    }).subscribe({
      next: () => {
        this.message = 'Department created successfully.';
        this.department = { name: '', code: '', description: '' };
        this.loadDepartments();
      },
      error: (error: any) => {
        this.message = error.error?.message || 'Unable to create department.';
      }
    });
  }

  removeDepartment(id: string) {
    this.departmentService.deleteDepartment(id).subscribe({
      next: () => {
        this.message = 'Department removed.';
        this.loadDepartments();
      },
      error: (error: any) => {
        this.message = error.error?.message || 'Unable to remove department.';
      }
    });
  }
}
