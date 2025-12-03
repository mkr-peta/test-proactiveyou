import React, {useState, useEffect} from 'react';
import {
  SafeAreaView,
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  ScrollView,
} from 'react-native';
import HealthKitService from './src/HealthKitService';
import {CONFIG} from './src/config';

function App(): React.JSX.Element {
  const [stepCount, setStepCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [lastUpload, setLastUpload] = useState<string>('Never');

  useEffect(() => {
    initializeApp();
  }, []);

  const initializeApp = async () => {
    try {
      // Request HealthKit permissions
      const granted = await HealthKitService.requestPermissions();
      
      if (!granted) {
        Alert.alert(
          'Permission Required',
          'Please enable HealthKit access in Settings to use this app.',
        );
        setIsLoading(false);
        return;
      }

      // Enable background delivery
      await HealthKitService.enableBackgroundDelivery();

      // Get initial step count
      await refreshStepCount();

      // Set up periodic uploads
      const uploadInterval = setInterval(async () => {
        await uploadSteps();
      }, CONFIG.UPLOAD_INTERVAL);

      setIsLoading(false);

      // Cleanup on unmount
      return () => {
        clearInterval(uploadInterval);
      };
    } catch (error) {
      console.error('Error initializing app:', error);
      setIsLoading(false);
    }
  };

  const refreshStepCount = async () => {
    try {
      const steps = await HealthKitService.getTodayStepCount();
      setStepCount(steps);
    } catch (error) {
      console.error('Error refreshing step count:', error);
    }
  };

  const uploadSteps = async () => {
    setIsUploading(true);
    try {
      const success = await HealthKitService.uploadStepCount();
      if (success) {
        const now = new Date();
        setLastUpload(now.toLocaleTimeString());
        // Refresh step count after upload
        await refreshStepCount();
      } else {
        Alert.alert('Upload Failed', 'Could not upload step data to server.');
      }
    } catch (error) {
      console.error('Error uploading steps:', error);
    } finally {
      setIsUploading(false);
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Initializing HealthKit...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.title}>Step Tracker</Text>
          <Text style={styles.subtitle}>HealthKit + Cloud Sync</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.label}>Today's Steps</Text>
          <Text style={styles.stepCount}>
            {stepCount.toLocaleString()}
          </Text>
          <Text style={styles.stepsLabel}>steps</Text>
        </View>

        <View style={styles.infoCard}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Last Upload:</Text>
            <Text style={styles.infoValue}>{lastUpload}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Upload Interval:</Text>
            <Text style={styles.infoValue}>
              {CONFIG.UPLOAD_INTERVAL / 60000} min
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Background Delivery:</Text>
            <Text style={[styles.infoValue, styles.successText]}>
              ✓ Enabled
            </Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.button}
          onPress={refreshStepCount}
          disabled={isUploading}>
          <Text style={styles.buttonText}>🔄 Refresh Steps</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.primaryButton]}
          onPress={uploadSteps}
          disabled={isUploading}>
          {isUploading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.buttonTextWhite}>☁️ Upload Now</Text>
          )}
        </TouchableOpacity>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            💡 This app uploads data even when closed!
          </Text>
          <Text style={styles.footerSubtext}>
            Background delivery triggers ~hourly
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F7',
  },
  scrollContent: {
    padding: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  header: {
    alignItems: 'center',
    marginBottom: 30,
    marginTop: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1D1D1F',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#86868B',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 40,
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  label: {
    fontSize: 16,
    color: '#86868B',
    marginBottom: 12,
  },
  stepCount: {
    fontSize: 64,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  stepsLabel: {
    fontSize: 18,
    color: '#86868B',
    marginTop: 8,
  },
  infoCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F7',
  },
  infoLabel: {
    fontSize: 15,
    color: '#1D1D1F',
  },
  infoValue: {
    fontSize: 15,
    color: '#86868B',
    fontWeight: '600',
  },
  successText: {
    color: '#34C759',
  },
  button: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  primaryButton: {
    backgroundColor: '#007AFF',
    borderWidth: 0,
  },
  buttonText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#007AFF',
  },
  buttonTextWhite: {
    fontSize: 17,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  footer: {
    marginTop: 30,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 14,
    color: '#86868B',
    textAlign: 'center',
  },
  footerSubtext: {
    fontSize: 12,
    color: '#C7C7CC',
    textAlign: 'center',
    marginTop: 4,
  },
});

export default App;
