@echo off
REM ============================================================
REM run.bat – Windows version
REM Starts the Student Grade Tracker server.
REM ============================================================

if not exist out (
  echo No compiled classes found. Running compile.bat first...
  call compile.bat
)

echo Starting Student Grade Tracker...
java -cp out com.gradetracker.Main
