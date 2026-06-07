/**
 * app.js – Student Grade Tracker Frontend
 *
 * Handles all UI interactions:
 *   - Fetching and displaying students from the Java backend
 *   - Adding, editing, and deleting students via the REST API
 *   - Updating the statistics dashboard
 *   - Rendering the grade distribution chart
 *   - Modal open/close logic
 *   - Toast notifications
 *   - Live grade preview in forms
 *   - Search / filter
 *   - Mobile navigation toggle
 *
 * The app talks to the Java backend at http://localhost:8080/api/
 */

'use strict';

// -------------------------------------------------------
// Configuration
// -------------------------------------------------------

/** Base URL of the Java backend API. */
const API_BASE = 'http://localhost:8080/api';

// -------------------------------------------------------
// State
// -------------------------------------------------------

/** Locally cached copy of the student list (used for filtering). */
let allStudents = [];

// -------------------------------------------------------
// Initialisation
// -------------------------------------------------------

/** Runs when the DOM is fully loaded. */
document.addEventListener('DOMContentLoaded', () => {
  initForms();
  initNavToggle();
  loadDashboard();
});

/**
 * Loads both students and stats in parallel for fast startup.
 */
async function loadDashboard() {
  await Promise.all([loadStudents(), loadStats()]);
  renderGradeDistribution();
}

// -------------------------------------------------------
// API Helpers
// -------------------------------------------------------

/**
 * Generic fetch wrapper that:
 *   - Sets the correct Content-Type for POST / PUT
 *   - Throws a descriptive error on non-2xx responses
 *
 * @param {string} url    Full request URL
 * @param {object} [opts] fetch options (method, body, etc.)
 * @returns {Promise<any>} Parsed JSON response
 */
async function apiFetch(url, opts = {}) {
  // Default headers
  const headers = { 'Content-Type': 'application/x-www-form-urlencoded', ...opts.headers };
  const response = await fetch(url, { ...opts, headers });

  const text = await response.text();
  let data;
  try { data = JSON.parse(text); } catch { data = text; }

  if (!response.ok) {
    const msg = (data && data.error) ? data.error : `HTTP ${response.status}`;
    throw new Error(msg);
  }

  return data;
}

/** Serialises a plain object to an application/x-www-form-urlencoded string. */
function toFormBody(obj) {
  return Object.entries(obj)
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
    .join('&');
}

// -------------------------------------------------------
// Students – Load & Render
// -------------------------------------------------------

/**
 * Fetches all students from the backend and renders the table.
 */
async function loadStudents() {
  try {
    allStudents = await apiFetch(`${API_BASE}/students`);
    renderTable(allStudents);
  } catch (err) {
    console.error('Failed to load students:', err);
    showToast('Could not load students. Is the server running?', 'error');
  }
}

/**
 * Renders student rows into the data table.
 *
 * @param {Array} students  Array of student objects to display
 * @param {boolean} [highlight] If true, animates the first row (new insert)
 */
function renderTable(students, highlight = false) {
  const tbody      = document.getElementById('studentTableBody');
  const emptyState = document.getElementById('emptyState');

  if (!students || students.length === 0) {
    tbody.innerHTML = '';
    emptyState.hidden = false;
    return;
  }

  emptyState.hidden = true;

  tbody.innerHTML = students.map((s, index) => `
    <tr class="${highlight && index === students.length - 1 ? 'new-row' : ''}">
      <td>${s.id}</td>
      <td>
        <div class="student-name">
          <div class="student-avatar" style="background:${avatarColor(s.name)}" aria-hidden="true">
            ${initials(s.name)}
          </div>
          ${escapeHtml(s.name)}
        </div>
      </td>
      <td><strong>${s.score.toFixed(1)}</strong></td>
      <td>
        <span class="grade-badge grade-${s.grade}" aria-label="Grade ${s.grade}">
          ${s.grade}
        </span>
      </td>
      <td>
        <div class="score-bar-wrap" aria-label="${s.score.toFixed(1)} out of 100">
          <div class="score-bar-bg" role="progressbar" aria-valuenow="${s.score}" aria-valuemin="0" aria-valuemax="100">
            <div class="score-bar-fill" style="width:${s.score}%; background:${scoreBarColor(s.score)}"></div>
          </div>
          <span style="font-size:.75rem;color:var(--clr-text-muted);width:2.5rem;text-align:right">
            ${s.score.toFixed(0)}%
          </span>
        </div>
      </td>
      <td>
        <div class="row-actions">
          <button
            class="btn-icon"
            onclick="openEditModal(${s.id}, '${escapeHtml(s.name).replace(/'/g,"\\'")}', ${s.score})"
            aria-label="Edit score for ${escapeHtml(s.name)}"
            title="Edit score"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
            </svg>
          </button>
          <button
            class="btn-icon btn-icon--danger"
            onclick="openDeleteModal(${s.id}, '${escapeHtml(s.name).replace(/'/g,"\\'")}'"
            aria-label="Delete ${escapeHtml(s.name)}"
            title="Delete student"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
              <polyline points="3 6 5 6 21 6"/>
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
            </svg>
          </button>
        </div>
      </td>
    </tr>
  `).join('');
}

// -------------------------------------------------------
// Statistics – Load & Render
// -------------------------------------------------------

/**
 * Fetches dashboard statistics from the backend and updates the stat cards.
 */
async function loadStats() {
  try {
    const stats = await apiFetch(`${API_BASE}/stats`);
    const noData = stats.totalStudents === 0;

    document.getElementById('statTotal').textContent = stats.totalStudents;
    document.getElementById('statAvg').textContent   = noData ? 'No data' : stats.averageScore.toFixed(1);
    document.getElementById('statHigh').textContent  = noData ? 'No data' : (stats.highestScore.toFixed ? stats.highestScore.toFixed(1) : stats.highestScore);
    document.getElementById('statLow').textContent   = noData ? 'No data' : (stats.lowestScore.toFixed  ? stats.lowestScore.toFixed(1)  : stats.lowestScore);
    document.getElementById('statHighName').textContent = noData ? '' : (stats.highestName || '');
    document.getElementById('statLowName').textContent  = noData ? '' : (stats.lowestName  || '');
  } catch (err) {
    console.error('Failed to load stats:', err);
  }
}

// -------------------------------------------------------
// Grade Distribution Chart
// -------------------------------------------------------

/**
 * Counts students per grade and renders the bar chart.
 * Called after any add/edit/delete operation.
 */
function renderGradeDistribution() {
  const container = document.getElementById('gradeDistribution');

  // Count students by grade
  const counts = { A: 0, B: 0, C: 0, D: 0, F: 0 };
  allStudents.forEach(s => { if (counts[s.grade] !== undefined) counts[s.grade]++; });

  const total = allStudents.length || 1; // avoid division by zero
  const maxCount = Math.max(...Object.values(counts), 1);

  const gradeInfo = [
    { grade: 'A', label: 'Excellent', color: '#22c55e', bg: '#dcfce7', textColor: '#15803d' },
    { grade: 'B', label: 'Good',      color: '#3b82f6', bg: '#dbeafe', textColor: '#1d4ed8' },
    { grade: 'C', label: 'Average',   color: '#f59e0b', bg: '#fef9c3', textColor: '#854d0e' },
    { grade: 'D', label: 'Below Avg', color: '#f97316', bg: '#ffedd5', textColor: '#9a3412' },
    { grade: 'F', label: 'Failing',   color: '#ef4444', bg: '#fee2e2', textColor: '#b91c1c' },
  ];

  container.innerHTML = gradeInfo.map(info => {
    const count  = counts[info.grade];
    const pct    = Math.round((count / total) * 100);
    const barPct = maxCount > 0 ? Math.round((count / maxCount) * 100) : 0;

    return `
      <div class="grade-dist-item" role="listitem" aria-label="Grade ${info.grade}: ${count} students (${pct}%)">
        <div class="grade-dist-bar-wrap">
          <div class="grade-dist-bar bar-${info.grade}"
               style="height:${barPct}%; background:${info.color}"
               title="${count} student${count !== 1 ? 's' : ''}">
          </div>
        </div>
        <div class="dist-grade-label grade-badge grade-${info.grade}" aria-hidden="true">${info.grade}</div>
        <div class="dist-count" aria-hidden="true">${count} student${count !== 1 ? 's' : ''}</div>
        <div style="font-size:.65rem;color:var(--clr-text-faint)">${info.label}</div>
      </div>
    `;
  }).join('');
}

// -------------------------------------------------------
// Add Student
// -------------------------------------------------------

/** Sets up the add student form's submit handler. */
function initForms() {
  // --- Add form ---
  document.getElementById('addStudentForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!validateAddForm()) return;

    const name  = document.getElementById('addName').value.trim();
    const score = parseFloat(document.getElementById('addScore').value);

    const btn = document.getElementById('addSubmitBtn');
    btn.disabled = true;
    btn.textContent = 'Adding…';

    try {
      await apiFetch(`${API_BASE}/students`, {
        method: 'POST',
        body: toFormBody({ name, score }),
      });
      closeModal('addStudentModal');
      document.getElementById('addStudentForm').reset();
      document.getElementById('gradePreview').hidden = true;
      await loadDashboard();
      showToast(`${name} added successfully!`, 'success');
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      btn.disabled = false;
      btn.textContent = 'Add Student';
    }
  });

  // --- Edit form ---
  document.getElementById('editStudentForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!validateEditForm()) return;

    const id    = parseInt(document.getElementById('editId').value);
    const score = parseFloat(document.getElementById('editScore').value);
    const name  = document.getElementById('editName').value;

    try {
      await apiFetch(`${API_BASE}/students`, {
        method: 'PUT',
        body: toFormBody({ id, score }),
      });
      closeModal('editStudentModal');
      await loadDashboard();
      showToast(`Score updated for ${name}!`, 'success');
    } catch (err) {
      showToast(err.message, 'error');
    }
  });

  // Live grade preview – add form
  document.getElementById('addScore').addEventListener('input', () => {
    updateGradePreview('addScore', 'gradePreview', 'previewBadge');
  });

  // Live grade preview – edit form
  document.getElementById('editScore').addEventListener('input', () => {
    updateGradePreview('editScore', 'editGradePreview', 'editPreviewBadge');
  });
}

/** Validates the Add Student form. Returns true if valid. */
function validateAddForm() {
  let valid = true;

  const nameInput  = document.getElementById('addName');
  const scoreInput = document.getElementById('addScore');

  // Clear previous errors
  setFieldError(nameInput,  'addNameError',  '');
  setFieldError(scoreInput, 'addScoreError', '');

  if (!nameInput.value.trim()) {
    setFieldError(nameInput, 'addNameError', 'Name is required.');
    valid = false;
  }

  const score = parseFloat(scoreInput.value);
  if (isNaN(score) || score < 0 || score > 100) {
    setFieldError(scoreInput, 'addScoreError', 'Enter a score between 0 and 100.');
    valid = false;
  }

  return valid;
}

/** Validates the Edit form. Returns true if valid. */
function validateEditForm() {
  const scoreInput = document.getElementById('editScore');
  setFieldError(scoreInput, 'editScoreError', '');

  const score = parseFloat(scoreInput.value);
  if (isNaN(score) || score < 0 || score > 100) {
    setFieldError(scoreInput, 'editScoreError', 'Enter a score between 0 and 100.');
    return false;
  }
  return true;
}

/** Marks an input field as erroneous and shows an error message. */
function setFieldError(input, errorId, message) {
  const errorEl = document.getElementById(errorId);
  if (message) {
    input.classList.add('error');
    errorEl.textContent = message;
  } else {
    input.classList.remove('error');
    errorEl.textContent = '';
  }
}

/**
 * Shows a live grade preview as the user types a score.
 *
 * @param {string} scoreInputId   ID of the score input
 * @param {string} previewId      ID of the preview container
 * @param {string} badgeId        ID of the grade badge span
 */
function updateGradePreview(scoreInputId, previewId, badgeId) {
  const score   = parseFloat(document.getElementById(scoreInputId).value);
  const preview = document.getElementById(previewId);
  const badge   = document.getElementById(badgeId);

  if (isNaN(score) || score < 0 || score > 100) {
    preview.hidden = true;
    return;
  }

  const grade = calculateGrade(score);
  badge.textContent = grade;
  badge.className   = `grade-badge grade-${grade}`;
  preview.hidden    = false;
}

// -------------------------------------------------------
// Edit Student
// -------------------------------------------------------

/**
 * Opens the edit modal pre-populated with the student's current data.
 *
 * @param {number} id    Student ID
 * @param {string} name  Student name
 * @param {number} score Current score
 */
function openEditModal(id, name, score) {
  document.getElementById('editId').value    = id;
  document.getElementById('editName').value  = name;
  document.getElementById('editScore').value = score;

  // Show the current grade preview
  updateGradePreview('editScore', 'editGradePreview', 'editPreviewBadge');

  setFieldError(document.getElementById('editScore'), 'editScoreError', '');
  openModal('editStudentModal');
}

// -------------------------------------------------------
// Delete Student
// -------------------------------------------------------

/** ID of the student pending deletion (set when the delete modal opens). */
let pendingDeleteId = null;

/**
 * Opens the delete confirmation modal.
 *
 * @param {number} id   Student ID
 * @param {string} name Student name (shown in the confirmation message)
 */
function openDeleteModal(id, name) {
  pendingDeleteId = id;
  document.getElementById('deleteStudentName').textContent = name;

  document.getElementById('confirmDeleteBtn').onclick = async () => {
    try {
      await apiFetch(`${API_BASE}/students?id=${pendingDeleteId}`, { method: 'DELETE' });
      closeModal('deleteModal');
      await loadDashboard();
      showToast(`${name} has been removed.`, 'info');
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  openModal('deleteModal');
}

// -------------------------------------------------------
// Modal Management
// -------------------------------------------------------

/**
 * Opens a modal by removing the `hidden` attribute.
 * Traps focus inside the modal for accessibility.
 *
 * @param {string} modalId  The HTML id of the modal element
 */
function openModal(modalId) {
  const modal = document.getElementById(modalId);
  modal.hidden = false;

  // Focus the first focusable element inside the modal
  requestAnimationFrame(() => {
    const focusable = modal.querySelector('input:not([readonly]), button:not(.modal-close)');
    if (focusable) focusable.focus();
  });

  // Close when clicking the backdrop (outside the modal box)
  modal.addEventListener('click', handleBackdropClick);

  // Close on Escape key
  document.addEventListener('keydown', handleEscapeKey);
}

/**
 * Closes a modal by adding the `hidden` attribute.
 *
 * @param {string} modalId  The HTML id of the modal element
 */
function closeModal(modalId) {
  const modal = document.getElementById(modalId);
  modal.hidden = true;
  modal.removeEventListener('click', handleBackdropClick);
  document.removeEventListener('keydown', handleEscapeKey);
}

function handleBackdropClick(e) {
  if (e.target === e.currentTarget) {
    e.currentTarget.hidden = true;
    e.currentTarget.removeEventListener('click', handleBackdropClick);
    document.removeEventListener('keydown', handleEscapeKey);
  }
}

function handleEscapeKey(e) {
  if (e.key === 'Escape') {
    document.querySelectorAll('.modal-backdrop:not([hidden])').forEach(m => {
      m.hidden = true;
    });
    document.removeEventListener('keydown', handleEscapeKey);
  }
}

// -------------------------------------------------------
// Search / Filter
// -------------------------------------------------------

/**
 * Filters the table rows by the search input value.
 * Works on the locally cached `allStudents` array – no server round-trip.
 */
function filterTable() {
  const query   = document.getElementById('searchInput').value.toLowerCase().trim();
  const filtered = query
    ? allStudents.filter(s => s.name.toLowerCase().includes(query))
    : allStudents;
  renderTable(filtered);
}

// -------------------------------------------------------
// Toast Notifications
// -------------------------------------------------------

let toastTimer = null;

/**
 * Displays a brief toast notification at the bottom-right of the screen.
 *
 * @param {string} message  Text to display
 * @param {'success'|'error'|'info'} [type='info']  Colour theme
 */
function showToast(message, type = 'info') {
  const toast = document.getElementById('toast');
  toast.textContent = message;
  toast.className = `toast toast--${type}`;

  // Trigger layout recalculation so the CSS transition fires
  void toast.offsetHeight;
  toast.classList.add('show');

  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    toast.classList.remove('show');
  }, 3500);
}

// -------------------------------------------------------
// Mobile Navigation Toggle
// -------------------------------------------------------

/** Wires up the hamburger button to toggle the mobile nav. */
function initNavToggle() {
  const toggle = document.getElementById('navToggle');
  const links  = document.getElementById('navLinks');

  toggle.addEventListener('click', () => {
    const isOpen = links.classList.toggle('open');
    toggle.setAttribute('aria-expanded', isOpen);
  });

  // Highlight the active nav link on scroll
  const sections = document.querySelectorAll('section[id]');
  const navLinks  = document.querySelectorAll('.nav-link');

  window.addEventListener('scroll', () => {
    let current = '';
    sections.forEach(section => {
      const top = section.offsetTop - 80;
      if (window.scrollY >= top) current = section.id;
    });
    navLinks.forEach(link => {
      link.classList.toggle('active', link.getAttribute('href') === `#${current}`);
    });
  }, { passive: true });
}

// -------------------------------------------------------
// Utility Functions
// -------------------------------------------------------

/**
 * Calculates a letter grade from a numeric score.
 * Mirrors the logic in Student.java.
 *
 * @param {number} score  0 – 100
 * @returns {string}  'A' | 'B' | 'C' | 'D' | 'F'
 */
function calculateGrade(score) {
  if (score >= 90) return 'A';
  if (score >= 80) return 'B';
  if (score >= 70) return 'C';
  if (score >= 60) return 'D';
  return 'F';
}

/**
 * Returns a deterministic background colour for a student's avatar
 * based on the first character of their name.
 *
 * @param {string} name
 * @returns {string}  HSL colour string
 */
function avatarColor(name) {
  const COLORS = [
    '#4f46e5','#7c3aed','#2563eb','#0891b2','#059669',
    '#d97706','#dc2626','#db2777','#65a30d','#0284c7',
  ];
  const idx = (name.charCodeAt(0) || 0) % COLORS.length;
  return COLORS[idx];
}

/**
 * Extracts up to 2 initials from a full name.
 * e.g. "Alice Johnson" → "AJ"
 *
 * @param {string} name
 * @returns {string}
 */
function initials(name) {
  const parts = (name || '').trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return (parts[0]?.[0] || '?').toUpperCase();
}

/**
 * Returns a colour for the score progress bar based on performance.
 *
 * @param {number} score  0 – 100
 * @returns {string}  CSS colour
 */
function scoreBarColor(score) {
  if (score >= 90) return '#22c55e';
  if (score >= 80) return '#3b82f6';
  if (score >= 70) return '#f59e0b';
  if (score >= 60) return '#f97316';
  return '#ef4444';
}

/**
 * Escapes special HTML characters to prevent XSS.
 *
 * @param {string} str  Raw string
 * @returns {string}  HTML-safe string
 */
function escapeHtml(str) {
  const div = document.createElement('div');
  div.appendChild(document.createTextNode(str));
  return div.innerHTML;
}

// -------------------------------------------------------
// PDF Report Generation
// -------------------------------------------------------

/**
 * Generates and downloads a professional PDF report of the current
 * student data using jsPDF + jsPDF-AutoTable.
 *
 * The report includes:
 *   - Project title and exam name
 *   - Date/time of generation
 *   - Summary statistics (average, highest, lowest, total)
 *   - Full student table with grades
 */
function downloadPDF() {
  // Guard: need at least one student
  if (allStudents.length === 0) {
    showToast('Add at least one student before downloading a report.', 'error');
    return;
  }

  // Read the exam name (fallback to generic title if blank)
  const examName = document.getElementById('examNameInput').value.trim() || 'Grade Report';

  // Current date and time, formatted nicely
  const now = new Date();
  const dateStr = now.toLocaleDateString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric'
  });
  const timeStr = now.toLocaleTimeString('en-US', {
    hour: '2-digit', minute: '2-digit'
  });

  // Calculate stats directly from cached data
  const total   = allStudents.length;
  const avg     = allStudents.reduce((sum, s) => sum + s.score, 0) / total;
  const highest = allStudents.reduce((max, s) => s.score > max.score ? s : max, allStudents[0]);
  const lowest  = allStudents.reduce((min, s) => s.score < min.score ? s : min, allStudents[0]);

  // ---- Initialise jsPDF (A4, portrait) ----
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

  const pageW  = doc.internal.pageSize.getWidth();
  const margin = 18;
  const contentW = pageW - margin * 2;

  // ---- Colour palette (matches dashboard) ----
  const INDIGO  = [79,  70, 229];
  const DARK    = [15,  23,  42];
  const MUTED   = [100, 116, 139];
  const LIGHT   = [248, 250, 252];
  const WHITE   = [255, 255, 255];
  const BORDER  = [226, 232, 240];

  // =========================================================
  // HEADER BANNER
  // =========================================================
  doc.setFillColor(...INDIGO);
  doc.rect(0, 0, pageW, 38, 'F');

  // Logo circle
  doc.setFillColor(255, 255, 255, 0.15);
  doc.setDrawColor(255, 255, 255);
  doc.setLineWidth(0.4);
  doc.circle(margin + 7, 19, 7, 'D');

  // App title
  doc.setTextColor(...WHITE);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.text('GradeTracker', margin + 18, 16);

  // Subtitle line
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(199, 210, 254); // indigo-200
  doc.text('Student Grade Tracker Report', margin + 18, 23);

  // Date/time on the right side of banner
  doc.setFontSize(8);
  doc.setTextColor(199, 210, 254);
  doc.text(`Generated: ${dateStr}  |  ${timeStr}`, pageW - margin, 16, { align: 'right' });

  // =========================================================
  // EXAM NAME BLOCK
  // =========================================================
  doc.setFillColor(...LIGHT);
  doc.rect(0, 38, pageW, 18, 'F');
  doc.setDrawColor(...BORDER);
  doc.setLineWidth(0.3);
  doc.line(0, 56, pageW, 56);

  doc.setTextColor(...DARK);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.text(examName, margin, 50);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(...MUTED);
  doc.text(`${total} student${total !== 1 ? 's' : ''} enrolled`, margin, 55.5);

  // =========================================================
  // STATISTICS SUMMARY CARDS  (4 inline boxes)
  // =========================================================
  let y = 64;
  const cardW   = (contentW - 9) / 4;  // 3 gaps of 3mm
  const cardH   = 22;
  const cardGap = 3;

  const statCards = [
    { label: 'Total Students', value: String(total),           accent: [59, 130, 246] },
    { label: 'Average Score',  value: avg.toFixed(1),          accent: [16, 185, 129] },
    { label: 'Highest Score',  value: highest.score.toFixed(1) + '  (' + highest.grade + ')', accent: [139, 92, 246] },
    { label: 'Lowest Score',   value: lowest.score.toFixed(1)  + '  (' + lowest.grade  + ')', accent: [245, 158, 11] },
  ];

  statCards.forEach((card, i) => {
    const cx = margin + i * (cardW + cardGap);

    // Card background
    doc.setFillColor(...WHITE);
    doc.setDrawColor(...BORDER);
    doc.setLineWidth(0.3);
    doc.roundedRect(cx, y, cardW, cardH, 2, 2, 'FD');

    // Accent left bar
    doc.setFillColor(...card.accent);
    doc.roundedRect(cx, y, 2.5, cardH, 1, 1, 'F');

    // Label
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(...MUTED);
    doc.text(card.label.toUpperCase(), cx + 6, y + 7);

    // Value
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(...DARK);
    doc.text(card.value, cx + 6, y + 16);
  });

  // Sub-text: highest/lowest names
  y += cardH + 2;
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(7);
  doc.setTextColor(...MUTED);

  const highX = margin + 2 * (cardW + cardGap) + 6;
  const lowX  = margin + 3 * (cardW + cardGap) + 6;
  doc.text(highest.name, highX, y);
  doc.text(lowest.name,  lowX,  y);

  // =========================================================
  // STUDENT TABLE
  // =========================================================
  y += 8;

  // Section heading
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(...DARK);
  doc.text('Student Results', margin, y);

  // Horizontal rule under heading
  doc.setDrawColor(...BORDER);
  doc.setLineWidth(0.3);
  doc.line(margin, y + 2, pageW - margin, y + 2);

  y += 6;

  // Grade → colour map for the grade badge cell
  const gradeColors = {
    A: { bg: [220, 252, 231], text: [21, 128, 61]  },
    B: { bg: [219, 234, 254], text: [29, 78, 216]  },
    C: { bg: [254, 249, 195], text: [133, 77, 14]  },
    D: { bg: [255, 237, 213], text: [154, 52, 18]  },
    F: { bg: [254, 226, 226], text: [185, 28, 28]  },
  };

  // Build table rows
  const tableRows = allStudents.map((s, index) => [
    index + 1,
    s.name,
    s.score.toFixed(1),
    s.grade,
    s.score >= 90 ? 'Excellent'
      : s.score >= 80 ? 'Good'
      : s.score >= 70 ? 'Average'
      : s.score >= 60 ? 'Below Average'
      : 'Failing',
  ]);

  doc.autoTable({
    startY: y,
    margin: { left: margin, right: margin },
    head: [['#', 'Student Name', 'Score', 'Grade', 'Performance']],
    body: tableRows,
    styles: {
      font: 'helvetica',
      fontSize: 9,
      cellPadding: { top: 3.5, bottom: 3.5, left: 4, right: 4 },
      textColor: DARK,
      lineColor: BORDER,
      lineWidth: 0.2,
    },
    headStyles: {
      fillColor: INDIGO,
      textColor: WHITE,
      fontStyle: 'bold',
      fontSize: 8,
      halign: 'left',
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
    columnStyles: {
      0: { halign: 'center', cellWidth: 10 },
      2: { halign: 'center', cellWidth: 20 },
      3: { halign: 'center', cellWidth: 18 },
      4: { halign: 'left' },
    },
    // Colour the Grade cell based on letter
    didDrawCell(data) {
      if (data.section === 'body' && data.column.index === 3) {
        const grade = data.cell.raw;
        const gc = gradeColors[grade];
        if (gc) {
          doc.setFillColor(...gc.bg);
          const pad = 1.5;
          doc.roundedRect(
            data.cell.x + pad,
            data.cell.y + pad,
            data.cell.width - pad * 2,
            data.cell.height - pad * 2,
            1.5, 1.5, 'F'
          );
          doc.setTextColor(...gc.text);
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(9);
          doc.text(
            grade,
            data.cell.x + data.cell.width / 2,
            data.cell.y + data.cell.height / 2 + 1,
            { align: 'center' }
          );
        }
      }
    },
  });

  // =========================================================
  // FOOTER ON EVERY PAGE
  // =========================================================
  const pageCount = doc.internal.getNumberOfPages();
  for (let p = 1; p <= pageCount; p++) {
    doc.setPage(p);
    const footerY = doc.internal.pageSize.getHeight() - 10;

    doc.setDrawColor(...BORDER);
    doc.setLineWidth(0.3);
    doc.line(margin, footerY - 2, pageW - margin, footerY - 2);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(...MUTED);
    doc.text('Student Grade Tracker  ·  Confidential Academic Report', margin, footerY + 1);
    doc.text(`Page ${p} of ${pageCount}`, pageW - margin, footerY + 1, { align: 'right' });
  }

  // =========================================================
  // SAVE THE FILE
  // =========================================================
  const safeExam = examName.replace(/[^a-z0-9]/gi, '_').substring(0, 40);
  doc.save(`Grade_Report_${safeExam}.pdf`);
  showToast('PDF report downloaded!', 'success');
}
