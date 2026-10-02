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
  department = { name: '', code: '', description: '', governmentLevel: 'Maharashtra' };
  departments: any[] = [];
  selectedLevel = 'All government departments';
  departmentSearch = '';
  governmentLevels = ['All government departments', 'Union Ministry', 'Union Department', 'Maharashtra'];
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
    if (!this.department.name.trim() || !this.department.code.trim() || !this.governmentLevels.slice(1).includes(this.department.governmentLevel)) {
      this.message = 'Name, code, and government level are required.';
      return;
    }

    this.departmentService.createDepartment({
      name: this.department.name.trim(),
      code: this.department.code.trim().toUpperCase(),
      description: this.department.description.trim(),
      governmentLevel: this.department.governmentLevel
    }).subscribe({
      next: () => {
        this.message = 'Department created successfully.';
        this.department = { name: '', code: '', description: '', governmentLevel: 'Maharashtra' };
        this.loadDepartments();
      },
      error: (error: any) => {
        this.message = error.error?.message || 'Unable to create department.';
      }
    });
  }

  get filteredDepartments() {
    const query = this.departmentSearch.trim().toLowerCase();
    return this.departments.filter((department: any) => {
      const isGovernmentDepartment = this.governmentLevels.slice(1).includes(department.governmentLevel);
      const matchesLevel = this.selectedLevel === 'All government departments' || department.governmentLevel === this.selectedLevel;
      const matchesSearch = !query || [department.name, department.code, department.governmentLevel, department.description]
        .some((value) => String(value || '').toLowerCase().includes(query));
      return isGovernmentDepartment && matchesLevel && matchesSearch;
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
