package com.gradetracker;

/**
 * Main.java
 *
 * Entry point for the Student Grade Tracker application.
 *
 * What happens when you run this class:
 *   1. A GradeTracker instance is created (our in-memory "database").
 *   2. Sample student data is loaded so you see something on the dashboard right away.
 *   3. The HTTP server starts on port 8080.
 *   4. Open http://localhost:8080 in your browser to use the app.
 *
 * @author Student Grade Tracker
 * @version 1.0
 */
public class Main {

    public static void main(String[] args) {

        // ---------------------------------------------------
        // Step 1: Create the grade tracker (our data store)
        // ---------------------------------------------------
        GradeTracker tracker = new GradeTracker();

        // ---------------------------------------------------
        // Step 2: Start the HTTP server
        // ---------------------------------------------------
        try {
            SimpleHttpServer.start(tracker);
        } catch (Exception e) {
            System.err.println("Failed to start the server: " + e.getMessage());
            System.err.println("Make sure port 8080 is not already in use.");
            System.exit(1);
        }
    }


}
