import { pomodoroState } from './pomodoro.js'
import { savePomodoroState } from './storage.js'
import { formatTime, getElement, tryCatch } from './utils.js'

export function showPomodoroSettings() {
    tryCatch(() => {
        // Remove any existing settings modal
        const existingModal = getElement('.pomodoro-settings-modal')
        if (existingModal) existingModal.remove()

        // Create modal container with proper z-index
        const modal = document.createElement("div")
        modal.className = 'pomodoro-settings-modal'
        modal.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -45%);
            background: var(--bg-color);
            padding: 24px;
            border-radius: 12px;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
            z-index: 9999;
            width: 240px;
            opacity: 0;
            transition: all 0.2s ease;
        `

        // Create modal content with better input validation
        const content = `
            <div style="margin-bottom: 20px;">
                <label style="display: block; margin-bottom: 8px; opacity: 0.8;">Focus Duration (min)</label>
                <input type="number" id="work-duration" value="${pomodoroState.workDuration / 60}" min="1" max="60" 
                    style="width: 100%; padding: 8px; border: 1px solid var(--text-color); border-radius: 4px; background: none; color: var(--text-color);">
                <span class="error-message" style="color: red; font-size: 12px; display: none;">Please enter a value between 1 and 60</span>
            </div>
            <div style="margin-bottom: 20px;">
                <label style="display: block; margin-bottom: 8px; opacity: 0.8;">Break Duration (min)</label>
                <input type="number" id="break-duration" value="${pomodoroState.breakDuration / 60}" min="1" max="30"
                    style="width: 100%; padding: 8px; border: 1px solid var(--text-color); border-radius: 4px; background: none; color: var(--text-color);">
                <span class="error-message" style="color: red; font-size: 12px; display: none;">Please enter a value between 1 and 30</span>
            </div>
            <div style="display: flex; gap: 8px; justify-content: flex-end;">
                <button id="cancel-settings" style="padding: 8px 16px; background: none; border: none; cursor: pointer; opacity: 0.8; color: var(--text-color);">Cancel</button>
                <button id="save-settings" style="padding: 8px 16px; background: var(--text-color); color: var(--bg-color); border: none; border-radius: 4px; cursor: pointer;">Save</button>
            </div>
        `

        modal.innerHTML = content

        // Create overlay with proper z-index
        const overlay = document.createElement('div')
        overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.5);
            z-index: 9998;
            opacity: 0;
            transition: opacity 0.2s ease;
        `

        // Add to DOM
        document.body.appendChild(overlay)
        document.body.appendChild(modal)

        // Animate in
        requestAnimationFrame(() => {
            modal.style.opacity = "1"
            modal.style.transform = "translate(-50%, -50%)"
            overlay.style.opacity = "1"
        })

        function closeModal() {
            modal.style.opacity = "0"
            modal.style.transform = "translate(-50%, -45%)"
            overlay.style.opacity = "0"
            
            setTimeout(() => {
                modal.remove()
                overlay.remove()
            }, 200)
        }

        // Event handlers with proper cleanup
        const handlers = {
            overlay: () => closeModal(),
            escape: (e) => e.key === 'Escape' && closeModal(),
            cancel: () => closeModal(),
            save: () => {
                const workInput = getElement('#work-duration')
                const breakInput = getElement('#break-duration')
                
                if (!workInput || !breakInput) return

                const workValue = parseInt(workInput.value)
                const breakValue = parseInt(breakInput.value)

                // Validate inputs
                let hasError = false
                if (workValue < 1 || workValue > 60) {
                    workInput.nextElementSibling.style.display = 'block'
                    hasError = true
                }
                if (breakValue < 1 || breakValue > 30) {
                    breakInput.nextElementSibling.style.display = 'block'
                    hasError = true
                }

                if (hasError) return

                const workDuration = workValue * 60
                const breakDuration = breakValue * 60

                pomodoroState.workDuration = workDuration
                pomodoroState.breakDuration = breakDuration
                
                if (!pomodoroState.isRunning) {
                    pomodoroState.timeLeft = pomodoroState.isBreak ? breakDuration : workDuration
                    const timerDisplay = getElement('.pomodoro-timer')
                    if (timerDisplay) {
                        timerDisplay.textContent = formatTime(pomodoroState.timeLeft)
                    }
                }

                savePomodoroState()
                closeModal()
            }
        }

        overlay.addEventListener('click', handlers.overlay)
        document.addEventListener('keydown', handlers.escape)
        
        const cancelButton = getElement('#cancel-settings')
        const saveButton = getElement('#save-settings')

        if (cancelButton) cancelButton.addEventListener('click', handlers.cancel)
        if (saveButton) saveButton.addEventListener('click', handlers.save)

        // Input validation with visual feedback
        const workInput = getElement('#work-duration')
        const breakInput = getElement('#break-duration')

        if (workInput) {
            workInput.addEventListener('input', () => {
                const value = parseInt(workInput.value)
                workInput.nextElementSibling.style.display = 
                    (value < 1 || value > 60) ? 'block' : 'none'
            })
        }

        if (breakInput) {
            breakInput.addEventListener('input', () => {
                const value = parseInt(breakInput.value)
                breakInput.nextElementSibling.style.display = 
                    (value < 1 || value > 30) ? 'block' : 'none'
            })
        }

        // Cleanup event listeners on close
        return () => {
            overlay.removeEventListener('click', handlers.overlay)
            document.removeEventListener('keydown', handlers.escape)
            if (cancelButton) cancelButton.removeEventListener('click', handlers.cancel)
            if (saveButton) saveButton.removeEventListener('click', handlers.save)
        }
    })
} 