import { pomodoroState } from './pomodoro.js'
import { tryCatch, getElement } from './utils.js'

let notificationTimeouts = []

export function playNotificationSound() {
    return tryCatch(() => {
        // Check if audio is allowed
        if (!('Audio' in window)) {
            console.warn('Audio not supported')
            return
        }

        const notification = new Audio(chrome.runtime.getURL('notification.mp3'))
        
        notification.addEventListener('ended', () => {
            notification.src = ''
            notification.remove()
        })

        return notification.play()
            .catch(error => {
                console.warn('Audio playback failed, using fallback:', error)
                // Fallback to system beep
                new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10...').play()
            })
    })
}

export function showTimerNotification(message) {
    tryCatch(() => {
        // Check notification permissions
        if (Notification.permission === 'granted') {
            // Browser notification
            chrome.notifications.create({
                type: 'basic',
                iconUrl: 'icon128.png',
                title: pomodoroState.isBreak ? 'Break Time!' : 'Work Time!',
                message,
                requireInteraction: true,
                silent: false
            })
        } else if (Notification.permission !== 'denied') {
            Notification.requestPermission()
        }

        // In-app notification
        const existingNotification = getElement('.timer-notification')
        if (existingNotification) {
            existingNotification.remove()
        }

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
        
        // Clear existing timeouts
        notificationTimeouts.forEach(clearTimeout)
        notificationTimeouts = []
        
        // Animate in
        notificationTimeouts.push(
            setTimeout(() => notification.style.opacity = "1", 100)
        )
        
        // Remove after delay
        notificationTimeouts.push(
            setTimeout(() => {
                notification.style.opacity = "0"
                notificationTimeouts.push(
                    setTimeout(() => notification.remove(), 300)
                )
            }, 3000)
        )
    })
}

// Cleanup function
export function cleanupNotifications() {
    notificationTimeouts.forEach(clearTimeout)
    notificationTimeouts = []
    
    const notification = getElement('.timer-notification')
    if (notification) {
        notification.remove()
    }
} 