import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

@Component({
  selector: 'app-login',
  imports: [FormsModule],
  templateUrl: './login.component.html',
  styleUrl: './login.css',
})
export class Login {
  email = '';
  password = '';

  constructor(private router: Router) {}

  login() {
    if (!this.email || !this.password) {
      alert('Empty Form');
      return;
    }

    if (this.email === 'admin@example.com' && this.password === 'admin123') {
      this.router.navigate(['/dashboard']);
    } else {
      alert('Unauthorized Access');
    }
  }
}
