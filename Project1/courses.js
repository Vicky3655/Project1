// ── DATA ──
const courses = [
    { title: 'Introduction to Product Design', status: 'published', lessons: 10, thumb: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=400&q=80', alt: 'Product Design' },
    { title: 'UI/UX Design Fundamentals', status: 'published', lessons: 12, thumb: 'https://images.unsplash.com/photo-1581291518857-4e27b48ff24e?w=400&q=80', alt: 'UI/UX Design' },
    { title: 'Frontend Development for Designers', status: 'draft', lessons: 9, thumb: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=400&q=80', alt: 'Frontend Dev' },
    { title: 'Data Analysis with Python & SQL', status: 'published', lessons: 9, thumb: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400&q=80', alt: 'Data Analysis' },
    { title: 'Introduction to Backend Development', status: 'draft', lessons: 11, thumb: 'https://images.unsplash.com/photo-1515879218367-8466d910aaa4?w=400&q=80', alt: 'Backend Dev' },
    { title: 'Cloud Computing & AWS', status: 'published', lessons: 20, thumb: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=400&q=80', alt: 'Cloud Computing' }
];

let currentFilter = 'all';
let currentSearch = '';
let isSortedAsc = true;

// ── INIT ──
document.addEventListener('DOMContentLoaded', () => {
    initFilters();
    initSearch();
    initSort();
    initAddModal();
    initMobileMenu();
    renderCourses();
});

// ── FILTER ──
function initFilters() {
    const buttons = document.querySelectorAll('.filter-btn');
    buttons.forEach(btn => {
        btn.addEventListener('click', () => {
            buttons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentFilter = btn.dataset.filter;
            renderCourses();
        });
    });
}

// ── SEARCH ──
function initSearch() {
    const input = document.querySelector('.search-wrap input');
    input.addEventListener('input', (e) => {
        currentSearch = e.target.value.toLowerCase().trim();
        renderCourses();
    });
}

// ── SORT ──
function initSort() {
    const btn = document.querySelector('.sort-btn');
    const arrow = btn.querySelector('svg path');
    btn.addEventListener('click', () => {
        isSortedAsc = !isSortedAsc;
        arrow.style.transform = isSortedAsc ? 'rotate(0deg)' : 'rotate(180deg)';
        renderCourses();
    });
}

// ── RENDER ──
function renderCourses() {
    const grid = document.querySelector('.course-grid');
    let filtered = courses.filter(c => {
        const matchesFilter = currentFilter === 'all' || c.status === currentFilter;
        const matchesSearch = c.title.toLowerCase().includes(currentSearch);
        return matchesFilter && matchesSearch;
    });

    filtered.sort((a, b) => {
        const cmp = a.title.localeCompare(b.title);
        return isSortedAsc ? cmp : -cmp;
    });

    grid.innerHTML = filtered.map((c, i) => `
        <div class="course-card" style="animation-delay: ${i * 80}ms">
            <div class="course-thumb">
                <img src="${c.thumb}" alt="${c.alt}">
            </div>
            <div class="course-info">
                <p class="course-title">${c.title}</p>
                <div class="course-meta">
                    <span class="dot ${c.status}"></span>
                    <span>${capitalize(c.status)} • ${c.lessons} Lessons</span>
                </div>
            </div>
            <button class="arrow-btn" onclick="editCourse('${c.title}')">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5"/></svg>
            </button>
        </div>
    `).join('');
}

function capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}

// ── ADD COURSE MODAL ──
function initAddModal() {
    const modal = document.getElementById('add-course-modal');
    if (!modal) return;

    const addBtn = document.querySelector('.add-btn');
    const form = document.getElementById('add-course-form');
    const closeBtn = modal.querySelector('.close-btn');
    const cancelBtn = modal.querySelector('.cancel-btn');

    addBtn.addEventListener('click', () => modal.classList.add('open'));
    closeBtn.addEventListener('click', () => modal.classList.remove('open'));
    cancelBtn.addEventListener('click', () => modal.classList.remove('open'));
    modal.addEventListener('click', (e) => { if (e.target === modal) modal.classList.remove('open'); });

    form.addEventListener('submit', (e) => {
        e.preventDefault();
        const fd = new FormData(form);
        courses.push({
            title: fd.get('title'),
            status: fd.get('status'),
            lessons: parseInt(fd.get('lessons')) || 0,
            thumb: fd.get('thumb') || 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=400&q=80',
            alt: fd.get('title').split(' ')[0]
        });
        renderCourses();
        modal.classList.remove('open');
        form.reset();
    });
}

function editCourse(title) {
    alert(`Edit course: ${title}\n(Implement edit logic in next iteration)`);
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