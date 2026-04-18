/**
 * dashboard.js – Student Dashboard logic
 *
 * Fully dynamic: fetches all data from backend API
 */

const API = 'https://truemind.onrender.com/api/v1';

function getAccessToken() {
    return localStorage.getItem('access') || localStorage.getItem('access_token');
}

function authHeaders(extra = {}) {
    return { 'Authorization': `Bearer ${getAccessToken()}`, ...extra };
}

document.addEventListener('DOMContentLoaded', async () => {
    // 1. Initial State
    const userStr = localStorage.getItem('user');
    const token = getAccessToken();
    if (!userStr || !token) {
        window.location.href = 'login.html';
        return;
    }

    const user = JSON.parse(userStr);
    renderGreeting(user);
    
    // 2. Fetch all data in parallel for efficiency
    try {
        const [enrolledRes, assignmentsRes, submissionsRes, profileRes, notificationsRes] = await Promise.all([
            fetch(`${API}/courses/enrolled/`, { headers: authHeaders() }).catch(e => null),
            fetch(`${API}/assignments/`, { headers: authHeaders() }).catch(e => null),
            fetch(`${API}/assignments/submissions/my-submissions/`, { headers: authHeaders() }).catch(e => null),
            fetch(`${API}/users/me/profile/`, { headers: authHeaders() }).catch(e => null),
            fetch(`${API}/notifications/`, { headers: authHeaders() }).catch(e => null)
        ]);

        // Profile Handling
        if (profileRes && profileRes.ok) {
            const profile = await profileRes.json();
            if (profile.avatar) {
                const avatarImg = document.getElementById('navAvatar');
                if (avatarImg) {
                    avatarImg.src = profile.avatar.startsWith('http') ? profile.avatar : `https://truemind.onrender.com${profile.avatar}`;
                }
            }
        }

        // Enrollment Handling (Now includes 0% progress courses)
        let enrollments = [];
        if (enrolledRes && enrolledRes.ok) {
            const data = await enrolledRes.json();
            enrollments = data.results || data;
        }

        // Assignments Handling
        let assignments = [];
        if (assignmentsRes && assignmentsRes.ok) {
            const data = await assignmentsRes.json();
            assignments = data.results || data;
        }

        // Submissions Handling
        let submissions = [];
        if (submissionsRes && submissionsRes.ok) {
            const data = await submissionsRes.json();
            submissions = data.results || data;
        }

        // Notifications Handling
        let notifications = [];
        if (notificationsRes && notificationsRes.ok) {
            const data = await notificationsRes.json();
            notifications = data.results || data;
        }

        // 3. Process & Match Data
        const submissionMap = new Map(submissions.map(s => [s.assignment, s]));
        
        const pendingAssignments = assignments.filter(a => !submissionMap.has(a.id));
        const completedCourses = enrollments.filter(e => e.is_completed || e.progress_percentage >= 100);
        
        // Calculate average score
        const gradedSubmissions = submissions.filter(s => s.score !== null);
        const avgScore = gradedSubmissions.length > 0 
            ? Math.round(gradedSubmissions.reduce((sum, s) => sum + (s.score_percentage || 0), 0) / gradedSubmissions.length)
            : null;

        // 4. Render
        renderStats({
            enrolledCount: enrollments.length,
            completedCount: completedCourses.length,
            pendingCount: pendingAssignments.length,
            avgScore: avgScore
        });

        renderEnrolledCourses(enrollments);
        renderUpcomingAssignments(pendingAssignments);
        renderRecentActivity(notifications);

    } catch (err) {
        console.error('Data fetch error:', err);
    }
});

function renderGreeting(user) {
    const welcomeName = document.getElementById('welcomeName');
    const greetLabel = document.getElementById('greetLabel');
    const fullName = [user.first_name, user.last_name].filter(Boolean).join(' ') || user.username || 'Student';

    if (welcomeName) welcomeName.textContent = `Welcome back, ${fullName}!`;

    const hour = new Date().getHours();
    if (greetLabel) {
        if (hour < 12) greetLabel.textContent = 'Good morning 👋';
        else if (hour < 17) greetLabel.textContent = 'Good afternoon 👋';
        else greetLabel.textContent = 'Good evening 👋';
    }
}

function renderStats(stats) {
    const statEnrolled = document.getElementById('statEnrolled');
    const statCompleted = document.getElementById('statCompleted');
    const statAssignments = document.getElementById('statAssignments');
    const statAvg = document.getElementById('statAvg');
    const pendingCountBadge = document.getElementById('pendingCount');

    if (statEnrolled) statEnrolled.textContent = stats.enrolledCount;
    if (statCompleted) statCompleted.textContent = stats.completedCount;
    if (statAssignments) statAssignments.textContent = stats.pendingCount;
    if (pendingCountBadge) pendingCountBadge.textContent = stats.pendingCount;
    
    if (statAvg) {
        statAvg.textContent = stats.avgScore !== null ? `${stats.avgScore}%` : '—';
    }
}

function renderEnrolledCourses(enrollments) {
    const list = document.getElementById('courseList');
    const empty = document.getElementById('emptyCourses');
    if (!list) return;

    list.innerHTML = '';
    
    if (enrollments.length === 0) {
        empty.style.display = 'flex';
        return;
    }

    empty.style.display = 'none';

    // Show top 4 enrolled courses by most recent
    enrollments.slice(0, 4).forEach(e => {
        const c = e.course;
        const progress = Math.round(e.progress_percentage || 0);
        const statusClass = (e.is_completed || progress >= 100) ? 'completed' : 'in-progress';
        const statusLabel = (e.is_completed || progress >= 100) ? 'Completed' : 'In Progress';

        let thumbUrl = c.thumbnail || 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=100&q=70';
        if (thumbUrl.startsWith('/')) thumbUrl = 'https://truemind.onrender.com' + thumbUrl;

        const row = document.createElement('div');
        row.className = 'course-row';
        row.innerHTML = `
            <div class="course-thumb-sm">
                <img src="${thumbUrl}" alt="${esc(c.title)}">
            </div>
            <div class="course-row-info">
                <p class="course-row-title">${esc(c.title)}</p>
                <div class="progress-wrap">
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${progress}%"></div>
                    </div>
                    <span class="progress-pct">${progress}%</span>
                </div>
            </div>
            <span class="course-badge ${statusClass}">${statusLabel}</span>
        `;
        row.style.cursor = 'pointer';
        row.onclick = () => window.location.href = `course-detail.html?id=${c.id}`;
        list.appendChild(row);
    });
}

function renderUpcomingAssignments(assignments) {
    const list = document.getElementById('assignmentList');
    const empty = document.getElementById('emptyAssignments');
    if (!list) return;

    list.innerHTML = '';

    if (assignments.length === 0) {
        empty.style.display = 'flex';
        return;
    }

    empty.style.display = 'none';

    const sorted = [...assignments].sort((a, b) => new Date(a.due_date) - new Date(b.due_date));

    sorted.slice(0, 3).forEach(a => {
        const days = getDaysLeft(a.due_date);
        let chipClass = 'normal';
        let chipText = `Due in ${days} days`;

        if (days <= 1) {
            chipClass = 'urgent';
            chipText = days < 0 ? 'Overdue' : 'Due Tomorrow';
        }

        const li = document.createElement('li');
        li.className = 'assignment-item';
        li.innerHTML = `
            <div class="assignment-icon orange-bg">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z"/>
                </svg>
            </div>
            <div class="assignment-info">
                <p class="assignment-title">${esc(a.title)}</p>
                <p class="assignment-course">${esc(a.course_title || 'Enrolled Course')}</p>
            </div>
            <span class="due-chip ${chipClass}">${chipText}</span>
        `;
        li.style.cursor = 'pointer';
        li.onclick = () => window.location.href = 'assignment.html';
        list.appendChild(li);
    });
}

function renderRecentActivity(notifications) {
    const list = document.getElementById('activityList');
    const empty = document.getElementById('emptyActivity');
    if (!list) return;

    list.innerHTML = '';

    if (notifications.length === 0) {
        empty.style.display = 'flex';
        return;
    }

    empty.style.display = 'none';

    notifications.slice(0, 5).forEach(n => {
        const dotColors = {
            'info': 'blue',
            'success': 'green',
            'warning': 'orange',
            'error': 'red',
            'new_assignment': 'purple',
            'assignment_graded': 'green',
            'course_completed': 'gold'
        };
        const dot = dotColors[n.notification_type] || 'blue';

        const li = document.createElement('li');
        li.className = `activity-item ${n.is_read ? 'read' : 'unread'}`;
        li.innerHTML = `
            <span class="activity-dot ${dot}"></span>
            <div class="activity-body">
                <p class="activity-text">${esc(n.title)}: ${esc(n.message)}</p>
                <p class="activity-time">${formatTimestamp(n.created_at)}</p>
            </div>
        `;
        list.appendChild(li);
    });
}

const navAvatar = document.getElementById('navAvatar');
if (navAvatar) {
    navAvatar.style.cursor = 'pointer';
    navAvatar.title = 'Logout';
    navAvatar.addEventListener('click', () => window.logout());
}

function getDaysLeft(dateStr) {
    if (!dateStr) return 0;
    const diff = new Date(dateStr) - new Date();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

function formatTimestamp(ts) {
    const date = new Date(ts);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return 'Yesterday';
    return date.toLocaleDateString();
}

function esc(str) {
    if (!str) return '';
    return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
