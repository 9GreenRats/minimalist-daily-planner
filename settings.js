import { pomodoroState } from './pomodoro.js'
import { savePomodoroState } from './storage.js'

export function showPomodoroSettings() {
    // Remove any existing settings modal
    const existingModal = document.querySelector('.pomodoro-settings-modal')
    if (existingModal) existingModal.remove()

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
        z-index: 2000;
        width: 240px;
        opacity: 0;
        transition: all 0.2s ease;
    `

    const content = `
        <div style="margin-bottom: 20px;">
            <label style="display: block; margin-bottom: 8px; opacity: 0.8;">Focus Duration (min)</label>
            <input type="number" id="work-duration" value="${pomodoroState.workDuration / 60}" min="1" max="60" 
                style="width: 100%; padding: 8px; border: 1px solid var(--text-color); border-radius: 4px; background: none; color: var(--text-color);">
        </div>
        <div style="margin-bottom: 20px;">
            <label style="display: block; margin-bottom: 8px; opacity: 0.8;">Break Duration (min)</label>
            <input type="number" id="break-duration" value="${pomodoroState.breakDuration / 60}" min="1" max="30"
                style="width: 100%; padding: 8px; border: 1px solid var(--text-color); border-radius: 4px; background: none; color: var(--text-color);">
        </div>
        <div style="display: flex; gap: 8px; justify-content: flex-end;">
            <button id="cancel-settings" style="padding: 8px 16px; background: none; border: none; cursor: pointer; opacity: 0.8; color: var(--text-color);">Cancel</button>
            <button id="save-settings" style="padding: 8px 16px; background: var(--text-color); color: var(--bg-color); border: none; border-radius: 4px; cursor: pointer;">Save</button>
        </div>
    `

    modal.innerHTML = content

    // Add overlay
    const overlay = document.createElement('div')
    overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.5);
        z-index: 1999;
        opacity: 0;
        transition: opacity 0.2s ease;
    `
    
    document.body.appendChild(overlay)
    document.body.appendChild(modal)

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

    // Event handlers
    overlay.onclick = closeModal
    document.getElementById('cancel-settings').onclick = closeModal
    
    document.getElementById('save-settings').onclick = () => {
        const workDuration = Math.min(60, Math.max(1, parseInt(document.getElementById('work-duration').value))) * 60
        const breakDuration = Math.min(30, Math.max(1, parseInt(document.getElementById('break-duration').value))) * 60

        pomodoroState.workDuration = workDuration
        pomodoroState.breakDuration = breakDuration
        
        if (!pomodoroState.isRunning) {
            pomodoroState.timeLeft = pomodoroState.isBreak ? breakDuration : workDuration
            document.querySelector('.pomodoro-timer').textContent = formatTime(pomodoroState.timeLeft)
        }

        savePomodoroState()
        closeModal()
    }
} 