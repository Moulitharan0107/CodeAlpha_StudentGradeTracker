#!/bin/bash
# ============================================================
# run.sh
# Starts the Student Grade Tracker server.
# Make sure you have run compile.sh first!
# ============================================================

if [ ! -d "out" ]; then
  echo "No compiled classes found. Running compile.sh first..."
  ./compile.sh
fi

echo "Starting Student Grade Tracker..."
java -cp out com.gradetracker.Main
