// ── DATA ──
const courses = [
    'Introduction to Product Design',
    'UI/UX Design Fundamentals',
    'Frontend Development for Designers',
    'Data Analysis with Python & SQL',
    'Introduction to Backend Development',
    'Cloud Computing & AWS'
];

let assignments = JSON.parse(localStorage.getItem('assignments')) || [];
let currentFilter = 'all';
let currentSearch = '';
let sortField = 'title';
let isSortAsc = true;

function saveAssignments() {
    localStorage.setItem('assignments', JSON.stringify(assignments));
}

// ── INIT ──
document.addEventListener('DOMContentLoaded', () => {
    initFilters();
    initSearch();
    initSort();
    initAddModal();
    initMobileMenu();
    renderAssignments();
    populateCourseDropdown();
});

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
    input.addEventListener('input', (e) => {
        currentSearch = e.target.value.toLowerCase().trim();
        renderAssignments();
    });
}

// ── SORT ──
function initSort() {
    const btn = document.querySelector('.sort-btn');
    const arrow = btn.querySelector('svg path');
    btn.addEventListener('click', () => {
        const fields = ['title', 'course', 'dueDate', 'status'];
        const currentIdx = fields.indexOf(sortField);
        sortField = fields[(currentIdx + 1) % fields.length];
        isSortAsc = sortField === 'title' ? true : isSortAsc; // reset direction on field change
        arrow.style.transform = sortField === 'title' ? (isSortAsc ? 'rotate(0deg)' : 'rotate(180deg)') : 'rotate(0deg)';
        renderAssignments();
    });
}

// ── RENDER ──
function renderAssignments() {
    const tbody = document.querySelector('.assignments-tbody');
    let filtered = assignments.filter(a => {
        const matchesFilter = currentFilter === 'all' || a.status === currentFilter;
        const matchesSearch = a.title.toLowerCase().includes(currentSearch) ||
                               a.course.toLowerCase().includes(currentSearch) ||
                               a.status.toLowerCase().includes(currentSearch);
        return matchesFilter && matchesSearch;
    });

    filtered.sort((a, b) => {
        let valA = a[sortField];
        let valB = b[sortField];
        if (sortField === 'dueDate') {
            valA = new Date(valA);
            valB = new Date(valB);
        }
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
            <td><strong>${a.title}</strong></td>
            <td>${a.course}</td>
            <td>${formatDate(a.dueDate)}</td>
            <td><span class="status-badge ${a.status}">${capitalize(a.status)}</span></td>
            <td class="actions">
                <button class="action-btn edit" onclick="editAssignment('${a.title}')">Edit</button>
                <button class="action-btn delete" onclick="deleteAssignment('${a.title}')">Delete</button>
            </td>
        </tr>
    `).join('');
}

function formatDate(dateStr) {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}

// ── ADD ASSIGNMENT MODAL ──
function initAddModal() {
    const modal = document.getElementById('add-assignment-modal');
    if (!modal) return;

    const addBtns = document.querySelectorAll('.add-btn, .create-btn');
    const form = document.getElementById('add-assignment-form');
    const closeBtn = modal.querySelector('.close-btn');
    const cancelBtn = modal.querySelector('.cancel-btn');

    addBtns.forEach(btn => {
        btn.addEventListener('click', () => modal.classList.add('open'));
    });
    closeBtn.addEventListener('click', () => modal.classList.remove('open'));
    cancelBtn.addEventListener('click', () => modal.classList.remove('open'));
    modal.addEventListener('click', (e) => { if (e.target === modal) modal.classList.remove('open'); });

    form.addEventListener('submit', (e) => {
        e.preventDefault();
        const fd = new FormData(form);
        const newAssignment = {
            title: fd.get('title'),
            course: fd.get('course'),
            dueDate: fd.get('dueDate'),
            status: fd.get('status')
        };
        assignments.push(newAssignment);
        saveAssignments();
        renderAssignments();
        modal.classList.remove('open');
        form.reset();
    });
}

function editAssignment(title) {
    alert(`Edit assignment: ${title}\n(Implement edit logic in next iteration)`);
}

function deleteAssignment(title) {
    if (confirm(`Delete "${title}"?`)) {
        assignments = assignments.filter(a => a.title !== title);
        saveAssignments();
        renderAssignments();
    }
}

// ── POPULATE COURSE DROPDOWN ──
function populateCourseDropdown() {
    const select = document.querySelector('select[name="course"]');
    if (!select) return;
    courses.forEach(c => {
        const opt = document.createElement('option');
        opt.value = c;
        opt.textContent = c;
        select.appendChild(opt);
    });
}

// ── MOBILE MENU ──
function initMobileMenu() {
    const hamburger = document.querySelector('.hamburger-btn');
    const overlay = document.querySelector('.sidebar-overlay');
    const sidebar = document.querySelector('.sidebar');
    if (!hamburger || !overlay) return;

    hamburger.addEventListener('click', () => {
        sidebar.classList.add('mobile-open');
        document.body.style.overflow = 'hidden';
    });
    overlay.addEventListener('click', () => {
        sidebar.classList.remove('mobile-open');
        document.body.style.overflow = '';
    });
}