package com.gradetracker;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

/**
 * GradeTracker.java
 *
 * The core "engine" of the application.
 * Manages a collection of Student objects and provides methods to:
 *   - Add / remove / update students
 *   - Calculate statistics (average, highest, lowest)
 *   - Return data as JSON strings for the frontend
 *
 * Uses an ArrayList to store students in memory.
 * (No database required – perfect for a beginner project.)
 *
 * @author Student Grade Tracker
 * @version 1.0
 */
public class GradeTracker {

    // -------------------------
    // Fields
    // -------------------------

    /** In-memory list of all students. */
    private ArrayList<Student> students;

    /** Auto-incrementing ID counter so every student gets a unique ID. */
    private int nextId;

    // -------------------------
    // Constructor
    // -------------------------

    /**
     * Initialises an empty GradeTracker.
     * nextId starts at 1 so the first student added gets ID = 1.
     */
    public GradeTracker() {
        this.students = new ArrayList<>();
        this.nextId = 1;
    }

    // -------------------------
    // CRUD Operations
    // -------------------------

    /**
     * Adds a new student to the tracker.
     *
     * @param name  Student's full name (must not be blank)
     * @param score Student's initial score (0 – 100)
     * @return The newly created Student object
     * @throws IllegalArgumentException if name is blank
     */
    public Student addStudent(String name, double score) {
        if (name == null || name.trim().isEmpty()) {
            throw new IllegalArgumentException("Student name cannot be empty.");
        }
        Student student = new Student(nextId++, name.trim(), score);
        students.add(student);
        return student;
    }

    /**
     * Returns a copy of the full student list so callers cannot
     * directly modify the internal ArrayList.
     *
     * @return New ArrayList containing all current students
     */
    public ArrayList<Student> getAllStudents() {
        return new ArrayList<>(students);
    }

    /**
     * Finds a student by their unique ID.
     *
     * @param id The student's ID
     * @return Optional<Student> – present if found, empty if not
     */
    public Optional<Student> findStudentById(int id) {
        return students.stream()
                .filter(s -> s.getId() == id)
                .findFirst();
    }

    /**
     * Updates the score of an existing student.
     *
     * @param id       The student's ID
     * @param newScore The updated score (0 – 100)
     * @return true if the update succeeded, false if student was not found
     */
    public boolean updateStudentScore(int id, double newScore) {
        Optional<Student> found = findStudentById(id);
        if (found.isPresent()) {
            found.get().setScore(newScore);
            return true;
        }
        return false;
    }

    /**
     * Removes a student from the tracker by ID.
     *
     * @param id The student's ID
     * @return true if the student was removed, false if not found
     */
    public boolean deleteStudent(int id) {
        return students.removeIf(s -> s.getId() == id);
    }

    // -------------------------
    // Statistics
    // -------------------------

    /**
     * Calculates the average score of all students.
     *
     * @return Average score, or 0.0 if no students exist
     */
    public double getAverageScore() {
        if (students.isEmpty()) return 0.0;
        double total = 0;
        for (Student s : students) {
            total += s.getScore();
        }
        return total / students.size();
    }

    /**
     * Finds the student with the highest score.
     *
     * @return Optional<Student> – present if at least one student exists
     */
    public Optional<Student> getHighestScoreStudent() {
        return students.stream()
                .max((a, b) -> Double.compare(a.getScore(), b.getScore()));
    }

    /**
     * Finds the student with the lowest score.
     *
     * @return Optional<Student> – present if at least one student exists
     */
    public Optional<Student> getLowestScoreStudent() {
        return students.stream()
                .min((a, b) -> Double.compare(a.getScore(), b.getScore()));
    }

    /** Returns the total number of students currently tracked. */
    public int getTotalStudents() {
        return students.size();
    }

    // -------------------------
    // JSON Serialisation (manual – no external libraries needed)
    // -------------------------

    /**
     * Serialises a single Student object to a JSON string.
     * Example output:
     *   {"id":1,"name":"Alice","score":92.5,"grade":"A"}
     *
     * @param s The student to serialise
     * @return JSON string
     */
    public String studentToJson(Student s) {
        return String.format(
            "{\"id\":%d,\"name\":\"%s\",\"score\":%.1f,\"grade\":\"%s\"}",
            s.getId(),
            escapeJson(s.getName()),
            s.getScore(),
            s.getGrade()
        );
    }

    /**
     * Serialises the entire student list to a JSON array.
     * Example output:
     *   [{"id":1,...},{"id":2,...}]
     *
     * @return JSON array string
     */
    public String getAllStudentsAsJson() {
        StringBuilder sb = new StringBuilder("[");
        List<Student> list = getAllStudents();
        for (int i = 0; i < list.size(); i++) {
            sb.append(studentToJson(list.get(i)));
            if (i < list.size() - 1) sb.append(",");
        }
        sb.append("]");
        return sb.toString();
    }

    /**
     * Builds a JSON object containing all dashboard statistics.
     * Example output:
     *   {"totalStudents":5,"averageScore":78.4,"highestScore":95.0,
     *    "lowestScore":55.0,"highestName":"Bob","lowestName":"Carol"}
     *
     * @return JSON statistics string
     */
    public String getStatsAsJson() {
        Optional<Student> highest = getHighestScoreStudent();
        Optional<Student> lowest  = getLowestScoreStudent();

        String highScore = highest.map(s -> String.valueOf(s.getScore())).orElse("0");
        String lowScore  = lowest.map(s  -> String.valueOf(s.getScore())).orElse("0");
        String highName  = highest.map(s -> escapeJson(s.getName())).orElse("-");
        String lowName   = lowest.map(s  -> escapeJson(s.getName())).orElse("-");

        return String.format(
            "{\"totalStudents\":%d,\"averageScore\":%.1f," +
            "\"highestScore\":%s,\"lowestScore\":%s," +
            "\"highestName\":\"%s\",\"lowestName\":\"%s\"}",
            getTotalStudents(),
            getAverageScore(),
            highScore,
            lowScore,
            highName,
            lowName
        );
    }

    // -------------------------
    // Helper Methods
    // -------------------------

    /**
     * Escapes characters that would break a JSON string.
     * Handles double-quotes and backslashes.
     *
     * @param input Raw string value
     * @return JSON-safe string
     */
    private String escapeJson(String input) {
        if (input == null) return "";
        return input.replace("\\", "\\\\").replace("\"", "\\\"");
    }
}
