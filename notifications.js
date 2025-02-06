import { pomodoroState } from './pomodoro.js'

export function playNotificationSound() {
    try {
        const notification = new Audio(chrome.runtime.getURL('notification.mp3'))
        notification.play().catch(error => {
            console.log('Audio playback failed:', error)
            // Fallback to system beep
            new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10...').play()
        })
    } catch (error) {
        console.log('Audio creation failed:', error)
    }
}

export function showTimerNotification(message) {
    // Browser notification
    chrome.notifications.create({
        type: 'basic',
        iconUrl: 'icon128.png',
        title: pomodoroState.isBreak ? 'Break Time!' : 'Work Time!',
        message,
        requireInteraction: true,
        silent: false
    })

    // In-app notification
    const notification = document.createElement("div")
    notification.className = "timer-notification"
    notification.textContent = message
    notification.style.cssText = `
        position: fixed;
        bottom: 24px;
        left: 50%;
        transform: translateX(-50%);
        padding: 12px 24px;
        background: var(--bg-color);
        border-radius: 8px;
        box-shadow: 0 4px 12px var(--shadow-color1);
        font-size: 14px;
        z-index: 2000;
        opacity: 0;
        transition: all 0.3s ease;
    `

    document.body.appendChild(notification)
    
    setTimeout(() => notification.style.opacity = "1", 100)
    setTimeout(() => {
        notification.style.opacity = "0"
        setTimeout(() => notification.remove(), 300)
    }, 3000)
} 