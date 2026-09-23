import { Alert, Platform, ToastAndroid } from 'react-native'

export const toast = {
  success: (message: string) => {
    if (Platform.OS === 'android') {
      ToastAndroid.show(message, ToastAndroid.SHORT)
    } else {
      Alert.alert('Success', message)
    }
  },
  error: (message: string) => {
    if (Platform.OS === 'android') {
      ToastAndroid.show(message, ToastAndroid.SHORT)
    } else {
      Alert.alert('Error', message)
    }
  },
  info: (message: string) => {
    if (Platform.OS === 'android') {
      ToastAndroid.show(message, ToastAndroid.LONG)
    } else {
      Alert.alert('Info', message)
    }
  },
}