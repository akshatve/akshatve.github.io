
// ───────────────────────────── SUPPLIERS & PAYMENTS (v18.28, 30 Oct 2026) ─────────────────────────────
// Supplier list (+ goods bought from each), payment terms per invoice (delivery date, due date), manual payments
// (advance / part / final) and the invoice file attached to each invoice. Rights: 'invoices' (owner always).
const SUP_TAB = 'Suppliers', SUP_H = ['Supplier key', 'Supplier', 'GSTIN', 'Credit days', 'Contact person', 'Phone', 'Bank / UPI details', 'Notes', 'Updated by', 'Updated at'];
const PT_TAB = 'Invoice Payment Terms', PT_H = ['Invoice ID', 'Supplier', 'Invoice no.', 'Delivery date', 'Due date', 'Note', 'Updated by', 'Updated at'];
const SPAY_TAB = 'Supplier Payments', SPAY_H = ['Payment ID', 'Invoice ID', 'Supplier key', 'Supplier', 'Invoice no.', 'Type', 'Date', 'Amount ₹', 'Mode', 'Reference', 'Note', 'Saved by', 'Saved at', 'Status'];
const PAY_TYPES = ['Advance', 'Part payment', 'Final payment'];
const PAY_MODES = ['Bank transfer (NEFT/RTGS/IMPS)', 'UPI', 'Cash', 'Cheque', 'Other'];

function payApi_(action, d, user) {
  switch (action) {
    case 'payables': return payables_();
    case 'suppliers': return suppliersReport_();
    case 'saveSupplier': return saveSupplier_(d, user);
    case 'savePayTerms': return savePayTerms_(d, user);
    case 'recordPayment': return recordPayment_(d, user);
    case 'removePayment': return removePayment_(d, user);
    case 'attachInvoiceFile': return attachInvoiceFile_(d, user);
  }
  return undefined;
}
function anyDate_(v) { const s = ymd_(v); return /^\d{4}-\d{2}-\d{2}$/.test(s) ? s : ''; }
function addDays_(ymd, n) { const p = ymd.split('-').map(Number), t = new Date(Date.UTC(p[0], p[1] - 1, p[2] + n)); return t.toISOString().slice(0, 10); }
/** One key per supplier: GSTIN when known, otherwise the name without "PVT LTD" etc. */
function supKey_(name, gstin) {
  const g = String(gstin || '').toUpperCase().replace(/[^0-9A-Z]/g, '');
  if (/^\d{2}[A-Z]{5}\d{4}[A-Z][0-9A-Z]Z[0-9A-Z]$/.test(g)) return g;
  return 'N:' + norm_(name).replace(/\b(PRIVATE|PVT|LIMITED|LTD|LLP|CO|COMPANY|THE|M S|MS)\b/g, ' ').replace(/\s+/g, ' ').trim();
}
function supMaster_() { const m = {}; xrows_(SUP_TAB, SUP_H).forEach(r => { if (s_(r[0])) m[s_(r[0])] = r; }); return m; }
/** Invoices that count for payment (posted, or goods in with the invoice still to come), with terms and payments. */
function payInvoices_() {
  const terms = {}; xrows_(PT_TAB, PT_H).forEach(r => { if (s_(r[0])) terms[s_(r[0])] = r; });
  const pays = xrows_(SPAY_TAB, SPAY_H).filter(r => s_(r[0]) && s_(r[13]) !== 'Removed');
  const sup = supMaster_(), today = ymd_(new Date());
  // invoices without a GSTIN take the key of a same-name invoice that has one
  const inv = rows_('invoices').filter(r => s_(r[0]) && invStatusOk_(s_(r[1])));
  const byName = {}; inv.forEach(r => { const k = supKey_(r[2], r[3]); if (k.indexOf('N:') !== 0) byName[supKey_(r[2], '')] = k; });
  const out = inv.map(r => {
    const id = s_(r[0]); let key = supKey_(r[2], r[3]); if (key.indexOf('N:') === 0 && byName[key]) key = byName[key];
    const t = terms[id], m = sup[key];
    const date = anyDate_(r[5]), delivery = (t && anyDate_(t[3])) || date;
    const credit = m && s_(m[3]) !== '' ? n_(m[3]) : null;
    const due = (t && anyDate_(t[4])) || (credit != null && delivery ? addDays_(delivery, credit) : '');
    const ps = pays.filter(p => s_(p[1]) === id).map(payObj_).sort((a, b) => a.date < b.date ? -1 : 1);
    const sum = ty => round2_(ps.filter(p => ty ? p.type === ty : true).reduce((a, p) => a + p.amount, 0));
    const total = n_(r[11]), paid = sum(), bal = round2_(total - paid);
    const adv = ps.filter(p => p.type === 'Advance'), fin = ps.filter(p => p.type !== 'Advance');
    let status = bal <= 1 ? 'Paid' : paid > 0 ? 'Part paid' : 'Outstanding';
    if (bal > 1 && due && due < today) status = 'Overdue';
    return { id: id, inv: s_(r[1]), key: key, supplier: s_(r[2]), gstin: s_(r[3]), no: s_(r[4]), date: date, at: s_(r[6]), total: total,
      delivery: delivery, deliverySet: !!(t && anyDate_(t[3])), due: due, dueSet: !!(t && anyDate_(t[4])), credit: credit, termNote: t ? s_(t[5]) : '',
      advance: sum('Advance'), advDate: adv.length ? adv[adv.length - 1].date : '', final: round2_(paid - sum('Advance')), finDate: fin.length ? fin[fin.length - 1].date : '',
      lastPaid: ps.length ? ps[ps.length - 1].date : '', paid: paid, balance: bal, status: status, file: s_(r[16]), payments: ps,
      daysLate: status === 'Overdue' ? Math.round((new Date(today) - new Date(due)) / 864e5) : 0 };
  });
  const loose = pays.filter(p => !s_(p[1])).map(payObj_);     // advances paid before the invoice was entered
  return { invoices: out, loose: loose };
}
function payObj_(p) {
  return { id: s_(p[0]), inv: s_(p[1]), key: s_(p[2]), supplier: s_(p[3]), no: s_(p[4]), type: s_(p[5]), date: anyDate_(p[6]), amount: n_(p[7]),
    mode: s_(p[8]), ref: s_(p[9]), note: s_(p[10]), by: s_(p[11]), at: iso_(p[12]) };
}
function payables_() {
  const x = payInvoices_(), sup = supMaster_(), names = {};
  x.invoices.forEach(i => { if (!names[i.key] || i.date >= names[i.key].d) names[i.key] = { n: i.supplier, d: i.date, g: i.gstin }; });
  const suppliers = Object.keys(names).map(k => ({ key: k, name: sup[k] ? s_(sup[k][1]) || names[k].n : names[k].n, gstin: names[k].g, credit: sup[k] && s_(sup[k][3]) !== '' ? n_(sup[k][3]) : null }))
    .sort((a, b) => a.name.localeCompare(b.name));
  const dk = i => i.due || i.delivery || '9';
  return { invoices: x.invoices.sort((a, b) => ((a.status === 'Paid') - (b.status === 'Paid')) || (dk(a) < dk(b) ? -1 : dk(a) > dk(b) ? 1 : 0)),
    loose: x.loose, suppliers: suppliers, types: PAY_TYPES, modes: PAY_MODES, today: ymd_(new Date()) };
}
/** Every supplier with the goods bought from them (from posted invoice lines) and money owed. */
function suppliersReport_() {
  const x = payInvoices_(), sup = supMaster_(), byId = {}, S = {};
  x.invoices.forEach(i => {
    byId[i.id] = i;
    const o = S[i.key] = S[i.key] || { key: i.key, name: i.supplier, gstin: i.gstin, last: '', invoices: [], goods: {}, bought: 0, paid: 0, balance: 0, overdue: 0 };
    if (i.date >= o.last) { o.last = i.date; o.name = i.supplier; if (i.gstin) o.gstin = i.gstin; }
    o.invoices.push({ id: i.id, no: i.no, date: i.date, total: i.total, balance: i.balance, status: i.status, inv: i.inv, file: i.file });
    o.bought = round2_(o.bought + i.total); o.paid = round2_(o.paid + i.paid); o.balance = round2_(o.balance + i.balance);
    if (i.status === 'Overdue') o.overdue = round2_(o.overdue + i.balance);
  });
  rows_('lines').forEach(r => {
    const i = byId[s_(r[0])]; if (!i) return;
    const o = S[i.key], sku = s_(r[11]), k = sku || ('LINE:' + norm_(r[2]));
    const g = o.goods[k] = o.goods[k] || { sku: sku, name: s_(r[12]) || s_(r[2]), seller: s_(r[2]), unit: s_(r[14]) || s_(r[5]), qty: 0, amount: 0, n: 0, last: '', cost: 0, rate: 0 };
    g.qty = round3_(g.qty + (n_(r[13]) || n_(r[4]))); g.amount = round2_(g.amount + n_(r[7])); g.n++;
    if (i.date >= g.last) { g.last = i.date; g.cost = n_(r[15]); g.rate = n_(r[6]); g.seller = s_(r[2]); g.lastNo = i.no; }
  });
  x.loose.forEach(p => { const o = S[p.key]; if (o) o.advanceUnlinked = round2_((o.advanceUnlinked || 0) + p.amount); });
  const list = Object.keys(S).map(k => {
    const o = S[k], m = sup[k];
    o.goods = Object.keys(o.goods).map(g => o.goods[g]).sort((a, b) => b.amount - a.amount);
    o.invoices.sort((a, b) => a.date < b.date ? 1 : -1);
    if (m) { o.name = s_(m[1]) || o.name; o.credit = s_(m[3]) !== '' ? n_(m[3]) : null; o.contact = s_(m[4]); o.phone = s_(m[5]); o.bank = s_(m[6]); o.notes = s_(m[7]); }
    return o;
  }).sort((a, b) => a.name.localeCompare(b.name));
  return { suppliers: list };
}
function saveSupplier_(d, user) {
  const key = s_(d.key); if (!key) throw new Error('No supplier.');
  const lock = LockService.getScriptLock(); lock.waitLock(30000);
  try {
    const sh = xtab_(SUP_TAB, SUP_H), v = xrows_(SUP_TAB, SUP_H), i = v.findIndex(r => s_(r[0]) === key);
    const credit = s_(d.credit) === '' ? '' : Math.max(0, Math.round(n_(d.credit)));
    const row = [key, txt_(d.name, 120), txt_(d.gstin, 20).toUpperCase(), credit, txt_(d.contact, 80), txt_(d.phone, 40), txt_(d.bank, 200), txt_(d.notes, 300), user ? user.name : 'Owner', new Date()];
    sh.getRange(i >= 0 ? i + 2 : sh.getLastRow() + 1, 1, 1, row.length).setValues([row]);
  } finally { lock.releaseLock(); }
  return suppliersReport_();
}
function savePayTerms_(d, user) {
  const h = rows_('invoices').find(r => s_(r[0]) === s_(d.id));
  if (!h) throw new Error('Invoice not found.');
  const lock = LockService.getScriptLock(); lock.waitLock(30000);
  try {
    const sh = xtab_(PT_TAB, PT_H); sh.getRange('D:E').setNumberFormat('@');
    const v = xrows_(PT_TAB, PT_H), i = v.findIndex(r => s_(r[0]) === s_(d.id));
    const row = [s_(h[0]), s_(h[2]), s_(h[4]), anyDate_(d.delivery), anyDate_(d.due), txt_(d.note, 200), user ? user.name : 'Owner', new Date()];
    sh.getRange(i >= 0 ? i + 2 : sh.getLastRow() + 1, 1, 1, row.length).setValues([row]);
  } finally { lock.releaseLock(); }
  return payables_();
}
function recordPayment_(d, user) {
  const amt = round2_(n_(d.amount)); if (!(amt > 0)) throw new Error('Enter the amount paid.');
  const date = anyDate_(d.date); if (!date) throw new Error('Enter the payment date.');
  if (date > addDays_(ymd_(new Date()), 0)) throw new Error('The payment date cannot be in the future.');
  const type = PAY_TYPES.indexOf(d.type) >= 0 ? d.type : 'Part payment';
  let id = s_(d.invoiceId), key = s_(d.key), sup = txt_(d.supplier, 120), no = '';
  if (id) {
    const it = payInvoices_().invoices.find(i => i.id === id);
    if (!it) throw new Error('Invoice not found (only posted invoices or goods-in awaiting invoice can be paid).');
    if (amt > it.balance + 1 && !d.allowOver) throw new Error('₹' + amt + ' is more than the balance of ₹' + it.balance + ' on ' + it.no + '. Check the amount.');
    key = it.key; sup = it.supplier; no = it.no;
  } else if (!key) throw new Error('Pick the invoice (or the supplier for an advance).');
  const lock = LockService.getScriptLock(); lock.waitLock(30000);
  try {
    const sh = xtab_(SPAY_TAB, SPAY_H); sh.getRange('G:G').setNumberFormat('@');
    const row = ['SP-' + stamp_() + '-' + Math.floor(Math.random() * 900 + 100), id, key, sup, no, type, date, amt, PAY_MODES.indexOf(d.mode) >= 0 ? d.mode : txt_(d.mode, 40),
      txt_(d.ref, 80), txt_(d.note, 200), user ? user.name : 'Owner', new Date(), 'Active'];
    sh.getRange(sh.getLastRow() + 1, 1, 1, row.length).setValues([row]);
  } finally { lock.releaseLock(); }
  return payables_();
}
function removePayment_(d, user) {
  const lock = LockService.getScriptLock(); lock.waitLock(30000);
  try {
    const sh = xtab_(SPAY_TAB, SPAY_H), v = xrows_(SPAY_TAB, SPAY_H), i = v.findIndex(r => s_(r[0]) === s_(d.id));
    if (i < 0) throw new Error('Payment not found.');
    sh.getRange(i + 2, 11, 1, 4).setValues([[s_(v[i][10]) + ' [removed by ' + (user ? user.name : 'Owner') + ']', s_(v[i][11]), s_(v[i][12]) ? v[i][12] : new Date(), 'Removed']]);
  } finally { lock.releaseLock(); }
  return payables_();
}
/** Saves the supplier's invoice (PDF / photo) to the invoice folder in Drive and links it to the invoice. */
function attachInvoiceFile_(d, user) {
  if (!d || !d.base64) throw new Error('No file.');
  const mime = String(d.mime || 'application/pdf');
  if (!/^(application\/pdf|image\/)/.test(mime)) throw new Error('Upload a PDF or a photo of the invoice.');
  const lock = LockService.getScriptLock(); lock.waitLock(30000);
  try {
    const sh = tab_('invoices'), v = rows_('invoices'), i = v.findIndex(r => s_(r[0]) === s_(d.id));
    if (i < 0) throw new Error('Invoice not found.');
    const nm = (s_(v[i][2]).slice(0, 40) + ' ' + s_(v[i][4]) + ' ' + ymd_(v[i][5])).replace(/[\\/:*?"<>|]+/g, '-') + (mime === 'application/pdf' ? '.pdf' : '.jpg');
    const file = invoiceFolder_().createFile(Utilities.newBlob(Utilities.base64Decode(d.base64), mime, nm));
    const old = s_(v[i][16]);
    sh.getRange(i + 2, 17).setValue(file.getUrl());
    if (old && old !== file.getUrl()) sh.getRange(i + 2, 18).setValue((s_(v[i][17]) + ' | earlier file: ' + old).slice(0, 4000));
    return { url: file.getUrl(), name: nm };
  } finally { lock.releaseLock(); }
}
