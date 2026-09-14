import { CommonModule } from '@angular/common';
import { AfterViewInit, Component, ElementRef, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { UserService } from '../services/user.service';
import { environment } from '../../environments/environment';

@Component({
  selector: 'app-login',
  imports: [CommonModule, FormsModule],
  templateUrl: './login.component.html',
  styleUrl: './login.css',
})
export class Login implements AfterViewInit {
  @ViewChild('googleButton') googleButton?: ElementRef<HTMLDivElement>;
  email = '';
  password = '';
  name = '';
  mobile = '';
  confirmPassword = '';
  otp = '';
  generatedOtp = '';
  otpMessage = '';
  isRegistering = false;
  showPassword = false;
  showConfirmPassword = false;

  constructor(private router: Router, private userService: UserService) {}

  ngAfterViewInit() {
    this.renderGoogleButton();
  }

  showLogin() {
    this.isRegistering = false;
  }

  showRegister() {
    this.isRegistering = true;
  }

  sendOtp() {
    if (!this.email && !this.mobile) {
      this.otpMessage = 'Please enter an email or mobile number first.';
      return;
    }

    this.generatedOtp = Math.floor(100000 + Math.random() * 900000).toString();
    this.otpMessage = `OTP sent to ${this.email || this.mobile}. Use code: ${this.generatedOtp}`;
    this.otp = '';
  }

  private renderGoogleButton(attempt = 0) {
    if (!environment.googleClientId || !this.googleButton) {
      return;
    }

    const googleIdentity = (globalThis as any).google;
    if (!googleIdentity?.accounts?.id) {
      if (attempt < 20) {
        setTimeout(() => this.renderGoogleButton(attempt + 1), 250);
      }
      return;
    }

    googleIdentity.accounts.id.initialize({
      client_id: environment.googleClientId,
      callback: (response: { credential: string }) => this.completeGoogleLogin(response.credential)
    });
    googleIdentity.accounts.id.renderButton(this.googleButton.nativeElement, {
      type: 'standard',
      theme: 'outline',
      size: 'large',
      text: 'continue_with',
      shape: 'rectangular',
      width: 320
    });
  }

  private completeGoogleLogin(credential: string) {
    this.userService.googleLogin(credential).subscribe(
      (response: any) => {
        localStorage.setItem('token', response.token);
        localStorage.setItem('loggedInUser', JSON.stringify(response.user));
        this.router.navigate(['/profile']);
      },
      (error: any) => alert(error?.error?.message || 'Google login failed')
    );
  }

  login() {
    if (!this.email || !this.password) {
      alert('Please fill in both fields');
      return;
    }

    this.userService.login({ email: this.email, password: this.password }).subscribe(
      (response: any) => {
        if (response?.token) {
          localStorage.setItem('token', response.token);
          localStorage.setItem('loggedInUser', JSON.stringify({ name: this.email, email: this.email }));
          this.router.navigate(['/profile']);
        } else if (response?.message) {
          alert(response.message);
        } else {
          alert('Unauthorized Access');
        }
      },
      (error: any) => {
        alert(error?.error?.message || error?.message || 'Unauthorized Access');
      }
    );
  }

  register() {
    if (!this.name || !this.email || !this.mobile || !this.password || !this.confirmPassword) {
      alert('Please fill in all required fields');
      return;
    }

    if (!this.generatedOtp || this.otp !== this.generatedOtp) {
      alert('Please enter the OTP sent to your email or mobile number.');
      return;
    }

    if (this.password !== this.confirmPassword) {
      alert('Passwords do not match');
      return;
    }

    const registeredAt = new Date().toLocaleString();

    this.userService.register({
      name: this.name,
      email: this.email,
      mobile: this.mobile,
      password: this.password,
      registeredAt
    }).subscribe(
      (response: any) => {
        localStorage.setItem('loggedInUser', JSON.stringify({
          name: this.name,
          email: this.email,
          mobile: this.mobile,
          registeredAt
        }));
        alert(response?.message || 'Registration successful');
        this.router.navigate(['/profile']);
      },
      (error: any) => {
        alert(error?.error?.message || error?.message || 'Registration failed');
      }
    );
  }
}
