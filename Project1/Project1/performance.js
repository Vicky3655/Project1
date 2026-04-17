// ── Data per period ──
const DATA = {
    'Last 7 days': {
        students:    { value: '1,240', sub: '+12% this month',   subClass: 'green',  points: [30,35,32,40,45,42,55] },
        completion:  { value: '68%',   sub: '+5% increase',      subClass: 'purple', points: [40,42,44,45,50,55,68] },
        enrolments:  { value: '320',   sub: 'Currently learning', subClass: 'blue',  points: [200,220,240,260,280,300,320] },
        assignments: { value: '89',    sub: 'This week',          subClass: 'yellow', points: [10,20,30,45,60,75,89] },
    },
    'Last 30 days': {
        students:    { value: '1,450', sub: '+18% this month',    subClass: 'green',  points: [20,28,32,36,38,42,50,55,58,60] },
        completion:  { value: '72%',   sub: '+9% increase',       subClass: 'purple', points: [38,42,45,48,52,56,60,65,70,72] },
        enrolments:  { value: '410',   sub: 'Currently learning', subClass: 'blue',   points: [180,210,250,280,310,340,370,390,400,410] },
        assignments: { value: '214',   sub: 'This month',         subClass: 'yellow', points: [20,40,60,90,110,140,160,180,200,214] },
    },
    'Last 3 months': {
        students:    { value: '1,890', sub: '+32% growth',        subClass: 'green',  points: [800,900,1000,1100,1200,1350,1500,1650,1750,1890] },
        completion:  { value: '75%',   sub: '+12% increase',      subClass: 'purple', points: [50,55,58,62,65,68,70,72,74,75] },
        enrolments:  { value: '540',   sub: 'Currently learning', subClass: 'blue',   points: [200,250,300,350,390,420,460,490,520,540] },
        assignments: { value: '620',   sub: 'This quarter',       subClass: 'yellow', points: [50,100,160,220,290,360,430,510,570,620] },
    },
    'This year': {
        students:    { value: '3,100', sub: '+65% this year',     subClass: 'green',  points: [400,600,800,1000,1300,1600,1900,2200,2600,3100] },
        completion:  { value: '80%',   sub: '+20% increase',      subClass: 'purple', points: [40,48,55,60,65,68,72,75,78,80] },
        enrolments:  { value: '870',   sub: 'Currently learning', subClass: 'blue',   points: [100,200,350,450,550,620,700,780,830,870] },
        assignments: { value: '1,840', sub: 'This year',          subClass: 'yellow', points: [80,200,380,560,800,1000,1200,1450,1650,1840] },
    },
    'All time': {
        students:    { value: '5,600', sub: 'All time total',     subClass: 'green',  points: [200,500,900,1400,2000,2700,3500,4300,4900,5600] },
        completion:  { value: '82%',   sub: 'Average completion', subClass: 'purple', points: [30,40,52,60,65,70,74,78,80,82] },
        enrolments:  { value: '1,200', sub: 'All time active',    subClass: 'blue',   points: [100,250,450,650,800,900,1000,1080,1140,1200] },
        assignments: { value: '4,210', sub: 'All time',           subClass: 'yellow', points: [100,400,800,1300,1900,2500,3100,3600,3950,4210] },
    },
};

const KEYS = ['students', 'completion', 'enrolments', 'assignments'];

// ── Draw mini sparkline on canvas ──
function drawChart(canvasId, points) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const W = canvas.width, H = canvas.height;
    ctx.clearRect(0, 0, W, H);

    const min = Math.min(...points);
    const max = Math.max(...points);
    const range = max - min || 1;
    const pad = 6;

    const xs = points.map((_, i) => pad + (i / (points.length - 1)) * (W - pad * 2));
    const ys = points.map(v => H - pad - ((v - min) / range) * (H - pad * 2));

    // Fill gradient
    const grad = ctx.createLinearGradient(0, 0, 0, H);
    grad.addColorStop(0, 'rgba(148,163,184,0.35)');
    grad.addColorStop(1, 'rgba(148,163,184,0.0)');

    ctx.beginPath();
    ctx.moveTo(xs[0], ys[0]);
    for (let i = 1; i < xs.length; i++) {
        const cpx = (xs[i - 1] + xs[i]) / 2;
        ctx.bezierCurveTo(cpx, ys[i - 1], cpx, ys[i], xs[i], ys[i]);
    }
    ctx.lineTo(xs[xs.length - 1], H);
    ctx.lineTo(xs[0], H);
    ctx.closePath();
    ctx.fillStyle = grad;
    ctx.fill();

    // Line
    ctx.beginPath();
    ctx.moveTo(xs[0], ys[0]);
    for (let i = 1; i < xs.length; i++) {
        const cpx = (xs[i - 1] + xs[i]) / 2;
        ctx.bezierCurveTo(cpx, ys[i - 1], cpx, ys[i], xs[i], ys[i]);
    }
    ctx.strokeStyle = '#94A3B8';
    ctx.lineWidth = 2;
    ctx.stroke();
}

// ── Animate number counting up ──
function animateValue(id, endStr) {
    const el = document.getElementById(id);
    if (!el) return;
    const isPercent = endStr.includes('%');
    const hasComma  = endStr.includes(',');
    const end = parseInt(endStr.replace(/[^0-9]/g, ''));
    const start = 0;
    const dur = 600;
    const startTime = performance.now();

    function step(now) {
        const elapsed = now - startTime;
        const progress = Math.min(elapsed / dur, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        const current = Math.round(start + (end - start) * eased);
        let display = current.toString();
        if (hasComma && current >= 1000) {
            display = current.toLocaleString();
        }
        if (isPercent) display += '%';
        el.textContent = display;
        if (progress < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
}

// ── Update all cards ──
function updateCards(period) {
    const d = DATA[period];
    KEYS.forEach(key => {
        const info = d[key];

        // Animate number
        animateValue('val-' + key, info.value);

        // Update subtitle
        const subEl = document.getElementById('sub-' + key);
        subEl.textContent = info.sub;
        subEl.className = 'stat-sub ' + info.subClass;

        // Redraw chart
        drawChart('chart-' + key, info.points);
    });
}

// ── Period dropdown ──
const periodBtn  = document.getElementById('periodBtn');
const periodMenu = document.getElementById('periodMenu');
const periodLabel = document.getElementById('periodLabel');
let currentPeriod = 'Last 7 days';

periodBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    periodBtn.classList.toggle('open');
    periodMenu.classList.toggle('open');
});

document.addEventListener('click', () => {
    periodBtn.classList.remove('open');
    periodMenu.classList.remove('open');
});

periodMenu.querySelectorAll('li').forEach(li => {
    li.addEventListener('click', () => {
        currentPeriod = li.dataset.value;
        periodLabel.textContent = currentPeriod;
        periodMenu.querySelectorAll('li').forEach(l => l.classList.remove('active'));
        li.classList.add('active');
        periodBtn.classList.remove('open');
        periodMenu.classList.remove('open');
        updateCards(currentPeriod);
    });
});

// Mark default active
periodMenu.querySelector('li').classList.add('active');

// ── Init ──
updateCards('Last 7 days');
