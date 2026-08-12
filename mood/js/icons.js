/* ============================================================
   Icons — SVG-иконки интерфейса, погоды и типа дня
   Все иконки штриховые, наследуют currentColor.
   ============================================================ */
var Icons = (function () {

  function wrap(inner, fill) {
    return '<svg viewBox="0 0 24 24" fill="' + (fill || 'none') + '" stroke="currentColor" ' +
           'stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" ' +
           'xmlns="http://www.w3.org/2000/svg" focusable="false" aria-hidden="true">' + inner + '</svg>';
  }

  /* ---------- интерфейс ---------- */
  var UI = {
    share: wrap('<path d="M12 15V3.5"/><path d="M8 7.5 12 3.5l4 4"/><path d="M5 13v6.5a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V13"/>'),
    palette: wrap('<path d="M12 3a9 9 0 1 0 0 18c1 0 1.6-.7 1.6-1.5 0-.5-.2-.8-.5-1.1-.3-.3-.5-.7-.5-1.1 0-.8.7-1.5 1.6-1.5H16a5 5 0 0 0 5-5c0-4.1-4-7.8-9-7.8Z"/><circle cx="7.7" cy="11.2" r="1.1" fill="currentColor" stroke="none"/><circle cx="10.4" cy="7.4" r="1.1" fill="currentColor" stroke="none"/><circle cx="15" cy="7.9" r="1.1" fill="currentColor" stroke="none"/><circle cx="17.6" cy="11.6" r="1.1" fill="currentColor" stroke="none"/>'),
    menu: wrap('<path d="M4 7h16"/><path d="M4 12h16"/><path d="M4 17h16"/>')
  };

  /* ---------- погода ---------- */
  var WEATHER = [
    { key: 'sunny',  label: 'Солнечно', svg: wrap('<circle cx="12" cy="12" r="4.2"/><path d="M12 2.6v2.2M12 19.2v2.2M21.4 12h-2.2M4.8 12H2.6M18.6 5.4l-1.6 1.6M7 17l-1.6 1.6M18.6 18.6 17 17M7 7 5.4 5.4"/>') },
    { key: 'cloudy', label: 'Облачно',  svg: wrap('<path d="M8.5 8.2a4 4 0 0 1 7.6 1.3 3.4 3.4 0 0 1-.6 6.7H8a4.1 4.1 0 0 1-.5-8.1Z"/>') },
    { key: 'rainy',  label: 'Дождь',    svg: wrap('<path d="M8.5 5.7a4 4 0 0 1 7.6 1.3 3.4 3.4 0 0 1-.6 6.7H8A4.1 4.1 0 0 1 7.5 5.6"/><path d="M9 17.2 8 19.6M13 17.2 12 19.6M17 17.2 16 19.6"/>') },
    { key: 'snowy',  label: 'Снег',     svg: wrap('<path d="M8.5 5.7a4 4 0 0 1 7.6 1.3 3.4 3.4 0 0 1-.6 6.7H8A4.1 4.1 0 0 1 7.5 5.6"/><path d="M8.6 17.6h.01M12 19.4h.01M15.4 17.6h.01M10.3 20.2h.01M13.7 20.2h.01" stroke-width="2.6"/>') },
    { key: 'windy',  label: 'Ветрено',  svg: wrap('<path d="M3 8.6h9.4a2.6 2.6 0 1 0-2.6-2.9"/><path d="M3 13h13a2.6 2.6 0 1 1-2.6 2.9"/><path d="M3 17.6h6.6"/>') }
  ];

  /* ---------- тип дня ---------- */
  var DAYTYPE = [
    { key: 'work', label: 'Работа', svg: wrap('<rect x="3" y="7.2" width="18" height="12" rx="2.2"/><path d="M9 7.2V5.6a1.6 1.6 0 0 1 1.6-1.6h2.8A1.6 1.6 0 0 1 15 5.6v1.6"/><path d="M3 12.4h18"/>') },
    { key: 'rest', label: 'Отдых',  svg: wrap('<path d="M4.5 10.4h12v3.4a4.6 4.6 0 0 1-4.6 4.6H9.1a4.6 4.6 0 0 1-4.6-4.6v-3.4Z"/><path d="M16.5 11.6h1.8a2.2 2.2 0 0 1 0 4.4h-1.8"/><path d="M8 4.6c-.6.9-.6 1.7 0 2.6M12 4.6c-.6.9-.6 1.7 0 2.6"/>') },
    { key: 'both', label: 'И то и другое', svg: wrap('<rect x="2.6" y="8.4" width="9.4" height="7.6" rx="1.8"/><path d="M6 8.4V7.2a1.4 1.4 0 0 1 1.4-1.4h1.2a1.4 1.4 0 0 1 1.4 1.4v1.2"/><path d="M14.6 11.4h5a1.8 1.8 0 0 1 1.8 1.8v1.2a3.4 3.4 0 0 1-3.4 3.4h-1.8a1.6 1.6 0 0 1-1.6-1.6v-4.8Z"/><path d="M17 6.4c-.5.8-.5 1.5 0 2.3"/>') }
  ];

  function weatherByKey(key) {
    for (var i = 0; i < WEATHER.length; i++) if (WEATHER[i].key === key) return WEATHER[i];
    return null;
  }

  return { UI: UI, WEATHER: WEATHER, DAYTYPE: DAYTYPE, weatherByKey: weatherByKey };
})();
