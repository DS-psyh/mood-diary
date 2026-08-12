/* ============================================================
   DB — локальное хранилище дневника
   Основное: IndexedDB. Запасное: localStorage (если IDB недоступна).
   ============================================================ */
var DB = (function () {
  var NAME = 'mood-diary';
  var VERSION = 1;
  var ENTRIES = 'entries';
  var SETTINGS = 'settings';

  var dbPromise = null;
  var useFallback = false;
  var LS_KEY = 'mood-diary-fallback';

  /* ---------- запасное хранилище ---------- */
  function lsRead() {
    try {
      return JSON.parse(localStorage.getItem(LS_KEY) || '{"entries":{},"settings":{}}');
    } catch (e) {
      return { entries: {}, settings: {} };
    }
  }
  function lsWrite(data) {
    localStorage.setItem(LS_KEY, JSON.stringify(data));
  }

  /* ---------- открытие базы ---------- */
  function open() {
    if (dbPromise) return dbPromise;

    dbPromise = new Promise(function (resolve, reject) {
      if (!('indexedDB' in window) || !window.indexedDB) {
        useFallback = true;
        resolve(null);
        return;
      }
      var req;
      try {
        req = indexedDB.open(NAME, VERSION);
      } catch (e) {
        useFallback = true;
        resolve(null);
        return;
      }

      req.onupgradeneeded = function (event) {
        var db = req.result;
        var from = event.oldVersion || 0;
        // миграции по версиям — добавлять новые блоки ниже
        if (from < 1) {
          if (!db.objectStoreNames.contains(ENTRIES)) {
            db.createObjectStore(ENTRIES, { keyPath: 'date' });
          }
          if (!db.objectStoreNames.contains(SETTINGS)) {
            db.createObjectStore(SETTINGS, { keyPath: 'key' });
          }
        }
      };
      req.onsuccess = function () {
        var db = req.result;
        db.onversionchange = function () { db.close(); dbPromise = null; };
        resolve(db);
      };
      req.onerror = function () {
        useFallback = true;
        resolve(null); // не роняем приложение — переходим на localStorage
      };
      req.onblocked = function () {
        useFallback = true;
        resolve(null);
      };
    });

    return dbPromise;
  }

  function tx(store, mode, run) {
    return open().then(function (db) {
      if (!db) return run(null);
      return new Promise(function (resolve, reject) {
        var t, s, result;
        try {
          t = db.transaction(store, mode);
          s = t.objectStore(store);
        } catch (e) { reject(e); return; }
        result = run(s);
        t.oncomplete = function () { resolve(result && result.__box ? result.value : result); };
        t.onerror = function () { reject(t.error); };
        t.onabort = function () { reject(t.error || new Error('abort')); };
      });
    });
  }

  function reqValue(request) {
    var box = { __box: true, value: undefined };
    request.onsuccess = function () { box.value = request.result; };
    return box;
  }

  /* ---------- записи дневника ---------- */
  function getEntry(date) {
    if (useFallback) return Promise.resolve(lsRead().entries[date] || null);
    return tx(ENTRIES, 'readonly', function (s) {
      if (!s) return lsRead().entries[date] || null;
      return reqValue(s.get(date));
    }).then(function (v) { return v || null; });
  }

  function putEntry(entry) {
    entry.updatedAt = Date.now();
    if (useFallback) {
      var d = lsRead(); d.entries[entry.date] = entry; lsWrite(d);
      return Promise.resolve(entry);
    }
    return tx(ENTRIES, 'readwrite', function (s) {
      if (!s) { var d = lsRead(); d.entries[entry.date] = entry; lsWrite(d); return entry; }
      s.put(entry);
      return entry;
    });
  }

  function deleteEntry(date) {
    if (useFallback) {
      var d = lsRead(); delete d.entries[date]; lsWrite(d);
      return Promise.resolve();
    }
    return tx(ENTRIES, 'readwrite', function (s) {
      if (!s) { var d = lsRead(); delete d.entries[date]; lsWrite(d); return; }
      s.delete(date);
    });
  }

  function getAllEntries() {
    if (useFallback) {
      var d = lsRead();
      return Promise.resolve(Object.keys(d.entries).map(function (k) { return d.entries[k]; }));
    }
    return tx(ENTRIES, 'readonly', function (s) {
      if (!s) return [];
      return reqValue(s.getAll());
    }).then(function (v) { return v || []; });
  }

  /* Записи месяца в виде словаря { 'YYYY-MM-DD': entry } */
  function getMonthMap(year, month /* 1..12 */) {
    var mm = month < 10 ? '0' + month : '' + month;
    var prefix = year + '-' + mm + '-';
    return getAllEntries().then(function (list) {
      var map = {};
      list.forEach(function (e) {
        if (e && e.date && e.date.indexOf(prefix) === 0) map[e.date] = e;
      });
      return map;
    });
  }

  /* ---------- настройки ---------- */
  function getSetting(key, fallback) {
    if (useFallback) {
      var d = lsRead();
      return Promise.resolve(d.settings[key] === undefined ? fallback : d.settings[key]);
    }
    return tx(SETTINGS, 'readonly', function (s) {
      if (!s) return undefined;
      return reqValue(s.get(key));
    }).then(function (rec) {
      return rec && rec.value !== undefined ? rec.value : fallback;
    });
  }

  function setSetting(key, value) {
    if (useFallback) {
      var d = lsRead(); d.settings[key] = value; lsWrite(d);
      return Promise.resolve(value);
    }
    return tx(SETTINGS, 'readwrite', function (s) {
      if (!s) { var d = lsRead(); d.settings[key] = value; lsWrite(d); return value; }
      s.put({ key: key, value: value });
      return value;
    });
  }

  function getAllSettings() {
    if (useFallback) return Promise.resolve(lsRead().settings);
    return tx(SETTINGS, 'readonly', function (s) {
      if (!s) return [];
      return reqValue(s.getAll());
    }).then(function (list) {
      var out = {};
      (list || []).forEach(function (r) { out[r.key] = r.value; });
      return out;
    });
  }

  /* ---------- экспорт / импорт ---------- */
  function exportAll() {
    return Promise.all([getAllEntries(), getAllSettings()]).then(function (res) {
      return {
        app: 'mood-diary',
        version: 1,
        exportedAt: new Date().toISOString(),
        entries: res[0],
        settings: res[1]
      };
    });
  }

  function validateBackup(data) {
    if (!data || typeof data !== 'object') return 'Файл не похож на резервную копию';
    if (!Array.isArray(data.entries)) return 'В файле нет записей дневника';
    for (var i = 0; i < data.entries.length; i++) {
      var e = data.entries[i];
      if (!e || typeof e.date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(e.date)) {
        return 'В файле повреждена дата записи';
      }
    }
    return null;
  }

  /* mode: 'merge' — новые записи поверх старых по дате */
  function importAll(data) {
    var problem = validateBackup(data);
    if (problem) return Promise.reject(new Error(problem));

    var entries = data.entries.map(function (e) {
      return {
        date: e.date,
        mood: typeof e.mood === 'number' ? e.mood : null,
        weather: typeof e.weather === 'string' ? e.weather : null,
        dayType: typeof e.dayType === 'string' ? e.dayType : null,
        comment: typeof e.comment === 'string' ? e.comment : '',
        updatedAt: typeof e.updatedAt === 'number' ? e.updatedAt : Date.now()
      };
    });

    var settings = data.settings && typeof data.settings === 'object' ? data.settings : {};

    var chain = Promise.resolve();
    entries.forEach(function (e) {
      chain = chain.then(function () { return putEntry(e); });
    });
    Object.keys(settings).forEach(function (k) {
      chain = chain.then(function () { return setSetting(k, settings[k]); });
    });
    return chain.then(function () { return entries.length; });
  }

  /* ---------- служебное ---------- */
  function requestPersistence() {
    if (navigator.storage && navigator.storage.persist) {
      return navigator.storage.persisted().then(function (already) {
        if (already) return true;
        return navigator.storage.persist();
      }).catch(function () { return false; });
    }
    return Promise.resolve(false);
  }

  function isFallback() { return useFallback; }

  /* Публичные методы ждут открытия базы: иначе первый вызов
     не узнает, что нужно запасное хранилище. */
  function gated(fn) {
    return function () {
      var args = arguments;
      return open().then(function () { return fn.apply(null, args); });
    };
  }

  return {
    ready: open,
    getEntry: gated(getEntry),
    putEntry: gated(putEntry),
    deleteEntry: gated(deleteEntry),
    getAllEntries: gated(getAllEntries),
    getMonthMap: gated(getMonthMap),
    getSetting: gated(getSetting),
    setSetting: gated(setSetting),
    getAllSettings: gated(getAllSettings),
    exportAll: gated(exportAll),
    importAll: gated(importAll),
    requestPersistence: requestPersistence,
    isFallback: isFallback
  };
})();
