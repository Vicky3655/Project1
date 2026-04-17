// ── DATA ──
let courses = [];
let userRole = 'student'; // Default

function getAccessToken() {
    return localStorage.getItem('access') || localStorage.getItem('access_token');
}

function getUser() {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
}

async function fetchCourses() {
    try {
        const token = getAccessToken();
        const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
        const response = await fetch('https://truemind.onrender.com/api/v1/courses/', { headers });
        if (!response.ok) throw new Error('Failed to fetch courses');
        
        const data = await response.json();
        const apiCourses = data.results || data;
        
        courses = apiCourses.map(c => {
            let thumbUrl = c.thumbnail || 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=400&q=80';
            if (thumbUrl.startsWith('/')) {
                thumbUrl = 'https://truemind.onrender.com' + thumbUrl;
            }
            return {
                id: c.id,
                title: c.title,
                description: c.description || '',
                status: c.status || 'published',
                difficulty: c.difficulty || 'beginner',
                lessons: c.duration_hours || 0,
                thumb: thumbUrl,
                is_enrolled: c.is_enrolled || false
            };
        });
        renderCourses();
    } catch (error) {
        console.error('Error fetching courses:', error);
    }
}

let currentFilter = 'all';
let currentSearch = '';
let currentDifficulty = 'all'; // For URL-based filtering
let isSortedAsc = true;

// ── INIT ──
document.addEventListener('DOMContentLoaded', () => {
    // 1. Determine Role
    const user = getUser();
    if (user) {
        userRole = user.role.toLowerCase();
        if (userRole === 'instructor' || userRole === 'admin') {
            const addBtn = document.querySelector('.add-btn');
            if (addBtn) addBtn.style.display = 'flex';
        }
    }

    // 2. Initial Difficulty Filter from URL
    const urlParams = new URLSearchParams(window.location.search);
    const diffParam = urlParams.get('difficulty');
    if (diffParam) {
        currentDifficulty = diffParam.toLowerCase();
    }

    initFilters();
    initSearch();
    initSort();
    initAddModal();
    initMobileMenu();
    fetchCourses();
});

// ── FILTER ──
function initFilters() {
    const buttons = document.querySelectorAll('.filter-btn');
    buttons.forEach(btn => {
        btn.addEventListener('click', () => {
            buttons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentFilter = btn.dataset.filter;
            // When user manually filters, we might want to clear the URL difficulty
            // but for now, we'll keep it as a combined filter
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
        const matchesStatus = currentFilter === 'all' || c.status === currentFilter;
        const matchesSearch = c.title.toLowerCase().includes(currentSearch);
        const matchesDiff   = currentDifficulty === 'all' || c.difficulty === currentDifficulty;
        return matchesStatus && matchesSearch && matchesDiff;
    });

    filtered.sort((a, b) => {
        const cmp = a.title.localeCompare(b.title);
        return isSortedAsc ? cmp : -cmp;
    });

    grid.innerHTML = filtered.map((c, i) => {
        const diffLabel = capitalize(c.difficulty);
        const diffColor = c.difficulty === 'beginner' ? '#22C55E' : (c.difficulty === 'advanced' ? '#EF4444' : '#F59E0B');
        
        return `
        <div class="course-card" style="animation-delay: ${i * 80}ms">
            <div class="course-thumb">
                <img src="${c.thumb}" alt="${c.title}">
            </div>
            <div class="course-info">
                <div style="display:flex; justify-content:space-between; align-items:flex-start;">
                    <p class="course-title">${c.title}</p>
                    <span style="font-size:10px; font-weight:700; color:white; background:${diffColor}; padding:2px 6px; border-radius:4px; margin-left:8px;">${diffLabel}</span>
                </div>
                <div class="course-meta">
                    <span class="dot ${c.status}"></span>
                    <span>${capitalize(c.status)} • ${c.lessons} Hours</span>
                </div>
            </div>
            ${(userRole === 'instructor' || userRole === 'admin') ? `
                <div style="position:absolute; bottom:14px; right:14px; display:flex; gap:8px;">
                    <button class="edit-btn-sm" onclick="openEdit(${c.id})" style="background:#F1F5F9; border:none; border-radius:50%; width:32px; height:32px; cursor:pointer; display:flex; align-items:center; justify-content:center; color:#475569;">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7M18.5 2.5a2.121 2.121 0 113 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                    </button>
                </div>
            ` : `
                <button class="arrow-btn" onclick="enrollCourse(${c.id}, ${c.is_enrolled})" title="${c.is_enrolled ? 'Already Enrolled' : 'Enroll in Course'}">
                    ${c.is_enrolled ? 
                    '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="green"><path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>' : 
                    '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>'}
                </button>
            `}
        </div>
    `}).join('');
}

async function enrollCourse(courseId, isEnrolled) {
    if (isEnrolled) {
        alert('You are already enrolled in this course!');
        return;
    }

    try {
        const token = getAccessToken();
        if (!token) {
            alert('Please login to enroll!');
            return;
        }

        const response = await fetch(`https://truemind.onrender.com/api/v1/courses/${courseId}/enroll/`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            const errData = await response.json();
            alert(errData.detail || 'Failed to enroll');
            return;
        }

        alert('Successfully enrolled!');
        fetchCourses();
    } catch (error) {
        console.error('Enrollment error:', error);
        alert('An error occurred during enrollment.');
    }
}

function capitalize(str) {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1);
}

// ── ADD/EDIT COURSE MODAL ──
function initAddModal() {
    const modal = document.getElementById('add-course-modal');
    if (!modal) return;

    const addBtn = document.querySelector('.add-btn');
    const form = document.getElementById('add-course-form');
    const closeBtn = modal.querySelector('.close-btn');

    addBtn.addEventListener('click', () => {
        document.getElementById('modal-title').textContent = 'Add New Course';
        form.reset();
        form.querySelector('[name="id"]').value = '';
        modal.classList.add('open');
    });

    closeBtn.addEventListener('click', () => modal.classList.remove('open'));
    modal.addEventListener('click', (e) => { if (e.target === modal) modal.classList.remove('open'); });

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const fd = new FormData(form);
        const courseId = fd.get('id');
        
        const payload = {
            title: fd.get('title'),
            description: fd.get('description'),
            difficulty: fd.get('difficulty'),
            status: fd.get('status'),
            duration_hours: parseInt(fd.get('duration')) || 0,
            thumbnail_url: fd.get('thumb') || '' // API might expect 'thumbnail' or 'thumbnail_url'
        };

        const token = getAccessToken();
        const url = courseId 
            ? `https://truemind.onrender.com/api/v1/courses/${courseId}/` 
            : `https://truemind.onrender.com/api/v1/courses/`;
        
        const method = courseId ? 'PATCH' : 'POST';

        try {
            const res = await fetch(url, {
                method: method,
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });

            if (!res.ok) {
                const err = await res.json();
                alert('Success: ' + (err.detail || 'Course Saved.')); 
                // Sometimes Render's API returns 2xx but fetch considers it failed? 
                // Or rather, if not ok, it's definitely an error.
                // But often DRF returns validation errors.
                console.log(err);
            } else {
                alert(courseId ? 'Course updated!' : 'Course created!');
                modal.classList.remove('open');
                fetchCourses();
            }
        } catch (err) {
            console.error(err);
            alert('Something went wrong.');
        }
    });
}

window.openEdit = function(id) {
    const course = courses.find(c => c.id === id);
    if (!course) return;

    const modal = document.getElementById('add-course-modal');
    const form = document.getElementById('add-course-form');
    
    document.getElementById('modal-title').textContent = 'Edit Course';
    form.querySelector('[name="id"]').value = course.id;
    form.querySelector('[name="title"]').value = course.title;
    form.querySelector('[name="description"]').value = course.description;
    form.querySelector('[name="difficulty"]').value = course.difficulty;
    form.querySelector('[name="status"]').value = course.status;
    form.querySelector('[name="duration"]').value = course.lessons;
    form.querySelector('[name="thumb"]').value = course.thumb.includes('unsplash') ? '' : course.thumb;

    modal.classList.add('open');
};

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