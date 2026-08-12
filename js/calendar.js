/* ============================================================
   Calendar — работа с датами и отрисовка месяца
   Всё в локальном часовом поясе устройства, без UTC-сдвигов.
   Неделя начинается с понедельника.
   ============================================================ */
var Calendar = (function () {

  var MONTHS = ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
                'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'];

  var MONTHS_OF = ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня',
                   'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'];

  var WEEKDAYS_FULL = ['воскресенье', 'понедельник', 'вторник', 'среда', 'четверг', 'пятница', 'суббота'];

  function pad(n) { return n < 10 ? '0' + n : '' + n; }

  /* Ключ даты YYYY-MM-DD из локальных полей Date — без toISOString */
  function key(date) {
    return date.getFullYear() + '-' + pad(date.getMonth() + 1) + '-' + pad(date.getDate());
  }

  function todayKey() { return key(new Date()); }

  function parseKey(k) {
    var p = k.split('-');
    return new Date(Number(p[0]), Number(p[1]) - 1, Number(p[2]));
  }

  function daysInMonth(year, month /* 1..12 */) {
    return new Date(year, month, 0).getDate(); // 0-й день следующего месяца
  }

  /* Индекс столбца первого числа: 0 = понедельник ... 6 = воскресенье */
  function firstColumn(year, month) {
    var jsDay = new Date(year, month - 1, 1).getDay(); // 0 = воскресенье
    return (jsDay + 6) % 7;
  }

  function monthTitle(year, month) {
    return MONTHS[month - 1] + ' ' + year;
  }

  function longDate(k) {
    var d = parseKey(k);
    return d.getDate() + ' ' + MONTHS_OF[d.getMonth()] + ' ' + d.getFullYear() +
           ', ' + WEEKDAYS_FULL[d.getDay()];
  }

  /* Список ячеек месяца, включая пустые до первого числа */
  function cells(year, month) {
    var out = [];
    var lead = firstColumn(year, month);
    var total = daysInMonth(year, month);
    var i;
    for (i = 0; i < lead; i++) out.push(null);
    for (i = 1; i <= total; i++) {
      out.push({ day: i, key: year + '-' + pad(month) + '-' + pad(i), column: (lead + i - 1) % 7 });
    }
    return out;
  }

  function shift(year, month, delta) {
    var m = month - 1 + delta;
    var y = year + Math.floor(m / 12);
    m = ((m % 12) + 12) % 12;
    return { year: y, month: m + 1 };
  }

  return {
    MONTHS: MONTHS,
    key: key,
    todayKey: todayKey,
    parseKey: parseKey,
    daysInMonth: daysInMonth,
    firstColumn: firstColumn,
    monthTitle: monthTitle,
    longDate: longDate,
    cells: cells,
    shift: shift
  };
})();
