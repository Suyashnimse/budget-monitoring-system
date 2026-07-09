import { Routes } from '@angular/router';
import { Dashboard } from './dashboard/dashboard';
import { Budget } from './budget/budget';
import { Expense } from './expense/expense';
import { Login } from './login/login';
import { Auditlogs } from './auditlogs/auditlogs';
import { Users } from './users/users';
import { Alerts } from './alerts/alerts';
import { Reports } from './reports/reports';

export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: 'login', component: Login },
  { path: 'dashboard', component: Dashboard },
  { path: 'users', component: Users },
  { path: 'departments', component: Users },
  { path: 'budget', component: Budget },
  { path: 'expense', component: Expense },
  { path: 'alerts', component: Alerts },
  { path: 'reports', component: Reports },
  { path: 'auditlogs', component: Auditlogs }
];
