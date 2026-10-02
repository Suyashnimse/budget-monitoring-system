import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { GovernmentExpenditureService } from '../services/government-expenditure.service';

@Component({
  selector: 'app-government-expenditure',
  imports: [CommonModule, FormsModule],
  templateUrl: './government-expenditure.html',
  styleUrl: './government-expenditure.css'
})
export class GovernmentExpenditure implements OnInit {
  yearOptions = ['All years'];
  governmentLevels = ['All governments', 'Union Government', 'Maharashtra'];
  estimateTypes = ['All types', 'Actual', 'Budget Estimate', 'Revised Estimate'];
  selectedYear = 'All years';
  selectedGovernmentLevel = 'All governments';
  selectedEstimateType = 'All types';
  records: any[] = [];
  summary: Record<string, number> = { Actual: 0, 'Budget Estimate': 0, 'Revised Estimate': 0 };
  message = 'Loading expenditure records...';

  constructor(private expenditureService: GovernmentExpenditureService, private changeDetector: ChangeDetectorRef) {}

  ngOnInit() {
    this.loadRecords();
  }

  loadRecords() {
    const year = this.selectedYear === 'All years' ? '' : this.selectedYear;
    const governmentLevel = this.selectedGovernmentLevel === 'All governments' ? '' : this.selectedGovernmentLevel;
    const estimateType = this.selectedEstimateType === 'All types' ? '' : this.selectedEstimateType;
    this.expenditureService.getRecords(year, governmentLevel, estimateType).subscribe({
      next: (response) => {
        this.records = response.records || [];
        if (this.selectedYear === 'All years') {
          this.yearOptions = ['All years', ...Array.from(new Set(this.records.map((record: any) => record.financialYear)))
            .sort((first, second) => second.localeCompare(first))];
        }
        this.summary = response.summary;
        this.message = this.records.length ? '' : 'No verified records have been imported for this filter.';
        this.changeDetector.detectChanges();
      },
      error: () => {
        this.message = 'Unable to load government expenditure records.';
        this.changeDetector.detectChanges();
      }
    });
  }

  formatAmount(amount: number) {
    return new Intl.NumberFormat('en-IN', { maximumFractionDigits: 2 }).format(amount || 0);
  }
}
