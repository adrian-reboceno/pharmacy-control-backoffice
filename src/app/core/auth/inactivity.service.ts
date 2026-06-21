import { Injectable, inject, NgZone, OnDestroy } from '@angular/core';
import { AuthService } from './auth.service';

@Injectable({ providedIn: 'root' })
export class InactivityService implements OnDestroy {
  private auth      = inject(AuthService);
  private ngZone    = inject(NgZone);

  private readonly TIMEOUT_MS = 15 * 60 * 1000; // 15 minutos
  private timer: ReturnType<typeof setTimeout> | null = null;
  private listeners: Array<[string, EventListener]> = [];

  private readonly EVENTS = [
    'mousemove', 'mousedown', 'keydown',
    'touchstart', 'click', 'scroll', 'wheel'
  ];

  /** Inicia el monitoreo de inactividad. Llamar tras login exitoso. */
  start(): void {
    this.stop();

    const handler = () => this.reset();

    this.ngZone.runOutsideAngular(() => {
      this.EVENTS.forEach(event => {
        document.addEventListener(event, handler, { passive: true });
        this.listeners.push([event, handler]);
      });
    });

    this.schedule();
  }

  /** Detiene el monitoreo. Llamar en logout. */
  stop(): void {
    this.clearTimer();
    this.listeners.forEach(([event, handler]) =>
      document.removeEventListener(event, handler)
    );
    this.listeners = [];
  }

  private reset(): void {
    this.clearTimer();
    this.schedule();
  }

  private schedule(): void {
    this.ngZone.runOutsideAngular(() => {
      this.timer = setTimeout(() => {
        this.ngZone.run(() => {
          this.stop();
          this.auth.logoutByInactivity();
        });
      }, this.TIMEOUT_MS);
    });
  }

  private clearTimer(): void {
    if (this.timer !== null) {
      clearTimeout(this.timer);
      this.timer = null;
    }
  }

  ngOnDestroy(): void { this.stop(); }
}
