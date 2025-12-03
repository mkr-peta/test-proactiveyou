import React, {useEffect, useState} from 'react';
import {
  SafeAreaView,
  StyleSheet,
  Text,
  View,
  Button,
  ScrollView,
  ActivityIndicator,
  Platform,
  Alert,
} from 'react-native';
import HealthKitService from './src/HealthKitService';
import {CONFIG} from './src/config';

function App(): React.JSX.Element {
  const [stepCount, setStepCount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [permissionGranted, setPermissionGranted] = useState<boolean>(false);
  const [backgroundEnabled, setBackgroundEnabled] = useState<boolean>(false);
  const [lastUpload, setLastUpload] = useState<string | null>(null);
  const [uploading, setUploading] = useState<boolean>(false);

  useEffect(() => {
    if (Platform.OS === 'ios') {
      initializeApp();
    } else {
      Alert.alert('Platform Not Supported', 'This app only works on iOS');
    }
  }, []);

  const initializeApp = async () => {
    try {
      setLoading(true);

      // Request HealthKit permissions
      const granted = await HealthKitService.requestPermissions();
      setPermissionGranted(granted);

      if (granted) {
        // Get initial step count
        await refreshStepCount();

        // Enable background delivery
        const bgEnabled = await HealthKitService.enableBackgroundDelivery();
        setBackgroundEnabled(bgEnabled);

        // Get last upload time
        const lastUploadTime = await HealthKitService.getLastUploadTime();
        setLastUpload(lastUploadTime);
      }
    } catch (error) {
      console.error('Error initializing app:', error);
      Alert.alert('Error', 'Failed to initialize app');
    } finally {
      setLoading(false);
    }
  };

  const refreshStepCount = async () => {
    try {
      const steps = await HealthKitService.getTodaySteps();
      setStepCount(steps);
    } catch (error) {
      console.error('Error refreshing step count:', error);
    }
  };

  const handleManualUpload = async () => {
    try {
      setUploading(true);
      const success = await HealthKitService.uploadStepData(stepCount);

      if (success) {
        Alert.alert('Success', 'Step data uploaded successfully');
        const lastUploadTime = await HealthKitService.getLastUploadTime();
        setLastUpload(lastUploadTime);
      } else {
        Alert.alert('Error', 'Failed to upload step data. Check your API endpoint.');
      }
    } catch (error) {
      console.error('Error uploading:', error);
      Alert.alert('Error', 'Failed to upload step data');
    } finally {
      setUploading(false);
    }
  };

  const formatUploadInterval = () => {
    const minutes = CONFIG.UPLOAD_INTERVAL / (60 * 1000);
    if (minutes < 60) {
      return `${minutes} minute${minutes !== 1 ? 's' : ''}`;
    } else {
      const hours = minutes / 60;
      return `${hours} hour${hours !== 1 ? 's' : ''}`;
    }
  };

  const formatLastUpload = () => {
    if (!lastUpload) {
      return 'Never';
    }
    const date = new Date(lastUpload);
    return date.toLocaleString();
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Initializing HealthKit...</Text>
      </SafeAreaView>
    );
  }

  if (!permissionGranted) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorTitle}>⚠️ Permission Required</Text>
          <Text style={styles.errorText}>
            This app needs access to your Health data to read step count.
          </Text>
          <Button title="Request Permissions" onPress={initializeApp} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.title}>Step Tracker</Text>
          <Text style={styles.subtitle}>Real-time step monitoring</Text>
        </View>

        {/* Step Count Display */}
        <View style={styles.stepCard}>
          <Text style={styles.stepLabel}>Today's Steps</Text>
          <Text style={styles.stepCount}>{stepCount.toLocaleString()}</Text>
          <Button title="Refresh" onPress={refreshStepCount} />
        </View>

        {/* Status Card */}
        <View style={styles.statusCard}>
          <Text style={styles.statusTitle}>Status</Text>

          <View style={styles.statusRow}>
            <Text style={styles.statusLabel}>Background Sync:</Text>
            <Text
              style={[
                styles.statusValue,
                backgroundEnabled ? styles.statusEnabled : styles.statusDisabled,
              ]}>
              {backgroundEnabled ? '✓ Enabled' : '✗ Disabled'}
            </Text>
          </View>

          <View style={styles.statusRow}>
            <Text style={styles.statusLabel}>Upload Interval:</Text>
            <Text style={styles.statusValue}>{formatUploadInterval()}</Text>
          </View>

          <View style={styles.statusRow}>
            <Text style={styles.statusLabel}>Last Upload:</Text>
            <Text style={styles.statusValue}>{formatLastUpload()}</Text>
          </View>

          <View style={styles.statusRow}>
            <Text style={styles.statusLabel}>API Endpoint:</Text>
            <Text style={styles.statusValueSmall} numberOfLines={2}>
              {CONFIG.API_ENDPOINT}
            </Text>
          </View>
        </View>

        {/* Info Card */}
        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>ℹ️ How it works</Text>
          <Text style={styles.infoText}>
            • iOS monitors your step count via HealthKit{'\n'}
            • App wakes up automatically when new data is available (~hourly){'\n'}
            • Data is uploaded to cloud every {formatUploadInterval()}{'\n'}
            • Works even when app is closed or device is locked
          </Text>
        </View>

        {/* Manual Upload Button */}
        <View style={styles.uploadButton}>
          <Button
            title={uploading ? 'Uploading...' : 'Upload Now (Manual)'}
            onPress={handleManualUpload}
            disabled={uploading}
          />
        </View>

        {/* Warning */}
        <View style={styles.warningCard}>
          <Text style={styles.warningText}>
            ⚠️ Note: iOS enforces minimum 1-hour intervals for step count background
            updates, regardless of configured upload interval.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  scrollContent: {
    padding: 20,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
    color: '#666',
  },
  header: {
    alignItems: 'center',
    marginBottom: 30,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#000',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginTop: 5,
  },
  stepCard: {
    backgroundColor: '#FFF',
    borderRadius: 15,
    padding: 30,
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  stepLabel: {
    fontSize: 18,
    color: '#666',
    marginBottom: 10,
  },
  stepCount: {
    fontSize: 64,
    fontWeight: 'bold',
    color: '#007AFF',
    marginBottom: 20,
  },
  statusCard: {
    backgroundColor: '#FFF',
    borderRadius: 15,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statusTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#000',
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
    alignItems: 'flex-start',
  },
  statusLabel: {
    fontSize: 16,
    color: '#666',
    flex: 1,
  },
  statusValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    flex: 1,
    textAlign: 'right',
  },
  statusValueSmall: {
    fontSize: 12,
    color: '#666',
    flex: 1,
    textAlign: 'right',
  },
  statusEnabled: {
    color: '#34C759',
  },
  statusDisabled: {
    color: '#FF3B30',
  },
  infoCard: {
    backgroundColor: '#E3F2FD',
    borderRadius: 15,
    padding: 20,
    marginBottom: 20,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#000',
  },
  infoText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 22,
  },
  uploadButton: {
    marginBottom: 20,
  },
  warningCard: {
    backgroundColor: '#FFF3CD',
    borderRadius: 15,
    padding: 15,
    marginBottom: 20,
  },
  warningText: {
    fontSize: 13,
    color: '#856404',
    lineHeight: 20,
  },
});

export default App;
