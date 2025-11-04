import { BlurView } from 'expo-blur';
import { StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function BlurTabBarBackground() {
  return (
    <BlurView
      // System chrome material automatically adapts to the system's theme
      // and matches the native tab bar appearance on iOS.
      tint="systemChromeMaterial"
      intensity={100}
      style={StyleSheet.absoluteFill}
    />
  );
}

export function useBottomTabOverflow() {
  try {
    // Como estamos usando Drawer Navigator ao invés de Bottom Tab Navigator,
    // vamos usar apenas o safe area bottom como fallback seguro
    const insets = useSafeAreaInsets();
    return insets.bottom || 0;
  } catch (error) {
    // Fallback caso o SafeAreaProvider não esteja disponível
    console.warn('SafeAreaProvider not found, using default bottom padding');
    return 0;
  }
}
