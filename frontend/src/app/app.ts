import { Component, inject } from '@angular/core';
import { NgIf } from '@angular/common';
import { Router, RouterLink, RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root',
  imports: [RouterLink, RouterOutlet, NgIf],
  templateUrl: './app.component.html',
  styleUrl: './app.css'
})
export class App {
  private router = inject(Router);
  darkMode = false;
  menuOpen = true;
  dropdownOpen = false;
  createMenuOpen = false;
  loggedInUser: any = null;

  constructor() {
    this.loadUser();
  }

  get isAuthRoute(): boolean {
    const url = this.router.url.split('?')[0].split('#')[0];
    return url === '/login' || url === '/register' || url === '/profile';
  }

  toggleTheme(): void {
    this.darkMode = !this.darkMode;
  }

  toggleMenu(): void {
    this.menuOpen = !this.menuOpen;
  }

  toggleDropdown(): void {
    this.dropdownOpen = !this.dropdownOpen;
    this.createMenuOpen = false;
  }

  toggleCreateMenu(): void {
    this.createMenuOpen = !this.createMenuOpen;
    this.dropdownOpen = false;
  }

  closeMenus(): void {
    this.dropdownOpen = false;
    this.createMenuOpen = false;
  }

  private loadUser(): void {
    const user = localStorage.getItem('loggedInUser');
    this.loggedInUser = user ? JSON.parse(user) : null;
  }

  logout(): void {
    this.closeMenus();
    localStorage.removeItem('token');
    localStorage.removeItem('loggedInUser');
    this.loggedInUser = null;
    this.router.navigate(['/login']);
  }
}
