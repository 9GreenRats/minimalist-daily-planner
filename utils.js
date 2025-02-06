// Time formatting and calculations
export function formatTime(seconds) {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
}

// DOM element selection with error handling
export function getElement(selector, context = document) {
    const element = context.querySelector(selector)
    if (!element) {
        console.error(`Element not found: ${selector}`)
        return null
    }
    return element
}

// Debounced storage function
let saveTimeout
export function debouncedSave(key, data, delay = 1000) {
    clearTimeout(saveTimeout)
    saveTimeout = setTimeout(() => {
        chrome.storage.sync.set({ [key]: data })
            .catch(error => {
                console.error('Storage error:', error)
                // Attempt retry once
                setTimeout(() => {
                    chrome.storage.sync.set({ [key]: data })
                        .catch(error => console.error('Storage retry failed:', error))
                }, 1000)
            })
    }, delay)
}

// Performance-based timer
export function createPreciseTimer(callback, interval) {
    let expected = performance.now() + interval
    let timeout

    function step() {
        const drift = performance.now() - expected
        callback()
        expected += interval
        timeout = setTimeout(step, Math.max(0, interval - drift))
    }

    timeout = setTimeout(step, interval)
    return () => clearTimeout(timeout)
}

// Error handling wrapper
export function tryCatch(fn, fallback = null) {
    try {
        return fn()
    } catch (error) {
        console.error('Operation failed:', error)
        return fallback
    }
} 