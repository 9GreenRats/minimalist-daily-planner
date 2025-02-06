import { pomodoroState } from './pomodoro.js'
import { savePomodoroState } from './storage.js'
import { playNotificationSound, showTimerNotification } from './notifications.js'
import { formatTime, getElement, createPreciseTimer, tryCatch } from './utils.js'

let stopTimer = null

export function startPomodoro() {
    if (!pomodoroState.isRunning) {
        const startButton = getElement('.pomodoro-start')
        const timerDisplay = getElement('.pomodoro-timer')
        if (!startButton || !timerDisplay) return

        pomodoroState.isRunning = true
        pomodoroState.lastStartTime = performance.now()
        
        startButton.style.display = 'none'
        timerDisplay.style.opacity = '1'
        
        // Use precise timer
        stopTimer = createPreciseTimer(() => {
            if (!runTimer()) {
                stopTimer?.()
            }
        }, 1000)

        savePomodoroState()
    }
}

function runTimer() {
    const timerDisplay = getElement('.pomodoro-timer')
    if (!timerDisplay) return false

    const now = performance.now()
    const elapsed = Math.floor((now - pomodoroState.lastStartTime) / 1000)
    const duration = pomodoroState.isBreak ? 
        pomodoroState.breakDuration : 
        pomodoroState.workDuration
    
    pomodoroState.timeLeft = Math.max(0, duration - elapsed)
    timerDisplay.textContent = formatTime(pomodoroState.timeLeft)
    
    if (pomodoroState.timeLeft > 0) {
        savePomodoroState()
        return true
    } else {
        handleTimerComplete()
        return false
    }
}

export function resetPomodoro() {
    stopTimer?.()
    
    tryCatch(() => {
        const elements = {
            timer: getElement('.pomodoro-timer'),
            start: getElement('.pomodoro-start'),
            status: getElement('.pomodoro-status')
        }

        if (!elements.timer || !elements.start || !elements.status) return

        pomodoroState.isRunning = false
        pomodoroState.isBreak = false
        pomodoroState.timeLeft = pomodoroState.workDuration
        pomodoroState.lastStartTime = null
        
        elements.timer.textContent = formatTime(pomodoroState.timeLeft)
        elements.start.style.display = 'block'
        elements.status.textContent = "Focus"
        
        savePomodoroState()
    })
}

export function handleTimerComplete() {
    stopTimer?.()
    
    tryCatch(() => {
        const wasRunning = pomodoroState.isRunning
        
        pomodoroState.isRunning = false
        pomodoroState.isBreak = !pomodoroState.isBreak
        pomodoroState.timeLeft = pomodoroState.isBreak ? 
            pomodoroState.breakDuration : 
            pomodoroState.workDuration
        
        const elements = {
            start: getElement('.pomodoro-start'),
            status: getElement('.pomodoro-status'),
            timer: getElement('.pomodoro-timer')
        }

        if (!elements.start || !elements.status || !elements.timer) return

        elements.start.style.display = 'block'
        elements.status.textContent = pomodoroState.isBreak ? "Break" : "Focus"
        elements.timer.textContent = formatTime(pomodoroState.timeLeft)

        if (wasRunning) {
            playNotificationSound()
            showTimerNotification(pomodoroState.isBreak ? 
                "Time for a break!" : 
                "Break's over - back to work!")
        }
    })
} 