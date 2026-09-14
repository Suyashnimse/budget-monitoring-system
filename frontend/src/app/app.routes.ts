import { Routes } from '@angular/router';
import { Dashboard } from './dashboard/dashboard';
import { Budget } from './budget/budget';
import { Expense } from './expense/expense';
import { Login } from './login/login';
import { Auditlogs } from './auditlogs/auditlogs';
import { Users } from './users/users';
import { Departments } from './departments/departments';
import { Alerts } from './alerts/alerts';
import { Reports } from './reports/reports';
import { Registration } from './registration/registration';
import { Profile } from './profile/profile';
import { Approvals } from './approvals/approvals';
import { GovernmentExpenditure } from './government-expenditure/government-expenditure';

export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: 'login', component: Login },
  { path: 'register', component: Registration },
  { path: 'profile', component: Profile },
  { path: 'dashboard', component: Dashboard },
  { path: 'users', component: Users },
  { path: 'departments', component: Departments },
  { path: 'budget', component: Budget },
  { path: 'expense', component: Expense },
  { path: 'government-expenditure', component: GovernmentExpenditure },
  { path: 'approvals', component: Approvals },
  { path: 'alerts', component: Alerts },
  { path: 'reports', component: Reports },
  { path: 'auditlogs', component: Auditlogs }
];
