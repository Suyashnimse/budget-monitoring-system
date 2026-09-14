import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private readonly apiUrl = environment.apiBaseUrl;

  constructor(private http: HttpClient) {}

  login(credentials: { email: string; password: string }) {
    return this.http.post(`${this.apiUrl}/login`, credentials);
  }

  googleLogin(credential: string) {
    return this.http.post(`${this.apiUrl}/auth/google`, { credential });
  }

  register(user: any) {
    return this.http.post(`${this.apiUrl}/register`, user);
  }

  getUsers() {
    return this.http.get(`${this.apiUrl}/api/users`);
  }

  createUser(user: any) {
    return this.http.post(`${this.apiUrl}/api/users`, user);
  }

  requestRegistrationOtp(email: string, mobile: string) {
    return this.http.post(`${this.apiUrl}/api/otp/request`, { email, mobile });
  }

  verifyRegistrationOtp(challengeId: string, channel: 'email' | 'mobile', code: string) {
    return this.http.post(`${this.apiUrl}/api/otp/verify`, { challengeId, channel, code });
  }
}
