import { formatTime } from './timer.js'
import { playNotificationSound, showTimerNotification } from './notifications.js'

// Pomodoro state and UI management
export const pomodoroState = {
    isVisible: false,
    isRunning: false,
    timeLeft: 30 * 60,
    workDuration: 30 * 60,
    breakDuration: 5 * 60,
    isBreak: false,
    lastStartTime: null
}

export function initPomodoroTimer() {
    // Load saved state silently (without notifications)
    chrome.storage.sync.get(['pomodoroState'], (result) => {
        if (result.pomodoroState) {
            const savedState = result.pomodoroState
            
            if (savedState.isRunning && savedState.lastStartTime) {
                const now = Date.now()
                const elapsed = Math.floor((now - savedState.lastStartTime) / 1000)
                const duration = savedState.isBreak ? 
                    savedState.breakDuration : 
                    savedState.workDuration
                
                savedState.timeLeft = Math.max(0, duration - elapsed)
                
                // If timer completed while extension was closed, just reset it silently
                if (savedState.timeLeft === 0) {
                    savedState.isRunning = false
                    savedState.timeLeft = savedState.isBreak ? 
                        savedState.breakDuration : 
                        savedState.workDuration
                }
            }
            
            // Update state without triggering notifications
            Object.assign(pomodoroState, savedState)
            
            // Update UI
            document.querySelector('.pomodoro-timer').textContent = formatTime(pomodoroState.timeLeft)
            document.querySelector('.pomodoro-status').textContent = pomodoroState.isBreak ? "Break" : "Focus"
            
            // Resume timer if it was running and not completed
            if (pomodoroState.isRunning && pomodoroState.timeLeft > 0) {
                document.querySelector('.pomodoro-start').style.display = 'none'
                runTimer()
            }
        }
    })
}

export function showPomodoro() {
    // ... show pomodoro code ...
}

export function hidePomodoro() {
    // ... hide pomodoro code ...
} 