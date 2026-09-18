/**
 * MiniRush Privacy-Safe In-App Analytics
 * Tracks app session & gameplay metrics without collecting sensitive PII
 */

export interface AnalyticsEvent {
  event: string;
  properties?: Record<string, unknown>;
  timestamp: number;
}

class AnalyticsService {
  private events: AnalyticsEvent[] = [];

  public track(event: string, properties?: Record<string, unknown>) {
    const item: AnalyticsEvent = {
      event,
      properties,
      timestamp: Date.now(),
    };
    this.events.push(item);
    if (this.events.length > 200) {
      this.events.shift();
    }
  }

  public getRecentEvents(): AnalyticsEvent[] {
    return [...this.events].reverse();
  }
}

export const analytics = new AnalyticsService();
