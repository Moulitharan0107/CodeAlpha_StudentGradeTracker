# 🎓 Student Grade Tracker

A professional, full-stack **Student Grade Tracker** built with **Java** (backend) and **HTML / CSS / JavaScript** (frontend). No frameworks, no external libraries — just clean, beginner-friendly Java and modern vanilla JS.

> Built as a portfolio and internship submission project.

---

## 📸 Screenshots

> _Add screenshots to the `docs/screenshots/` folder and update the paths below._

| Dashboard Overview | Add Student Modal |
|---|---|
| ![Dashboard](docs/screenshots/dashboard.png) | ![Add Student](docs/screenshots/add-student.png) |

| Students Table | Grade Distribution |
|---|---|
| ![Table](docs/screenshots/table.png) | ![Chart](docs/screenshots/chart.png) |

---

## ✨ Features

### Student Management
- ➕ **Add students** with name and score
- 📋 **View all students** in a sortable table
- ✏️ **Update scores** with live grade preview
- 🗑️ **Delete students** with confirmation dialog
- 🔍 **Search** by student name in real time

### Dashboard Statistics
- 📊 Total number of students
- 📈 Class average score
- 🏆 Highest scoring student
- 📉 Lowest scoring student

### Grade Classification
| Range | Grade |
|-------|-------|
| 90 – 100 | **A** – Excellent |
| 80 – 89  | **B** – Good      |
| 70 – 79  | **C** – Average   |
| 60 – 69  | **D** – Below Average |
| Below 60 | **F** – Failing   |

### Grade Distribution Chart
- Visual bar chart showing the distribution of grades across all five categories

### UI / UX
- 🎨 Modern SaaS-style dashboard design
- 📱 Fully responsive (mobile, tablet, desktop)
- 🔔 Toast notifications for every action
- 💫 Smooth animations and hover effects
- ♿ Accessible — keyboard navigable, ARIA labels, live regions

---

## 🗂️ Project Structure

```
student-grade-tracker/
│
├── src/
│   └── main/
│       ├── java/
│       │   └── com/gradetracker/
│       │       ├── Student.java          # Data model (OOP with encapsulation)
│       │       ├── GradeTracker.java     # Business logic + JSON serialisation
│       │       ├── SimpleHttpServer.java # Built-in HTTP server + REST API
│       │       └── Main.java             # Entry point + sample data loader
│       │
│       └── webapp/
│           ├── index.html               # Dashboard UI
│           ├── style.css                # Professional CSS (design tokens, responsive)
│           └── app.js                   # Frontend logic (fetch API, DOM, modals)
│
├── docs/
│   └── screenshots/                     # Add screenshots here
│
├── out/                                 # Compiled .class files (generated, gitignored)
│
├── compile.sh   / compile.bat           # Build scripts (Linux/Mac / Windows)
├── run.sh       / run.bat               # Run scripts
├── .gitignore
└── README.md
```

---

## 🛠️ Tech Stack

| Layer     | Technology |
|-----------|------------|
| Backend   | Java 11+, `com.sun.net.httpserver` (built-in HTTP server) |
| Frontend  | HTML5, CSS3, Vanilla JavaScript (ES2017+) |
| Data Storage | In-memory `ArrayList` (no database required) |
| Build     | Shell scripts (`javac` + `java`) |

---

## ▶️ How to Run

### Prerequisites
- **Java 11** or later installed  
  Verify with: `java -version`
- A modern web browser (Chrome, Firefox, Edge, Safari)

### macOS / Linux

```bash
# 1. Open a terminal and navigate to the project folder
cd student-grade-tracker

# 2. Make the scripts executable (first time only)
chmod +x compile.sh run.sh

# 3. Compile the Java source files
./compile.sh

# 4. Start the server
./run.sh
```

### Windows

```cmd
REM Open Command Prompt and navigate to the project folder
cd student-grade-tracker

REM Compile
compile.bat

REM Run
run.bat
```

### Open the app

After the server starts you will see:

```
╔══════════════════════════════════════════════╗
║       Student Grade Tracker – Server Ready   ║
╠══════════════════════════════════════════════╣
║  Open:  http://localhost:8080                ║
║  Press Ctrl+C to stop the server             ║
╚══════════════════════════════════════════════╝
```

Open **http://localhost:8080** in your browser.

> 10 sample students are loaded automatically so you can explore all features immediately.

---

## 🔌 REST API Reference

All endpoints are served at `http://localhost:8080`.

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET`  | `/api/students` | Get all students as JSON |
| `POST` | `/api/students` | Add a new student (`name`, `score` in body) |
| `PUT`  | `/api/students` | Update a student's score (`id`, `score` in body) |
| `DELETE` | `/api/students?id=1` | Delete a student by ID |
| `GET`  | `/api/stats` | Get dashboard statistics |

### Example responses

**GET /api/students**
```json
[
  {"id":1,"name":"Alice Johnson","score":95.0,"grade":"A"},
  {"id":2,"name":"Bob Williams","score":88.5,"grade":"B"}
]
```

**GET /api/stats**
```json
{
  "totalStudents": 10,
  "averageScore": 79.4,
  "highestScore": 98.5,
  "lowestScore": 55.0,
  "highestName": "James Miller",
  "lowestName": "Frank Garcia"
}
```

---

## 🧠 OOP Concepts Demonstrated

| Concept | Where |
|---------|-------|
| **Classes & Objects** | `Student`, `GradeTracker`, `SimpleHttpServer` |
| **Encapsulation** | Private fields + public getters/setters in `Student` |
| **Constructors** | `Student(id, name, score)`, `GradeTracker()` |
| **ArrayList** | `GradeTracker.students` collection |
| **Exception Handling** | `setScore()` validation, server error handling |
| **Optional** | `findStudentById()`, `getHighestScoreStudent()` |
| **Inner Classes** | `StudentHandler`, `StatsHandler`, `StaticFileHandler` |
| **Method Overriding** | `toString()` in `Student` |

---

## 📦 Sample Data

The app pre-loads 10 students covering all grade categories:

| Name | Score | Grade |
|------|-------|-------|
| James Miller | 98.5 | A |
| Alice Johnson | 95.0 | A |
| Emma Thompson | 91.0 | A |
| Bob Williams | 88.5 | B |
| Henry Brown | 84.0 | B |
| Grace Wilson | 79.5 | C |
| Carol Martinez | 73.0 | C |
| Isabella Davis | 67.0 | D |
| David Lee | 62.5 | D |
| Frank Garcia | 55.0 | F |

---

## 🤝 Contributing

1. Fork this repository
2. Create a feature branch: `git checkout -b feature/my-feature`
3. Commit your changes: `git commit -m "Add my feature"`
4. Push to the branch: `git push origin feature/my-feature`
5. Open a Pull Request

---

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

---

<p align="center">Made with ☕ Java and a lot of CSS</p>
