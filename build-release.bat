@echo off
setlocal

set "ROOT=%~dp0"
set "PROJECT=%ROOT%ToNPinSystem\ToNPinSystem.csproj"
set "DIST=%ROOT%dist"

echo ========================================
echo ToN Pin System - Release Build
echo ========================================
echo.

if exist "%DIST%" rmdir /S /Q "%DIST%"
mkdir "%DIST%"

dotnet publish "%PROJECT%" -c Release -r win-x64 --self-contained true ^
  -p:PublishSingleFile=true ^
  -p:IncludeNativeLibrariesForSelfExtract=true ^
  -o "%DIST%"

if errorlevel 1 (
  echo.
  echo [ERROR] Build failed.
  pause
  exit /b 1
)

if exist "%ROOT%ToNPinSystem\Maps" (
  if not exist "%DIST%\data\Maps" mkdir "%DIST%\data\Maps"
  xcopy /E /I /Y "%ROOT%ToNPinSystem\Maps\*" "%DIST%\data\Maps\" >nul
)

(
echo ToN Pin System
echo ================================
echo.
echo Start:
echo   Double-click "ToN Pin System.exe"
echo.
echo Do not delete the data folder.
) > "%DIST%\README.txt"

echo.
echo ========================================
echo Build complete.
echo Output: %DIST%
echo ========================================
pause
