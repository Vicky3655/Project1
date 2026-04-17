/**
 * auth.js – Role-based access control guard
 *
 * Usage: Add this at the TOP of every protected page's <script> section,
 * or include <script src="auth.js"></script> BEFORE any other scripts.
 *
 * Each page declares which roles are allowed via:
 *   <meta name="allowed-roles" content="instructor,admin">
 * or
 *   <meta name="allowed-roles" content="student">
 * or
 *   <meta name="allowed-roles" content="instructor,admin,student">
 *
 * If the user is not logged in or the role doesn't match, they are
 * redirected to the appropriate page.
 */

(function () {
    const token = localStorage.getItem('access_token') || localStorage.getItem('access');
    const userStr = localStorage.getItem('user');

    // 1. Must be logged in
    if (!token || !userStr) {
        window.location.href = 'login.html';
        return;
    }

    let user;
    try {
        user = JSON.parse(userStr);
    } catch {
        // Corrupted user data – force re-login
        localStorage.clear();
        window.location.href = 'login.html';
        return;
    }

    const role = (user.role || '').toLowerCase();

    // 2. Check allowed roles for this page
    const meta = document.querySelector('meta[name="allowed-roles"]');
    if (meta) {
        const allowed = meta.content.toLowerCase().split(',').map(r => r.trim());
        if (!allowed.includes(role)) {
            // Redirect to the right home for this user's role
            if (role === 'student') {
                window.location.href = 'selected.html';
            } else if (role === 'instructor' || role === 'admin') {
                window.location.href = 'courses.html';
            } else {
                window.location.href = 'login.html';
            }
            return;
        }
    }

    // 3. Populate any common UI elements (nav role text, avatar) on the page
    document.addEventListener('DOMContentLoaded', () => {
        const navRole = document.querySelector('.nav-role');
        if (navRole) navRole.textContent = capitalize(role);

        const fullName = [user.first_name, user.last_name].filter(Boolean).join(' ') || user.username || 'User';

        // Main profile display name (settings page)
        const profileDisplayName = document.getElementById('profileDisplayName');
        if (profileDisplayName) profileDisplayName.textContent = fullName;

        // Avatar fallback if not set by the page's own JS
        const avatar = document.querySelector('.avatar img');
        if (avatar && !avatar.src.includes('truemind.onrender.com')) {
            if (user.profile?.avatar) {
                avatar.src = user.profile.avatar;
            }
        }
    });

    function capitalize(str) {
        if (!str) return '';
        return str.charAt(0).toUpperCase() + str.slice(1);
    }

    // 4. Expose user & role globally for other scripts on the page
    window.__currentUser = user;
    window.__currentRole = role;
})();
