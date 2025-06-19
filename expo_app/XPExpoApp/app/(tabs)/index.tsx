import { StyleSheet, TouchableOpacity, View } from 'react-native';

import { ThemedText } from '@/components/ThemedText';
import { Fonts } from '@/constants/Fonts';

export default function HomeScreen() {
  const handlePushPermissions = () => {
    console.log('Push Permission button has been clicked');
  };

  const handleHitEvent = () => {
    console.log('Hit Event button has been clicked');
  };

  return (
    <View style={styles.container}>
      <ThemedText style={styles.title}>Expo Xtremepush React Native</ThemedText>

      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.button} onPress={handlePushPermissions}>
          <View style={styles.buttonGradient}>
            <ThemedText style={styles.buttonText}>Push Permissions</ThemedText>
            <ThemedText style={styles.buttonSubtext}>Request notification access</ThemedText>
          </View>
        </TouchableOpacity>

        <TouchableOpacity style={styles.button} onPress={handleHitEvent}>
          <View style={styles.buttonGradient}>
            <ThemedText style={styles.buttonText}>Hit Event</ThemedText>
            <ThemedText style={styles.buttonSubtext}>Track user interaction</ThemedText>
          </View>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 24,
    fontFamily: Fonts.ubuntu.bold,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 60,
  },
  buttonContainer: {
    width: '100%',
    maxWidth: 320,
    gap: 24,
  },
  button: {
    backgroundColor: 'transparent',
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#6366f1',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  buttonGradient: {
    backgroundColor: '#1e1e1e',
    borderWidth: 1,
    borderColor: '#333333',
    paddingVertical: 20,
    paddingHorizontal: 24,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 80,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontFamily: Fonts.ubuntu.bold,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  buttonSubtext: {
    color: '#9ca3af',
    fontSize: 14,
    fontFamily: Fonts.ubuntu.regular,
    textAlign: 'center',
  },
});
