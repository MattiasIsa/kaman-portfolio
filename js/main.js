// Kaman Wong portfolio — homepage behaviour
(function () {
  var still = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var clamp = function (v) { return Math.min(1, Math.max(0, v)); };
  var smooth = function (v) { v = clamp(v); return v * v * (3 - 2 * v); };

  /* 1. Changing word */
  var word = document.querySelector('.swap-word');
  if (word && !still && !document.querySelector('.scene-bg')) {
    var words = [
      ['campaigns', '#ff7a2f'], ['films', '#e2a63b'], ['books', '#7b93c9'],
      ['murals', '#25a7d9'], ['identities', '#19a85b']
    ];
    var wi = 0;
    setInterval(function () {
      if (document.hidden) return;
      wi = (wi + 1) % words.length;
      word.classList.add('out');
      setTimeout(function () {
        word.textContent = words[wi][0];
        word.style.setProperty('--word', words[wi][1]);
        word.classList.remove('out');
        word.classList.add('pre');
        void word.offsetWidth;
        word.classList.remove('pre');
      }, 380);
    }, 2600);
  }

  /* 2. Hero: her work drifting behind ribbed glass; the glass clears on scroll */
  var wrap = document.querySelector('.hero-wrap');
  var hero = document.querySelector('.hero');
  var canvas = document.querySelector('.glass');
  if (wrap && hero && canvas && canvas.getContext) {
    var ctx = canvas.getContext('2d');
    var field = document.createElement('canvas');
    var fctx = field.getContext('2d');
    var W = 0, H = 0, dpr = 1, fw = 40;
    var sprites = [], feature = null, running = false, lastP = -1;

    // Soft, brightened thumbnails of the work: these are the colours behind the glass
    function makeSprite(img) {
      var c = document.createElement('canvas');
      c.width = 30; c.height = 22;
      var x = c.getContext('2d');
      x.drawImage(img, 0, 0, c.width, c.height);
      try {
        var d = x.getImageData(0, 0, c.width, c.height), p = d.data;
        for (var i = 0; i < p.length; i += 4) {
          var r = p[i], g = p[i + 1], b = p[i + 2];
          var l = 0.3 * r + 0.59 * g + 0.11 * b;
          r = l + (r - l) * 2; g = l + (g - l) * 2; b = l + (b - l) * 2;
          p[i] = r + (255 - r) * 0.16; p[i + 1] = g + (255 - g) * 0.16; p[i + 2] = b + (255 - b) * 0.16;
          var px = (i / 4) % c.width, py = Math.floor(i / 4 / c.width);
          var dx = px / (c.width - 1) * 2 - 1, dy = py / (c.height - 1) * 2 - 1;
          p[i + 3] = 255 * smooth(1.05 - Math.sqrt(dx * dx + dy * dy));
        }
        x.putImageData(d, 0, 0);
      } catch (e) { /* cross-origin preview: use the plain thumbnail */ }
      return c;
    }
    (canvas.dataset.work || '').split(',').forEach(function (src, i) {
      var img = new Image();
      img.onload = function () { sprites[i] = makeSprite(img); };
      img.src = src.trim();
    });
    var fimg = new Image();
    fimg.onload = function () { feature = fimg; lastP = -1; };
    fimg.src = canvas.dataset.feature;

    function resize() {
      W = hero.clientWidth; H = hero.clientHeight;
      dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
      field.width = Math.max(120, Math.round(W / 6)); field.height = Math.max(80, Math.round(H / 6));
      fw = Math.round(Math.min(64, Math.max(22, W / 26)));
      hero.style.setProperty('--fw', fw + 'px');
      lastP = -1;
    }

    function drawField(t) {
      var w = field.width, h = field.height;
      fctx.globalAlpha = 1;
      fctx.fillStyle = '#fbfaf8';
      fctx.fillRect(0, 0, w, h);
      fctx.globalAlpha = 0.9;
      for (var i = 0; i < sprites.length; i++) {
        var s = sprites[i];
        if (!s) continue;
        var size = w * (0.5 + 0.12 * Math.sin(i * 2.1));
        var x = w * (0.5 + 0.46 * Math.sin(t * (0.05 + i * 0.011) + i * 1.9));
        var y = h * (0.52 + 0.42 * Math.cos(t * (0.04 + i * 0.013) + i * 2.7));
        fctx.drawImage(s, x - size / 2, y - size * 0.4, size, size * 0.8);
      }
    }

    function draw(time) {
      var span = wrap.offsetHeight - H;
      var p = span > 0 ? clamp(-wrap.getBoundingClientRect().top / span) : 0;
      var clear = smooth((p - 0.22) / 0.56);          // 0 = ribbed glass, 1 = clear
      var k = 1 + 1.7 * (1 - clear);                  // how strongly each rib bends the view
      if (clear < 1 || p !== lastP) {
        var t = still ? 20 : time / 1000;
        var cw = canvas.width, ch = canvas.height, n = Math.ceil(W / fw), i, x0, dw;
        ctx.globalAlpha = 1;
        ctx.fillStyle = '#fff';
        ctx.fillRect(0, 0, cw, ch);
        if (clear < 1) {
          drawField(t);
          ctx.globalAlpha = 1 - clear;
          var sw = field.width, sh = field.height;
          for (i = 0; i < n; i++) {
            x0 = i * fw;
            var w1 = fw * k / W * sw;
            var sx = Math.min(sw - w1, Math.max(0, (x0 + fw / 2) / W * sw - w1 / 2));
            ctx.drawImage(field, sx, 0, w1, sh, x0 * dpr, 0, fw * dpr + 1, ch);
          }
        }
        if (clear > 0 && feature) {
          ctx.globalAlpha = clear;
          var sc = Math.max(W / feature.naturalWidth, H / feature.naturalHeight);
          var vw = W / sc, vh = H / sc;
          var ox = (feature.naturalWidth - vw) / 2, oy = (feature.naturalHeight - vh) * 0.35;
          for (i = 0; i < n; i++) {
            x0 = i * fw;
            var w2 = fw * k / sc;
            var sx2 = Math.min(feature.naturalWidth - w2, Math.max(0, ox + (x0 + fw / 2) / sc - w2 / 2));
            ctx.drawImage(feature, sx2, oy, w2, vh, x0 * dpr, 0, fw * dpr + 1, ch);
          }
        }
        hero.style.setProperty('--glass', (1 - clear).toFixed(3));
        hero.style.setProperty('--copy', (1 - smooth(p / 0.3)).toFixed(3));
        hero.style.setProperty('--cap', smooth((p - 0.78) / 0.2).toFixed(3));
        hero.classList.toggle('revealed', p > 0.85);
        lastP = p;
      }
      if (running) requestAnimationFrame(draw);
    }

    resize();
    window.addEventListener('resize', resize);
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (e) {
        var on = e[0].isIntersecting;
        if (on && !running) { running = true; requestAnimationFrame(draw); }
        if (!on) running = false;
      }).observe(wrap);
    } else { running = true; requestAnimationFrame(draw); }
  }

  /* Direction 2: the scene drifts slower than the page, and leans a little with the mouse */
  var scene = document.querySelector('.scene');
  if (scene && !still) {
    // The picture and the word change together, every few seconds
    var slides = Array.prototype.slice.call(scene.querySelectorAll('.scene-img'));
    var cur = 0;
    var load = function (im) { if (im && im.dataset.src) { im.src = im.dataset.src; delete im.dataset.src; } };
    if (word && slides.length > 1) {
      word.style.setProperty('--word', slides[0].dataset.accent);
      load(slides[1]);
      setInterval(function () {
        if (document.hidden || window.scrollY > window.innerHeight) return;
        var nx = (cur + 1) % slides.length, im = slides[nx];
        if (!im.complete || !im.naturalWidth) { load(im); return; }
        slides[cur].classList.remove('on'); im.classList.add('on'); cur = nx;
        load(slides[(cur + 1) % slides.length]);
        word.classList.add('out');
        setTimeout(function () {
          word.textContent = im.dataset.word;
          word.style.setProperty('--word', im.dataset.accent);
          word.classList.remove('out'); word.classList.add('pre');
          void word.offsetWidth; word.classList.remove('pre');
        }, 380);
      }, 5200);
    }
    window.addEventListener('scroll', function () {
      scene.style.setProperty('--sy', (window.scrollY * 0.36).toFixed(1) + 'px');
      scene.style.setProperty('--ty', window.scrollY.toFixed(1) + 'px');
      scene.style.setProperty('--to', Math.max(0, 1 - Math.max(0, window.scrollY / window.innerHeight - 0.18) / 0.16).toFixed(2));  // the Makes line holds its place on screen
    }, { passive: true });
    scene.addEventListener('pointermove', function (e) {
      if (e.pointerType !== 'mouse') return;
      scene.style.setProperty('--mx', ((e.clientX / window.innerWidth - 0.5) * -14).toFixed(1) + 'px');
      scene.style.setProperty('--my', ((e.clientY / window.innerHeight - 0.5) * -10).toFixed(1) + 'px');
    });
  }

  /* Word cloud: picking a name shows the role and years */
  var note = document.querySelector('.cloud-note');
  if (note) {
    var words = document.querySelectorAll('.cloud button');
    var show = function (b) {
      words.forEach(function (w) { w.classList.toggle('on', w === b); });
      note.textContent = b.dataset.note;
    };
    words.forEach(function (b) {
      b.addEventListener('pointerenter', function () { show(b); });
      b.addEventListener('focus', function () { show(b); });
      b.addEventListener('click', function () { show(b); });
    });
  }

  /* Lightbox for project images */
  var zooms = Array.prototype.slice.call(document.querySelectorAll('[data-zoom]'));
  if (zooms.length) {
    var box = document.createElement('div');
    box.className = 'lightbox'; box.hidden = true;
    box.setAttribute('role', 'dialog'); box.setAttribute('aria-modal', 'true'); box.setAttribute('aria-label', 'Image viewer');
    box.innerHTML = '<button class="lb-close" aria-label="Close">×</button><button class="lb-prev" aria-label="Previous image">←</button><img alt=""><button class="lb-next" aria-label="Next image">→</button>';
    document.body.appendChild(box);
    var big = box.querySelector('img'), at = 0, opener = null;
    var open = function (i) {
      at = (i + zooms.length) % zooms.length;
      big.src = zooms[at].currentSrc || zooms[at].src; big.alt = zooms[at].alt;
      box.hidden = false; document.documentElement.style.overflow = 'hidden';
      box.querySelector('.lb-close').focus();
    };
    var close = function () { box.hidden = true; document.documentElement.style.overflow = ''; if (opener) opener.focus(); };
    zooms.forEach(function (im, i) {
      im.tabIndex = 0; im.setAttribute('role', 'button');
      im.addEventListener('click', function () { opener = im; open(i); });
      im.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); opener = im; open(i); } });
    });
    box.addEventListener('click', function (e) {
      if (e.target.classList.contains('lb-prev')) open(at - 1);
      else if (e.target.classList.contains('lb-next')) open(at + 1);
      else close();
    });
    document.addEventListener('keydown', function (e) {
      if (box.hidden) return;
      if (e.key === 'Escape') close();
      if (e.key === 'ArrowLeft') open(at - 1);
      if (e.key === 'ArrowRight') open(at + 1);
    });
  }

  /* All work: filter by type */
  var fbtns = document.querySelectorAll('.filters button');
  if (fbtns.length) {
    var cards = document.querySelectorAll('.grid.all .tile');
    var count = document.querySelector('.filter-count');
    fbtns.forEach(function (b) {
      b.addEventListener('click', function () {
        var f = b.dataset.filter, n = 0;
        fbtns.forEach(function (x) { x.classList.toggle('on', x === b); x.setAttribute('aria-pressed', x === b); });
        cards.forEach(function (c) {
          var show = f === 'all' || c.dataset.cat === f;
          c.hidden = !show; if (show) { n++; c.classList.add('in'); }
        });
        if (count) count.textContent = 'Showing ' + n + (n === 1 ? ' project' : ' projects');
      });
    });
  }

  /* Contact: copy the email address */
  document.querySelectorAll('[data-copy]').forEach(function (b) {
    b.addEventListener('click', function () {
      var done = function () { b.textContent = 'Copied'; setTimeout(function () { b.textContent = 'Copy'; }, 1600); };
      try { navigator.clipboard.writeText(b.dataset.copy).then(done, function () { b.textContent = 'Select and copy'; }); }
      catch (e) { b.textContent = 'Select and copy'; }
    });
  });

  /* 3. Tiles settle into the grid */
  var tiles = document.querySelectorAll('.tile');
  if ('IntersectionObserver' in window) {
    var settle = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add('in'); settle.unobserve(e.target); }
      });
    }, { rootMargin: '0px 0px -12% 0px' });
    tiles.forEach(function (t) { settle.observe(t); });
  } else {
    tiles.forEach(function (t) { t.classList.add('in'); });
  }
})();
