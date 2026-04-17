const API = 'https://truemind.onrender.com/api/v1';

// ── Helpers ──
function getToken() {
    return localStorage.getItem('access') || localStorage.getItem('access_token');
}

function authHeaders(extra = {}) {
    return { 'Authorization': `Bearer ${getToken()}`, ...extra };
}

function showToast(id, msg, color) {
    const el = document.getElementById(id);
    if (!el) return;
    el.textContent = msg;
    el.style.color = color;
    el.classList.add('show');
    clearTimeout(el._timer);
    el._timer = setTimeout(() => el.classList.remove('show'), 3500);
}

function shakeSave() {
    const btn = document.getElementById('saveProfileBtn');
    btn.style.animation = 'none';
    btn.offsetHeight;
    btn.style.animation = 'shake 0.35s ease';
}

// ── Tab switching ──
document.querySelectorAll('.settings-nav-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.settings-nav-btn').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.tab-pane').forEach(p => p.classList.remove('active'));
        btn.classList.add('active');
        document.getElementById('tab-' + btn.dataset.tab).classList.add('active');
    });
});

// ── Load profile on page load ──
async function loadProfile() {
    const token = getToken();
    if (!token) return;

    try {
        // Fetch base user info
        const userRes = await fetch(`${API}/users/me/`, {
            headers: authHeaders()
        });
        if (!userRes.ok) return;
        const user = await userRes.json();

        const fullName = [user.first_name, user.last_name].filter(Boolean).join(' ') || user.username;
        document.getElementById('fieldEmail').value        = user.email || '';
        document.getElementById('fieldName').value         = fullName;
        document.getElementById('fieldRole').value         = capitalize(user.role || 'User');
        document.getElementById('profileDisplayName').textContent = fullName;
        document.querySelector('.nav-role').textContent    = capitalize(user.role || 'User');

        // Account tab
        const usernameInput = document.querySelector('#tab-account .field-row input[type="text"]');
        if (usernameInput) usernameInput.value = user.username || '';

        // Fetch extended profile (bio, avatar)
        const profileRes = await fetch(`${API}/users/me/profile/`, {
            headers: authHeaders()
        });
        if (profileRes.ok) {
            const profile = await profileRes.json();
            document.getElementById('fieldBio').value = profile.bio || '';

            if (profile.avatar) {
                const avatarUrl = profile.avatar.startsWith('http') ? profile.avatar : `https://truemind.onrender.com${profile.avatar}`;
                document.getElementById('profileImg').src = avatarUrl;
                document.querySelector('.avatar img').src = avatarUrl;
            }
        }
    } catch (err) {
        console.error('Failed to load profile:', err);
    }
}

loadProfile();

// ── Avatar upload ──
const editAvatarBtn = document.getElementById('editAvatarBtn');
const avatarInput   = document.getElementById('avatarInput');
const profileImg    = document.getElementById('profileImg');

editAvatarBtn.addEventListener('click', () => avatarInput.click());

avatarInput.addEventListener('change', async () => {
    const file = avatarInput.files[0];
    if (!file) return;

    // Show preview immediately
    const reader = new FileReader();
    reader.onload = e => {
        profileImg.src = e.target.result;
        document.querySelector('.avatar img').src = e.target.result;
    };
    reader.readAsDataURL(file);

    // Upload to backend
    try {
        const formData = new FormData();
        formData.append('avatar', file);
        const res = await fetch(`${API}/users/me/profile/`, {
            method: 'PATCH',
            headers: authHeaders(),
            body: formData
        });
        if (res.ok) {
            showToast('saveToast', '✓ Avatar updated!', '#22C55E');
        } else {
            showToast('saveToast', '✗ Avatar upload failed.', '#EF4444');
        }
    } catch (err) {
        console.error('Avatar upload error:', err);
    }
});

// ── Profile: save changes ──
document.getElementById('saveProfileBtn').addEventListener('click', async () => {
    const name  = document.getElementById('fieldName').value.trim();
    const email = document.getElementById('fieldEmail').value.trim();
    const bio   = document.getElementById('fieldBio').value.trim();

    if (!name || !email) {
        shakeSave();
        return;
    }

    const [firstName, ...rest] = name.split(' ');
    const lastName = rest.join(' ');

    try {
        // Update base user info (name, email)
        const userRes = await fetch(`${API}/users/me/`, {
            method: 'PATCH',
            headers: authHeaders({ 'Content-Type': 'application/json' }),
            body: JSON.stringify({ first_name: firstName, last_name: lastName, email })
        });

        // Update bio in extended profile
        const profileRes = await fetch(`${API}/users/me/profile/`, {
            method: 'PATCH',
            headers: authHeaders({ 'Content-Type': 'application/json' }),
            body: JSON.stringify({ bio })
        });

        if (userRes.ok || profileRes.ok) {
            document.getElementById('profileDisplayName').textContent = name;
            showToast('saveToast', '✓ Changes saved!', '#22C55E');
        } else {
            const err = await userRes.json().catch(() => ({}));
            showToast('saveToast', '✗ ' + (err.detail || 'Save failed.'), '#EF4444');
        }
    } catch (err) {
        console.error('Profile save error:', err);
        showToast('saveToast', '✗ An error occurred.', '#EF4444');
    }
});

// ── Account tab: save username ──
const accountSaveBtn = document.querySelector('#tab-account .save-btn');
if (accountSaveBtn) {
    accountSaveBtn.addEventListener('click', async () => {
        const usernameInput = document.querySelector('#tab-account .field-row input[type="text"]');
        const username = usernameInput ? usernameInput.value.trim() : '';
        if (!username) return;

        try {
            const res = await fetch(`${API}/users/me/`, {
                method: 'PATCH',
                headers: authHeaders({ 'Content-Type': 'application/json' }),
                body: JSON.stringify({ username })
            });

            if (res.ok) {
                showToast('saveToast', '✓ Account updated!', '#22C55E');
            } else {
                const err = await res.json().catch(() => ({}));
                showToast('saveToast', '✗ ' + (err.username?.[0] || err.detail || 'Update failed.'), '#EF4444');
            }
        } catch (err) {
            console.error('Account save error:', err);
        }
    });
}

// ── Security: password strength ──
document.getElementById('newPwd').addEventListener('input', function () {
    const val  = this.value;
    const fill = document.getElementById('strengthFill');
    const lbl  = document.getElementById('strengthLabel');

    let score = 0;
    if (val.length >= 8)           score++;
    if (/[A-Z]/.test(val))         score++;
    if (/[0-9]/.test(val))         score++;
    if (/[^A-Za-z0-9]/.test(val))  score++;

    const map = [
        { w: '0%',   c: 'transparent', t: '' },
        { w: '25%',  c: '#EF4444',     t: 'Weak' },
        { w: '50%',  c: '#F59E0B',     t: 'Fair' },
        { w: '75%',  c: '#3B82F6',     t: 'Good' },
        { w: '100%', c: '#22C55E',     t: 'Strong' },
    ];

    fill.style.width      = map[score].w;
    fill.style.background = map[score].c;
    lbl.textContent       = map[score].t;
    lbl.style.color       = map[score].c;
});

// ── Security: update password via API ──
window.handlePasswordChange = async function () {
    const curr    = document.getElementById('currentPwd').value.trim();
    const newP    = document.getElementById('newPwd').value.trim();
    const confirm = document.getElementById('confirmPwd').value.trim();

    if (!curr || !newP || !confirm) {
        showToast('pwdToast', '✗ Please fill all fields.', '#EF4444');
        return;
    }
    if (newP !== confirm) {
        showToast('pwdToast', '✗ Passwords do not match.', '#EF4444');
        return;
    }
    if (newP.length < 8) {
        showToast('pwdToast', '✗ Password must be at least 8 characters.', '#EF4444');
        return;
    }

    try {
        const res = await fetch(`${API}/auth/change-password/`, {
            method: 'POST',
            headers: authHeaders({ 'Content-Type': 'application/json' }),
            body: JSON.stringify({ old_password: curr, new_password: newP, confirm_password: confirm })
        });

        if (res.ok) {
            document.getElementById('currentPwd').value = '';
            document.getElementById('newPwd').value      = '';
            document.getElementById('confirmPwd').value  = '';
            document.getElementById('strengthFill').style.width = '0%';
            document.getElementById('strengthLabel').textContent = '';
            showToast('pwdToast', '✓ Password updated successfully!', '#22C55E');
        } else {
            const err = await res.json().catch(() => ({}));
            showToast('pwdToast', '✗ ' + (err.detail || err.old_password?.[0] || 'Update failed.'), '#EF4444');
        }
    } catch (err) {
        console.error('Password change error:', err);
        showToast('pwdToast', '✗ An error occurred.', '#EF4444');
    }
};

// ── Show / hide password ──
window.togglePwd = function (inputId, btn) {
    const input = document.getElementById(inputId);
    const isText = input.type === 'text';
    input.type = isText ? 'password' : 'text';
    btn.style.color = isText ? '#94A3B8' : '#2563EB';
};

// ── Capitalize ──
function capitalize(str) {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1);
}

// ── Shake animation ──
const shakeStyle = document.createElement('style');
shakeStyle.textContent = `
@keyframes shake {
    0%,100% { transform: translateX(0); }
    20%      { transform: translateX(-7px); }
    40%      { transform: translateX(7px); }
    60%      { transform: translateX(-4px); }
    80%      { transform: translateX(4px); }
}`;
document.head.appendChild(shakeStyle);
