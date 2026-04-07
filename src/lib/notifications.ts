export const requestNotificationPermission = async () => {
  if ('Notification' in window) {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }
  return false;
};

export const sendNotification = (title: string, body: string) => {
  if ('Notification' in window && Notification.permission === 'granted') {
    new Notification(title, { body });
  }
};

export const checkReminders = (now: Date) => {
  const h = now.getHours();
  const m = now.getMinutes();
  
  // 9:00 AM - Ish boshlandi
  if (h === 9 && m === 0) {
    sendNotification('AloqaPro', 'Ish vaqti boshlandi! Boshlash tugmasini bosing.');
    return 'ish_boshlandi';
  }
  
  // 11:30 AM - Abed yaqin
  if (h === 11 && m === 30) {
    sendNotification('AloqaPro', 'Tushlik vaqti yaqinlashmoqda (12:00).');
    return 'abed_yaqin';
  }
  
  // 17:30 PM - Ish tugayabdi
  if (h === 17 && m === 30) {
    sendNotification('AloqaPro', 'Ish vaqti yakunlanmoqda. Ishtirokingizni yakunlashni unutmang.');
    return 'ish_yakunlanmoqda';
  }
  
  return null;
};
