/* ============================================================
   Settings — настройки, палитра, резервная копия
   ============================================================ */
var Settings = (function () {

  function $(id) { return document.getElementById(id); }

  function init() {
    $('btn-open-colors').addEventListener('click', function () { App.show('colors'); });
    $('btn-export').addEventListener('click', exportData);
    $('btn-import').addEventListener('click', function () { $('import-file').click(); });
    $('import-file').addEventListener('change', importData);
    $('btn-reset-colors').addEventListener('click', resetColors);
    buildColorList();
  }

  /* ---------- палитра ---------- */
  function buildColorList() {
    var list = $('color-list');
    list.innerHTML = Beans.MOODS.map(function (m) {
      return '<label class="colorrow">' +
               '<span class="colorrow__bean" data-bean="' + m.id + '"></span>' +
               '<span class="colorrow__label">' + m.label +
                 '<span class="colorrow__hex" data-hex="' + m.id + '"></span>' +
               '</span>' +
               '<input class="colorrow__pick" type="color" data-color="' + m.id + '" aria-label="Цвет: ' + m.label + '">' +
             '</label>';
    }).join('');

    list.addEventListener('input', function (e) {
      var input = e.target.closest('[data-color]');
      if (!input) return;
      var value = String(input.value || '').trim();
      if (!/^#[0-9a-fA-F]{6}$/.test(value)) return; // на старых iOS это обычное текстовое поле
      App.setColor(Number(input.dataset.color), value);
    });
  }

  function paintColors() {
    var colors = App.colors();
    Beans.MOODS.forEach(function (m) {
      var bean = document.querySelector('#color-list [data-bean="' + m.id + '"]');
      var hex = document.querySelector('#color-list [data-hex="' + m.id + '"]');
      var pick = document.querySelector('#color-list [data-color="' + m.id + '"]');
      if (bean) bean.innerHTML = Beans.svg(m.id, colors[m.id]);
      if (hex) hex.textContent = String(colors[m.id]).toUpperCase();
      if (pick && pick !== document.activeElement) pick.value = colors[m.id];
    });
    var preview = $('colors-preview');
    if (preview) {
      preview.innerHTML = Beans.MOODS.map(function (m) {
        return Beans.svg(m.id, colors[m.id], { face: false });
      }).join('');
    }
  }

  function resetColors() {
    App.setColors(Beans.defaultColors()).then(function () {
      App.toast('Стандартные цвета вернулись');
    });
  }

  /* ---------- статистика ---------- */
  function refreshStats() {
    DB.getAllEntries().then(function (list) {
      $('stat-count').textContent = list.length;
    });
    $('stat-storage').textContent = DB.isFallback() ? 'Резервное (localStorage)' : 'IndexedDB';

    var note = $('note-persist');
    if (navigator.storage && navigator.storage.persisted) {
      navigator.storage.persisted().then(function (ok) {
        note.textContent = ok
          ? 'Браузер помечает хранилище как постоянное — записи не будут очищены автоматически.'
          : 'Добавь приложение на экран «Домой» — так iOS хранит данные надёжнее.';
      });
    } else {
      note.textContent = 'Добавь приложение на экран «Домой» — так iOS хранит данные надёжнее.';
    }
  }

  /* ---------- экспорт ---------- */
  function fileName() {
    var d = new Date();
    return 'dnevnik-nastroeniya-' + Calendar.key(d) + '.json';
  }

  function download(text, name) {
    var blob = new Blob([text], { type: 'application/json' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(function () { URL.revokeObjectURL(url); }, 4000);
  }

  function exportData() {
    return DB.exportAll().then(function (data) {
      var text = JSON.stringify(data, null, 2);
      var name = fileName();
      var file = null;
      try { file = new File([text], name, { type: 'application/json' }); } catch (e) { file = null; }

      if (file && navigator.canShare && navigator.canShare({ files: [file] })) {
        return navigator.share({ files: [file], title: 'Дневник настроения' })
          .catch(function () { download(text, name); });
      }
      download(text, name);
      App.toast('Файл с копией готов');
    }).catch(function () {
      App.toast('Не удалось собрать копию');
    });
  }

  /* ---------- импорт ---------- */
  function importData(e) {
    var input = e.target;
    var file = input.files && input.files[0];
    if (!file) return;

    var reader = new FileReader();
    reader.onload = function () {
      var data;
      try {
        data = JSON.parse(reader.result);
      } catch (err) {
        App.toast('Файл повреждён или это не JSON');
        input.value = '';
        return;
      }
      DB.importAll(data).then(function (count) {
        return App.reloadSettings().then(function () {
          return App.loadMonth();
        }).then(function () {
          paintColors();
          refreshStats();
          App.toast('Загружено записей: ' + count);
        });
      }).catch(function (err) {
        App.toast(err && err.message ? err.message : 'Импорт не удался');
      }).then(function () { input.value = ''; });
    };
    reader.onerror = function () {
      App.toast('Не удалось прочитать файл');
      input.value = '';
    };
    reader.readAsText(file);
  }

  return {
    init: init,
    paintColors: paintColors,
    refreshStats: refreshStats,
    exportData: exportData
  };
})();
