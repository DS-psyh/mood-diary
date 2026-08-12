/* ============================================================
   Entry — редактор записи дня
   Автосохранение: настроение/погода/тип дня — сразу,
   комментарий — по паузе в наборе и при закрытии.
   ============================================================ */
var Entry = (function () {

  var el = {};
  var state = null;       // текущая запись
  var existed = false;    // запись уже была в базе
  var commentTimer = null;
  var onClosed = null;

  function $(id) { return document.getElementById(id); }

  function init(callbacks) {
    el.sheet = $('sheet');
    el.backdrop = $('sheet-backdrop');
    el.date = $('sheet-date');
    el.moods = $('mood-row');
    el.weather = $('weather-row');
    el.daytype = $('daytype-row');
    el.comment = $('comment');
    el.save = $('btn-save');
    el.remove = $('btn-delete');
    onClosed = callbacks && callbacks.onClosed;

    buildMoods();
    buildOptions(el.weather, Icons.WEATHER, 'weather');
    buildOptions(el.daytype, Icons.DAYTYPE, 'dayType');

    $('sheet-close').addEventListener('click', close);
    el.backdrop.addEventListener('click', close);
    el.save.addEventListener('click', function () { flushComment(); close(); App.toast('Сохранено'); });
    el.remove.addEventListener('click', removeEntry);

    el.comment.addEventListener('input', function () {
      state.comment = el.comment.value;
      clearTimeout(commentTimer);
      commentTimer = setTimeout(flushComment, 600);
    });

    document.addEventListener('visibilitychange', function () {
      if (document.visibilityState === 'hidden' && state) flushComment();
    });
    window.addEventListener('pagehide', function () { if (state) flushComment(); });
  }

  /* ---------- разметка ---------- */
  function buildMoods() {
    el.moods.innerHTML = Beans.MOODS.map(function (m) {
      return '<button class="moodbtn" type="button" data-mood="' + m.id + '" aria-pressed="false">' +
               '<span class="moodbtn__bean" data-bean="' + m.id + '"></span>' +
               '<span class="moodbtn__label">' + m.label + '</span>' +
             '</button>';
    }).join('');
    el.moods.addEventListener('click', function (e) {
      var btn = e.target.closest('[data-mood]');
      if (!btn) return;
      var id = Number(btn.dataset.mood);
      state.mood = (state.mood === id) ? null : id;
      paintMoods();
      persist();
    });
  }

  function buildOptions(container, list, field) {
    container.innerHTML = list.map(function (o) {
      return '<button class="optbtn" type="button" data-key="' + o.key + '" aria-pressed="false">' +
               '<span class="optbtn__icon">' + o.svg + '</span>' +
               '<span class="optbtn__label">' + o.label + '</span>' +
             '</button>';
    }).join('');
    container.addEventListener('click', function (e) {
      var btn = e.target.closest('[data-key]');
      if (!btn) return;
      var k = btn.dataset.key;
      state[field] = (state[field] === k) ? null : k;
      paintOptions(container, state[field]);
      persist();
    });
  }

  /* ---------- отрисовка состояния ---------- */
  function paintMoods() {
    var colors = App.colors();
    el.moods.classList.toggle('moods--none', state.mood === null);
    Array.prototype.forEach.call(el.moods.querySelectorAll('[data-mood]'), function (btn) {
      var id = Number(btn.dataset.mood);
      btn.setAttribute('aria-pressed', state.mood === id ? 'true' : 'false');
      btn.querySelector('[data-bean]').innerHTML = Beans.svg(id, colors[id]);
    });
  }

  function paintOptions(container, value) {
    Array.prototype.forEach.call(container.querySelectorAll('[data-key]'), function (btn) {
      btn.setAttribute('aria-pressed', btn.dataset.key === value ? 'true' : 'false');
    });
  }

  /* ---------- сохранение ---------- */
  function isEmpty() {
    return state.mood === null && !state.weather && !state.dayType && !state.comment.trim();
  }

  function persist() {
    if (!state) return Promise.resolve();
    if (isEmpty()) {
      if (!existed) return Promise.resolve();
      return DB.deleteEntry(state.date).then(function () {
        existed = false;
        el.remove.hidden = true;
        App.entryChanged(state.date, null);
      });
    }
    var snapshot = {
      date: state.date,
      mood: state.mood,
      weather: state.weather,
      dayType: state.dayType,
      comment: state.comment
    };
    return DB.putEntry(snapshot).then(function (saved) {
      existed = true;
      el.remove.hidden = false;
      App.entryChanged(saved.date, saved);
    }).catch(function () {
      App.toast('Не удалось сохранить запись');
    });
  }

  function flushComment() {
    clearTimeout(commentTimer);
    if (!state) return;
    state.comment = el.comment.value;
    persist();
  }

  function removeEntry() {
    var date = state.date;
    DB.deleteEntry(date).then(function () {
      existed = false;
      // обнуляем поля, иначе автосохранение при закрытии вернёт запись
      state.mood = null;
      state.weather = null;
      state.dayType = null;
      state.comment = '';
      el.comment.value = '';
      App.entryChanged(date, null);
      close();
      App.toast('Запись удалена');
    }).catch(function () { App.toast('Не удалось удалить запись'); });
  }

  /* ---------- открытие / закрытие ---------- */
  function open(dateKey) {
    return DB.getEntry(dateKey).then(function (found) {
      existed = !!found;
      state = {
        date: dateKey,
        mood: found && typeof found.mood === 'number' ? found.mood : null,
        weather: found && found.weather ? found.weather : null,
        dayType: found && found.dayType ? found.dayType : null,
        comment: found && found.comment ? found.comment : ''
      };
      el.date.textContent = Calendar.longDate(dateKey);
      el.comment.value = state.comment;
      el.remove.hidden = !existed;
      paintMoods();
      paintOptions(el.weather, state.weather);
      paintOptions(el.daytype, state.dayType);

      el.sheet.hidden = false;
      el.backdrop.hidden = false;
      requestAnimationFrame(function () {
        el.sheet.classList.add('is-open');
        el.backdrop.classList.add('is-open');
      });
      el.sheet.querySelector('.sheet__body').scrollTop = 0;
    });
  }

  function close() {
    if (!state) return;
    flushComment();
    el.comment.blur();
    el.sheet.classList.remove('is-open');
    el.backdrop.classList.remove('is-open');
    setTimeout(function () {
      el.sheet.hidden = true;
      el.backdrop.hidden = true;
      state = null;
      if (onClosed) onClosed();
    }, 280);
  }

  function isOpen() { return !!state; }

  /* Перерисовать бобы после смены палитры */
  function refreshColors() { if (state) paintMoods(); }

  return { init: init, open: open, close: close, isOpen: isOpen, refreshColors: refreshColors };
})();
