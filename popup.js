document.addEventListener('DOMContentLoaded', () => {
    const state = {
        tasks: [],
        notes: [],
        currentView: 'tasks',
        currentDate: new Date(),
        editingItemIndex: null,
        theme: 'light'
    };

    const elements = {
        date: document.getElementById('date'),
        tasksTab: document.getElementById('tasks-tab'),
        notesTab: document.getElementById('notes-tab'),
        tasksList: document.getElementById('tasks-list'),
        notesList: document.getElementById('notes-list'),
        addButton: document.getElementById('add-button'),
        modal: document.getElementById('modal'),
        modalInput: document.getElementById('modal-input'),
        noteInput: document.getElementById('note-input'),
        saveButton: document.getElementById('save-button'),
        cancelButton: document.getElementById('cancel-button'),
        themeToggle: document.getElementById('theme-toggle'),
        content: document.getElementById('content')
    };

    function init() {
        updateDateDisplay();
        loadStoredData();
        attachEventListeners();
        updateModalPlaceholder();
        setInitialTabState();
        loadTheme();
        setContentHeight();
    }

    function loadTheme() {
        chrome.storage.sync.get(['theme'], (result) => {
            if (result.theme) {
                state.theme = result.theme;
                applyTheme();
            }
        });
    }

    function toggleTheme() {
        state.theme = state.theme === 'light' ? 'dark' : 'light';
        applyTheme();
        chrome.storage.sync.set({ theme: state.theme });
    }

    function applyTheme() {
        document.documentElement.setAttribute('data-theme', state.theme);
        const themeToggle = document.getElementById('theme-toggle');
        themeToggle.setAttribute('aria-label', state.theme);
    }

    function updateDateDisplay() {
        const options = { weekday: 'long', month: 'long', day: 'numeric' };
        elements.date.textContent = state.currentDate.toLocaleDateString('en-US', options);
    }

    function setInitialTabState() {
        if (state.currentView === 'tasks') {
            elements.tasksTab.style.boxShadow = '3px 3px 6px var(--shadow-color1), -3px -3px 6px var(--shadow-color2)';
            elements.notesTab.style.boxShadow = 'none';
        } else {
            elements.notesTab.style.boxShadow = '3px 3px 6px var(--shadow-color1), -3px -3px 6px var(--shadow-color2)';
            elements.tasksTab.style.boxShadow = 'none';
        }
    }

    function renderItems() {
        const currentItems = state.currentView === 'tasks' ? state.tasks : state.notes;
        const listElement = state.currentView === 'tasks' ? elements.tasksList : elements.notesList;
        
        listElement.innerHTML = '';
        
        // Sort tasks: incomplete first, then completed
        if (state.currentView === 'tasks') {
            currentItems.sort((a, b) => {
                if (a.completed === b.completed) return 0;
                return a.completed ? 1 : -1;
            });
        }

        currentItems.forEach((item, index) => {
            if (isSameDay(new Date(item.date), state.currentDate)) {
                const li = document.createElement('li');
                li.style.padding = '12px';
                li.style.marginBottom = '8px';
                li.style.borderRadius = '8px';
                li.style.background = 'var(--bg-color)';
                li.style.boxShadow = '2px 2px 4px var(--shadow-color1), -2px -2px 4px var(--shadow-color2)';
                li.style.transition = 'all 0.3s ease';

                if (state.currentView === 'tasks') {
                    li.classList.add('task-item');
                    renderTaskItem(li, item, index);
                } else {
                    renderNoteItem(li, item, index);
                }

                listElement.appendChild(li);
            }
        });
        setContentHeight();
    }

    function renderTaskItem(li, item, index) {
        const title = document.createElement('div');
        title.textContent = item.text;
        title.style.fontSize = '16px';
        title.style.fontWeight = '500';
        title.style.color = item.completed ? '#999' : 'var(--text-color)';
        title.style.textDecoration = item.completed ? 'line-through' : 'none';
        title.style.marginBottom = '8px';

        const actions = document.createElement('div');
        actions.style.display = 'flex';
        actions.style.justifyContent = 'space-between';
        actions.style.alignItems = 'center';
        actions.style.opacity = '0';
        actions.style.transition = 'opacity 0.2s ease';

        const toggleBtn = createActionButton(item.completed ? '↩' : '✓', () => toggleTask(index));
        const deleteBtn = createActionButton('×', () => deleteItem(index));
        
        actions.appendChild(toggleBtn);
        if (!item.completed) {
            const editBtn = createActionButton('✎', () => startEditing(index));
            actions.appendChild(editBtn);
        }
        actions.appendChild(deleteBtn);

        li.appendChild(title);
        li.appendChild(actions);

        li.style.transform = 'translateY(0)';
        li.style.opacity = '1';
        li.style.transition = 'transform 0.3s ease, opacity 0.3s ease, background-color 0.3s ease';

        li.addEventListener('mouseenter', () => {
            li.style.transform = 'translateY(-2px)';
            li.style.boxShadow = '4px 4px 8px var(--shadow-color1), -4px -4px 8px var(--shadow-color2)';
            actions.style.opacity = '1';
        });

        li.addEventListener('mouseleave', () => {
            li.style.transform = 'translateY(0)';
            li.style.boxShadow = '2px 2px 4px var(--shadow-color1), -2px -2px 4px var(--shadow-color2)';
            actions.style.opacity = '0';
        });
    }

    function renderNoteItem(li, item, index) {
        const lines = item.text.split('\n');
        const title = document.createElement('div');
        title.textContent = lines[0];
        title.style.fontSize = '18px';
        title.style.fontWeight = '600';
        title.style.marginBottom = '8px';
        title.style.color = 'var(--text-color)';

        const preview = document.createElement('div');
        const previewText = lines.slice(1).join('\n');
        preview.textContent = previewText.length > 100 ? 
            previewText.substring(0, 100) + '...' : 
            previewText;
        preview.style.fontSize = '16px';
        preview.style.color = 'var(--text-color)';
        preview.style.opacity = '0.8';

        const actions = document.createElement('div');
        actions.style.opacity = '0';
        actions.style.marginTop = '12px';
        actions.style.display = 'flex';
        actions.style.justifyContent = 'flex-start';
        actions.style.gap = '12px';
        actions.style.transition = 'opacity 0.2s ease';

        const editBtn = createActionButton('✎', () => startEditing(index));
        const deleteBtn = createActionButton('×', () => deleteItem(index));
        actions.appendChild(editBtn);
        actions.appendChild(deleteBtn);

        li.appendChild(title);
        li.appendChild(preview);
        li.appendChild(actions);

        li.addEventListener('mouseenter', () => actions.style.opacity = '1');
        li.addEventListener('mouseleave', () => actions.style.opacity = '0');
    }

    function createActionButton(text, onClick) {
        const button = document.createElement('button');
        button.textContent = text;
        button.style.border = 'none';
        button.style.background = 'none';
        button.style.padding = '4px';
        button.style.cursor = 'pointer';
        button.style.color = 'var(--text-color)';
        button.style.opacity = '0.7';
        button.style.fontSize = '16px';
        button.style.transition = 'all 0.2s ease';
        button.style.width = '24px';
        button.style.height = '24px';
        button.style.borderRadius = '50%';
        button.style.display = 'flex';
        button.style.justifyContent = 'center';
        button.style.alignItems = 'center';

        button.addEventListener('click', (e) => {
            e.stopPropagation();
            onClick();
        });
        button.addEventListener('mouseenter', () => {
            button.style.opacity = '1';
            button.style.transform = 'scale(1.1)';
        });
        button.addEventListener('mouseleave', () => {
            button.style.opacity = '0.7';
            button.style.transform = 'scale(1)';
        });
        button.addEventListener('mousedown', () => {
            button.style.transform = 'scale(0.95)';
        });
        button.addEventListener('mouseup', () => {
            button.style.transform = 'scale(1.1)';
        });
        return button;
    }

    function toggleTask(index) {
        if (index >= 0 && index < state.tasks.length) {
            state.tasks[index].completed = !state.tasks[index].completed;
            saveData();
            renderItems();
        }
    }

    function startEditing(index) {
        state.editingItemIndex = index;
        const currentItems = state.currentView === 'tasks' ? state.tasks : state.notes;
        const item = currentItems[index];

        if (state.currentView === 'tasks') {
            elements.modalInput.value = item.text;
            elements.noteInput.style.display = 'none';
        } else {
            const lines = item.text.split('\n');
            elements.modalInput.value = lines[0];
            elements.noteInput.value = lines.slice(1).join('\n');
            elements.noteInput.style.display = 'block';
        }

        elements.modal.style.display = 'block';
        elements.modalInput.focus();
    }

    function saveItem() {
        let text;
        if (state.currentView === 'tasks') {
            text = elements.modalInput.value.trim();
        } else {
            const title = elements.modalInput.value.trim();
            const content = elements.noteInput.value.trim();
            text = title + (content ? '\n' + content : '');
        }

        if (!text) return;

        if (state.editingItemIndex !== null) {
            const currentItems = state.currentView === 'tasks' ? state.tasks : state.notes;
            currentItems[state.editingItemIndex].text = text;
        } else {
            const newItem = {
                text,
                date: state.currentDate.toISOString(),
                completed: false
            };
            
            if (state.currentView === 'tasks') {
                state.tasks.push(newItem);
            } else {
                state.notes.push(newItem);
            }
        }

        saveData();
        renderItems();
        closeModal();
    }

    function deleteItem(index) {
        const currentItems = state.currentView === 'tasks' ? state.tasks : state.notes;
        if (index >= 0 && index < currentItems.length) {
            currentItems.splice(index, 1);
            saveData();
            renderItems();
        }
    }

    function closeModal() {
        elements.modal.style.display = 'none';
        elements.modalInput.value = '';
        elements.noteInput.value = '';
        state.editingItemIndex = null;
        elements.noteInput.style.display = 'none';
    }

    function updateModalPlaceholder() {
        elements.modalInput.placeholder = state.currentView === 'tasks' ? 
            'Enter task...' : 'Note title...';
        elements.noteInput.placeholder = 'Enter note content...';
    }

    function saveData() {
        chrome.storage.sync.set({
            tasks: state.tasks,
            notes: state.notes,
            theme: state.theme
        });
    }

    function loadStoredData() {
        chrome.storage.sync.get(['tasks', 'notes', 'theme'], (result) => {
            state.tasks = result.tasks || [];
            state.notes = result.notes || [];
            state.theme = result.theme || 'light';
            applyTheme();
            renderItems();
        });
    }

    function attachEventListeners() {
        elements.themeToggle.addEventListener('click', toggleTheme);
        elements.themeToggle.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                toggleTheme();
            }
        });

        elements.tasksTab.addEventListener('click', () => {
            state.currentView = 'tasks';
            elements.tasksList.style.display = 'flex';
            elements.notesList.style.display = 'none';
            elements.tasksTab.style.boxShadow = '3px 3px 6px var(--shadow-color1), -3px -3px 6px var(--shadow-color2)';
            elements.notesTab.style.boxShadow = 'none';
            updateModalPlaceholder();
            renderItems();
        });

        elements.notesTab.addEventListener('click', () => {
            state.currentView = 'notes';
            elements.tasksList.style.display = 'none';
            elements.notesList.style.display = 'flex';
            elements.notesTab.style.boxShadow = '3px 3px 6px var(--shadow-color1), -3px -3px 6px var(--shadow-color2)';
            elements.tasksTab.style.boxShadow = 'none';
            updateModalPlaceholder();
            renderItems();
        });

        elements.addButton.addEventListener('mousedown', () => {
            elements.addButton.style.boxShadow = 'inset 3px 3px 6px var(--shadow-color1), inset -3px -3px 6px var(--shadow-color2)';
            elements.addButton.style.transform = 'scale(0.95)';
        });

        elements.addButton.addEventListener('mouseup', () => {
            elements.addButton.style.boxShadow = '5px 5px 10px var(--shadow-color1), -5px -5px 10px var(--shadow-color2)';
            elements.addButton.style.transform = 'scale(1)';
            elements.modal.style.display = 'block';
            elements.modalInput.focus();
            
            // Show note input if in notes view
            if (state.currentView === 'notes') {
                elements.noteInput.style.display = 'block';
            }
        });

        elements.saveButton.addEventListener('click', saveItem);
        elements.cancelButton.addEventListener('click', closeModal);

        elements.modalInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && state.currentView === 'tasks') {
                saveItem();
            }
        });

        elements.modal.addEventListener('click', (e) => {
            if (e.target === elements.modal) {
                closeModal();
            }
        });
    }

    function isSameDay(date1, date2) {
        return date1.getFullYear() === date2.getFullYear() &&
               date1.getMonth() === date2.getMonth() &&
               date1.getDate() === date2.getDate();
    }

    function setContentHeight() {
        const headerHeight = document.querySelector('h1').offsetHeight;
        const tabsHeight = document.getElementById('tabs').offsetHeight;
        const addButtonHeight = document.getElementById('add-button').offsetHeight;
        const totalHeight = document.body.offsetHeight;
        const contentHeight = totalHeight - headerHeight - tabsHeight - addButtonHeight - 72; // 72 for padding
        elements.content.style.height = `${contentHeight}px`;
    }

    init();
    window.addEventListener('resize', setContentHeight);
});

