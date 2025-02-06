import { pomodoroState } from './pomodoro.js'
import { debouncedSave, tryCatch } from './utils.js'

export function savePomodoroState() {
    const stateToSave = {
        timeLeft: pomodoroState.timeLeft,
        workDuration: pomodoroState.workDuration,
        breakDuration: pomodoroState.breakDuration,
        isBreak: pomodoroState.isBreak,
        isRunning: pomodoroState.isRunning,
        lastStartTime: pomodoroState.lastStartTime
    }

    // Use debounced save to prevent quota issues
    debouncedSave('pomodoroState', stateToSave)
}

export function loadPomodoroState() {
    return new Promise((resolve) => {
        tryCatch(async () => {
            const result = await chrome.storage.sync.get(['pomodoroState'])
            
            if (result.pomodoroState) {
                const savedState = result.pomodoroState
                
                // Validate timestamp
                if (savedState.isRunning && savedState.lastStartTime) {
                    const now = performance.now()
                    const elapsed = Math.floor((now - savedState.lastStartTime) / 1000)
                    
                    // Check if elapsed time is reasonable (less than 24 hours)
                    if (elapsed > 86400) {
                        savedState.isRunning = false
                        savedState.timeLeft = savedState.isBreak ? 
                            savedState.breakDuration : 
                            savedState.workDuration
                    } else {
                        const duration = savedState.isBreak ? 
                            savedState.breakDuration : 
                            savedState.workDuration
                        
                        savedState.timeLeft = Math.max(0, duration - elapsed)
                    }
                }
                
                resolve(savedState)
            } else {
                resolve(null)
            }
        }, () => resolve(null))
    })
}

// Add error boundary for storage operations
export function withStorageErrorHandling(operation) {
    return tryCatch(async () => {
        try {
            return await operation()
        } catch (error) {
            if (error.message.includes('QUOTA_BYTES')) {
                console.error('Storage quota exceeded, clearing old data')
                await chrome.storage.sync.clear()
                return operation()
            }
            throw error
        }
    })
} 