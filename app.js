const STORAGE_KEY = "gnomologia-quotes-v1";
const COLORS = ["white", "gray", "plum", "pale-purple"];
let quotes = loadQuotes();
let currentView = "all";
let selectedId = null;
let draggedId = null;

const $ = (id) => document.getElementById(id);
const grid = $("quoteGrid");
const empty = $("emptyState");
const peopleView = $("peopleView");
const settingsView = $("settingsView");
const addDialog = $("addDialog");
const detailDialog = $("detailDialog");
const editDialog = $("editDialog");

function uid() { return (crypto.randomUUID ? crypto.randomUUID() : String(Date.now()) + Math.random()); }
function loadQuotes() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    return Array.isArray(saved) ? saved : [];
  } catch { return []; }
}
function save() { localStorage.setItem(STORAGE_KEY, JSON.stringify(quotes)); }
function escapeHTML(value) {
  return String(value).replace(/[&<>"']/g, c => ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;" }[c]));
}
function displayQuote(text) {
  const clean = String(text || "").trim().replace(/^["“]|["”]$/g, "");
  return `“${clean}”`;
}
function setView(view) {
  currentView = view;
  document.querySelectorAll(".nav-item[data-view]").forEach(btn => btn.classList.toggle("active", btn.dataset.view === view));
  const titles = { all: "Gnomologia", people: "People", favorites: "Favorites", settings: "Settings" };
  $("viewTitle").textContent = titles[view] || "Gnomologia";
  $("viewSubtitle").textContent = view === "all" ? "A little archive of things worth keeping." : "";
  $("searchInput").hidden = view === "settings";
  $("quoteGrid").hidden = view === "people" || view === "settings";
  peopleView.hidden = view !== "people";
  settingsView.hidden = view !== "settings";
  render();
  closeSidebar();
}
function visibleQuotes() {
  let list = [...quotes];
  if (currentView === "favorites") list = list.filter(q => q.favorite);
  const term = $("searchInput").value.trim().toLowerCase();
  if (term) list = list.filter(q => (q.text + " " + q.person).toLowerCase().includes(term));
  return list;
}
function render() {
  if (currentView === "people") { renderPeople(); empty.hidden = true; return; }
  if (currentView === "settings") { empty.hidden = true; return; }
  const list = visibleQuotes();
  grid.innerHTML = "";
  list.forEach(q => {
    const card = document.createElement("button");
    card.type = "button";
    card.className = `quote-bubble ${q.color || "white"}`;
    card.dataset.id = q.id;
    card.setAttribute("aria-label", `${displayQuote(q.text)} — ${q.person}`);
    card.innerHTML = `<span class="quote-text">${escapeHTML(displayQuote(q.text))}</span><span class="quote-person">— ${escapeHTML(q.person)}</span>`;
    card.addEventListener("click", () => { if (!card.dataset.moved) openDetail(q.id); card.dataset.moved = ""; });
    card.addEventListener("dragstart", e => { draggedId = q.id; card.classList.add("dragging"); e.dataTransfer.effectAllowed = "move"; e.dataTransfer.setData("text/plain", q.id); });
    card.addEventListener("dragend", () => { draggedId = null; card.classList.remove("dragging"); document.querySelectorAll(".drag-over").forEach(el => el.classList.remove("drag-over")); });
    card.addEventListener("dragover", e => { e.preventDefault(); if (draggedId && draggedId !== q.id) card.classList.add("drag-over"); });
    card.addEventListener("dragleave", () => card.classList.remove("drag-over"));
    card.addEventListener("drop", e => { e.preventDefault(); card.classList.remove("drag-over"); reorder(draggedId, q.id); });
    card.draggable = true;
    addTouchDrag(card, q.id);
    grid.appendChild(card);
  });
  const noQuotes = list.length === 0;
  empty.hidden = !noQuotes;
  $("emptyTitle").textContent = quotes.length === 0 ? "Nothing here just yet." : currentView === "favorites" ? "No favorites yet." : "No matching quotes.";
  $("emptyText").textContent = quotes.length === 0 ? "Save a line you don't want to forget." : "Try another search, or add something new.";
  $("emptyAdd").hidden = currentView === "favorites" && quotes.length > 0;
}
function addTouchDrag(card, id) {
  let startX = 0, startY = 0, moved = false;
  card.addEventListener("pointerdown", e => { if (e.pointerType === "mouse") return; startX = e.clientX; startY = e.clientY; moved = false; });
  card.addEventListener("pointerup", e => {
    if (e.pointerType === "mouse") return;
    const dx = e.clientX - startX, dy = e.clientY - startY;
    if (Math.hypot(dx, dy) > 35) {
      moved = true; card.dataset.moved = "1";
      const target = document.elementFromPoint(e.clientX, e.clientY)?.closest(".quote-bubble");
      if (target && target.dataset.id && target.dataset.id !== id) reorder(id, target.dataset.id);
    }
  });
}
function reorder(fromId, toId) {
  if (!fromId || !toId || fromId === toId) return;
  const from = quotes.findIndex(q => q.id === fromId), to = quotes.findIndex(q => q.id === toId);
  if (from < 0 || to < 0) return;
  const [item] = quotes.splice(from, 1); quotes.splice(to, 0, item); save(); render();
}
function renderPeople() {
  const names = [...new Set(quotes.map(q => q.person.trim()).filter(Boolean))].sort((a,b) => a.localeCompare(b));
  peopleView.innerHTML = "";
  if (!names.length) { peopleView.innerHTML = `<div class="empty-state"><div class="empty-mark">“ ”</div><h2>Your people will appear here.</h2><p>Add a quote and give it a name.</p></div>`; return; }
  names.forEach(name => {
    const count = quotes.filter(q => q.person.toLowerCase() === name.toLowerCase()).length;
    const el = document.createElement("article"); el.className = "person-card";
    el.innerHTML = `<h3>${escapeHTML(name)}</h3><p>${count} ${count === 1 ? "quote" : "quotes"} saved</p><button type="button">View quotes →</button>`;
    el.querySelector("button").addEventListener("click", () => { $("searchInput").value = name; setView("all"); });
    peopleView.appendChild(el);
  });
}
function openDetail(id) {
  selectedId = id;
  const q = quotes.find(x => x.id === id); if (!q) return;
  $("detailQuote").textContent = displayQuote(q.text);
  $("detailPerson").textContent = `— ${q.person}`;
  $("detailCard").className = `detail-card ${q.color || "plum"}`;
  $("favoriteButton").textContent = q.favorite ? "♥" : "♡";
  $("favoriteButton").classList.toggle("is-favorite", !!q.favorite);
  detailDialog.showModal();
}
function openAdd() { $("quoteForm").reset(); addDialog.showModal(); setTimeout(() => $("quoteText").focus(), 50); }
function closeSidebar() { $("sidebar").classList.remove("open"); $("scrim").classList.remove("show"); }
function exportData() {
  const blob = new Blob([JSON.stringify({ app: "Gnomologia", version: 1, quotes }, null, 2)], {type:"application/json"});
  const url = URL.createObjectURL(blob); const a = document.createElement("a"); a.href = url; a.download = "gnomologia-backup.json"; a.click(); URL.revokeObjectURL(url);
}

document.querySelectorAll(".nav-item[data-view]").forEach(btn => btn.addEventListener("click", () => { $("searchInput").value = ""; setView(btn.dataset.view); }));
$("addButton").addEventListener("click", openAdd);
$("emptyAdd").addEventListener("click", openAdd);
$("searchInput").addEventListener("input", render);
$("quoteForm").addEventListener("submit", e => {
  e.preventDefault();
  const text = $("quoteText").value.trim(), person = $("personName").value.trim();
  if (!text || !person) return;
  quotes.unshift({ id: uid(), text, person, favorite: false, color: COLORS[Math.floor(Math.random()*COLORS.length)], createdAt: new Date().toISOString() });
  save(); addDialog.close(); setView("all");
});
$("favoriteButton").addEventListener("click", () => {
  const q = quotes.find(x => x.id === selectedId); if (!q) return;
  q.favorite = !q.favorite; save(); openDetail(q.id); render();
});
$("editButton").addEventListener("click", () => {
  const q = quotes.find(x => x.id === selectedId); if (!q) return;
  $("editQuoteText").value = q.text; $("editPersonName").value = q.person;
  detailDialog.close(); editDialog.showModal();
});
$("editForm").addEventListener("submit", e => {
  e.preventDefault(); const q = quotes.find(x => x.id === selectedId); if (!q) return;
  q.text = $("editQuoteText").value.trim(); q.person = $("editPersonName").value.trim();
  save(); editDialog.close(); render(); openDetail(q.id);
});
$("deleteButton").addEventListener("click", () => {
  const q = quotes.find(x => x.id === selectedId); if (!q) return;
  if (confirm("Delete this quote from your archive?")) { quotes = quotes.filter(x => x.id !== selectedId); save(); detailDialog.close(); render(); }
});
$("detailBack").addEventListener("click", () => detailDialog.close());
document.querySelectorAll("[data-close]").forEach(btn => btn.addEventListener("click", () => $(btn.dataset.close).close()));
$("exportButton").addEventListener("click", exportData);
$("importInput").addEventListener("change", async e => {
  const file = e.target.files[0]; if (!file) return;
  try {
    const data = JSON.parse(await file.text()); const incoming = Array.isArray(data) ? data : data.quotes;
    if (!Array.isArray(incoming)) throw new Error("Invalid backup");
    const clean = incoming.filter(q => q && typeof q.text === "string" && typeof q.person === "string").map(q => ({ id: q.id || uid(), text: q.text, person: q.person, favorite: !!q.favorite, color: COLORS.includes(q.color) ? q.color : "white", createdAt: q.createdAt || new Date().toISOString() }));
    if (confirm(`Import ${clean.length} quotes? This will add them to your current archive.`)) { quotes = [...clean, ...quotes]; save(); render(); alert("Your quotes have been imported."); }
  } catch { alert("That file doesn't look like a Gnomologia backup."); }
  e.target.value = "";
});
$("menuButton").addEventListener("click", () => { $("sidebar").classList.add("open"); $("scrim").classList.add("show"); });
$("scrim").addEventListener("click", closeSidebar);

if ("serviceWorker" in navigator && location.protocol.startsWith("http")) {
  window.addEventListener("load", () => navigator.serviceWorker.register("./service-worker.js").catch(() => {}));
}
render();
