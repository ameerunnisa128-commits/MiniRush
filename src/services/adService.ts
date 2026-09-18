/**
 * MiniRush AdService Abstraction
 * Supports Test/Sandbox simulation mode & production integration hooks
 * Never auto-clicks; provides clean user opt-in rewarded flows
 */

export type RewardedAdReason = 
  | 'extra_lives' 
  | 'double_daily_box' 
  | 'bonus_coins' 
  | 'continue_game';

export interface ShowRewardedAdOptions {
  reason: RewardedAdReason;
  onReward: (rewardType: RewardedAdReason) => void;
  onDismiss?: () => void;
}

export type AdEventListener = (event: 'ad_started' | 'ad_completed' | 'ad_dismissed', details?: unknown) => void;

class AdService {
  private isDevelopment: boolean = true;
  private listeners: AdEventListener[] = [];
  public currentAdRequest: ShowRewardedAdOptions | null = null;
  public isAdActive: boolean = false;

  public addListener(cb: AdEventListener) {
    this.listeners.push(cb);
  }

  public removeListener(cb: AdEventListener) {
    this.listeners = this.listeners.filter(l => l !== cb);
  }

  private notify(event: 'ad_started' | 'ad_completed' | 'ad_dismissed', details?: unknown) {
    this.listeners.forEach(l => l(event, details));
  }

  public showRewardedAd(options: ShowRewardedAdOptions): Promise<boolean> {
    return new Promise((resolve) => {
      this.currentAdRequest = options;
      this.isAdActive = true;
      this.notify('ad_started', { reason: options.reason });

      // The UI modal will mount and show the simulated rewarded arcade sponsorship card (5 seconds timer)
      // or in production connect to Google AdMob / IMA SDK
      const checkCompletion = (success: boolean) => {
        this.isAdActive = false;
        this.currentAdRequest = null;
        if (success) {
          this.notify('ad_completed', { reason: options.reason });
          options.onReward(options.reason);
          resolve(true);
        } else {
          this.notify('ad_dismissed', { reason: options.reason });
          options.onDismiss?.();
          resolve(false);
        }
      };

      // expose handler for UI modal to trigger
      (window as unknown as { __adCompleteHandler?: (success: boolean) => void }).__adCompleteHandler = checkCompletion;
    });
  }

  public completeCurrentAd(success: boolean) {
    const handler = (window as unknown as { __adCompleteHandler?: (success: boolean) => void }).__adCompleteHandler;
    if (handler) {
      handler(success);
    }
  }
}

export const adService = new AdService();
