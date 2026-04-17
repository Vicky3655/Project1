// ── Data ──
let students = []; // Data will be fetched via API
// ── State ──
let nextId        = 1;
let currentFilter = 'all';
let searchQuery   = '';
let sortKey       = '';
let sortDir       = 1;        // 1 = asc, -1 = desc
let currentPage   = 1;
const PER_PAGE    = 5;
let editingId     = null;
let deletingId    = null;

// ── DOM refs ──
const tableBody     = document.getElementById('tableBody');
const emptyState    = document.getElementById('emptyState');
const pagination    = document.getElementById('pagination');
const searchInput   = document.getElementById('searchInput');
const modalOverlay  = document.getElementById('modalOverlay');
const deleteOverlay = document.getElementById('deleteOverlay');
const modalTitle    = document.getElementById('modalTitle');
const saveBtn       = document.getElementById('saveBtn');

// ── Render ──
function getFiltered() {
    return students.filter(s => {
        const matchFilter =
            currentFilter === 'all' ||
            s.status.toLowerCase() === currentFilter;
        const q = searchQuery.toLowerCase();
        const matchSearch =
            s.name.toLowerCase().includes(q)   ||
            s.email.toLowerCase().includes(q)  ||
            s.course.toLowerCase().includes(q);
        return matchFilter && matchSearch;
    });
}

function getSorted(list) {
    if (!sortKey) return list;
    return [...list].sort((a, b) => {
        let av = a[sortKey], bv = b[sortKey];
        if (sortKey === 'progress') { av = +av; bv = +bv; }
        else { av = String(av).toLowerCase(); bv = String(bv).toLowerCase(); }
        return av < bv ? -sortDir : av > bv ? sortDir : 0;
    });
}

function render() {
    const filtered = getSorted(getFiltered());
    const total    = filtered.length;
    const pages    = Math.ceil(total / PER_PAGE) || 1;

    if (currentPage > pages) currentPage = pages;

    const slice = filtered.slice((currentPage - 1) * PER_PAGE, currentPage * PER_PAGE);

    tableBody.innerHTML = '';

    if (slice.length === 0) {
        emptyState.style.display = 'block';
        document.getElementById('studentsTable').style.display = 'none';
    } else {
        emptyState.style.display = 'none';
        document.getElementById('studentsTable').style.display = 'table';

        slice.forEach((s, i) => {
            const isActive  = s.status === 'Active';
            const barColor  = s.progress >= 70 ? '#22C55E' : s.progress >= 40 ? '#F59E0B' : '#EF4444';

            const tr = document.createElement('tr');
            tr.style.animationDelay = `${i * 40}ms`;
            tr.innerHTML = `
                <td><strong>${esc(s.name)}</strong></td>
                <td>${esc(s.email)}</td>
                <td>${esc(s.course)}</td>
                <td>
                    <div class="progress-cell">
                        <div class="progress-bar-wrap">
                            <div class="progress-bar-fill"
                                 style="width:${s.progress}%; background:${barColor}"></div>
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
                        <button class="btn-edit" onclick="openEdit(${s.id})">Edit</button>
                        <button class="btn-del"  onclick="openDelete(${s.enrollment_id})">Unenroll</button>
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

    // Prev
    const prev = makePageBtn('←', currentPage === 1);
    prev.onclick = () => { if (currentPage > 1) { currentPage--; render(); } };
    pagination.appendChild(prev);

    // Pages
    for (let p = 1; p <= pages; p++) {
        const btn = makePageBtn(p, false);
        if (p === currentPage) btn.classList.add('active');
        btn.onclick = () => { currentPage = p; render(); };
        pagination.appendChild(btn);
    }

    // Next
    const next = makePageBtn('→', currentPage === pages);
    next.onclick = () => { if (currentPage < pages) { currentPage++; render(); } };
    pagination.appendChild(next);
}

function makePageBtn(label, disabled) {
    const btn = document.createElement('button');
    btn.className = 'page-btn';
    btn.textContent = label;
    btn.disabled = disabled;
    return btn;
}

// ── Sort ──
window.sortTable = function(key) {
    if (sortKey === key) { sortDir *= -1; }
    else { sortKey = key; sortDir = 1; }
    currentPage = 1;
    render();
};

// ── Filter buttons ──
document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentFilter = btn.dataset.filter;
        currentPage   = 1;
        render();
    });
});

// ── Search ──
searchInput.addEventListener('input', () => {
    searchQuery = searchInput.value.trim();
    currentPage = 1;
    render();
});

// ── Modal: Add ──
document.getElementById('openModalBtn').addEventListener('click', () => {
    editingId = null;
    modalTitle.textContent = 'Add Student';
    saveBtn.textContent    = 'Save Student';
    clearForm();
    openModal(modalOverlay);
});

document.getElementById('closeModalBtn').addEventListener('click', () => closeModal(modalOverlay));
document.getElementById('cancelBtn').addEventListener('click', () => closeModal(modalOverlay));

modalOverlay.addEventListener('click', e => { if (e.target === modalOverlay) closeModal(modalOverlay); });

// ── Modal: Save ──
saveBtn.addEventListener('click', () => {
    const name     = document.getElementById('inputName').value.trim();
    const email    = document.getElementById('inputEmail').value.trim();
    const course   = document.getElementById('inputCourse').value;
    const progress = parseInt(document.getElementById('inputProgress').value);
    const status   = document.getElementById('inputStatus').value;

    if (!name || !email || !course || isNaN(progress)) {
        shakeModal();
        return;
    }

    if (editingId !== null) {
        const idx = students.findIndex(s => s.id === editingId);
        if (idx !== -1) {
            students[idx] = { id: editingId, name, email, course, progress: Math.min(100, Math.max(0, progress)), status };
        }
    } else {
        students.push({ id: nextId++, name, email, course, progress: Math.min(100, Math.max(0, progress)), status });
    }

    closeModal(modalOverlay);
    render();
});

// ── Modal: Edit ──
window.openEdit = function(id) {
    const s = students.find(s => s.id === id);
    if (!s) return;
    editingId = id;
    modalTitle.textContent = 'Edit Student';
    saveBtn.textContent    = 'Update Student';
    document.getElementById('inputName').value     = s.name;
    document.getElementById('inputEmail').value    = s.email;
    document.getElementById('inputCourse').value   = s.course;
    document.getElementById('inputProgress').value = s.progress;
    document.getElementById('inputStatus').value   = s.status;
    openModal(modalOverlay);
};

// ── Modal: Delete ──
window.openDelete = function(id) {
    deletingId = id;
    const s = students.find(s => s.id === id);
    document.getElementById('deleteName').textContent = s ? s.name : '';
    openModal(deleteOverlay);
};

document.getElementById('closeDeleteBtn').addEventListener('click', () => closeModal(deleteOverlay));
document.getElementById('cancelDeleteBtn').addEventListener('click', () => closeModal(deleteOverlay));
deleteOverlay.addEventListener('click', e => { if (e.target === deleteOverlay) closeModal(deleteOverlay); });

document.getElementById('confirmDeleteBtn').addEventListener('click', () => {
    students = students.filter(s => s.id !== deletingId);
    deletingId = null;
    closeModal(deleteOverlay);
    render();
});

// ── Helpers ──
function openModal(overlay) { overlay.classList.add('open'); }
function closeModal(overlay) { overlay.classList.remove('open'); }

function clearForm() {
    document.getElementById('inputName').value     = '';
    document.getElementById('inputEmail').value    = '';
    document.getElementById('inputCourse').value   = '';
    document.getElementById('inputProgress').value = '';
    document.getElementById('inputStatus').value   = 'Active';
}

function shakeModal() {
    const m = document.querySelector('#modalOverlay .modal');
    m.style.animation = 'none';
    m.offsetHeight; // reflow
    m.style.animation = 'shake 0.35s ease';
}

// Add shake keyframes dynamically
const style = document.createElement('style');
style.textContent = `
@keyframes shake {
    0%,100% { transform: translateX(0) scale(1); }
    20%      { transform: translateX(-8px) scale(1); }
    40%      { transform: translateX(8px) scale(1); }
    60%      { transform: translateX(-5px) scale(1); }
    80%      { transform: translateX(5px) scale(1); }
}`;
document.head.appendChild(style);

function esc(str) {
    return String(str)
        .replace(/&/g,'&amp;')
        .replace(/</g,'&lt;')
        .replace(/>/g,'&gt;')
        .replace(/"/g,'&quot;');
}

// ── Init ──
async function fetchData() {
    try {
        const token = localStorage.getItem('access') || localStorage.getItem('access_token');
        if (!token) {
            console.error('No token found');
            return;
        }
        const headers = { 
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        };

        const response = await fetch('https://truemind.onrender.com/api/v1/courses/my-students/', { headers });
        if (!response.ok) {
            const err = await response.json();
            console.error('Failed to fetch students:', err);
            return;
        }
        
        const data = await response.json();
        const results = data.results || data;
        
        students = results.map(s => ({
            id: s.student_id,
            enrollment_id: s.enrollment_id,
            course_id: s.course_id,
            name: s.full_name || s.username || 'N/A',
            email: s.email,
            course: s.course_title,
            progress: Math.round(s.progress_percentage),
            status: s.status
        }));
        
        render();
    } catch (err) {
        console.error('Failed to fetch students:', err);
    }
}

// ── Modal: Delete / Unenroll ──
window.openDelete = function(enrollmentId) {
    deletingId = enrollmentId; // Store enrollment_id for easier lookups
    const s = students.find(s => s.enrollment_id === enrollmentId);
    document.getElementById('deleteName').textContent = s ? `${s.name} from ${s.course}` : '';
    openModal(deleteOverlay);
};

document.getElementById('confirmDeleteBtn').addEventListener('click', async () => {
    const s = students.find(s => s.enrollment_id === deletingId);
    if (!s) return;

    try {
        const token = localStorage.getItem('access') || localStorage.getItem('access_token');
        const response = await fetch(`https://truemind.onrender.com/api/v1/courses/${s.course_id}/unenroll-student/`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ student_id: s.id })
        });

        if (!response.ok) {
            const err = await response.json();
            alert(err.detail || 'Failed to unenroll student');
            return;
        }

        alert('Student successfully unenrolled from the course.');
        closeModal(deleteOverlay);
        fetchData(); // Refresh the list
    } catch (err) {
        console.error('Unenroll error:', err);
        alert('An error occurred.');
    }
});

fetchData();

