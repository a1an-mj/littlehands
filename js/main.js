// Little Hands — small, dependency-free interactions.
(function () {
    'use strict';

    var root = document.documentElement;
    root.classList.remove('no-js');

    var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

    /* ---------- Mobile menu ---------- */
    var header = document.querySelector('[data-header]');
    var toggle = document.querySelector('[data-menu-toggle]');

    function setMenu(open) {
        if (!header || !toggle) return;
        header.classList.toggle('is-open', open);
        toggle.setAttribute('aria-expanded', String(open));
    }

    if (toggle) {
        toggle.addEventListener('click', function () {
            setMenu(toggle.getAttribute('aria-expanded') !== 'true');
        });
        document.addEventListener('keydown', function (e) {
            if (e.key === 'Escape') setMenu(false);
        });
        document.addEventListener('click', function (e) {
            if (header && !header.contains(e.target)) setMenu(false);
        });
        header.querySelectorAll('.site-nav a').forEach(function (a) {
            a.addEventListener('click', function () { setMenu(false); });
        });
    }

    /* ---------- Scroll: header state + hero parallax ---------- */
    var hero = document.querySelector('[data-hero]');
    var parallaxEls = document.querySelectorAll('[data-parallax]');
    var drift = document.querySelector('[data-drift]');
    var driftTrack = drift && drift.querySelector('[data-drift-track]');
    var wide = window.matchMedia('(min-width: 760px)');
    var ticking = false;

    function update() {
        ticking = false;
        var y = window.scrollY || window.pageYOffset;

        if (header) header.classList.toggle('is-scrolled', y > 12);

        if (hero && !reduceMotion.matches) {
            var h = hero.offsetHeight || 1;
            var p = Math.min(Math.max(y / h, 0), 1);
            hero.style.setProperty('--p', p.toFixed(4));
        }

        if (!reduceMotion.matches) {
            var vh = window.innerHeight;
            for (var i = 0; i < parallaxEls.length; i++) {
                var el = parallaxEls[i];
                var r = el.getBoundingClientRect();
                if (r.bottom < -200 || r.top > vh + 200) continue;
                var offset = (r.top + r.height / 2 - vh / 2) * parseFloat(el.getAttribute('data-parallax'));
                offset = Math.max(-48, Math.min(48, offset)); // keep doodles near their photos
                el.style.setProperty('--py', offset.toFixed(1) + 'px');
            }
        }

        // washing line: slide sideways while the section passes through the viewport
        if (drift && driftTrack) {
            var extra = driftTrack.scrollWidth - drift.clientWidth;
            var canDrift = wide.matches && !reduceMotion.matches && extra > 0;
            drift.classList.toggle('is-drifting', canDrift);
            if (canDrift) {
                var dr = drift.getBoundingClientRect();
                var vh2 = window.innerHeight;
                var t = (vh2 - dr.top) / (vh2 + dr.height);
                t = Math.min(Math.max(t, 0), 1);
                driftTrack.style.setProperty('--drift', (-t * extra).toFixed(1) + 'px');
            } else {
                driftTrack.style.removeProperty('--drift');
            }
        }
    }

    function onScroll() {
        if (!ticking) {
            ticking = true;
            window.requestAnimationFrame(update);
        }
    }

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });
    update();

    /* ---------- Opening hours: highlight today + open/closed badge (Kochi time) ---------- */
    var hours = document.querySelector('[data-hours]');
    var badge = document.querySelector('[data-open-badge]');
    if (hours && window.Intl) {
        try {
            var parts = new Intl.DateTimeFormat('en-GB', {
                timeZone: 'Asia/Kolkata', weekday: 'short', hour: '2-digit', minute: '2-digit', hour12: false
            }).formatToParts(new Date());
            var get = function (type) {
                for (var k = 0; k < parts.length; k++) if (parts[k].type === type) return parts[k].value;
                return '';
            };
            var day = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(get('weekday'));
            var mins = parseInt(get('hour'), 10) % 24 * 60 + parseInt(get('minute'), 10);
            var toMins = function (t) { var x = t.split(':'); return +x[0] * 60 + +x[1]; };
            var isOpen = false;
            hours.querySelectorAll('[data-days]').forEach(function (row) {
                if (row.getAttribute('data-days').split(',').indexOf(String(day)) === -1) return;
                row.classList.add('is-today');
                var o = row.getAttribute('data-open'), c = row.getAttribute('data-close');
                if (o && c) isOpen = mins >= toMins(o) && mins < toMins(c);
            });
            if (badge) {
                badge.textContent = isOpen ? 'Open now' : 'Closed now';
                badge.classList.add(isOpen ? 'is-open' : 'is-closed');
                badge.hidden = false;
            }
        } catch (err) { /* leave the plain table */ }
    }

    /* ---------- Footer year ---------- */
    document.querySelectorAll('[data-year]').forEach(function (el) {
        el.textContent = new Date().getFullYear();
    });

    /* ---------- Reveal-on-scroll for [data-reveal] (+ footer handprint stamps) ---------- */
    var stamps = document.querySelector('[data-stamps]');
    if (stamps) stamps.setAttribute('data-reveal-class', 'is-stamped');
    var revealEls = document.querySelectorAll('[data-reveal], [data-stamps]');
    if (revealEls.length) {
        if (!('IntersectionObserver' in window) || reduceMotion.matches) {
            revealEls.forEach(function (el) { el.classList.add(el.getAttribute('data-reveal-class') || 'is-visible'); });
        } else {
            var io = new IntersectionObserver(function (entries) {
                entries.forEach(function (entry) {
                    if (entry.isIntersecting) {
                        entry.target.classList.add(entry.target.getAttribute('data-reveal-class') || 'is-visible');
                        io.unobserve(entry.target);
                    }
                });
            }, { rootMargin: '0px 0px -10% 0px', threshold: 0.12 });
            revealEls.forEach(function (el) { io.observe(el); });
        }
    }
})();
