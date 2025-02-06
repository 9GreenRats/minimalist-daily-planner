import { formatTime, getElement, tryCatch } from './utils.js'
import { cleanupNotifications } from './notifications.js'
import { startPomodoro, resetPomodoro } from './timer.js'

// SVG Icons
const playIcon = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
    <polygon points="5,3 19,12 5,21" fill="currentColor"/>
</svg>`

const pauseIcon = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
    <rect x="7" y="4" width="3" height="16" fill="currentColor"/>
    <rect x="14" y="4" width="3" height="16" fill="currentColor"/>
</svg>`

const resetIcon = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
    <path d="M4 12a8 8 0 018-8v2" stroke-width="2" stroke-linecap="round"/>
    <path d="M20 12a8 8 0 01-8 8v-2" stroke-width="2" stroke-linecap="round"/>
</svg>`

const settingsIcon = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
    <circle cx="12" cy="12" r="3" stroke-width="2"/>
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" stroke-width="2"/>
</svg>`

// Pomodoro state with validation
export const pomodoroState = {
    isVisible: false,
    isRunning: false,
    timeLeft: 30 * 60,
    workDuration: 30 * 60,
    breakDuration: 5 * 60,
    isBreak: false,
    lastStartTime: null
}

// Track cleanup functions
let cleanup = {
    animation: null,
    timer: null
}

export function initPomodoroTimer() {
    tryCatch(() => {
        const container = getElement('.pomodoro-container')
        if (!container) return

        // Full-screen container with improved styling
        container.style.cssText = `
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: var(--bg-color);
            transform: translateY(-100%);
            transition: transform 0.4s cubic-bezier(0.4, 0, 0.2, 1);
            z-index: 1000;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            padding: 24px;
            opacity: 0;
        `

        // Header with back button
        const header = createHeader()
        const timerContainer = createTimerContainer()

        container.appendChild(header)
        container.appendChild(timerContainer)

        // Update UI with saved state
        updateTimerDisplay()
    })
}

function createHeader() {
    const header = document.createElement("div")
    header.style.cssText = `
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        display: flex;
        align-items: center;
        padding: 24px;
    `

    const backButton = document.createElement("button")
    backButton.innerHTML = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
        <path d="M15 18l-6-6 6-6" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>`
    backButton.style.cssText = `
        background: none;
        border: none;
        padding: 8px;
        cursor: pointer;
        opacity: 0.8;
        transition: all 0.2s ease;
    `
    backButton.onclick = hidePomodoro

    const title = document.createElement("div")
    title.textContent = "Pomodoro Timer"
    title.style.cssText = `
        flex: 1;
        text-align: center;
        font-size: 18px;
        font-weight: 500;
        margin-right: 40px;
    `

    header.appendChild(backButton)
    header.appendChild(title)
    return header
}

function createTimerContainer() {
    const container = document.createElement("div")
    container.style.cssText = `
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 24px;
    `

    const status = document.createElement("div")
    status.className = 'pomodoro-status'
    status.textContent = pomodoroState.isBreak ? "Break" : "Focus"
    status.style.cssText = `
        font-size: 16px;
        font-weight: 500;
        opacity: 0.8;
    `

    const timer = document.createElement("div")
    timer.className = 'pomodoro-timer'
    timer.style.cssText = `
        font-size: 72px;
        font-weight: 600;
        font-family: 'SF Mono', 'Roboto Mono', monospace;
        color: var(--text-color);
        letter-spacing: 4px;
    `

    const controls = createControls()

    container.appendChild(status)
    container.appendChild(timer)
    container.appendChild(controls)
    return container
}

function createControls() {
    const controls = document.createElement("div")
    controls.style.cssText = `
        display: flex;
        gap: 16px;
        align-items: center;
    `

    // Start/Pause button
    const startButton = document.createElement("button")
    startButton.className = 'pomodoro-start'
    startButton.innerHTML = pomodoroState.isRunning ? pauseIcon : playIcon
    startButton.style.cssText = `
        width: 48px;
        height: 48px;
        border-radius: 50%;
        border: none;
        background: var(--bg-color);
        color: var(--text-color);
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 3px 3px 6px var(--shadow-color1), -3px -3px 6px var(--shadow-color2);
    `
    startButton.onclick = startPomodoro

    // Reset button
    const resetButton = document.createElement("button")
    resetButton.innerHTML = resetIcon
    resetButton.style.cssText = `
        width: 36px;
        height: 36px;
        border-radius: 50%;
        border: none;
        background: var(--bg-color);
        color: var(--text-color);
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 3px 3px 6px var(--shadow-color1), -3px -3px 6px var(--shadow-color2);
    `
    resetButton.onclick = resetPomodoro

    // Settings button
    const settingsButton = document.createElement("button")
    settingsButton.innerHTML = settingsIcon
    settingsButton.style.cssText = `
        width: 36px;
        height: 36px;
        border-radius: 50%;
        border: none;
        background: var(--bg-color);
        color: var(--text-color);
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 3px 3px 6px var(--shadow-color1), -3px -3px 6px var(--shadow-color2);
    `
    settingsButton.onclick = () => {
        import('./settings.js').then(module => {
            module.showPomodoroSettings()
        })
    }

    controls.appendChild(resetButton)
    controls.appendChild(startButton)
    controls.appendChild(settingsButton)

    return controls
}

function updateTimerDisplay() {
    tryCatch(() => {
        const timer = getElement('.pomodoro-timer')
        const status = getElement('.pomodoro-status')
        if (!timer || !status) return

        timer.textContent = formatTime(pomodoroState.timeLeft)
        status.textContent = pomodoroState.isBreak ? "Break" : "Focus"
    })
}

export function showPomodoro() {
    tryCatch(() => {
        const container = getElement('.pomodoro-container')
        const content = getElement('#content')
        const addButton = getElement('#add-button')
        const tabs = getElement('#tabs')
        if (!container || !content || !addButton || !tabs) return

        pomodoroState.isVisible = true
        
        // Hide main UI
        content.style.opacity = "0"
        addButton.style.display = "none"
        tabs.style.opacity = "0"
        
        // Show pomodoro with animation
        cleanup.animation = requestAnimationFrame(() => {
            container.style.opacity = "1"
            container.style.transform = "translateY(0)"
        })
    })
}

export function hidePomodoro() {
    tryCatch(() => {
        const container = getElement('.pomodoro-container')
        const content = getElement('#content')
        const addButton = getElement('#add-button')
        const tabs = getElement('#tabs')
        if (!container || !content || !addButton || !tabs) return

        pomodoroState.isVisible = false
        
        // Hide pomodoro
        container.style.transform = "translateY(-100%)"
        container.style.opacity = "0"
        
        // Show main UI
        content.style.opacity = "1"
        addButton.style.display = "flex"
        tabs.style.opacity = "1"

        // Cleanup
        cleanupNotifications()
        if (cleanup.animation) cancelAnimationFrame(cleanup.animation)
        if (cleanup.timer) cleanup.timer()
    })
}

// Cleanup function for unmounting
export function cleanupPomodoro() {
    if (cleanup.animation) cancelAnimationFrame(cleanup.animation)
    if (cleanup.timer) cleanup.timer()
    cleanupNotifications()
} 