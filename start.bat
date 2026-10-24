@echo off
chcp 65001 >nul
cd /d "%~dp0"
title AI Tutor - Gemini
if not exist .env (
  copy .env.example .env >nul
  echo Da tao tep .env. Ban can dan Gemini API key vao tep nay truoc.
  notepad .env
  echo Luu tep .env, dong Notepad, sau do chay lai start.bat.
  pause
  exit /b 0
)
findstr /C:"PASTE_YOUR_GEMINI_API_KEY_HERE" .env >nul
if %errorlevel%==0 (
  echo Ban chua thay API key mau trong tep .env.
  notepad .env
  echo Luu tep .env, dong Notepad, sau do chay lai start.bat.
  pause
  exit /b 0
)
where node >nul 2>nul
if errorlevel 1 (
  echo Chua tim thay Node.js. Hay cai Node.js ban LTS tu https://nodejs.org/ roi mo lai start.bat.
  pause
  exit /b 1
)
if not exist node_modules (
  echo Dang cai cac thu vien can thiet. Can ket noi Internet trong lan dau...
  call npm install
  if errorlevel 1 (
    echo Cai thu vien that bai. Kiem tra Internet va thu lai.
    pause
    exit /b 1
  )
)
echo Dang khoi dong AI Tutor. Giu cua so nay mo.
call npm start
pause
