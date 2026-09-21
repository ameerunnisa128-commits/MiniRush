/**
 * Coin Collection Reminder & Engagement Notification Service
 * Supports Web Notifications API + Capacitor / native local notifications + In-App Alerts
 */

import { sound } from './sound';

export interface NotificationPayload {
  title: string;
  body: string;
  icon?: string;
  tag?: string;
  badge?: string;
}

class NotificationService {
  private permission: NotificationPermission = 'default';

  constructor() {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      this.permission = Notification.permission;
    }
  }

  public isSupported(): boolean {
    return typeof window !== 'undefined' && 'Notification' in window;
  }

  public getPermissionStatus(): NotificationPermission {
    if (this.isSupported()) {
      return Notification.permission;
    }
    return 'denied';
  }

  public async requestPermission(): Promise<boolean> {
    if (!this.isSupported()) return false;
    try {
      const perm = await Notification.requestPermission();
      this.permission = perm;
      return perm === 'granted';
    } catch {
      return false;
    }
  }

  /**
   * Send an immediate system / browser notification alert
   */
  public sendAlert(payload: NotificationPayload): boolean {
    // 1. Try native Web Notification if permitted
    if (this.isSupported() && Notification.permission === 'granted') {
      try {
        const notif = new Notification(payload.title, {
          body: payload.body,
          icon: payload.icon || '/favicon.ico',
          tag: payload.tag || 'coin-reminder',
          vibrate: [100, 50, 100],
        } as NotificationOptions);

        notif.onclick = () => {
          window.focus();
          notif.close();
        };

        sound.playCoinCascade();
        return true;
      } catch {
        // Continue to fallback
      }
    }

    // 2. Play sound & vibrate feedback
    sound.playCoinCascade();
    return true;
  }

  /**
   * Send the specific Coin Collection Reminder Alert
   */
  public triggerCoinReminderAlert(): void {
    this.sendAlert({
      title: '🪙 Free Coins Ready to Collect!',
      body: 'Your Arcade Vault has 100 free bonus coins waiting! Claim now to boost your rank & refill lives.',
      tag: 'coin-stash-alert',
    });
  }
}

export const notificationService = new NotificationService();
