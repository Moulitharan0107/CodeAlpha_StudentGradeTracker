@echo off
REM ============================================================
REM compile.bat – Windows version
REM Compiles all Java source files into the out\ directory.
REM ============================================================

echo Compiling Student Grade Tracker...

if not exist out mkdir out

javac -d out -sourcepath src\main\java ^
  src\main\java\com\gradetracker\Student.java ^
  src\main\java\com\gradetracker\GradeTracker.java ^
  src\main\java\com\gradetracker\SimpleHttpServer.java ^
  src\main\java\com\gradetracker\Main.java

if %errorlevel% == 0 (
  echo Compilation successful! Run run.bat to start the server.
) else (
  echo Compilation failed. Check the errors above.
  exit /b 1
)
