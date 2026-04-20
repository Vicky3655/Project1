// ── DATA ──
let courses = [];
let assignments = [];
let currentFilter = 'all';
let currentSearch = '';
let sortField = 'title';
let isSortAsc = true;

const API = 'https://truemind.onrender.com/api/v1';

function getAccessToken() {
    return localStorage.getItem('access_token') || localStorage.getItem('access');
}

function getRole() {
    try {
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        return (user.role || '').toLowerCase();
    } catch { return ''; }
}

function isStudent() { return getRole() === 'student'; }
function isInstructor() { return getRole() === 'instructor' || getRole() === 'admin'; }

// ── FETCH ASSIGNMENTS ──
async function fetchAssignments() {
    try {
        const token = getAccessToken();
        const headers = { 'Authorization': `Bearer ${token}` };

        let url;
        if (isStudent()) {
            // Backend auto-filters to enrolled courses for students
            url = `${API}/assignments/`;
        } else {
            // Instructor-specific endpoint
            url = `${API}/assignments/my-assignments/`;
        }

        const res = await fetch(url, { headers });
        if (!res.ok) return;

        const data = await res.json();
        const apiData = data.results || data;

        assignments = apiData.map(a => ({
            id: a.id,
            title: a.title,
            course: a.course?.title || a.course || 'N/A',
            course_id: a.course?.id || a.course,
            dueDate: a.due_date || new Date().toISOString(),
            status: resolveStatus(a),
            description: a.description || '',
            max_score: a.max_score || 100,
        }));

        renderAssignments();
    } catch (e) { console.error('fetchAssignments error:', e); }
}

function resolveStatus(a) {
    if (!a.due_date) return 'active';
    return new Date(a.due_date) < new Date() ? 'closed' : 'active';
}

// ── FETCH COURSES (instructor only for dropdown) ──
async function fetchCourses() {
    if (!isInstructor()) return;
    try {
        const token = getAccessToken();
        const res = await fetch(`${API}/courses/my-courses/`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
            const data = await res.json();
            courses = data.results || data;
            populateCourseDropdown();
        }
    } catch (e) { console.error(e); }
}

// ── INIT ──
document.addEventListener('DOMContentLoaded', () => {
    applyRoleUI();
    initFilters();
    initSearch();
    initSort();
    initMobileMenu();
    fetchCourses();
    fetchAssignments();

    if (isInstructor()) {
        initAddModal();
    }
});

// ── ROLE-BASED UI ──
function applyRoleUI() {
    if (isStudent()) {
        // Hide ALL assignment creation buttons (header + empty state)
        document.querySelectorAll('.add-btn, .create-btn').forEach(b => b.style.display = 'none');
        // Update empty state messaging for students
        const emptyTitle = document.querySelector('.empty-state h2');
        const emptyDesc  = document.querySelector('.empty-state p');
        if (emptyTitle) emptyTitle.textContent = 'No assignments yet';
        if (emptyDesc)  emptyDesc.textContent  = 'Assignments from your enrolled courses will appear here.';
        // Hide instructor-only sidebar links
        document.querySelectorAll('a[href="students.html"], a[href="performance.html"]')
            .forEach(el => el.style.display = 'none');
    }
}


// ── FILTER ──
function initFilters() {
    const buttons = document.querySelectorAll('.filter-btn');
    buttons.forEach(btn => {
        btn.addEventListener('click', () => {
            buttons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentFilter = btn.dataset.filter;
            renderAssignments();
        });
    });
}

// ── SEARCH ──
function initSearch() {
    const input = document.querySelector('.search-wrap input');
    if (!input) return;
    input.addEventListener('input', (e) => {
        currentSearch = e.target.value.toLowerCase().trim();
        renderAssignments();
    });
}

// ── SORT ──
function initSort() {
    const btn = document.querySelector('.sort-btn');
    if (!btn) return;
    btn.addEventListener('click', () => {
        const fields = ['title', 'course', 'dueDate', 'status'];
        const currentIdx = fields.indexOf(sortField);
        sortField = fields[(currentIdx + 1) % fields.length];
        isSortAsc = true;
        renderAssignments();
    });
}

// ── RENDER ──
function renderAssignments() {
    const tbody = document.querySelector('.assignments-tbody');
    let filtered = assignments.filter(a => {
        const matchesFilter = currentFilter === 'all' || a.status === currentFilter;
        const matchesSearch =
            a.title.toLowerCase().includes(currentSearch) ||
            a.course.toLowerCase().includes(currentSearch) ||
            a.status.toLowerCase().includes(currentSearch);
        return matchesFilter && matchesSearch;
    });

    filtered.sort((a, b) => {
        let valA = a[sortField];
        let valB = b[sortField];
        if (sortField === 'dueDate') { valA = new Date(valA); valB = new Date(valB); }
        if (valA < valB) return isSortAsc ? -1 : 1;
        if (valA > valB) return isSortAsc ? 1 : -1;
        return 0;
    });

    if (filtered.length === 0) {
        tbody.innerHTML = '';
        document.querySelector('.empty-state').style.display = 'flex';
        return;
    }

    document.querySelector('.empty-state').style.display = 'none';
    tbody.innerHTML = filtered.map((a, i) => `
        <tr style="animation: fadeIn 0.3s ease ${i * 50}ms forwards; opacity: 0">
            <td><strong>${esc(a.title)}</strong>${a.description ? `<br><small style="color:#64748B">${esc(a.description.substring(0,60))}${a.description.length > 60 ? '...' : ''}</small>` : ''}</td>
            <td>${esc(a.course)}</td>
            <td>${formatDate(a.dueDate)}</td>
            <td><span class="status-badge ${a.status}">${capitalize(a.status)}</span></td>
            <td class="actions">
                ${isStudent()
                    ? `<button class="action-btn submit-btn" onclick="openSubmitModal(${a.id}, '${esc(a.title)}', ${a.max_score})">Submit</button>`
                    : `<button class="action-btn delete" onclick="deleteAssignment(${a.id}, '${esc(a.title)}')">Delete</button>`
                }
            </td>
        </tr>
    `).join('');
}

// ── STUDENT: SUBMIT ASSIGNMENT ──
let submitAssignmentId = null;

window.openSubmitModal = function(id, title, maxScore) {
    submitAssignmentId = id;
    let modal = document.getElementById('submit-modal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'submit-modal';
        modal.className = 'modal';
        modal.innerHTML = `
            <div class="modal-content">
                <button class="close-btn" onclick="document.getElementById('submit-modal').classList.remove('open')">&times;</button>
                <h2>Submit Assignment</h2>
                <p id="submit-modal-title" style="color:#64748B;margin-bottom:16px"></p>
                <form id="submit-assignment-form">
                    <label>Your Answer / Link</label>
                    <textarea name="content" rows="5" required placeholder="Write your answer or paste your submission link..." style="width:100%;padding:10px;border:1px solid #E2E8F0;border-radius:8px;font-family:Inter,sans-serif;font-size:14px;resize:vertical"></textarea>
                    <div id="submit-error" style="color:#EF4444;font-size:13px;margin-top:8px;display:none"></div>
                    <button type="submit" class="submit-btn" style="margin-top:16px;width:100%">Submit Assignment</button>
                </form>
                <div id="submit-success" style="display:none;color:#22C55E;font-weight:600;text-align:center;padding:12px">✓ Submitted successfully!</div>
            </div>
        `;
        document.body.appendChild(modal);

        document.getElementById('submit-assignment-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            const content = e.target.content.value.trim();
            const errEl = document.getElementById('submit-error');
            errEl.style.display = 'none';

            if (!content) { errEl.textContent = 'Please write your submission.'; errEl.style.display = 'block'; return; }

            const token = getAccessToken();
            try {
                const res = await fetch(`${API}/assignments/submissions/`, {
                    method: 'POST',
                    headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                    body: JSON.stringify({ assignment: submitAssignmentId, content })
                });
                if (res.ok) {
                    document.getElementById('submit-assignment-form').style.display = 'none';
                    document.getElementById('submit-success').style.display = 'block';
                    setTimeout(() => modal.classList.remove('open'), 2000);
                } else {
                    const err = await res.json();
                    errEl.textContent = err.detail || JSON.stringify(err);
                    errEl.style.display = 'block';
                }
            } catch (err) {
                errEl.textContent = 'An error occurred. Try again.';
                errEl.style.display = 'block';
            }
        });
    }

    document.getElementById('submit-modal-title').textContent = `${title} • Max Score: ${maxScore}`;
    document.getElementById('submit-assignment-form').style.display = 'block';
    document.getElementById('submit-success').style.display = 'none';
    document.getElementById('submit-assignment-form').reset();
    modal.classList.add('open');
    modal.onclick = (e) => { if (e.target === modal) modal.classList.remove('open'); };
};

// ── INSTRUCTOR: ADD ASSIGNMENT MODAL ──
function initAddModal() {
    const modal = document.getElementById('add-assignment-modal');
    if (!modal) return;

    const addBtns = document.querySelectorAll('.add-btn, .create-btn');
    const form = document.getElementById('add-assignment-form');
    const closeBtn = modal.querySelector('.close-btn');

    addBtns.forEach(btn => btn.addEventListener('click', () => modal.classList.add('open')));
    closeBtn.addEventListener('click', () => modal.classList.remove('open'));
    modal.addEventListener('click', (e) => { if (e.target === modal) modal.classList.remove('open'); });

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const fd = new FormData(form);
        const token = getAccessToken();
        try {
            // FormData automatically sets Multipart Content-Type with Boundary
            const res = await fetch(`${API}/assignments/`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` },
                body: fd
            });
            if (!res.ok) {
                const err = await res.json();
                alert(JSON.stringify(err));
                return;
            }
            fetchAssignments();
            modal.classList.remove('open');
            form.reset();
        } catch (err) { console.error(err); }
    });
}

// ── INSTRUCTOR: DELETE ──
async function deleteAssignment(id, title) {
    if (!confirm(`Delete "${title}"?`)) return;
    const token = getAccessToken();
    try {
        const res = await fetch(`${API}/assignments/${id}/`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) fetchAssignments();
        else alert('Failed to delete assignment');
    } catch (e) { console.error(e); }
}

// ── POPULATE COURSE DROPDOWN ──
function populateCourseDropdown() {
    const select = document.getElementById('courseSelect');
    if (!select) return;
    select.innerHTML = '<option value="">Select a course...</option>';
    courses.forEach(c => {
        const opt = document.createElement('option');
        opt.value = c.id;
        opt.textContent = c.title;
        select.appendChild(opt);
    });

    // Listen for course changes to populate lessons
    select.addEventListener('change', (e) => {
        const courseId = e.target.value;
        const lessonSelect = document.getElementById('lessonSelect');
        if (!lessonSelect) return;

        if (!courseId) {
            lessonSelect.innerHTML = '<option value="">Select a lesson...</option>';
            lessonSelect.disabled = true;
            return;
        }

        fetchLessonsForCourse(courseId);
    });
}

async function fetchLessonsForCourse(courseId) {
    const lessonSelect = document.getElementById('lessonSelect');
    if (!lessonSelect) return;

    lessonSelect.innerHTML = '<option value="">Loading lessons...</option>';
    lessonSelect.disabled = true;

    try {
        const token = getAccessToken();
        const res = await fetch(`${API}/lessons/?course=${courseId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
            const data = await res.json();
            const lessonsList = data.results || data;

            lessonSelect.innerHTML = '<option value="">Select a lesson...</option>';
            if (lessonsList.length === 0) {
                lessonSelect.innerHTML = '<option value="">No lessons found for this course</option>';
            } else {
                lessonsList.forEach(l => {
                    const opt = document.createElement('option');
                    opt.value = l.id;
                    opt.textContent = l.title;
                    lessonSelect.appendChild(opt);
                });
                lessonSelect.disabled = false;
            }
        } else {
            lessonSelect.innerHTML = '<option value="">Failed to load lessons</option>';
        }
    } catch (err) {
        console.error('fetchLessonsForCourse error:', err);
        lessonSelect.innerHTML = '<option value="">Error loading lessons</option>';
    }
}

// ── MOBILE MENU ──
function initMobileMenu() {
    const hamburger = document.querySelector('.hamburger-btn');
    const overlay = document.querySelector('.sidebar-overlay');
    const sidebar = document.querySelector('.sidebar');
    if (!hamburger || !overlay) return;
    hamburger.addEventListener('click', () => { sidebar.classList.add('mobile-open'); document.body.style.overflow = 'hidden'; });
    overlay.addEventListener('click', () => { sidebar.classList.remove('mobile-open'); document.body.style.overflow = ''; });
}

// ── HELPERS ──
function formatDate(dateStr) {
    return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function capitalize(str) {
    return str ? str.charAt(0).toUpperCase() + str.slice(1) : '';
}

function esc(str) {
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}