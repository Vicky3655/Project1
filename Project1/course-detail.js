// ── CONFIG ──
const API_BASE = 'https://truemind.onrender.com/api/v1';

// ── HELPERS ──
function getAccessToken() {
    return localStorage.getItem('access') || localStorage.getItem('access_token');
}

// ── STATE ──
let courseId = null;
let courseData = null;
let curriculumData = null;
let userRole = 'student';

// ── INIT ──
document.addEventListener('DOMContentLoaded', () => {
    // 1. Get Course ID from URL
    const params = new URLSearchParams(window.location.search);
    courseId = params.get('id');

    if (!courseId) {
        alert('Course not found.');
        window.location.href = 'courses.html';
        return;
    }

    // 2. Identify User
    const userStr = localStorage.getItem('user');
    if (userStr) {
        const user = JSON.parse(userStr);
        userRole = user.role.toLowerCase();
    }

    // 3. Setup UI Listeners
    initTabs();
    initEnrollment();
    initMobileMenu();

    // 4. Fetch Data
    fetchCourseDetails();
    fetchCurriculum();
});

// ── FETCHING ──
async function fetchCourseDetails() {
    try {
        const token = getAccessToken();
        const headers = token ? { 'Authorization': `Bearer ${token}` } : {};

        const response = await fetch(`${API_BASE}/courses/${courseId}/`, { headers });
        if (!response.ok) throw new Error('Failed to fetch course details');

        courseData = await response.json();
        renderCourseDetails();
    } catch (error) {
        console.error(error);
        document.getElementById('course-title').textContent = 'Error loading course';
    }
}

async function fetchCurriculum() {
    try {
        const token = getAccessToken();
        const headers = token ? { 'Authorization': `Bearer ${token}` } : {};

        const response = await fetch(`${API_BASE}/courses/${courseId}/curriculum/`, { headers });
        if (!response.ok) throw new Error('Failed to fetch curriculum');

        curriculumData = await response.json();
        renderCurriculum();
    } catch (error) {
        console.error(error);
        document.getElementById('curriculum-list').innerHTML = '<p class="error">Failed to load curriculum. Please try again later.</p>';
    }
}

// ── RENDERING ──
function renderCourseDetails() {
    if (!courseData) return;

    // Breadcrumb
    document.getElementById('breadcrumb-title').textContent = courseData.title;

    // Header Section
    document.getElementById('course-category').textContent = courseData.category?.name || 'General';
    document.getElementById('course-title').textContent = courseData.title;
    document.getElementById('course-short-desc').textContent = courseData.short_description || '';
    
    const thumb = document.getElementById('course-thumb');
    let thumbUrl = courseData.thumbnail || 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&q=80';
    if (thumbUrl.startsWith('/')) thumbUrl = 'https://truemind.onrender.com' + thumbUrl;
    thumb.src = thumbUrl;

    // Instructor info
    if (courseData.instructor) {
        document.getElementById('inst-name').textContent = courseData.instructor.full_name;
        document.getElementById('inst-prof-name').textContent = courseData.instructor.full_name;
        // Mock bio/title if not in data
        document.getElementById('inst-prof-title').textContent = 'Lead Instructor';
    }

    // Description Tab
    document.getElementById('course-description').innerHTML = courseData.description || 'No description available.';
    
    // Requirements & Learning
    const learnList = document.getElementById('course-learning');
    const reqList = document.getElementById('course-requirements');
    
    const learnItems = (courseData.what_you_will_learn || '').split('\n').filter(i => i.trim());
    const reqItems = (courseData.requirements || '').split('\n').filter(i => i.trim());

    learnList.innerHTML = learnItems.length ? learnItems.map(item => `<li>${item.replace('•', '').trim()}</li>`).join('') : '<li>Foundation of the subject</li><li>Practical skills</li>';
    reqList.innerHTML = reqItems.length ? reqItems.map(item => `<li>${item.replace('•', '').trim()}</li>`).join('') : '<li>No specific requirements</li>';

    // Sidebar
    document.getElementById('course-price').textContent = courseData.is_free ? 'Free' : `$${courseData.price || '0.00'}`;
    if (courseData.price > 0) {
        document.getElementById('price-original').textContent = `$${(courseData.price * 1.5).toFixed(2)}`;
    }

    // Enrollment button state
    const enrollBtn = document.getElementById('enroll-btn');
    if (courseData.is_enrolled) {
        enrollBtn.textContent = 'Already Enrolled';
        enrollBtn.disabled = true;
        enrollBtn.style.background = '#10B981';
    }
}

function renderCurriculum() {
    if (!curriculumData) return;

    // Stats
    document.getElementById('total-modules').textContent = `${curriculumData.total_modules || 0} Modules`;
    document.getElementById('total-lessons').textContent = `${curriculumData.total_lessons || 0} Lessons`;
    
    const hours = Math.floor(curriculumData.total_duration_minutes / 60);
    const mins = curriculumData.total_duration_minutes % 60;
    document.getElementById('total-duration').textContent = `${hours}h ${mins}m total length`;

    document.getElementById('sidebar-lessons').textContent = `${curriculumData.total_lessons || 0} lessons`;

    // Modules List
    const list = document.getElementById('curriculum-list');
    if (!curriculumData.modules || curriculumData.modules.length === 0) {
        list.innerHTML = '<p>No lessons uploaded yet.</p>';
        return;
    }

    list.innerHTML = curriculumData.modules.map((m, idx) => `
        <div class="module-item ${idx === 0 ? 'open' : ''}">
            <div class="module-trigger" onclick="toggleModule(this)">
                <div class="module-title-wrap">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="transform: rotate(${idx === 0 ? '180deg' : '0deg'})">
                        <path d="M6 9l6 6 6-6"/>
                    </svg>
                    <h4>${m.title}</h4>
                </div>
                <div class="module-meta">
                    ${m.lesson_count} lessons • ${m.total_duration_minutes}m
                </div>
            </div>
            <div class="module-content">
                ${m.lessons.map(l => `
                    <div class="lesson-item">
                        <div class="lesson-info">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm-2 14.5v-9l6 4.5z"/>
                            </svg>
                            <span>${l.title}</span>
                        </div>
                        <div class="lesson-actions">
                            ${l.is_free_preview ? '<span class="preview-link">Preview</span>' : ''}
                            <span>${l.duration_minutes}m</span>
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>
    `).join('');
}

// ── INTERACTIONS ──
function initTabs() {
    const buttons = document.querySelectorAll('.tab-btn');
    const panels = document.querySelectorAll('.tab-panel');

    buttons.forEach(btn => {
        btn.addEventListener('click', () => {
            const tabId = btn.dataset.tab;
            
            buttons.forEach(b => b.classList.remove('active'));
            panels.forEach(p => p.classList.remove('active'));

            btn.classList.add('active');
            document.getElementById(tabId).classList.add('active');
        });
    });
}

window.toggleModule = function(trigger) {
    const item = trigger.closest('.module-item');
    const isOpen = item.classList.contains('open');
    const svg = trigger.querySelector('svg');

    // Close others
    // document.querySelectorAll('.module-item').forEach(i => i.classList.remove('open'));

    if (isOpen) {
        item.classList.remove('open');
        svg.style.transform = 'rotate(0deg)';
    } else {
        item.classList.add('open');
        svg.style.transform = 'rotate(180deg)';
    }
}

function initEnrollment() {
    const btn = document.getElementById('enroll-btn');
    if (!btn) return;

    btn.addEventListener('click', async () => {
        if (courseData && courseData.is_enrolled) return;

        const token = getAccessToken();
        if (!token) {
            alert('Please login to enroll!');
            window.location.href = 'login.html';
            return;
        }

        btn.disabled = true;
        btn.textContent = 'Enrolling...';

        try {
            const response = await fetch(`${API_BASE}/courses/${courseId}/enroll/`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                btn.textContent = 'Enrolled!';
                btn.style.background = '#10B981';
                
                // Show a brief success message and redirect to dashboard or reload
                setTimeout(() => {
                    alert('Successfully enrolled! View your course in the Dashboard.');
                    window.location.href = 'dashboard.html';
                }, 1000);
            } else {
                const err = await response.json();
                alert(err.detail || 'Enrollment failed. Please try again.');
                btn.disabled = false;
                btn.textContent = 'Enroll Now';
            }
        } catch (error) {
            console.error(error);
            alert('An error occurred during enrollment.');
            btn.disabled = false;
            btn.textContent = 'Enroll Now';
        }
    });
}

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
