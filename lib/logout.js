// Simple logout utility to clear all app data
import AsyncStorage from '@react-native-async-storage/async-storage';

export const performCompleteLogout = async () => {
  try {
    console.log('🚪 Starting complete logout process...');
    
    // Clear all AsyncStorage data
    await AsyncStorage.clear();
    console.log('✅ Cleared all local storage data');
    
    console.log('🎉 Complete logout successful - app is now in clean state');
    return { success: true };
    
  } catch (error) {
    console.error('❌ Error during logout:', error);
    return { success: false, error };
  }
};

export default performCompleteLogout;