/* лента у комплексов: кадры едут сами, стрелки и точки ходят по той же прокрутке, свайп родной */
(function () {
  var band = document.querySelector('#complexes + .photo-band');
  if (!band) return;
  var track = band.querySelector('.cx-band__track');
  var slides = [].slice.call(track.children), n = slides.length, box = band.querySelector('.dots');
  var still = matchMedia('(prefers-reduced-motion: reduce)'), timer = 0, cur = 0, seen = false, inView = false, raf = 0;
  box.innerHTML = new Array(n + 1).join('<span></span>');
  function atEnd() { return track.scrollLeft >= track.scrollWidth - track.clientWidth - 2; }
  function left(s) { return s.getBoundingClientRect().left - track.getBoundingClientRect().left + track.scrollLeft; }
  function mark() {
    raf = 0;
    var x = track.scrollLeft, best = 0, d = Infinity;
    slides.forEach(function (s, i) { var k = Math.abs(left(s) - x); if (k < d) { d = k; best = i; } });
    cur = atEnd() && x > 0 ? n - 1 : best;
    slides.forEach(function (s, i) { s.classList.toggle('is-in', i === cur); box.children[i].classList.toggle('on', i === cur); });
  }
  function go(i) {
    // концы закольцованы: с конца ленты снова на первый кадр
    if (i < 0) i = n - 1;
    if (i >= n || (i > cur && atEnd())) i = 0;
    track.scrollTo({ left: left(slides[i]), behavior: still.matches ? 'auto' : 'smooth' });
  }
  function stop() { clearInterval(timer); timer = 0; }
  function arm() { stop(); if (!still.matches && inView) timer = setInterval(function () { go(cur + 1); }, 3500); }
  band.querySelector('.ugal__arrow--prev').addEventListener('click', function () { go(cur - 1); arm(); });
  band.querySelector('.ugal__arrow--next').addEventListener('click', function () { go(cur + 1); arm(); });
  track.addEventListener('scroll', function () { if (!raf) raf = requestAnimationFrame(mark); }, { passive: true });
  band.addEventListener('mouseenter', stop); band.addEventListener('mouseleave', arm);
  band.addEventListener('focusin', stop); band.addEventListener('focusout', arm);
  track.addEventListener('touchstart', stop, { passive: true });
  track.addEventListener('touchend', arm, { passive: true });
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (es) {
      inView = es[0].isIntersecting;
      // кадры ленты грузим заранее, чтобы при листании не было пустых
      if (inView && !seen) { seen = true; slides.forEach(function (s) { var im = s.querySelector('img'); if (im) im.loading = 'eager'; }); }
      if (inView) arm(); else stop();
    }, { rootMargin: '400px 0px' }).observe(band);
  } else { inView = true; arm(); }
  mark();
})();
