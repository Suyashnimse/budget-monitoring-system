import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { UserService } from '../services/user.service';

@Component({
  selector: 'app-profile',
  imports: [CommonModule, FormsModule],
  templateUrl: './profile.component.html',
  styleUrl: './profile.css',
})
export class Profile implements OnInit {
  user: any = null;
  photoPreview: string | null = null;
  editing = false;
  message = '';
  roles = ['Admin', 'Finance Officer', 'Department Head', 'user'];

  constructor(private router: Router, private userService: UserService) {}

  onPhotoSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const reader = new FileReader();
      reader.onload = () => {
        const photo = reader.result as string;
        this.user = { ...(this.user || {}), photo };
        this.photoPreview = photo;
        localStorage.setItem('loggedInUser', JSON.stringify(this.user));
      };
      reader.readAsDataURL(input.files[0]);
    }
  }

  ngOnInit() {
    this.loadUser();
  }

  private loadUser() {
    const savedUser = localStorage.getItem('loggedInUser');
    this.user = savedUser ? JSON.parse(savedUser) : null;
    this.photoPreview = this.user?.photo || null;
  }

  goToDashboard() {
    this.router.navigate(['/dashboard']);
  }

  saveProfile() {
    this.userService.updateProfile({
      name: this.user.name,
      mobile: this.user.mobile,
      departmentId: this.user.departmentId,
      role: this.user.role
    }).subscribe({
      next: (user: any) => {
        this.user = { ...this.user, ...user };
        localStorage.setItem('loggedInUser', JSON.stringify(this.user));
        this.editing = false;
        this.message = 'Profile updated successfully.';
      },
      error: (error: any) => this.message = error.error?.message || 'Unable to update profile.'
    });
  }

  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('loggedInUser');
    this.router.navigate(['/login']);
  }
}
