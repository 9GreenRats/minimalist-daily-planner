chrome.runtime.onInstalled.addListener(() => {
  console.log('Minimalist Daily Planner installed');
});

// Only create daily reminder alarm
chrome.alarms.create('dailyReminder', {
  periodInMinutes: 1440 // 24 hours
});

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'dailyReminder') {
    // Only show daily reminder notification
    chrome.notifications.create({
      type: 'basic',
      iconUrl: 'icon128.png',
      title: 'Daily Planner Reminder',
      message: 'Don\'t forget to check your tasks for today!'
    });
  }
});

