import { pomodoroState, initPomodoroTimer, showPomodoro, hidePomodoro } from './pomodoro.js'
import { startPomodoro, resetPomodoro } from './timer.js'
import { showPomodoroSettings } from './settings.js'
import { loadPomodoroState } from './storage.js'

document.addEventListener("DOMContentLoaded", async () => {
    const state = {
      tasks: [],
      notes: [],
      currentView: "tasks",
      currentDate: new Date(),
      editingItemIndex: null,
      theme: "light",
      pomodoro: {
          isVisible: false,
          isRunning: false,
          timeLeft: 30 * 60, // 30 minutes default
          workDuration: 30 * 60,
          breakDuration: 5 * 60,
          isBreak: false,
          lastStartTime: null,
          lastPauseTime: null
      },
      showCompletedHistory: false
    }
  
    const elements = {
      date: document.getElementById("date"),
      tasksTab: document.getElementById("tasks-tab"),
      notesTab: document.getElementById("notes-tab"),
      tasksList: document.getElementById("tasks-list"),
      notesList: document.getElementById("notes-list"),
      addButton: document.getElementById("add-button"),
      modal: document.getElementById("modal"),
      modalInput: document.getElementById("modal-input"),
      noteInput: document.getElementById("note-input"),
      saveButton: document.getElementById("save-button"),
      cancelButton: document.getElementById("cancel-button"),
      themeToggle: document.getElementById("theme-toggle"),
      content: document.getElementById("content"),
      pomodoroContainer: document.createElement("div"),
      pomodoroTimer: document.createElement("div")
    }
  
    // Add these SVG icons at the top of the file
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
  
    let saveTimeout = null
  
    function init() {
      updateDateDisplay()
      loadStoredData()
      attachEventListeners()
      updateModalPlaceholder()
      setInitialTabState()
      loadTheme()
      setContentHeight()
      updateModalStyles()
      initPomodoroTimer()
      updateFABPosition()
      
      window.addEventListener("resize", updateFABPosition)
    }
  
    function loadTheme() {
      chrome.storage.sync.get(["theme"], (result) => {
        if (result.theme) {
          state.theme = result.theme
          applyTheme()
        }
      })
    }
  
    function toggleTheme() {
      state.theme = state.theme === "light" ? "dark" : "light"
      applyTheme()
      chrome.storage.sync.set({ theme: state.theme })
    }
  
    function applyTheme() {
      document.documentElement.setAttribute("data-theme", state.theme)
      const themeToggle = document.getElementById("theme-toggle")
      themeToggle.setAttribute("aria-label", state.theme)
    }
  
    function updateDateDisplay() {
      const options = { weekday: "long", month: "long", day: "numeric" }
      elements.date.textContent = state.currentDate.toLocaleDateString("en-US", options)
      
      // Make date clickable for pomodoro
      elements.date.style.cursor = "pointer"
      elements.date.style.transition = "opacity 0.2s ease"
      elements.date.title = "Click to open Pomodoro Timer"
      
      // Add hover effect
      elements.date.addEventListener("mouseenter", () => {
          elements.date.style.opacity = "0.7"
      })
      
      elements.date.addEventListener("mouseleave", () => {
          elements.date.style.opacity = "1"
      })
      
      // Click to show pomodoro
      elements.date.addEventListener("click", () => {
          showPomodoro()
      })
    }
  
    function setInitialTabState() {
      if (state.currentView === "tasks") {
        elements.tasksTab.style.boxShadow = "3px 3px 6px var(--shadow-color1), -3px -3px 6px var(--shadow-color2)"
        elements.notesTab.style.boxShadow = "none"
      } else {
        elements.notesTab.style.boxShadow = "3px 3px 6px var(--shadow-color1), -3px -3px 6px var(--shadow-color2)"
        elements.tasksTab.style.boxShadow = "none"
      }
    }
  
    function renderItems() {
      const currentItems = state.currentView === "tasks" ? state.tasks : state.notes
      const listElement = state.currentView === "tasks" ? elements.tasksList : elements.notesList
  
      listElement.innerHTML = ""
  
      // Sort tasks: incomplete first (oldest to newest), then completed (only for today)
      if (state.currentView === "tasks") {
        currentItems.sort((a, b) => {
          if (a.completed === b.completed) {
            return new Date(a.date) - new Date(b.date)
          }
          return a.completed ? 1 : -1
        })
      } else {
        // Sort notes by date (newest to oldest)
        currentItems.sort((a, b) => new Date(b.date) - new Date(a.date))
      }
  
      currentItems.forEach((item, index) => {
        if (state.currentView === "tasks") {
          const isToday = isSameDay(new Date(item.date), state.currentDate)
          if (item.completed && !isToday && !state.showCompletedHistory) {
            return // Skip completed tasks from previous days unless history is shown
          }

          // Add completion date to completed tasks
          if (item.completed) {
            item.completedDate = item.completedDate || item.date // Store completion date
          }
        }
  
        const li = document.createElement("li")
        li.style.cssText = `
            padding: 16px;
            margin-bottom: 12px;
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 12px;
            border-radius: 8px;
            background: var(--bg-color);
            box-shadow: 3px 3px 6px var(--shadow-color1), -3px -3px 6px var(--shadow-color2);
            transition: all 0.2s ease;
            position: relative;
        `
  
        if (state.currentView === "tasks") {
          li.classList.add("task-item")
          renderTaskItem(li, item, index)
        } else {
          renderNoteItem(li, item, index)
        }
  
        listElement.appendChild(li)
      })
      setContentHeight()
  
      if (state.currentView === "tasks") {
        elements.tasksList.style.padding = "1px 8px"
        elements.tasksList.style.display = "flex"
        elements.tasksList.style.flexDirection = "column"
        elements.tasksList.style.gap = "0"
      }
    }
  
    function renderTaskItem(li, item, index) {
      // Restore original styling
      li.style.cssText = `
          padding: 16px;
          margin-bottom: 12px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          border-radius: 8px;
          background: var(--bg-color);
          box-shadow: 3px 3px 6px var(--shadow-color1), -3px -3px 6px var(--shadow-color2);
          transition: all 0.2s ease;
          position: relative;
      `
  
      const leftSection = document.createElement("div")
      leftSection.style.display = "flex"
      leftSection.style.flexDirection = "column"
      leftSection.style.gap = "0"
      leftSection.style.flex = "1"
      leftSection.style.minWidth = "0"
      leftSection.style.cursor = "pointer"
      leftSection.style.padding = "2px 0"
  
      const title = document.createElement("div")
      title.textContent = item.text
      title.style.fontSize = "13px"
      title.style.fontWeight = "500"
      title.style.color = item.completed ? "#999" : "var(--text-color)"
      title.style.textDecoration = item.completed ? "line-through" : "none"
      title.style.whiteSpace = "normal"
      title.style.wordBreak = "break-word"
      title.style.lineHeight = "1"
      title.style.textAlign = "left"
      title.style.marginBottom = "1px"
  
      const dateLabel = document.createElement("div")
      dateLabel.textContent = formatDate(new Date(item.date))
      dateLabel.style.fontSize = "10px"
      dateLabel.style.color = "var(--text-color)"
      dateLabel.style.opacity = "0.6"
      dateLabel.style.lineHeight = "1"
      dateLabel.style.textAlign = "left"
  
      leftSection.appendChild(title)
      leftSection.appendChild(dateLabel)
  
      if (state.currentView === "tasks" && item.completed && item.completedDate) {
        const completedDateLabel = document.createElement("div")
        completedDateLabel.textContent = `Completed: ${formatDate(new Date(item.completedDate))}`
        completedDateLabel.style.fontSize = "10px"
        completedDateLabel.style.opacity = "0.6"
        leftSection.appendChild(completedDateLabel)
      }
  
      const actionsContainer = document.createElement("div")
      actionsContainer.style.position = "absolute"
      actionsContainer.style.right = "-4px"
      actionsContainer.style.top = "50%"
      actionsContainer.style.transform = "translate(100%, -50%)"
      actionsContainer.style.padding = "2px 4px"
      actionsContainer.style.background = "var(--bg-color)"
      actionsContainer.style.borderRadius = "4px"
      actionsContainer.style.boxShadow = "1px 1px 3px var(--shadow-color1), -1px -1px 3px var(--shadow-color2)"
      actionsContainer.style.display = "flex"
      actionsContainer.style.gap = "2px"
      actionsContainer.style.opacity = "0"
      actionsContainer.style.transition = "all 0.2s ease"
      actionsContainer.style.pointerEvents = "none"
  
      const actions = document.createElement("div")
      actions.style.display = "flex"
      actions.style.gap = "2px"
      actions.style.alignItems = "center"
  
      const toggleBtn = createActionButton(
        item.completed ? "↩" : "✓", 
        () => toggleTask(index),
        item.completed ? "Mark Incomplete" : "Mark Complete"
      )
      const deleteBtn = createActionButton("×", () => deleteItem(index), "Delete")
  
      actions.appendChild(toggleBtn)
      if (!item.completed) {
        const editBtn = createActionButton("✎", () => startEditing(index), "Edit")
        actions.appendChild(editBtn)
      }
      actions.appendChild(deleteBtn)
  
      actionsContainer.appendChild(actions)
  
      const container = document.createElement("div")
      container.style.position = "relative"
      container.style.width = "100%"
      container.style.display = "flex"
      container.style.alignItems = "center"
  
      container.appendChild(leftSection)
      container.appendChild(actionsContainer)
      li.appendChild(container)
  
      li.addEventListener("mouseenter", () => {
        li.style.transform = "translateX(-16px)"
        li.style.background = "var(--bg-color)"
        actionsContainer.style.opacity = "1"
        actionsContainer.style.transform = "translate(0, -50%)"
        actionsContainer.style.pointerEvents = "auto"
      })
  
      li.addEventListener("mouseleave", () => {
        li.style.transform = "translateX(0)"
        li.style.background = "none"
        actionsContainer.style.opacity = "0"
        actionsContainer.style.transform = "translate(100%, -50%)"
        actionsContainer.style.pointerEvents = "none"
      })
    }
  
    function renderNoteItem(li, item, index) {
      // Main container styles
      li.style.padding = "12px 16px"
      li.style.display = "flex"
      li.style.flexDirection = "column"
      li.style.gap = "4px"
      li.style.background = "var(--bg-color)"
      li.style.marginBottom = "12px"
      li.style.cursor = "pointer"
      li.style.borderRadius = "8px"
      li.style.maxWidth = "320px" // Constrain width for better readability
      li.style.margin = "0 auto 12px auto" // Center the note card
      li.style.width = "100%"
  
      // Header section
      const header = document.createElement("div")
      header.style.display = "flex"
      header.style.flexDirection = "column" // Stack title and meta vertically
      header.style.gap = "4px"
      header.style.width = "100%"
  
      // Title section with indicator
      const titleSection = document.createElement("div")
      titleSection.style.display = "flex"
      titleSection.style.alignItems = "center"
      titleSection.style.gap = "6px"
      titleSection.style.width = "100%"
  
      const lines = item.text.split("\n")
      const title = document.createElement("div")
      title.textContent = lines[0]
      title.style.fontSize = "14px"
      title.style.fontWeight = "600"
      title.style.color = "var(--text-color)"
      title.style.lineHeight = "1.4"
      title.style.flex = "1"
  
      const indicator = document.createElement("div")
      indicator.textContent = "▼"
      indicator.style.fontSize = "10px"
      indicator.style.opacity = "0.6"
      indicator.style.transition = "transform 0.3s ease"
      indicator.style.transform = "rotate(-90deg)"
  
      // Meta section (date and actions)
      const metaSection = document.createElement("div")
      metaSection.style.display = "flex"
      metaSection.style.justifyContent = "space-between"
      metaSection.style.alignItems = "center"
      metaSection.style.width = "100%"
  
      const dateLabel = document.createElement("div")
      dateLabel.textContent = formatDate(new Date(item.date))
      dateLabel.style.fontSize = "11px"
      dateLabel.style.color = "var(--text-color)"
      dateLabel.style.opacity = "0.7"
  
      const actions = document.createElement("div")
      actions.style.display = "flex"
      actions.style.gap = "8px"
      actions.style.opacity = "0"
      actions.style.transition = "opacity 0.2s ease"
  
      const editBtn = createActionButton("✎", () => startEditing(index), "Edit Note")
      const deleteBtn = createActionButton("×", () => deleteItem(index), "Delete Note")
      actions.appendChild(editBtn)
      actions.appendChild(deleteBtn)
  
      // Content section
      const contentSection = document.createElement("div")
      contentSection.style.display = "none"
      contentSection.style.marginTop = "8px"
      const previewText = lines.slice(1).join("\n")
      
      const content = document.createElement("div")
      content.textContent = previewText || "No content" // Add fallback text
      content.style.fontSize = "13px"
      content.style.color = "var(--text-color)"
      content.style.opacity = previewText ? "0.85" : "0.5" // Dim empty content
      content.style.lineHeight = "1.5"
      content.style.whiteSpace = "pre-wrap"
      content.style.wordBreak = "break-word"
      content.style.borderTop = "1px solid rgba(var(--text-color-rgb), 0.1)"
      content.style.paddingTop = "8px"
      content.style.marginTop = "4px"
      
      contentSection.appendChild(content)
  
      // Assemble the layout
      titleSection.appendChild(title)
      titleSection.appendChild(indicator)
  
      metaSection.appendChild(dateLabel)
      metaSection.appendChild(actions)
  
      header.appendChild(titleSection)
      header.appendChild(metaSection)
  
      li.appendChild(header)
      li.appendChild(contentSection)
  
      // Click handler for expand/collapse
      li.addEventListener("click", (e) => {
          if (e.target.closest("button")) return
          
          const isVisible = contentSection.style.display === "block"
          contentSection.style.display = isVisible ? "none" : "block"
          indicator.style.transform = isVisible ? "rotate(-90deg)" : "rotate(0deg)"
      })
  
      // Hover effects
      li.addEventListener("mouseenter", () => {
          li.style.transform = "translateY(-2px)"
          li.style.boxShadow = "3px 3px 6px var(--shadow-color1), -3px -3px 6px var(--shadow-color2)"
          actions.style.opacity = "1"
      })
  
      li.addEventListener("mouseleave", () => {
          li.style.transform = "translateY(0)"
          li.style.boxShadow = "2px 2px 4px var(--shadow-color1), -2px -2px 4px var(--shadow-color2)"
          actions.style.opacity = "0"
      })
    }
  
    function formatDate(date) {
      const now = new Date()
      const yesterday = new Date(now)
      yesterday.setDate(yesterday.getDate() - 1)
  
      if (isSameDay(date, now)) {
        return "Today"
      } else if (isSameDay(date, yesterday)) {
        return "Yesterday"
      } else if (date.getFullYear() === now.getFullYear()) {
        return date.toLocaleDateString("en-US", { month: "short", day: "numeric" })
      } else {
        return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
      }
    }
  
    function createActionButton(text, onClick, tooltip) {
      const button = document.createElement("button")
      button.textContent = text
      button.style.border = "none"
      button.style.background = "none"
      button.style.padding = "2px"
      button.style.cursor = "pointer"
      button.style.color = "var(--text-color)"
      button.style.opacity = "0.7"
      button.style.fontSize = "12px"
      button.style.transition = "all 0.2s ease"
      button.style.width = "18px"
      button.style.height = "18px"
      button.style.borderRadius = "50%"
      button.style.display = "flex"
      button.style.justifyContent = "center"
      button.style.alignItems = "center"
      button.style.position = "relative" // For tooltip positioning
  
      // Add tooltip
      if (tooltip) {
          button.title = tooltip // Native tooltip
          
          // Custom tooltip
          const tooltipEl = document.createElement("div")
          tooltipEl.textContent = tooltip
          tooltipEl.style.position = "absolute"
          tooltipEl.style.bottom = "100%"
          tooltipEl.style.left = "50%"
          tooltipEl.style.transform = "translateX(-50%)"
          tooltipEl.style.padding = "4px 8px"
          tooltipEl.style.borderRadius = "4px"
          tooltipEl.style.background = "var(--bg-color)"
          tooltipEl.style.color = "var(--text-color)"
          tooltipEl.style.whiteSpace = "nowrap"
          tooltipEl.style.opacity = "0"
          tooltipEl.style.pointerEvents = "none"
          tooltipEl.style.transition = "opacity 0.2s ease"
          tooltipEl.style.boxShadow = "1px 1px 3px var(--shadow-color1), -1px -1px 3px var(--shadow-color2)"
          tooltipEl.style.marginBottom = "8px"
          
          button.appendChild(tooltipEl)
          
          button.addEventListener("mouseenter", () => {
              tooltipEl.style.opacity = "1"
          })
          
          button.addEventListener("mouseleave", () => {
              tooltipEl.style.opacity = "0"
          })
      }
  
      button.addEventListener("click", (e) => {
        e.stopPropagation()
        onClick()
      })
      button.addEventListener("mouseenter", () => {
        button.style.opacity = "1"
        button.style.transform = "scale(1.1)"
      })
      button.addEventListener("mouseleave", () => {
        button.style.opacity = "0.7"
        button.style.transform = "scale(1)"
      })
      button.addEventListener("mousedown", () => {
        button.style.transform = "scale(0.95)"
      })
      button.addEventListener("mouseup", () => {
        button.style.transform = "scale(1.1)"
      })
      return button
    }
  
    function toggleTask(index) {
      const task = state.tasks[index]
      task.completed = !task.completed
      task.completedDate = task.completed ? new Date().toISOString() : null
        saveData()
        renderItems()
    }
  
    function startEditing(index) {
      state.editingItemIndex = index
      const currentItems = state.currentView === "tasks" ? state.tasks : state.notes
      const item = currentItems[index]
  
      if (state.currentView === "tasks") {
        elements.modalInput.value = item.text
        elements.noteInput.style.display = "none"
      } else {
        const lines = item.text.split("\n")
        elements.modalInput.value = lines[0]
        elements.noteInput.value = lines.slice(1).join("\n")
        elements.noteInput.style.display = "block"
      }
  
      elements.modal.style.display = "block"
      elements.modalInput.focus()
    }
  
    function showError(message) {
        const errorDiv = document.createElement("div")
        errorDiv.textContent = message
        errorDiv.style.color = "#ff4444"
        errorDiv.style.fontSize = "12px"
        errorDiv.style.marginTop = "-12px"
        errorDiv.style.marginBottom = "12px"
        errorDiv.style.opacity = "0"
        errorDiv.style.transition = "opacity 0.3s ease"

        const modalContent = document.querySelector("#modal > div")
        modalContent.insertBefore(errorDiv, document.querySelector("#modal button").parentElement)

        requestAnimationFrame(() => errorDiv.style.opacity = "1")
        setTimeout(() => {
            errorDiv.style.opacity = "0"
            setTimeout(() => errorDiv.remove(), 300)
        }, 3000)
    }
  
    function saveItem() {
      const text = elements.modalInput.value.trim()
      const noteText = elements.noteInput.value.trim()

      if (state.currentView === "tasks" && !text) {
          showError("Please enter a task description")
          return
      }

      if (state.currentView === "notes" && (!text || !noteText)) {
          showError("Please enter both title and content for the note")
          return
      }
  
      if (state.editingItemIndex !== null) {
        const currentItems = state.currentView === "tasks" ? state.tasks : state.notes
        currentItems[state.editingItemIndex].text = text
      } else {
        const newItem = {
          text,
          date: new Date().toISOString(),
          completed: false,
        }
  
        if (state.currentView === "tasks") {
          state.tasks.push(newItem)
        } else {
          state.notes.push(newItem)
        }
      }
  
      saveData()
      renderItems()
      closeModal()
    }
  
    function deleteItem(index) {
      const currentItems = state.currentView === "tasks" ? state.tasks : state.notes
      if (index >= 0 && index < currentItems.length) {
        currentItems.splice(index, 1)
        saveData()
        renderItems()
      }
    }
  
    function closeModal() {
      elements.modal.style.display = "none"
      elements.modalInput.value = ""
      elements.noteInput.value = ""
      state.editingItemIndex = null
      elements.noteInput.style.display = "none"
    }
  
    function updateModalPlaceholder() {
      elements.modalInput.placeholder = state.currentView === "tasks" ? "Enter task..." : "Note title..."
      elements.noteInput.placeholder = "Enter note content..."
    }
  
    function saveData() {
      chrome.storage.sync.set({
        tasks: state.tasks,
        notes: state.notes,
        theme: state.theme,
      })
    }
  
    function loadStoredData() {
      chrome.storage.sync.get(["tasks", "notes", "theme"], (result) => {
        state.tasks = result.tasks || []
        state.notes = result.notes || []
        state.theme = result.theme || "light"
        applyTheme()
        renderItems()
      })
    }
  
    function attachEventListeners() {
      elements.themeToggle.addEventListener("click", toggleTheme)
      elements.themeToggle.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
          toggleTheme()
        }
      })
  
      elements.tasksTab.addEventListener("click", () => {
        state.currentView = "tasks"
        elements.tasksList.style.display = "flex"
        elements.notesList.style.display = "none"
        elements.tasksTab.style.boxShadow = "3px 3px 6px var(--shadow-color1), -3px -3px 6px var(--shadow-color2)"
        elements.notesTab.style.boxShadow = "none"
        updateModalPlaceholder()
        renderItems()
      })
  
      elements.notesTab.addEventListener("click", () => {
        state.currentView = "notes"
        elements.tasksList.style.display = "none"
        elements.notesList.style.display = "flex"
        elements.notesTab.style.boxShadow = "3px 3px 6px var(--shadow-color1), -3px -3px 6px var(--shadow-color2)"
        elements.tasksTab.style.boxShadow = "none"
        updateModalPlaceholder()
        renderItems()
      })
  
      elements.addButton.addEventListener("mousedown", () => {
        elements.addButton.style.boxShadow =
          "inset 3px 3px 6px var(--shadow-color1), inset -3px -3px 6px var(--shadow-color2)"
        elements.addButton.style.transform = "scale(0.95)"
      })
  
      elements.addButton.addEventListener("mouseup", () => {
        elements.addButton.style.boxShadow = "5px 5px 10px var(--shadow-color1), -5px -5px 10px var(--shadow-color2)"
        elements.addButton.style.transform = "scale(1)"
        elements.modal.style.display = "block"
        elements.modalInput.focus()
  
        if (state.currentView === "notes") {
          elements.noteInput.style.display = "block"
        }
      })
  
      elements.saveButton.addEventListener("click", saveItem)
      elements.cancelButton.addEventListener("click", closeModal)
  
      elements.modalInput.addEventListener("keypress", (e) => {
        if (e.key === "Enter" && state.currentView === "tasks") {
          saveItem()
        }
      })
  
      elements.modal.addEventListener("click", (e) => {
        if (e.target === elements.modal) {
          closeModal()
        }
      })
    }
  
    function isSameDay(date1, date2) {
      return (
        date1.getFullYear() === date2.getFullYear() &&
        date1.getMonth() === date2.getMonth() &&
        date1.getDate() === date2.getDate()
      )
    }
  
    function setContentHeight() {
      const contentPadding = 16
      const contentBottomPadding = 80
      const contentHeight = 600 - 48 - 52 - 56 - 72 // Total height - header - tabs - FAB - padding
      
      elements.content.style.cssText = `
          height: ${contentHeight}px;
          overflow-y: auto;
          padding: ${contentPadding}px ${contentPadding}px ${contentBottomPadding}px ${contentPadding}px;
          margin: 0;
      `
    }
  
    function updateModalStyles() {
      const modalInput = document.getElementById("modal-input")
      const noteInput = document.getElementById("note-input")
      const saveButton = document.getElementById("save-button")
      const cancelButton = document.getElementById("cancel-button")
      const modalContent = document.querySelector("#modal > div")

      // Fix modal content width and positioning
      modalContent.style.width = "calc(100% - 48px)" // Changed from 85%
      modalContent.style.maxWidth = "312px"
      modalContent.style.margin = "0 auto"

      const inputStyles = {
        width: "100%",
        boxSizing: "border-box", // Add this to prevent overlap
        padding: "12px 16px",
        marginBottom: "16px",
        border: "none",
        borderRadius: "12px",
        fontSize: "14px",
        lineHeight: "1.5",
        color: "var(--text-color)",
        background: "var(--bg-color)",
        boxShadow: "inset 2px 2px 5px var(--shadow-color1), inset -2px -2px 5px var(--shadow-color2)",
        transition: "all 0.3s ease",
        outline: "none"
      }

      Object.assign(modalInput.style, inputStyles)
      Object.assign(noteInput.style, {
        ...inputStyles,
        height: "120px",
        resize: "none",
        display: "none", // Ensure it's hidden by default
        marginBottom: "16px",
        fontSize: "13px"
      })
    }
  
    function updateFABPosition() {
      const addButton = document.getElementById("add-button")
      if (!addButton) return

      // Account for the body padding (24px on each side)
      const bodyPadding = 24
      const popupWidth = 360 // Fixed width of popup
      const fabWidth = 56
      
      // Calculate the exact center position
      const leftPosition = (popupWidth / 2) + bodyPadding - (fabWidth / 2)

      addButton.style.cssText = `
        position: fixed;
        bottom: 24px;
        left: ${leftPosition}px;
        width: 56px;
        height: 56px;
        border: none;
        border-radius: 50%;
        font-size: 24px;
        cursor: pointer;
        background: var(--bg-color);
        color: var(--text-color);
        box-shadow: 5px 5px 10px var(--shadow-color1), -5px -5px 10px var(--shadow-color2);
        transition: all 0.3s ease;
        z-index: 1000;
        display: flex;
        align-items: center;
        justify-content: center;
    `
    }
  
    function initPomodoroTimer() {
        chrome.storage.sync.get(['pomodoroState'], (result) => {
            if (result.pomodoroState) {
                const savedState = result.pomodoroState
                
                // If timer was running, calculate correct remaining time
                if (savedState.isRunning && savedState.lastStartTime) {
                    const now = Date.now()
                    const elapsed = Math.floor((now - savedState.lastStartTime) / 1000)
                    const duration = savedState.isBreak ? 
                        savedState.breakDuration : 
                        savedState.workDuration
                    
                    savedState.timeLeft = Math.max(0, duration - elapsed)
                    
                    // If time's up, trigger completion
                    if (savedState.timeLeft === 0) {
                        state.pomodoro = { ...state.pomodoro, ...savedState }
                        handleTimerComplete()
                        return
                    }
                }
                
                state.pomodoro = { ...state.pomoro, ...savedState }
                
                // Update UI
                elements.pomodoroTimer.textContent = formatTime(state.pomodoro.timeLeft)
                elements.pomodoroStatus.textContent = state.pomodoro.isBreak ? "Break" : "Focus"
                
                // If timer was running, hide start button and continue timer
                if (state.pomodoro.isRunning) {
                    elements.pomodoroStartButton.style.display = 'none'
                    runTimer()
                }
            }
        })

        // Create container with full-tab styling
        elements.pomodoroContainer.style.cssText = `
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
            padding: 24px;
            opacity: 0;
        `

        // Header with back button
        const header = document.createElement("div")
        header.style.cssText = `
            width: 100%;
            display: flex;
            align-items: center;
            margin-bottom: 48px;
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

        const timerTitle = document.createElement("div")
        timerTitle.textContent = "Pomodoro Timer"
        timerTitle.style.cssText = `
            flex: 1;
            text-align: center;
            font-size: 18px;
            font-weight: 500;
            margin-right: 40px; // Compensate for back button
        `

        header.appendChild(backButton)
        header.appendChild(timerTitle)

        // Timer display
        const timerContainer = document.createElement("div")
        timerContainer.style.cssText = `
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            flex: 1;
            gap: 24px;
        `

        const statusLabel = document.createElement("div")
        statusLabel.textContent = state.pomodoro.isBreak ? "Break" : "Focus"
        statusLabel.style.cssText = `
            font-size: 16px;
            font-weight: 500;
            opacity: 0.8;
        `

        elements.pomodoroTimer.style.cssText = `
            font-size: 72px;
            font-weight: 600;
            font-family: 'SF Mono', 'Roboto Mono', monospace;
            color: var(--text-color);
            letter-spacing: 4px;
        `
        elements.pomodoroTimer.textContent = formatTime(state.pomodoro.timeLeft)

        // Controls
        const controls = document.createElement("div")
        controls.style.cssText = `
            display: flex;
            gap: 32px;
            align-items: center;
            margin-top: 32px;
        `

        // Create buttons with consistent styling
        const createButton = (icon, onClick, title) => {
            const button = document.createElement("button")
            button.innerHTML = icon
            button.onclick = onClick
            button.title = title
            button.style.cssText = `
                background: none;
                border: none;
                cursor: pointer;
                padding: 12px;
                color: var(--text-color);
                opacity: 0.8;
                transition: all 0.2s ease;
                display: flex;
                align-items: center;
                justify-content: center;
            `
            button.addEventListener("mouseenter", () => {
                button.style.opacity = "1"
                button.style.transform = "scale(1.1)"
            })
            button.addEventListener("mouseleave", () => {
                button.style.opacity = "0.8"
                button.style.transform = "scale(1)"
            })
            return button
        }

        const startButton = createButton(playIcon, startPomodoro, "Start Timer")
        const resetButton = createButton(resetIcon, resetPomodoro, "Reset Timer")
        const settingsButton = createButton(settingsIcon, showPomodoroSettings, "Timer Settings")

        controls.appendChild(resetButton)
        controls.appendChild(startButton)
        controls.appendChild(settingsButton)

        // Assemble UI
        timerContainer.appendChild(statusLabel)
        timerContainer.appendChild(elements.pomodoroTimer)
        timerContainer.appendChild(controls)

        elements.pomodoroContainer.appendChild(header)
        elements.pomodoroContainer.appendChild(timerContainer)

        // Add to DOM
        document.getElementById("app").appendChild(elements.pomodoroContainer)

        // Store references
        elements.pomodoroStatus = statusLabel
        elements.pomodoroStartButton = startButton
    }

    function savePomodoroState() {
        chrome.storage.sync.set({
            pomodoroState: {
                timeLeft: state.pomodoro.timeLeft,
                workDuration: state.pomodoro.workDuration,
                breakDuration: state.pomodoro.breakDuration,
                isBreak: state.pomodoro.isBreak,
                isRunning: state.pomodoro.isRunning,
                lastStartTime: state.pomodoro.lastStartTime,
                lastPauseTime: state.pomodoro.lastPauseTime
            }
        })
    }

    function showPomodoro() {
        state.pomodoro.isVisible = true
        
        // Hide main content and FAB
        const content = document.getElementById("content")
        const addButton = document.getElementById("add-button")
        const tabs = document.getElementById("tabs")
        
        content.style.opacity = "0"
        addButton.style.display = "none"
        tabs.style.opacity = "0"
        
        // Show pomodoro with animation
        requestAnimationFrame(() => {
            elements.pomodoroContainer.style.opacity = "1"
            elements.pomodoroContainer.style.transform = "translateY(0)"
        })
    }

    function hidePomodoro() {
        state.pomodoro.isVisible = false
        
        // Hide pomodoro with animation
        elements.pomodoroContainer.style.transform = "translateY(-100%)"
        elements.pomodoroContainer.style.opacity = "0"
        
        // Show main content and FAB
        const content = document.getElementById("content")
        const addButton = document.getElementById("add-button")
        const tabs = document.getElementById("tabs")
        
        content.style.opacity = "1"
        addButton.style.display = "flex"
        tabs.style.opacity = "1"
    }

    function startPomodoro() {
        if (!state.pomodoro.isRunning) {
            state.pomodoro.isRunning = true
            state.pomodoro.lastStartTime = Date.now()
            
            elements.pomodoroStartButton.style.display = 'none' // Hide start button
            elements.pomodoroTimer.style.opacity = '1'
            
            runTimer()
            savePomodoroState()
        }
    }

    function runTimer() {
        const now = Date.now()
        const elapsed = Math.floor((now - state.pomodoro.lastStartTime) / 1000)
        const duration = state.pomodoro.isBreak ? 
            state.pomodoro.breakDuration : 
            state.pomodoro.workDuration
        
        state.pomodoro.timeLeft = Math.max(0, duration - elapsed)
        elements.pomodoroTimer.textContent = formatTime(state.pomodoro.timeLeft)
        
        if (state.pomodoro.timeLeft > 0) {
            savePomodoroState()
            requestAnimationFrame(() => setTimeout(runTimer, 1000))
        } else {
            handleTimerComplete()
        }
    }

    function handleTimerComplete() {
        state.pomodoro.isRunning = false
        state.pomodoro.isBreak = !state.pomodoro.isBreak
        state.pomodoro.timeLeft = state.pomodoro.isBreak ? 
            state.pomodoro.breakDuration : 
            state.pomodoro.workDuration
        
        elements.pomodoroStartButton.style.display = 'block' // Show start button again
        elements.pomodoroStatus.textContent = state.pomodoro.isBreak ? "Break" : "Focus"
        elements.pomodoroTimer.textContent = formatTime(state.pomodoro.timeLeft)

        playNotificationSound()
        showTimerNotification(state.pomodoro.isBreak ? 
            "Time for a break!" : 
            "Break's over - back to work!")
    }

    function playNotificationSound() {
        try {
            const notification = new Audio(chrome.runtime.getURL('notification.mp3'))
            notification.play().catch(error => {
                console.log('Audio playback failed:', error)
                // Fallback to system beep
                new Audio('data:audio/wav;base64,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').play()
            })
        } catch (error) {
            console.log('Audio creation failed:', error)
        }
    }

    function showTimerNotification(message) {
        // Browser notification
        chrome.notifications.create({
            type: 'basic',
            iconUrl: 'icon128.png',
            title: state.pomodoro.isBreak ? 'Break Time!' : 'Work Time!',
            message,
            requireInteraction: true, // Keep notification until user interacts
            silent: false // Play system sound
        })

        // In-app notification
        const notification = document.createElement("div")
        notification.className = "timer-notification"
        notification.textContent = message
        notification.style.position = "fixed"
        notification.style.bottom = "24px"
        notification.style.left = "50%"
        notification.style.transform = "translateX(-50%)"
        notification.style.padding = "12px 24px"
        notification.style.background = "var(--bg-color)"
        notification.style.borderRadius = "8px"
        notification.style.boxShadow = "0 4px 12px var(--shadow-color1)"
        notification.style.fontSize = "14px"
        notification.style.zIndex = "2000"
        notification.style.opacity = "0"
        notification.style.transition = "all 0.3s ease"

        document.body.appendChild(notification)
        
        // Animate in
        setTimeout(() => notification.style.opacity = "1", 100)
        
        // Remove after delay
        setTimeout(() => {
            notification.style.opacity = "0"
            setTimeout(() => notification.remove(), 300)
        }, 3000)
    }

    function showPomodoroSettings() {
        const modal = document.createElement("div")
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
                <input type="number" id="work-duration" value="${state.pomodoro.workDuration / 60}" min="1" max="60" 
                    style="width: 100%; padding: 8px; border: 1px solid var(--text-color); border-radius: 4px; background: none; color: var(--text-color);">
            </div>
            <div style="margin-bottom: 20px;">
                <label style="display: block; margin-bottom: 8px; opacity: 0.8;">Break Duration (min)</label>
                <input type="number" id="break-duration" value="${state.pomodoro.breakDuration / 60}" min="1" max="30"
                    style="width: 100%; padding: 8px; border: 1px solid var(--text-color); border-radius: 4px; background: none; color: var(--text-color);">
            </div>
            <div style="display: flex; gap: 8px; justify-content: flex-end;">
                <button id="cancel-settings" style="padding: 8px 16px; background: none; border: none; cursor: pointer; opacity: 0.8; color: var(--text-color);">Cancel</button>
                <button id="save-settings" style="padding: 8px 16px; background: var(--text-color); color: var(--bg-color); border: none; border-radius: 4px; cursor: pointer;">Save</button>
            </div>
        `

        modal.innerHTML = content
        document.body.appendChild(modal)

        requestAnimationFrame(() => {
            modal.style.opacity = "1"
            modal.style.transform = "translate(-50%, -50%)"
        })

        // Simplified event handlers
        document.getElementById('save-settings').onclick = () => {
            const workDuration = Math.min(60, Math.max(1, parseInt(document.getElementById('work-duration').value))) * 60
            const breakDuration = Math.min(30, Math.max(1, parseInt(document.getElementById('break-duration').value))) * 60

            state.pomodoro.workDuration = workDuration
            state.pomodoro.breakDuration = breakDuration
            
            // Reset timer if not running
            if (!state.pomodoro.isRunning) {
                state.pomodoro.timeLeft = state.pomodoro.isBreak ? breakDuration : workDuration
                elements.pomodoroTimer.textContent = formatTime(state.pomodoro.timeLeft)
            }

            // Save less frequently to avoid quota issues
            setTimeout(() => savePomodoroState(), 1000)
            modal.remove()
        }

        document.getElementById('cancel-settings').onclick = () => modal.remove()
    }

    function formatTime(seconds) {
        const mins = Math.floor(seconds / 60)
        const secs = seconds % 60
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
    }
  
    function addCompletedHistoryToggle() {
        const toggle = document.createElement("button")
        toggle.textContent = state.showCompletedHistory ? "Hide Completed History" : "Show Completed History"
        toggle.style.fontSize = "12px"
        toggle.style.padding = "4px 8px"
        toggle.style.marginBottom = "8px"
        toggle.style.opacity = "0.7"
        toggle.style.background = "none"
        toggle.style.border = "none"
        toggle.style.cursor = "pointer"
        toggle.style.color = "var(--text-color)"
        toggle.style.transition = "all 0.2s ease"

        toggle.addEventListener("mouseenter", () => toggle.style.opacity = "1")
        toggle.addEventListener("mouseleave", () => toggle.style.opacity = "0.7")
        toggle.onclick = () => {
            state.showCompletedHistory = !state.showCompletedHistory
            toggle.textContent = state.showCompletedHistory ? "Hide Completed History" : "Show Completed History"
            renderItems()
        }

        elements.tasksList.parentElement.insertBefore(toggle, elements.tasksList)
    }
  
    function resetPomodoro() {
        state.pomodoro.isRunning = false
        state.pomodoro.isBreak = false
        state.pomodoro.timeLeft = state.pomodoro.workDuration
        state.pomodoro.lastStartTime = null
        
        elements.pomodoroTimer.textContent = formatTime(state.pomodoro.timeLeft)
        elements.pomodoroStartButton.style.display = 'block'
        elements.pomodoroStatus.textContent = "Focus"
        
        savePomodoroState()
    }
  
    init()
  })
  
  
  
  