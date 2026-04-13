/* ============================================================
   MyOperator ROI Calculator — script.js
============================================================ */

'use strict';

// ── Plan data ──────────────────────────────────────────────
const PLANS = {
  compact: {
    name: 'Compact',
    cost: 2500,
    color: '#3b82f6',
    tag: 'Starter',
    bestFor: 'Startups & small teams',
    roiBoost: 1.0,
  },
  sedan: {
    name: 'Sedan',
    cost: 5000,
    color: '#00C566',
    tag: 'Growth',
    bestFor: 'Growing SMBs',
    roiBoost: 1.2,
  },
  suv: {
    name: 'SUV',
    cost: 15000,
    color: '#f59e0b',
    tag: 'Enterprise',
    bestFor: 'Large enterprises',
    roiBoost: 1.5,
  },
};

// ── State ──────────────────────────────────────────────────
let selectedPlan = 'compact';
let activeTab = 'breakdown';
let chartInstance = null;
let lastCalcResult = null;

// ── Helpers ────────────────────────────────────────────────
const fmt = (v) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(v);

const fmtPct = (v) => (v >= 0 ? '+' : '') + v.toFixed(1) + '%';

const getVal = (id) => parseFloat(document.getElementById(id).value) || 0;

const setText = (id, text) => {
  const el = document.getElementById(id);
  if (!el) return;
  el.textContent = text;
};

const setClass = (id, cls) => {
  const el = document.getElementById(id);
  if (!el) return;
  el.className = el.className.replace(/ ?(pos|neg|negative)/g, '');
  if (cls) el.classList.add(cls);
};

const animateEl = (id) => {
  const el = document.getElementById(id);
  if (!el) return;
  el.classList.remove('animate-in');
  void el.offsetWidth; // reflow
  el.classList.add('animate-in');
};

// ── Plan selection ─────────────────────────────────────────
function selectPlan(planKey) {
  selectedPlan = planKey;
  document.querySelectorAll('.plan-card').forEach((card) => {
    card.classList.toggle('active', card.dataset.plan === planKey);
  });
  calculate();
}

// ── Core calculation ───────────────────────────────────────
function calculate() {
  const plan       = PLANS[selectedPlan];
  const cost       = plan.cost;
  const avgProfit  = getVal('avg-profit');
  const extraSales = getVal('extra-sales');
  const leads      = getVal('monthly-leads');
  const convLift   = getVal('conversion-lift');

  // Revenue from extra sales
  const extraRev = avgProfit * extraSales;

  // Revenue from conversion lift (leads × lift% × avg profit)
  const liftedLeads = Math.round(leads * (convLift / 100));
  const liftRev     = liftedLeads * avgProfit;

  // Totals
  const totalBenefit = extraRev + liftRev;
  const netProfit    = totalBenefit - cost;
  const roi          = cost > 0 ? (netProfit / cost) * 100 : 0;
  const annProfit    = netProfit * 12;
  const breakeven    = avgProfit > 0 ? Math.ceil(cost / avgProfit) : 0;
  const paybackDays  = totalBenefit > 0 ? (cost / totalBenefit) * 30 : null;

  lastCalcResult = { plan, cost, avgProfit, extraSales, leads, convLift, extraRev, liftRev, liftedLeads, totalBenefit, netProfit, roi, annProfit, breakeven, paybackDays };

  updateResults(lastCalcResult);
  updateRecommendation(lastCalcResult);
  renderChart();
}

// ── Update DOM results ─────────────────────────────────────
function updateResults(r) {
  const pos = r.netProfit >= 0;

  // ROI hero
  const roiEl = document.getElementById('roi-pct');
  roiEl.textContent = fmtPct(r.roi);
  setClass('roi-pct', pos ? '' : 'negative');
  animateEl('roi-pct');

  // Verdict
  let verdict = '';
  if (r.roi > 500)      verdict = `Every ₹1 spent returns ₹${(r.roi / 100 + 1).toFixed(1)} — exceptional ROI.`;
  else if (r.roi > 200) verdict = `Strong returns — your subscription pays for itself ${Math.round(r.roi / 100)}× over.`;
  else if (r.roi > 50)  verdict = `Solid ROI. MyOperator is delivering meaningful growth.`;
  else if (r.roi > 0)   verdict = `Positive ROI. Increasing sales or leads will accelerate returns.`;
  else if (r.roi === 0) verdict = 'Enter your numbers above to see your personalised ROI.';
  else                  verdict = 'Negative ROI — consider a smaller plan or increasing your sales targets.';
  setText('roi-verdict', verdict);

  // Metric cards
  setMetric('net-profit', fmt(r.netProfit),  pos);
  setMetric('ann-profit', fmt(r.annProfit),  pos);
  setMetric('extra-rev',  fmt(r.totalBenefit), true);
  setMetric('leads-conv', `${r.liftedLeads} leads`,  true);
  setMetric('breakeven',  r.breakeven > 0 ? `${r.breakeven} sales` : '—', null);

  if (r.paybackDays !== null) {
    const pb = r.paybackDays < 1
      ? `${Math.round(r.paybackDays * 24)} hours`
      : r.paybackDays < 30
        ? `${Math.round(r.paybackDays)} days`
        : `${(r.paybackDays / 30).toFixed(1)} months`;
    setMetric('payback', pb, null);
  } else {
    setMetric('payback', '—', null);
  }
}

function setMetric(id, value, positive) {
  setText(id, value);
  setClass(id, positive === true ? 'pos' : positive === false ? 'neg' : '');
  animateEl(id);
}

// ── Recommendation ─────────────────────────────────────────
function updateRecommendation(r) {
  let title, text, bestPlan;

  if (r.totalBenefit === 0) {
    title = 'Enter your inputs to get a personalised recommendation';
    text  = 'Fill in your average profit per sale and sales numbers above.';
    setText('rec-title', title);
    setText('rec-text', text);
    return;
  }

  if (r.totalBenefit < 5000) {
    bestPlan = 'compact';
    title    = 'The Compact plan is your best starting point';
    text     = `At ₹2,500/month, Compact gives you WhatsApp API, IVR, and multi-agent chat — enough to start capturing ${r.liftedLeads} more leads per month and grow from there.`;
  } else if (r.totalBenefit < 20000) {
    bestPlan = 'sedan';
    title    = 'The Sedan plan maximises your ROI';
    text     = `With ₹${(r.totalBenefit).toLocaleString('en-IN')} in monthly returns, Sedan's CRM integrations, AI chatbot, and advanced analytics will accelerate your pipeline and compound your gains.`;
  } else {
    bestPlan = 'suv';
    title    = 'The SUV plan unlocks your full potential';
    text     = `At your scale, SUV's AI voicebot, dedicated account manager, and custom API integrations can deliver a ${fmtPct(r.roi)} monthly ROI — turning every ₹1 into ₹${(1 + r.roi / 100).toFixed(1)}.`;
  }

  setText('rec-title', title);
  setText('rec-text', text);

  // Highlight matching plan
  document.querySelectorAll('.plan-card').forEach((card) => {
    card.classList.toggle('active', card.dataset.plan === selectedPlan);
  });
}

// ── Chart rendering ────────────────────────────────────────
function renderChart() {
  if (!lastCalcResult) return;
  const r = lastCalcResult;
  const canvas = document.getElementById('roi-chart');
  if (!canvas) return;

  if (chartInstance) {
    chartInstance.destroy();
    chartInstance = null;
  }

  const gridColor  = 'rgba(255,255,255,0.06)';
  const tickColor  = '#8892a4';
  const tickFont   = { family: "'DM Sans', sans-serif", size: 12 };
  const moneyFmt   = (v) => {
    const a = Math.abs(v);
    const prefix = v < 0 ? '-₹' : '₹';
    return a >= 100000
      ? prefix + (a / 100000).toFixed(1) + 'L'
      : a >= 1000
        ? prefix + (a / 1000).toFixed(0) + 'K'
        : prefix + a;
  };

  let config;

  // ─ Tab: Monthly breakdown ─
  if (activeTab === 'breakdown') {
    const data = [
      { label: 'Subscription cost', value: r.cost,        color: '#ef4444' },
      { label: 'Sales revenue',     value: r.extraRev,    color: '#3b82f6' },
      { label: 'Conversion uplift', value: r.liftRev,     color: '#a855f7' },
      { label: 'Net profit',        value: r.netProfit,   color: r.netProfit >= 0 ? '#00C566' : '#f87171' },
    ];
    updateLegend(data.map((d) => ({ label: d.label + ': ' + fmt(d.value), color: d.color })));

    config = {
      type: 'bar',
      data: {
        labels: data.map((d) => d.label),
        datasets: [{
          data: data.map((d) => d.value),
          backgroundColor: data.map((d) => d.color + 'cc'),
          borderColor:     data.map((d) => d.color),
          borderWidth: 1,
          borderRadius: 6,
          borderSkipped: false,
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false }, tooltip: { callbacks: { label: (ctx) => ' ' + fmt(ctx.raw) } } },
        scales: {
          x: { ticks: { color: tickColor, font: tickFont }, grid: { display: false } },
          y: { ticks: { color: tickColor, font: tickFont, callback: moneyFmt }, grid: { color: gridColor } },
        },
      },
    };

  // ─ Tab: 12-month cumulative ─
  } else if (activeTab === 'cumulative') {
    const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    const cumData = months.map((_, i) => Math.round(r.netProfit * (i + 1)));
    const revData = months.map((_, i) => Math.round(r.totalBenefit * (i + 1)));
    const costData = months.map((_, i) => Math.round(r.cost * (i + 1)));

    updateLegend([
      { label: 'Cumulative revenue', color: '#3b82f6' },
      { label: 'Cumulative cost',    color: '#ef4444' },
      { label: 'Cumulative profit',  color: '#00C566' },
    ]);

    config = {
      type: 'line',
      data: {
        labels: months,
        datasets: [
          {
            label: 'Revenue',
            data: revData,
            borderColor: '#3b82f6',
            backgroundColor: 'rgba(59,130,246,0.08)',
            fill: true, tension: 0.35, pointRadius: 3,
            borderDash: [],
          },
          {
            label: 'Cost',
            data: costData,
            borderColor: '#ef4444',
            backgroundColor: 'rgba(239,68,68,0.05)',
            fill: true, tension: 0.35, pointRadius: 3,
            borderDash: [5, 4],
          },
          {
            label: 'Net profit',
            data: cumData,
            borderColor: '#00C566',
            backgroundColor: 'rgba(0,197,102,0.08)',
            fill: true, tension: 0.35, pointRadius: 4,
            borderWidth: 2.5,
            borderDash: [],
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: 'index', intersect: false },
        plugins: {
          legend: { display: false },
          tooltip: { callbacks: { label: (ctx) => ' ' + ctx.dataset.label + ': ' + fmt(ctx.raw) } },
        },
        scales: {
          x: { ticks: { color: tickColor, font: tickFont }, grid: { display: false } },
          y: { ticks: { color: tickColor, font: tickFont, callback: moneyFmt }, grid: { color: gridColor } },
        },
      },
    };

  // ─ Tab: Plan comparison ─
  } else if (activeTab === 'compare') {
    const planKeys = ['compact', 'sedan', 'suv'];
    const compData = planKeys.map((k) => {
      const p   = PLANS[k];
      const rev = r.totalBenefit;
      const np  = rev - p.cost;
      const roi = p.cost > 0 ? (np / p.cost) * 100 : 0;
      return { name: p.name, roi: Math.round(roi * 10) / 10, netProfit: np, color: p.color };
    });

    updateLegend(compData.map((d) => ({ label: `${d.name}: ${fmtPct(d.roi)} ROI`, color: d.color })));

    config = {
      type: 'bar',
      data: {
        labels: compData.map((d) => d.name),
        datasets: [
          {
            label: 'ROI %',
            data: compData.map((d) => d.roi),
            backgroundColor: compData.map((d) => d.color + 'cc'),
            borderColor:     compData.map((d) => d.color),
            borderWidth: 1,
            borderRadius: 8,
            borderSkipped: false,
            yAxisID: 'y',
          },
          {
            label: 'Net profit (₹)',
            data: compData.map((d) => d.netProfit),
            backgroundColor: compData.map((d) => d.color + '44'),
            borderColor:     compData.map((d) => d.color),
            borderWidth: 1,
            borderRadius: 8,
            borderSkipped: false,
            yAxisID: 'y2',
            type: 'line',
            tension: 0.4,
            pointRadius: 6,
            pointBackgroundColor: compData.map((d) => d.color),
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: (ctx) =>
                ctx.datasetIndex === 0
                  ? ` ROI: ${fmtPct(ctx.raw)}`
                  : ` Net profit: ${fmt(ctx.raw)}`,
            },
          },
        },
        scales: {
          x:  { ticks: { color: tickColor, font: { ...tickFont, size: 14 } }, grid: { display: false } },
          y:  { ticks: { color: tickColor, font: tickFont, callback: (v) => v + '%' }, grid: { color: gridColor }, title: { display: true, text: 'ROI %', color: tickColor, font: tickFont } },
          y2: { position: 'right', ticks: { color: tickColor, font: tickFont, callback: moneyFmt }, grid: { display: false }, title: { display: true, text: 'Net profit', color: tickColor, font: tickFont } },
        },
      },
    };
  }

  chartInstance = new Chart(canvas, config);
}

function updateLegend(items) {
  const el = document.getElementById('chart-legend');
  if (!el) return;
  el.innerHTML = items
    .map((i) => `<div class="legend-item"><div class="legend-dot" style="background:${i.color}"></div>${i.label}</div>`)
    .join('');
}

// ── Tab switching ──────────────────────────────────────────
function switchTab(tab) {
  activeTab = tab;
  document.querySelectorAll('.chart-tab').forEach((btn) => {
    btn.classList.toggle('active', btn.dataset.tab === tab);
  });
  renderChart();
}

// ── CSV export ─────────────────────────────────────────────
function exportCSV() {
  if (!lastCalcResult) { alert('Please calculate ROI first.'); return; }
  const r = lastCalcResult;

  const rows = [
    ['MyOperator ROI Report'],
    ['Generated', new Date().toLocaleDateString('en-IN')],
    ['Plan', r.plan.name],
    ['Monthly subscription cost (INR)', r.cost],
    [],
    ['── Inputs ──'],
    ['Avg. profit per sale (INR)', r.avgProfit],
    ['Extra sales per month', r.extraSales],
    ['Monthly inbound leads', r.leads],
    ['Conversion rate lift (%)', r.convLift],
    [],
    ['── Monthly results ──'],
    ['Revenue from extra sales (INR)', r.extraRev],
    ['Revenue from conversion uplift (INR)', r.liftRev],
    ['Total monthly benefit (INR)', r.totalBenefit],
    ['Monthly net profit (INR)', r.netProfit],
    ['Monthly ROI (%)', r.roi.toFixed(2)],
    ['Leads converted additionally', r.liftedLeads],
    ['Break-even sales needed', r.breakeven],
    [],
    ['── Annual projection ──'],
    ['Annual net profit (INR)', r.annProfit],
    [],
    ['── 12-month cumulative ──'],
    ['Month', 'Revenue (INR)', 'Cost (INR)', 'Net Profit (INR)'],
    ...Array.from({ length: 12 }, (_, i) => [
      `Month ${i + 1}`,
      Math.round(r.totalBenefit * (i + 1)),
      Math.round(r.cost * (i + 1)),
      Math.round(r.netProfit * (i + 1)),
    ]),
    [],
    ['── Plan comparison ──'],
    ['Plan', 'Monthly cost (INR)', 'Net profit (INR)', 'ROI (%)'],
    ...Object.entries(PLANS).map(([, p]) => {
      const np  = r.totalBenefit - p.cost;
      const roi = p.cost > 0 ? ((np / p.cost) * 100).toFixed(2) : '0';
      return [p.name, p.cost, np, roi];
    }),
  ];

  const csv  = rows.map((row) => row.map((cell) => `"${cell}"`).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = `myoperator-roi-${r.plan.name.toLowerCase()}-${Date.now()}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// ── Event listeners ────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {

  // Plan cards
  document.querySelectorAll('.plan-card').forEach((card) => {
    card.addEventListener('click', () => selectPlan(card.dataset.plan));
    card.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        selectPlan(card.dataset.plan);
      }
    });
  });

  // Chart tabs
  document.querySelectorAll('.chart-tab').forEach((btn) => {
    btn.addEventListener('click', () => switchTab(btn.dataset.tab));
  });

  // Calculate button
  document.getElementById('calc-btn').addEventListener('click', calculate);

  // Live recalculate on input change
  ['avg-profit', 'extra-sales', 'monthly-leads', 'conversion-lift'].forEach((id) => {
    document.getElementById(id).addEventListener('input', calculate);
  });

  // Export
  document.getElementById('export-btn').addEventListener('click', exportCSV);

  // Initial calculation
  selectPlan('compact');
  calculate();
});
