// ── Tab switching ──
document.querySelectorAll('.settings-nav-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.settings-nav-btn').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.tab-pane').forEach(p => p.classList.remove('active'));
        btn.classList.add('active');
        document.getElementById('tab-' + btn.dataset.tab).classList.add('active');
    });
});

// ── Profile: avatar upload ──
const editAvatarBtn = document.getElementById('editAvatarBtn');
const avatarInput   = document.getElementById('avatarInput');
const profileImg    = document.getElementById('profileImg');

editAvatarBtn.addEventListener('click', () => avatarInput.click());

avatarInput.addEventListener('change', () => {
    const file = avatarInput.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = e => {
        profileImg.src = e.target.result;
        // also update nav avatar
        document.querySelector('.avatar img').src = e.target.result;
    };
    reader.readAsDataURL(file);
});

// ── Profile: save changes ──
document.getElementById('saveProfileBtn').addEventListener('click', () => {
    const name  = document.getElementById('fieldName').value.trim();
    const email = document.getElementById('fieldEmail').value.trim();

    if (!name || !email) {
        shakeSave();
        return;
    }

    // Update displayed name
    document.getElementById('profileDisplayName').textContent = name;

    showToast('saveToast', '✓ Changes saved!', '#22C55E');
});

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

// ── Security: update password ──
window.handlePasswordChange = function () {
    const curr    = document.getElementById('currentPwd').value.trim();
    const newP    = document.getElementById('newPwd').value.trim();
    const confirm = document.getElementById('confirmPwd').value.trim();
    const toast   = document.getElementById('pwdToast');

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

    // Clear fields on success
    document.getElementById('currentPwd').value = '';
    document.getElementById('newPwd').value      = '';
    document.getElementById('confirmPwd').value  = '';
    document.getElementById('strengthFill').style.width = '0%';
    document.getElementById('strengthLabel').textContent = '';
    showToast('pwdToast', '✓ Password updated successfully!', '#22C55E');
};

// ── Show / hide password ──
window.togglePwd = function (inputId, btn) {
    const input = document.getElementById(inputId);
    const isText = input.type === 'text';
    input.type = isText ? 'password' : 'text';
    btn.style.color = isText ? '#94A3B8' : '#2563EB';
};

// ── Helpers ──
function showToast(id, msg, color) {
    const el = document.getElementById(id);
    el.textContent = msg;
    el.style.color = color;
    el.classList.add('show');
    clearTimeout(el._timer);
    el._timer = setTimeout(() => el.classList.remove('show'), 3000);
}

function shakeSave() {
    const btn = document.getElementById('saveProfileBtn');
    btn.style.animation = 'none';
    btn.offsetHeight;
    btn.style.animation = 'shake 0.35s ease';
}

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
