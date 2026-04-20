/**
 * students.js – Instructor Student Management
 */

const API = 'https://truemind.onrender.com/api/v1';

// ── State ──
let students = [];
let instructorCourses = []; // To populate enrollment list
let currentFilter = 'all';
let searchQuery = '';
let sortKey = '';
let sortDir = 1; // 1 = asc, -1 = desc
let currentPage = 1;
const PER_PAGE = 8;
let editingId = null; // enrollment_id
let deletingId = null; // enrollment_id

// ── DOM refs ──
const tableBody = document.getElementById('tableBody');
const studentsTable = document.getElementById('studentsTable');
const emptyState = document.getElementById('emptyState');
const pagination = document.getElementById('pagination');
const searchInput = document.getElementById('searchInput');
const modalOverlay = document.getElementById('modalOverlay');
const deleteOverlay = document.getElementById('deleteOverlay');
const modalTitle = document.getElementById('modalTitle');
const saveBtn = document.getElementById('saveBtn');

const addFields = document.getElementById('addStudentFields');
const editFields = document.getElementById('editStudentFields');
const inputEmail = document.getElementById('inputEmail');
const inputName = document.getElementById('inputName');
const inputCourse = document.getElementById('inputCourse');
const inputStatus = document.getElementById('inputStatus');
const inputProgress = document.getElementById('inputProgress');

function authHeaders(extra = {}) {
    const token = localStorage.getItem('access') || localStorage.getItem('access_token');
    return { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json', ...extra };
}

// ── Initial Data Fetching ──
async function fetchData() {
    try {
        const response = await fetch(`${API}/courses/my-students/`, { headers: authHeaders() });
        if (!response.ok) throw new Error('Failed to fetch students');

        const data = await response.json();
        students = (data.results || data).map(s => ({
            id: s.student_id,
            enrollment_id: s.enrollment_id,
            name: s.full_name || s.username || 'Student',
            email: s.email,
            course_id: s.course_id,
            course: s.course_title,
            progress: Math.round(s.progress_percentage || 0),
            status: s.status || 'Active'
        }));

        render();
    } catch (err) {
        console.error('Fetch error:', err);
    }
}

async function fetchInstructorCourses() {
    try {
        const response = await fetch(`${API}/courses/my-courses/`, { headers: authHeaders() });
        if (!response.ok) return;

        const data = await response.json();
        instructorCourses = data.results || data;

        // Populate dropdown
        inputCourse.innerHTML = '<option value="">Select a course</option>';
        instructorCourses.forEach(c => {
            const opt = document.createElement('option');
            opt.value = c.id;
            opt.textContent = c.title;
            inputCourse.appendChild(opt);
        });
    } catch (err) {
        console.error('Failed to fetch instructor courses:', err);
    }
}

// ── Rendering ──
function getSortedAndFiltered() {
    let list = students.filter(s => {
        const matchFilter = currentFilter === 'all' || s.status.toLowerCase() === currentFilter.toLowerCase();
        const q = searchQuery.toLowerCase();
        const matchSearch = s.name.toLowerCase().includes(q) || s.email.toLowerCase().includes(q) || s.course.toLowerCase().includes(q);
        return matchFilter && matchSearch;
    });

    if (sortKey) {
        list.sort((a, b) => {
            let av = a[sortKey], bv = b[sortKey];
            if (typeof av === 'string') {
                av = av.toLowerCase();
                bv = bv.toLowerCase();
            }
            return av < bv ? -sortDir : av > bv ? sortDir : 0;
        });
    }

    return list;
}

function render() {
    const filtered = getSortedAndFiltered();
    const total = filtered.length;
    const pages = Math.ceil(total / PER_PAGE) || 1;

    if (currentPage > pages) currentPage = pages;

    const slice = filtered.slice((currentPage - 1) * PER_PAGE, currentPage * PER_PAGE);

    tableBody.innerHTML = '';

    if (slice.length === 0) {
        emptyState.style.display = 'block';
        studentsTable.style.display = 'none';
    } else {
        emptyState.style.display = 'none';
        studentsTable.style.display = 'table';

        slice.forEach((s, i) => {
            const isActive = s.status === 'Active' || s.status === 'Completed';
            const barColor = s.progress >= 70 ? '#22C55E' : s.progress >= 40 ? '#F59E0B' : '#EF4444';

            const tr = document.createElement('tr');
            tr.style.animationDelay = `${i * 30}ms`;
            tr.innerHTML = `
                <td><strong>${esc(s.name)}</strong></td>
                <td>${esc(s.email)}</td>
                <td>${esc(s.course)}</td>
                <td>
                    <div class="progress-cell">
                        <div class="progress-bar-wrap">
                            <div class="progress-bar-fill" style="width:${s.progress}%; background:${barColor}"></div>
                        </div>
                        <span class="progress-label">${s.progress}%</span>
                    </div>
                </td>
                <td>
                    <span class="status-badge">
                        <span class="dot" style="background:${isActive ? '#22C55E' : '#EF4444'}"></span>
                        ${esc(s.status)}
                    </span>
                </td>
                <td>
                    <div class="action-btns">
                        <button class="btn-edit" onclick="openEdit(${s.enrollment_id})">Status</button>
                        <button class="btn-del" onclick="openDelete(${s.enrollment_id})">Unenroll</button>
                    </div>
                </td>
            `;
            tableBody.appendChild(tr);
        });
    }

    renderPagination(pages);
}

function renderPagination(pages) {
    pagination.innerHTML = '';
    if (pages <= 1) return;

    for (let p = 1; p <= pages; p++) {
        const btn = document.createElement('button');
        btn.className = `page-btn ${p === currentPage ? 'active' : ''}`;
        btn.textContent = p;
        btn.onclick = () => { currentPage = p; render(); };
        pagination.appendChild(btn);
    }
}

// ── Sorting ──
window.sortTable = function (key) {
    if (sortKey === key) sortDir *= -1;
    else { sortKey = key; sortDir = 1; }
    currentPage = 1;
    render();
};

// ── Filtering & Search ──
document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentFilter = btn.dataset.filter;
        currentPage = 1;
        render();
    });
});

searchInput.addEventListener('input', () => {
    searchQuery = searchInput.value.trim();
    currentPage = 1;
    render();
});

// ── Modal Actions ──
document.getElementById('openModalBtn').addEventListener('click', () => {
    editingId = null;
    modalTitle.textContent = 'Enroll Student';
    saveBtn.textContent = 'Enroll Student';
    addFields.style.display = 'block';
    editFields.style.display = 'none';
    inputEmail.readOnly = false;
    inputCourse.disabled = false;
    clearForm();
    openModal(modalOverlay);
});

window.openEdit = function (enrollmentId) {
    const s = students.find(s => s.enrollment_id === enrollmentId);
    if (!s) return;

    editingId = enrollmentId;
    modalTitle.textContent = 'Update Status';
    saveBtn.textContent = 'Update';
    addFields.style.display = 'none';
    editFields.style.display = 'block';
    
    inputName.value = s.name;
    inputCourse.value = s.course_id;
    inputCourse.disabled = true; // Cannot change course on existing enrollment
    inputStatus.value = s.status === 'Completed' ? 'Active' : s.status; // simplified for now
    inputProgress.value = s.progress;
    
    openModal(modalOverlay);
};

saveBtn.addEventListener('click', async () => {
    if (editingId) {
        // UI only update for now as backend doesn't support manual progress override via this endpoint
        closeModal(modalOverlay);
    } else {
        const email = inputEmail.value.trim();
        const courseId = inputCourse.value;

        if (!email || !courseId) return alert('Email and course are required.');

        try {
            const response = await fetch(`${API}/courses/${courseId}/enroll-student-by-email/`, {
                method: 'POST',
                headers: authHeaders(),
                body: JSON.stringify({ email })
            });

            if (!response.ok) {
                const err = await response.json();
                return alert(err.detail || 'Failed to enroll student');
            }

            alert('Student successfully enrolled!');
            closeModal(modalOverlay);
            fetchData();
        } catch (err) {
            alert('An error occurred during enrollment.');
        }
    }
});

window.openDelete = function (enrollmentId) {
    deletingId = enrollmentId;
    const s = students.find(s => s.enrollment_id === enrollmentId);
    document.getElementById('deleteName').textContent = s ? `${s.name} from ${s.course}` : '';
    openModal(deleteOverlay);
};

document.getElementById('confirmDeleteBtn').addEventListener('click', async () => {
    const s = students.find(s => s.enrollment_id === deletingId);
    if (!s) return;

    try {
        const response = await fetch(`${API}/courses/${s.course_id}/unenroll-student/`, {
            method: 'POST',
            headers: authHeaders(),
            body: JSON.stringify({ student_id: s.id })
        });

        if (!response.ok) {
            const err = await response.json();
            return alert(err.detail || 'Failed to unenroll student');
        }

        closeModal(deleteOverlay);
        fetchData();
    } catch (err) {
        alert('An error occurred.');
    }
});

// ── Helpers ──
function openModal(o) { o.classList.add('open'); }
function closeModal(o) { o.classList.remove('open'); }
document.getElementById('closeModalBtn').onclick = () => closeModal(modalOverlay);
document.getElementById('cancelBtn').onclick = () => closeModal(modalOverlay);
document.getElementById('closeDeleteBtn').onclick = () => closeModal(deleteOverlay);
document.getElementById('cancelDeleteBtn').onclick = () => closeModal(deleteOverlay);

function clearForm() {
    inputEmail.value = '';
    inputName.value = '';
    inputCourse.value = '';
    inputProgress.value = 0;
    inputStatus.value = 'Active';
}

function esc(str) {
    if (!str) return '';
    return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// ── Initialize ──
fetchData();
fetchInstructorCourses();
