import { Component, OnDestroy, OnInit } from '@angular/core';
import { DatePipe, DecimalPipe, NgFor, NgIf } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BudgetService } from '../services/budget';
import { ExpenseService } from '../services/expense';
import { GovernmentExpenditureService } from '../services/government-expenditure.service';

@Component({
  selector: 'app-dashboard',
  imports: [DatePipe, DecimalPipe, FormsModule, NgFor, NgIf],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.css',
})
export class Dashboard implements OnDestroy, OnInit {
  budgets: any[] = [];
  expenses: any[] = [];
  officialExpenditures: any[] = [];
  selectedYear = 'All years';
  selectedOfficialYear = 'All years';
  selectedOfficialGovernment = 'All governments';
  selectedOfficialMeasure = 'All types';
  officialDepartmentSearch = '';
  officialDataMessage = 'Loading official budget archive...';
  officialYearOptions = ['All years'];
  officialGovernmentOptions = ['All governments', 'Union Government', 'Maharashtra'];
  officialMeasureOptions = ['All types', 'Actual', 'Budget Estimate', 'Revised Estimate'];
  totalBudget = 0;
  approvedBudget = 0;
  pendingBudget = 0;
  rejectedBudget = 0;
  totalExpense = 0;
  utilizationPercent = 0;
  totalAlerts = 0;
  alert = '';
  lastUpdated = new Date();
  private refreshTimer?: ReturnType<typeof setInterval>;

  constructor(
    private budgetService: BudgetService,
    private expenseService: ExpenseService,
    private governmentExpenditureService: GovernmentExpenditureService
  ) {}

  ngOnInit(): void {
    this.loadSummary();
    this.refreshTimer = setInterval(() => this.loadSummary(), 30000);
    this.loadOfficialExpenditures();
  }

  ngOnDestroy(): void {
    if (this.refreshTimer) clearInterval(this.refreshTimer);
  }

  loadSummary() {
    this.budgetService.getBudgets().subscribe({
      next: (budgets: any) => {
        this.budgets = Array.isArray(budgets) ? budgets : [];
        this.refreshSummary();
      }
    });

    this.expenseService.getExpenses().subscribe({
      next: (expenses: any) => {
        this.expenses = Array.isArray(expenses) ? expenses : [];
        this.refreshSummary();
      }
    });
  }

  loadOfficialExpenditures() {
    this.governmentExpenditureService.getRecords().subscribe({
      next: (response) => {
        this.officialExpenditures = Array.isArray(response.records) ? response.records : [];
        this.officialYearOptions = ['All years', ...Array.from(new Set(this.officialExpenditures.map((record: any) => record.financialYear)))
          .sort((first, second) => second.localeCompare(first))];
        this.officialDataMessage = this.officialExpenditures.length ? '' : 'No official department budget records have been imported yet.';
      },
      error: () => {
        this.officialDataMessage = 'Unable to load official budget records.';
      }
    });
  }

  refreshSummary() {
    const budgets = this.visibleBudgets;
    this.totalBudget = budgets
      .filter((budget: any) => (budget.status || 'Pending Approval') !== 'Rejected')
      .reduce((sum: number, budget: any) => sum + Number(budget.allocatedAmount || 0), 0);
    this.approvedBudget = budgets
      .filter((budget: any) => budget.status === 'Approved')
      .reduce((sum: number, budget: any) => sum + Number(budget.allocatedAmount || 0), 0);
    this.pendingBudget = budgets
      .filter((budget: any) => !budget.status || budget.status === 'Pending Approval')
      .reduce((sum: number, budget: any) => sum + Number(budget.allocatedAmount || 0), 0);
    this.rejectedBudget = budgets
      .filter((budget: any) => budget.status === 'Rejected')
      .reduce((sum: number, budget: any) => sum + Number(budget.allocatedAmount || 0), 0);
    this.totalExpense = this.visibleExpenses
      .reduce((sum: number, expense: any) => sum + Number(expense.amount || 0), 0);
    this.utilizationPercent = this.approvedBudget > 0 ? (this.totalExpense / this.approvedBudget) * 100 : 0;

    if (this.totalExpense > this.approvedBudget && this.totalExpense > 0) {
      this.alert = this.approvedBudget > 0 ? 'Expenses exceed approved budget' : 'Expenses recorded without an approved budget';
    } else if (this.approvedBudget > 0 && this.utilizationPercent < 40) {
      this.alert = 'Budget utilization is below 40%';
    } else {
      this.alert = '';
    }
    this.totalAlerts = this.alert ? 1 : 0;
    this.lastUpdated = new Date();
  }

  get yearOptions() {
    const years = new Set<string>(this.officialYearOptions.filter((year) => year !== 'All years'));
    this.budgets.forEach((budget: any) => {
      const normalized = this.normalizeFiscalYear(budget.financialYear);
      if (normalized) years.add(normalized);
    });
    this.expenses.forEach((expense: any) => {
      const normalized = this.normalizeFiscalYear(this.fiscalYearFromDate(expense.date));
      if (normalized) years.add(normalized);
    });
    return ['All years', ...Array.from(years).sort((first, second) => this.compareFiscalYears(second, first))];
  }

  get visibleBudgets() {
    return this.selectedYear === 'All years'
      ? this.budgets
      : this.budgets.filter((budget: any) => this.matchesSelectedYear(this.selectedYear, budget.financialYear));
  }

  get visibleExpenses() {
    if (this.selectedYear === 'All years') return this.expenses;
    return this.expenses.filter((expense: any) => {
      const linkedBudget = this.findBudgetForExpense(expense);
      const year = linkedBudget ? linkedBudget.financialYear : this.fiscalYearFromDate(expense.date);
      return this.matchesSelectedYear(this.selectedYear, year);
    });
  }

  get selectedOfficialRows() {
    const query = this.officialDepartmentSearch.trim().toLowerCase();
    return this.officialExpenditures.filter((record: any) => {
      const matchesYear = this.matchesSelectedYear(this.selectedOfficialYear, record.financialYear);
      const matchesGovernment = this.selectedOfficialGovernment === 'All governments' || record.governmentLevel === this.selectedOfficialGovernment;
      const matchesMeasure = this.selectedOfficialMeasure === 'All types' || record.estimateType === this.selectedOfficialMeasure;
      const matchesSearch = !query || [record.department, record.governmentLevel, record.estimateType]
        .some((value) => String(value || '').toLowerCase().includes(query));
      return matchesYear && matchesGovernment && matchesMeasure && matchesSearch;
    }).sort((first: any, second: any) => first.department.localeCompare(second.department) || first.estimateType.localeCompare(second.estimateType));
  }

  get officialEstimateSummary() {
    const rows = this.officialExpenditures.filter((record: any) =>
      this.matchesSelectedYear(this.selectedOfficialYear, record.financialYear) &&
      (this.selectedOfficialGovernment === 'All governments' || record.governmentLevel === this.selectedOfficialGovernment)
    );
    return rows.reduce((summary: Record<string, number>, record: any) => {
      summary[record.estimateType] = (summary[record.estimateType] || 0) + Number(record.amount || 0);
      return summary;
    }, { Actual: 0, 'Budget Estimate': 0, 'Revised Estimate': 0 });
  }

  get officialBudgetUsed() {
    return this.officialEstimateSummary['Actual'] || 0;
  }

  get officialTotalBudget() {
    return this.officialEstimateSummary['Budget Estimate']
      || this.officialEstimateSummary['Revised Estimate']
      || this.officialEstimateSummary['Actual']
      || 0;
  }

  get officialBudgetAllocation() {
    return this.officialEstimateSummary['Revised Estimate'] || this.officialEstimateSummary['Budget Estimate'] || 0;
  }

  get officialBudgetRemaining() {
    return Math.max(0, this.officialBudgetAllocation - this.officialBudgetUsed);
  }

  get officialUtilizationPercent() {
    return this.officialBudgetAllocation > 0
      ? (this.officialBudgetUsed / this.officialBudgetAllocation) * 100
      : 0;
  }

  get officialRemainingPercent() {
    if (this.officialBudgetAllocation <= 0) return 0;
    return Math.max(0, Math.min(100, 100 - this.officialUtilizationPercent));
  }

  get remainingPercent() {
    if (this.approvedBudget <= 0) return 0;
    return Math.max(0, Math.min(100, 100 - this.utilizationPercent));
  }

  get monthlySpending() {
    const fiscalYear = this.selectedYear === 'All years' ? new Date().getFullYear() : Number(this.selectedYear);
    const monthIndexes = this.selectedYear === 'All years'
      ? Array.from({ length: 12 }, (_, index) => index)
      : Array.from({ length: 12 }, (_, index) => (index + 3) % 12);
    const yearByMonth = monthIndexes.map((month) => this.selectedYear === 'All years' || month >= 3 ? fiscalYear : fiscalYear + 1);
    const monthlyTotals = monthIndexes.map((month, index) => this.visibleExpenses
      .filter((expense: any) => {
        const date = new Date(expense.date);
        return date.getMonth() === month && (this.selectedYear === 'All years' || date.getFullYear() === yearByMonth[index]);
      })
      .reduce((sum: number, expense: any) => sum + Number(expense.amount || 0), 0));
    const maximum = Math.max(...monthlyTotals, 0);

    return monthIndexes.map((month, index) => ({
      label: new Date(2000, month, 1).toLocaleString('en', { month: 'short' }),
      amount: monthlyTotals[index],
      height: maximum > 0 ? Math.max(4, (monthlyTotals[index] / maximum) * 100) : 0
    }));
  }

  get departmentUtilizations() {
    const departments = new Map<string, { name: string; budgetEstimate: number; revisedEstimate: number; expense: number }>();
    const officialRows = this.officialExpenditures.filter((record: any) => {
      const matchesYear = this.matchesSelectedYear(this.selectedYear, record.financialYear);
      const matchesGovernment = this.selectedOfficialGovernment === 'All governments' || record.governmentLevel === this.selectedOfficialGovernment;
      return matchesYear && matchesGovernment;
    });

    officialRows.forEach((record: any) => {
      const name = String(record.department || 'Unassigned').trim();
      const department = departments.get(name) || { name, budgetEstimate: 0, revisedEstimate: 0, expense: 0 };
      const amount = Number(record.amount || 0);
      if (record.estimateType === 'Budget Estimate') department.budgetEstimate += amount;
      if (record.estimateType === 'Revised Estimate') department.revisedEstimate += amount;
      if (record.estimateType === 'Actual') department.expense += amount;
      departments.set(name, department);
    });

    return Array.from(departments.values())
      .map((department) => ({
        ...department,
        approvedBudget: department.revisedEstimate || department.budgetEstimate,
        utilization: (department.revisedEstimate || department.budgetEstimate) > 0
          ? (department.expense / (department.revisedEstimate || department.budgetEstimate)) * 100
          : 0,
        utilizationWidth: (department.revisedEstimate || department.budgetEstimate) > 0
          ? Math.min(100, (department.expense / (department.revisedEstimate || department.budgetEstimate)) * 100)
          : 0
      }))
      .sort((first, second) => second.approvedBudget - first.approvedBudget || first.name.localeCompare(second.name));
  }

  get realBudgetSummary() {
    const rows = this.officialExpenditures.filter((record: any) => {
      const yearMatches = this.selectedYear === 'All years' || record.financialYear === this.selectedYear;
      const governmentMatches = this.selectedOfficialGovernment === 'All governments' || record.governmentLevel === this.selectedOfficialGovernment;
      return yearMatches && governmentMatches;
    });

    return rows.reduce((summary: Record<string, number>, record: any) => {
      summary[record.estimateType] = (summary[record.estimateType] || 0) + Number(record.amount || 0);
      return summary;
    }, { Actual: 0, 'Budget Estimate': 0, 'Revised Estimate': 0 });
  }

  get officialDepartmentUtilizationRows() {
    const grouped = new Map<string, {
      financialYear: string;
      governmentLevel: string;
      department: string;
      budgetEstimate: number;
      revisedEstimate: number;
      actual: number;
      sourceUrl: string;
    }>();

    this.officialExpenditures
      .filter((record: any) => this.matchesSelectedYear(this.selectedYear, record.financialYear))
      .filter((record: any) => this.selectedOfficialGovernment === 'All governments' || record.governmentLevel === this.selectedOfficialGovernment)
      .forEach((record: any) => {
        const key = `${record.financialYear}|${record.governmentLevel}|${record.department}`;
        const row = grouped.get(key) || {
          financialYear: record.financialYear,
          governmentLevel: record.governmentLevel,
          department: record.department,
          budgetEstimate: 0,
          revisedEstimate: 0,
          actual: 0,
          sourceUrl: record.sourceUrl
        };
        if (record.estimateType === 'Budget Estimate') row.budgetEstimate += Number(record.amount || 0);
        if (record.estimateType === 'Revised Estimate') row.revisedEstimate += Number(record.amount || 0);
        if (record.estimateType === 'Actual') row.actual += Number(record.amount || 0);
        grouped.set(key, row);
      });

    return Array.from(grouped.values())
      .map((row) => {
        const allocation = row.revisedEstimate || row.budgetEstimate;
        return {
          ...row,
          allocation,
          utilization: allocation > 0 ? (row.actual / allocation) * 100 : 0
        };
      })
      .sort((first, second) => second.allocation - first.allocation || first.department.localeCompare(second.department));
  }

  get officialYearBreakdown() {
    const years = Array.from(new Set(this.officialExpenditures.map((record: any) => record.financialYear))).sort((first, second) => second.localeCompare(first));
    return years.filter((year) => year >= '2020' && year <= '2026').map((year) => {
      const rows = this.officialExpenditures.filter((record: any) => record.financialYear === year);
      const amountByType = rows.reduce((summary: Record<string, number>, record: any) => {
        summary[record.estimateType] = (summary[record.estimateType] || 0) + Number(record.amount || 0);
        return summary;
      }, { Actual: 0, 'Budget Estimate': 0, 'Revised Estimate': 0 });
      return {
        year,
        total: Object.values(amountByType).reduce((sum, value) => sum + value, 0),
        actual: amountByType['Actual'] || 0,
        budget: amountByType['Budget Estimate'] || 0,
        revised: amountByType['Revised Estimate'] || 0,
      };
    });
  }

  private findBudgetForExpense(expense: any) {
    const reference = String(expense.budgetId || '').trim().toLowerCase();
    if (!reference) return undefined;
    return this.budgets.find((budget: any) => [budget._id, budget.id, budget.title]
      .some((value) => String(value || '').trim().toLowerCase() === reference));
  }

  private normalizeFiscalYear(value: string | number | Date | undefined): string {
    if (value === undefined || value === null || value === '') return '';
    if (typeof value === 'number') {
      return `${value}-${String(value + 1).slice(-2)}`;
    }
    if (value instanceof Date) {
      const year = this.fiscalYearFromDate(value);
      return `${year}-${String(year + 1).slice(-2)}`;
    }
    const text = String(value).trim();
    if (/^\d{4}-\d{2}$/.test(text)) return text;
    if (/^\d{4}$/.test(text)) return `${text}-${String(Number(text) + 1).slice(-2)}`;
    const match = text.match(/(\d{4})/);
    if (!match) return '';
    const year = Number(match[1]);
    return `${year}-${String(year + 1).slice(-2)}`;
  }

  private matchesSelectedYear(selectedYear: string, value: string | number | Date | undefined): boolean {
    if (selectedYear === 'All years') return true;
    return this.normalizeFiscalYear(selectedYear) === this.normalizeFiscalYear(value);
  }

  private compareFiscalYears(first: string, second: string): number {
    if (first === 'All years') return -1;
    if (second === 'All years') return 1;
    const firstYear = Number(String(first).slice(0, 4));
    const secondYear = Number(String(second).slice(0, 4));
    return firstYear - secondYear;
  }

  private fiscalYearFromDate(value: string | Date) {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return new Date().getFullYear();
    return date.getMonth() >= 3 ? date.getFullYear() : date.getFullYear() - 1;
  }

  private yearKey(value: string | number) {
    return String(value || '').match(/\d{4}/)?.[0] || '';
  }
}
