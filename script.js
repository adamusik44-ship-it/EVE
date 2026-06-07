/* ===== EVE — scroll-driven frame sequence ===== */

// Auto-generated frame metadata (set by the extraction build step)
const FRAME_COUNT = window.EVE_FRAME_COUNT || 121;
const FRAME_PATH = (i) => `frames/frame_${String(i).padStart(4, "0")}.jpg`;

const canvas = document.getElementById("frameCanvas");
const ctx = canvas.getContext("2d", { alpha: false });
const loader = document.getElementById("loader");
const loaderFill = document.getElementById("loaderFill");
const loaderPct = document.getElementById("loaderPct");

const images = new Array(FRAME_COUNT);
let loadedCount = 0;
let imgW = 0, imgH = 0;
let currentFrame = -1;

/* ---------- Canvas sizing (cover-fit, retina-aware) ---------- */
function resizeCanvas() {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = Math.floor(window.innerWidth * dpr);
  canvas.height = Math.floor(window.innerHeight * dpr);
  canvas.style.width = window.innerWidth + "px";
  canvas.style.height = window.innerHeight + "px";
  currentFrame = -1; // force redraw
  drawFrame(frameForScroll());
}

function drawImageCover(img) {
  if (!img || !img.complete) return;
  const cw = canvas.width, ch = canvas.height;
  const iw = img.naturalWidth, ih = img.naturalHeight;
  const scale = Math.max(cw / iw, ch / ih);
  const w = iw * scale, h = ih * scale;
  const x = (cw - w) / 2, y = (ch - h) / 2;
  ctx.drawImage(img, x, y, w, h);
}

function drawFrame(index) {
  index = Math.max(0, Math.min(FRAME_COUNT - 1, index));
  if (index === currentFrame) return;
  const img = images[index];
  if (img && img.complete) {
    drawImageCover(img);
    currentFrame = index;
  }
}

/* ---------- Scroll → frame mapping ---------- */
function frameForScroll() {
  const section = document.getElementById("scrollVideo");
  const rect = section.getBoundingClientRect();
  const total = section.offsetHeight - window.innerHeight;
  const scrolled = Math.min(Math.max(-rect.top, 0), total);
  const progress = total > 0 ? scrolled / total : 0;
  return Math.round(progress * (FRAME_COUNT - 1));
}

let ticking = false;
function onScroll() {
  if (!ticking) {
    ticking = true;
    requestAnimationFrame(() => {
      drawFrame(frameForScroll());
      fadeHero();
      ticking = false;
    });
  }
}

/* ---------- Hero overlay fade ---------- */
const heroOverlay = document.querySelector(".hero-overlay");
function fadeHero() {
  const section = document.getElementById("scrollVideo");
  const total = section.offsetHeight - window.innerHeight;
  const scrolled = Math.min(Math.max(-section.getBoundingClientRect().top, 0), total);
  const p = total > 0 ? scrolled / total : 0;
  const o = Math.max(0, 1 - p * 4);
  heroOverlay.style.opacity = o;
}

/* ---------- Preload ---------- */
function preload() {
  for (let i = 0; i < FRAME_COUNT; i++) {
    const img = new Image();
    img.onload = img.onerror = () => {
      loadedCount++;
      const pct = Math.round((loadedCount / FRAME_COUNT) * 100);
      loaderFill.style.width = pct + "%";
      loaderPct.textContent = pct + "%";
      if (i === 0) { imgW = img.naturalWidth; imgH = img.naturalHeight; drawFrame(0); }
      if (loadedCount === FRAME_COUNT) onAllLoaded();
    };
    img.src = FRAME_PATH(i + 1);
    images[i] = img;
  }
}

function onAllLoaded() {
  loader.classList.add("hidden");
  resizeCanvas();
  drawFrame(frameForScroll());
}

/* ---------- Reveal panels ---------- */
function setupReveal() {
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => { if (e.isIntersecting) e.target.classList.add("in-view"); });
  }, { threshold: 0, rootMargin: "0px 0px -8% 0px" });
  document.querySelectorAll(".panel").forEach((p) => io.observe(p));
}

/* ---------- i18n ---------- */
function applyLang(lang) {
  const dict = (window.EVE_I18N || {})[lang];
  if (!dict) return;
  document.documentElement.lang = lang;
  document.documentElement.dir = dict.dir || "ltr";
  document.querySelectorAll("[data-i18n]").forEach((el) => {
    const key = el.getAttribute("data-i18n");
    if (dict[key] == null) return;
    if (el.tagName === "META") el.setAttribute("content", dict[key]);
    else el.textContent = dict[key];
  });
  document.querySelectorAll("#langSwitch button").forEach((b) => {
    b.classList.toggle("active", b.dataset.lang === lang);
  });
  try { localStorage.setItem("eve_lang", lang); } catch (e) {}
}

function setupLang() {
  const supported = ["he", "ru", "fr"];
  let saved = null;
  try { saved = localStorage.getItem("eve_lang"); } catch (e) {}
  const initial = supported.includes(saved) ? saved : "he";
  document.getElementById("langSwitch").addEventListener("click", (e) => {
    const btn = e.target.closest("button[data-lang]");
    if (btn) applyLang(btn.dataset.lang);
  });
  applyLang(initial);
}

/* ---------- Init ---------- */
window.addEventListener("scroll", onScroll, { passive: true });
window.addEventListener("resize", resizeCanvas);
document.getElementById("year").textContent = new Date().getFullYear();
setupLang();
resizeCanvas();
setupReveal();
preload();
