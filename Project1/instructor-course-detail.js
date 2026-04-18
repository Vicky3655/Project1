// ── CONFIG ──
const API_BASE = 'https://truemind.onrender.com/api/v1';

// ── STATE ──
let courseId = null;
let courseData = null;
let modules = [];
let categories = [];

// ── INIT ──
document.addEventListener('DOMContentLoaded', () => {
    const params = new URLSearchParams(window.location.search);
    courseId = params.get('id');

    if (!courseId) {
        alert('No course ID provided.');
        window.location.href = 'courses.html';
        return;
    }

    initTabs();
    initModals();
    initForms();
    initButtons();
    initLessonTypeSwitch();

    // Fetch initial data
    fetchCategories();
    fetchCourseDetails();
    fetchCurriculum();
});

// ── DATA FETCHING ──
async function fetchCourseDetails() {
    try {
        const token = localStorage.getItem('access') || localStorage.getItem('access_token');
        const res = await fetch(`${API_BASE}/courses/${courseId}/`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!res.ok) throw new Error('Failed to fetch course');
        
        courseData = await res.json();
        renderCourseHeader();
        populateBasicsForm();
    } catch (e) {
        console.error(e);
        alert('Error loading course details');
    }
}

async function fetchCurriculum() {
    try {
        const token = localStorage.getItem('access') || localStorage.getItem('access_token');
        const res = await fetch(`${API_BASE}/courses/${courseId}/curriculum/`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!res.ok) throw new Error('Failed to fetch curriculum');
        
        const data = await res.json();
        modules = data.modules || [];
        renderModules();
    } catch (e) {
        console.error(e);
        document.getElementById('module-list').innerHTML = '<p style="padding:20px; color:#EF4444;">Error loading curriculum.</p>';
    }
}

async function fetchCategories() {
    try {
        const res = await fetch(`${API_BASE}/courses/categories/`);
        if (res.ok) {
            const data = await res.json();
            categories = data.results || data;
            populateCategorySelect();
        }
    } catch (e) { console.error(e); }
}

// ── RENDERING ──
function renderCourseHeader() {
    document.getElementById('course-title-header').textContent = courseData.title;
    document.getElementById('course-name-breadcrumb').textContent = courseData.title;
    
    const statusBtn = document.getElementById('status-toggle-btn');
    statusBtn.textContent = courseData.status.toUpperCase();
    statusBtn.className = `status-btn ${courseData.status.toLowerCase()}`;
}

function populateBasicsForm() {
    const form = document.getElementById('course-basics-form');
    form.title.value = courseData.title || '';
    form.short_description.value = courseData.short_description || '';
    form.description.value = courseData.description || '';
    form.difficulty.value = courseData.difficulty || 'beginner';
    form.category.value = courseData.category?.id || '';

    // Settings tab
    document.getElementById('course-price').value = courseData.price || 0;
    document.getElementById('is-free-checkbox').checked = courseData.is_free || false;
}

function populateCategorySelect() {
    const select = document.getElementById('category-select');
    categories.forEach(cat => {
        const opt = document.createElement('option');
        opt.value = cat.id;
        opt.textContent = cat.name;
        select.appendChild(opt);
    });
}

function renderModules() {
    const list = document.getElementById('module-list');
    if (modules.length === 0) {
        list.innerHTML = `
            <div class="curriculum-empty-state">
                <p>No modules yet. Start by adding a module to organize your content.</p>
            </div>
        `;
        return;
    }

    list.innerHTML = modules.map(m => `
        <div class="module-card">
            <div class="module-header">
                <div class="module-info">
                    <h3>${esc(m.title)}</h3>
                    <p>${m.lesson_count} Lessons • ${m.total_duration_minutes || 0}m Total</p>
                </div>
                <div class="module-actions">
                    <button class="icon-btn" onclick="openModuleModal(${m.id})" title="Edit Module">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7M18.5 2.5a2.121 2.121 0 113 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                    </button>
                    <button class="icon-btn" onclick="deleteModule(${m.id})" title="Delete Module">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18m-2 0v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg>
                    </button>
                </div>
            </div>
            <div class="lesson-list">
                ${(m.lessons || []).map(l => `
                    <div class="lesson-row">
                        <div class="lesson-main">
                            <div class="lesson-type-icon">
                                ${getLessonIcon(l.lesson_type)}
                            </div>
                            <div>
                                <div class="lesson-title">${esc(l.title)}</div>
                                <div class="lesson-meta">${l.duration_minutes} min • ${l.is_free_preview ? 'Preview Available' : 'Enrolled Only'}</div>
                            </div>
                        </div>
                        <div class="module-actions">
                            <button class="icon-btn" onclick="openLessonModal(${m.id}, ${l.id})" title="Edit Lesson">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7M18.5 2.5a2.121 2.121 0 113 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                            </button>
                            <button class="icon-btn" onclick="deleteLesson(${l.id})" title="Delete Lesson">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18m-2 0v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg>
                            </button>
                        </div>
                    </div>
                `).join('')}
                <button class="add-lesson-btn" onclick="openLessonModal(${m.id})">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><path d="M12 5v14M5 12h14"/></svg>
                    Add Lesson
                </button>
            </div>
        </div>
    `).join('');
}

function getLessonIcon(type) {
    if (type === 'video') return '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M23 7l-7 5 7 5V7z"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/></svg>';
    if (type === 'file') return '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>';
    return '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>';
}

// ── ACTIONS ──

// Modules
window.openModuleModal = function(id = null) {
    const modal = document.getElementById('module-modal');
    const form = document.getElementById('module-form');
    document.getElementById('module-modal-title').textContent = id ? 'Edit Module' : 'Add Module';
    form.reset();
    form.id.value = id || '';
    
    if (id) {
        const m = modules.find(m => m.id === id);
        if (m) {
            form.title.value = m.title;
            form.description.value = m.description || '';
        }
    }
    modal.classList.add('open');
};

async function deleteModule(id) {
    if (!confirm('Delete this module and all its lessons?')) return;
    const token = localStorage.getItem('access');
    try {
        const res = await fetch(`${API_BASE}/lessons/modules/${id}/`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) fetchCurriculum();
    } catch (e) { console.error(e); }
}

// Lessons
window.openLessonModal = function(moduleId, lessonId = null) {
    const modal = document.getElementById('lesson-modal');
    const form = document.getElementById('lesson-form');
    document.getElementById('lesson-modal-title').textContent = lessonId ? 'Edit Lesson' : 'Add Lesson';
    form.reset();
    form.module_id.value = moduleId;
    form.id.value = lessonId || '';
    
    // Reset progress UI
    document.getElementById('upload-progress').style.display = 'none';
    document.getElementById('lesson-submit-btn').disabled = false;

    if (lessonId) {
        const module = modules.find(m => m.id === moduleId);
        const l = module.lessons.find(l => l.id === lessonId);
        if (l) {
            form.title.value = l.title;
            form.lesson_type.value = l.lesson_type;
            form.duration.value = l.duration_minutes;
            form.is_free_preview.checked = l.is_free_preview;
            form.content.value = l.content || '';
            form.video_url.value = l.video_url || '';
        }
    }
    
    updateLessonTypeUI();
    modal.classList.add('open');
};

async function deleteLesson(id) {
    if (!confirm('Delete this lesson?')) return;
    const token = localStorage.getItem('access');
    try {
        const res = await fetch(`${API_BASE}/lessons/${id}/`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) fetchCurriculum();
    } catch (e) { console.error(e); }
}

// ── FORM HANDLING ──
function initForms() {
    // Module Form
    document.getElementById('module-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const fd = new FormData(e.target);
        const id = fd.get('id');
        const payload = {
            course: courseId,
            title: fd.get('title'),
            description: fd.get('description')
        };
        
        const token = localStorage.getItem('access');
        const url = id ? `${API_BASE}/lessons/modules/${id}/` : `${API_BASE}/lessons/modules/`;
        const method = id ? 'PATCH' : 'POST';

        try {
            const res = await fetch(url, {
                method,
                headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            if (res.ok) {
                document.getElementById('module-modal').classList.remove('open');
                fetchCurriculum();
            }
        } catch (e) { console.error(e); }
    });

    // Lesson Form
    document.getElementById('lesson-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const form = e.target;
        const fd = new FormData(form);
        const id = fd.get('id');
        const token = localStorage.getItem('access');
        
        // Prepare FormData for multipart upload
        const formData = new FormData();
        formData.append('module', fd.get('module_id'));
        formData.append('title', fd.get('title'));
        formData.append('lesson_type', fd.get('lesson_type'));
        formData.append('duration_minutes', fd.get('duration'));
        formData.append('is_free_preview', form.is_free_preview.checked);

        const type = fd.get('lesson_type');
        if (type === 'text') {
            formData.append('content', fd.get('content'));
        } else if (type === 'video') {
            const source = document.getElementById('video-source-select').value;
            if (source === 'url') formData.append('video_url', fd.get('video_url'));
            else if (form.video_file.files[0]) formData.append('video_file', form.video_file.files[0]);
        } else if (type === 'file' && form.attachment.files[0]) {
            formData.append('attachment', form.attachment.files[0]);
        }

        const url = id ? `${API_BASE}/lessons/${id}/` : `${API_BASE}/lessons/`;
        const method = id ? 'PATCH' : 'POST';

        // Use XHR for progress tracking
        uploadWithProgress(url, method, token, formData);
    });

    // Basics Form
    document.getElementById('course-basics-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const fd = new FormData(e.target);
        const payload = {
            title: fd.get('title'),
            short_description: fd.get('short_description'),
            description: fd.get('description'),
            difficulty: fd.get('difficulty'),
            category_id: fd.get('category')
        };
        saveCourseUpdate(payload);
    });

    // Publish / Unpublish
    document.getElementById('status-toggle-btn').addEventListener('click', async () => {
        if (!courseData) return;
        const currentStatus = courseData.status.toLowerCase();
        const action = currentStatus === 'published' ? 'unpublish' : 'publish';
        
        if (!confirm(`Are you sure you want to ${action} this course?`)) return;

        const token = localStorage.getItem('access');
        try {
            const res = await fetch(`${API_BASE}/courses/${courseId}/${action}/`, {
                method: 'PATCH',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) fetchCourseDetails();
            else {
                const err = await res.json();
                alert(err.detail || 'Status update failed.');
            }
        } catch (e) { console.error(e); }
    });
}

function uploadWithProgress(url, method, token, formData) {
    const xhr = new XMLHttpRequest();
    const progressWrap = document.getElementById('upload-progress');
    const progressBar = document.getElementById('progress-bar');
    const progressPct = document.getElementById('progress-pct');
    const submitBtn = document.getElementById('lesson-submit-btn');

    progressWrap.style.display = 'block';
    submitBtn.disabled = true;

    xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable) {
            const pct = Math.round((e.loaded / e.total) * 100);
            progressBar.style.width = pct + '%';
            progressPct.textContent = pct + '%';
        }
    });

    xhr.onreadystatechange = function() {
        if (xhr.readyState === 4) {
            if (xhr.status >= 200 && xhr.status < 300) {
                document.getElementById('lesson-modal').classList.remove('open');
                fetchCurriculum();
            } else {
                alert('Upload failed: ' + xhr.responseText);
                submitBtn.disabled = false;
                progressWrap.style.display = 'none';
            }
        }
    };

    xhr.open(method, url, true);
    xhr.setRequestHeader('Authorization', `Bearer ${token}`);
    xhr.send(formData);
}

async function saveCourseUpdate(payload) {
    const token = localStorage.getItem('access');
    try {
        const res = await fetch(`${API_BASE}/courses/${courseId}/`, {
            method: 'PATCH',
            headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        if (res.ok) {
            alert('Basics updated!');
            fetchCourseDetails();
        }
    } catch (e) { console.error(e); }
}

// ── UI HELPERS ──
function initTabs() {
    const links = document.querySelectorAll('.tab-link');
    const contents = document.querySelectorAll('.tab-content');
    links.forEach(link => {
        link.addEventListener('click', () => {
            links.forEach(l => l.classList.remove('active'));
            contents.forEach(c => c.classList.remove('active'));
            link.classList.add('active');
            document.getElementById(link.dataset.tab).classList.add('active');
        });
    });
}

function initModals() {
    const modals = document.querySelectorAll('.modal');
    modals.forEach(m => {
        const close = m.querySelector('.close-btn');
        close.onclick = () => m.classList.remove('open');
        m.onclick = (e) => { if (e.target === m) m.classList.remove('open'); };
    });
}

function initLessonTypeSwitch() {
    const select = document.getElementById('lesson-type-select');
    select.addEventListener('change', updateLessonTypeUI);

    const videoSource = document.getElementById('video-source-select');
    videoSource.addEventListener('change', (e) => {
        document.getElementById('video-url-wrap').style.display = e.target.value === 'url' ? 'block' : 'none';
        document.getElementById('video-file-wrap').style.display = e.target.value === 'file' ? 'block' : 'none';
    });
}

function updateLessonTypeUI() {
    const type = document.getElementById('lesson-type-select').value;
    document.querySelectorAll('.type-fields').forEach(f => f.style.display = 'none');
    document.getElementById(`field-${type}`).style.display = 'block';
}

function initButtons() {
    // Add Module Button
    const addModuleBtn = document.querySelector('.add-module-btn');
    if (addModuleBtn) {
        addModuleBtn.addEventListener('click', () => openModuleModal());
    }

    // Preview Course Button
    const previewBtn = document.getElementById('preview-btn');
    if (previewBtn) {
        previewBtn.addEventListener('click', () => {
            window.location.href = `course-detail.html?id=${courseId}`;
        });
    }

    // Delete Course Button
    const deleteBtn = document.querySelector('.delete-course-btn');
    if (deleteBtn) {
        deleteBtn.addEventListener('click', deleteCourse);
    }
}

async function deleteCourse() {
    if (!confirm('Are you sure you want to PERMANENTLY delete this course? This action cannot be undone.')) return;
    
    const token = localStorage.getItem('access');
    try {
        const res = await fetch(`${API_BASE}/courses/${courseId}/`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
            alert('Course deleted successfully.');
            window.location.href = 'courses.html';
        } else {
            const err = await res.json();
            alert(err.detail || 'Failed to delete course.');
        }
    } catch (e) { console.error(e); }
}

function esc(str) {
    return String(str || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}
