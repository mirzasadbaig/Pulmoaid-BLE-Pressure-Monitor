import { BleClient } from '@capacitor-community/bluetooth-le';
import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import { ScreenOrientation } from '@capacitor/screen-orientation';
import { Capacitor } from '@capacitor/core';

const SERVICE_UUID = "4fafc201-1fb5-459e-8fcc-c5c9c331914b";
const CHAR_UUID = "beefcafe-36e1-4688-b7f5-00000000000c";
const HPA_TO_CMH2O = 1.01972;
const WINDOW_SEC = 10;          // graph shows the latest 10 s and scrolls

let deviceId = null, inited = false, connected = false;
let baseline = null, lastAbs = null;
let t0 = null;                    // performance.now() at first sample of session
let mode = "Assessment";
let sessionStart = null;          // Date of first sample
let exported = true;              // true = nothing unsaved

// Full recording (used for CSV). Display just reads the tail of this.
const records = [];               // {t, abs, rel, zero}
const stats = { max: null, min: null, maxAbs: null, minAbs: null, auc: 0 };
const profile = {};
const FIELDS = ["name", "age", "gender", "height", "weight", "smoking", "mobile", "email", "condition"];
const $ = id => document.getElementById(id);

/* ---------- screens / orientation ---------- */
async function lockOrientation(type) {
  if (!Capacitor.isNativePlatform()) return;
  try {
    if (type === "landscape") await ScreenOrientation.lock({ orientation: "landscape" });
    else await ScreenOrientation.lock({ orientation: "portrait" });
  } catch (e) { /* ignore */ }
}
function show(id) {
  document.querySelectorAll(".screen").forEach(s => s.classList.remove("active"));
  $(id).classList.add("active");
}
function setStatus(text, on) {
  $("status").textContent = text;
  $("dot").classList.toggle("on", !!on);
}
function updateButtons() {
  $("btn-conn").textContent = connected ? "Disconnect" : "Connect to Pressure-Sense";
  $("btn-conn").onclick = connected ? disconnect : connect;
  // CSV only available after disconnecting and when there is data
  $("btn-csv").disabled = connected || records.length === 0;
}

window.openMonitor = async function (m) {
  FIELDS.forEach(k => profile[k] = $(k).value.trim());
  mode = m;
  $("mode-title").textContent = m;
  $("who").textContent = profile.name ? "Patient: " + profile.name : "";
  await lockOrientation("landscape");
  show("s-mon");
  updateButtons();
  requestAnimationFrame(drawChart);
};
window.back = async function () {
  if (connected) {
    if (!confirm("This will disconnect the sensor. Continue?")) return;
    await disconnect();
  }
  if (records.length && !exported &&
    !confirm("Recorded data has not been downloaded as CSV. Leave anyway?")) return;
  await lockOrientation("portrait");
  show("s-form");
};

/* ---------- BLE ---------- */
function resetSession() {
  records.length = 0;
  baseline = null; lastAbs = null; t0 = null; sessionStart = null;
  resetStats();
  $("rel").textContent = "--";
  drawChart();
}
function resetStats() {
  stats.max = stats.min = stats.maxAbs = stats.minAbs = null;
  stats.auc = 0;
  renderStats();
}

async function connect() {
  try {
    if (records.length && !exported &&
      !confirm("Starting a new connection will clear the previous unsaved data. Continue?")) return;
    if (!inited) { await BleClient.initialize(); inited = true; }
    setStatus("Scanning...", false);
    const dev = await BleClient.requestDevice();
    deviceId = dev.deviceId;
    setStatus("Connecting...", false);
    await BleClient.connect(deviceId, onDisconnected);
    resetSession();                 // new recording for every connection
    exported = true;
    await BleClient.startNotifications(deviceId, SERVICE_UUID, CHAR_UUID, onValue);
    connected = true;
    setStatus("Connected: " + (dev.name || "device"), true);
    updateButtons();
  } catch (e) {
    setStatus("Failed: " + (e.message || e), false);
  }
}
async function disconnect() {
  try { if (deviceId) await BleClient.disconnect(deviceId); } catch (e) { }
  onDisconnected();
}
function onDisconnected() {
  connected = false;
  setStatus(records.length ? "Disconnected - data ready to download" : "Not connected", false);
  updateButtons();
}

function onValue(value) {
  // ESP32 sends text like "1013.25" (hPa)
  const hpa = parseFloat(new TextDecoder().decode(value));
  if (isNaN(hpa)) return;
  const now = performance.now();
  if (t0 === null) { t0 = now; sessionStart = new Date(); }
  const t = (now - t0) / 1000;
  if (baseline === null) baseline = hpa;
  lastAbs = hpa;
  const rel = (hpa - baseline) * HPA_TO_CMH2O;

  // area under curve (trapezoid, only the part above zero)
  const prev = records[records.length - 1];
  if (prev && prev.zero === baseline) {
    const dt = t - prev.t;
    stats.auc += (Math.max(prev.rel, 0) + Math.max(rel, 0)) / 2 * dt;
  }
  if (stats.max === null || rel > stats.max) { stats.max = rel; stats.maxAbs = hpa; }
  if (stats.min === null || rel < stats.min) { stats.min = rel; stats.minAbs = hpa; }

  records.push({ t, abs: hpa, rel, zero: baseline });
  exported = false;
  renderStats(rel);
  drawChart();
}

function renderStats(rel) {
  if (rel !== undefined) $("rel").textContent = rel.toFixed(1);
  else if (stats.max === null) $("rel").textContent = "--";
  $("max").textContent = stats.max === null ? "--" : stats.max.toFixed(1);
  $("min").textContent = stats.min === null ? "--" : stats.min.toFixed(1);
  $("maxabs").textContent = stats.maxAbs === null ? "" : stats.maxAbs.toFixed(2) + " hPa";
  $("minabs").textContent = stats.minAbs === null ? "" : stats.minAbs.toFixed(2) + " hPa";
  $("auc").textContent = stats.auc.toFixed(2);
}

window.tare = function () {
  if (lastAbs === null) return;
  baseline = lastAbs;
  resetStats();                      // max / min / area restart from the new zero
};
window.clearData = function () {
  if (records.length && !confirm("Clear all recorded data?")) return;
  resetSession();
  setStatus(connected ? "Connected" : "Not connected", connected);
  updateButtons();
};

/* ---------- scrolling graph ---------- */
function drawChart() {
  const c = $("chart");
  const dpr = window.devicePixelRatio || 1;
  const w = c.clientWidth, h = c.clientHeight;
  if (!w || !h) return;
  if (c.width !== Math.round(w * dpr) || c.height !== Math.round(h * dpr)) {
    c.width = Math.round(w * dpr); c.height = Math.round(h * dpr);
  }
  const g = c.getContext("2d");
  g.setTransform(dpr, 0, 0, dpr, 0, 0);
  g.clearRect(0, 0, w, h);

  const L = 52, R = 10, T = 10, B = 26;           // margins
  const pw = w - L - R, ph = h - T - B;

  // time window: latest WINDOW_SEC seconds; before that fills from the left
  const tNow = records.length ? records[records.length - 1].t : 0;
  const tEnd = Math.max(tNow, WINDOW_SEC);
  const tStart = tEnd - WINDOW_SEC;

  // visible samples (scan backwards from newest)
  const vis = [];
  for (let i = records.length - 1; i >= 0 && records[i].t >= tStart - 0.5; i--) vis.push(records[i]);
  vis.reverse();

  let min = 0, max = 5;
  vis.forEach(p => { if (p.rel < min) min = p.rel; if (p.rel > max) max = p.rel; });
  const pad = (max - min) * 0.1; min -= pad; max += pad;

  const X = t => L + (t - tStart) / WINDOW_SEC * pw;
  const Y = v => T + ph - (v - min) / (max - min) * ph;

  g.font = "12px Roboto, sans-serif";
  g.fillStyle = "#333"; g.strokeStyle = "rgba(0,0,0,.12)"; g.lineWidth = 1;

  // y grid + labels
  g.textAlign = "right"; g.textBaseline = "middle";
  for (let i = 0; i <= 4; i++) {
    const v = min + (max - min) * i / 4, yy = Y(v);
    g.beginPath(); g.moveTo(L, yy); g.lineTo(L + pw, yy); g.stroke();
    g.fillText(v.toFixed(1), L - 6, yy);
  }
  // x grid + labels (every 2 s, moving with time)
  g.textAlign = "center"; g.textBaseline = "top";
  for (let tt = Math.ceil(tStart / 2) * 2; tt <= tEnd; tt += 2) {
    const xx = X(tt);
    g.beginPath(); g.moveTo(xx, T); g.lineTo(xx, T + ph); g.stroke();
    g.fillText(tt.toFixed(0), xx, T + ph + 6);
  }
  // zero line
  g.strokeStyle = "rgba(0,0,0,.45)";
  g.beginPath(); g.moveTo(L, Y(0)); g.lineTo(L + pw, Y(0)); g.stroke();

  if (vis.length < 2) return;

  g.save();
  g.beginPath(); g.rect(L, T, pw, ph); g.clip();
  // filled area (area under curve, relative to zero line)
  g.beginPath();
  g.moveTo(X(vis[0].t), Y(0));
  vis.forEach(p => g.lineTo(X(p.t), Y(p.rel)));
  g.lineTo(X(vis[vis.length - 1].t), Y(0));
  g.closePath();
  g.fillStyle = "rgba(63,81,181,.18)"; g.fill();
  // line
  g.beginPath();
  vis.forEach((p, i) => i ? g.lineTo(X(p.t), Y(p.rel)) : g.moveTo(X(p.t), Y(p.rel)));
  g.strokeStyle = "#3f51b5"; g.lineWidth = 2.5; g.stroke();
  g.restore();
}
window.addEventListener("resize", drawChart);
window.addEventListener("orientationchange", () => setTimeout(drawChart, 300));

/* ---------- CSV export ---------- */
function csvCell(v) {
  const s = String(v ?? "");
  return /[",\r\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
}
const row = (...cells) => cells.map(csvCell).join(",");
const pad2 = n => String(n).padStart(2, "0");

function buildCsv() {
  const start = sessionStart || new Date();
  const dur = records.length ? records[records.length - 1].t : 0;
  const lines = [];
  lines.push(row("PRESSURE SENSE REPORT"));
  lines.push(row("Mode", mode));
  lines.push(row("Session start", start.toISOString()));
  lines.push("");
  lines.push(row("PATIENT DETAILS"));
  lines.push(row("Name", profile.name));
  lines.push(row("Age", profile.age));
  lines.push(row("Gender", profile.gender));
  lines.push(row("Height (cm)", profile.height));
  lines.push(row("Weight (kg)", profile.weight));
  lines.push(row("Smoking Habit", profile.smoking));
  lines.push(row("Mobile No", profile.mobile));
  lines.push(row("Email Id", profile.email));
  lines.push(row("Diagnosed Clinical Condition", profile.condition));
  lines.push("");
  lines.push(row("SUMMARY"));
  lines.push(row("Max pressure (cmH2O, relative to zero)", stats.max === null ? "" : stats.max.toFixed(2)));
  lines.push(row("Min pressure (cmH2O, relative to zero)", stats.min === null ? "" : stats.min.toFixed(2)));
  lines.push(row("Max pressure (hPa, absolute)", stats.maxAbs === null ? "" : stats.maxAbs.toFixed(2)));
  lines.push(row("Min pressure (hPa, absolute)", stats.minAbs === null ? "" : stats.minAbs.toFixed(2)));
  lines.push(row("Power - area under curve (cmH2O*s)", stats.auc.toFixed(3)));
  lines.push(row("Duration (s)", dur.toFixed(2)));
  lines.push(row("Samples", records.length));
  lines.push("");
  lines.push(row("DATA"));
  lines.push(row("Time (s)", "Timestamp", "Absolute (hPa)", "Relative (cmH2O)", "Zero reference (hPa)"));
  records.forEach(r => {
    const ts = new Date(start.getTime() + r.t * 1000).toISOString();
    lines.push(row(r.t.toFixed(3), ts, r.abs.toFixed(2), r.rel.toFixed(2), r.zero.toFixed(2)));
  });
  return "\uFEFF" + lines.join("\r\n");   // BOM so Excel reads it correctly
}

window.downloadCsv = async function () {
  if (connected || !records.length) return;
  const d = sessionStart || new Date();
  const safeName = (profile.name || "patient").replace(/[^a-z0-9]+/gi, "_");
  const fname = `PressureSense_${safeName}_${d.getFullYear()}${pad2(d.getMonth() + 1)}${pad2(d.getDate())}_` +
    `${pad2(d.getHours())}${pad2(d.getMinutes())}${pad2(d.getSeconds())}.csv`;
  const csv = buildCsv();
  try {
    if (Capacitor.isNativePlatform()) {
      const res = await Filesystem.writeFile({
        path: fname, data: csv, directory: Directory.Cache, encoding: Encoding.UTF8
      });
      // opens the Android share sheet: Save to Drive / Files / WhatsApp / Email ...
      await Share.share({ title: fname, url: res.uri, dialogTitle: "Save or share CSV" });
    } else {
      const a = document.createElement("a");
      a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
      a.download = fname; a.click();
      URL.revokeObjectURL(a.href);
    }
    exported = true;
  } catch (e) {
    if (!/cancel/i.test(String(e.message || e))) alert("Could not export CSV: " + (e.message || e));
  }
};

updateButtons();
lockOrientation("portrait");
