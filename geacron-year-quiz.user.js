// ==UserScript==
// @name         GeaCron Year Quiz Helper
// @namespace    https://github.com/y2studyabout-hash/geacron-year-quiz
// @version      1.0.0
// @description  GeaCronの年号を隠して、古代〜現代までランダム出題＆年号当てクイズができる拡張
// @match        *://*.geacron.com/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=geacron.com
// @downloadURL  https://raw.githubusercontent.com/y2studyabout-hash/geacron-year-quiz/main/geacron-year-quiz.user.js
// @updateURL    https://raw.githubusercontent.com/y2studyabout-hash/geacron-year-quiz/main/geacron-year-quiz.user.js
// @grant        none
// @run-at       document-end
// ==/UserScript==

(function () {
  "use strict";

  let fakeYear = null;
  let lastYear = null;
  let lastUpdateButton = null; // 更新ボタンを記録

  // ====== 要素取得 ======
  function getCenterInput() {
    return document.querySelector('input[name="fechat"]');
  }

  function getTopRightInput() {
    return document.querySelector('input[name="sliderValue2"]');
  }

  function getMapDiv() {
    return document.getElementById("map");
  }

  // ====== 更新ボタン特定 ======
  function findUpdateButton() {
    if (lastUpdateButton && document.body.contains(lastUpdateButton)) {
      return lastUpdateButton;
    }
    const input = getCenterInput();
    if (!input) return null;
    const root = input.form || input.closest("form") || input.parentElement || document;
    const imgs = root.querySelectorAll("img");
    for (const img of imgs) {
      const title = (img.title || "").toLowerCase();
      const oc = (img.getAttribute("onclick") || "").toLowerCase();
      if (
        title.includes("update") ||
        title.includes("refresh") ||
        oc.includes("fechat") ||
        oc.includes("submatiempo") ||
        oc.includes("fecha")
      ) {
        lastUpdateButton = img;
        return img;
      }
    }
    return null;
  }

  // ====== 右上年号 隠す / 戻す ======
  function hideTopRight() {
    const el = getTopRightInput();
    if (!el) return;
    if (!el.dataset.gcOriginalDisplay) {
      el.dataset.gcOriginalDisplay = el.style.display || "";
    }
    el.style.display = "none";
  }

  function showTopRight() {
    const el = getTopRightInput();
    if (!el || !el.dataset.gcOriginalDisplay) return;
    el.style.display = el.dataset.gcOriginalDisplay;
    delete el.dataset.gcOriginalDisplay;
  }

  // ====== 更新ボタンをクリック ======
  function clickYearUpdateButton(input) {
    const btn = findUpdateButton();
    if (btn) btn.click();
  }

  // ====== 地図へ「年が変わった」と通知 ======
  function notifyMapUpdated(input) {
    try {
      if (typeof window.submitenter === "function") {
        const e = { keyCode: 13, which: 13 };
        window.submitenter(input, e);
      }
    } catch {}

    try {
      if (typeof window.submatiempo === "function") {
        window.submatiempo(false);
      }
    } catch {}

    try {
      ["keydown", "keypress", "keyup"].forEach((t) =>
        input.dispatchEvent(
          new KeyboardEvent(t, {
            key: "Enter",
            keyCode: 13,
            which: 13,
            bubbles: true,
          })
        )
      );
    } catch {}

    try {
      clickYearUpdateButton(input);
    } catch {}
  }

  // ====== 年号セット＋マスク ======
  function setYearAndMask(year, opt = { updateHistory: true }) {
    const input = getCenterInput();
    if (!input) {
      alert("中央の年号入力欄（fechat）が見つかりません。");
      return;
    }

    if (opt.updateHistory) {
      const cur = parseInt(input.value, 10);
      if (!Number.isNaN(cur)) lastYear = cur;
    }

    fakeYear = year;
    input.value = String(year);

    notifyMapUpdated(input);

    input.style.color = "transparent";
    input.style.caretColor = "transparent";

    hideTopRight();
  }

  // ====== 手入力マスク ======
  function applyMask() {
    const input = getCenterInput();
    if (!input) {
      alert("中央の年号入力欄（fechat）が見つかりません。");
      return;
    }

    if (!input.dataset.gcRealYear) input.dataset.gcRealYear = input.value;

    const y = prompt(
      "表示したい年号を入力してください（紀元前は負の数）",
      fakeYear || input.value || ""
    );
    if (!y) return;

    const n = parseInt(y, 10);
    if (Number.isNaN(n)) {
      alert("整数の年号を入力してください。");
      return;
    }

    setYearAndMask(n, { updateHistory: true });
  }

  // ====== 時代定義・ランダム ======
  const ERAS = {
    ancient: { label: "古代", min: -3000, max: 500 },
    medieval: { label: "中世", min: 500, max: 1500 },
    earlymod: { label: "近代", min: 1500, max: 1900 },
    modern: { label: "現代", min: 1900, max: 2025 },
  };

  function randomInt(a, b) {
    return Math.floor(Math.random() * (b - a + 1)) + a;
  }

  function getEraKeyForYear(y) {
    if (y <= ERAS.ancient.max) return "ancient";
    if (y <= ERAS.medieval.max) return "medieval";
    if (y <= ERAS.earlymod.max) return "earlymod";
    return "modern";
  }

  function applyRandomEra(k) {
    const e = ERAS[k];
    if (!e) {
      alert("指定した時代の範囲が見つかりません。");
      return;
    }
    setYearAndMask(randomInt(e.min, e.max));
  }

  function applyBiasedRandom() {
    //const w = [
    //  { k: "ancient", w: 1 },
    //  { k: "medieval", w: 1 },
    //  { k: "earlymod", w: 4 },
    //  { k: "modern", w: 2 },
    //];
    //let t = w.reduce((s, x) => s + x.w, 0),
    //  r = Math.random() * t;
    //let k = w[0].k;
    //for (const x of w) {
    //  if (r < x.w) {
    //    k = x.k;
    //    break;
    //  }
    //  r -= x.w;
    //}
    //applyRandomEra(k);
  }

  // ====== 戻る & 解除 ======
  function goBackOneStep() {
    if (lastYear == null) {
      alert("直前の年がありません。");
      return;
    }
    setYearAndMask(lastYear, { updateHistory: false });
  }

  function clearGuessInput() {
    const gi = document.getElementById("gc-quiz-input");
    if (gi) gi.value = "";
  }

  function unmask() {
    const input = getCenterInput();
    if (input && input.dataset.gcRealYear) {
      input.value = input.dataset.gcRealYear;
      notifyMapUpdated(input);
      delete input.dataset.gcRealYear;
    }
    if (input) {
      input.style.color = "";
      input.style.caretColor = "";
    }
    showTopRight();
    fakeYear = null;
    lastYear = null;

    const r = document.getElementById("gc-quiz-result");
    if (r) r.textContent = "";
    clearGuessInput();
  }

  // ====== クイズ許容誤差 ======
  function toleranceForYear(y) {
    switch (getEraKeyForYear(y)) {
      case "ancient":
        return 50;
      case "medieval":
        return 20;
      case "earlymod":
        return 10;
      case "modern":
        return 5;
    }
    return 20;
  }

  // ====== 履歴ラベル ======
  function positionHistoryLabel(historyEl) {
    if (!historyEl) return;
    const btn = findUpdateButton();
    if (!btn) return;

    const r = btn.getBoundingClientRect();
    historyEl.style.position = "fixed";
    historyEl.style.top = `${r.top}px`;
    historyEl.style.left = `${r.right + 8}px`;
  }

  function updateHistoryLabel(text, isCorrect) {
    let h = document.getElementById("gc-quiz-history");
    if (!h) {
      h = document.createElement("div");
      h.id = "gc-quiz-history";
     Object.assign(h.style, {
         zIndex: 2147483647,
         fontSize: "12px",
         padding: "2px 8px",
         borderRadius: "999px",
         background: "rgba(255, 255, 255, 0.85)", // 柔らかい白・半透明
         color: "#333333",
         border: "1px solid rgba(0,0,0,0.08)",
         whiteSpace: "nowrap",
         textShadow: "0 0 1px rgba(255,255,255,0.6)",
         pointerEvents: "none",
     });

      document.body.appendChild(h);
    }
    h.textContent = text;
    h.style.color = isCorrect ? "#3b6e4c" : "#8b3a3a";
    h.style.fontWeight = "500";              // 少しだけ太く
    h.style.letterSpacing = "0.2px";         // 文字間を微調整
    positionHistoryLabel(h);
  }

  // ====== 答え合わせ ======
function checkAnswer() {
  const center = getCenterInput();
  if (!center) {
    alert("中央の年号入力欄が見つかりません。");
    return;
  }
  const real = parseInt(center.value, 10);
  if (Number.isNaN(real)) {
    alert("まずランダム/年号入力で年を決めてください。");
    return;
  }

  const gi = document.getElementById("gc-quiz-input");
  const gr = document.getElementById("gc-quiz-result");
  if (!gi || !gr) return;

  const g = parseInt(gi.value, 10);
  if (Number.isNaN(g)) {
    alert("推測する年号を整数で入力してください。");
    return;
  }

  const tol = toleranceForYear(real);
  const diff = Math.abs(g - real);
  const eraKey = getEraKeyForYear(real);
  const eraLabel = ERAS[eraKey].label;
  const isCorrect = diff <= tol;

  // 吹き出しのメッセージ
  if (isCorrect) {
    gr.textContent = `正解！ 本当の年は ${real} 年（${eraLabel}）。許容 ±${tol} 年 / 誤差 ${diff} 年`;
    gr.style.color = "#2e7d32"; // 少し柔らかい緑
  } else {
    gr.textContent = `不正解… 本当の年は ${real} 年（${eraLabel}）。許容 ±${tol} 年 / 誤差 ${diff} 年`;
    gr.style.color = "#c62828"; // 少し柔らかい赤
  }

  // すぐ表示（opacityを1に）
  gr.style.opacity = "1";

  // 5秒後にフェードアウト → その後テキストを消す
  clearTimeout(window.gcQuizFadeTimer);
  clearTimeout(window.gcQuizFadeTimer2);

  window.gcQuizFadeTimer = setTimeout(() => {
    if (!gr) return;
    gr.style.opacity = "0"; // 0.5秒かけてフェードアウト（transition指定済み）

    window.gcQuizFadeTimer2 = setTimeout(() => {
      if (gr && gr.style.opacity === "0") {
        gr.textContent = "";
      }
    }, 600); // transition 0.5s より少し長め
  }, 5000); // 表示維持時間

  // 更新ボタン右の履歴（直前1回分だけ）
  const shortText = `${isCorrect ? "◯" : "×"} ${real}年（${eraLabel}）±${tol} 差${diff}`;
  updateHistoryLabel(shortText, isCorrect);
}


  // ====== UI配置：地図コントローラ左端 ======
  function positionBar(bar) {
    const input = getCenterInput();
    const mapDiv = getMapDiv();

    if (input && mapDiv) {
      const inputRect = input.getBoundingClientRect();
      const mapRect = mapDiv.getBoundingClientRect();

      const top = inputRect.top;
      const left = mapRect.left + 4;

      bar.style.position = "fixed";
      bar.style.top = `${top}px`;
      bar.style.left = `${left}px`;
      bar.style.transform = "none";
    } else {
      bar.style.position = "fixed";
      bar.style.top = "110px";
      bar.style.left = "50%";
      bar.style.transform = "translateX(-50%)";
    }
  }

  // ====== UI作成 ======
  function addBar() {
    if (!getCenterInput()) return;

    let bar = document.getElementById("gc-yearmask-bar");
    if (!bar) {
      bar = document.createElement("div");
      bar.id = "gc-yearmask-bar";
      Object.assign(bar.style, {
        position: "fixed",
        zIndex: 2147483647,
        display: "flex",
        alignItems: "center",
        gap: "4px",
        padding: "3px 6px",
        borderRadius: "999px",
        background: "rgba(0,0,0,0.18)",
        backdropFilter: "blur(4px)",
        fontFamily: "sans-serif",
      });
      document.body.appendChild(bar);
    }

    if (bar.dataset.gcInitialized) {
      positionBar(bar);
      return;
    }

    function btn(text, color, handler, clearGuess = true) {
      const b = document.createElement("button");
      b.textContent = text;
      Object.assign(b.style, {
        border: "none",
        borderRadius: "999px",
        padding: "2px 6px",
        fontSize: "11px",
        color: "#fff",
        background: color,
        cursor: "pointer",
        whiteSpace: "nowrap",
      });
      b.onclick = () => {
        if (clearGuess) clearGuessInput(); // 他ボタン押下で入力欄クリア
        handler();
      };
      return b;
    }

    bar.innerHTML = "";

    const gi = document.createElement("input");
    gi.id = "gc-quiz-input";
    gi.type = "number";
    gi.placeholder = "年号";
    Object.assign(gi.style, {
      width: "70px",
      padding: "1px 4px",
      borderRadius: "999px",
      border: "1px solid #ccc",
      fontSize: "11px",
      outline: "none",
    });

    const gr = document.createElement("div");
      gr.id = "gc-quiz-result";
      Object.assign(gr.style, {
      fontSize: "12px",
      padding: "2px 8px",
      borderRadius: "999px",
      background: "rgba(255, 255, 255, 0.85)", // やわらかい白・半透明
      color: "#333333",
      border: "1px solid rgba(0,0,0,0.08)",
      whiteSpace: "nowrap",
      textShadow: "0 0 1px rgba(255,255,255,0.6)",
      position: "absolute",
      bottom: "100%",
      left: "50%",
      transform: "translate(-50%, -4px)",
      pointerEvents: "none",
      opacity: "0",                     // 最初は非表示
      transition: "opacity 0.5s ease",  // フェード用
      });

    // ボタン類（答え合わせだけ clearGuess=false）
    bar.appendChild(btn("解除", "#999", unmask));
    bar.appendChild(btn("戻る", "#777", goBackOneStep));
    bar.appendChild(btn("古代R", "#777711", () => applyRandomEra("ancient")));
    bar.appendChild(btn("中世R", "#aa6633", () => applyRandomEra("medieval")));
    bar.appendChild(btn("近代R", "#8844aa", () => applyRandomEra("earlymod")));
    bar.appendChild(btn("現代R", "#5555aa", () => applyRandomEra("modern")));
    //bar.appendChild(btn("偏R", "#0066cc", applyBiasedRandom));
    bar.appendChild(btn("年号入力", "#333", applyMask));

    bar.appendChild(gi);
    bar.appendChild(btn("答え合わせ", "#009966", checkAnswer, false));
    bar.appendChild(gr); // 吹き出しはバーの上

    bar.dataset.gcInitialized = "1";
    positionBar(bar);
  }

  // ====== 初期化 ======
  function init() {
    addBar();

    const ob = new MutationObserver(() => {
      addBar();
      if (fakeYear != null) hideTopRight();

      // 更新ボタンが再描画された場合に履歴ラベル位置を再計算
      const h = document.getElementById("gc-quiz-history");
      if (h) positionHistoryLabel(h);
    });

    ob.observe(document.body, { childList: true, subtree: true });

    window.addEventListener("resize", () => {
      const bar = document.getElementById("gc-yearmask-bar");
      if (bar) positionBar(bar);
      const h = document.getElementById("gc-quiz-history");
      if (h) positionHistoryLabel(h);
    });
  }

  init();
})();
