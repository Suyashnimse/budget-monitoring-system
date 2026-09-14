import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-profile',
  imports: [CommonModule],
  templateUrl: './profile.component.html',
  styleUrl: './profile.css',
})
export class Profile implements OnInit {
  user: any = null;
  photoPreview: string | null = null;

  constructor(private router: Router) {}

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

  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('loggedInUser');
    this.router.navigate(['/login']);
  }
}
