// ============================================================
// KAS KONTRAKAN — Google Apps Script Backend
// Deploy sebagai Web App: Execute as "Me", Access "Anyone"
// ============================================================

const SPREADSHEET_ID = 'GANTI_DENGAN_SPREADSHEET_ID_KAMU';
const SHEET_TRANSAKSI = 'Transaksi';
const SHEET_PENGHUNI  = 'Penghuni';
const SHEET_PENGATURAN = 'Pengaturan';
const SECRET_KEY = 'GANTI_PASSWORD_RAHASIA'; // password sederhana

// ── Entry point GET (read) ──────────────────────────────────
function doGet(e) {
  const key = e.parameter.key;
  if (key !== SECRET_KEY) return respond({ error: 'Unauthorized' }, 401);

  const action = e.parameter.action;
  try {
    if (action === 'getAllData')     return respond(getAllData());
    if (action === 'getPenghuni')    return respond(getPenghuni());
    if (action === 'getTransaksi')   return respond(getTransaksi());
    if (action === 'getPengaturan')  return respond(getPengaturan());
    return respond({ error: 'Unknown action' }, 400);
  } catch(err) {
    return respond({ error: err.message }, 500);
  }
}

// ── Entry point POST (write) ────────────────────────────────
function doPost(e) {
  const body = JSON.parse(e.postData.contents);
  if (body.key !== SECRET_KEY) return respond({ error: 'Unauthorized' }, 401);

  const action = body.action;
  try {
    if (action === 'addTransaksi')      return respond(addTransaksi(body.data));
    if (action === 'deleteTransaksi')   return respond(deleteTransaksi(body.id));
    if (action === 'addPenghuni')       return respond(addPenghuni(body.data));
    if (action === 'updatePenghuni')    return respond(updatePenghuni(body.data));
    if (action === 'deletePenghuni')    return respond(deletePenghuni(body.id));
    if (action === 'savePengaturan')    return respond(savePengaturan(body.data));
    if (action === 'importAll')         return respond(importAll(body.data));
    return respond({ error: 'Unknown action' }, 400);
  } catch(err) {
    return respond({ error: err.message }, 500);
  }
}

// ── Helpers ─────────────────────────────────────────────────
function respond(data, code) {
  const output = ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
  return output;
}

function getSheet(name) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  let sheet = ss.getSheetByName(name);
  if (!sheet) {
    sheet = ss.insertSheet(name);
    // init headers
    if (name === SHEET_TRANSAKSI) {
      sheet.appendRow(['id','tipe','bulan','penghuniId','nama','kategori','jumlah','keterangan','tgl','kontrakan']);
    } else if (name === SHEET_PENGHUNI) {
      sheet.appendRow(['id','nama','kamar','kontrakan','status','kontak','warna']);
    } else if (name === SHEET_PENGATURAN) {
      sheet.appendRow(['key','value']);
    }
  }
  return sheet;
}

function sheetToObjects(sheet) {
  const data = sheet.getDataRange().getValues();
  if (data.length < 2) return [];
  const headers = data[0];
  return data.slice(1).map(row => {
    const obj = {};
    headers.forEach((h, i) => { obj[h] = row[i]; });
    return obj;
  });
}

// ── READ functions ───────────────────────────────────────────
function getAllData() {
  return {
    penghuni: getPenghuni(),
    transaksi: getTransaksi(),
    pengaturan: getPengaturan()
  };
}

function getPenghuni() {
  return sheetToObjects(getSheet(SHEET_PENGHUNI));
}

function getTransaksi() {
  const rows = sheetToObjects(getSheet(SHEET_TRANSAKSI));
  return rows.map(r => ({ ...r, jumlah: Number(r.jumlah) }));
}

function getPengaturan() {
  const rows = sheetToObjects(getSheet(SHEET_PENGATURAN));
  const obj = { nama: 'Kontrakan', kamar: 7, saldoAwal: 0, mulai: '' };
  rows.forEach(r => {
    if (r.key === 'saldoAwal' || r.key === 'kamar') obj[r.key] = Number(r.value);
    else obj[r.key] = r.value;
  });
  return obj;
}

// ── WRITE functions ──────────────────────────────────────────
function addTransaksi(data) {
  const sheet = getSheet(SHEET_TRANSAKSI);
  sheet.appendRow([
    data.id, data.tipe, data.bulan, data.penghuniId||'',
    data.nama||'', data.kategori||'', data.jumlah,
    data.keterangan||'', data.tgl||data.bulan+'-01', data.kontrakan||'1'
  ]);
  return { success: true, id: data.id };
}

function deleteTransaksi(id) {
  const sheet = getSheet(SHEET_TRANSAKSI);
  const data = sheet.getDataRange().getValues();
  for (let i = data.length - 1; i >= 1; i--) {
    if (String(data[i][0]) === String(id)) {
      sheet.deleteRow(i + 1);
      return { success: true };
    }
  }
  return { success: false, error: 'Not found' };
}

function addPenghuni(data) {
  const sheet = getSheet(SHEET_PENGHUNI);
  sheet.appendRow([
    data.id, data.nama, data.kamar, data.kontrakan||'1',
    data.status||'Aktif', data.kontak||'', data.warna||'#4f8ef7'
  ]);
  return { success: true };
}

function updatePenghuni(data) {
  const sheet = getSheet(SHEET_PENGHUNI);
  const rows = sheet.getDataRange().getValues();
  for (let i = 1; i < rows.length; i++) {
    if (String(rows[i][0]) === String(data.id)) {
      sheet.getRange(i+1, 1, 1, 7).setValues([[
        data.id, data.nama, data.kamar, data.kontrakan||'1',
        data.status||'Aktif', data.kontak||'', data.warna||rows[i][6]
      ]]);
      return { success: true };
    }
  }
  return { success: false, error: 'Not found' };
}

function deletePenghuni(id) {
  const sheet = getSheet(SHEET_PENGHUNI);
  const data = sheet.getDataRange().getValues();
  for (let i = data.length - 1; i >= 1; i--) {
    if (String(data[i][0]) === String(id)) {
      sheet.deleteRow(i + 1);
      return { success: true };
    }
  }
  return { success: false, error: 'Not found' };
}

function savePengaturan(data) {
  const sheet = getSheet(SHEET_PENGATURAN);
  sheet.clearContents();
  sheet.appendRow(['key','value']);
  Object.entries(data).forEach(([k,v]) => sheet.appendRow([k, v]));
  return { success: true };
}

function importAll(data) {
  // Clear and reimport everything
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);

  // Transaksi
  const st = getSheet(SHEET_TRANSAKSI);
  st.clearContents();
  st.appendRow(['id','tipe','bulan','penghuniId','nama','kategori','jumlah','keterangan','tgl','kontrakan']);
  (data.transaksi||[]).forEach(t => {
    st.appendRow([t.id,t.tipe,t.bulan,t.penghuniId||'',t.nama||'',t.kategori||'',t.jumlah,t.keterangan||'',t.tgl||t.bulan+'-01',t.kontrakan||'1']);
  });

  // Penghuni
  const sp = getSheet(SHEET_PENGHUNI);
  sp.clearContents();
  sp.appendRow(['id','nama','kamar','kontrakan','status','kontak','warna']);
  (data.penghuni||[]).forEach(p => {
    sp.appendRow([p.id,p.nama,p.kamar,p.kontrakan||'1',p.status||'Aktif',p.kontak||'',p.warna||'#4f8ef7']);
  });

  // Pengaturan
  if (data.pengaturan) savePengaturan(data.pengaturan);

  return { success: true, imported: { transaksi: (data.transaksi||[]).length, penghuni: (data.penghuni||[]).length } };
}
