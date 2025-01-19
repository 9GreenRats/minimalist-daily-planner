# Minimalist Daily Planner Chrome Extension

A high-fidelity Chrome extension for daily planning with a minimalist design approach, emphasizing clean aesthetics and efficient functionality.

## Features

- Task Management
  - Add, edit, and delete tasks
  - Mark tasks as complete/incomplete
  - Completed tasks move to the bottom of the list
- Note Taking
  - Add, edit, and delete notes
- Clean, minimalist design with neumorphic UI elements
- Dark/Light theme toggle
- Persistent storage using Chrome's sync storage
- Micro-interactions for improved user experience
- Responsive layout

## Installation

1. Clone this repository or download the ZIP file and extract it.
2. Open Google Chrome and navigate to `chrome://extensions`.
3. Enable "Developer mode" in the top right corner.
4. Click "Load unpacked" and select the directory containing the extension files.
5. The Minimalist Daily Planner extension should now appear in your Chrome toolbar.

## Usage

1. Click on the extension icon in the Chrome toolbar to open the planner.
2. Use the tabs at the top to switch between Tasks and Notes.
3. To add a new task or note, click the "+" button at the bottom of the popup.
4. For tasks:
   - Enter the task text and press Enter or click Save.
   - Click the checkmark button to mark a task as complete.
   - Click the pencil icon to edit a task.
   - Click the "x" button to delete a task.
5. For notes:
   - Enter the note title and content, then click Save.
   - Click the pencil icon to edit a note.
   - Click the "x" button to delete a note.
6. Use the sun/moon icon in the top left to toggle between light and dark themes.

## Development

To modify or enhance the extension:

1. Make changes to the relevant files (popup.html, popup.js).
2. If you're adding new features or modifying existing ones, update the `manifest.json` file if necessary.
3. To test your changes:
   - Go to `chrome://extensions/` in Chrome.
   - Find the Minimalist Daily Planner extension.
   - Click the "Reload" button for the extension.
4. Your changes should now be reflected in the extension.

### Project Structure

- `manifest.json`: Extension configuration file
- `popup.html`: Main HTML file for the extension popup
- `popup.js`: JavaScript file containing the main functionality
- `background.js`: Background script for handling alarms and notifications
- `icon16.png`, `icon48.png`, `icon128.png`: Extension icons

### Potential Improvements

- Implement drag-and-drop functionality for reordering tasks
- Add due dates and priority levels for tasks
- Implement a search functionality for tasks and notes
- Add categories or tags for better organization
- Implement data export/import functionality
- Add keyboard shortcuts for quick actions

## License

This project is licensed under the MIT License.

