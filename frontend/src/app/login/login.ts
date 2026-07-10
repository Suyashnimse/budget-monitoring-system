import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { UserService } from '../services/user.service';

@Component({
  selector: 'app-login',
  imports: [FormsModule],
  templateUrl: './login.component.html',
  styleUrl: './login.css',
})
export class Login {
  email = '';
  password = '';

  constructor(private router: Router, private userService: UserService) {}

  login() {
    if (!this.email || !this.password) {
      alert('Empty Form');
      return;
    }

    this.userService.login({ email: this.email, password: this.password }).subscribe(
      (response: any) => {
        if (response.token) {
          localStorage.setItem('token', response.token);
          this.router.navigate(['/dashboard']);
        }
      },
      (error: any) => {
        alert(error.error?.message || 'Unauthorized Access');
      }
    );
  }
}
