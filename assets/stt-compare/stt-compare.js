/* 실시간 전사 비교 위젯.
   시계는 오디오가 아니라 자체 wall clock 이 갖는다 — 오디오가 89.45초에 끝나도
   통째로 처리하는 두 방식(93.4s / 97.8s)이 화면에 뜰 때까지 타임라인이 계속 간다. */
(function () {
  var root = document.getElementById('stt-compare');
  var D = window.STT_COMPARE;
  if (!root || !D) return;

  var AUD = D.audio_ms;
  var SPAN = Math.max(AUD, Math.max.apply(null, D.lanes.map(function (l) {
    return D.data[l.k].first;
  }))) + 3000;
  var BASE = root.getAttribute('data-base') || '';

  root.innerHTML =
    '<div class="scPlayer">' +
      '<button id="scPlay">&#9654; 재생</button>' +
      '<button class="sec" id="scReset">처음으로</button>' +
      '<span class="scClock" id="scClock">0.0s</span>' +
      '<span class="scBar" id="scBar"><i id="scProg"></i>' +
        '<span class="scMark" style="left:' + (AUD / SPAN * 100) + '%"></span></span>' +
      '<span class="scMarkTxt">&#9642; ' + (AUD / 1000).toFixed(1) + 's 말 끝</span>' +
    '</div>' +
    '<p class="scLegend"><i>회색 기울임</i>은 아직 확정되지 않은 중간 결과입니다. 확정 결과가 오면 그 자리가 바뀝니다.</p>' +
    '<audio id="scAudio" src="' + BASE + 'voice.m4a" preload="auto"></audio>' +
    '<div id="scLanes"></div>';

  var lanesBox = document.getElementById('scLanes');
  D.lanes.forEach(function (l) {
    var d = D.data[l.k];
    lanesBox.insertAdjacentHTML('beforeend',
      '<div class="scLane' + (d.batch ? ' batch' : '') + '" id="scLane-' + l.k + '">' +
        '<div class="scHead"><span class="scDot" style="background:' + l.c + '"></span>' +
          '<span class="scNm">' + l.name + '</span><span class="scSb">' + l.sub + '</span>' +
          '<span class="scFirst">' +
            (d.firstInterim ? '중간 ' + (d.firstInterim / 1000).toFixed(2) + 's &middot; ' : '') +
            '첫 확정 ' + (d.first / 1000).toFixed(2) + 's &middot; 조각 ' + d.n + '</span>' +
        '</div><div class="scOut" id="scOut-' + l.k + '"></div></div>');
  });

  var au = document.getElementById('scAudio');
  var clock = document.getElementById('scClock');
  var prog = document.getElementById('scProg');
  var btn = document.getElementById('scPlay');

  function render(ms) {
    clock.textContent = (ms / 1000).toFixed(1) + 's';
    prog.style.width = Math.min(100, ms / SPAN * 100) + '%';
    D.lanes.forEach(function (l) {
      var d = D.data[l.k];
      var box = document.getElementById('scOut-' + l.k);
      var lane = document.getElementById('scLane-' + l.k);
      var shown = d.ev.filter(function (e) { return e.t <= ms; });
      // 중간 결과: 마지막 확정 이후에 온 것 중 가장 최근 것 하나만 보인다 (확정이 오면 갈아 끼워진다)
      var lastFinalT = shown.length ? shown[shown.length - 1].t : -1;
      var interim = null;
      if (d.im) {
        for (var i = d.im.length - 1; i >= 0; i--) {
          if (d.im[i].t <= ms) { if (d.im[i].t > lastFinalT) interim = d.im[i]; break; }
        }
      }
      lane.classList.toggle('fired', shown.length > 0 || !!interim);
      if (!shown.length && !interim) {
        box.innerHTML = d.batch
          ? '<span class="scWait">오디오를 다 받아야 처리를 시작합니다 &mdash; <b>' +
            (d.first / 1000).toFixed(1) + '초</b>에 한 번에 나옵니다</span>'
          : '<span class="scWait">&hellip;</span>';
        return;
      }
      var last = shown[shown.length - 1];
      box.innerHTML = shown.map(function (e) {
        return '<span class="seg' + (e === last && !interim && ms - e.t < 800 ? ' new' : '') + '">' + e.x + ' </span>';
      }).join('') + (interim ? '<span class="seg interim">' + interim.x + '</span>' : '');
      if (!d.batch) box.scrollTop = box.scrollHeight;
    });
  }

  var T = 0, playing = false, anchor = 0, raf = null;

  function label() { btn.innerHTML = playing ? '&#10074;&#10074; 멈춤' : '&#9654; 재생'; }

  function tick() {
    if (!playing) return;
    T = performance.now() - anchor;
    if (T >= SPAN) { T = SPAN; stop(); render(T); return; }
    render(T);
    raf = requestAnimationFrame(tick);
  }

  function play() {
    if (T >= SPAN) T = 0;
    playing = true;
    anchor = performance.now() - T;
    if (T < AUD) { try { au.currentTime = T / 1000; } catch (e) {} au.play().catch(function () {}); }
    label();
    raf = requestAnimationFrame(tick);
  }

  function stop() {
    playing = false;
    if (raf) cancelAnimationFrame(raf);
    au.pause();
    label();
  }

  function seek(ms) {
    T = Math.max(0, Math.min(SPAN, ms));
    if (playing) {
      anchor = performance.now() - T;
      if (T < AUD) {
        try { au.currentTime = T / 1000; } catch (e) {}
        if (au.paused) au.play().catch(function () {});
      } else au.pause();
    } else if (T < AUD) {
      try { au.currentTime = T / 1000; } catch (e) {}
    }
    render(T);
  }

  btn.onclick = function () { playing ? stop() : play(); };
  document.getElementById('scReset').onclick = function () { stop(); seek(0); };
  document.getElementById('scBar').onclick = function (e) {
    var r = e.currentTarget.getBoundingClientRect();
    seek((e.clientX - r.left) / r.width * SPAN);
  };

  render(0);
})();
