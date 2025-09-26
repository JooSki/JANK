"# JANK - Just Another Note Keeper

A modern markdown editor with side-by-side editing and preview functionality built with Electron.

## Features

- **Side-by-side editing**: View your markdown source and rendered output simultaneously
- **Multiple view modes**: Switch between side-by-side, editor-only, or preview-only views  
- **Real-time preview**: See your changes as you type
- **Comprehensive theming**: Light/dark mode toggle with 6 preset themes
- **Custom color themes**: Create your own color schemes with the theme customization panel
- **Theme persistence**: Your theme preferences are automatically saved
- **Syntax highlighting**: Code blocks are highlighted using highlight.js
- **File operations**: Create, open, and save markdown files
- **Synchronized scrolling**: Keep editor and preview in sync while scrolling
- **Task list support**: GitHub-flavored markdown task lists
- **Word and character count**: Keep track of your document statistics
- **Keyboard shortcuts**: Efficient workflow with hotkeys

## Keyboard Shortcuts

- `Ctrl+N` - New file
- `Ctrl+O` - Open file
- `Ctrl+S` - Save file
- `Ctrl+Shift+S` - Save as
- `Ctrl+1` - Side-by-side view
- `Ctrl+2` - Editor-only view
- `Ctrl+3` - Preview-only view
- `F12` - Toggle developer tools

## Theming

JANK includes a comprehensive theming system with multiple options:

### Built-in Themes
- **☀️ Light** - Clean, bright interface (default)
- **🌙 Dark** - Easy on the eyes for night coding
- **🌅 Solarized** - Popular low-contrast theme
- **🌃 Monokai** - Classic dark theme with vibrant colors  
- **📝 GitHub** - Familiar GitHub-style appearance
- **🧛 Dracula** - Popular vampire-themed dark mode

### Theme Controls
- **Theme Toggle Button**: Quick switch between light and dark modes
- **Colors Button**: Open the theme customization panel
- **Custom Colors**: Create your own themes with color pickers
- **Auto-save**: All theme preferences are automatically saved

### Creating Custom Themes
1. Click the **🎨 Colors** button in the toolbar
2. Choose a preset theme or customize colors:
   - **Background**: Main background color
   - **Text**: Primary text color  
   - **Accent**: Buttons and highlights
   - **Editor Background**: Code editor background
3. Click **Apply Custom Theme** to save your creation

Themes apply instantly and persist between sessions!

## Installation and Setup

1. Make sure you have Node.js installed on your system
2. Navigate to the project directory
3. Install dependencies:
   ```bash
   npm install
   ```
4. Run the application:
   ```bash
   npm start
   ```

## Development

To run in development mode:
```bash
npm run dev
```

## Building Executables

To create distributable executables for different platforms:

### Install build dependencies
```bash
npm install
```

### Build for all platforms
```bash
npm run build
```

### Build for specific platforms
```bash
# Windows (creates .exe installer and portable)
npm run build:win

# macOS (creates .dmg installer)
npm run build:mac

# Linux (creates AppImage and .deb)
npm run build:linux
```

### Output
Built applications will be in the `dist/` folder:
- **Windows**: `.exe` installer and portable `.exe`
- **macOS**: `.dmg` installer (supports Intel and Apple Silicon)
- **Linux**: `.AppImage` and `.deb` packages

## Technologies Used

- **Electron** - Cross-platform desktop application framework
- **Marked** - Fast markdown parser and compiler
- **Highlight.js** - Syntax highlighting for code blocks
- **HTML/CSS/JavaScript** - Frontend technologies

## File Structure

```
JANK/
├── main.js          # Main Electron process
├── renderer.js      # Renderer process (UI logic)
├── index.html       # Application UI
├── styles.css       # Application styling
├── package.json     # Project dependencies and scripts
└── README.md        # This file
```

## License

MIT License" 
