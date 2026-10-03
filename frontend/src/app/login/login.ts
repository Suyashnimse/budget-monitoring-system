import { CommonModule } from '@angular/common';
import {
  AfterViewInit,
  Component,
  ElementRef,
  ViewChild
} from '@angular/core';
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
  @ViewChild('googleButton')
  googleButton?: ElementRef<HTMLDivElement>;

  // Login fields
  email = '';
  password = '';

  // Registration fields
  name = '';
  mobile = '';
  confirmPassword = '';

  // OTP fields
  emailOtp = '';
  mobileOtp = '';
  otpMessage = '';
  otpChallengeId = '';

  // OTP verification status
  emailOtpVerified = false;
  mobileOtpVerified = false;

  // UI state
  isRegistering = false;
  isOtpLogin = false;
  showPassword = false;
  showConfirmPassword = false;
  isSendingOtp = false;
  isVerifyingEmailOtp = false;
  isVerifyingMobileOtp = false;
  isLoggingInWithOtp = false;
  isRegisteringUser = false;

  readonly isGoogleLoginAvailable =
    !!environment.googleClientId;

  constructor(
    private router: Router,
    private userService: UserService
  ) {}

  ngAfterViewInit() {
    if (this.isGoogleLoginAvailable) {
      this.renderGoogleButton();
    }
  }

  showLogin() {
    this.isRegistering = false;
    this.isOtpLogin = false;
    this.clearOtpState();
  }

  showOtpLogin() {
    this.isRegistering = false;
    this.isOtpLogin = true;
    this.clearOtpState();
  }

  showRegister() {
    this.isRegistering = true;
    this.isOtpLogin = false;
    this.clearOtpState();
  }

  onOtpContactChanged() {
    if (this.otpChallengeId || this.emailOtpVerified || this.mobileOtpVerified) {
      this.clearOtpState();
      this.otpMessage = 'Email or mobile changed. Request new verification codes.';
    }
  }

  /**
   * Send OTPs to both email and mobile.
   *
   * The backend generates the OTPs and sends them.
   * The frontend never generates or displays the OTP.
   */
  sendOtp() {
    if (!this.email) {
      this.otpMessage = 'Please enter your email address first.';
      return;
    }

    if (!this.mobile) {
      this.otpMessage = 'Please enter your mobile number first.';
      return;
    }

    // Backend expects international mobile format.
    // Example: +919876543210
    if (!/^\+[1-9]\d{7,14}$/.test(this.mobile.trim())) {
      this.otpMessage =
        'Please enter mobile number in international format, for example +919876543210.';
      return;
    }

    this.isSendingOtp = true;

    this.otpChallengeId = '';
    this.emailOtp = '';
    this.mobileOtp = '';

    this.emailOtpVerified = false;
    this.mobileOtpVerified = false;

    this.otpMessage = 'Sending verification codes...';

    const otpRequest = this.isOtpLogin
      ? this.userService.requestLoginOtp(this.email.trim(), this.mobile.trim())
      : this.userService.requestRegistrationOtp(this.email.trim(), this.mobile.trim());

    otpRequest
      .subscribe(
        (response: any) => {
          this.isSendingOtp = false;

          this.otpChallengeId =
            response?.challengeId || '';

          if (!this.otpChallengeId) {
            this.otpMessage =
              'OTP service did not return a verification ID.';
            return;
          }

          this.otpMessage =
            response?.message ||
            'Verification codes have been sent to your email and mobile number.';
        },
        (error: any) => {
          this.isSendingOtp = false;

          this.otpMessage =
            error?.error?.message ||
            error?.message ||
            'Unable to send verification codes.';
        }
      );
  }

  /**
   * Verify the OTP received by email.
   */
  verifyEmailOtp() {
    if (!this.otpChallengeId) {
      this.otpMessage = 'Request verification codes first.';
      return;
    }

    if (!/^\d{6}$/.test(this.emailOtp.trim())) {
      this.otpMessage = 'Enter the 6-digit code sent to your email.';
      return;
    }

    this.isVerifyingEmailOtp = true;

    this.userService
      .verifyRegistrationOtp(
        this.otpChallengeId,
        'email',
        this.emailOtp.trim()
      )
      .subscribe(
        (response: any) => {
          this.isVerifyingEmailOtp = false;

          this.emailOtpVerified =
            response?.emailVerified === true;

          if (this.emailOtpVerified) {
            this.otpMessage =
              'Email OTP verified successfully.';
          } else {
            this.otpMessage =
              'Email OTP verification was not completed.';
          }
        },
        (error: any) => {
          this.isVerifyingEmailOtp = false;
          this.otpMessage = error?.error?.message || error?.message || 'Email verification failed.';
        }
      );
  }

  /**
   * Verify the OTP received by mobile.
   */
  verifyMobileOtp() {
    if (!this.otpChallengeId) {
      this.otpMessage = 'Request verification codes first.';
      return;
    }

    if (!/^\d{6}$/.test(this.mobileOtp.trim())) {
      this.otpMessage = 'Enter the 6-digit code sent to your mobile.';
      return;
    }

    this.isVerifyingMobileOtp = true;

    this.userService
      .verifyRegistrationOtp(
        this.otpChallengeId,
        'mobile',
        this.mobileOtp.trim()
      )
      .subscribe(
        (response: any) => {
          this.isVerifyingMobileOtp = false;

          this.mobileOtpVerified =
            response?.mobileVerified === true;

          if (this.mobileOtpVerified) {
            this.otpMessage =
              'Mobile OTP verified successfully.';
          } else {
            this.otpMessage =
              'Mobile OTP verification was not completed.';
          }
        },
        (error: any) => {
          this.isVerifyingMobileOtp = false;
          this.otpMessage = error?.error?.message || error?.message || 'Mobile verification failed.';
        }
      );
  }

  loginWithOtp() {
    if (!this.otpChallengeId || !this.emailOtpVerified || !this.mobileOtpVerified) {
      this.otpMessage = 'Verify both your email and mobile codes before signing in.';
      return;
    }

    this.isLoggingInWithOtp = true;
    this.userService.loginWithOtp(this.otpChallengeId).subscribe({
      next: (response: any) => {
        this.isLoggingInWithOtp = false;
        if (!response?.token) {
          this.otpMessage = 'OTP sign-in did not return a session. Please try again.';
          return;
        }
        localStorage.setItem('token', response.token);
        localStorage.setItem('loggedInUser', JSON.stringify(response.user));
        this.router.navigate(['/profile']);
      },
      error: (error: any) => {
        this.isLoggingInWithOtp = false;
        this.otpMessage = error?.error?.message || 'OTP sign-in failed. Request new codes and try again.';
      }
    });
  }

  /**
   * Google login button.
   */
  private renderGoogleButton(attempt = 0) {
    if (
      !environment.googleClientId ||
      !this.googleButton
    ) {
      return;
    }

    const googleIdentity = (globalThis as any).google;

    if (!googleIdentity?.accounts?.id) {
      if (attempt < 20) {
        setTimeout(
          () => this.renderGoogleButton(attempt + 1),
          250
        );
      }

      return;
    }

    googleIdentity.accounts.id.initialize({
      client_id: environment.googleClientId,
      callback: (response: { credential: string }) =>
        this.completeGoogleLogin(response.credential)
    });

    googleIdentity.accounts.id.renderButton(
      this.googleButton.nativeElement,
      {
        type: 'standard',
        theme: 'outline',
        size: 'large',
        text: 'continue_with',
        shape: 'rectangular',
        width: 320
      }
    );
  }

  /**
   * Complete Google login.
   */
  private completeGoogleLogin(
    credential: string
  ) {
    this.userService
      .googleLogin(credential)
      .subscribe(
        (response: any) => {
          localStorage.setItem(
            'token',
            response.token
          );

          localStorage.setItem(
            'loggedInUser',
            JSON.stringify(response.user)
          );

          this.router.navigate(['/profile']);
        },
        (error: any) => {
          alert(
            error?.error?.message ||
            'Google login failed'
          );
        }
      );
  }

  /**
   * Normal email/password login.
   */
  login() {
    if (!this.email || !this.password) {
      alert('Please fill in both fields.');
      return;
    }

    this.userService
      .login({
        email: this.email,
        password: this.password
      })
      .subscribe(
        (response: any) => {
          if (response?.token) {
            localStorage.setItem(
              'token',
              response.token
            );

            localStorage.setItem(
              'loggedInUser',
              JSON.stringify(response.user || {
                name: this.email,
                email: this.email
              })
            );

            this.router.navigate(['/profile']);
          } else if (response?.message) {
            alert(response.message);
          } else {
            alert('Unauthorized Access');
          }
        },
        (error: any) => {
          alert(
            error?.error?.message ||
            error?.message ||
            'Unauthorized Access'
          );
        }
      );
  }

  /**
   * Register a new account.
   *
   * Both email and mobile OTPs must be verified
   * before the registration API is called.
   */
  register() {
    if (
      !this.name ||
      !this.email ||
      !this.mobile ||
      !this.password ||
      !this.confirmPassword
    ) {
      this.otpMessage = 'Please fill in all required fields.';
      return;
    }

    if (!this.otpChallengeId) {
      this.otpMessage = 'Request and verify both codes before creating your account.';
      return;
    }

    if (!this.emailOtpVerified) {
      this.otpMessage = 'Please verify the code sent to your email.';
      return;
    }

    if (!this.mobileOtpVerified) {
      this.otpMessage = 'Please verify the code sent to your mobile.';
      return;
    }

    if (this.password !== this.confirmPassword) {
      this.otpMessage = 'Passwords do not match.';
      return;
    }

    this.isRegisteringUser = true;

    const registeredAt =
      new Date().toLocaleString();

    this.userService
      .register({
        name: this.name,
        email: this.email.trim(),
        mobile: this.mobile.trim(),
        password: this.password,
        otpChallengeId: this.otpChallengeId,
        registeredAt
      })
      .subscribe(
        (response: any) => {
          this.isRegisteringUser = false;

          if (!response?.token) {
            this.otpMessage = 'Registration did not return a session. Please sign in.';
            return;
          }
          localStorage.setItem('token', response.token);
          localStorage.setItem('loggedInUser', JSON.stringify(response.user || {
            name: this.name,
            email: this.email.trim().toLowerCase(),
            mobile: this.mobile.trim(),
            registeredAt
          }));

          this.router.navigate(['/profile']);
        },
        (error: any) => {
          this.isRegisteringUser = false;
          this.otpMessage = error?.error?.message || error?.message || 'Registration failed.';
        }
      );
  }

  /**
   * Reset OTP-related state when switching screens.
   */
  private clearOtpState() {
    this.emailOtp = '';
    this.mobileOtp = '';
    this.otpMessage = '';
    this.otpChallengeId = '';

    this.emailOtpVerified = false;
    this.mobileOtpVerified = false;

    this.isSendingOtp = false;
    this.isVerifyingEmailOtp = false;
    this.isVerifyingMobileOtp = false;
    this.isLoggingInWithOtp = false;
  }
}
