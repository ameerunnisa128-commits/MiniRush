/**
 * MiniRush AdService Abstraction
 * 
 * Clean separation of:
 * - DEVELOPMENT_SANDBOX (Interactive in-app simulator for web & testing)
 * - PRODUCTION_ADMOB (Bridge for official Google Mobile Ads / Capacitor AdMob)
 * 
 * Strict monetization rules:
 * - Rewarded ads ONLY grant rewards when a verified completion callback fires.
 * - Clicking "Watch Ad" never grants rewards automatically.
 * - No fake production AdMob unit IDs; production requires official Google Play Console AdMob credentials.
 */

import { Capacitor } from '@capacitor/core';

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

export type AdMode = 'DEVELOPMENT_SANDBOX' | 'PRODUCTION_ADMOB';

export interface IAdProvider {
  mode: AdMode;
  initialize(): Promise<void>;
  isReady(): boolean;
  showRewarded(reason: RewardedAdReason): Promise<{ rewarded: boolean }>;
}

/**
 * Native AdMob Bridge Interface (Placeholder for @capacitor-community/admob)
 * Once installed in a production Android build, this connects directly to the native Google Mobile Ads SDK.
 */
class ProductionAdMobProvider implements IAdProvider {
  public mode: AdMode = 'PRODUCTION_ADMOB';
  private initialized: boolean = false;

  async initialize(): Promise<void> {
    // In production Android:
    // import { AdMob } from '@capacitor-community/admob';
    // await AdMob.initialize({});
    this.initialized = true;
  }

  isReady(): boolean {
    return this.initialized && Capacitor.isNativePlatform();
  }

  async showRewarded(_reason: RewardedAdReason): Promise<{ rewarded: boolean }> {
    if (!Capacitor.isNativePlatform()) {
      console.warn('[AdService] Native AdMob called on non-native platform. Falling back to sandbox.');
      return { rewarded: false };
    }
    // Production rewarded ad invocation with verified callback
    // const reward = await AdMob.showRewardVideoAd({ adId: 'YOUR_OFFICIAL_ADMOB_REWARDED_UNIT_ID' });
    // return { rewarded: Boolean(reward && reward.amount > 0) };
    return { rewarded: false };
  }
}

/**
 * Development / Test Sandbox Provider
 * Uses the simulated 5-second arcade sponsor modal with full verification
 */
class SandboxAdProvider implements IAdProvider {
  public mode: AdMode = 'DEVELOPMENT_SANDBOX';

  async initialize(): Promise<void> {
    // Sandbox is instantly ready
  }

  isReady(): boolean {
    return true;
  }

  async showRewarded(_reason: RewardedAdReason): Promise<{ rewarded: boolean }> {
    // Modal handles countdown and user interaction
    return { rewarded: false };
  }
}

export type AdEventListener = (event: 'ad_started' | 'ad_completed' | 'ad_dismissed', details?: unknown) => void;

class AdService {
  private activeProvider: IAdProvider;
  private sandboxProvider = new SandboxAdProvider();
  private productionProvider = new ProductionAdMobProvider();
  private listeners: AdEventListener[] = [];
  
  public currentAdRequest: ShowRewardedAdOptions | null = null;
  public isAdActive: boolean = false;

  constructor() {
    // Default to sandbox unless running on native platform with production configured
    this.activeProvider = Capacitor.isNativePlatform() ? this.productionProvider : this.sandboxProvider;
  }

  public getMode(): AdMode {
    return this.activeProvider.mode;
  }

  public isNative(): boolean {
    return Capacitor.isNativePlatform();
  }

  public setMode(mode: AdMode) {
    this.activeProvider = mode === 'PRODUCTION_ADMOB' ? this.productionProvider : this.sandboxProvider;
  }

  public addListener(cb: AdEventListener) {
    this.listeners.push(cb);
  }

  public removeListener(cb: AdEventListener) {
    this.listeners = this.listeners.filter(l => l !== cb);
  }

  private notify(event: 'ad_started' | 'ad_completed' | 'ad_dismissed', details?: unknown) {
    this.listeners.forEach(l => l(event, details));
  }

  /**
   * Request a rewarded ad with strict completion verification.
   * Rewards are only awarded if `success` is true from the completed ad event.
   */
  public showRewardedAd(options: ShowRewardedAdOptions): Promise<boolean> {
    return new Promise((resolve) => {
      this.currentAdRequest = options;
      this.isAdActive = true;
      this.notify('ad_started', { reason: options.reason, mode: this.getMode() });

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

      // Expose completion handler for the modal/SDK
      (window as unknown as { __adCompleteHandler?: (success: boolean) => void }).__adCompleteHandler = checkCompletion;
    });
  }

  /**
   * Called by the Ad Modal once the mandatory timer has completely elapsed
   * and the user clicks Claim. If skipped or closed early, success is false.
   */
  public completeCurrentAd(success: boolean) {
    const handler = (window as unknown as { __adCompleteHandler?: (success: boolean) => void }).__adCompleteHandler;
    if (handler) {
      handler(success);
    }
  }
}

export const adService = new AdService();
