# Automate Installation in Windows

> Execute installers with .exe or .msi automatically with script. Useful in setting up a fresh Windows installation.

- Type: Post
- Published: 2023-09-02
- Tags: windows
- Source: https://irfanadziri.dev/posts/automate-installation-in-windows/

---

This script is intended for automating GUI .exe and .msi installation. A useful tool to setup fresh Windows with offline installers. It will iterate all installers in a folder to run one after another.

## Usage

**Pre-requisite**: put all the .exe and .msi installers in a folder.

1. Copy this script.

```bash
@echo off

for %%i in (*.msi *.exe) do (
    pause "Press Enter to start the installation: %%i"
    start /wait %%i
)

echo Installations Complete!
```

2. Paste into notepad and save as `Install.bat`.
3. Copy the script into the folder of all of your installers.
4. Run the script to make installation.

**Important note**: This is a semi-auto approach because of GUI nature that needs user interaction to complete installation. I personally used this script just to make sure I don’t skip any of the installer.
