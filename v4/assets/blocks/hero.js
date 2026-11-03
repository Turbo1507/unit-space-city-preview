/* видео хиро стартует после загрузки страницы; при экономии трафика, 2G и отказе автозапуска остаётся постер */
(function () {
  var v = document.querySelector('.hero__video'), c = navigator.connection || {};
  if (!v || matchMedia('(prefers-reduced-motion: reduce)').matches || c.saveData || /(^|-)2g$/.test(c.effectiveType || '')) return;
  function go() {
    v.addEventListener('playing', function () { v.classList.add('on'); }, { once: true });
    v.src = matchMedia('(max-width: 900px)').matches ? v.dataset.src : v.dataset.srcWide;
    var p = v.play();
    if (p && p.catch) p.catch(function () { v.removeAttribute('src'); v.load(); });
  }
  function start() { (window.requestIdleCallback || setTimeout)(go, { timeout: 1500 }); }
  if (document.readyState === 'complete') start(); else addEventListener('load', start, { once: true });
})();
