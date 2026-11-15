const $ = (s) => document.querySelector(s);
const state = { token: localStorage.getItem('token'), user: JSON.parse(localStorage.getItem('user') || 'null'), users: [], projects: [] };

const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const nameOf = (id) => state.users.find((u) => u.id === id)?.name || 'Unassigned';
const day = (iso) => (iso ? iso.slice(0, 10) : 'none');
const options = (items, label, value = (i) => i.id) => items.map((i) => `<option value="${value(i)}">${esc(label(i))}</option>`).join('');

function toast(msg, isError = false) { const t = $('#toast'); t.textContent = msg; t.className = isError ? 'err' : 'ok'; }
const guard = (fn) => async (...args) => { try { await fn(...args); } catch (e) { toast(e.message, true); } };

async function api(path, method = 'GET', body) {
  const res = await fetch(`/api${path}`, {
    method, body: body ? JSON.stringify(body) : undefined,
    headers: { 'Content-Type': 'application/json', ...(state.token ? { Authorization: `Bearer ${state.token}` } : {}) },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) { if (res.status === 401 && state.token) logout(); throw new Error(data.error || 'Request failed'); }
  return data;
}
const formData = (form) => Object.fromEntries([...new FormData(form)].filter(([, v]) => v !== ''));

// ---------- session ----------
function logout() { localStorage.clear(); location.reload(); }
async function enter(session) {
  Object.assign(state, session);
  localStorage.setItem('token', state.token); localStorage.setItem('user', JSON.stringify(state.user));
  await showApp();
}
async function showApp() {
  $('#auth').hidden = true; $('#app').hidden = false; $('#session').hidden = false;
  document.body.dataset.role = state.user.role;
  $('#who').textContent = `${state.user.name} (${state.user.role})`;
  [state.users, state.projects] = await Promise.all([api('/users'), api('/projects')]);
  fillSelects(); go('tasks'); refreshBadge();
}
function fillSelects() {
  const projectOptions = options(state.projects, (p) => p.title);
  $('#task-project').innerHTML = projectOptions;
  $('#filter-project').innerHTML = `<option value="">All projects</option>${projectOptions}`;
  $('#report-project').innerHTML = `<option value="">All projects</option>${projectOptions}`;
  $('#task-assignee').innerHTML = `<option value="">Unassigned</option>${options(state.users, (u) => u.name)}`;
}

// ---------- navigation ----------
const loaders = { tasks: loadTasks, projects: loadProjects, notifications: loadNotifications, reports: loadReport };
function go(view) {
  document.querySelectorAll('#app > section').forEach((s) => { s.hidden = s.id !== `view-${view}`; });
  document.querySelectorAll('nav button').forEach((b) => b.setAttribute('aria-current', String(b.dataset.view === view)));
  guard(loaders[view])();
}

// ---------- tasks (FR-1, FR-2, FR-3, FR-5) ----------
const taskCard = (t) => `
  <article class="card" data-id="${t.id}">
    <h3>${esc(t.title)} <span class="badge ${t.priority}">${t.priority}</span></h3>
    <p>${esc(t.description)}</p>
    <p>Status: <strong>${t.status}</strong>. Assignee: ${esc(nameOf(t.assigneeId))}. Due: ${day(t.dueDate)}. Time logged: ${t.timeLogged}h.</p>
    <div class="row">
      <label>Status <select data-act="status">${['To Do', 'In Progress', 'Done'].map((s) => `<option ${s === t.status ? 'selected' : ''}>${s}</option>`).join('')}</select></label>
      <label>Hours <input type="number" min="0.25" max="24" step="0.25" data-act="hours"></label>
      <button type="button" data-act="log">Log time</button>
      <button type="button" data-act="open">Comments and history</button>
      <label class="manager-only">Repeat <select data-act="pattern"><option>daily</option><option>weekly</option><option>monthly</option></select></label>
      <button type="button" class="manager-only" data-act="recur">Make recurring</button>
    </div>
    <div class="details" aria-live="polite"></div>
  </article>`;

async function loadTasks() {
  const p = $('#filter-project').value;
  const tasks = await api(`/tasks${p ? `?projectId=${p}` : ''}`);
  $('#task-list').innerHTML = tasks.map(taskCard).join('') || '<p>No tasks yet. Tasks assigned to you will appear here.</p>';
}
async function openDetails(card) {
  const t = await api(`/tasks/${card.dataset.id}`);
  const comments = t.comments.map((c) => `<li><strong>${esc(nameOf(c.userId))}</strong>: ${esc(c.text)}</li>`).join('') || '<li>No comments yet.</li>';
  const history = t.history.map((h) => `<li>${h.oldStatus} to ${h.newStatus} by ${esc(nameOf(h.changedBy))}</li>`).join('') || '<li>No status changes yet.</li>';
  card.querySelector('.details').innerHTML = `
    <h4>Comments</h4><ul>${comments}</ul>
    <form data-act="comment"><label>Add a comment (mention someone with @name, e.g. @alice) <input name="text" required></label><button>Post comment</button></form>
    <h4>Status history</h4><ul>${history}</ul>`;
}

$('#task-list').addEventListener('change', guard(async (e) => {
  if (e.target.dataset.act !== 'status') return;
  try { await api(`/tasks/${e.target.closest('article').dataset.id}/status`, 'PATCH', { status: e.target.value }); toast('Status updated'); }
  finally { loadTasks(); }
}));
$('#task-list').addEventListener('click', guard(async (e) => {
  const act = e.target.dataset.act, card = e.target.closest('article');
  if (!card) return;
  if (act === 'log') {
    await api(`/tasks/${card.dataset.id}/time`, 'POST', { hours: card.querySelector('[data-act=hours]').value });
    toast('Time logged'); loadTasks();
  } else if (act === 'open') await openDetails(card);
  else if (act === 'recur') {
    await api(`/tasks/${card.dataset.id}/recurrence`, 'POST', { pattern: card.querySelector('[data-act=pattern]').value });
    toast('Task will now repeat automatically');
  }
}));
$('#task-list').addEventListener('submit', guard(async (e) => {
  e.preventDefault();
  const card = e.target.closest('article');
  await api(`/tasks/${card.dataset.id}/comments`, 'POST', { text: e.target.text.value });
  toast('Comment posted'); await openDetails(card);
}));
$('#filter-project').addEventListener('change', guard(loadTasks));
$('#task-form').addEventListener('submit', guard(async (e) => {
  e.preventDefault();
  await api('/tasks', 'POST', formData(e.target));
  e.target.reset(); toast('Task created'); loadTasks();
}));

// ---------- projects ----------
async function loadProjects() {
  state.projects = await api('/projects'); fillSelects();
  $('#project-list').innerHTML = state.projects.map((p) => `
    <article class="card"><h3>${esc(p.title)}</h3><p>${esc(p.description)}</p>
    <label>Progress: ${p.progress}% complete <progress max="100" value="${p.progress}"></progress></label></article>`).join('') || '<p>No projects yet.</p>';
}
$('#project-form').addEventListener('submit', guard(async (e) => {
  e.preventDefault();
  await api('/projects', 'POST', formData(e.target));
  e.target.reset(); toast('Project created'); loadProjects();
}));

// ---------- notifications (FR-4) ----------
async function refreshBadge() {
  const unread = (await api('/notifications')).filter((n) => !n.isRead).length;
  $('#badge').hidden = unread === 0; $('#badge').textContent = unread;
}
async function loadNotifications() {
  const list = await api('/notifications');
  $('#notif-list').innerHTML = list.map((n) => `
    <li class="${n.isRead ? '' : 'unread'}">${esc(n.message)} <small>${new Date(n.createdAt).toLocaleString()}</small>
    ${n.isRead ? '' : `<button type="button" data-id="${n.id}">Mark as read</button>`}</li>`).join('') || '<li>You have no notifications.</li>';
  refreshBadge();
}
$('#notif-list').addEventListener('click', guard(async (e) => {
  if (!e.target.dataset.id) return;
  await api(`/notifications/${e.target.dataset.id}/read`, 'PATCH'); loadNotifications();
}));

// ---------- reports (FR-6) ----------
async function loadReport() {
  const p = $('#report-project').value;
  const r = await api(`/reports${p ? `?projectId=${p}` : ''}`);
  const rows = (items, cells) => items.map((i) => `<tr>${cells(i).map((c) => `<td>${esc(c)}</td>`).join('')}</tr>`).join('');
  $('#report').innerHTML = `
    <p><strong>${r.completionRate}%</strong> of ${r.totalTasks} tasks are done.
       To Do: ${r.byStatus['To Do']}, In Progress: ${r.byStatus['In Progress']}, Done: ${r.byStatus.Done}.</p>
    <h3>Overdue tasks (${r.overdueTasks.length})</h3>
    <table><thead><tr><th>Task</th><th>Assignee</th><th>Due</th></tr></thead><tbody>
      ${rows(r.overdueTasks, (t) => [t.title, nameOf(t.assigneeId), day(t.dueDate)]) || '<tr><td colspan="3">No overdue tasks.</td></tr>'}</tbody></table>
    <h3>Workload</h3>
    <table><thead><tr><th>Person</th><th>Open tasks</th><th>Hours logged</th></tr></thead><tbody>
      ${rows(r.workload, (w) => [w.name, w.openTasks, w.hoursLogged]) || '<tr><td colspan="3">No assigned tasks yet.</td></tr>'}</tbody></table>`;
}
$('#report-project').addEventListener('change', guard(loadReport));

// ---------- auth forms and startup ----------
document.querySelector('nav').addEventListener('click', (e) => { if (e.target.dataset.view) go(e.target.dataset.view); });
$('#logout').addEventListener('click', logout);
$('#login-form').addEventListener('submit', guard(async (e) => { e.preventDefault(); await enter(await api('/auth/login', 'POST', formData(e.target))); }));
$('#register-form').addEventListener('submit', guard(async (e) => {
  e.preventDefault();
  const data = formData(e.target);
  await api('/auth/register', 'POST', data);
  await enter(await api('/auth/login', 'POST', { email: data.email, password: data.password }));
}));
setInterval(() => { if (state.token) guard(refreshBadge)(); }, 30000);
if (state.token && state.user) guard(showApp)();
