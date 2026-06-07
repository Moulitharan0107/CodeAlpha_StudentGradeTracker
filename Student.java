package com.gradetracker;

/**
 * Student.java
 * 
 * Represents a single student with their name and score.
 * This class uses encapsulation (private fields + public getters/setters)
 * to protect the data and ensure valid values are always stored.
 * 
 * @author Student Grade Tracker
 * @version 1.0
 */
public class Student {

    // -------------------------
    // Fields (private for encapsulation)
    // -------------------------
    private int id;
    private String name;
    private double score;

    // -------------------------
    // Constructor
    // -------------------------

    /**
     * Creates a new Student with the given id, name, and score.
     *
     * @param id    Unique identifier for the student
     * @param name  Full name of the student
     * @param score Numeric score (0 - 100)
     */
    public Student(int id, String name, double score) {
        this.id = id;
        this.name = name;
        // Use the setter so validation logic runs
        setScore(score);
    }

    // -------------------------
    // Getters
    // -------------------------

    /** Returns the student's unique ID. */
    public int getId() {
        return id;
    }

    /** Returns the student's full name. */
    public String getName() {
        return name;
    }

    /** Returns the student's numeric score. */
    public double getScore() {
        return score;
    }

    // -------------------------
    // Setters
    // -------------------------

    /** Updates the student's name. */
    public void setName(String name) {
        this.name = name;
    }

    /**
     * Updates the student's score.
     * Throws an exception if the score is outside the valid 0–100 range.
     *
     * @param score New score value
     * @throws IllegalArgumentException if score is not between 0 and 100
     */
    public void setScore(double score) {
        if (score < 0 || score > 100) {
            throw new IllegalArgumentException("Score must be between 0 and 100. Provided: " + score);
        }
        this.score = score;
    }

    // -------------------------
    // Grade Calculation
    // -------------------------

    /**
     * Returns the letter grade based on the student's score.
     *
     * Grading scale:
     *   A = 90 – 100
     *   B = 80 – 89
     *   C = 70 – 79
     *   D = 60 – 69
     *   F = Below 60
     *
     * @return Single character grade as a String
     */
    public String getGrade() {
        if (score >= 90) return "A";
        if (score >= 80) return "B";
        if (score >= 70) return "C";
        if (score >= 60) return "D";
        return "F";
    }

    // -------------------------
    // toString (for console/debugging)
    // -------------------------

    /**
     * Returns a formatted string representation of the student.
     * Useful for debugging and console output.
     */
    @Override
    public String toString() {
        return String.format("Student{id=%d, name='%s', score=%.1f, grade='%s'}",
                id, name, score, getGrade());
    }
}
