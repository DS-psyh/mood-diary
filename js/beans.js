/* ============================================================
   Beans — SVG-персонажи настроения
   Выражение лица и цвет независимы друг от друга.
   id: 5 — очень хорошо ... 1 — очень плохо
   ============================================================ */
var Beans = (function () {

  var FACE = '#26302A';

  var MOODS = [
    { id: 5, key: 'very_good', label: 'Отлично',    color: '#F0D879' },
    { id: 4, key: 'good',      label: 'Хорошо',     color: '#A9D18E' },
    { id: 3, key: 'neutral',   label: 'Нормально',  color: '#61AE72' },
    { id: 2, key: 'bad',       label: 'Плохо',      color: '#2E6B45' },
    { id: 1, key: 'very_bad',  label: 'Ужасно',     color: '#8F918C' }
  ];

  /* Глаза: мягкие вертикальные овалы, чуть выше центра */
  function eyes(dy) {
    dy = dy || 0;
    return '<ellipse cx="35" cy="' + (44 + dy) + '" rx="4.6" ry="6.2" fill="' + FACE + '"/>' +
           '<ellipse cx="65" cy="' + (44 + dy) + '" rx="4.6" ry="6.2" fill="' + FACE + '"/>';
  }

  /* Рот для каждого настроения */
  var MOUTH = {
    // широкая открытая улыбка (полукруг вниз)
    5: '<path d="M32 58 A19 19 0 0 0 68 58 Z" fill="' + FACE + '"/>' +
       '<path d="M32 58 H68" stroke="' + FACE + '" stroke-width="3" stroke-linecap="round"/>',
    // спокойная улыбка
    4: '<path d="M39 60 Q50 69 61 60" fill="none" stroke="' + FACE + '" stroke-width="4.2" stroke-linecap="round"/>',
    // ровная линия
    3: '<path d="M41 62 H59" fill="none" stroke="' + FACE + '" stroke-width="4.2" stroke-linecap="round"/>',
    // грусть
    2: '<path d="M39 66 Q50 57 61 66" fill="none" stroke="' + FACE + '" stroke-width="4.2" stroke-linecap="round"/>',
    // открытый расстроенный рот
    1: '<path d="M34 71 C38 56 62 56 66 71 C59 76 41 76 34 71 Z" fill="' + FACE + '"/>'
  };

  function byId(id) {
    for (var i = 0; i < MOODS.length; i++) if (MOODS[i].id === id) return MOODS[i];
    return null;
  }

  /**
   * Разметка боба.
   * @param {number} id    1..5
   * @param {string} color цвет заливки
   * @param {object} opts  { face:false — пустой кружок }
   */
  function svg(id, color, opts) {
    opts = opts || {};
    var face = opts.face === false ? '' : eyes(0) + (MOUTH[id] || '');
    return '<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" focusable="false" aria-hidden="true">' +
             '<circle cx="50" cy="50" r="50" fill="' + (color || '#DDE3D6') + '"/>' + face +
           '</svg>';
  }

  /* Простой значок дневника — боб с листиком */
  function logo(color) {
    return '<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" focusable="false" aria-hidden="true">' +
             '<circle cx="50" cy="52" r="46" fill="' + (color || '#61AE72') + '"/>' +
             '<path d="M50 8 C64 6 76 14 78 26 C64 30 52 22 50 8 Z" fill="#3F8C55"/>' +
             eyes(0) + MOUTH[4] +
           '</svg>';
  }

  function defaultColors() {
    var out = {};
    MOODS.forEach(function (m) { out[m.id] = m.color; });
    return out;
  }

  return {
    MOODS: MOODS,
    byId: byId,
    svg: svg,
    logo: logo,
    defaultColors: defaultColors
  };
})();
