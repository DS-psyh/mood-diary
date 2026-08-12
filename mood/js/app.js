/* ============================================================
   App — состояние приложения, навигация, отрисовка календаря
   ============================================================ */
var App = (function () {

  var view = { year: 0, month: 0 };  // показанный месяц
  var monthEntries = {};             // { 'YYYY-MM-DD': entry }
  var moodColors = Beans.defaultColors();
  var screen = 'calendar';
  var toastTimer = null;

  function $(id) { return document.getElementById(id); }

  /* ---------- цвета ---------- */
  function colors() { return moodColors; }

  var colorSaveTimer = null;

  function setColor(id, value) {
    moodColors[id] = value;
    applyColors();
    clearTimeout(colorSaveTimer);
    return new Promise(function (resolve) {
      colorSaveTimer = setTimeout(function () {
        DB.setSetting('moodColors', moodColors).then(resolve, function () {
          toast('Не удалось сохранить цвет');
          resolve();
        });
      }, 250);
    });
  }

  function setColors(map) {
    moodColors = map;
    return DB.setSetting('moodColors', moodColors).then(function () {
      applyColors();
    });
  }

  function applyColors() {
    renderMonth();
    Settings.paintColors();
    Entry.refreshColors();
    $('chip-bean').innerHTML = Beans.logo(moodColors[3]);
  }

  function reloadSettings() {
    return DB.getSetting('moodColors', null).then(function (saved) {
      var base = Beans.defaultColors();
      if (saved && typeof saved === 'object') {
        Object.keys(base).forEach(function (id) {
          if (typeof saved[id] === 'string') base[id] = saved[id];
        });
      }
      moodColors = base;
    });
  }

  /* ---------- календарь ---------- */
  function renderMonth() {
    var grid = $('grid');
    var todayKey = Calendar.todayKey();
    var cells = Calendar.cells(view.year, view.month);

    $('month-title').textContent = Calendar.monthTitle(view.year, view.month);

    var now = new Date();
    var isCurrent = (view.year === now.getFullYear() && view.month === now.getMonth() + 1);
    $('btn-today').hidden = isCurrent;

    grid.innerHTML = cells.map(function (c) {
      if (!c) return '<div class="day day--empty"></div>';

      var entry = monthEntries[c.key];
      var classes = ['day'];
      if (c.key === todayKey) classes.push('day--today');
      if (c.column >= 5) classes.push('day--weekend');
      if (c.key > todayKey) classes.push('day--future');
      if (!entry || typeof entry.mood !== 'number') classes.push('day--empty-slot');

      var face = (entry && typeof entry.mood === 'number')
        ? '<span class="day__bean">' + Beans.svg(entry.mood, moodColors[entry.mood]) + '</span>'
        : '<span class="day__dot"></span>';

      var aria = c.day + ' ' + Calendar.MONTHS[view.month - 1].toLowerCase();

      return '<button class="' + classes.join(' ') + '" type="button" data-date="' + c.key + '" aria-label="' + aria + '">' +
               face +
               '<span class="day__num">' + c.day + '</span>' +
             '</button>';
    }).join('');
  }

  function loadMonth() {
    return DB.getMonthMap(view.year, view.month).then(function (map) {
      monthEntries = map;
      renderMonth();
    }).catch(function () {
      monthEntries = {};
      renderMonth();
      toast('Не удалось прочитать дневник');
    });
  }

  function goMonth(delta) {
    var next = Calendar.shift(view.year, view.month, delta);
    view.year = next.year;
    view.month = next.month;
    loadMonth();
  }

  function goToday() {
    var now = new Date();
    view.year = now.getFullYear();
    view.month = now.getMonth() + 1;
    loadMonth();
  }

  /* Обновление одной ячейки после правки записи */
  function entryChanged(dateKey, entry) {
    if (entry) monthEntries[dateKey] = entry;
    else delete monthEntries[dateKey];
    renderMonth();
    if (screen === 'settings') Settings.refreshStats();
  }

  /* ---------- экраны ---------- */
  function show(name) {
    screen = name;
    ['calendar', 'settings', 'colors'].forEach(function (n) {
      var node = $('screen-' + n);
      node.hidden = n !== name;
      node.classList.toggle('is-active', n === name);
    });
    window.scrollTo(0, 0);
    if (name === 'settings') Settings.refreshStats();
    if (name === 'colors') Settings.paintColors();
  }

  /* ---------- уведомления ---------- */
  function toast(text) {
    var node = $('toast');
    node.textContent = text;
    node.hidden = false;
    requestAnimationFrame(function () { node.classList.add('is-open'); });
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () {
      node.classList.remove('is-open');
      setTimeout(function () { node.hidden = true; }, 220);
    }, 2200);
  }

  /* ---------- меню в шапке ---------- */
  function initChipMenu() {
    var btn = $('btn-chip');
    var menu = $('chip-menu');

    function closeMenu() {
      menu.hidden = true;
      btn.setAttribute('aria-expanded', 'false');
    }
    btn.addEventListener('click', function (e) {
      e.stopPropagation();
      var open = menu.hidden;
      menu.hidden = !open;
      btn.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    document.addEventListener('click', function () { if (!menu.hidden) closeMenu(); });
    menu.addEventListener('click', function (e) {
      var item = e.target.closest('[data-action]');
      if (!item) return;
      closeMenu();
      if (item.dataset.action === 'today') Entry.open(Calendar.todayKey());
      if (item.dataset.action === 'settings') show('settings');
    });
  }

  /* ---------- сервис-воркер ---------- */
  function registerSW() {
    if (!('serviceWorker' in navigator)) return;
    if (location.protocol === 'file:') return;
    window.addEventListener('load', function () {
      navigator.serviceWorker.register('service-worker.js').catch(function () { /* офлайн-режим просто не включится */ });
    });
  }

  /* ---------- запуск ---------- */
  function start() {
    $('btn-share').innerHTML = Icons.UI.share;
    $('btn-palette').innerHTML = Icons.UI.palette;
    $('btn-menu').innerHTML = Icons.UI.menu;

    goTodayInit();

    $('btn-prev').addEventListener('click', function () { goMonth(-1); });
    $('btn-next').addEventListener('click', function () { goMonth(1); });
    $('btn-today').addEventListener('click', goToday);
    $('btn-palette').addEventListener('click', function () { show('colors'); });
    $('btn-menu').addEventListener('click', function () { show('settings'); });
    $('btn-share').addEventListener('click', function () { Settings.exportData(); });

    Array.prototype.forEach.call(document.querySelectorAll('[data-back]'), function (b) {
      b.addEventListener('click', function () {
        show(screen === 'colors' ? 'settings' : 'calendar');
      });
    });

    $('grid').addEventListener('click', function (e) {
      var day = e.target.closest('[data-date]');
      if (day) Entry.open(day.dataset.date);
    });

    initChipMenu();
    Entry.init({});
    Settings.init();

    DB.requestPersistence();

    reloadSettings()
      .then(function () {
        $('chip-bean').innerHTML = Beans.logo(moodColors[3]);
        Settings.paintColors();
        return loadMonth();
      })
      .catch(function () {
        $('chip-bean').innerHTML = Beans.logo(moodColors[3]);
        renderMonth();
        toast('Хранилище недоступно, записи могут не сохраниться');
      });

    // возвращение из фона: дата могла смениться на новую
    document.addEventListener('visibilitychange', function () {
      if (document.visibilityState === 'visible') renderMonth();
    });

    registerSW();
  }

  function goTodayInit() {
    var now = new Date();
    view.year = now.getFullYear();
    view.month = now.getMonth() + 1;
  }

  document.addEventListener('DOMContentLoaded', start);

  return {
    colors: colors,
    setColor: setColor,
    setColors: setColors,
    reloadSettings: reloadSettings,
    renderMonth: renderMonth,
    loadMonth: loadMonth,
    entryChanged: entryChanged,
    show: show,
    toast: toast
  };
})();
