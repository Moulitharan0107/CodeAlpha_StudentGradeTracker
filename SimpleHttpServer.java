package com.gradetracker;

import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpHandler;
import com.sun.net.httpserver.HttpServer;

import java.io.*;
import java.net.InetSocketAddress;
import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;
import java.nio.file.*;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

/**
 * SimpleHttpServer.java
 *
 * A lightweight HTTP server built with Java's built-in com.sun.net.httpserver.
 * No external frameworks required!
 *
 * Routes:
 *   GET  /              → serves index.html
 *   GET  /static/*      → serves CSS / JS / image files
 *   GET  /api/students  → returns all students as JSON
 *   POST /api/students  → adds a new student
 *   PUT  /api/students  → updates a student's score
 *   DELETE /api/students → deletes a student
 *   GET  /api/stats     → returns dashboard statistics as JSON
 *
 * @author Student Grade Tracker
 * @version 1.0
 */
public class SimpleHttpServer {

    // -------------------------
    // Constants
    // -------------------------

    /** Port the server listens on. */
    private static final int PORT = 8080;

    /** Path to the frontend files, relative to the project root. */
    private static final String FRONTEND_DIR = "src/main/webapp";

    // -------------------------
    // Start the Server
    // -------------------------

    /**
     * Starts the HTTP server and registers all route handlers.
     *
     * @param tracker The GradeTracker instance shared across all handlers
     * @throws IOException if the server cannot bind to the port
     */
    public static void start(GradeTracker tracker) throws IOException {
        HttpServer server = HttpServer.create(new InetSocketAddress(PORT), 0);

        // Register handlers
        server.createContext("/api/students", new StudentHandler(tracker));
        server.createContext("/api/stats",    new StatsHandler(tracker));
        server.createContext("/",             new StaticFileHandler());

        // Use a default executor (creates threads as needed)
        server.setExecutor(null);
        server.start();

        System.out.println("╔══════════════════════════════════════════════╗");
        System.out.println("║       Student Grade Tracker – Server Ready   ║");
        System.out.println("╠══════════════════════════════════════════════╣");
        System.out.printf ("║  Open:  http://localhost:%d                  ║%n", PORT);
        System.out.println("║  Press Ctrl+C to stop the server             ║");
        System.out.println("╚══════════════════════════════════════════════╝");
    }

    // =========================================================
    //  HANDLER: /api/students
    // =========================================================

    /**
     * Handles all CRUD operations for students.
     * Routes are determined by the HTTP method (GET / POST / PUT / DELETE).
     */
    static class StudentHandler implements HttpHandler {

        private final GradeTracker tracker;

        public StudentHandler(GradeTracker tracker) {
            this.tracker = tracker;
        }

        @Override
        public void handle(HttpExchange exchange) throws IOException {
            // Allow cross-origin requests (useful during development)
            addCorsHeaders(exchange);

            String method = exchange.getRequestMethod();

            try {
                switch (method.toUpperCase()) {
                    case "GET":    handleGet(exchange);    break;
                    case "POST":   handlePost(exchange);   break;
                    case "PUT":    handlePut(exchange);    break;
                    case "DELETE": handleDelete(exchange); break;
                    case "OPTIONS": sendResponse(exchange, 204, ""); break;
                    default:
                        sendResponse(exchange, 405, "{\"error\":\"Method Not Allowed\"}");
                }
            } catch (Exception e) {
                // Return a user-friendly error message
                sendResponse(exchange, 500,
                    "{\"error\":\"" + escapeJson(e.getMessage()) + "\"}");
            }
        }

        /** GET /api/students → return all students as JSON array */
        private void handleGet(HttpExchange exchange) throws IOException {
            String json = tracker.getAllStudentsAsJson();
            sendResponse(exchange, 200, json);
        }

        /**
         * POST /api/students
         * Expects form-encoded body: name=Alice&score=92.5
         */
        private void handlePost(HttpExchange exchange) throws IOException {
            Map<String, String> params = parseBody(exchange);
            String name  = params.getOrDefault("name", "").trim();
            String scoreStr = params.getOrDefault("score", "").trim();

            if (name.isEmpty() || scoreStr.isEmpty()) {
                sendResponse(exchange, 400, "{\"error\":\"Name and score are required.\"}");
                return;
            }

            double score = Double.parseDouble(scoreStr);
            Student student = tracker.addStudent(name, score);
            sendResponse(exchange, 201, tracker.studentToJson(student));
        }

        /**
         * PUT /api/students
         * Expects form-encoded body: id=1&score=88.0
         */
        private void handlePut(HttpExchange exchange) throws IOException {
            Map<String, String> params = parseBody(exchange);
            String idStr    = params.getOrDefault("id", "").trim();
            String scoreStr = params.getOrDefault("score", "").trim();

            if (idStr.isEmpty() || scoreStr.isEmpty()) {
                sendResponse(exchange, 400, "{\"error\":\"ID and score are required.\"}");
                return;
            }

            int id    = Integer.parseInt(idStr);
            double score = Double.parseDouble(scoreStr);
            boolean updated = tracker.updateStudentScore(id, score);

            if (updated) {
                Optional<Student> s = tracker.findStudentById(id);
                sendResponse(exchange, 200, tracker.studentToJson(s.get()));
            } else {
                sendResponse(exchange, 404, "{\"error\":\"Student not found.\"}");
            }
        }

        /**
         * DELETE /api/students
         * Expects query param: ?id=1
         */
        private void handleDelete(HttpExchange exchange) throws IOException {
            String query = exchange.getRequestURI().getQuery();
            Map<String, String> params = parseQueryString(query);
            String idStr = params.getOrDefault("id", "").trim();

            if (idStr.isEmpty()) {
                sendResponse(exchange, 400, "{\"error\":\"ID is required.\"}");
                return;
            }

            int id = Integer.parseInt(idStr);
            boolean deleted = tracker.deleteStudent(id);

            if (deleted) {
                sendResponse(exchange, 200, "{\"message\":\"Student deleted successfully.\"}");
            } else {
                sendResponse(exchange, 404, "{\"error\":\"Student not found.\"}");
            }
        }
    }

    // =========================================================
    //  HANDLER: /api/stats
    // =========================================================

    /**
     * Returns the dashboard statistics (average, highest, lowest, total).
     */
    static class StatsHandler implements HttpHandler {

        private final GradeTracker tracker;

        public StatsHandler(GradeTracker tracker) {
            this.tracker = tracker;
        }

        @Override
        public void handle(HttpExchange exchange) throws IOException {
            addCorsHeaders(exchange);

            if ("OPTIONS".equalsIgnoreCase(exchange.getRequestMethod())) {
                sendResponse(exchange, 204, "");
                return;
            }

            String json = tracker.getStatsAsJson();
            sendResponse(exchange, 200, json);
        }
    }

    // =========================================================
    //  HANDLER: Static Files (HTML, CSS, JS)
    // =========================================================

    /**
     * Serves static files from the FRONTEND_DIR directory.
     * Maps URLs to files:
     *   /           → index.html
     *   /style.css  → style.css
     *   /app.js     → app.js
     */
    static class StaticFileHandler implements HttpHandler {

        @Override
        public void handle(HttpExchange exchange) throws IOException {
            String uriPath = exchange.getRequestURI().getPath();

            // Default to index.html for root
            if ("/".equals(uriPath)) {
                uriPath = "/index.html";
            }

            // Prevent directory traversal attacks
            if (uriPath.contains("..")) {
                sendResponse(exchange, 403, "Forbidden");
                return;
            }

            Path filePath = Paths.get(FRONTEND_DIR + uriPath);

            if (Files.exists(filePath) && !Files.isDirectory(filePath)) {
                byte[] content = Files.readAllBytes(filePath);
                String contentType = getContentType(uriPath);
                exchange.getResponseHeaders().set("Content-Type", contentType);
                exchange.sendResponseHeaders(200, content.length);
                try (OutputStream os = exchange.getResponseBody()) {
                    os.write(content);
                }
            } else {
                String notFound = "<h1>404 – File Not Found</h1>";
                sendResponse(exchange, 404, notFound);
            }
        }

        /** Returns the MIME type based on the file extension. */
        private String getContentType(String path) {
            if (path.endsWith(".html")) return "text/html; charset=UTF-8";
            if (path.endsWith(".css"))  return "text/css; charset=UTF-8";
            if (path.endsWith(".js"))   return "application/javascript; charset=UTF-8";
            if (path.endsWith(".png"))  return "image/png";
            if (path.endsWith(".jpg") || path.endsWith(".jpeg")) return "image/jpeg";
            if (path.endsWith(".svg"))  return "image/svg+xml";
            if (path.endsWith(".ico"))  return "image/x-icon";
            return "text/plain; charset=UTF-8";
        }
    }

    // =========================================================
    //  Utility / Helper Methods
    // =========================================================

    /**
     * Sends an HTTP response with the given status code and body.
     * Always sets Content-Type to application/json unless body is HTML.
     */
    static void sendResponse(HttpExchange exchange, int statusCode, String body) throws IOException {
        byte[] bytes = body.getBytes(StandardCharsets.UTF_8);

        String contentType = body.trim().startsWith("<")
            ? "text/html; charset=UTF-8"
            : "application/json; charset=UTF-8";

        exchange.getResponseHeaders().set("Content-Type", contentType);
        exchange.sendResponseHeaders(statusCode, bytes.length);
        try (OutputStream os = exchange.getResponseBody()) {
            os.write(bytes);
        }
    }

    /**
     * Adds CORS headers so the frontend can call the API from any origin.
     * (Important for local development when files are opened from the filesystem.)
     */
    static void addCorsHeaders(HttpExchange exchange) {
        exchange.getResponseHeaders().set("Access-Control-Allow-Origin",  "*");
        exchange.getResponseHeaders().set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
        exchange.getResponseHeaders().set("Access-Control-Allow-Headers", "Content-Type");
    }

    /**
     * Parses a URL-encoded form body into a key→value map.
     * Example input: "name=Alice+Smith&score=92.5"
     * Example output: {"name": "Alice Smith", "score": "92.5"}
     */
    static Map<String, String> parseBody(HttpExchange exchange) throws IOException {
        try (InputStream is = exchange.getRequestBody()) {
            String body = new String(is.readAllBytes(), StandardCharsets.UTF_8);
            return parseQueryString(body);
        }
    }

    /**
     * Parses a query string (key=value&key2=value2) into a Map.
     *
     * @param query The raw query string (may be null)
     * @return Map of decoded key-value pairs
     */
    static Map<String, String> parseQueryString(String query) {
        Map<String, String> params = new HashMap<>();
        if (query == null || query.isEmpty()) return params;

        for (String pair : query.split("&")) {
            String[] kv = pair.split("=", 2);
            if (kv.length == 2) {
                try {
                    String key   = URLDecoder.decode(kv[0], StandardCharsets.UTF_8.name());
                    String value = URLDecoder.decode(kv[1], StandardCharsets.UTF_8.name());
                    params.put(key, value);
                } catch (UnsupportedEncodingException e) {
                    // UTF-8 is always supported – this won't happen
                    params.put(kv[0], kv[1]);
                }
            }
        }
        return params;
    }

    /** Escapes a string for safe inclusion in a JSON value. */
    static String escapeJson(String input) {
        if (input == null) return "";
        return input.replace("\\", "\\\\").replace("\"", "\\\"");
    }
}
