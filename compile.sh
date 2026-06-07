#!/bin/bash
# ============================================================
# compile.sh
# Compiles all Java source files into the out/ directory.
# Run this before run.sh.
# ============================================================

echo "Compiling Student Grade Tracker..."

# Create the output directory if it doesn't exist
mkdir -p out

# Compile all .java files in the source tree
javac -d out -sourcepath src/main/java \
  src/main/java/com/gradetracker/Student.java \
  src/main/java/com/gradetracker/GradeTracker.java \
  src/main/java/com/gradetracker/SimpleHttpServer.java \
  src/main/java/com/gradetracker/Main.java

if [ $? -eq 0 ]; then
  echo "✓ Compilation successful! Run ./run.sh to start the server."
else
  echo "✗ Compilation failed. Please check the errors above."
  exit 1
fi
