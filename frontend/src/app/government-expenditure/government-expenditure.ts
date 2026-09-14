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
  yearOptions = ['All years', ...Array.from({ length: 50 }, (_, index) => String(2001 + index))];
  selectedYear = 'All years';
  records: any[] = [];
  summary = { allocatedAmount: 0, actualAmount: 0, variance: 0 };
  message = 'Loading expenditure records...';

  constructor(private expenditureService: GovernmentExpenditureService, private changeDetector: ChangeDetectorRef) {}

  ngOnInit() {
    this.loadRecords();
  }

  loadRecords() {
    const year = this.selectedYear === 'All years' ? '' : this.selectedYear;
    this.expenditureService.getRecords(year).subscribe({
      next: (response) => {
        this.records = response.records || [];
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
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount || 0);
  }
}
