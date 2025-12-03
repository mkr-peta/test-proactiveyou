import HealthKit, {
  HKQuantityTypeIdentifier,
  HKUpdateFrequency,
} from '@kingstinct/react-native-healthkit';
import {CONFIG} from './config';

export interface StepData {
  steps: number;
  timestamp: string;
  deviceType: string;
}

class HealthKitService {
  private isInitialized = false;

  /**
   * Request HealthKit permissions
   */
  async requestPermissions(): Promise<boolean> {
    try {
      const isAvailable = await HealthKit.isHealthDataAvailable();
      if (!isAvailable) {
        console.log('HealthKit not available on this device');
        return false;
      }

      await HealthKit.requestAuthorization(
        [HKQuantityTypeIdentifier.stepCount], // read permissions
        [], // write permissions (we don't need to write)
      );

      this.isInitialized = true;
      console.log('HealthKit permissions granted');
      return true;
    } catch (error) {
      console.error('Error requesting HealthKit permissions:', error);
      return false;
    }
  }

  /**
   * Enable background delivery for step count
   * This allows the app to receive updates even when closed
   */
  async enableBackgroundDelivery(): Promise<void> {
    try {
      await HealthKit.enableBackgroundDelivery(
        HKQuantityTypeIdentifier.stepCount,
        HKUpdateFrequency.hourly, // iOS enforces ~1 hour minimum
      );

      // Subscribe to step count changes
      HealthKit.subscribeToChanges(
        HKQuantityTypeIdentifier.stepCount,
        async () => {
          console.log('Background step count update received');
          await this.uploadStepCount();
        },
      );

      console.log('Background delivery enabled');
    } catch (error) {
      console.error('Error enabling background delivery:', error);
    }
  }

  /**
   * Get today's step count from HealthKit
   */
  async getTodayStepCount(): Promise<number> {
    try {
      if (!this.isInitialized) {
        await this.requestPermissions();
      }

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const now = new Date();

      const result = await HealthKit.querySamples(
        HKQuantityTypeIdentifier.stepCount,
        {
          from: today.toISOString(),
          to: now.toISOString(),
        },
      );

      // Sum all step samples for today
      const totalSteps = result.reduce((sum, sample) => {
        return sum + (sample.quantity || 0);
      }, 0);

      return Math.round(totalSteps);
    } catch (error) {
      console.error('Error getting step count:', error);
      return 0;
    }
  }

  /**
   * Upload step count to backend API
   */
  async uploadStepCount(): Promise<boolean> {
    try {
      const steps = await this.getTodayStepCount();
      
      const data: StepData = {
        steps,
        timestamp: new Date().toISOString(),
        deviceType: 'iOS',
      };

      if (CONFIG.DEBUG) {
        console.log('Uploading step data:', data);
      }

      const response = await fetch(CONFIG.API_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (CONFIG.DEBUG) {
        console.log('Upload successful:', result);
      }

      return true;
    } catch (error) {
      console.error('Error uploading step count:', error);
      return false;
    }
  }

  /**
   * Disable background delivery
   */
  async disableBackgroundDelivery(): Promise<void> {
    try {
      await HealthKit.disableBackgroundDelivery(
        HKQuantityTypeIdentifier.stepCount,
      );
      console.log('Background delivery disabled');
    } catch (error) {
      console.error('Error disabling background delivery:', error);
    }
  }
}

export default new HealthKitService();
