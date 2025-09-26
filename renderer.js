const { ipcRenderer } = require('electron');

class MarkdownEditor {
    constructor() {
        this.editor = document.getElementById('editor');
        this.preview = document.getElementById('preview');
        this.mainContainer = document.getElementById('main-container');
        this.syncScrollEnabled = true;
        this.currentFilePath = null;
        this.isModified = false;
        this.currentTheme = 'light';
        
        this.initializeMarked();
        this.initializeTheme();
        this.setupEventListeners();
        this.setupIpcListeners();
        this.updatePreview();
        this.updateStats();
        this.updateCursorPosition();
    }

    initializeMarked() {
        // Configure marked for better markdown parsing
        marked.setOptions({
            highlight: function(code, lang) {
                if (lang && hljs.getLanguage(lang)) {
                    try {
                        return hljs.highlight(code, { language: lang }).value;
                    } catch (err) {}
                }
                return hljs.highlightAuto(code).value;
            },
            breaks: true,
            gfm: true
        });
    }

    initializeTheme() {
        // Load saved theme from localStorage
        const savedTheme = localStorage.getItem('jank-theme') || 'light';
        
        // Load custom colors if they exist
        const customColors = localStorage.getItem('jank-custom-colors');
        if (customColors) {
            this.customColors = JSON.parse(customColors);
            if (savedTheme === 'custom') {
                this.setCustomColors(this.customColors);
                this.currentTheme = 'custom';
                document.documentElement.setAttribute('data-theme', 'custom');
                
                // Update theme button for custom theme
                const themeBtn = document.getElementById('theme-toggle-btn');
                const span = themeBtn.querySelector('span');
                span.textContent = '🎨';
                themeBtn.childNodes[2].textContent = ' Custom';
                themeBtn.classList.add('active');
            } else {
                this.applyTheme(savedTheme);
            }
        } else {
            this.applyTheme(savedTheme);
        }
    }

    setupEventListeners() {
        // Editor events
        this.editor.addEventListener('input', () => {
            this.updatePreview();
            this.updateStats();
            this.markAsModified();
        });

        this.editor.addEventListener('scroll', () => {
            if (this.syncScrollEnabled) {
                this.syncScroll();
            }
        });

        this.editor.addEventListener('keyup', () => {
            this.updateCursorPosition();
        });

        this.editor.addEventListener('click', () => {
            this.updateCursorPosition();
        });

        // Toolbar button events
        document.getElementById('new-btn').addEventListener('click', () => {
            console.log('New button clicked');
            this.newFile();
        });

        document.getElementById('open-btn').addEventListener('click', () => {
            console.log('Open button clicked');
            this.openFile();
        });

        document.getElementById('save-btn').addEventListener('click', () => {
            console.log('Save button clicked');
            this.saveFile();
        });

        document.getElementById('save-as-btn').addEventListener('click', () => {
            console.log('Save As button clicked');
            this.saveAsFile();
        });

        // View mode buttons
        document.getElementById('side-by-side-btn').addEventListener('click', () => {
            this.changeView('side-by-side');
        });

        document.getElementById('editor-only-btn').addEventListener('click', () => {
            this.changeView('editor-only');
        });

        document.getElementById('preview-only-btn').addEventListener('click', () => {
            this.changeView('preview-only');
        });

        // Sync scroll button
        document.getElementById('sync-scroll-btn').addEventListener('click', () => {
            this.toggleSyncScroll();
        });

        // Theme controls
        document.getElementById('theme-toggle-btn').addEventListener('click', () => {
            console.log('Theme toggle clicked');
            this.toggleTheme();
        });

        document.getElementById('customize-theme-btn').addEventListener('click', () => {
            console.log('Customize theme clicked');
            this.openThemeModal();
        });

        // Theme modal controls
        document.getElementById('close-theme-modal').addEventListener('click', () => {
            this.closeThemeModal();
        });

        // Preset theme buttons
        document.querySelectorAll('.preset-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const theme = btn.getAttribute('data-theme');
                this.applyTheme(theme);
                this.updatePresetButtons(theme);
            });
        });

        // Custom color application
        document.getElementById('preview-custom-theme').addEventListener('click', () => {
            this.previewCustomTheme();
        });

        document.getElementById('apply-custom-theme').addEventListener('click', () => {
            this.applyCustomTheme();
        });

        // Color input change handlers to update display values
        ['bg-color', 'text-color', 'accent-color', 'editor-bg-color'].forEach(id => {
            document.getElementById(id).addEventListener('input', (e) => {
                document.getElementById(id + '-value').textContent = e.target.value.toUpperCase();
            });
        });

        // Close modal when clicking outside
        document.getElementById('theme-modal').addEventListener('click', (e) => {
            if (e.target.id === 'theme-modal') {
                this.closeThemeModal();
            }
        });

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey || e.metaKey) {
                switch (e.key) {
                    case 'n':
                        e.preventDefault();
                        this.newFile();
                        break;
                    case 'o':
                        e.preventDefault();
                        this.openFile();
                        break;
                    case 's':
                        e.preventDefault();
                        if (e.shiftKey) {
                            // Save As is handled by the main process
                        } else {
                            this.saveFile();
                        }
                        break;
                    case '1':
                        e.preventDefault();
                        this.changeView('side-by-side');
                        break;
                    case '2':
                        e.preventDefault();
                        this.changeView('editor-only');
                        break;
                    case '3':
                        e.preventDefault();
                        this.changeView('preview-only');
                        break;
                }
            }
        });
    }

    setupIpcListeners() {
        // Listen for menu commands from main process
        ipcRenderer.on('new-file', () => {
            this.newFile();
        });

        ipcRenderer.on('file-opened', (event, { content, filePath }) => {
            this.loadFile(content, filePath);
        });

        ipcRenderer.on('save-file', (event, filePath) => {
            this.saveFileToPath(filePath);
        });

        ipcRenderer.on('change-view', (event, viewMode) => {
            this.changeView(viewMode);
        });
    }

    updatePreview() {
        const content = this.editor.value;
        const html = marked.parse(content);
        this.preview.innerHTML = html;
        
        // Process task lists
        this.processTaskLists();
    }

    processTaskLists() {
        const taskItems = this.preview.querySelectorAll('li');
        taskItems.forEach(item => {
            const text = item.textContent || item.innerText;
            if (text.trim().startsWith('[ ]') || text.trim().startsWith('[x]') || text.trim().startsWith('[X]')) {
                item.classList.add('task-list-item');
                const isChecked = text.trim().startsWith('[x]') || text.trim().startsWith('[X]');
                const checkbox = document.createElement('input');
                checkbox.type = 'checkbox';
                checkbox.checked = isChecked;
                checkbox.className = 'task-list-item-checkbox';
                checkbox.disabled = true; // Read-only in preview
                
                // Replace the checkbox text with actual checkbox
                item.innerHTML = item.innerHTML.replace(/^\s*\[[ xX]\]\s*/, '');
                item.insertBefore(checkbox, item.firstChild);
            }
        });
    }

    syncScroll() {
        const editorScrollPercentage = this.editor.scrollTop / (this.editor.scrollHeight - this.editor.clientHeight);
        this.preview.scrollTop = editorScrollPercentage * (this.preview.scrollHeight - this.preview.clientHeight);
    }

    toggleSyncScroll() {
        this.syncScrollEnabled = !this.syncScrollEnabled;
        const syncBtn = document.getElementById('sync-scroll-btn');
        syncBtn.classList.toggle('active', this.syncScrollEnabled);
    }

    updateStats() {
        const content = this.editor.value;
        const wordCount = content.trim() ? content.trim().split(/\s+/).length : 0;
        const charCount = content.length;
        
        document.getElementById('word-count').textContent = `${wordCount} words`;
        document.getElementById('char-count').textContent = `${charCount} characters`;
    }

    updateCursorPosition() {
        const content = this.editor.value;
        const cursorPos = this.editor.selectionStart;
        const lines = content.substring(0, cursorPos).split('\n');
        const line = lines.length;
        const col = lines[lines.length - 1].length + 1;
        
        document.getElementById('cursor-position').textContent = `Ln ${line}, Col ${col}`;
    }

    markAsModified() {
        this.isModified = true;
        this.updateSaveStatus('Modified');
    }

    updateSaveStatus(status) {
        document.getElementById('save-status').textContent = status;
    }

    newFile() {
        if (this.isModified) {
            // In a real app, you'd show a confirmation dialog
            // For now, we'll just proceed
        }
        
        this.editor.value = '';
        this.currentFilePath = null;
        this.isModified = false;
        this.updatePreview();
        this.updateStats();
        this.updateCursorPosition();
        this.updateSaveStatus('Ready');
        document.getElementById('file-status').textContent = 'Untitled';
        document.getElementById('file-path').textContent = 'No file opened';
    }

    openFile() {
        // Trigger the main process to show open dialog
        ipcRenderer.send('open-file-dialog');
    }

    loadFile(content, filePath) {
        this.editor.value = content;
        this.currentFilePath = filePath;
        this.isModified = false;
        this.updatePreview();
        this.updateStats();
        this.updateCursorPosition();
        this.updateSaveStatus('Ready');
        
        const fileName = filePath.split(/[\\/]/).pop();
        document.getElementById('file-status').textContent = fileName;
        document.getElementById('file-path').textContent = filePath;
    }

    saveFile() {
        if (this.currentFilePath) {
            this.saveFileToPath(this.currentFilePath);
        } else {
            // Trigger Save As dialog in main process
            ipcRenderer.send('save-as-file');
        }
    }

    saveAsFile() {
        // Always trigger Save As dialog, regardless of current file path
        ipcRenderer.send('save-as-file');
    }

    async saveFileToPath(filePath) {
        const content = this.editor.value;
        const result = await ipcRenderer.invoke('save-file-content', filePath, content);
        
        if (result.success) {
            this.currentFilePath = filePath; // Make sure to update current file path
            this.isModified = false;
            this.updateSaveStatus('Saved');
            
            const fileName = filePath.split(/[\\/]/).pop();
            document.getElementById('file-status').textContent = fileName;
            document.getElementById('file-path').textContent = filePath;
        } else {
            this.updateSaveStatus('Error saving');
            console.error('Save failed:', result.error);
        }
    }

    changeView(viewMode) {
        // Remove all view classes
        this.mainContainer.className = this.mainContainer.className.replace(/\b\w+-view\b/g, '');
        
        // Add new view class
        this.mainContainer.classList.add(viewMode + '-view');
        
        // Update button states
        document.querySelectorAll('.view-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        
        const activeBtn = document.getElementById(viewMode + '-btn');
        if (activeBtn) {
            activeBtn.classList.add('active');
        }
        
        // Refresh preview if switching to a view that includes preview
        if (viewMode === 'side-by-side' || viewMode === 'preview-only') {
            setTimeout(() => {
                this.updatePreview();
            }, 50);
        }
    }

    // Theme Management Methods
    toggleTheme() {
        const newTheme = this.currentTheme === 'light' ? 'dark' : 'light';
        this.applyTheme(newTheme);
    }

    applyTheme(theme) {
        this.currentTheme = theme;
        
        // Clear any custom CSS properties first to allow preset themes to work
        this.clearCustomProperties();
        
        // Set the theme attribute
        document.documentElement.setAttribute('data-theme', theme);
        
        // Update theme button text and icon
        const themeBtn = document.getElementById('theme-toggle-btn');
        const span = themeBtn.querySelector('span');
        
        // Update button based on current theme
        if (theme === 'dark' || theme === 'monokai' || theme === 'dracula') {
            span.textContent = '☀️';
            themeBtn.childNodes[2].textContent = ' Light';
            themeBtn.classList.add('active');
        } else {
            span.textContent = '🌙';
            themeBtn.childNodes[2].textContent = ' Dark';
            themeBtn.classList.remove('active');
        }
        
        // Save theme preference
        localStorage.setItem('jank-theme', theme);
        
        // Update preset buttons if modal is open
        this.updatePresetButtons(theme);
        
        console.log(`Theme changed to: ${theme}`);
    }

    openThemeModal() {
        const modal = document.getElementById('theme-modal');
        modal.classList.remove('hidden');
        
        // Update preset buttons to show current theme
        this.updatePresetButtons(this.currentTheme);
        
        // Load current colors into custom color inputs
        this.loadCurrentColorsIntoInputs();
    }

    closeThemeModal() {
        const modal = document.getElementById('theme-modal');
        modal.classList.add('hidden');
    }

    updatePresetButtons(activeTheme) {
        document.querySelectorAll('.preset-btn').forEach(btn => {
            btn.classList.remove('active');
            if (btn.getAttribute('data-theme') === activeTheme) {
                btn.classList.add('active');
            }
        });
    }

    loadCurrentColorsIntoInputs() {
        const root = document.documentElement;
        const computedStyle = getComputedStyle(root);
        
        // Get current color values
        const bgColor = this.rgbToHex(computedStyle.getPropertyValue('--bg-primary').trim()) || '#ffffff';
        const textColor = this.rgbToHex(computedStyle.getPropertyValue('--text-primary').trim()) || '#24292f';
        const accentColor = this.rgbToHex(computedStyle.getPropertyValue('--accent-primary').trim()) || '#0969da';
        const editorBgColor = this.rgbToHex(computedStyle.getPropertyValue('--editor-bg').trim()) || '#ffffff';
        
        // Set input values and display values
        document.getElementById('bg-color').value = bgColor;
        document.getElementById('bg-color-value').textContent = bgColor.toUpperCase();
        
        document.getElementById('text-color').value = textColor;
        document.getElementById('text-color-value').textContent = textColor.toUpperCase();
        
        document.getElementById('accent-color').value = accentColor;
        document.getElementById('accent-color-value').textContent = accentColor.toUpperCase();
        
        document.getElementById('editor-bg-color').value = editorBgColor;
        document.getElementById('editor-bg-color-value').textContent = editorBgColor.toUpperCase();
    }

    previewCustomTheme() {
        const bgColor = document.getElementById('bg-color').value;
        const textColor = document.getElementById('text-color').value;
        const accentColor = document.getElementById('accent-color').value;
        const editorBgColor = document.getElementById('editor-bg-color').value;
        
        // Create custom theme object
        const customTheme = {
            bgColor,
            textColor,
            accentColor,
            editorBgColor
        };
        
        // Temporarily apply custom colors for preview
        this.setCustomColors(customTheme);
        
        console.log('Previewing custom theme:', customTheme);
    }

    rgbToHex(rgb) {
        // Handle hex colors that are already in the right format
        if (rgb.startsWith('#')) return rgb;
        
        // Handle rgb() format
        const match = rgb.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
        if (match) {
            const r = parseInt(match[1]);
            const g = parseInt(match[2]);
            const b = parseInt(match[3]);
            return '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
        }
        
        return rgb; // Return as-is if we can't parse it
    }

    applyCustomTheme() {
        const bgColor = document.getElementById('bg-color').value;
        const textColor = document.getElementById('text-color').value;
        const accentColor = document.getElementById('accent-color').value;
        const editorBgColor = document.getElementById('editor-bg-color').value;
        
        // Create custom theme object
        const customTheme = {
            bgColor,
            textColor,
            accentColor,
            editorBgColor
        };
        
        // Apply custom colors
        this.setCustomColors(customTheme);
        
        // Save custom colors
        localStorage.setItem('jank-custom-colors', JSON.stringify(customTheme));
        this.customColors = customTheme;
        
        // Update current theme to custom
        this.currentTheme = 'custom';
        localStorage.setItem('jank-theme', 'custom');
        
        // Update preset buttons
        this.updatePresetButtons('custom');
        
        // Update theme toggle button for custom theme
        const themeBtn = document.getElementById('theme-toggle-btn');
        const span = themeBtn.querySelector('span');
        span.textContent = '🎨';
        themeBtn.childNodes[2].textContent = ' Custom';
        themeBtn.classList.add('active');
        
        // Close the modal
        this.closeThemeModal();
        
        console.log('Applied custom theme:', customTheme);
    }

    clearCustomProperties() {
        const root = document.documentElement;
        const customProperties = [
            '--bg-primary', '--bg-secondary', '--bg-tertiary',
            '--text-primary', '--text-secondary', '--text-muted',
            '--accent-primary', '--accent-hover', '--accent-text',
            '--editor-bg', '--preview-bg', '--toolbar-bg',
            '--status-bg', '--status-text'
        ];
        
        customProperties.forEach(prop => {
            root.style.removeProperty(prop);
        });
    }

    setCustomColors(colors) {
        const root = document.documentElement;
        
        // Apply custom colors to CSS variables
        root.style.setProperty('--bg-primary', colors.bgColor);
        root.style.setProperty('--bg-secondary', this.lightenColor(colors.bgColor, 0.97));
        root.style.setProperty('--bg-tertiary', this.lightenColor(colors.bgColor, 0.94));
        root.style.setProperty('--text-primary', colors.textColor);
        root.style.setProperty('--text-secondary', this.lightenColor(colors.textColor, 0.7));
        root.style.setProperty('--text-muted', this.lightenColor(colors.textColor, 0.5));
        root.style.setProperty('--accent-primary', colors.accentColor);
        root.style.setProperty('--accent-hover', this.darkenColor(colors.accentColor, 0.1));
        root.style.setProperty('--accent-text', this.getContrastColor(colors.accentColor));
        root.style.setProperty('--editor-bg', colors.editorBgColor);
        root.style.setProperty('--preview-bg', colors.editorBgColor);
        root.style.setProperty('--toolbar-bg', colors.bgColor);
        root.style.setProperty('--status-bg', colors.accentColor);
        root.style.setProperty('--status-text', this.getContrastColor(colors.accentColor));
        
        // Set data-theme to custom for CSS specificity
        root.setAttribute('data-theme', 'custom');
    }

    lightenColor(color, factor) {
        const hex = color.replace('#', '');
        const r = Math.min(255, Math.floor(parseInt(hex.substr(0, 2), 16) + (255 - parseInt(hex.substr(0, 2), 16)) * (1 - factor)));
        const g = Math.min(255, Math.floor(parseInt(hex.substr(2, 2), 16) + (255 - parseInt(hex.substr(2, 2), 16)) * (1 - factor)));
        const b = Math.min(255, Math.floor(parseInt(hex.substr(4, 2), 16) + (255 - parseInt(hex.substr(4, 2), 16)) * (1 - factor)));
        return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
    }

    darkenColor(color, factor) {
        const hex = color.replace('#', '');
        const r = Math.floor(parseInt(hex.substr(0, 2), 16) * (1 - factor));
        const g = Math.floor(parseInt(hex.substr(2, 2), 16) * (1 - factor));
        const b = Math.floor(parseInt(hex.substr(4, 2), 16) * (1 - factor));
        return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
    }

    getContrastColor(hexColor) {
        // Calculate luminance and return black or white for best contrast
        const hex = hexColor.replace('#', '');
        const r = parseInt(hex.substr(0, 2), 16);
        const g = parseInt(hex.substr(2, 2), 16);
        const b = parseInt(hex.substr(4, 2), 16);
        const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
        return luminance > 0.5 ? '#000000' : '#ffffff';
    }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new MarkdownEditor();
});
