import HealthKit, {
  HKQuantityTypeIdentifier,
  HKUpdateFrequency,
} from '@kingstinct/react-native-healthkit';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {CONFIG} from './config';

const LAST_UPLOAD_KEY = 'lastUploadTimestamp';

export class HealthKitService {
  private static instance: HealthKitService;
  private backgroundObserverStarted = false;

  private constructor() {}

  static getInstance(): HealthKitService {
    if (!HealthKitService.instance) {
      HealthKitService.instance = new HealthKitService();
    }
    return HealthKitService.instance;
  }

  /**
   * Request HealthKit permissions
   */
  async requestPermissions(): Promise<boolean> {
    try {
      const isAvailable = await HealthKit.isHealthDataAvailable();
      if (!isAvailable) {
        console.log('HealthKit is not available on this device');
        return false;
      }

      // Request read permission for step count
      await HealthKit.requestAuthorization(
        [HKQuantityTypeIdentifier.stepCount], // read permissions
        [], // write permissions (none needed)
      );

      console.log('HealthKit permissions granted');
      return true;
    } catch (error) {
      console.error('Error requesting HealthKit permissions:', error);
      return false;
    }
  }

  /**
   * Get today's step count
   */
  async getTodaySteps(): Promise<number> {
    try {
      const now = new Date();
      const startOfDay = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate(),
        0,
        0,
        0,
      );

      const result = await HealthKit.queryQuantitySamples(
        HKQuantityTypeIdentifier.stepCount,
        {
          from: startOfDay,
          to: now,
        },
      );

      // Sum all step samples for today
      const totalSteps = result.reduce(
        (sum, sample) => sum + sample.quantity,
        0,
      );

      return Math.round(totalSteps);
    } catch (error) {
      console.error('Error fetching step count:', error);
      return 0;
    }
  }

  /**
   * Upload step data to cloud
   */
  async uploadStepData(steps: number): Promise<boolean> {
    try {
      const data = {
        steps,
        timestamp: new Date().toISOString(),
        deviceType: 'iOS',
      };

      const response = await fetch(CONFIG.API_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
        timeout: 10000, // 10 second timeout
      } as any);

      if (response.ok) {
        await AsyncStorage.setItem(
          LAST_UPLOAD_KEY,
          new Date().toISOString(),
        );
        console.log('Step data uploaded successfully:', steps);
        return true;
      } else {
        console.error('Failed to upload step data:', response.status);
        return false;
      }
    } catch (error) {
      console.error('Error uploading step data:', error);
      return false;
    }
  }

  /**
   * Check if enough time has passed since last upload
   */
  async shouldUpload(): Promise<boolean> {
    try {
      const lastUpload = await AsyncStorage.getItem(LAST_UPLOAD_KEY);
      if (!lastUpload) {
        return true; // First upload
      }

      const lastUploadTime = new Date(lastUpload).getTime();
      const now = Date.now();
      const timeSinceLastUpload = now - lastUploadTime;

      return timeSinceLastUpload >= CONFIG.UPLOAD_INTERVAL;
    } catch (error) {
      console.error('Error checking upload timing:', error);
      return true; // Upload if we can't determine
    }
  }

  /**
   * Enable background delivery for step count
   * This allows iOS to wake the app when new step data is available
   */
  async enableBackgroundDelivery(): Promise<boolean> {
    try {
      if (this.backgroundObserverStarted) {
        console.log('Background observer already started');
        return true;
      }

      // Enable background delivery with hourly frequency
      // Note: iOS enforces minimum 1 hour frequency for step count
      await HealthKit.enableBackgroundDelivery(
        HKQuantityTypeIdentifier.stepCount,
        HKUpdateFrequency.hourly,
      );

      // Subscribe to step count updates
      const unsubscribe = await HealthKit.subscribeToChanges(
        HKQuantityTypeIdentifier.stepCount,
        async () => {
          console.log('Step count changed - Background delivery triggered');
          await this.handleBackgroundUpdate();
        },
      );

      this.backgroundObserverStarted = true;
      console.log('Background delivery enabled for step count');
      return true;
    } catch (error) {
      console.error('Error enabling background delivery:', error);
      return false;
    }
  }

  /**
   * Handle background update triggered by HealthKit
   */
  private async handleBackgroundUpdate(): Promise<void> {
    try {
      console.log('Handling background update...');

      // Check if we should upload based on configured interval
      const shouldUpload = await this.shouldUpload();
      if (!shouldUpload) {
        console.log('Skipping upload - not enough time passed');
        return;
      }

      // Get latest step count
      const steps = await this.getTodaySteps();
      console.log('Current step count:', steps);

      // Upload to cloud
      await this.uploadStepData(steps);
    } catch (error) {
      console.error('Error in background update handler:', error);
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
      this.backgroundObserverStarted = false;
      console.log('Background delivery disabled');
    } catch (error) {
      console.error('Error disabling background delivery:', error);
    }
  }

  /**
   * Get last upload timestamp
   */
  async getLastUploadTime(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem(LAST_UPLOAD_KEY);
    } catch (error) {
      console.error('Error getting last upload time:', error);
      return null;
    }
  }
}

export default HealthKitService.getInstance();
