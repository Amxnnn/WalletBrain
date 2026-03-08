import * as Notifications from 'expo-notifications';

export async function requestNotificationPermission(): Promise<boolean> {
  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}

export async function scheduleWeeklyReport(
  walletScore: number,
  grade: string
): Promise<void> {
  // Cancel any existing scheduled notifications
  await Notifications.cancelAllScheduledNotificationsAsync();

  // Schedule weekly Monday 9am notification
  await Notifications.scheduleNotificationAsync({
    content: {
      title: '🧠 Your Weekly Wallet Report',
      body: `Your WalletBrain Score: ${walletScore}/100 (Grade ${grade}). Tap to see what changed this week.`,
      sound: true,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
      weekday: 2, // Monday (1=Sunday, 2=Monday)
      hour: 9,
      minute: 0,
    },
  });
}
