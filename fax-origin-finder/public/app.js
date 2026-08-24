import * as pdfjsLib from "./vendor/pdfjs/pdf.mjs";
import { extractFaxNumbersFromText } from "./pdf-numbers.js";
import { formatFax, isPlausibleJapaneseFax, normalizeFax } from "./phone-format.js";

// public/ はバンドラを通さずそのまま配信されるため、pdf.jsの実体も
// 相対パスで解決する（scripts/sync-vendor.mjs が配置します）。
const pdfAsset = (path) => new URL(`./vendor/pdfjs/${path}`, import.meta.url).href;

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfAsset("pdf.worker.mjs");

const state = {
  file: null,
  fileType: "csv",
  pageCount: 0,
  headers: [],
  rows: [],
  faxColumn: "",
  results: [],
  filter: "all",
  query: "",
  maxNumbers: 100
};

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];

const elements = {
  fileInput: $("#fileInput"), dropzone: $("#dropzone"), chooseButton: $("#chooseButton"),
  faxColumn: $("#faxColumn"), previewTable: $("#previewTable"), fileSummary: $("#fileSummary"),
  targetCount: $("#targetCount"), invalidCount: $("#invalidCount"), searchButton: $("#searchButton"),
  loadingFile: $("#loadingFile"), resultsList: $("#resultsList"), toast: $("#toast")
};

function escapeHtml(value = "") {
  return String(value).replace(/[&<>'"]/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[char]);
}

function showToast(message) {
  elements.toast.textContent = message;
  elements.toast.classList.add("is-visible");
  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => elements.toast.classList.remove("is-visible"), 2600);
}

function setView(name, step) {
  $$(".view").forEach((view) => view.classList.toggle("is-visible", view.id === `${name}View`));
  $$(".step").forEach((item) => {
    const n = Number(item.dataset.step);
    item.classList.toggle("is-active", n === step);
    item.classList.toggle("is-done", n < step);
  });
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function detectDelimiter(text) {
  const firstRecord = text.split(/\r?\n/, 1)[0];
  const delimiters = [",", "\t", ";"];
  let inQuotes = false;
  const scores = Object.fromEntries(delimiters.map((delimiter) => [delimiter, 0]));
  for (let index = 0; index < firstRecord.length; index++) {
    if (firstRecord[index] === '"') inQuotes = !inQuotes;
    else if (!inQuotes && delimiters.includes(firstRecord[index])) scores[firstRecord[index]]++;
  }
  return delimiters.sort((a, b) => scores[b] - scores[a])[0];
}

function parseCsv(text) {
  const clean = text.replace(/^\uFEFF/, "");
  const delimiter = detectDelimiter(clean);
  const records = [];
  let record = [], field = "", inQuotes = false;
  for (let index = 0; index < clean.length; index++) {
    const char = clean[index];
    if (char === '"') {
      if (inQuotes && clean[index + 1] === '"') { field += '"'; index++; }
      else inQuotes = !inQuotes;
    } else if (char === delimiter && !inQuotes) {
      record.push(field); field = "";
    } else if ((char === "\n" || char === "\r") && !inQuotes) {
      if (char === "\r" && clean[index + 1] === "\n") index++;
      record.push(field); field = "";
      if (record.some((value) => value.trim() !== "")) records.push(record);
      record = [];
    } else field += char;
  }
  record.push(field);
  if (record.some((value) => value.trim() !== "")) records.push(record);
  if (!records.length) throw new Error("CSVにデータがありません");

  const headers = records[0].map((header, index) => header.trim() || `列${index + 1}`);
  const rows = records.slice(1).map((values) => Object.fromEntries(headers.map((header, index) => [header, values[index] ?? ""])));
  return { headers, rows };
}

function autoDetectFaxColumn(headers) {
  const normalize = (value) => value.toLowerCase().replace(/[\s_\-（）()]/g, "");
  const patterns = [/^fax(?:番号|no)?$/i, /ファックス(?:番号)?/, /fax/, /電話番号/, /tel/];
  return headers.find((header) => patterns.some((pattern) => pattern.test(normalize(header)))) || headers[0];
}

function plausible(value) { return isPlausibleJapaneseFax(value); }

function cellValue(row) { return String(row[state.faxColumn] ?? "").trim(); }

// 同じ番号が複数行に出てくるCSVは珍しくない。検索は番号ごとに1回で足りる。
function targetNumbers() {
  return [...new Set(state.rows.map(cellValue).filter(Boolean))];
}

async function decodeFile(file) {
  const buffer = await file.arrayBuffer();
  try { return new TextDecoder("utf-8", { fatal: true }).decode(buffer); }
  catch {
    try { return new TextDecoder("shift_jis").decode(buffer); }
    catch { throw new Error("文字コードを読み取れません。UTF-8で保存し直してください"); }
  }
}

async function parsePdf(file) {
  const data = new Uint8Array(await file.arrayBuffer());
  const loadingTask = pdfjsLib.getDocument({
    data,
    isEvalSupported: false,
    // 複合機やWindowsアプリが出力した日本語PDFは、フォントを埋め込まずに
    // 定義済みCMapを参照することがある。指定しないと文字が取り出せない。
    cMapUrl: pdfAsset("cmaps/"),
    cMapPacked: true,
    standardFontDataUrl: pdfAsset("standard_fonts/")
  });
  const document = await loadingTask.promise;
  const pageCount = document.numPages;
  if (pageCount > 100) {
    await loadingTask.destroy();
    throw new Error("PDFは100ページ以内にしてください");
  }

  const rows = [];
  const seen = new Set();
  for (let pageNumber = 1; pageNumber <= pageCount; pageNumber++) {
    elements.dropzone.querySelector("h2").textContent = `PDFを解析しています（${pageNumber} / ${pageCount}ページ）`;
    const page = await document.getPage(pageNumber);
    const content = await page.getTextContent();
    const pageText = content.items.map((item) => "str" in item ? item.str : "").join(" ");
    for (const match of extractFaxNumbersFromText(pageText)) {
      if (seen.has(match.normalized)) continue;
      seen.add(match.normalized);
      rows.push({
        "ページ": String(pageNumber),
        "FAX番号": match.formatted,
        "抽出テキスト": match.context
      });
    }
    page.cleanup();
  }
  await loadingTask.destroy();

  if (!rows.length) {
    throw new Error("FAX番号を抽出できませんでした。画像だけのPDFは、文字検索できるPDFへ変換してください");
  }
  return { headers: ["ページ", "FAX番号", "抽出テキスト"], rows, pageCount };
}

async function handleFile(file) {
  if (!file) return;
  const isPdf = file.type === "application/pdf" || /\.pdf$/i.test(file.name);
  const maxSize = isPdf ? 20 * 1024 * 1024 : 5 * 1024 * 1024;
  if (file.size > maxSize) return showToast(`ファイルサイズは${isPdf ? 20 : 5}MB以内にしてください`);
  const originalHeading = elements.dropzone.querySelector("h2").textContent;
  elements.dropzone.classList.add("is-reading");
  elements.chooseButton.disabled = true;
  try {
    const parsed = isPdf ? await parsePdf(file) : parseCsv(await decodeFile(file));
    if (!parsed.rows.length) throw new Error("見出し行のほかにデータがありません");
    state.file = file; state.headers = parsed.headers; state.rows = parsed.rows; state.results = [];
    state.fileType = isPdf ? "pdf" : "csv";
    state.pageCount = parsed.pageCount || 0;
    state.faxColumn = autoDetectFaxColumn(parsed.headers);
    renderConfirmation(); setView("confirm", 2);
  } catch (error) {
    const message = error?.name === "PasswordException" ? "パスワード保護されたPDFは読み取れません" : error.message;
    showToast(message || "ファイルを読み取れませんでした");
  } finally {
    elements.dropzone.classList.remove("is-reading");
    elements.chooseButton.disabled = false;
    elements.dropzone.querySelector("h2").textContent = originalHeading;
  }
}

function renderConfirmation() {
  elements.fileSummary.textContent = state.fileType === "pdf"
    ? `${state.file.name} ・ ${state.pageCount.toLocaleString()}ページから${state.rows.length.toLocaleString()}件を抽出`
    : `${state.file.name} ・ ${state.rows.length.toLocaleString()}行`;
  elements.faxColumn.innerHTML = state.headers.map((header) => `<option value="${escapeHtml(header)}" ${header === state.faxColumn ? "selected" : ""}>${escapeHtml(header)}</option>`).join("");
  updateColumnPreview();
}

function updateColumnPreview() {
  state.faxColumn = elements.faxColumn.value;
  const numbers = targetNumbers();
  const invalid = numbers.filter((value) => !plausible(value)).length;
  elements.targetCount.textContent = Math.min(numbers.length, state.maxNumbers).toLocaleString();
  elements.invalidCount.textContent = invalid.toLocaleString();
  elements.searchButton.disabled = numbers.length === 0 || numbers.length > state.maxNumbers;
  elements.searchButton.querySelector("span").textContent = numbers.length > state.maxNumbers ? `${state.maxNumbers}件以内にしてください` : `${Math.min(numbers.length, state.maxNumbers)}件の発信元を検索する`;
  elements.previewTable.innerHTML = `<thead><tr>${state.headers.map((header) => `<th class="${header === state.faxColumn ? "fax-cell" : ""}">${escapeHtml(header)}</th>`).join("")}</tr></thead><tbody>${state.rows.slice(0,5).map((row) => `<tr>${state.headers.map((header) => `<td class="${header === state.faxColumn ? "fax-cell" : ""}" title="${escapeHtml(row[header])}">${escapeHtml(row[header])}</td>`).join("")}</tr>`).join("")}</tbody>`;
}

async function startSearch() {
  const numbers = targetNumbers();
  if (!numbers.length) return;
  elements.loadingFile.textContent = `${state.file.name} ・ ${numbers.length}件`;
  setView("loading", 3);
  try {
    const response = await fetch("/api/lookup", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ numbers }) });
    const body = await response.json();
    if (!response.ok) throw new Error(body.error || "検索に失敗しました");
    const byInput = new Map(body.results.map((result) => [result.input, result]));
    state.results = state.rows
      .map((row, index) => ({ row, index, input: cellValue(row) }))
      .filter(({ input }) => input)
      .map(({ row, index, input }) => ({
        row,
        index,
        lookup: byInput.get(input) || { input, normalized: normalizeFax(input), formatted: formatFax(input), status: "error", message: "検索結果を取得できませんでした", candidates: [] }
      }));
    state.filter = "all"; state.query = ""; $("#resultSearch").value = "";
    renderResults(); setView("results", 3);
  } catch (error) { showToast(error.message); setView("confirm", 2); }
}

function statusGroup(lookup) {
  if (lookup.status === "found") return "found";
  if (lookup.status === "not_found") return "not_found";
  return "error";
}

function renderResults() {
  const counts = { found:0, not_found:0, error:0 };
  state.results.forEach(({ lookup }) => counts[statusGroup(lookup)]++);
  $("#allCount").textContent = state.results.length; $("#foundCount").textContent = counts.found;
  $("#notFoundCount").textContent = counts.not_found; $("#errorCount").textContent = counts.error;
  $("#resultSummary").textContent = `${state.file.name} ・ ${state.results.length}件の照合が完了しました`;
  $("#summaryCards").innerHTML = `
    <div class="summary-card"><span class="symbol"><svg viewBox="0 0 24 24"><path d="m5 12 4 4L19 6"/></svg></span><div><strong>${counts.found}</strong><small>発信元候補あり</small></div></div>
    <div class="summary-card gray"><span class="symbol"><svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="8"/><path d="M8 12h8"/></svg></span><div><strong>${counts.not_found}</strong><small>公開情報なし</small></div></div>
    <div class="summary-card orange"><span class="symbol"><svg viewBox="0 0 24 24"><path d="M12 4 3 20h18L12 4Z"/><path d="M12 9v5m0 3v.5"/></svg></span><div><strong>${counts.error}</strong><small>形式・検索要確認</small></div></div>`;
  renderResultList();
}

function renderResultList() {
  const query = state.query.toLowerCase();
  const visible = state.results.filter(({ lookup }) => {
    if (state.filter !== "all" && statusGroup(lookup) !== state.filter) return false;
    const top = lookup.candidates?.[0];
    return !query || `${lookup.input} ${lookup.formatted} ${top?.organization || ""}`.toLowerCase().includes(query);
  });
  if (!visible.length) { elements.resultsList.innerHTML = `<div class="empty-results">条件に一致する結果はありません</div>`; return; }
  elements.resultsList.innerHTML = visible.map(({ lookup, index }) => {
    const top = lookup.candidates?.[0];
    const group = statusGroup(lookup);
    const statusText = group === "found" ? "候補あり" : group === "not_found" ? "候補なし" : "要確認";
    const confidenceClass = top?.confidence === "高" ? "high" : top?.confidence === "中" ? "mid" : "";
    const details = (lookup.candidates || []).map((candidate) => `<div class="candidate"><div class="candidate-head"><a href="${escapeHtml(candidate.url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(candidate.title || candidate.organization)}</a><span class="evidence">確度 ${candidate.score}%</span></div><p>${escapeHtml(candidate.description || "検索結果の説明はありません。リンク先で番号の掲載を確認してください。")}</p></div>`).join("");
    return `<article class="result-item" data-index="${index}"><div class="result-main" role="button" tabindex="0" aria-expanded="false"><div class="result-number">${escapeHtml(lookup.formatted || lookup.input)}<small>${escapeHtml(lookup.normalized || "形式を確認")}</small></div><div class="result-origin"><strong>${escapeHtml(top?.organization || "発信元を特定できませんでした")}</strong><span>${escapeHtml(top?.title || lookup.message)}</span></div><span class="confidence ${confidenceClass}">${top ? `確度 ${top.confidence}・${top.score}%` : "—"}</span><span class="status-badge ${group === "not_found" ? "empty" : group === "error" ? "error" : ""}">${statusText}</span><button class="chevron" aria-label="根拠を表示"><svg viewBox="0 0 24 24"><path d="m9 5 7 7-7 7"/></svg></button></div><div class="result-detail">${details || `<div class="candidate"><p>${escapeHtml(lookup.message)}${lookup.query ? ` 検索語: ${escapeHtml(lookup.query)}` : ""}</p></div>`}</div></article>`;
  }).join("");
}

function toggleResult(item) {
  item.classList.toggle("is-open");
  item.querySelector(".result-main").setAttribute("aria-expanded", item.classList.contains("is-open"));
}

function csvEscape(value = "") {
  const text = String(value ?? "");
  return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

function exportCsv() {
  const added = ["検索状態","推定発信元","確度","根拠URL","根拠要約","検索クエリ"];
  const lines = [[...state.headers, ...added].map(csvEscape).join(",")];
  for (const { row, lookup } of state.results) {
    const top = lookup.candidates?.[0];
    lines.push([...state.headers.map((header) => row[header]), lookup.message, top?.organization || "", top ? `${top.confidence} (${top.score}%)` : "", top?.url || "", top?.description || "", lookup.query || ""].map(csvEscape).join(","));
  }
  const blob = new Blob(["\uFEFF", lines.join("\r\n")], { type:"text/csv;charset=utf-8" });
  const link = document.createElement("a"); link.href = URL.createObjectURL(blob);
  link.download = `${state.file.name.replace(/\.[^.]+$/, "")}_発信元検索結果.csv`; link.click(); URL.revokeObjectURL(link.href);
  showToast("検索結果CSVをダウンロードしました");
}

function reset() {
  Object.assign(state, { file:null, fileType:"csv", pageCount:0, headers:[], rows:[], faxColumn:"", results:[], filter:"all", query:"" });
  elements.fileInput.value = ""; setView("upload", 1);
}

elements.chooseButton.addEventListener("click", (event) => { event.stopPropagation(); elements.fileInput.click(); });
elements.dropzone.addEventListener("click", () => elements.fileInput.click());
elements.dropzone.addEventListener("keydown", (event) => { if (["Enter"," "].includes(event.key)) { event.preventDefault(); elements.fileInput.click(); } });
elements.fileInput.addEventListener("change", () => handleFile(elements.fileInput.files[0]));
["dragenter","dragover"].forEach((eventName) => elements.dropzone.addEventListener(eventName, (event) => { event.preventDefault(); elements.dropzone.classList.add("is-dragging"); }));
["dragleave","drop"].forEach((eventName) => elements.dropzone.addEventListener(eventName, (event) => { event.preventDefault(); elements.dropzone.classList.remove("is-dragging"); }));
elements.dropzone.addEventListener("drop", (event) => handleFile(event.dataTransfer.files[0]));
elements.faxColumn.addEventListener("change", updateColumnPreview);
$("#changeFileButton").addEventListener("click", reset); $("#restartButton").addEventListener("click", reset);
elements.searchButton.addEventListener("click", startSearch); $("#exportButton").addEventListener("click", exportCsv);
$("#resultSearch").addEventListener("input", (event) => { state.query = event.target.value; renderResultList(); });
$(".filters").addEventListener("click", (event) => { const button = event.target.closest(".filter"); if (!button) return; state.filter = button.dataset.filter; $$(".filter").forEach((item) => item.classList.toggle("is-active", item === button)); renderResultList(); });
elements.resultsList.addEventListener("click", (event) => { if (event.target.closest("a")) return; const item = event.target.closest(".result-item"); if (item) toggleResult(item); });
elements.resultsList.addEventListener("keydown", (event) => { if (["Enter"," "].includes(event.key) && event.target.classList.contains("result-main")) { event.preventDefault(); toggleResult(event.target.closest(".result-item")); } });

function addLogoutButton() {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "provider-pill logout-button";
  button.textContent = "ログアウト";
  button.addEventListener("click", async () => {
    button.disabled = true;
    await fetch("/auth/logout", { method: "POST" }).catch(() => {});
    location.reload();
  });
  $(".topbar-actions").append(button);
}

fetch("/api/config").then((response) => response.json()).then((config) => {
  state.maxNumbers = config.maxNumbers || 100;
  $("#providerPill").classList.add("is-ready");
  $("#providerPill span:last-child").textContent = config.apiKeyConfigured ? "Brave Search 接続済み" : "試用検索モード";
  if (config.accessProtected) addLogoutButton();
}).catch(() => { $("#providerPill span:last-child").textContent = "接続エラー"; });
