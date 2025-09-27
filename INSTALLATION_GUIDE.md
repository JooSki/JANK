# JANK Installation Guide

## Windows Defender / SmartScreen Warning

When you first run JANK, Windows may show a warning because the application isn't digitally signed. This is normal for many independent software applications.

### To Install JANK:

1. **Download** the installer or portable version
2. **If you see a Windows Defender warning:**
   - Click "More info" 
   - Click "Run anyway"
3. **If you see a SmartScreen warning:**
   - Click "More info"
   - Click "Run anyway"

### Alternative: Add Windows Defender Exclusion

If you're a system administrator, you can add JANK to the exclusion list:

```powershell
# Run PowerShell as Administrator
Add-MpPreference -ExclusionPath "C:\Program Files\JANK - Just Another Note Keeper"
```

## Why This Happens

- JANK is not digitally signed with an expensive code signing certificate
- Windows protects users by warning about unsigned software
- This is common for open-source and independent applications
- JANK is safe to run - it's a simple markdown editor with no network connections

## File Versions

- **Setup Installer**: Full installation with shortcuts and uninstaller
- **Portable Version**: Run directly without installation (recommended for work computers)

## Need Help?

If you have questions or concerns, please open an issue on the GitHub repository.
