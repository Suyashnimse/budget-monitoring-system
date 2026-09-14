import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { UserService } from '../services/user.service';

@Component({
  selector: 'app-registration',
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './registration.component.html',
  styleUrl: './registration.css',
})
export class Registration {
  name = '';
  email = '';
  mobile = '';
  photo = '';
  password = '';
  confirmPassword = '';
  emailOtp = '';
  mobileOtp = '';
  otpChallengeId = '';
  emailVerified = false;
  mobileVerified = false;
  otpMessage = '';
  sendingOtp = false;

  constructor(private router: Router, private userService: UserService) {}

  onPhotoSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const reader = new FileReader();
      reader.onload = () => {
        this.photo = reader.result as string;
      };
      reader.readAsDataURL(input.files[0]);
    }
  }

  sendOtp() {
    if (!this.email || !this.mobile) {
      this.otpMessage = 'Enter both your email and mobile number first.';
      return;
    }

    this.sendingOtp = true;
    this.userService.requestRegistrationOtp(this.email, this.mobile).subscribe({
      next: (response: any) => {
        this.otpChallengeId = response.challengeId;
        this.emailVerified = false;
        this.mobileVerified = false;
        this.emailOtp = '';
        this.mobileOtp = '';
        this.otpMessage = response.message;
        this.sendingOtp = false;
      },
      error: (error: any) => {
        this.otpMessage = error.error?.message || 'Unable to send verification codes.';
        this.sendingOtp = false;
      }
    });
  }

  verifyOtp(channel: 'email' | 'mobile') {
    const code = channel === 'email' ? this.emailOtp : this.mobileOtp;
    if (!this.otpChallengeId || !/^\d{6}$/.test(code)) {
      this.otpMessage = `Enter the six-digit ${channel} code.`;
      return;
    }

    this.userService.verifyRegistrationOtp(this.otpChallengeId, channel, code).subscribe({
      next: (response: any) => {
        this.emailVerified = response.emailVerified;
        this.mobileVerified = response.mobileVerified;
        this.otpMessage = `${channel === 'email' ? 'Email' : 'Mobile'} verified successfully.`;
      },
      error: (error: any) => this.otpMessage = error.error?.message || 'Incorrect verification code.'
    });
  }

  register() {
    if (!this.name || !this.email || !this.mobile || !this.password || !this.confirmPassword) {
      alert('Please fill in all required fields');
      return;
    }

    if (!this.emailVerified || !this.mobileVerified) {
      alert('Verify both your email and mobile number before creating the account.');
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
      otpChallengeId: this.otpChallengeId,
      photo: this.photo,
      password: this.password,
      registeredAt
    }).subscribe(
      (response: any) => {
        localStorage.setItem('loggedInUser', JSON.stringify({
          name: this.name,
          email: this.email,
          mobile: this.mobile,
          photo: this.photo,
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
