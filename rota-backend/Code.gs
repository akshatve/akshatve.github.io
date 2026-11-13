/**
 * NUTVIQUE STAFF ROTA  –  attendance, breaks, travel claims, rota and payroll for Nutzy Foods Pvt Ltd
 * ---------------------------------------------------------------------------------------------------
 * Google Sheet + Apps Script back end for the installed app at vermakshat.com/rota (owner: nutzyfoods@gmail.com).
 *
 *  • Sign-in uses the SAME people and PINs as the Nutvique Inventory / billing app: the phone signs in there and
 *    sends its session token here; this script checks the token with the Inventory app (action "me").
 *  • Clock in / break out / back from break / clock out: server time, GPS position checked against the store's
 *    geofence, selfie saved to Drive, phone ID checked. Anything odd is flagged for a manager.
 *  • Work time, late minutes, extra break minutes and overtime are worked out per day against the rota shift;
 *    the Payroll screen turns them into salary (monthly salary ÷ days in month × paid days) + approved overtime + travel.
 *  • Trips on company expense: start / end with GPS (own bike / car paid per km), Porter / Rapido / cab etc. with the
 *    actual fare + receipt screenshot. Manager approves; approved amounts go into that month's payroll.
 *  • Rota: Morning 10–7 / Evening 1–10, one weekly off per person on Tue, Wed or Thu only; auto-plan per store,
 *    edit any cell, publish to staff.
 *
 * Editor helpers (Run menu): setup, installTriggers, nightlySummary, testInventoryLink.
 */

// ───────────────────────────── constants ─────────────────────────────
const APP = 'Nutvique Staff Rota';
const INV_API = 'https://script.google.com/macros/s/AKfycbzzWrQoosUFIlSWu4-jvlaG7j2CYpWTcgw6wByaY2aQD6vZ5tWIOJ36wyk1XMT8sM3RHQ/exec';
const HO = 'Head Office';
const STORES = ['Gulshan One29 Mall', 'City Galleria – Gaur City-2', 'Central Market – Sector 120'];
const SHIFT_CODES = ['M', 'E', 'OFF', 'LP', 'LU', 'HOL', 'CUST'];
const SHIFT_LABEL = { M: 'Morning', E: 'Evening', OFF: 'Weekly off', LP: 'Leave (paid)', LU: 'Leave (unpaid)', HOL: 'Holiday', CUST: 'Custom' };
const OFF_DAYS = [2, 3, 4];                          // Tue, Wed, Thu (JS getDay) – the normal weekly-off days
/** Extra weekly-off days the owner allowed for single weeks: {'2026-11-02': [1, 5]} (from the "Extra off days by week" setting). */
function extraOffMap_() {
  const out = {};
  String(setv_('Extra off days by week') || '').split(';').forEach(part => {
    const m = /(\d{4}-\d{2}-\d{2})\s*:\s*(.*)/.exec(part.trim()); if (!m) return;
    const days = m[2].split(/[,\s]+/).map(x => DAY_NAMES.findIndex(d => d.toLowerCase() === x.slice(0, 3).toLowerCase())).filter(x => x >= 0 && OFF_DAYS.indexOf(x) < 0);
    if (days.length) out[m[1]] = days.filter((x, i, a) => a.indexOf(x) === i).sort();
  });
  return out;
}
function offDaysFor_(week) { return OFF_DAYS.concat(extraOffMap_()[week] || []); }
function offDaysTxt_(week) { const x = extraOffMap_()[week] || []; return 'Tuesday, Wednesday or Thursday' + (x.length ? ' (this week also ' + x.map(d => DAY_NAMES[d]).join(', ') + ')' : ''); }
/** Owner (Settings right): which extra days may be weekly offs in one week. d = {week, days:[1,5]} */
function offDaysSave_(d, me) {
  const week = monday_(d.week);
  const days = (d.days || []).map(Number).filter(x => x >= 0 && x <= 6 && OFF_DAYS.indexOf(x) < 0).filter((x, i, a) => a.indexOf(x) === i).sort();
  const map = extraOffMap_();
  if (days.length) map[week] = days; else delete map[week];
  const keepFrom = addDays_(monday_(today_()), -56);                          // forget weeks more than 8 weeks old
  const val = Object.keys(map).filter(w => w >= keepFrom).sort().map(w => w + ': ' + map[w].map(x => DAY_NAMES[x]).join(', ')).join('; ');
  const sh = tab_('set'), keys = rows_('set').map(r => s_(r[0])), i = keys.indexOf('Extra off days by week');
  if (i >= 0) sh.getRange(i + 2, 2).setValue(val); else sh.appendRow(['Extra off days by week', val, DEFAULT_SETTINGS.find(x => x[0] === 'Extra off days by week')[2]]);
  dirty_('set');
  log_('Off days for week ' + week + ': Tue–Thu' + (days.length ? ' + ' + days.map(x => DAY_NAMES[x]).join(', ') : ' only'), me.name);
  return rotaGet_({ week: week }, me);
}
const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const TRIP_MODES = [
  // [key, label, kind]   kind: km = paid per km from GPS, fare = actual fare entered (+ receipt), free = no cost
  ['bike', 'Own bike / scooter', 'km'], ['car', 'Own car', 'km'], ['porter', 'Porter', 'fare'], ['rapido', 'Rapido', 'fare'],
  ['cab', 'Uber / Ola cab', 'fare'], ['auto', 'Auto / e-rickshaw', 'fare'], ['metro', 'Metro / bus', 'fare'],
  ['company', 'Company vehicle', 'free'], ['other', 'Other', 'fare']];
const RECEIPT_NEEDED = { porter: 1, rapido: 1, cab: 1 };

const T = {
  staff: ['Staff', ['Name', 'Emp ID', 'Location', 'Role', 'Active', 'Shift preference', 'Weekly off preference', 'Monthly salary ₹',
    'Joined on', 'Phone ID', 'Phone set on', 'Notes', 'Updated', 'On rota', 'App rights']],
  locs: ['Locations', ['Location', 'Type', 'Latitude', 'Longitude', 'Radius (m)', 'Active', 'Notes', 'From', 'To', 'Default start', 'Default end']],
  rota: ['Rota', ['Week (Mon)', 'Date', 'Day', 'Name', 'Location', 'Shift', 'Start', 'End', 'Status', 'Note', 'Saved by', 'Saved at']],
  punch: ['Punches', ['ID', 'Date', 'Name', 'Type', 'Time', 'Location', 'Distance (m)', 'Inside', 'Latitude', 'Longitude',
    'Accuracy (m)', 'Selfie', 'Phone ID', 'Flags', 'Reason', 'Approved', 'Approved by', 'Saved at']],
  fix: ['Day Corrections', ['Date', 'Name', 'Status', 'In', 'Out', 'Break (min)', 'Overtime approved (min)', 'Note', 'By', 'At', 'Late excused', 'Extra break paid (min)']],
  trips: ['Trips', ['Trip ID', 'Date', 'Name', 'Purpose', 'Mode', 'Status', 'Start time', 'Start place', 'Start lat', 'Start lng',
    'End time', 'End place', 'End lat', 'End lng', 'Straight km', 'GPS trail km', 'Claimed km', 'Rate ₹/km', 'Fare ₹', 'Receipt',
    'Claimed ₹', 'Approved ₹', 'Decided by', 'Decided at', 'Staff note', 'Manager note', 'Trail']],
  att: ['Attendance', ['Date', 'Day', 'Name', 'Location', 'Shift', 'Sched start', 'Sched end', 'In', 'Out', 'Break (min)',
    'Extra break (min)', 'Late (min)', 'Left early (min)', 'Worked (min)', 'Credited (min)', 'Overtime (min)', 'OT approved (min)',
    'Day credit', 'Status', 'Flags']],
  pay: ['Payroll', ['Month', 'Name', 'Emp ID', 'Location', 'Monthly salary ₹', 'Days in month', 'Weekly offs', 'Holidays',
    'Paid leave', 'Unpaid leave', 'Absent', 'Work days credit', 'Worked on off (days)', 'Paid days', 'Late days', 'Late (min)',
    'Extra break (min)', 'Short (min)', 'OT approved (h)', 'Day rate ₹', 'Salary earned ₹', 'Overtime ₹', 'Travel ₹', 'Total payable ₹',
    'Flags', 'Built at']],
  set: ['Settings', ['Setting', 'Value', 'Note']],
  log: ['Log', ['At', 'What', 'Result']]
};
const C = {}; Object.keys(T).forEach(k => { C[k] = {}; T[k][1].forEach((h, i) => C[k][h] = i); });

const DEFAULT_SETTINGS = [
  ['Morning shift', '10:00-19:00', 'Start-end, 24-hour clock.'],
  ['Evening shift', '13:00-22:00', ''],
  ['Break allowed (min per shift)', 30, 'Paid break per shift. Extra break minutes are cut from the day (the owner can pay them for a person on a day).'],
  ['Late grace (min)', 5, 'Coming in up to this many minutes late is not counted (the owner can excuse a late day).'],
  ['Geofence radius (m)', 200, 'Default for a location; each location can have its own radius in the Locations tab.'],
  ['Max GPS error (m)', 250, 'Clock-ins with a worse GPS reading are refused (ask the person to wait a few seconds / step near the entrance).'],
  ['Selfie required', 'Yes', 'Yes = a front-camera photo is taken at every clock in / out and break.'],
  ['One phone per person', 'Flag', 'Flag = clocking from a different phone is allowed but flagged · Block = refused · Off.'],
  ['Outside location', 'Ask reason', 'Ask reason = allowed with a reason and flagged for approval (not credited until approved) · Block.'],
  ['Count early arrival as overtime', 'No', 'No = time before the shift start is not counted.'],
  ['Overtime pay multiplier', 1, 'Approved overtime is paid at (day rate ÷ shift hours) × this.'],
  ['Pay work on weekly off', 'Yes', 'Yes = working on a weekly off earns an extra day (pro-rata).'],
  ['Attendance starts on', '', 'Days before this date are treated as paid (records were kept outside the app). Set when going live.'],
  ['Bike rate ₹/km', 4, 'Own bike / scooter.'],
  ['Car rate ₹/km', 10, 'Own car.'],
  ['Road factor', 1.3, 'Straight-line GPS distance × this ≈ road distance (used when the phone could not record the route).'],
  ['Summary email', 'nutzyfoods@gmail.com', 'Nightly summary (late, absent, missed clock-out, flags, trips to approve). Blank = off.'],
  ['Approval email', '', 'Who is emailed at once when a clock-in / clock-out needs approval (comma separated). Blank = the Summary email.'],
  ['Approval needed after (min)', 30, 'Clock-in this many minutes or more before the rota start, or clock-out this many minutes or more after the rota end, waits for a manager. Not approved = paid only the rota shift.'],
  ['Photo folder ID', '', 'Drive folder for selfies and receipts (created automatically).'],
  ['Extra off days by week', '', 'Set in the app: Rota plan → "Off days". Week (Monday) and extra days, e.g. 2026-11-02: Mon, Fri; 2026-11-16: Sat']
];

// Approximate map positions (Google Maps). Stand inside the store and tap "Use my position" in Settings → Locations to make them exact.
const SEED_LOCS = [
  [STORES[0], 'Store', 28.5084993, 77.3870789, 200, 'Yes', 'Mall centre (approx.)'],
  [STORES[1], 'Store', 28.6191558, 77.4234722, 250, 'Yes', 'Galleria Market, Gaur City 2 (approx.) – set from the store'],
  [STORES[2], 'Store', 28.5863276, 77.3988305, 200, 'Yes', 'Central Market mall (approx.)'],
  [HO, 'Office', '', '', 200, 'Yes', 'Set from the office: Settings → Locations → Use my position'],
  ['Central Warehouse', 'Office', '', '', 200, 'No', 'Turn on and set the position if staff clock in there']];

// ───────────────────────────── web app ─────────────────────────────
function doGet() {
  return HtmlService.createHtmlOutput('<p style="font:16px sans-serif;padding:24px">' + APP + ' – open the app at <a href="https://vermakshat.com/rota/">vermakshat.com/rota</a>.</p>').setTitle(APP);
}
function doPost(e) {
  let out; const t0 = Date.now(); let action = '';
  try { const req = JSON.parse((e && e.postData && e.postData.contents) || '{}'); action = String(req.action || ''); out = { ok: true, r: api_(req) }; }
  catch (err) { out = { ok: false, e: String((err && err.message) || err).replace(/^(Error|Exception):\s*/, '') }; }
  out.ms = Date.now() - t0;
  if (out.ms > 6000) log_('Slow ' + action + ' ' + out.ms + ' ms', '');
  return ContentService.createTextOutput(JSON.stringify(out)).setMimeType(ContentService.MimeType.JSON);
}

// Rights inside this app. The owner has all of them and gives them to anyone in More → Permissions.
// Managers get only "rota" unless the owner ticks more. Checked on the server for every action.
const RRIGHTS = [
  ['rota', 'Plan, change and publish the rota (incl. who covers a shift)'],
  ['team', 'See the team board and attendance (who is in, late, on break)'],
  ['times', 'Change anyone\'s in / out times, breaks and day status (leave, off…) for today'],
  ['pastTimes', 'Change EARLIER days\' in / out times and day status of staff (not managers), with a genuine reason'],
  ['payAdj', 'Pay adjustments: excuse a late day, pay extra break, approve overtime'],
  ['approve', 'Approve clock entries made away from a store'],
  ['trips', 'Approve trip claims (travel money)'],
  ['staff', 'Edit staff: store, shifts, weekly off, on rota, phone reset'],
  ['pay', 'Payroll and salaries'],
  ['settings', 'Settings, store locations and geofence']];
const RRIGHT_LABEL = {}; RRIGHTS.forEach(r => RRIGHT_LABEL[r[0]] = r[1]);
const DEFAULT_RIGHTS = { Manager: ['rota'], Staff: [] };
const ACTION_NEED = { board: ['team', 'approve', 'times', 'payAdj', 'pastTimes'], attendance: ['team', 'approve', 'times', 'payAdj', 'pastTimes'], fixDay: ['times', 'payAdj', 'pastTimes'], approvePunch: 'approve', pending: 'approve',
  photo: ['team', 'approve', 'times', 'trips'], trips: 'trips', tripDecide: 'trips', staffList: ['staff', 'pay', 'rota'], staffSave: ['staff', 'pay'], resetPhone: 'staff',
  syncStaff: 'staff', rotaGet: 'rota', rotaAuto: 'rota', rotaSave: 'rota', payroll: 'pay', locSave: ['settings', 'rota'], settingsGet: 'settings', settingsSave: 'settings',
  rightsList: 'owner', rightsSave: 'owner', offDaysSave: 'settings' };
function can_(me, need) {
  if (me.owner) return true;
  if (need === 'owner') return false;
  return (Array.isArray(need) ? need : [need]).some(k => me.rights.indexOf(k) >= 0);
}

function api_(req) {
  const action = String(req.action || '');
  resetMemo_(!(READ_ONLY[action] || (action === 'payroll' && !(req.data || {}).write)));
  if (action === 'signout') { try { CacheService.getScriptCache().remove('u_' + digest_(String(req.token || '')).slice(0, 40)); } catch (e) { } return { ok: true }; }
  if (action === 'ping') return { at: new Date().toISOString() };
  const me = who_(req.token);
  ensureSetup_();
  const d = req.data || {};
  if (ACTION_NEED[action] && !can_(me, ACTION_NEED[action])) throw new Error('You do not have the right for this – ask the owner (More → Permissions).');
  switch (action) {
    case 'boot': return boot_(me, req.token);
    case 'punch': return punch_(d, me);
    case 'myDay': return myDay_(me);
    case 'myMonth': return myMonth_(d, me);
    case 'myRota': return { weeks: myRota_(me) };
    case 'tripStart': return tripStart_(d, me);
    case 'tripEnd': return tripEnd_(d, me);
    case 'tripCancel': return tripCancel_(d, me);
    case 'myTrips': return { trips: tripsFor_(me.name, 60) };
    case 'board': return board_(d, me);
    case 'rotaGet': return rotaGet_(d, me);
    case 'rotaAuto': return rotaAuto_(d, me);
    case 'rotaSave': return rotaSave_(d, me);
    case 'attendance': return attendance_(d, me);
    case 'fixDay': return fixDay_(d, me);
    case 'approvePunch': return approvePunch_(d, me);
    case 'pending': return pending_(d, me);
    case 'trips': return tripsAdmin_(d, me);
    case 'tripDecide': return tripDecide_(d, me);
    case 'photo': return photo_(d, me);
    case 'payroll': return payroll_(d, me);
    case 'staffList': return staffList_(me);
    case 'staffSave': return staffSave_(d, me);
    case 'resetPhone': return resetPhone_(d, me);
    case 'syncStaff': return syncStaff_(req.token, me);
    case 'locSave': return locSave_(d, me);
    case 'settingsGet': return settingsGet_();
    case 'settingsSave': return settingsSave_(d, me);
    case 'rightsList': return rightsList_();
    case 'offDaysSave': return offDaysSave_(d, me);
    case 'rightsSave': return rightsSave_(d, me);
  }
  throw new Error('Unknown action: ' + action);
}

// ───────────────────────────── who is calling (Nutvique sign-in) ─────────────────────────────
/** Checks the Nutvique session token with the Inventory app. Cached 10 min. */
function who_(token) {
  token = String(token || '');
  if (!/^[a-f0-9]{30,80}$/i.test(token)) throw new Error('Signed out – please sign in again.');
  const key = 'u_' + digest_(token).slice(0, 40), c = CacheService.getScriptCache(), hit = c.get(key);
  let u = hit ? JSON.parse(hit) : null;
  if (!u) {
    const res = UrlFetchApp.fetch(INV_API, { method: 'post', contentType: 'text/plain;charset=utf-8', muteHttpExceptions: true, followRedirects: true,
      payload: JSON.stringify({ token: token, action: 'me', data: {} }) });
    let j = null; try { j = JSON.parse(res.getContentText()); } catch (e) { }
    if (!j) throw new Error('Could not reach the Nutvique sign-in (' + res.getResponseCode() + '). Try again.');
    if (!j.ok) throw new Error(/Signed out/i.test(j.e || '') ? 'Signed out – please sign in again.' : (j.e || 'Sign-in failed.'));
    u = j.r.user;
    c.put(key, JSON.stringify(u), 10800);         // 3 h: saves a 1–2 s call to the billing app on most opens
  }
  const owner = u.role === 'Owner', invRights = u.rights || [];
  const me = { name: u.name, role: u.role, home: u.home || '', owner: owner };
  const s = owner ? null : staffByName_(u.name);
  me.rights = owner ? RRIGHTS.map(r => r[0]) : rightsOf_(s, u.role);
  me.admin = owner || me.rights.length > 0;
  me.pay = can_(me, 'pay');
  me.scope = owner || invRights.indexOf('allStores') >= 0 || (u.role === 'Manager' && !u.home) ? null : [(s && s.loc) || u.home];
  return me;
}
function inScope_(me, loc) { return !me.scope || me.scope.indexOf(loc) >= 0; }

// ───────────────────────────── sheet plumbing ─────────────────────────────
// ── speed: the spreadsheet, each tab and each tab's rows are read once per request (MEMO);
//    small tabs (staff, locations, settings) are also kept in the script cache between requests (XCACHE).
//    Every write goes through append_ / w_() / dirty_(), which drop the copies.
let MEMO = { book: null, tabs: {}, rows: {}, fresh: false };
// Actions that only read; every other action reads the sheet fresh (never the between-request cache) before writing.
const READ_ONLY = { boot: 1, myDay: 1, myMonth: 1, myRota: 1, myTrips: 1, board: 1, rotaGet: 1, rotaAuto: 1, attendance: 1, trips: 1, photo: 1,
  staffList: 1, settingsGet: 1, rightsList: 1 };
const XCACHE = { staff: 1, locs: 1, set: 1 };
function resetMemo_(fresh) { MEMO = { book: null, tabs: {}, rows: {}, fresh: !!fresh }; }
function xver_() { return PropertiesService.getScriptProperties().getProperty('XVER') || '0'; }
function dirty_(k) {
  if (k) delete MEMO.rows[k]; else MEMO.rows = {};
  if (!k || XCACHE[k]) PropertiesService.getScriptProperties().setProperty('XVER', String(Date.now()) + Math.random().toString(36).slice(2, 6));
  if (!k || k === 'set') CacheService.getScriptCache().remove('settings');
}
/** Tab for writing: same as tab_ but marks its cached rows stale. */
function w_(k) { dirty_(k); return tab_(k); }
function book_() {
  if (MEMO.book) return MEMO.book;
  const p = PropertiesService.getScriptProperties(), id = p.getProperty('BOOK_ID');
  if (id) return (MEMO.book = SpreadsheetApp.openById(id));
  const ss = SpreadsheetApp.getActive();
  if (!ss) throw new Error('Open the script from its Google Sheet and run setup once.');
  p.setProperty('BOOK_ID', ss.getId());
  return ss;
}
function tab_(k) {
  if (MEMO.tabs[k]) return MEMO.tabs[k];
  const ss = book_(), name = T[k][0], head = T[k][1];
  let sh = ss.getSheetByName(name);
  if (!sh) {
    sh = ss.insertSheet(name);
    sh.getRange(1, 1, 1, head.length).setValues([head]).setFontWeight('bold').setBackground('#1F2A44').setFontColor('#F7F1DE').setWrap(true);
    sh.setFrozenRows(1);
    const textCols = { rota: ['Week (Mon)', 'Date', 'Start', 'End'], punch: ['ID', 'Date'], fix: ['Date', 'In', 'Out'], trips: ['Trip ID', 'Date'],
      att: ['Date', 'Sched start', 'Sched end', 'In', 'Out'], pay: ['Month'], staff: ['Emp ID', 'Joined on', 'Phone ID'], set: ['Value'] }[k] || [];
    textCols.forEach(h => { const i = head.indexOf(h); if (i >= 0) sh.getRange(1, i + 1, sh.getMaxRows(), 1).setNumberFormat('@'); });
    if (k === 'trips') sh.hideColumns(head.length);
    if (k === 'set') { sh.setColumnWidth(1, 260); sh.setColumnWidth(2, 220); sh.setColumnWidth(3, 560); }
  }
  return (MEMO.tabs[k] = sh);
}
function rows_(k) {
  if (MEMO.rows[k]) return MEMO.rows[k];
  const c = CacheService.getScriptCache(), key = 'rows_' + k + '_' + xver_();
  if (XCACHE[k] && !MEMO.fresh) {
    const hit = c.get(key);
    if (hit) { try { return (MEMO.rows[k] = JSON.parse(hit).map(r => r.map(v => (typeof v === 'string' && /^\u0001D/.test(v)) ? new Date(v.slice(2)) : v))); } catch (e) { } }
  }
  const sh = tab_(k), n = sh.getLastRow() - 1;
  const v = n < 1 ? [] : sh.getRange(2, 1, n, T[k][1].length).getValues();
  if (XCACHE[k]) { try { const j = JSON.stringify(v.map(r => r.map(x => x instanceof Date ? '\u0001D' + x.toISOString() : x))); if (j.length < 90000) c.put(key, j, 300); } catch (e) { } }
  return (MEMO.rows[k] = v);
}
function append_(k, rows) { if (!rows.length) return; const sh = w_(k); sh.getRange(sh.getLastRow() + 1, 1, rows.length, rows[0].length).setValues(rows); dirty_(k); }
function lock_(fn) { const l = LockService.getScriptLock(); l.waitLock(30000); try { MEMO.rows = {}; return fn(); } finally { l.releaseLock(); } }

/** Run once from the editor (also runs by itself the first time the app is used). */
function setup() {
  resetMemo_();
  Object.keys(T).forEach(k => tab_(k));
  const st = tab_('set'), have = rows_('set').map(r => s_(r[0]));
  const add = DEFAULT_SETTINGS.filter(x => have.indexOf(x[0]) < 0).map(x => [x[0], String(x[1]), x[2]]);
  if (add.length) { st.getRange(st.getLastRow() + 1, 1, add.length, 3).setValues(add); dirty_('set'); }
  if (!rows_('locs').length) append_('locs', SEED_LOCS);
  const ss = book_(); ['Sheet1'].forEach(n => { const s = ss.getSheetByName(n); if (s && s.getLastRow() === 0 && ss.getSheets().length > 1) ss.deleteSheet(s); });
  dirty_();
  return 'Setup done.';
}
function ensureSetup_() {
  const p = PropertiesService.getScriptProperties();
  if (!p.getProperty('SETUP_V1')) { setup(); p.setProperty('SETUP_V1', '1'); }
  if (!p.getProperty('V2_RULES')) {                 // 21 Oct 2026: owner's changes
    p.setProperty('V2_RULES', '1');
    const st = tab_('staff'); st.getRange(1, 1, 1, T.staff[1].length).setValues([T.staff[1]]).setFontWeight('bold').setBackground('#1F2A44').setFontColor('#F7F1DE');
    const fx = tab_('fix'); fx.getRange(1, 1, 1, T.fix[1].length).setValues([T.fix[1]]).setFontWeight('bold').setBackground('#1F2A44').setFontColor('#F7F1DE');
    const sh = tab_('set'), keys = rows_('set').map(r => s_(r[0])), vals = rows_('set').map(r => s_(r[1]));
    [['Break allowed (min per shift)', '60', '30'], ['Late grace (min)', '10', '5']].forEach(x => { const i = keys.indexOf(x[0]); if (i >= 0 && vals[i] === x[1]) sh.getRange(i + 2, 2).setValue(x[2]); });
    DEFAULT_SETTINGS.filter(x => /^(Break allowed|Late grace)/.test(x[0])).forEach(x => { const i = keys.indexOf(x[0]); if (i >= 0) sh.getRange(i + 2, 3).setValue(x[2]); });
    staffAll_().forEach(x => {
      if (norm_(x.name) === norm_('Jitender Chauhan') && x.loc !== STORES[1]) st.getRange(x.row, C.staff['Location'] + 1).setValue(STORES[1]);
      if (norm_(x.name) === norm_('Pankaj Verma')) st.getRange(x.row, C.staff['On rota'] + 1).setValue('No');
      if (st.getRange(x.row, C.staff['On rota'] + 1).getValue() === '') st.getRange(x.row, C.staff['On rota'] + 1).setValue(norm_(x.name) === norm_('Pankaj Verma') ? 'No' : 'Yes');
    });
    dirty_();
    log_('v2: break 30 min, grace 5 min, rights, Jitender → City Galleria, Pankaj Verma off the rota', 'system');
  }
  if (!p.getProperty('V3_EVENTS')) {                 // 1 Nov 2026: event stalls in the rota
    p.setProperty('V3_EVENTS', '1');
    const ls = tab_('locs'); ls.getRange(1, 1, 1, T.locs[1].length).setValues([T.locs[1]]).setFontWeight('bold').setBackground('#1F2A44').setFontColor('#F7F1DE');
    ls.getRange(1, 8, ls.getMaxRows(), 4).setNumberFormat('@');
    if (!rows_('locs').some(r => s_(r[1]) === 'Event'))
      append_('locs', [['Event stall', 'Event', '', '', 300, 'Yes', 'General event stall – rename it for each event or add events with their own dates', '', '', '11:00', '22:00']]);
    dirty_();
    log_('v5: event stalls, after-midnight clock-outs, clock-out approval', 'system');
  }
  if (!p.getProperty('V8_EARLYLATE')) {              // 13 Nov 2026: early clock-in / late clock-out need a manager's approval
    p.setProperty('V8_EARLYLATE', '1');
    const sh = tab_('set'), have = rows_('set').map(r => s_(r[0]));
    [['Approval email', 'nutzyfoods@gmail.com, veer@nutzyfoods.com, vrupal01@gmail.com, pankajkumarsurir94@gmail.com, vikas.casadecor@gmail.com'], ['Approval needed after (min)', '30']].forEach(x => {
      if (have.indexOf(x[0]) < 0) sh.appendRow([x[0], x[1], DEFAULT_SETTINGS.find(d => d[0] === x[0])[2]]);
    });
    dirty_('set');
    log_('v8: early clock-in / late clock-out (30 min+) need approval; approval emails to managers', 'system');
  }
  if (!p.getProperty('V6_OFFDAYS')) {                // 1 Nov 2026: extra off days per week, set by the owner in the app
    p.setProperty('V6_OFFDAYS', '1');
    const sh = tab_('set'), keys = rows_('set').map(r => s_(r[0])), i = keys.indexOf('Extra off days by week');
    const note = DEFAULT_SETTINGS.find(x => x[0] === 'Extra off days by week')[2];
    if (i < 0) sh.appendRow(['Extra off days by week', '2026-11-02: Mon, Fri', note]);
    else if (!s_(rows_('set')[i][1])) sh.getRange(i + 2, 2).setValue('2026-11-02: Mon, Fri');
    dirty_('set');
  }
  if (!p.getProperty('GOLIVE_V1')) {                 // the day the app is first used = "Attendance starts on" (earlier days count as paid)
    p.setProperty('GOLIVE_V1', '1');
    if (!setv_('Attendance starts on')) { const sh = tab_('set'), keys = rows_('set').map(r => s_(r[0])), i = keys.indexOf('Attendance starts on');
      if (i >= 0) sh.getRange(i + 2, 2).setValue(today_()); dirty_('set'); }
  }
}

// ───────────────────────────── settings ─────────────────────────────
function settings_() {
  const c = CacheService.getScriptCache(), hit = c.get('settings');
  if (hit) return JSON.parse(hit);
  const o = {}; DEFAULT_SETTINGS.forEach(x => o[x[0]] = String(x[1]));
  rows_('set').forEach(r => { if (s_(r[0])) o[s_(r[0])] = s_(r[1]); });
  c.put('settings', JSON.stringify(o), 300);
  return o;
}
function setv_(k) { return settings_()[k]; }
function setn_(k, d) { const v = Number(settings_()[k]); return isFinite(v) && settings_()[k] !== '' ? v : d; }
function shiftTimes_(code) {
  const raw = code === 'E' ? setv_('Evening shift') : setv_('Morning shift');
  const m = /^(\d{1,2}):(\d{2})\s*-\s*(\d{1,2}):(\d{2})$/.exec(String(raw || '').trim());
  return m ? { start: pad_(m[1]) + ':' + m[2], end: pad_(m[3]) + ':' + m[4] } : (code === 'E' ? { start: '13:00', end: '22:00' } : { start: '10:00', end: '19:00' });
}
function settingsGet_() {
  return { settings: DEFAULT_SETTINGS.filter(x => x[0] !== 'Photo folder ID' && x[0] !== 'Extra off days by week').map(x => ({ k: x[0], v: settings_()[x[0]], note: x[2] })),
    locations: locs_(true), sheetUrl: book_().getUrl() };
}
function settingsSave_(d, me) {
  const keys = DEFAULT_SETTINGS.map(x => x[0]).filter(k => k !== 'Photo folder ID' && k !== 'Extra off days by week');
  const sh = tab_('set'), cur = rows_('set').map(r => s_(r[0]));
  Object.keys(d.values || {}).forEach(k => {
    if (keys.indexOf(k) < 0) return;
    let v = txt_(d.values[k], 200);
    if (/shift$/.test(k) && !/^\d{1,2}:\d{2}\s*-\s*\d{1,2}:\d{2}$/.test(v)) throw new Error(k + ': write it like 10:00-19:00');
    if (k === 'Attendance starts on' && v && !/^\d{4}-\d{2}-\d{2}$/.test(v)) throw new Error('Attendance starts on: pick a date.');
    const i = cur.indexOf(k);
    if (i >= 0) sh.getRange(i + 2, 2).setValue(v); else { sh.appendRow([k, v, '']); cur.push(k); }
    dirty_('set');
  });
  dirty_('set');
  log_('Settings saved', me.name);
  return settingsGet_();
}

// ───────────────────────────── staff & locations ─────────────────────────────
function staffAll_() {
  return rows_('staff').map((r, i) => ({ row: i + 2, name: s_(r[0]), id: s_(r[1]), loc: s_(r[2]), role: s_(r[3]) || 'Staff', active: s_(r[4]) !== 'No',
    pref: s_(r[5]) || 'Rotate', offPref: s_(r[6]) || 'Any (Tue–Thu)', salary: n_(r[7]), joined: ymd_(r[8]), phone: s_(r[9]), phoneAt: iso_(r[10]), notes: s_(r[11]),
    onRota: s_(r[13]) !== 'No', rightsRaw: s_(r[14]) }))
    .filter(x => x.name);
}
/** Rights from the "App rights" column; blank = the role's default (Manager: rota only). "-" = none. */
function rightsOf_(s, role) {
  if (!s) return (DEFAULT_RIGHTS[role] || []).slice();
  if (!s.rightsRaw) return (DEFAULT_RIGHTS[s.role] || DEFAULT_RIGHTS[role] || []).slice();
  return s.rightsRaw.split(/[,\s]+/).filter(k => RRIGHT_LABEL[k]);
}
function tracked_(s) { return s.active && s.onRota; }
function rightsList_() {
  return { rights: RRIGHTS.map(r => ({ key: r[0], label: r[1] })),
    people: staffAll_().filter(s => s.active).map(s => ({ name: s.name, role: s.role, loc: s.loc, rights: rightsOf_(s, s.role), custom: !!s.rightsRaw })) };
}
/** Owner: d = {name, rights:[keys]} */
function rightsSave_(d, me) {
  const s = staffByName_(d.name); if (!s) throw new Error('Person not found.');
  const list = (d.rights || []).filter(k => RRIGHT_LABEL[k]);
  w_('staff').getRange(s.row, C.staff['App rights'] + 1).setValue(list.length ? list.join(', ') : '-');
  dirty_('staff');
  log_('Rights for ' + s.name + ': ' + (list.join(', ') || 'none'), me.name);
  return rightsList_();
}
function staffByName_(name) { return staffAll_().find(x => norm_(x.name) === norm_(name)) || null; }
/** The signed-in person's staff row – added automatically the first time someone uses the app. */
function myStaff_(me) {
  let s = staffByName_(me.name);
  if (!s && me.role !== 'Owner') {
    lock_(() => { if (!staffByName_(me.name)) append_('staff', [[me.name, '', me.home || '', me.role === 'Manager' ? 'Manager' : 'Staff', 'Yes', 'Rotate', 'Any (Tue–Thu)', '', '', '', '', 'Added on first use – set salary', new Date(), 'Yes', '']]); });
    s = staffByName_(me.name);
  }
  return s;
}
function locs_(all) {
  return rows_('locs').map(r => ({ name: s_(r[0]), type: ['Store', 'Office', 'Event'].indexOf(s_(r[1])) >= 0 ? s_(r[1]) : 'Store', lat: r[2] === '' ? null : n_(r[2]), lng: r[3] === '' ? null : n_(r[3]),
    radius: n_(r[4]) || setn_('Geofence radius (m)', 200), active: s_(r[5]) !== 'No', notes: s_(r[6]), from: ymd_(r[7]), to: ymd_(r[8]), dstart: hm_(r[9]), dend: hm_(r[10]) }))
    .filter(l => l.name && (all || l.active));
}
function locOf_(name) { return locs_(true).find(l => norm_(l.name) === norm_(name)) || null; }
function isEvent_(name) { const l = name ? locOf_(name) : null; return !!(l && l.type === 'Event'); }
/** Event is "on" for a date: no dates set, or the date is within From–To (+1 day for shifts that run past midnight). */
function eventOn_(l, date) { return l.type !== 'Event' || ((!l.from || date >= addDays_(l.from, -1)) && (!l.to || date <= addDays_(l.to, 1))); }
function staffList_(me) {
  const list = staffAll_().filter(s => inScope_(me, s.loc) || !s.loc).map(s => {
    const o = { name: s.name, id: s.id, loc: s.loc, role: s.role, active: s.active, onRota: s.onRota, pref: s.pref, offPref: s.offPref, joined: s.joined, phone: !!s.phone, phoneAt: s.phoneAt, notes: s.notes };
    if (me.pay) o.salary = s.salary;
    return o;
  });
  return { staff: list, locations: locs_(true).map(l => l.name), canPay: me.pay, canEdit: can_(me, 'staff') };
}
function staffSave_(d, me) {
  return lock_(() => {
    const name = txt_(d.name, 60), newName = txt_(d.newName || d.name, 60);
    if (!newName) throw new Error('Type the name.');
    const all = staffAll_(), s = all.find(x => norm_(x.name) === norm_(name));
    if (all.some(x => norm_(x.name) === norm_(newName) && x !== s)) throw new Error(newName + ' already exists.');
    if (d.joined && !/^\d{4}-\d{2}-\d{2}$/.test(d.joined)) throw new Error('Pick the joining date.');
    const row = [newName, txt_(d.id, 20), txt_(d.loc, 60), d.role === 'Manager' ? 'Manager' : 'Staff', d.active === false ? 'No' : 'Yes',
      ['Rotate', 'Morning only', 'Evening only'].indexOf(d.pref) >= 0 ? d.pref : 'Rotate',
      ['Any (Tue–Thu)', 'Tue', 'Wed', 'Thu'].indexOf(d.offPref) >= 0 ? d.offPref : 'Any (Tue–Thu)',
      !me.pay ? (s ? (s.salary || '') : '') : d.salary === '' || d.salary == null ? '' : Math.max(0, n_(d.salary)), d.joined || '', s ? s.phone : '', s ? (s.phoneAt ? new Date(s.phoneAt) : '') : '', txt_(d.notes, 200), new Date(),
      d.onRota === false ? 'No' : 'Yes', s ? s.rightsRaw : ''];
    if (!can_(me, 'staff')) {                       // payroll-only people may change the salary and nothing else
      if (!s) throw new Error('Only people with the Staff right can add a person.');
      const keep = rows_('staff')[s.row - 2].slice(); keep[7] = row[7]; keep[12] = new Date(); row.splice(0, row.length, ...keep);
    }
    const sh = tab_('staff');
    if (s) { sh.getRange(s.row, 1, 1, row.length).setValues([row]); dirty_('staff'); } else append_('staff', [row]);
    log_('Staff saved: ' + newName, me.name);
    return staffList_(me);
  });
}
function resetPhone_(d, me) {
  const s = staffByName_(d.name); if (!s) throw new Error('Not found.');
  w_('staff').getRange(s.row, C.staff['Phone ID'] + 1, 1, 2).setValues([['', '']]); dirty_('staff');
  log_('Phone reset: ' + s.name, me.name);
  return staffList_(me);
}
/** Owner: adds anyone from the Nutvique People list who is not on the Staff tab yet. */
function syncStaff_(token, me) {
  const res = UrlFetchApp.fetch(INV_API, { method: 'post', contentType: 'text/plain;charset=utf-8', muteHttpExceptions: true, followRedirects: true,
    payload: JSON.stringify({ token: token, action: 'listUsers', data: {} }) });
  const j = JSON.parse(res.getContentText());
  if (!j.ok) throw new Error(j.e);
  const have = staffAll_(), add = [];
  j.r.users.filter(u => u.active).forEach(u => {
    if (have.some(x => norm_(x.name) === norm_(u.name))) return;
    const id = (/NF-[A-Z]-\d{3,5}/.exec(u.notes || '') || [''])[0], loc = u.home || (u.role === 'Manager' ? HO : '');
    add.push([u.name, id, loc, u.role === 'Manager' ? 'Manager' : 'Staff', 'Yes', loc === HO ? 'Morning only' : 'Rotate', 'Any (Tue–Thu)', '', '', '', '',
      'From Nutvique People – set salary' + (loc ? '' : ' and location'), new Date(), 'Yes', '']);
  });
  lock_(() => append_('staff', add));
  const missing = have.filter(x => x.active && !j.r.users.some(u => u.active && norm_(u.name) === norm_(x.name))).map(x => x.name);
  return Object.assign(staffList_(me), { added: add.map(r => r[0]), noLogin: missing });
}
/** Stores, offices and event stalls. People with the rota right (but not settings) may only add / change events. */
function locSave_(d, me) {
  return lock_(() => {
    const name = txt_(d.name, 60); if (!name) throw new Error('Type the name.');
    const type = ['Office', 'Event'].indexOf(d.type) >= 0 ? d.type : 'Store';
    const sh = tab_('locs'), all = rows_('locs'), i = all.findIndex(r => norm_(r[0]) === norm_(d.oldName || name));
    if (!can_(me, 'settings') && (type !== 'Event' || (i >= 0 && s_(all[i][1]) !== 'Event'))) throw new Error('You can add or change event stalls only – stores need the Settings right.');
    if (all.some((r, k) => k !== i && norm_(r[0]) === norm_(name))) throw new Error('"' + name + '" already exists.');
    const lat = d.lat === '' || d.lat == null ? '' : n_(d.lat), lng = d.lng === '' || d.lng == null ? '' : n_(d.lng);
    if (lat !== '' && (Math.abs(lat) > 90 || Math.abs(lng) > 180)) throw new Error('Position looks wrong.');
    ['from', 'to'].forEach(k => { if (d[k] && !/^\d{4}-\d{2}-\d{2}$/.test(d[k])) throw new Error('Pick the event dates.'); });
    if (d.from && d.to && d.to < d.from) throw new Error('The event ends before it starts.');
    ['dstart', 'dend'].forEach(k => { if (d[k] && !/^\d{1,2}:\d{2}$/.test(d[k])) throw new Error('Stall hours like 11:00 and 23:00.'); });
    const row = [name, type, lat, lng, Math.max(30, n_(d.radius) || 200), d.active === false ? 'No' : 'Yes', txt_(d.notes, 200),
      type === 'Event' ? (d.from || '') : '', type === 'Event' ? (d.to || '') : '', type === 'Event' ? hm_(d.dstart) : '', type === 'Event' ? hm_(d.dend) : ''];
    if (i >= 0) { sh.getRange(i + 2, 1, 1, row.length).setValues([row]); dirty_('locs'); } else append_('locs', [row]);
    if (i >= 0 && d.oldName && norm_(d.oldName) !== norm_(name)) {        // keep planned shifts pointing at the renamed place
      const rs = tab_('rota'), rr = rows_('rota'); rr.forEach((r, k) => { if (norm_(r[4]) === norm_(d.oldName)) rs.getRange(k + 2, 5).setValue(name); }); dirty_('rota');
    }
    log_((type === 'Event' ? 'Event' : 'Location') + ' saved: ' + name + ' ' + lat + ',' + lng + ' r' + row[4] + (type === 'Event' ? ' ' + row[7] + '–' + row[8] + ' ' + row[9] + '–' + row[10] : ''), me.name);
    return can_(me, 'settings') ? settingsGet_() : { locations: locs_(true) };
  });
}

// ───────────────────────────── rota ─────────────────────────────
function monday_(ymd) { const d = parse_(ymd || today_()); d.setDate(d.getDate() - ((d.getDay() + 6) % 7)); return ymd_(d); }
function addDays_(ymd, n) { const d = parse_(ymd); d.setDate(d.getDate() + n); return ymd_(d); }
function rotaRows_(from, to) {
  return rows_('rota').map((r, i) => ({ row: i + 2, week: ymd_(r[0]), date: ymd_(r[1]), name: s_(r[3]), loc: s_(r[4]), shift: s_(r[5]), start: hm_(r[6]),
    end: hm_(r[7]), status: s_(r[8]), note: s_(r[9]) })).filter(x => x.name && (!from || x.date >= from) && (!to || x.date <= to));
}
/** Published rota entry for one person on one date (null = none). */
function rotaFor_(name, date, cache) {
  const list = cache || rotaRows_(date, date);
  return list.find(x => x.date === date && norm_(x.name) === norm_(name) && x.status === 'Published') || null;
}
function rotaGet_(d, me) {
  const week = monday_(d.week), end = addDays_(week, 6);
  const rows = rotaRows_(week, end);
  const staff = staffAll_().filter(s => tracked_(s) && (inScope_(me, s.loc) || !s.loc));
  const cells = {};
  rows.forEach(x => { if (staff.some(s => norm_(s.name) === norm_(x.name))) cells[x.name + '|' + x.date] = { shift: x.shift, start: x.start, end: x.end, loc: x.loc, note: x.note, status: x.status }; });
  const status = rows.length ? (rows.some(x => x.status === 'Draft') ? 'Draft' : 'Published') : 'Not planned';
  return Object.assign({ week: week, days: [0, 1, 2, 3, 4, 5, 6].map(i => addDays_(week, i)), staff: staff.map(s => ({ name: s.name, loc: s.loc, pref: s.pref, offPref: s.offPref })),
    cells: cells, status: status, shifts: { M: shiftTimes_('M'), E: shiftTimes_('E') },
    locations: locs_(false).filter(l => l.type !== 'Event' || ((!l.to || l.to >= week) && (!l.from || l.from <= end))).map(l => ({ name: l.name, type: l.type, from: l.from, to: l.to, dstart: l.dstart, dend: l.dend, notes: l.notes, hasPos: l.lat != null })),
    canEditStores: can_(me, 'settings'), offDays: offDaysFor_(week), canOffDays: can_(me, 'settings') },
    { warnings: rotaWarnings_(week, staff, cells) });
}
/** Auto plan for one week: one weekly off per person on Tue/Wed/Thu (spread out per store), Morning / Evening alternating week to week,
 *  every store covered on both shifts where staff numbers allow. Returns cells (not saved). */
function rotaAuto_(d, me) {
  const week = monday_(d.week), days = [0, 1, 2, 3, 4, 5, 6].map(i => addDays_(week, i));
  const wkNo = Math.round(parse_(week).getTime() / (7 * 864e5));
  const staff = staffAll_().filter(s => tracked_(s) && s.loc && (inScope_(me, s.loc)));
  const locType = {}; locs_(true).forEach(l => locType[l.name] = l.type);
  const byLoc = {}; staff.forEach(s => (byLoc[s.loc] = byLoc[s.loc] || []).push(s));
  const keep = d.keep || {};                                    // cells the manager already fixed by hand: {name|date: cell}
  const cells = {}, M = shiftTimes_('M'), E = shiftTimes_('E');
  const put = (s, date, code) => { const t = code === 'E' ? E : M; cells[s.name + '|' + date] = { shift: code, start: (code === 'M' || code === 'E') ? t.start : '', end: (code === 'M' || code === 'E') ? t.end : '', loc: s.loc, note: '' }; };
  Object.keys(byLoc).forEach(loc => {
    const list = byLoc[loc].slice().sort((a, b) => a.name < b.name ? -1 : 1), isStore = locType[loc] !== 'Office';
    // 1) weekly offs: preferences first, then spread over Tue/Wed/Thu, rotating the order each week
    const offCount = { 2: 0, 3: 0, 4: 0 }, off = {};
    list.forEach(s => days.forEach(dt => { const k = keep[s.name + '|' + dt], dw = parse_(dt).getDay(); if (k && k.shift === 'OFF') { off[s.name] = dt; if (dw in offCount) offCount[dw]++; } }));
    const want = { Tue: 2, Wed: 3, Thu: 4 };
    list.filter(s => !off[s.name] && want[s.offPref]).forEach(s => {
      const dow = want[s.offPref]; if (isStore && offCount[dow] >= Math.ceil(list.length / 3)) return;
      off[s.name] = days[dow === 2 ? 1 : dow === 3 ? 2 : 3]; offCount[dow]++;
    });
    const order = [2, 3, 4], rot = wkNo % 3; const seq = order.slice(rot).concat(order.slice(0, rot));
    list.filter(s => !off[s.name]).forEach((s, i) => {
      const dow = seq.slice().sort((a, b) => offCount[a] - offCount[b] || seq.indexOf(a) - seq.indexOf(b))[0];
      off[s.name] = days[dow - 1]; offCount[dow]++;
    });
    // 2) base shift for the week (alternates every week so evenings are shared fairly)
    const base = {};
    list.forEach((s, i) => { base[s.name] = s.pref === 'Morning only' ? 'M' : s.pref === 'Evening only' ? 'E' : (!isStore ? 'M' : ((i + wkNo) % 2 ? 'E' : 'M')); });
    // 3) fill the days and repair coverage (a store needs someone on Morning AND Evening every day)
    days.forEach(dt => {
      list.forEach(s => { const k = keep[s.name + '|' + dt]; if (k) cells[s.name + '|' + dt] = k; else put(s, dt, off[s.name] === dt ? 'OFF' : base[s.name]); });
      if (!isStore) return;
      const on = list.filter(s => ['M', 'E'].indexOf(cells[s.name + '|' + dt].shift) >= 0 && (!cells[s.name + '|' + dt].loc || cells[s.name + '|' + dt].loc === loc));
      ['M', 'E'].forEach(code => {
        if (on.length < 2 || on.some(s => cells[s.name + '|' + dt].shift === code)) return;
        const other = code === 'M' ? 'E' : 'M';
        const flip = on.filter(s => !keep[s.name + '|' + dt] && cells[s.name + '|' + dt].shift === other && s.pref === 'Rotate')[0];
        if (flip) put(flip, dt, code);
      });
    });
  });
  const shown = staffAll_().filter(s => tracked_(s) && (inScope_(me, s.loc) || !s.loc));
  return { week: week, cells: cells, warnings: rotaWarnings_(week, shown, cells) };
}
function rotaWarnings_(week, staff, cells) {
  const w = [], days = [0, 1, 2, 3, 4, 5, 6].map(i => addDays_(week, i)), locType = {};
  locs_(true).forEach(l => locType[l.name] = l.type);
  staff.forEach(s => {
    const mine = days.map(dt => cells[s.name + '|' + dt]).filter(Boolean);
    if (!mine.length) return;
    const offs = days.filter(dt => (cells[s.name + '|' + dt] || {}).shift === 'OFF');
    if (offs.length === 0 && mine.length === 7 && !mine.some(c => ['LP', 'LU', 'HOL'].indexOf(c.shift) >= 0)) w.push(s.name + ': no weekly off this week.');
    if (offs.length > 1) w.push(s.name + ': ' + offs.length + ' weekly offs (only one allowed).');
    offs.forEach(dt => { if (offDaysFor_(week).indexOf(parse_(dt).getDay()) < 0) w.push(s.name + ': weekly off on ' + DAY_NAMES[parse_(dt).getDay()] + ' – offs are only Tue, Wed or Thu.'); });
  });
  STORES.concat(locs_(false).filter(l => l.type === 'Store' && STORES.indexOf(l.name) < 0).map(l => l.name)).forEach(loc => {
    const here = staff.filter(s => s.loc === loc);
    if (!here.length) return;
    days.forEach(dt => {
      const on = Object.keys(cells).filter(k => k.split('|')[1] === dt && (cells[k].loc || '') === loc).map(k => cells[k].shift);
      if (!on.length) return;
      ['M', 'E'].forEach(code => { if (on.indexOf(code) < 0 && on.indexOf('CUST') < 0) w.push(loc + ' ' + DAY_NAMES[parse_(dt).getDay()] + ' ' + dt.slice(8) + ': nobody on the ' + SHIFT_LABEL[code].toLowerCase() + ' shift.'); });
    });
  });
  return w;
}
/** d = {week, cells:{name|date:{shift,start,end,loc,note}}, publish:true|false} – replaces that week's rows for the people sent. */
function rotaSave_(d, me) {
  const week = monday_(d.week), end = addDays_(week, 6), now = new Date();
  const status = d.publish ? 'Published' : 'Draft';
  const names = {};
  const out = [];
  Object.keys(d.cells || {}).forEach(k => {
    const [name, date] = k.split('|'), c = d.cells[k];
    if (date < week || date > end || SHIFT_CODES.indexOf(c.shift) < 0) return;
    const s = staffByName_(name); if (!s) return;
    if (!inScope_(me, s.loc) && !inScope_(me, c.loc)) throw new Error('You can only plan your own store (' + name + ').');
    let start = '', fin = '';
    if (c.shift === 'M' || c.shift === 'E') { const t = shiftTimes_(c.shift); start = t.start; fin = t.end; }
    if (c.shift === 'CUST') {
      start = hm_(c.start); fin = hm_(c.end);
      if (!/^\d{2}:\d{2}$/.test(start) || !/^\d{2}:\d{2}$/.test(fin) || fin === start) throw new Error(name + ' ' + date + ': custom shift needs start and end times.');
    }
    if (c.shift === 'OFF' && offDaysFor_(week).indexOf(parse_(date).getDay()) < 0)
      throw new Error(name + ': weekly off can only be on ' + offDaysTxt_(week) + ' (' + date + ' is a ' + DAY_NAMES[parse_(date).getDay()] + '). The owner can allow other days for one week: Rota plan → Off days.');
    names[norm_(name)] = 1;
    out.push([week, date, DAY_NAMES[parse_(date).getDay()], s.name, txt_(c.loc, 60) || s.loc, c.shift, start, fin, status, txt_(c.note, 120), me.name, now]);
  });
  lock_(() => {
    const sh = tab_('rota'), all = rows_('rota');
    const keep = all.filter(r => !(ymd_(r[0]) === week && names[norm_(r[3])]));
    if (keep.length !== all.length) {
      sh.getRange(2, 1, Math.max(all.length, 1), T.rota[1].length).clearContent();
      if (keep.length) sh.getRange(2, 1, keep.length, T.rota[1].length).setValues(keep.map(r => r.map((v, i) => (i === 0 || i === 1) ? ymd_(v) : (i === 6 || i === 7) ? hm_(v) : v)));
    }
    append_('rota', out); dirty_('rota');
  });
  log_('Rota ' + week + ' ' + status + ' (' + out.length + ' cells)', me.name);
  return rotaGet_({ week: week }, me);
}
function myRota_(me) {
  const w1 = monday_(today_()), w2 = addDays_(w1, 7), end = addDays_(w2, 6);
  const rows = rotaRows_(w1, end).filter(x => norm_(x.name) === norm_(me.name) && x.status === 'Published');
  return [w1, w2].map(w => ({ week: w, days: [0, 1, 2, 3, 4, 5, 6].map(i => { const dt = addDays_(w, i), r = rows.find(x => x.date === dt);
    return { date: dt, shift: r ? r.shift : '', label: r ? SHIFT_LABEL[r.shift] : 'Not planned', start: r ? r.start : '', end: r ? r.end : '', loc: r ? r.loc : '', note: r ? r.note : '' }; }) }));
}

// ───────────────────────────── punches (clock in / break / clock out) ─────────────────────────────
const P_TYPES = { IN: 'Clock in', BO: 'Break out', BI: 'Back from break', OUT: 'Clock out' };
// Shifts can run past midnight (event stalls). Until 8:00 am, a break / clock-out joins the previous day's shift if it is still open.
const NIGHT_CUTOFF = 480;
/** Minutes from the start of the working date (a time after midnight gives 1440+). */
function minsOn_(date, d) { const dd = Math.round((parse_(ymd_(d)) - parse_(date)) / 864e5); return dd * 1440 + mins_(d); }
/** Shift end in minutes; an end at or before the start means the next day. */
function endMin_(start, end) { const a = toMin_(start), b = toMin_(end); return b <= a ? b + 1440 : b; }
function openState_(ps) { const st = stateOf_(ps); return st === 'IN' || st === 'BREAK'; }
/** The working date a punch belongs to. */
function workDate_(name, type, now) {
  const today = today_(), ps = punchesOn_(today, name);
  if (type === 'IN' || ps.length || mins_(now) >= NIGHT_CUTOFF) return { date: today, ps: ps };
  const y = addDays_(today, -1), py = punchesOn_(y, name);
  return openState_(py) ? { date: y, ps: py } : { date: today, ps: ps };
}
/** The day the staff app should show: yesterday's shift while it is still open after midnight. */
function curDate_(name) {
  const today = today_();
  if (mins_(new Date()) >= NIGHT_CUTOFF || punchesOn_(today, name).length) return today;
  const y = addDays_(today, -1), py = punchesOn_(y, name), last = py[py.length - 1];
  return openState_(py) || (last && ymd_(last.time) === today) ? y : today;   // keep showing last night's shift until 8 am
}
/** Email the managers when a clock-in is early (rota start − N min or earlier). Approve = paid from that time. */
function mailEarly_(name, date, now, where, ro, early) {
  try {
    const to = String(setv_('Approval email') || setv_('Summary email') || '').trim(); if (!to) return;
    MailApp.sendEmail(to, 'Approve early start: ' + name + ' ' + hmOf_(now) + (where ? ' – ' + where : ''),
      name + ' clocked in at ' + hmOf_(now) + (where ? ' at ' + where : '') + ' on ' + date + '.\n' +
      'Rota shift starts ' + ro.start + ' – ' + early + ' min early.\n\n' +
      'Approve only if a manager called them in early. Approve = paid from ' + hmOf_(now) + '. Not approved = paid only from ' + ro.start + ' (normal shift).\n' +
      'Any manager with the approve right can decide: open the app → Team → Date range (or the red badge): https://vermakshat.com/rota/');
  } catch (e) { log_('Early approval email failed: ' + e, name); }
}
/** Email the managers when a clock-out needs approval (late by N min+, event stalls, after midnight). */
function mailApproval_(name, date, now, where, ro, why) {
  try {
    const to = String(setv_('Approval email') || setv_('Summary email') || '').trim(); if (!to) return;
    const end = ro && ro.start ? ro.end : '';
    const over = ro && ro.start ? minsOn_(date, now) - endMin_(ro.start, ro.end) : 0;
    MailApp.sendEmail(to, 'Approve clock-out: ' + name + ' ' + hmOf_(now) + (where ? ' – ' + where : ''),
      name + ' clocked out at ' + hmOf_(now) + (date !== today_() ? ' (after midnight, shift of ' + date + ')' : '') + (where ? ' at ' + where : '') + '.\n' +
      (end ? 'Rota shift ends ' + end + (over > 0 ? ' – ' + over + ' min later than the rota.' : '.') + '\n' : '') + why + '\n\n' +
      'Approve only if a manager asked them to stay late. Approve = paid until ' + hmOf_(now) + '. Not approved = paid only until the rota end time (normal shift).\n' +
      'Open the app → Team → Date range (or the red badge): https://vermakshat.com/rota/');
  } catch (e) { log_('Approval email failed: ' + e, name); }
}
function punchesOn_(date, name) {
  return rows_('punch').map((r, i) => ({ row: i + 2, id: s_(r[0]), date: ymd_(r[1]), name: s_(r[2]), type: s_(r[3]), time: r[4] instanceof Date ? r[4] : new Date(r[4]),
    loc: s_(r[5]), dist: r[6] === '' ? null : n_(r[6]), inside: s_(r[7]), lat: r[8] === '' ? null : n_(r[8]), lng: r[9] === '' ? null : n_(r[9]), acc: n_(r[10]),
    selfie: s_(r[11]), phone: s_(r[12]), flags: s_(r[13]), reason: s_(r[14]), approved: s_(r[15]), approvedBy: s_(r[16]) }))
    .filter(p => p.name && (!date || p.date === date) && (!name || norm_(p.name) === norm_(name)))
    .sort((a, b) => a.time - b.time);
}
function stateOf_(ps) {
  const last = ps[ps.length - 1];
  if (!last) return 'OUT_NONE';
  return { IN: 'IN', BI: 'IN', BO: 'BREAK', OUT: 'OUT' }[last.type] || 'OUT';
}
/** d = {type, lat, lng, acc, selfie (base64 jpeg), phone, reason, at:'store name' (optional pick)} */
function punch_(d, me) {
  ensureSetup_();
  const s = myStaff_(me);
  if (!s) throw new Error('The owner does not clock in.');
  if (!s.active) throw new Error('You are not on the active staff list – ask head office.');
  if (!s.onRota) throw new Error('You are not on the staff rota, so you do not clock in here.');
  const type = String(d.type || '');
  if (!P_TYPES[type]) throw new Error('Unknown action.');
  const now = new Date();
  return lock_(() => {
    const wd = workDate_(s.name, type, now), date = wd.date, ps = wd.ps, st = stateOf_(ps);
    const allowed = { OUT_NONE: ['IN'], OUT: ['IN'], IN: ['BO', 'OUT'], BREAK: ['BI', 'OUT'] }[st];
    if (allowed.indexOf(type) < 0) {
      const msg = { IN: 'You are already clocked in.', BO: st === 'BREAK' ? 'You are already on a break.' : 'Clock in first.', BI: 'You are not on a break.', OUT: 'You are not clocked in.' };
      throw new Error(msg[type]);
    }
    if (ps.length && now - ps[ps.length - 1].time < 60000) throw new Error('Just recorded – wait a minute before the next entry.');
    const flags = [];
    // location
    const lat = d.lat == null || d.lat === '' ? null : Number(d.lat), lng = d.lng == null || d.lng === '' ? null : Number(d.lng), acc = Number(d.acc) || 9999;
    if (lat == null || !isFinite(lat) || !isFinite(lng)) throw new Error('Location is off. Turn on Location (GPS) for this app and try again.');
    if (acc > setn_('Max GPS error (m)', 250)) throw new Error('GPS is not precise yet (±' + Math.round(acc) + ' m). Wait a few seconds near the store entrance and try again.');
    const ro = rotaFor_(s.name, date);
    // working at an event stall today? (rota says so, or the day's clock-in was at an event)
    const inEvt = ps.find(p => p.type === 'IN' && isEvent_(p.loc));
    const evt = ro && isEvent_(ro.loc) ? locOf_(ro.loc) : inEvt ? locOf_(inEvt.loc) : null;
    let near = nearest_(lat, lng, date), inside;
    if (evt && evt.lat == null) { near = { name: evt.name, dist: null, radius: evt.radius }; inside = true; if (type === 'IN') flags.push('Event stall (no position set)'); }
    else if (evt) { const dist = haversine_(lat, lng, evt.lat, evt.lng); near = { name: evt.name, dist: dist, radius: evt.radius }; inside = dist <= evt.radius + Math.min(acc, 100); }
    else inside = near && near.dist <= near.radius + Math.min(acc, 100);
    const onTrip = !!runningTrip_(s.name);
    let approved = 'Yes', reason = txt_(d.reason, 200);
    if (!inside) {
      if (setv_('Outside location') === 'Block' && !onTrip) throw new Error('You are ' + distTxt_(near) + ' – clock in only at your store.');
      if (!onTrip && !reason) return { needReason: true, near: near ? { name: near.name, dist: Math.round(near.dist) } : null };
      flags.push(onTrip ? 'On a trip' : 'Outside store (' + distTxt_(near) + ')');
      if (!onTrip) approved = 'Pending';
    } else if (s.loc && near.name !== s.loc && type === 'IN' && !evt) flags.push('At ' + near.name + ' (home: ' + s.loc + ')');
    // a clock-out at an event stall, or after midnight, waits for the owner's approval
    const thr = setn_('Approval needed after (min)', 30);
    const overEnd = type === 'OUT' && ro && ro.start && ['OFF', 'LP', 'LU', 'HOL'].indexOf(ro.shift) < 0 ? minsOn_(date, now) - endMin_(ro.start, ro.end) : 0;
    const late = type === 'OUT' && (evt || date !== today_() || (thr > 0 && overEnd >= thr));
    if (late) { approved = 'Pending'; flags.push(evt ? 'Event clock-out – needs approval' : date !== today_() ? 'Clock-out after midnight – needs approval' : 'Late clock-out ' + overEnd + ' min after rota end – needs approval'); }
    // a clock-in N min or more before the rota start waits for a manager (not approved = paid from the rota start)
    const earlyBy = type === 'IN' && ro && ro.start && ['OFF', 'LP', 'LU', 'HOL'].indexOf(ro.shift) < 0 && st !== 'OUT' ? toMin_(ro.start) - minsOn_(date, now) : 0;
    const early = thr > 0 && earlyBy >= thr;
    if (early) { if (approved === 'Yes') approved = 'Pending'; flags.push('Early clock-in ' + earlyBy + ' min – needs approval'); }
    // phone
    const phone = txt_(d.phone, 64), rule = setv_('One phone per person');
    if (rule !== 'Off' && phone) {
      if (!s.phone) w_('staff').getRange(s.row, C.staff['Phone ID'] + 1, 1, 2).setValues([[phone, new Date()]]);
      else if (s.phone !== phone) { if (rule === 'Block') throw new Error('This is not your registered phone. Ask head office to reset your phone.'); flags.push('Different phone'); }
    }
    // selfie
    let selfie = '';
    if (d.selfie) selfie = savePhoto_(d.selfie, date + '_' + s.name + '_' + type + '_' + Utilities.formatDate(now, tz_(), 'HHmmss') + '.jpg', 'Selfies');
    else if (setv_('Selfie required') === 'Yes') throw new Error('Take the selfie first.');
    // timing notes
    if (type === 'IN') {
      if (!ro) flags.push('Not on the rota');
      else if (['OFF', 'LP', 'LU', 'HOL'].indexOf(ro.shift) >= 0) flags.push('Working on ' + SHIFT_LABEL[ro.shift].toLowerCase());
      else if (ro.start) { const late = mins_(now) - toMin_(ro.start); if (late > setn_('Late grace (min)', 5)) flags.push('Late ' + late + ' min'); }
      if (st === 'OUT') flags.push('Second clock-in today');
    }
    const id = 'P' + Utilities.formatDate(now, tz_(), 'yyMMddHHmmss') + Math.floor(Math.random() * 90 + 10);
    append_('punch', [[id, date, s.name, type, now, near ? near.name : '', near && near.dist != null ? Math.round(near.dist) : '', inside ? 'Yes' : 'No', lat, lng, Math.round(acc),
      selfie, phone, flags.join('; '), reason, approved, '', now]]);
    if (late) mailApproval_(s.name, date, now, evt ? evt.name : (near ? near.name : ''), ro, evt ? 'Event clock-out.' : date !== today_() ? 'Clock-out after midnight.' : 'Stayed ' + overEnd + ' min after the rota end.');
    if (early) mailEarly_(s.name, date, now, near ? near.name : '', ro, earlyBy);
    return Object.assign(myDay_(me), { saved: { type: type, label: P_TYPES[type], time: hmOf_(now), loc: near ? near.name : '', inside: inside, flags: flags } });
  });
}
function nearest_(lat, lng, date) {
  let best = null;
  locs_(false).filter(l => l.lat != null && l.lng != null && eventOn_(l, date || today_())).forEach(l => {
    const dist = haversine_(lat, lng, l.lat, l.lng);
    if (!best || dist < best.dist) best = { name: l.name, dist: dist, radius: l.radius };
  });
  return best;
}
function distTxt_(near) { return near ? (near.dist >= 1000 ? (near.dist / 1000).toFixed(1) + ' km' : Math.round(near.dist) + ' m') + ' from ' + near.name : 'away from every store'; }
function myDay_(me) {
  const s = staffByName_(me.name);
  if (!s) return { date: today_(), state: 'OUT_NONE', punches: [], shift: null };
  const date = curDate_(s.name);
  const ps = punchesOn_(date, s.name), ro = rotaFor_(s.name, date);
  const calc = dayCalc_(date, s, ro, ps, null, true);
  return { date: date, now: new Date().toISOString(), state: stateOf_(ps), shift: ro ? { code: ro.shift, label: SHIFT_LABEL[ro.shift], start: ro.start, end: ro.end, loc: ro.loc, event: isEvent_(ro.loc) } : null,
    punches: ps.map(p => ({ type: p.type, label: P_TYPES[p.type], time: hmOf_(p.time), loc: p.loc, inside: p.inside === 'Yes', flags: p.flags, approved: p.approved })),
    calc: calc, trip: tripPub_(runningTrip_(s.name)) };
}

// ───────────────────────────── day calculation ─────────────────────────────
/** Works out one day for one person. ro = published rota entry (or null), ps = punches, fx = correction row (or null).
 *  live = true while the day is still running (open entries count up to "now"). */
function dayCalc_(date, s, ro, ps, fx, live) {
  const shift = fx && fx.status ? fx.status : (ro ? ro.shift : '');
  const t = ro && ro.start ? { start: ro.start, end: ro.end } : (shift === 'M' || shift === 'E' ? shiftTimes_(shift) : shiftTimes_(s && s.pref === 'Evening only' ? 'E' : 'M'));
  const out = { date: date, shift: shift || '', label: shift ? SHIFT_LABEL[shift] : 'Not on rota', start: t.start, end: t.end, in: '', out: '', breakMin: 0, extraBreak: 0,
    late: 0, early: 0, worked: 0, credited: 0, ot: 0, otApproved: fx ? n_(fx.ot) : 0, credit: 0, status: '', flags: [] };
  const startOn = setv_('Attendance starts on');
  if (startOn && date < startOn) { out.status = 'Before app'; out.credit = 1; return out; }
  if (s && s.joined && date < s.joined) { out.status = 'Not joined'; return out; }
  const isEarly = p => p.type === 'IN' && /Early clock-in/.test(p.flags || '');
  const earlyIn = ps.find(isEarly) || null;
  // an early clock-in still counts as present; until approved the day is paid only from the rota start
  const valid = ps.filter(p => (p.approved !== 'Pending' && p.approved !== 'No') || (isEarly(p) && p.inside === 'Yes'));
  if (earlyIn && earlyIn.approved !== 'Yes') out.flags.push('Early clock-in ' + hmOf_(earlyIn.time) + (earlyIn.approved === 'Pending' ? ' waiting for approval' : ' not approved') + ' – paid from rota start');
  // a clock-out waiting for approval (or not approved) counts only up to the rota end time
  const heldOut = ps.filter(p => p.type === 'OUT' && (p.approved === 'Pending' || p.approved === 'No')).pop() || null;
  if (ps.some(p => p.approved === 'Pending' && p !== heldOut && !(isEarly(p) && p.inside === 'Yes'))) out.flags.push('Entry away from the store waiting for approval');
  if (heldOut) out.flags.push('Clock-out ' + hmOf_(heldOut.time) + (heldOut.approved === 'Pending' ? ' waiting for approval' : ' not approved') + ' – counted to rota end');
  ps.forEach(p => { if (p.flags && /Different phone/.test(p.flags)) out.flags.push('Different phone'); });
  const sS = toMin_(t.start), sE = endMin_(t.start, t.end);
  // times: from corrections, else from punches (minutes from the start of the working date; after midnight = 1440+)
  const nowRel = minsOn_(date, new Date());
  let inMin = null, outMin = null, breakMin = 0, openBreak = false, open = false;
  if (fx && fx.in) inMin = toMin_(fx.in);
  if (fx && fx.out) outMin = toMin_(fx.out);
  let bo = null;
  if (inMin == null || outMin == null || !(fx && fx.brk !== '' && fx.brk != null)) {
    let curIn = null, firstIn = null, lastOut = null;
    valid.forEach(p => {
      const m = minsOn_(date, p.time);
      if (p.type === 'IN') { if (firstIn == null) firstIn = m; curIn = m; }
      if (p.type === 'BO') bo = m;
      if (p.type === 'BI' && bo != null) { breakMin += m - bo; bo = null; }
      if (p.type === 'OUT') { if (bo != null) { breakMin += m - bo; bo = null; } lastOut = m; curIn = null; }
    });
    if (inMin == null) inMin = firstIn;
    open = curIn != null || (firstIn != null && lastOut == null);
    if (outMin == null && !open) outMin = lastOut;
  }
  if (inMin != null && outMin != null && fx && fx.out && outMin <= inMin) outMin += 1440;      // corrected clock-out after midnight
  const liveNow = live && nowRel >= 0 && nowRel < 1440 + (open ? NIGHT_CUTOFF : 0);
  if (outMin == null && inMin != null) {
    if (heldOut) outMin = Math.max(inMin, Math.min(minsOn_(date, heldOut.time), sE));
    else if (liveNow) outMin = nowRel;
    else { outMin = Math.max(sE, inMin); out.flags.push('No clock-out (counted to rota end)'); }
  }
  if (bo != null) { openBreak = true; breakMin += Math.max(0, (heldOut || !liveNow ? outMin : nowRel) - bo); }
  if (fx && fx.brk !== '' && fx.brk != null) breakMin = n_(fx.brk);
  if (openBreak && !liveNow) out.flags.push('Break not closed');
  const nonWork = ['OFF', 'LP', 'LU', 'HOL'].indexOf(shift) >= 0;
  if (inMin == null) {
    const todayLive = live && nowRel >= 0 && nowRel < 1440;
    out.status = nonWork ? SHIFT_LABEL[shift] : (todayLive ? (nowRel < sS ? 'Not started' : 'Not in yet') : 'Absent');
    out.credit = shift === 'OFF' || shift === 'LP' || shift === 'HOL' ? 1 : 0;
    if (!shift && !todayLive) out.status = 'No shift';
    if (!shift) out.credit = 0;
    return out;
  }
  out.in = minTxt_(inMin); out.out = outMin != null ? minTxt_(outMin) : '';
  const shiftLen = sE - sS, allow = setn_('Break allowed (min per shift)', 30), grace = setn_('Late grace (min)', 5);
  out.breakMin = Math.round(breakMin); out.extraBreak = Math.max(0, out.breakMin - allow - (fx ? n_(fx.brkPaid) : 0));
  if (fx && fx.brkPaid && out.breakMin > allow) out.flags.push('Extra break paid ' + Math.min(n_(fx.brkPaid), out.breakMin - allow) + ' min');
  out.worked = Math.max(0, outMin - inMin - out.breakMin);
  const late = Math.max(0, inMin - sS), excused = !!(fx && fx.lateOk); out.late = late > grace && !excused ? late : 0;
  if (excused && late > grace) out.flags.push('Late ' + late + ' min – excused');
  out.early = Math.max(0, sE - outMin);
  const effIn = late <= grace || excused ? Math.min(inMin, sS) : inMin;
  const inside = Math.max(0, Math.min(outMin, sE) - Math.max(effIn, sS));
  out.credited = Math.max(0, inside - out.extraBreak);
  const before = setv_('Count early arrival as overtime') === 'Yes' || (earlyIn && earlyIn.approved === 'Yes') ? Math.max(0, sS - inMin) : 0;
  out.ot = Math.max(0, outMin - sE) + before;
  if (nonWork) {
    out.status = 'Worked on ' + SHIFT_LABEL[shift].toLowerCase();
    out.credit = shift === 'LU' ? 0 : 1;                        // the off / leave itself stays paid as before
    out.extraDay = setv_('Pay work on weekly off') === 'Yes' ? round2_(Math.min(1, out.worked / Math.max(1, shiftLen - allow))) : 0;
    out.flags.push('Worked on ' + SHIFT_LABEL[shift].toLowerCase());
    return out;
  }
  out.credit = round2_(Math.min(1, out.credited / shiftLen));
  if (!shift) out.flags.push('Not on the rota');
  if (heldOut && heldOut.approved === 'Pending') out.status = 'Clock-out to approve';
  else if (earlyIn && earlyIn.approved === 'Pending' && !(liveNow && open)) out.status = 'Early start to approve';
  else if (liveNow && open) out.status = openBreak ? 'On break' : 'Working';
  else if (liveNow && !open && outMin < sE && valid.length && valid[valid.length - 1].type === 'OUT') out.status = 'Left';
  else out.status = out.credit >= 0.99 ? 'Present' : out.late && out.credit >= 0.5 ? 'Late' : out.credit >= 0.5 ? 'Short hours' : 'Half day or less';
  if (out.late) out.flags.push('Late ' + out.late + ' min');
  if (out.extraBreak) out.flags.push('Extra break ' + out.extraBreak + ' min');
  return out;
}
function fixRows_(from, to) {
  return rows_('fix').map((r, i) => ({ row: i + 2, date: ymd_(r[0]), name: s_(r[1]), status: s_(r[2]), in: hm_(r[3]), out: hm_(r[4]), brk: r[5] === '' ? '' : n_(r[5]),
    ot: n_(r[6]), note: s_(r[7]), by: s_(r[8]), lateOk: s_(r[10]) === 'Yes', brkPaid: n_(r[11]) })).filter(x => x.name && x.date >= from && x.date <= to);
}
/** Days for many people over a date range – shared by Attendance, Payroll, the board and the nightly email. */
function daysFor_(names, from, to, live) {
  const rota = rotaRows_(from, to).filter(x => x.status === 'Published'), fixes = fixRows_(from, to), punches = rows_('punch').length ? punchesOn_(null, null).filter(p => p.date >= from && p.date <= to) : [];
  const staff = {}; staffAll_().forEach(s => staff[norm_(s.name)] = s);
  const out = [];
  names.forEach(name => {
    const s = staff[norm_(name)];
    for (let dt = from; dt <= to; dt = addDays_(dt, 1)) {
      const ro = rota.find(x => x.date === dt && norm_(x.name) === norm_(name)) || null;
      const ps = punches.filter(p => p.date === dt && norm_(p.name) === norm_(name));
      const fx = fixes.filter(x => x.date === dt && norm_(x.name) === norm_(name)).pop() || null;
      const c = dayCalc_(dt, s, ro, ps, fx, live);
      c.name = s ? s.name : name; c.loc = (ro && ro.loc) || (s && s.loc) || ''; c.fixed = fx ? (fx.note || 'Corrected') + ' – ' + fx.by : '';
      c.lateOk = !!(fx && fx.lateOk); c.brkPaid = fx ? n_(fx.brkPaid) : 0; c.fixIn = fx ? fx.in : ''; c.fixOut = fx ? fx.out : ''; c.fixBrk = fx ? fx.brk : ''; c.fixStatus = fx ? fx.status : '';
      c.punches = ps.map(p => ({ id: p.id, type: p.type, time: hmOf_(p.time), loc: p.loc, dist: p.dist, inside: p.inside === 'Yes', acc: p.acc, selfie: p.selfie ? 1 : 0,
        flags: p.flags, reason: p.reason, approved: p.approved, lat: p.lat, lng: p.lng }));
      out.push(c);
    }
  });
  return out;
}
function myMonth_(d, me) {
  const s = staffByName_(me.name); if (!s) return { days: [] };
  const m = /^\d{4}-\d{2}$/.test(d.month || '') ? d.month : today_().slice(0, 7);
  const from = m + '-01', last = ymd_(new Date(Number(m.slice(0, 4)), Number(m.slice(5)), 0)), to = last < today_() ? last : today_();
  const days = daysFor_([s.name], from, to, true);
  const pay = payFor_(s, m, days, tripsFor_(s.name, 400).filter(t => t.date.slice(0, 7) === m));
  return { month: m, days: days.reverse().map(x => { delete x.punches; return x; }), totals: pay, showPay: !!s.salary };
}

// ───────────────────────────── manager: today board, attendance, corrections ─────────────────────────────
function board_(d, me) {
  const date = /^\d{4}-\d{2}-\d{2}$/.test(d.date || '') ? d.date : today_();
  const staff = staffAll_().filter(s => tracked_(s) && (inScope_(me, s.loc) || !s.loc));
  const days = daysFor_(staff.map(s => s.name), date, date, true);
  const trips = rows_('trips').filter(r => s_(r[5]) === 'Running').map(r => s_(r[2]));
  const pendingTrips = rows_('trips').filter(r => s_(r[5]) === 'Submitted' && staff.some(s => norm_(s.name) === norm_(r[2]))).length;
  const pendingPunch = punchesOn_(null, null).filter(p => p.approved === 'Pending' && staff.some(s => norm_(s.name) === norm_(p.name))).length;
  return { date: date, now: new Date().toISOString(), people: days.map(x => Object.assign(x, { onTrip: trips.some(n => norm_(n) === norm_(x.name)) })),
    pendingTrips: pendingTrips, pendingPunch: pendingPunch, locations: locs_(false).map(l => l.name) };
}
function attendance_(d, me) {
  const from = /^\d{4}-\d{2}-\d{2}$/.test(d.from || '') ? d.from : addDays_(today_(), -6), to = /^\d{4}-\d{2}-\d{2}$/.test(d.to || '') ? d.to : today_();
  if (parse_(to) - parse_(from) > 62 * 864e5) throw new Error('Pick at most 2 months.');
  const staff = staffAll_().filter(s => s.onRota && (inScope_(me, s.loc) || !s.loc) && (!d.name || norm_(s.name) === norm_(d.name)) && (s.active || d.name));
  const days = daysFor_(staff.map(s => s.name), from, to, true);
  return { from: from, to: to, days: days, pending: pendingList_(staff), names: staff.map(s => s.name) };
}
/** Entries waiting for approval for these people (cheap: no attendance maths). */
function pendingList_(staff) {
  return punchesOn_(null, null).filter(p => p.approved === 'Pending' && staff.some(s => norm_(s.name) === norm_(p.name)))
    .map(p => { const ro = rotaFor_(p.name, p.date), over = ro && ro.start && p.type === 'OUT' ? minsOn_(p.date, p.time) - endMin_(ro.start, ro.end) : 0;
      return { id: p.id, date: p.date, name: p.name, type: p.type, label: P_TYPES[p.type], time: hmOf_(p.time) + (p.date !== ymd_(p.time) ? ' (+1)' : ''), loc: p.loc, dist: p.dist,
        reason: p.reason, flags: p.flags, lat: p.lat, lng: p.lng, selfie: p.selfie ? 1 : 0, lateOut: p.type === 'OUT', shiftEnd: ro && ro.start ? ro.end : '', over: over,
        earlyIn: p.type === 'IN' && /Early clock-in/.test(p.flags || ''), shiftStart: ro && ro.start ? ro.start : '', early: ro && ro.start && p.type === 'IN' ? toMin_(ro.start) - minsOn_(p.date, p.time) : 0 }; });
}
/** Just the approval list – shown at once, before the slower attendance. */
function pending_(d, me) {
  const staff = staffAll_().filter(s => s.onRota && (inScope_(me, s.loc) || !s.loc));
  return { pending: pendingList_(staff) };
}
/** Corrects a day: d = {date, name, status ('' = as per rota), in, out, brk, ot, lateOk, brkPaid, note}.
 *  status / in / out / break need the "times" right; overtime, excused late and paid extra break need "payAdj". The rest of the row is kept. */
function fixDay_(d, me) {
  const s = staffByName_(d.name); if (!s) throw new Error('Person not found.');
  if (!inScope_(me, s.loc) && s.loc) throw new Error('Not your store.');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(d.date || '')) throw new Error('Pick the date.');
  if (d.status && SHIFT_CODES.indexOf(d.status) < 0) throw new Error('Unknown status.');
  ['in', 'out'].forEach(k => { if (d[k] && !/^\d{1,2}:\d{2}$/.test(d[k])) throw new Error('Time like 10:05'); });
  if (!txt_(d.note, 200)) throw new Error('Write why you are correcting this day.');
  // v9 (13 Nov 2026, owner): an EARLIER day's times can be changed only by the owner, or by someone with the "pastTimes" right for staff;
  // a manager's earlier days only by the owner; always with a genuine reason.
  const past = d.date < today_();
  if (past && !d.clear) {
    const why = txt_(d.note, 200);
    if (why.length < 15 || why.split(/\s+/).filter(Boolean).length < 3 || /^(ok|okay|correct(ion)?|changed?|update[d]?|edit(ed)?|fix(ed)?|test|as per (owner|manager)|na|n\/a|-)\.?$/i.test(why))
      throw new Error('Earlier day: write the genuine reason in full (at least 15 letters), e.g. "Forgot to clock out – left at 7 pm, confirmed by the store manager".');
  }
  if (past && !me.owner) {
    if (norm_(s.name) === norm_(me.name)) throw new Error('You cannot change your own earlier days – ask the owner.');
    if (s.role === 'Manager') throw new Error('Only the owner can change a manager\'s earlier days.');
  }
  const canT = past ? (can_(me, 'pastTimes') && (me.owner || s.role !== 'Manager')) : can_(me, 'times'), canP = can_(me, 'payAdj');
  lock_(() => {
    const sh = tab_('fix'), all = rows_('fix'), i = all.findIndex(r => ymd_(r[0]) === d.date && norm_(r[1]) === norm_(s.name));
    const old = i >= 0 ? all[i] : [d.date, s.name, '', '', '', '', 0, '', '', '', '', ''];
    const row = old.slice(); row[0] = d.date; row[1] = s.name;
    const tWant = [d.status || '', d.in ? hm_(d.in) : '', d.out ? hm_(d.out) : '', d.brk === '' || d.brk == null ? '' : n_(d.brk)];
    const tOld = [s_(old[2]), hm_(old[3]), hm_(old[4]), old[5] === '' ? '' : n_(old[5])];
    if (tWant.some((v, k) => String(v) !== String(tOld[k]))) {
      if (!canT) throw new Error('Only the owner (or someone given the right) can change in / out times, breaks or the day status.');
      row[2] = tWant[0]; row[3] = tWant[1]; row[4] = tWant[2]; row[5] = tWant[3];
    }
    const pWant = [n_(d.ot), d.lateOk ? 'Yes' : '', n_(d.brkPaid) || ''], pOld = [n_(old[6]), s_(old[10]) === 'Yes' ? 'Yes' : '', n_(old[11]) || ''];
    if (pWant.some((v, k) => String(v) !== String(pOld[k]))) {
      if (!canP) throw new Error('Only the owner (or someone given the right) can approve overtime, excuse late or pay extra break.');
      row[6] = pWant[0]; row[10] = pWant[1]; row[11] = pWant[2];
    }
    row[7] = txt_(d.note, 200); row[8] = me.name; row[9] = new Date();
    if (d.clear) { if (!canT || !canP) throw new Error('Only the owner can remove a correction.'); if (i >= 0) sh.deleteRow(i + 2); }
    else if (i >= 0) sh.getRange(i + 2, 1, 1, row.length).setValues([row]); else append_('fix', [row]);
    dirty_('fix');
  });
  log_('Day corrected ' + d.date + ' ' + s.name + (d.clear ? ' (cleared)' : '') + (d.in || d.out || d.status ? ' – ' + [d.status, d.in && 'in ' + d.in, d.out && 'out ' + d.out].filter(Boolean).join(', ') : '') + ' – reason: ' + txt_(d.note, 200), me.name);
  return { day: daysFor_([s.name], d.date, d.date, true)[0] };
}
function approvePunch_(d, me) {
  const sh = tab_('punch'), ps = punchesOn_(null, null), p = ps.find(x => x.id === d.id);
  if (!p) throw new Error('Entry not found.');
  const s = staffByName_(p.name); if (s && s.loc && !inScope_(me, s.loc)) throw new Error('Not your store.');
  if (norm_(p.name) === norm_(me.name) && !me.owner) throw new Error('Someone else must approve your own entry.');
  if (p.approved !== 'Pending' && !me.owner) throw new Error('Already decided.');
  sh.getRange(p.row, C.punch['Approved'] + 1, 1, 2).setValues([[d.approve ? 'Yes' : 'No', me.name]]); dirty_('punch');
  // approving a late clock-out = paying until that time: the minutes after the rota end are approved as overtime for that day
  if (d.approve && p.type === 'OUT' && d.payLate !== false) lock_(() => {
    const day = daysFor_([p.name], p.date, p.date, false)[0];
    if (!day || !(day.ot > 0)) return;
    const fs = tab_('fix'), all = rows_('fix'), i = all.findIndex(r => ymd_(r[0]) === p.date && norm_(r[1]) === norm_(p.name));
    const row = i >= 0 ? all[i].slice() : [p.date, p.name, '', '', '', '', 0, '', '', '', '', ''];
    row[0] = p.date; row[6] = Math.max(n_(row[6]), day.ot);
    row[7] = [s_(row[7]), 'Clock-out ' + hmOf_(p.time) + ' approved – paid till then'].filter(Boolean).join(' · ').slice(0, 200); row[8] = me.name; row[9] = new Date();
    if (i >= 0) fs.getRange(i + 2, 1, 1, row.length).setValues([row]); else append_('fix', [row]);
    dirty_('fix');
  });
  // approving an early clock-in = paying from that time: the minutes before the rota start are added as approved overtime
  if (d.approve && p.type === 'IN' && /Early clock-in/.test(p.flags || '') && p.approved !== 'Yes') lock_(() => {
    const ro = rotaFor_(p.name, p.date); if (!ro || !ro.start) return;
    const before = Math.max(0, toMin_(ro.start) - minsOn_(p.date, p.time)); if (!before) return;
    const fs = tab_('fix'), all = rows_('fix'), i = all.findIndex(r => ymd_(r[0]) === p.date && norm_(r[1]) === norm_(p.name));
    const row = i >= 0 ? all[i].slice() : [p.date, p.name, '', '', '', '', 0, '', '', '', '', ''];
    row[0] = p.date; row[6] = n_(row[6]) + before;
    row[7] = [s_(row[7]), 'Early clock-in ' + hmOf_(p.time) + ' approved – paid from then (' + before + ' min)'].filter(Boolean).join(' · ').slice(0, 200); row[8] = me.name; row[9] = new Date();
    if (i >= 0) fs.getRange(i + 2, 1, 1, row.length).setValues([row]); else append_('fix', [row]);
    dirty_('fix');
  });
  log_((d.approve ? 'Approved ' : 'Not approved ') + P_TYPES[p.type] + ' ' + p.date + ' ' + hmOf_(p.time) + ' ' + p.name, me.name);
  // only the decision is returned (fast); the app updates the list itself. Old app versions that sent from/to still get the full range.
  return d.from ? attendance_({ from: d.from, to: d.to }, me) : { ok: true, id: d.id, approved: d.approve ? 'Yes' : 'No' };
}
/** A selfie or receipt (base64) for managers. */
function photo_(d, me) {
  let id = '';
  if (d.punch) { const p = punchesOn_(null, null).find(x => x.id === d.punch); id = p ? fileId_(p.selfie) : ''; }
  if (d.trip) { const t = rows_('trips').find(r => s_(r[0]) === d.trip); id = t ? fileId_(s_(t[19])) : ''; }
  if (!id) throw new Error('No photo.');
  const b = DriveApp.getFileById(id).getBlob();
  return { mime: b.getContentType(), b64: Utilities.base64Encode(b.getBytes()) };
}

// ───────────────────────────── trips ─────────────────────────────
function tripRows_() {
  return rows_('trips').map((r, i) => ({ row: i + 2, id: s_(r[0]), date: ymd_(r[1]), name: s_(r[2]), purpose: s_(r[3]), mode: s_(r[4]), status: s_(r[5]),
    start: iso_(r[6]), startPlace: s_(r[7]), sLat: r[8] === '' ? null : n_(r[8]), sLng: r[9] === '' ? null : n_(r[9]), end: iso_(r[10]), endPlace: s_(r[11]),
    eLat: r[12] === '' ? null : n_(r[12]), eLng: r[13] === '' ? null : n_(r[13]), straight: n_(r[14]), trail: n_(r[15]), km: n_(r[16]), rate: n_(r[17]),
    fare: n_(r[18]), receipt: s_(r[19]), claimed: n_(r[20]), approved: r[21] === '' ? null : n_(r[21]), by: s_(r[22]), at: iso_(r[23]), note: s_(r[24]),
    mnote: s_(r[25]) })).filter(t => t.id);
}
function tripPub_(t) {
  if (!t) return null;
  const m = TRIP_MODES.find(x => x[0] === t.mode) || TRIP_MODES[TRIP_MODES.length - 1];
  return { id: t.id, date: t.date, name: t.name, purpose: t.purpose, mode: t.mode, modeLabel: m[1], kind: m[2], status: t.status, start: t.start, startPlace: t.startPlace,
    end: t.end, endPlace: t.endPlace, straight: t.straight, trail: t.trail, km: t.km, rate: t.rate, fare: t.fare, receipt: !!t.receipt, claimed: t.claimed,
    approved: t.approved, by: t.by, at: t.at, note: t.note, mnote: t.mnote, sLat: t.sLat, sLng: t.sLng, eLat: t.eLat, eLng: t.eLng };
}
function runningTrip_(name) { return tripRows_().find(t => norm_(t.name) === norm_(name) && t.status === 'Running') || null; }
function tripsFor_(name, days) {
  const since = addDays_(today_(), -(days || 60));
  return tripRows_().filter(t => norm_(t.name) === norm_(name) && t.date >= since).reverse().map(tripPub_);
}
function placeName_(lat, lng) {
  const n = nearest_(lat, lng);
  if (n && n.dist <= n.radius + 100) return n.name;
  try {
    const r = Maps.newGeocoder().setLanguage('en').reverseGeocode(lat, lng);
    const res = r && r.results && r.results[0];
    if (res) return res.formatted_address.replace(/, India$/, '').slice(0, 120);
  } catch (e) { }
  return lat.toFixed(5) + ', ' + lng.toFixed(5);
}
/** d = {purpose, mode, lat, lng, acc} */
function tripStart_(d, me) {
  const s = myStaff_(me); if (!s) throw new Error('The owner does not record trips here.');
  if (!TRIP_MODES.some(m => m[0] === d.mode)) throw new Error('Pick how you are travelling.');
  if (!txt_(d.purpose, 200)) throw new Error('Write where you are going and why.');
  const lat = Number(d.lat), lng = Number(d.lng);
  if (!isFinite(lat) || !isFinite(lng) || d.lat == null) throw new Error('Location is off. Turn on Location (GPS) and try again.');
  return lock_(() => {
    if (runningTrip_(s.name)) throw new Error('You already have a trip running – end it first.');
    const now = new Date(), id = 'TR-' + Utilities.formatDate(now, tz_(), 'yyMMdd-HHmmss');
    const row = new Array(T.trips[1].length).fill('');
    row[0] = id; row[1] = today_(); row[2] = s.name; row[3] = txt_(d.purpose, 200); row[4] = d.mode; row[5] = 'Running'; row[6] = now;
    row[7] = placeName_(lat, lng); row[8] = lat; row[9] = lng;
    append_('trips', [row]);
    return { trip: tripPub_(runningTrip_(s.name)) };
  });
}
/** d = {id, lat, lng, acc, trail:[[lat,lng,t],…], fare, km (own vehicle, optional change), receipt (base64), note} */
function tripEnd_(d, me) {
  const s = myStaff_(me);
  return lock_(() => {
    const t = tripRows_().find(x => x.id === d.id && norm_(x.name) === norm_(s.name));
    if (!t || t.status !== 'Running') throw new Error('This trip is not running.');
    const lat = Number(d.lat), lng = Number(d.lng);
    if (!isFinite(lat) || !isFinite(lng) || d.lat == null) throw new Error('Location is off. Turn on Location (GPS) and try again.');
    const m = TRIP_MODES.find(x => x[0] === t.mode), kind = m ? m[2] : 'fare';
    const straight = round2_(haversine_(t.sLat, t.sLng, lat, lng) / 1000);
    let trail = 0; const pts = (Array.isArray(d.trail) ? d.trail : []).filter(p => Array.isArray(p) && isFinite(p[0]) && isFinite(p[1])).slice(0, 2000);
    const path = [[t.sLat, t.sLng]].concat(pts.map(p => [Number(p[0]), Number(p[1])])).concat([[lat, lng]]);
    for (let i = 1; i < path.length; i++) { const seg = haversine_(path[i - 1][0], path[i - 1][1], path[i][0], path[i][1]); if (seg < 5000) trail += seg; }
    trail = round2_(trail / 1000);
    const est = round2_(Math.max(trail, straight * setn_('Road factor', 1.3)));
    let km = 0, rate = 0, fare = 0, claimed = 0, receipt = '';
    if (kind === 'km') {
      rate = t.mode === 'car' ? setn_('Car rate ₹/km', 10) : setn_('Bike rate ₹/km', 4);
      km = d.km !== '' && d.km != null && n_(d.km) > 0 ? round2_(n_(d.km)) : est;
      claimed = Math.round(km * rate);
    } else if (kind === 'fare') {
      fare = round2_(n_(d.fare));
      if (!(fare > 0)) throw new Error('Type the fare you paid (₹).');
      if (fare > 5000) throw new Error('That fare looks too high – check it.');
      if (RECEIPT_NEEDED[t.mode] && !d.receipt) throw new Error('Add a screenshot of the ' + m[1] + ' receipt.');
      claimed = fare;
    }
    if (d.receipt) receipt = savePhoto_(d.receipt, t.id + '_' + s.name + '_receipt.jpg', 'Receipts');
    const now = new Date(), r = t.row, sh = tab_('trips');
    const vals = [now, placeName_(lat, lng), lat, lng, straight, trail, km || '', rate || '', fare || '', receipt, claimed, kind === 'free' ? 0 : '', kind === 'free' ? 'No cost' : '', '', txt_(d.note, 200), '',
      JSON.stringify(pts.slice(0, 400).map(p => [round5_(p[0]), round5_(p[1])])).slice(0, 45000)];
    sh.getRange(r, C.trips['End time'] + 1, 1, vals.length).setValues([vals]); dirty_('trips');
    sh.getRange(r, C.trips['Status'] + 1).setValue(kind === 'free' ? 'Approved' : 'Submitted'); dirty_('trips');
    return { trip: tripPub_(tripRows_().find(x => x.id === t.id)), trips: tripsFor_(s.name, 60) };
  });
}
function tripCancel_(d, me) {
  return lock_(() => {
    const t = tripRows_().find(x => x.id === d.id && norm_(x.name) === norm_(me.name));
    if (!t || t.status !== 'Running') throw new Error('Only a running trip can be cancelled.');
    w_('trips').getRange(t.row, C.trips['Status'] + 1).setValue('Cancelled'); dirty_('trips');
    return { trips: tripsFor_(me.name, 60) };
  });
}
function tripsAdmin_(d, me) {
  const staff = staffAll_().filter(s => inScope_(me, s.loc) || !s.loc).map(s => norm_(s.name));
  const from = /^\d{4}-\d{2}-\d{2}$/.test(d.from || '') ? d.from : addDays_(today_(), -45);
  const list = tripRows_().filter(t => staff.indexOf(norm_(t.name)) >= 0 && (t.status === 'Submitted' || t.status === 'Running' || t.date >= from)).reverse().map(tripPub_);
  return { trips: list, modes: TRIP_MODES.map(m => ({ key: m[0], label: m[1], kind: m[2] })) };
}
/** d = {id, approve, amount, note} */
function tripDecide_(d, me) {
  return lock_(() => {
    const t = tripRows_().find(x => x.id === d.id); if (!t) throw new Error('Trip not found.');
    const s = staffByName_(t.name); if (s && s.loc && !inScope_(me, s.loc)) throw new Error('Not your store.');
    if (norm_(t.name) === norm_(me.name) && !me.owner) throw new Error('Someone else must approve your own trip.');
    if (t.status !== 'Submitted' && !me.owner) throw new Error('This trip is ' + t.status.toLowerCase() + '.');
    if (t.status === 'Running') throw new Error('The trip is still running.');
    const amt = d.approve ? round2_(d.amount === '' || d.amount == null ? t.claimed : n_(d.amount)) : 0;
    if (d.approve && amt < 0) throw new Error('Amount cannot be negative.');
    if (!d.approve && !txt_(d.note, 200)) throw new Error('Write why it is rejected.');
    tab_('trips').getRange(t.row, C.trips['Status'] + 1).setValue(d.approve ? 'Approved' : 'Rejected');
    tab_('trips').getRange(t.row, C.trips['Approved ₹'] + 1, 1, 3).setValues([[amt, me.name, new Date()]]); dirty_('trips');
    tab_('trips').getRange(t.row, C.trips['Manager note'] + 1).setValue(txt_(d.note, 200)); dirty_('trips');
    return tripsAdmin_({}, me);
  });
}

// ───────────────────────────── payroll ─────────────────────────────
function payFor_(s, month, days, trips) {
  const dim = new Date(Number(month.slice(0, 4)), Number(month.slice(5)), 0).getDate();
  const o = { month: month, name: s.name, id: s.id, loc: s.loc, salary: s.salary, dim: dim, offs: 0, hol: 0, lp: 0, lu: 0, absent: 0, workCredit: 0, extra: 0,
    paidDays: 0, noRota: 0, lateDays: 0, late: 0, extraBreak: 0, short: 0, otMin: 0, rate: 0, earned: 0, otPay: 0, travel: 0, total: 0, flags: 0, counted: days.length };
  days.forEach(x => {
    if (x.status === 'Not joined') return;
    if (x.status === 'Before app') { o.paidDays += 1; return; }
    const sh = x.shift;
    if (sh === 'OFF') o.offs++; if (sh === 'HOL') o.hol++; if (sh === 'LP') o.lp++; if (sh === 'LU') o.lu++;
    if (['OFF', 'HOL', 'LP', 'LU'].indexOf(sh) >= 0) { o.paidDays += x.credit; o.extra += x.extraDay || 0; o.paidDays += x.extraDay || 0; return; }
    if (x.status === 'Absent' || x.status === 'No shift') { if (sh) o.absent++; else o.noRota++; return; }
    if (x.status === 'Not started' || x.status === 'Not in yet') return;
    o.workCredit += x.credit; o.paidDays += x.credit;
    if (x.late) { o.lateDays++; o.late += x.late; }
    o.extraBreak += x.extraBreak;
    o.short += Math.max(0, Math.round((1 - x.credit) * (endMin_(x.start, x.end) - toMin_(x.start))));
    o.otMin += Math.min(x.ot, x.otApproved || 0);
    if (x.flags.length) o.flags++;
  });
  o.workCredit = round2_(o.workCredit); o.paidDays = round2_(o.paidDays); o.extra = round2_(o.extra);
  if (s.salary) {
    o.rate = round2_(s.salary / dim);
    o.earned = Math.round(o.rate * o.paidDays);
    const shiftH = (toMin_(shiftTimes_('M').end) - toMin_(shiftTimes_('M').start)) / 60;
    o.otPay = Math.round(o.rate / shiftH * (o.otMin / 60) * setn_('Overtime pay multiplier', 1));
  }
  o.travel = Math.round((trips || []).filter(t => t.status === 'Approved').reduce((a, t) => a + n_(t.approved), 0));
  o.total = o.earned + o.otPay + o.travel;
  o.otH = round2_(o.otMin / 60);
  return o;
}
/** d = {month:'2026-10', write:true} – owner. Writes the Attendance and Payroll tabs for that month when write is set. */
function payroll_(d, me) {
  const m = /^\d{4}-\d{2}$/.test(d.month || '') ? d.month : today_().slice(0, 7);
  const from = m + '-01', last = ymd_(new Date(Number(m.slice(0, 4)), Number(m.slice(5)), 0)), to = last < today_() ? last : today_();
  if (from > today_()) throw new Error('That month has not started.');
  const punched = {}; rows_('punch').forEach(r => { if (ymd_(r[1]) >= from) punched[norm_(r[2])] = 1; });
  const staff = staffAll_().filter(s => tracked_(s) || (s.onRota && punched[norm_(s.name)]));
  const days = daysFor_(staff.map(s => s.name), from, to, false);
  const trips = tripRows_().filter(t => t.date >= from && t.date <= last).map(tripPub_);
  const list = staff.map(s => payFor_(s, m, days.filter(x => norm_(x.name) === norm_(s.name)), trips.filter(t => norm_(t.name) === norm_(s.name))));
  if (d.write) lock_(() => {
    const at = new Date();
    const att = tab_('att'), keep = rows_('att').filter(r => ymd_(r[0]).slice(0, 7) !== m);
    att.getRange(2, 1, Math.max(att.getLastRow() - 1, 1), T.att[1].length).clearContent();
    const rowsA = keep.map(r => r.map((v, i) => i === 0 ? ymd_(v) : v)).concat(days.map(x => [x.date, DAY_NAMES[parse_(x.date).getDay()], x.name, x.loc, x.label, x.start, x.end, x.in, x.out,
      x.breakMin, x.extraBreak, x.late, x.early, x.worked, x.credited, x.ot, x.otApproved, x.credit, x.status, x.flags.join('; ')]));
    if (rowsA.length) att.getRange(2, 1, rowsA.length, T.att[1].length).setValues(rowsA);
    const pay = tab_('pay'), keepP = rows_('pay').filter(r => s_(r[0]) !== m);
    pay.getRange(2, 1, Math.max(pay.getLastRow() - 1, 1), T.pay[1].length).clearContent();
    const rowsP = keepP.concat(list.map(p => [m, p.name, p.id, p.loc, p.salary || '', p.dim, p.offs, p.hol, p.lp, p.lu, p.absent, p.workCredit, p.extra, p.paidDays,
      p.lateDays, p.late, p.extraBreak, p.short, p.otH, p.rate || '', p.earned || '', p.otPay || '', p.travel, p.total, p.flags, at]));
    if (rowsP.length) pay.getRange(2, 1, rowsP.length, T.pay[1].length).setValues(rowsP);
    dirty_('att'); dirty_('pay');
  });
  return { month: m, upTo: to, complete: to === last, people: list, sheetUrl: d.write ? book_().getUrl() : '' };
}

// ───────────────────────────── boot ─────────────────────────────
function boot_(me, token) {
  ensureSetup_();
  if (me.owner && !rows_('staff').length) { try { syncStaff_(token, me); } catch (e) { log_('First staff sync failed: ' + e, me.name); } }
  const s = me.owner ? staffByName_(me.name) : myStaff_(me);
  const out = { me: { name: me.name, role: me.role, home: me.home, admin: me.admin, pay: me.pay, owner: me.owner, rights: me.rights, staffLoc: s ? s.loc : '' },
    shifts: { M: shiftTimes_('M'), E: shiftTimes_('E') }, modes: TRIP_MODES.map(m => ({ key: m[0], label: m[1], kind: m[2], receipt: !!RECEIPT_NEEDED[m[0]] })),
    selfie: setv_('Selfie required') === 'Yes', breakAllow: setn_('Break allowed (min per shift)', 30), grace: setn_('Late grace (min)', 5), maxAcc: setn_('Max GPS error (m)', 250), rates: { bike: setn_('Bike rate ₹/km', 4), car: setn_('Car rate ₹/km', 10) },
    locations: locs_(false).map(l => ({ name: l.name, type: l.type, lat: l.lat, lng: l.lng, radius: l.radius })) };
  if (s && tracked_(s)) { out.day = myDay_(me); out.weeks = myRota_(me); }
  if (me.admin) {
    const staff = staffAll_().filter(x => x.active && (inScope_(me, x.loc) || !x.loc)).map(x => norm_(x.name));
    out.pendingTrips = can_(me, 'trips') ? tripRows_().filter(t => t.status === 'Submitted' && staff.indexOf(norm_(t.name)) >= 0).length : 0;
    out.pendingPunch = can_(me, 'approve') ? punchesOn_(null, null).filter(p => p.approved === 'Pending' && staff.indexOf(norm_(p.name)) >= 0).length : 0;
  }
  out.rightsList = RRIGHTS.map(r => ({ key: r[0], label: r[1] }));
  return out;
}

// ───────────────────────────── nightly summary ─────────────────────────────
function installTriggers() {
  ScriptApp.getProjectTriggers().filter(t => t.getHandlerFunction() === 'nightlySummary').forEach(t => ScriptApp.deleteTrigger(t));
  ScriptApp.newTrigger('nightlySummary').timeBased().atHour(22).nearMinute(45).everyDays(1).inTimezone('Asia/Kolkata').create();
  return 'Nightly summary at about 10:45 pm.';
}
function nightlySummary() {
  const to = String(setv_('Summary email') || '').trim(); if (!to) return;
  const date = today_(), staff = staffAll_().filter(s => tracked_(s));
  const days = daysFor_(staff.map(s => s.name), date, date, true);
  const line = x => '• ' + x.name + (x.loc ? ' (' + x.loc + ')' : '') + ' – ' + x.status + (x.in ? ', in ' + x.in + (x.out ? ' out ' + x.out : '') : '') + (x.flags.length ? ' – ' + x.flags.join('; ') : '');
  const absent = days.filter(x => x.status === 'Absent'), flagged = days.filter(x => x.status !== 'Absent' && x.flags.length);
  const present = days.filter(x => /^Present|Short|Half|Worked/.test(x.status));
  const trips = tripRows_().filter(t => t.status === 'Submitted'), pend = punchesOn_(null, null).filter(p => p.approved === 'Pending');
  const body = ['Staff summary for ' + date, '', 'Present: ' + present.length + ' · Absent: ' + absent.length + ' · Flags: ' + flagged.length, '',
    absent.length ? 'ABSENT\n' + absent.map(line).join('\n') + '\n' : '', flagged.length ? 'CHECK\n' + flagged.map(line).join('\n') + '\n' : '',
    trips.length ? 'TRIPS TO APPROVE: ' + trips.length + ' (₹' + trips.reduce((a, t) => a + t.claimed, 0) + ')\n' + trips.map(t => '• ' + t.name + ' – ' + t.purpose + ' – ₹' + t.claimed).join('\n') + '\n' : '',
    pend.length ? 'ENTRIES OUTSIDE A STORE TO APPROVE: ' + pend.length + '\n' : '', 'Open the app: https://vermakshat.com/rota/'].filter(x => x !== '').join('\n');
  MailApp.sendEmail(to, 'Nutvique staff ' + date + ': ' + present.length + ' present, ' + absent.length + ' absent' + (trips.length ? ', ' + trips.length + ' trips to approve' : ''), body);
}
function testInventoryLink() {
  const res = UrlFetchApp.fetch(INV_API, { method: 'post', contentType: 'text/plain;charset=utf-8', muteHttpExceptions: true, payload: JSON.stringify({ action: 'loginNames' }) });
  Logger.log(res.getResponseCode() + ' ' + res.getContentText().slice(0, 300));
}

// ───────────────────────────── photos ─────────────────────────────
function photoFolder_(sub) {
  let id = setv_('Photo folder ID'), root = null;
  if (id) { try { root = DriveApp.getFolderById(id); } catch (e) { } }
  if (!root) {
    root = DriveApp.createFolder(APP + ' – Photos');
    const sh = tab_('set'), keys = rows_('set').map(r => s_(r[0])), i = keys.indexOf('Photo folder ID');
    if (i >= 0) sh.getRange(i + 2, 2).setValue(root.getId()); else sh.appendRow(['Photo folder ID', root.getId(), '']);
    dirty_('set');
    CacheService.getScriptCache().remove('settings');
  }
  const name = sub + ' ' + today_().slice(0, 7), it = root.getFoldersByName(name);
  return it.hasNext() ? it.next() : root.createFolder(name);
}
function savePhoto_(b64, name, sub) {
  const raw = String(b64).replace(/^data:image\/\w+;base64,/, '');
  if (raw.length > 2.5e6) throw new Error('Photo is too large.');
  const f = photoFolder_(sub).createFile(Utilities.newBlob(Utilities.base64Decode(raw), 'image/jpeg', name.replace(/[^\w.\- ]+/g, '_')));
  return f.getUrl();
}
function fileId_(url) { const m = /\/d\/([\w-]{20,})/.exec(url || '') || /id=([\w-]{20,})/.exec(url || ''); return m ? m[1] : ''; }

// ───────────────────────────── utils ─────────────────────────────
function log_(what, by) { try { append_('log', [[new Date(), what, by || '']]); } catch (e) { } }
function tz_() { return 'Asia/Kolkata'; }
function today_() { return Utilities.formatDate(new Date(), tz_(), 'yyyy-MM-dd'); }
function parse_(ymd) { const p = String(ymd).split('-').map(Number); return new Date(p[0], p[1] - 1, p[2], 12); }
function ymd_(v) {
  if (!v) return '';
  if (Object.prototype.toString.call(v) === '[object Date]') return Utilities.formatDate(v, tz_(), 'yyyy-MM-dd');
  const s = String(v).trim(); return /^\d{4}-\d{2}-\d{2}/.test(s) ? s.slice(0, 10) : s;
}
function hm_(v) {
  if (v === '' || v == null) return '';
  if (Object.prototype.toString.call(v) === '[object Date]') return Utilities.formatDate(v, tz_(), 'HH:mm');
  const m = /^(\d{1,2}):(\d{2})/.exec(String(v).trim()); return m ? pad_(m[1]) + ':' + m[2] : '';
}
function hmOf_(d) { return Utilities.formatDate(d, tz_(), 'HH:mm'); }
function mins_(d) { const t = Utilities.formatDate(d, tz_(), 'HH:mm').split(':'); return Number(t[0]) * 60 + Number(t[1]); }
function toMin_(hm) { const m = /^(\d{1,2}):(\d{2})/.exec(String(hm || '')); return m ? Number(m[1]) * 60 + Number(m[2]) : 0; }
function minTxt_(m) { m = Math.max(0, Math.round(m)); const nd = m >= 1440; m = m % 1440; return pad_(Math.floor(m / 60)) + ':' + pad_(m % 60) + (nd ? ' (+1)' : ''); }
function pad_(n) { return String(n).padStart(2, '0'); }
function iso_(v) { return Object.prototype.toString.call(v) === '[object Date]' ? v.toISOString() : s_(v); }
function s_(v) { return v == null ? '' : String(v).trim(); }
function n_(v) { if (typeof v === 'number') return isFinite(v) ? v : 0; const x = Number(String(v == null ? '' : v).replace(/[₹,\s]/g, '')); return isFinite(x) ? x : 0; }
function txt_(v, max) { return String(v == null ? '' : v).replace(/[\u0000-\u001f]/g, ' ').trim().slice(0, max || 200); }
function norm_(v) { return String(v == null ? '' : v).toUpperCase().replace(/[^A-Z0-9]+/g, ' ').trim(); }
function round2_(x) { return Math.round(n_(x) * 100) / 100; }
function round5_(x) { return Math.round(n_(x) * 1e5) / 1e5; }
function digest_(s) { return Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, s).map(b => ((b + 256) % 256).toString(16).padStart(2, '0')).join(''); }
function haversine_(a, b, c, d) {
  const R = 6371000, r = x => x * Math.PI / 180, dLat = r(c - a), dLng = r(d - b);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(r(a)) * Math.cos(r(c)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}
