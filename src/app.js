import { validSettings, dayState } from './salary.js';
const $ = id => document.getElementById(id);
const defaults = { salary: 15000, days: 5, start: '09:00', end: '18:00', effects: true };
let settings = { ...defaults };
try {
  const saved = JSON.parse(localStorage.getItem('salary-clock'));
  // Preserve salary and workweek settings from the previous hours-only version.
  const candidate = { ...defaults, ...saved };
  if (validSettings(candidate)) settings = { ...candidate, effects: candidate.effects !== false };
} catch { /* Use defaults when browser storage is unavailable. */ }
const fields = ['salary', 'days', 'start', 'end'];
const money = n => n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const timeLeft = s => [Math.floor(s / 3600), Math.floor(s % 3600 / 60), Math.floor(s % 60)].map(n => String(n).padStart(2, '0')).join(':');
function fill() { for (const name of fields) $(name).value = settings[name]; }
function persist() {
  try {
    const {salary, days, start, end, effects} = settings;
    localStorage.setItem('salary-clock', JSON.stringify({salary, days, start, end, effects}));
    $('save-message').textContent = '已保存 · 与本地时钟同步';
  } catch { $('save-message').textContent = '设置已生效，当前浏览器无法保存'; }
}
function render() {
  const now = new Date(), state = dayState(settings, now);
  const [whole, decimals] = money(state.earned).split('.');
  $('income-whole').textContent = whole; $('income-decimal').textContent = `.${decimals}`;
  $('clock').textContent = now.toLocaleTimeString('zh-CN', { hour12: false });
  $('date-label').textContent = now.toLocaleDateString('zh-CN', { month: 'long', day: 'numeric', weekday: 'long' });
  $('status').textContent = state.status; $('status').classList.toggle('rest', !state.active);
  $('per-second').textContent = `+ ¥${state.perSecond.toFixed(4)} / 秒`;
  $('income-caption').textContent = !state.workday ? '今天好好休息' : now < state.begin ? '上班后自动累计' : !state.active ? '今日辛苦了' : '按当前时间自动累计';
  $('worked-label').textContent = `已工作 ${Math.floor(state.elapsed / 3600)} 小时 ${Math.floor(state.elapsed % 3600 / 60)} 分钟`;
  $('remaining-label').textContent = !state.workday ? '休息日' : now < state.begin ? `距离上班 ${timeLeft(Math.ceil((state.begin - now) / 1000))}` : state.active ? `距离下班 ${timeLeft(Math.ceil((state.finish - now) / 1000))}` : '今日工作已结束';
  const progress = state.elapsed / state.duration * 100;
  $('progress-fill').style.width = `${progress}%`;
  document.querySelector('[role=progressbar]').setAttribute('aria-valuenow', progress.toFixed(1));
  $('start-label').textContent = `${settings.start} 上班`; $('end-label').textContent = `${settings.end} 下班`;
  $('effects').textContent = `特效 ${settings.effects ? '开' : '关'}`;
  $('effects').setAttribute('aria-pressed', String(settings.effects));
}
function updateSettings() {
  const next = { salary: Number($('salary').value), days: Number($('days').value), start: $('start').value, end: $('end').value, effects: settings.effects };
  const valid = validSettings(next) && $('settings-form').checkValidity();
  $('form-error').textContent = valid ? '' : '请输入有效月薪，并确保下班时间晚于上班时间（不计夜班）。';
  for (const name of fields) $(name).setAttribute('aria-invalid', String(!valid && (!$(name).validity.valid || (['start', 'end'].includes(name) && next.end <= next.start))));
  if (!valid) return;
  settings = next; persist(); render();
}
$('settings-form').addEventListener('change', updateSettings);
$('settings-form').addEventListener('submit', event => { event.preventDefault(); updateSettings(); });
$('effects').addEventListener('click', () => { settings.effects = !settings.effects; if (!settings.effects) $('particles').replaceChildren(); persist(); render(); });
document.addEventListener('visibilitychange', () => { if (!document.hidden) render(); });
window.addEventListener('storage', event => {
  if (event.key !== 'salary-clock') return;
  try {
    const saved = JSON.parse(event.newValue);
    if (validSettings(saved)) { settings = { ...defaults, ...saved }; fill(); $('form-error').textContent = ''; render(); }
  } catch { /* Ignore invalid data from another tab. */ }
});
fill(); render();
// Recompute from the wall clock each time so background tabs and reloads never drift.
setInterval(render, 100);
setInterval(() => {
  if (!settings.effects || document.hidden || matchMedia('(prefers-reduced-motion: reduce)').matches || !dayState(settings).active) return;
  const coin = document.createElement('span'); coin.className = 'coin'; coin.textContent = `¥${dayState(settings).perSecond.toFixed(4)}`;
  coin.style.setProperty('--x', `${Math.random() * 120 - 60}px`); $('particles').append(coin); setTimeout(() => coin.remove(), 1900);
}, 1000);
