/* Gemini TTS 비교 글 차트 — 의존성 없는 SVG 렌더러.
   <div class="gviz" data-viz="이름"></div> 자리에 그린다. 값은 본문 표(「표로 보기」)와 같다. */
(function () {
  "use strict";
  var NS = "http://www.w3.org/2000/svg";
  var M = ["3.8 Flash", "3.8 Flash-Lite", "3.1 Flash", "2.5 Pro"];
  var pct = function (v) { return (Math.round(v * 10) / 10).toFixed(1) + "%"; };
  var usd = function (v) { return "$" + v.toFixed(3); };
  var frac = function (v, d) { return d.label; };

  var D = {
    cost: {
      type: "hbar", title: "오디오 1분당 비용", sub: "응답 usage 실측(초당 32토큰) 기준. 2.5 Pro는 단가가 같은 3.1 값",
      cats: M, series: ["2026년 말까지(할인)", "2027년부터"],
      values: [[0.017, 0.035], [0.012, 0.023], [0.038, 0.038], [0.038, 0.038]], fmt: usd, tick: usd
    },
    pg: {
      type: "hbar", title: "두 번째 「PostgreSQL」을 다른 단어로 읽은 비율", sub: "판정 모델 두 개의 판정이 일치한 것 기준",
      cats: ["3.8 Flash", "3.8 Flash + 한글로 적음", "3.8 Flash-Lite", "3.1 Flash"], series: ["다른 단어로 읽음"],
      values: [[66.7], [0], [0], [0]], labels: [["2/3"], ["0/3"], ["0/3"], ["0/2"]], emphasis: 0, max: 100, fmt: pct, tick: function (v) { return v + "%"; }
    },
    consistency: {
      type: "hbar", title: "청크끼리 목소리 음 높이가 벌어진 정도", sub: "한 편 안에서 청크별 음 높이 중앙값의 차이, 3회 평균. 짧을수록 안정적",
      cats: M, series: ["진행자(Leda)", "게스트(Charon)"],
      values: [[8.2, 15.6], [5.9, 12.6], [11.8, 14.9], [6.1, 6.7]],
      extra: [["최악 11.5%", "최악 22.6%"], ["최악 8.1%", "최악 22.5%"], ["최악 20.1%", "최악 25.3%"], ["최악 9.8%", "최악 8.2%"]],
      fmt: pct, tick: function (v) { return v + "%"; }
    },
    similarity: {
      type: "range", title: "새 원본 녹음과 닮은 정도", sub: "화자 임베딩 코사인 유사도. 선은 최소~최대, 점은 평균",
      cats: ["Gemini 3.8 Flash (5개)", "Gemini 3.8 Flash-Lite (5개)", "Gemini 3.1 Flash (2개)", "로컬 Qwen3-TTS (5개)", "대조: 다른 사람(Charon)"],
      ranges: [[0.917, 0.936, 0.927], [0.892, 0.936, 0.920], [0.843, 0.855, 0.849], [0.929, 0.956, 0.943], [0.595, 0.628, 0.612]],
      muted: [4], min: 0.5, max: 1.0, ref: { v: 0.912, label: "실제 녹음끼리 0.912" }, fmt: function (v) { return v.toFixed(3); }
    },
    usable: {
      type: "hbar", title: "대본대로 끝까지 읽은 결과의 비율", sub: "끝부분을 받아써 확인. 로컬은 버리는 문장이 남거나 끝이 잘린 것을 불량으로 셈",
      cats: ["Gemini 3.8 Flash", "Gemini 3.8 Flash-Lite", "로컬 Qwen3-TTS ← 새 원본", "로컬 Qwen3-TTS ← My Voice", "로컬 Qwen3-TTS ← My Voice 2"], series: ["정상"],
      values: [[100], [100], [62.5], [87.5], [50]], labels: [["5/5"], ["5/5"], ["5/8"], ["7/8"], ["4/8"]], max: 100, fmt: pct, tick: function (v) { return v + "%"; }
    },
    voices: {
      type: "hbar", title: "목소리를 바꿨을 때 청크끼리 음 높이가 벌어진 정도", sub: "3.8 Flash, 같은 대본·같은 청크, 3회 평균. 짧을수록 안정적",
      cats: ["한국어 목소리", "Voice design 목소리", "Leda / Charon (기본)"], series: ["진행자", "게스트"],
      values: [[8.0, 8.4], [12.0, 16.1], [8.2, 15.6]],
      extra: [["최악 10.5%", "최악 17.3%"], ["최악 14.7%", "최악 17.8%"], ["최악 11.5%", "최악 22.6%"]],
      fmt: pct, tick: function (v) { return v + "%"; }
    },
    style: {
      type: "multi", title: "style 지시에 따라 달라진 수치", sub: "3.8 Flash, 같은 문장, 2회 평균. 각 지시가 바꿔야 할 값을 강조했다",
      panels: [
        { title: "길이(초)", cats: ["지시 없음", "속삭임", "신나게 외침", "아주 느리게"], values: [5.9, 8.2, 6.9, 13.8], emphasis: 3, fmt: function (v) { return v.toFixed(1) + "초"; } },
        { title: "유성음 비율", cats: ["지시 없음", "속삭임", "신나게 외침", "아주 느리게"], values: [0.73, 0.02, 0.62, 0.65], emphasis: 1, max: 1, fmt: function (v) { return v.toFixed(2); } },
        { title: "음 높이(Hz)", cats: ["지시 없음", "속삭임", "신나게 외침", "아주 느리게"], values: [133, null, 246, 116], emphasis: 2, fmt: function (v) { return Math.round(v) + "Hz"; }, nullLabel: "측정 불가(성대 울림 없음)" }
      ]
    },
    longcer: {
      type: "hbar", title: "5분 대본을 한 번에 만들었을 때 구간별 오류율(CER)", sub: "2회 × 판정 모델 2개 평균. 뒤로 갈수록 늘지 않았다",
      cats: ["앞 1/3", "중간 1/3", "뒤 1/3"], series: ["3.8 Flash", "3.1 Flash"],
      values: [[2.8, 2.03], [2.53, 1.45], [1.7, 1.6]], fmt: pct, tick: function (v) { return v + "%"; }
    },
    longtime: {
      type: "hbar", title: "5분 분량을 만드는 데 걸린 시간", sub: "2회 평균",
      cats: ["3.8 Flash", "3.1 Flash"], series: ["생성 시간"], values: [[35.2], [106.8]], emphasis: 0,
      fmt: function (v) { return v.toFixed(0) + "초"; }, tick: function (v) { return v + "초"; }
    }
  };

  function el(tag, attrs, parent) {
    var n = document.createElementNS(NS, tag);
    for (var k in attrs) n.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(n);
    return n;
  }
  function div(cls, text, parent) {
    var n = document.createElement("div"); if (cls) n.className = cls;
    if (text != null) n.textContent = text; if (parent) parent.appendChild(n); return n;
  }
  var ctx = document.createElement("canvas").getContext("2d");
  function textW(t, px, host) {
    var ff = getComputedStyle(host).fontFamily || "sans-serif";
    ctx.font = px + "px " + ff; return ctx.measureText(t).width;
  }
  // 눈금 간격을 1·2·2.5·5 × 10^k 중에서 골라 4~5칸이 되게 한다
  function niceStep(v) {
    var p = Math.pow(10, Math.floor(Math.log10(v))), m = v / p;
    return (m <= 1 ? 1 : m <= 2 ? 2 : m <= 2.5 ? 2.5 : m <= 5 ? 5 : 10) * p;
  }
  // 4px 둥근 끝, 기준선 쪽은 직각
  function barPath(x, y, w, h) {
    if (w <= 0) return "";
    var r = Math.min(4, w, h / 2);
    return "M" + x + "," + y + "H" + (x + w - r) + "Q" + (x + w) + "," + y + " " + (x + w) + "," + (y + r) +
      "V" + (y + h - r) + "Q" + (x + w) + "," + (y + h) + " " + (x + w - r) + "," + (y + h) + "H" + x + "Z";
  }
  function colorVar(i) { return i === 0 ? "var(--gv-s1)" : "var(--gv-s2)"; }

  function tipper(root) {
    var tip = div("gviz-tip", null, root);
    return {
      show: function (evt, value, label, color) {
        tip.textContent = "";
        var b = document.createElement("b"); b.textContent = value; tip.appendChild(b);
        var line = document.createElement("span");
        if (color) { var k = document.createElement("i"); k.className = "k"; k.style.background = color; line.appendChild(k); }
        line.appendChild(document.createTextNode(label)); tip.appendChild(line);
        tip.style.display = "block";
        var rb = root.getBoundingClientRect(), x, y;
        if (evt && evt.clientX != null && evt.type !== "focus") { x = evt.clientX - rb.left; y = evt.clientY - rb.top; }
        else { var tb = evt.target.getBoundingClientRect(); x = tb.left - rb.left + tb.width / 2; y = tb.top - rb.top; }
        var w = tip.offsetWidth;
        tip.style.left = Math.max(0, Math.min(rb.width - w, x - w / 2)) + "px";
        tip.style.top = (y - tip.offsetHeight - 10) + "px";
      },
      hide: function () { tip.style.display = "none"; }
    };
  }
  function bindHit(hit, mark, tp, value, label, color) {
    hit.setAttribute("tabindex", "0"); hit.setAttribute("role", "img"); hit.setAttribute("aria-label", label + ": " + value);
    var on = function (e) { if (mark) mark.classList.add("gv-hover"); tp.show(e, value, label, color); };
    var off = function () { if (mark) mark.classList.remove("gv-hover"); tp.hide(); };
    hit.addEventListener("pointermove", on); hit.addEventListener("pointerenter", on); hit.addEventListener("focus", on);
    hit.addEventListener("pointerleave", off); hit.addEventListener("blur", off);
  }

  function hbar(host, spec, width, tp, opts) {
    opts = opts || {};
    var S = spec.series ? spec.series.length : 1, fs = 12.5;
    var vals = spec.values.map(function (r) { return Array.isArray(r) ? r : [r]; });
    var need = Math.max.apply(null, spec.cats.map(function (c) { return textW(c, fs, host); })) + 10;
    var stack = need > width * 0.42;            // 좁은 화면: 항목 이름을 막대 위 줄로 올린다
    var labW = stack ? 1 : need, capH = stack ? 17 : 0;
    var valW = 58, plotW = Math.max(60, width - labW - valW);
    var barH = S > 1 ? 11 : 14, gap = 2, rowGap = stack ? 10 : 12;
    var rowH = S * barH + (S - 1) * gap, top = 4, axisH = opts.noAxis ? 4 : 20;
    var H = top + spec.cats.length * (capH + rowH + rowGap) - rowGap + axisH;
    var flat = []; vals.forEach(function (r) { r.forEach(function (v) { if (v != null) flat.push(v); }); });
    var dmax = Math.max.apply(null, flat), step = niceStep((spec.max || dmax) / 4);
    var max = spec.max || Math.ceil((dmax * 1.001) / step) * step;
    var sx = function (v) { return labW + (v / max) * plotW; };
    var svg = el("svg", { viewBox: "0 0 " + width + " " + H, height: H, role: "group" }, host);
    var ticks = []; for (var tv = 0; tv <= max + step * 1e-6; tv += step) ticks.push(tv);
    if (!opts.noAxis) {
      ticks.forEach(function (t, i) {
        el("line", { x1: sx(t), x2: sx(t), y1: top - 2, y2: H - axisH + 2, stroke: i === 0 ? "var(--gv-axis)" : "var(--gv-grid)", "stroke-width": 1 }, svg);
        var edge = sx(t) < 16 ? "start" : sx(t) > width - 16 ? "end" : "middle";   // 가장자리 눈금이 잘리지 않게
        var tl = el("text", { x: sx(t), y: H - 4, "text-anchor": edge, "font-size": 11, fill: "var(--gv-muted)" }, svg);
        tl.textContent = spec.tick ? spec.tick(+t.toFixed(4)) : t;
      });
    } else {
      el("line", { x1: sx(0), x2: sx(0), y1: top - 2, y2: H - axisH + 2, stroke: "var(--gv-axis)", "stroke-width": 1 }, svg);
    }
    spec.cats.forEach(function (c, ci) {
      var yc = top + ci * (capH + rowH + rowGap), y0 = yc + capH;
      var cl = stack ? el("text", { x: 0, y: yc + 12, "font-size": fs, fill: "var(--gv-ink-2)" }, svg)
                     : el("text", { x: labW - 10, y: y0 + rowH / 2 + 4, "text-anchor": "end", "font-size": fs, fill: "var(--gv-ink-2)" }, svg);
      cl.textContent = c;
      vals[ci].forEach(function (v, si) {
        var y = y0 + si * (barH + gap);
        var color = spec.emphasis != null ? (ci === spec.emphasis ? "var(--gv-s1)" : "var(--gv-de)") : colorVar(si);
        var mark = null, lab, shown;
        if (v == null) { shown = spec.nullLabel || "없음"; }
        else {
          mark = el("path", { d: barPath(sx(0), y, sx(v) - sx(0), barH), fill: color, class: "gv-mark" }, svg);
          shown = spec.labels ? spec.labels[ci][si] : spec.fmt(v);
        }
        lab = el("text", { x: (v == null ? sx(0) : sx(v)) + 6, y: y + barH / 2 + 4, "font-size": 11.5, fill: v == null ? "var(--gv-muted)" : "var(--gv-ink-2)" }, svg);
        lab.textContent = shown;
        var hit = el("rect", { x: Math.max(0, labW - 4), y: y - gap / 2 - (si === 0 ? capH : 0), width: plotW + valW, height: barH + gap + (si === 0 ? capH : 0), class: "gv-hit" }, svg);
        var name = c + (S > 1 ? " · " + spec.series[si] : "");
        var val = v == null ? shown : (spec.labels ? spec.labels[ci][si] + " (" + spec.fmt(v) + ")" : spec.fmt(v));
        if (spec.extra) val += " · " + spec.extra[ci][si];
        bindHit(hit, mark, tp, val, name, v == null ? null : color);
      });
    });
  }

  function range(host, spec, width, tp) {
    var fs = 12.5;
    var need = Math.max.apply(null, spec.cats.map(function (c) { return textW(c, fs, host); })) + 10;
    var stack = need > width * 0.42, capH = stack ? 16 : 0;
    var labW = stack ? 8 : need;
    var plotW = Math.max(80, width - labW - 16), rowH = 26 + capH, top = 18, axisH = 20;
    var H = top + spec.cats.length * rowH + axisH;
    var sx = function (v) { return labW + ((v - spec.min) / (spec.max - spec.min)) * plotW; };
    var svg = el("svg", { viewBox: "0 0 " + width + " " + H, height: H, role: "group" }, host);
    for (var t = spec.min; t <= spec.max + 1e-9; t += 0.1) {
      el("line", { x1: sx(t), x2: sx(t), y1: top - 4, y2: H - axisH + 2, stroke: "var(--gv-grid)", "stroke-width": 1 }, svg);
      var tl = el("text", { x: sx(t), y: H - 4, "text-anchor": "middle", "font-size": 11, fill: "var(--gv-muted)" }, svg);
      tl.textContent = t.toFixed(1);
    }
    if (spec.ref) {
      el("line", { x1: sx(spec.ref.v), x2: sx(spec.ref.v), y1: top - 6, y2: H - axisH + 2, stroke: "var(--gv-ink-2)", "stroke-width": 1 }, svg);
      var rl = el("text", { x: sx(spec.ref.v), y: top - 8, "text-anchor": "middle", "font-size": 11, fill: "var(--gv-ink-2)" }, svg);
      rl.textContent = spec.ref.label;
    }
    spec.cats.forEach(function (c, i) {
      var y = top + i * rowH + capH + (rowH - capH) / 2, r = spec.ranges[i];
      var col = spec.muted && spec.muted.indexOf(i) >= 0 ? "var(--gv-de)" : "var(--gv-s1)";
      var cl = stack ? el("text", { x: 0, y: y - 9, "font-size": fs, fill: "var(--gv-ink-2)" }, svg)
                     : el("text", { x: labW - 10, y: y + 4, "text-anchor": "end", "font-size": fs, fill: "var(--gv-ink-2)" }, svg);
      cl.textContent = c;
      el("line", { x1: sx(r[0]), x2: sx(r[1]), y1: y, y2: y, stroke: col, "stroke-width": 2, "stroke-linecap": "round" }, svg);
      var dot = el("circle", { cx: sx(r[2]), cy: y, r: 5, fill: col, stroke: "var(--gv-surface)", "stroke-width": 2, class: "gv-mark" }, svg);
      var hit = el("rect", { x: Math.max(0, labW - 4), y: y - (rowH - capH) / 2 - capH, width: plotW + 8, height: rowH, class: "gv-hit" }, svg);
      bindHit(hit, dot, tp, "평균 " + spec.fmt(r[2]) + " (" + spec.fmt(r[0]) + "~" + spec.fmt(r[1]) + ")", c, col);
    });
  }

  function render(root) {
    var spec = D[root.getAttribute("data-viz")]; if (!spec) return;
    var w = Math.floor(root.clientWidth); if (!w || w === +root.getAttribute("data-w")) return;
    root.setAttribute("data-w", w); root.textContent = "";
    div("gviz-title", spec.title, root); if (spec.sub) div("gviz-sub", spec.sub, root);
    if (spec.series && spec.series.length > 1) {
      var lg = div("gviz-legend", null, root);
      spec.series.forEach(function (s, i) {
        var sp = document.createElement("span"), sw = document.createElement("i"); sw.style.background = colorVar(i);
        sp.appendChild(sw); sp.appendChild(document.createTextNode(s)); lg.appendChild(sp);
      });
    }
    var tp = tipper(root);
    if (spec.type === "hbar") hbar(div(null, null, root), spec, w, tp);
    else if (spec.type === "range") range(div(null, null, root), spec, w, tp);
    else if (spec.type === "multi") {
      var grid = div("gviz-multi", null, root);
      // 칸을 모두 만든 뒤에 폭을 잰다(칸이 하나일 때 재면 전체 폭으로 잡힌다)
      var boxes = spec.panels.map(function (p) {
        var cell = div(null, null, grid); div("gviz-panel-title", p.title, cell); return div(null, null, cell);
      });
      spec.panels.forEach(function (p, i) {
        var pw = Math.floor(boxes[i].clientWidth) || Math.floor(w / 3);
        hbar(boxes[i], { cats: p.cats, values: p.values, emphasis: p.emphasis, max: p.max, fmt: p.fmt, nullLabel: p.nullLabel, series: [p.title] }, pw, tp, { noAxis: true });
      });
    }
  }
  function all() { document.querySelectorAll(".gviz[data-viz]").forEach(render); }
  var t; window.addEventListener("resize", function () { clearTimeout(t); t = setTimeout(all, 150); });
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", all); else all();
})();
