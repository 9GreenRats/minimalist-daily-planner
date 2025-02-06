import { pomodoroState } from './pomodoro.js'

export function savePomodoroState() {
    chrome.storage.sync.set({
        pomodoroState: {
            timeLeft: pomodoroState.timeLeft,
            workDuration: pomodoroState.workDuration,
            breakDuration: pomodoroState.breakDuration,
            isBreak: pomodoroState.isBreak,
            isRunning: pomodoroState.isRunning,
            lastStartTime: pomodoroState.lastStartTime
        }
    })
}

export function loadPomodoroState() {
    return new Promise((resolve) => {
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
                }
                
                resolve(savedState)
            } else {
                resolve(null)
            }
        })
    })
} 