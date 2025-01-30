document.addEventListener("DOMContentLoaded", () => {
    const state = {
      tasks: [],
      notes: [],
      currentView: "tasks",
      currentDate: new Date(),
      editingItemIndex: null,
      theme: "light",
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
    }
  
    function init() {
      updateDateDisplay()
      loadStoredData()
      attachEventListeners()
      updateModalPlaceholder()
      setInitialTabState()
      loadTheme()
      setContentHeight()
      updateModalStyles()
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
        if (state.currentView === "tasks" && item.completed && !isSameDay(new Date(item.date), state.currentDate)) {
          return // Skip completed tasks that are not from today
        }
  
        const li = document.createElement("li")
        li.style.padding = "2px 8px"
        li.style.minHeight = "16px"
        li.style.display = "flex"
        li.style.flexDirection = "row"
        li.style.alignItems = "center"
        li.style.justifyContent = "space-between"
        li.style.gap = "8px"
        li.style.marginBottom = "0"
        li.style.borderRadius = "0"
        li.style.boxShadow = "none"
        li.style.transition = "all 0.2s ease"
  
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
        elements.tasksList.style.padding = "2px 8px"
        elements.tasksList.style.display = "flex"
        elements.tasksList.style.flexDirection = "column"
        elements.tasksList.style.gap = "0"
      }
    }
  
    function renderTaskItem(li, item, index) {
      li.style.padding = "2px 8px"
      li.style.minHeight = "16px"
      li.style.marginBottom = "0"
      li.style.display = "flex"
      li.style.flexDirection = "row"
      li.style.alignItems = "center"
      li.style.justifyContent = "space-between"
      li.style.gap = "8px"
      li.style.borderRadius = "0"
      li.style.boxShadow = "none"
      li.style.transition = "all 0.2s ease"
  
      const leftSection = document.createElement("div")
      leftSection.style.display = "flex"
      leftSection.style.flexDirection = "column"
      leftSection.style.gap = "0px"
      leftSection.style.flex = "1"
      leftSection.style.minWidth = "0"
      leftSection.style.cursor = "pointer"
  
      const title = document.createElement("div")
      title.textContent = item.text
      title.style.fontSize = "13px"
      title.style.fontWeight = "500"
      title.style.color = item.completed ? "#999" : "var(--text-color)"
      title.style.textDecoration = item.completed ? "line-through" : "none"
      title.style.whiteSpace = "normal"
      title.style.wordBreak = "break-word"
      title.style.lineHeight = "1.1"
      title.style.textAlign = "left"
  
      const dateLabel = document.createElement("div")
      dateLabel.textContent = formatDate(new Date(item.date))
      dateLabel.style.fontSize = "10px"
      dateLabel.style.color = "var(--text-color)"
      dateLabel.style.opacity = "0.6"
      dateLabel.style.marginTop = "0"
      dateLabel.style.lineHeight = "1"
      dateLabel.style.textAlign = "left"
  
      leftSection.appendChild(title)
      leftSection.appendChild(dateLabel)
  
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
  
      const toggleBtn = createActionButton(item.completed ? "↩" : "✓", () => toggleTask(index))
      const deleteBtn = createActionButton("×", () => deleteItem(index))
  
      actions.appendChild(toggleBtn)
      if (!item.completed) {
        const editBtn = createActionButton("✎", () => startEditing(index))
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
  
      const editBtn = createActionButton("✎", () => startEditing(index))
      const deleteBtn = createActionButton("×", () => deleteItem(index))
      actions.appendChild(editBtn)
      actions.appendChild(deleteBtn)
  
      // Content section
      const contentSection = document.createElement("div")
      contentSection.style.display = "none"
      contentSection.style.marginTop = "8px"
      const previewText = lines.slice(1).join("\n")
      
      if (previewText) {
          const content = document.createElement("div")
          content.textContent = previewText
          content.style.fontSize = "13px"
          content.style.color = "var(--text-color)"
          content.style.opacity = "0.85"
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
      }
  
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
  
    function createActionButton(text, onClick) {
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
      if (index >= 0 && index < state.tasks.length) {
        state.tasks[index].completed = !state.tasks[index].completed
        saveData()
        renderItems()
      }
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
  
    function saveItem() {
      let text
      if (state.currentView === "tasks") {
        text = elements.modalInput.value.trim()
      } else {
        const title = elements.modalInput.value.trim()
        const content = elements.noteInput.value.trim()
        text = title + (content ? "\n" + content : "")
      }
  
      if (!text) return
  
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
      const headerHeight = document.querySelector("h1").offsetHeight
      const tabsHeight = document.getElementById("tabs").offsetHeight
      const addButtonHeight = document.getElementById("add-button").offsetHeight
      const totalHeight = document.body.offsetHeight
      const contentHeight = totalHeight - headerHeight - tabsHeight - addButtonHeight - 72
      elements.content.style.height = `${contentHeight}px`
    }
  
    function updateModalStyles() {
      const modalInput = document.getElementById("modal-input")
      const noteInput = document.getElementById("note-input")
      const saveButton = document.getElementById("save-button")
      const cancelButton = document.getElementById("cancel-button")
  
      const inputStyles = {
        width: "100%",
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
        marginBottom: "16px",
        fontSize: "13px"
      })
  
      const buttonStyles = {
        padding: "10px 20px",
        border: "none",
        borderRadius: "8px",
        fontSize: "13px",
        fontWeight: "500",
        cursor: "pointer",
        transition: "all 0.3s ease",
        background: "var(--bg-color)",
        color: "var(--text-color)",
        boxShadow: "3px 3px 6px var(--shadow-color1), -3px -3px 6px var(--shadow-color2)"
      }
  
      Object.assign(saveButton.style, buttonStyles, {
        background: "var(--accent-color, var(--bg-color))"
      })
      Object.assign(cancelButton.style, buttonStyles)
  
      modalInput.addEventListener("focus", () => {
        modalInput.style.boxShadow = "inset 3px 3px 7px var(--shadow-color1), inset -3px -3px 7px var(--shadow-color2)"
      })
  
      noteInput.addEventListener("focus", () => {
        noteInput.style.boxShadow = "inset 3px 3px 7px var(--shadow-color1), inset -3px -3px 7px var(--shadow-color2)"
      })
  
      modalInput.addEventListener("blur", () => {
        modalInput.style.boxShadow = "inset 2px 2px 5px var(--shadow-color1), inset -2px -2px 5px var(--shadow-color2)"
      })
  
      noteInput.addEventListener("blur", () => {
        noteInput.style.boxShadow = "inset 2px 2px 5px var(--shadow-color1), inset -2px -2px 5px var(--shadow-color2)"
      })
    }
  
    init()
    window.addEventListener("resize", setContentHeight)
  })
  
  