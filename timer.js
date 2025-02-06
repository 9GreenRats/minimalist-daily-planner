import { pomodoroState } from './pomodoro.js'
import { savePomodoroState } from './storage.js'
import { playNotificationSound, showTimerNotification } from './notifications.js'

export function startPomodoro() {
    if (!pomodoroState.isRunning) {
        pomodoroState.isRunning = true
        pomodoroState.lastStartTime = Date.now()
        
        document.querySelector('.pomodoro-start').style.display = 'none'
        document.querySelector('.pomodoro-timer').style.opacity = '1'
        
        runTimer()
        savePomodoroState()
    }
}

export function runTimer() {
    const now = Date.now()
    const elapsed = Math.floor((now - pomodoroState.lastStartTime) / 1000)
    const duration = pomodoroState.isBreak ? 
        pomodoroState.breakDuration : 
        pomodoroState.workDuration
    
    pomodoroState.timeLeft = Math.max(0, duration - elapsed)
    document.querySelector('.pomodoro-timer').textContent = formatTime(pomodoroState.timeLeft)
    
    if (pomodoroState.timeLeft > 0) {
        savePomodoroState()
        requestAnimationFrame(() => setTimeout(runTimer, 1000))
    } else {
        handleTimerComplete()
    }
}

export function resetPomodoro() {
    pomodoroState.isRunning = false
    pomodoroState.isBreak = false
    pomodoroState.timeLeft = pomodoroState.workDuration
    pomodoroState.lastStartTime = null
    
    document.querySelector('.pomodoro-timer').textContent = formatTime(pomodoroState.timeLeft)
    document.querySelector('.pomodoro-start').style.display = 'block'
    document.querySelector('.pomodoro-status').textContent = "Focus"
    
    savePomodoroState()
}

export function handleTimerComplete() {
    // Only notify if timer was actively running (not on initialization)
    const wasRunning = pomodoroState.isRunning
    
    pomodoroState.isRunning = false
    pomodoroState.isBreak = !pomodoroState.isBreak
    pomodoroState.timeLeft = pomodoroState.isBreak ? 
        pomodoroState.breakDuration : 
        pomodoroState.workDuration
    
    document.querySelector('.pomodoro-start').style.display = 'block'
    document.querySelector('.pomodoro-status').textContent = pomodoroState.isBreak ? "Break" : "Focus"
    document.querySelector('.pomodoro-timer').textContent = formatTime(pomodoroState.timeLeft)

    // Only show notifications if timer actually completed while running
    if (wasRunning) {
        playNotificationSound()
        showTimerNotification(pomodoroState.isBreak ? 
            "Time for a break!" : 
            "Break's over - back to work!")
    }
}

export function formatTime(seconds) {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
} 