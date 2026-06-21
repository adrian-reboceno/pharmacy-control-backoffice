import { Component, inject, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { AuthService } from './core/auth/auth.service';
import { InactivityService } from './core/auth/inactivity.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  template: `<router-outlet />`
})
export class AppComponent implements OnInit {
  private auth       = inject(AuthService);
  private inactivity = inject(InactivityService);

  ngOnInit() {
    this.auth.loadCachedUser();
    if (this.auth.isLoggedIn()) {
      this.inactivity.start();
    }
  }
}
