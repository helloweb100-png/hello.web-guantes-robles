/* ════════════════════════════════════════════════════════════════
   GUANTES ROBLES · app.js
   Vanilla JS, sin dependencias obligatorias (Lenis es opcional).
   Módulos:
   01 Utilidades          08 Hero (rotador + 3D)    15 Proceso (timeline) + scroll
   02 Loader              09 Cinta (marquee)        16 Ventajas (slider de volumen)
   03 Scroll suave        10 Materiales (tabs)      17 FAQ
   04 Navegación          11 Catálogo               18 Formulario → WhatsApp
   05 Anclas              12 Visor de producto      19 Flotantes
   06 Reveal + split      13 Cotizador (basket)
   07 Contadores          14 Construcción (hotspots)
════════════════════════════════════════════════════════════════ */
(() => {
    'use strict';

    /* ───────── 01 · UTILIDADES ───────── */
    const WA_NUMBER = '524311083056';
    const STORE_KEY = 'gr-quote-v1';
    const $ = (s, c = document) => c.querySelector(s);
    const $$ = (s, c = document) => Array.from(c.querySelectorAll(s));
    const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
    const lerp = (a, b, t) => a + (b - a) * t;
    const html = document.documentElement;
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
    const nf = new Intl.NumberFormat('es-MX');
    const waUrl = (text) => `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(text)}`;

    const store = {
        get() { try { return JSON.parse(localStorage.getItem(STORE_KEY) || '[]'); } catch (e) { return []; } },
        set(v) { try { localStorage.setItem(STORE_KEY, JSON.stringify(v)); } catch (e) { /* modo privado */ } }
    };

    let lenis = null;
    let scrollLocks = 0;
    function lockScroll(on) {
        scrollLocks = Math.max(0, scrollLocks + (on ? 1 : -1));
        const locked = scrollLocks > 0;
        html.classList.toggle('no-scroll', locked);
        if (lenis) locked ? lenis.stop() : lenis.start();
    }

    const toastEl = $('#toast');
    let toastT;
    function toast(msg) {
        if (!toastEl) return;
        toastEl.textContent = msg;
        toastEl.classList.add('is-on');
        clearTimeout(toastT);
        toastT = setTimeout(() => toastEl.classList.remove('is-on'), 3200);
    }

    /* Trampa de foco simple para modales/cajones */
    function trapFocus(container, e) {
        if (e.key !== 'Tab') return;
        const f = $$('a[href], button:not([disabled]), input, select, textarea, [tabindex]:not([tabindex="-1"])', container)
            .filter(el => el.offsetParent !== null || el === document.activeElement);
        if (!f.length) return;
        const first = f[0], last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }

    /* ───────── 02 · LOADER ───────── */
    function initLoader() {
        const loader = $('#loader');
        const done = () => {
            html.classList.add('is-ready');
            startHero();
            initSmoothScroll();
            const h = location.hash;
            if (h && h.length > 1 && $(h)) setTimeout(() => scrollToTarget($(h)), 400);
        };
        if (!loader) { done(); return; }

        html.classList.add('no-scroll');
        const num = $('#ld-num'), prog = $('#ld-prog'), status = $('#ld-status');
        const CIRC = 2 * Math.PI * 90;
        const steps = [
            [0, 'Encendiendo la fábrica…'],
            [22, 'Seleccionando piel y carnaza…'],
            [48, 'Cortando y cosiendo…'],
            [74, 'Reforzando costuras…'],
            [94, 'Listo para cotizar']
        ];
        const MIN = reduceMotion ? 250 : 2400;
        let loaded = document.readyState === 'complete';
        window.addEventListener('load', () => { loaded = true; });
        setTimeout(() => { loaded = true; }, 7000);

        let p = 0, last = '', t0 = performance.now(), finished = false;
        function render(v) {
            const n = Math.floor(v);
            if (num) num.textContent = n;
            if (prog) prog.style.strokeDashoffset = CIRC * (1 - v / 100);
            loader.style.setProperty('--p', v.toFixed(2));
            loader.style.setProperty('--pp', (v / 100).toFixed(4));
            let msg = steps[0][1];
            steps.forEach(s => { if (v >= s[0]) msg = s[1]; });
            if (msg !== last && status) { status.textContent = msg; last = msg; }
        }
        function finish() {
            if (finished) return;
            finished = true;
            render(100);
            setTimeout(() => {
                loader.classList.add('is-out');
                html.classList.remove('no-scroll');
                setTimeout(done, 380);
                setTimeout(() => loader.remove(), 1700);
            }, 320);
        }
        function tick(now) {
            const t = clamp((now - t0) / MIN, 0, 1);
            const eased = 1 - Math.pow(1 - t, 2.2);
            const target = loaded ? eased * 100 : Math.min(eased * 100, 90);
            p = lerp(p, target, .14);
            if (loaded && t >= 1 && p > 99.3) p = 100;
            render(p);
            p >= 100 ? finish() : requestAnimationFrame(tick);
        }
        render(0);
        requestAnimationFrame(tick);
    }

    /* ───────── 03 · SCROLL SUAVE ───────── */
    function initSmoothScroll() {
        if (lenis || reduceMotion || typeof window.Lenis === 'undefined') return;
        try {
            lenis = new window.Lenis({
                duration: 1.25,
                easing: t => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
                smoothWheel: true,
                wheelMultiplier: .9
            });
            const raf = (time) => { lenis.raf(time); requestAnimationFrame(raf); };
            requestAnimationFrame(raf);
            if (scrollLocks > 0) lenis.stop();
        } catch (e) { lenis = null; }
    }
    function scrollToTarget(el, instant) {
        if (!el) return;
        const navH = parseFloat(getComputedStyle(html).getPropertyValue('--nav-h')) || 70;
        const y = el.id === 'inicio' ? 0 : el.getBoundingClientRect().top + window.scrollY - (navH + 8);
        if (lenis && !instant) lenis.scrollTo(y, { duration: 1.7, easing: t => 1 - Math.pow(1 - t, 4) });
        else window.scrollTo({ top: y, behavior: instant || reduceMotion ? 'auto' : 'smooth' });
    }

    /* ───────── 04 · NAVEGACIÓN ───────── */
    const nav = $('#nav');
    const burger = $('#burger');
    const menu = $('#menu');
    let menuOpen = false;

    function setMenu(open) {
        if (!menu || !burger || open === menuOpen) return;
        menuOpen = open;
        menu.classList.toggle('is-open', open);
        menu.setAttribute('aria-hidden', String(!open));
        burger.setAttribute('aria-expanded', String(open));
        burger.setAttribute('aria-label', open ? 'Cerrar menú' : 'Abrir menú');
        nav.classList.remove('is-hidden');
        lockScroll(open);
    }
    function initNav() {
        if (!nav) return;
        $$('.menu-nav a').forEach((a, i) => a.style.setProperty('--i', i));
        burger && burger.addEventListener('click', () => setMenu(!menuOpen));
        window.addEventListener('keydown', e => { if (e.key === 'Escape' && menuOpen) { setMenu(false); burger.focus(); } });

        // Scrollspy
        const links = $$('[data-spy]');
        const map = new Map();
        links.forEach(a => { const s = $(a.getAttribute('href')); if (s) map.set(s, a); });
        if ('IntersectionObserver' in window) {
            const spy = new IntersectionObserver(entries => {
                entries.forEach(en => {
                    if (en.isIntersecting) {
                        links.forEach(l => l.classList.remove('is-active'));
                        const a = map.get(en.target);   // secciones sin enlace en el menú limpian el estado
                        a && a.classList.add('is-active');
                    }
                });
            }, { rootMargin: '-45% 0px -50% 0px' });
            $$('main > section[id]').forEach(s => spy.observe(s));
        }
    }

    /* ───────── 05 · ANCLAS ───────── */
    function initAnchors() {
        document.addEventListener('click', e => {
            const a = e.target.closest('a[href^="#"]');
            if (!a) return;
            const href = a.getAttribute('href');
            if (!href || href === '#') return;
            const target = $(href);
            if (!target) return;
            e.preventDefault();
            const wasMenu = menuOpen;
            if (menuOpen) setMenu(false);
            if (drawerOpen) closeDrawer(true);
            const go = () => {
                scrollToTarget(target);
                try { history.pushState(null, '', href); } catch (err) { /* file:// */ }
            };
            wasMenu ? setTimeout(go, 350) : go();
        });
    }

    /* ───────── 06 · REVEAL + SPLIT ───────── */
    function splitWords(el) {
        let idx = 0;
        const walk = node => {
            Array.from(node.childNodes).forEach(child => {
                if (child.nodeType === 3) {
                    const frag = document.createDocumentFragment();
                    child.textContent.split(/(\s+)/).forEach(part => {
                        if (!part) return;
                        if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(' ')); return; }
                        const w = document.createElement('span');
                        w.className = 'w';
                        const s = document.createElement('span');
                        s.textContent = part;
                        s.style.setProperty('--i', idx++);
                        w.appendChild(s);
                        frag.appendChild(w);
                    });
                    child.replaceWith(frag);
                } else if (child.nodeType === 1) walk(child);
            });
        };
        walk(el);
        el.classList.add('is-split');
    }
    function initReveal() {
        $$('.split').forEach(splitWords);
        const targets = $$('.rv, .split');
        if (!('IntersectionObserver' in window)) { targets.forEach(t => t.classList.add('in')); return; }
        const io = new IntersectionObserver((entries, obs) => {
            entries.forEach(en => {
                if (en.isIntersecting) { en.target.classList.add('in'); obs.unobserve(en.target); }
            });
        }, { threshold: .12, rootMargin: '0px 0px -8% 0px' });
        targets.forEach(t => io.observe(t));
    }

    /* ───────── 07 · CONTADORES ───────── */
    function initCounters() {
        const nodes = $$('[data-count]');
        if (!nodes.length) return;
        const run = el => {
            const end = parseInt(el.dataset.count, 10) || 0;
            if (reduceMotion) { el.textContent = end; return; }
            const dur = 1900, t0 = performance.now();
            (function step(now) {
                const t = clamp((now - t0) / dur, 0, 1);
                const e = t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
                el.textContent = Math.round(end * e);
                if (t < 1) requestAnimationFrame(step);
            })(t0);
        };
        if (!('IntersectionObserver' in window)) { nodes.forEach(n => n.textContent = n.dataset.count); return; }
        const io = new IntersectionObserver((entries, obs) => {
            entries.forEach(en => { if (en.isIntersecting) { run(en.target); obs.unobserve(en.target); } });
        }, { threshold: .6 });
        nodes.forEach(n => io.observe(n));
    }

    /* ───────── 08 · HERO (rotador + 3D) ───────── */
    let heroStarted = false;
    function startHero() {
        if (heroStarted) return;
        heroStarted = true;
        initRotator();
        initStage();
    }
    function initRotator() {
        const el = $('[data-rot]');
        if (!el) return;
        const words = el.dataset.rot.split('|');
        if (reduceMotion || words.length < 2) return;
        let w = 0, i = words[0].length, deleting = true;
        const type = () => {
            const word = words[w];
            el.textContent = word.slice(0, i);
            let delay = deleting ? 42 : 85;
            if (!deleting && i === word.length) { deleting = true; delay = 1900; }
            else if (deleting && i === 0) { deleting = false; w = (w + 1) % words.length; delay = 320; }
            else i += deleting ? -1 : 1;
            setTimeout(type, delay);
        };
        setTimeout(type, 2200);
    }
    function initStage() {
        const stage = $('.stage');
        if (!stage) return;
        let tx = 0, ty = 0, rx = 0, ry = 0, active = false, lastMove = 0;
        const hero = $('#inicio');
        hero.addEventListener('pointermove', e => {
            if (e.pointerType === 'touch') return;
            const r = stage.getBoundingClientRect();
            const nx = clamp((e.clientX - (r.left + r.width / 2)) / (r.width * .9), -1, 1);
            const ny = clamp((e.clientY - (r.top + r.height / 2)) / (r.height * .9), -1, 1);
            ty = nx * 5; tx = -ny * 4; active = true; lastMove = performance.now();
        }, { passive: true });
        hero.addEventListener('pointerleave', () => { active = false; });
        let visible = true;
        if ('IntersectionObserver' in window) new IntersectionObserver(en => { visible = en[0].isIntersecting; }).observe(hero);
        (function loop(now) {
            if (visible && !reduceMotion) {
                const t = now / 1000;
                if (!active || now - lastMove > 2500) { tx = Math.sin(t * .5) * 1.4; ty = Math.cos(t * .4) * 2.4; }
                rx = lerp(rx, tx, .07); ry = lerp(ry, ty, .07);
                stage.style.setProperty('--rx', rx.toFixed(2) + 'deg');
                stage.style.setProperty('--ry', ry.toFixed(2) + 'deg');
            }
            requestAnimationFrame(loop);
        })(performance.now());
    }

    /* ───────── 09 · MARQUEE ───────── */
    let scrollVel = 0;
    function initMarquee() {
        const rows = $$('[data-marquee]');
        if (!rows.length || reduceMotion) return;
        const state = rows.map(row => {
            const track = $('.marquee-track', row);
            const base = track.innerHTML;
            const speed = parseFloat(row.dataset.speed) || .5;
            const s = { row, track, base, speed, x: 0, w: 0, visible: true };
            s.build = () => {
                track.innerHTML = base;
                s.w = track.scrollWidth;
                const copies = Math.ceil((row.clientWidth * 2.2) / Math.max(1, s.w)) + 1;
                track.innerHTML = base.repeat(copies);
                if (speed < 0) s.x = -s.w;
            };
            s.build();
            if ('IntersectionObserver' in window) new IntersectionObserver(en => { s.visible = en[0].isIntersecting; }).observe(row);
            return s;
        });
        let rt;
        window.addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(() => state.forEach(s => s.build()), 200); });
        document.fonts && document.fonts.ready && document.fonts.ready.then(() => state.forEach(s => s.build()));
        let last = performance.now();
        (function loop(now) {
            const dt = Math.min(.05, (now - last) / 1000); last = now;
            state.forEach(s => {
                if (!s.visible) return;
                const dir = s.speed < 0 ? 1 : -1;
                const boost = 1 + Math.min(Math.abs(scrollVel) * .03, 2.5);
                s.x += dir * Math.abs(s.speed) * 80 * boost * dt;
                if (dir < 0 && s.x <= -s.w) s.x += s.w;
                if (dir > 0 && s.x >= 0) s.x -= s.w;
                s.track.style.transform = `translate3d(${s.x.toFixed(2)}px,0,0)`;
            });
            requestAnimationFrame(loop);
        })(last);
    }

    /* ───────── 10 · MATERIALES (tabs) ───────── */
    function initTabs() {
        const root = $('[data-tabs]');
        if (!root) return;
        const tabs = $$('.mat-tab', root), panels = $$('.mat-panel', root), imgs = $$('.mat-img', root);
        const glide = $('.mat-tab-glide', root), tag = $('#mat-tag');
        const names = { piel: 'PIEL DE RES', carnaza: 'CARNAZA', combinado: 'COMBINADO · PIEL + CARNAZA' };
        let current = 'piel', userTouched = false, auto;

        const moveGlide = () => {
            const t = tabs.find(x => x.dataset.tab === current);
            if (!t || !glide) return;
            glide.style.setProperty('--gx', t.offsetLeft + 'px');
            glide.style.setProperty('--gw', t.offsetWidth + 'px');
        };
        function select(key, focus) {
            if (key === current && !focus) return;
            current = key;
            tabs.forEach(t => {
                const on = t.dataset.tab === key;
                t.classList.toggle('is-active', on);
                t.setAttribute('aria-selected', String(on));
                t.tabIndex = on ? 0 : -1;
                if (on && focus) t.focus();
            });
            panels.forEach(p => {
                const on = p.dataset.panel === key;
                if (on) { p.hidden = false; void p.offsetWidth; p.classList.add('is-active'); }
                else { p.classList.remove('is-active'); p.hidden = true; }
            });
            imgs.forEach(i => i.classList.toggle('is-active', i.dataset.img === key));
            if (tag) tag.textContent = names[key];
            moveGlide();
        }
        tabs.forEach((t, i) => {
            t.addEventListener('click', () => { userTouched = true; select(t.dataset.tab); });
            t.addEventListener('keydown', e => {
                let n = null;
                if (e.key === 'ArrowRight') n = (i + 1) % tabs.length;
                if (e.key === 'ArrowLeft') n = (i - 1 + tabs.length) % tabs.length;
                if (e.key === 'Home') n = 0;
                if (e.key === 'End') n = tabs.length - 1;
                if (n !== null) { e.preventDefault(); userTouched = true; select(tabs[n].dataset.tab, true); }
            });
        });
        moveGlide();
        window.addEventListener('resize', moveGlide);
        document.fonts && document.fonts.ready && document.fonts.ready.then(moveGlide);

        // Rotación automática hasta que el usuario interactúa
        if (!reduceMotion && 'IntersectionObserver' in window) {
            const keys = tabs.map(t => t.dataset.tab);
            new IntersectionObserver(en => {
                clearInterval(auto);
                if (en[0].isIntersecting && !userTouched) {
                    auto = setInterval(() => { if (userTouched) return clearInterval(auto); select(keys[(keys.indexOf(current) + 1) % keys.length]); }, 5200);
                }
            }, { threshold: .5 }).observe(root);
        }
    }

    /* ───────── 11 · CATÁLOGO ───────── */
    const catalog = { cards: [], state: { filter: 'all', q: '', limit: 8, step: 8 } };
    function initCatalog() {
        const grid = $('#catalog-grid');
        if (!grid) return;
        const cards = catalog.cards = $$('.pcard', grid);
        const st = catalog.state;
        const fbtns = $$('.fbtn');
        const search = $('#catalog-search');
        const count = $('#catalog-count');
        const empty = $('#catalog-empty');
        const more = $('#catalog-more');
        const famNames = { all: 'todas las familias', soldador: 'Soldador', conductor: 'Conductor', tig: 'TIG', 'uso-rudo': 'Uso rudo' };
        let shownBefore = 0;

        const matches = c => (st.filter === 'all' || c.dataset.family === st.filter) && (!st.q || c.dataset.search.includes(st.q));

        function render(animateFrom) {
            const matched = cards.filter(matches);
            cards.forEach(c => { c.hidden = true; });
            let shown = 0;
            matched.forEach((c, i) => {
                if (i >= st.limit) return;
                c.hidden = false;
                if (animateFrom !== undefined && i >= animateFrom && !reduceMotion) {
                    c.classList.remove('pop'); void c.offsetWidth;
                    c.style.setProperty('--pi', Math.min(i - animateFrom, 12));
                    c.classList.add('pop');
                }
                shown++;
            });
            shownBefore = shown;
            if (count) count.textContent = matched.length ? `Mostrando ${shown} de ${matched.length} modelos · ${famNames[st.filter]}` : 'Sin resultados';
            if (empty) empty.hidden = matched.length > 0;
            if (more) more.hidden = shown >= matched.length;
        }
        function setFilter(f, opts = {}) {
            st.filter = f; st.limit = st.step;
            if (opts.clearSearch !== false) { st.q = ''; if (search) search.value = ''; }
            fbtns.forEach(b => { const on = b.dataset.filter === f; b.classList.toggle('is-active', on); b.setAttribute('aria-pressed', String(on)); });
            render(0);
        }
        catalog.setFilter = setFilter;
        catalog.render = render;

        fbtns.forEach(b => b.addEventListener('click', () => setFilter(b.dataset.filter, { clearSearch: false })));
        let dt;
        search && search.addEventListener('input', () => {
            clearTimeout(dt);
            dt = setTimeout(() => { st.q = search.value.trim().toLowerCase(); st.limit = st.step; render(0); }, 140);
        });
        more && more.addEventListener('click', () => { const from = shownBefore; st.limit += st.step; render(from); });

        // Filtros desde otras secciones (industrias, footer)
        document.addEventListener('click', e => {
            const t = e.target.closest('[data-goto-filter]');
            if (!t) return;
            e.preventDefault();
            if (menuOpen) setMenu(false);
            setFilter(t.dataset.gotoFilter);
            scrollToTarget($('#catalogo'));
        });

        // Delegación: abrir visor y agregar a cotización
        grid.addEventListener('click', e => {
            const card = e.target.closest('.pcard');
            if (!card) return;
            if (e.target.closest('[data-add]')) { Quote.toggle(card.dataset.id); return; }
            if (e.target.closest('[data-open]')) openLightbox(card);
        });
        render();
    }

    /* ───────── 12 · VISOR DE PRODUCTO ───────── */
    const lb = { dlg: null, card: null };
    function openLightbox(card) {
        const dlg = lb.dlg;
        if (!dlg) return;
        lb.card = card;
        fillLightbox();
        if (typeof dlg.showModal === 'function') { if (!dlg.open) dlg.showModal(); } else dlg.setAttribute('open', '');
        lockScroll(true);
    }
    function fillLightbox() {
        const c = lb.card, d = c.dataset;
        const img = $('#lb-img');
        const thumb = c.querySelector('img');
        img.src = thumb.currentSrc || thumb.src;
        img.alt = thumb.alt;
        const pre = new Image();
        pre.onload = () => { if (lb.card === c) img.src = d.full; };
        pre.src = d.full;
        $('#lb-fam').textContent = `N° ${d.id} · ${d.famLabel}`;
        $('#lb-title').textContent = d.name;
        $('#lb-tags').innerHTML = [d.mat, d.cuff, d.color].map(t => `<li>${t}</li>`).join('');
        $('#lb-desc').textContent = d.desc;
        const list = visibleCards();
        $('#lb-count').textContent = `Modelo ${list.indexOf(c) + 1} de ${list.length}`;
        $('#lb-wa').href = waUrl(`Hola, me interesa el modelo N° ${d.id} "${d.name}" (${d.mat}, ${d.cuff}, ${d.color}). Represento a una empresa y quiero cotizar.`);
        syncLightboxBtn();
    }
    function syncLightboxBtn() {
        const b = $('#lb-add');
        if (!b || !lb.card) return;
        const on = Quote.has(lb.card.dataset.id);
        b.classList.toggle('is-added', on);
        $('span', b).textContent = on ? 'En tu cotización · Quitar' : 'Agregar a cotización';
    }
    const visibleCards = () => catalog.cards.filter(c => !c.hidden);
    function stepLightbox(dir) {
        const list = visibleCards();
        if (list.length < 2) return;
        const i = list.indexOf(lb.card);
        lb.card = list[(i + dir + list.length) % list.length];
        fillLightbox();
    }
    function initLightbox() {
        const dlg = lb.dlg = $('#lightbox');
        if (!dlg) return;
        $('[data-lb-close]', dlg).addEventListener('click', () => dlg.close ? dlg.close() : dlg.removeAttribute('open'));
        $('[data-lb-prev]', dlg).addEventListener('click', () => stepLightbox(-1));
        $('[data-lb-next]', dlg).addEventListener('click', () => stepLightbox(1));
        $('#lb-add').addEventListener('click', () => { Quote.toggle(lb.card.dataset.id); });
        dlg.addEventListener('click', e => { if (e.target === dlg) dlg.close && dlg.close(); });
        dlg.addEventListener('close', () => lockScroll(false));
        dlg.addEventListener('keydown', e => {
            if (e.key === 'ArrowLeft') stepLightbox(-1);
            if (e.key === 'ArrowRight') stepLightbox(1);
        });
        let sx = 0;
        const media = $('.lb-media', dlg);
        media.addEventListener('touchstart', e => { sx = e.changedTouches[0].clientX; }, { passive: true });
        media.addEventListener('touchend', e => {
            const dx = e.changedTouches[0].clientX - sx;
            if (Math.abs(dx) > 55) stepLightbox(dx < 0 ? 1 : -1);
        }, { passive: true });
    }

    /* ───────── 13 · COTIZADOR (basket) ───────── */
    let drawerOpen = false, drawerTrigger = null;
    const drawer = $('#quote');
    const scrim = $('#drawer-scrim');
    function openDrawer(trigger) {
        if (!drawer || drawerOpen) return;
        drawerOpen = true; drawerTrigger = trigger || document.activeElement;
        if (menuOpen) setMenu(false);
        scrim.hidden = false;
        requestAnimationFrame(() => scrim.classList.add('is-on'));
        drawer.classList.add('is-open');
        drawer.setAttribute('aria-hidden', 'false');
        lockScroll(true);
        setTimeout(() => drawer.focus(), 60);
        Quote.syncFab();
    }
    function closeDrawer(silent) {
        if (!drawerOpen) return;
        drawerOpen = false;
        drawer.classList.remove('is-open');
        drawer.setAttribute('aria-hidden', 'true');
        scrim.classList.remove('is-on');
        setTimeout(() => { if (!drawerOpen) scrim.hidden = true; }, 500);
        lockScroll(false);
        Quote.syncFab();
        if (!silent && drawerTrigger && drawerTrigger.focus) drawerTrigger.focus();
    }

    const Quote = (() => {
        let items = [];           // [{id, qty}]
        const byId = id => catalog.cards.find(c => c.dataset.id === id);
        const DEFAULT_QTY = 100;

        function load() {
            const saved = store.get();
            items = Array.isArray(saved) ? saved.filter(x => x && byId(x.id)).map(x => ({ id: String(x.id), qty: clamp(parseInt(x.qty, 10) || DEFAULT_QTY, 1, 999999) })) : [];
        }
        const save = () => store.set(items);
        const has = id => items.some(i => i.id === id);
        const total = () => items.reduce((s, i) => s + i.qty, 0);

        function add(id) { if (!has(id)) { items.push({ id, qty: DEFAULT_QTY }); toast('Agregado a tu cotización'); changed(true); } }
        function remove(id) { items = items.filter(i => i.id !== id); changed(); }
        function toggle(id) { has(id) ? remove(id) : add(id); }
        function setQty(id, q) { const it = items.find(i => i.id === id); if (it) { it.qty = clamp(parseInt(q, 10) || 1, 1, 999999); save(); renderTotals(); renderSel(); } }
        function clear() { items = []; changed(); }

        function message() {
            const lines = items.map(i => { const d = byId(i.id).dataset; return `• N° ${d.id} · ${d.name} — ${nf.format(i.qty)} pares`; });
            return `Hola, represento a una empresa y quiero cotizar los siguientes guantes industriales:\n\n${lines.join('\n')}\n\nTotal aproximado: ${nf.format(total())} pares\n\n¿Me pueden compartir precio por volumen y tiempos de entrega?`;
        }

        function syncFab() {
            const fab = $('#quote-fab');
            if (fab) fab.hidden = items.length === 0 || drawerOpen;
        }
        function renderCounts(bump) {
            $$('[data-qcount]').forEach(el => {
                el.textContent = items.length;
                if (bump) { el.classList.remove('bump'); void el.offsetWidth; el.classList.add('bump'); }
            });
            const pill = $('.quote-pill');
            pill && pill.classList.toggle('has-items', items.length > 0);
            syncFab();
        }
        function renderTotals() {
            const t = $('#dr-total'); if (t) t.textContent = `${nf.format(total())} pares`;
        }
        function renderDrawer() {
            const list = $('#dr-list'), empty = $('#dr-empty'), send = $('#dr-send');
            if (!list) return;
            empty.hidden = items.length > 0;
            send.disabled = items.length === 0;
            list.innerHTML = '';
            items.forEach(it => {
                const c = byId(it.id), d = c.dataset, src = c.querySelector('img').src;
                const li = document.createElement('li');
                li.className = 'dr-item';
                li.innerHTML = `
                    <img src="${src}" alt="" width="68" height="68">
                    <div>
                        <h4>${d.name}</h4>
                        <small>N° ${d.id} · ${d.famLabel}</small>
                        <div class="dr-qty">
                            <button type="button" data-dec aria-label="Disminuir cantidad"><svg class="ic" aria-hidden="true"><use href="#i-minus"/></svg></button>
                            <input type="number" inputmode="numeric" min="1" step="10" value="${it.qty}" aria-label="Pares de ${d.name}">
                            <button type="button" data-inc aria-label="Aumentar cantidad"><svg class="ic" aria-hidden="true"><use href="#i-plus"/></svg></button>
                        </div>
                    </div>
                    <button class="dr-rm" type="button" aria-label="Quitar ${d.name}"><svg class="ic" aria-hidden="true"><use href="#i-trash"/></svg></button>`;
                const input = $('input', li);
                const step = () => (parseInt(input.value, 10) || 0) >= 200 ? 50 : 10;
                $('[data-dec]', li).addEventListener('click', () => { input.value = Math.max(1, (parseInt(input.value, 10) || 1) - step()); setQty(it.id, input.value); });
                $('[data-inc]', li).addEventListener('click', () => { input.value = (parseInt(input.value, 10) || 0) + step(); setQty(it.id, input.value); });
                input.addEventListener('input', () => setQty(it.id, input.value));
                input.addEventListener('blur', () => { input.value = items.find(i => i.id === it.id)?.qty || 1; });
                $('.dr-rm', li).addEventListener('click', () => remove(it.id));
                list.appendChild(li);
            });
            renderTotals();
        }
        function renderSel() {
            const box = $('#sel-box'), list = $('#sel-list');
            if (!box) return;
            box.hidden = items.length === 0;
            list.innerHTML = items.map(i => { const d = byId(i.id).dataset; return `<li><span>N° ${d.id} · ${d.name}</span><b>${nf.format(i.qty)} pares</b></li>`; }).join('');
        }
        function renderButtons() {
            catalog.cards.forEach(c => {
                const b = $('[data-add]', c), on = has(c.dataset.id);
                if (!b) return;
                b.classList.toggle('is-added', on);
                b.setAttribute('aria-pressed', String(on));
                $('span', b).textContent = on ? 'En tu cotización' : 'Agregar a cotización';
                const use = $('use', b);
                use && use.setAttribute('href', on ? '#i-check' : '#i-plus');
            });
            syncLightboxBtn();
        }
        function changed(bump) {
            save(); renderCounts(bump); renderDrawer(); renderSel(); renderButtons();
        }
        function init() {
            load();
            $$('[data-open-quote]').forEach(b => b.addEventListener('click', () => openDrawer(b)));
            $$('[data-close-quote]').forEach(b => b.addEventListener('click', () => closeDrawer(b.tagName === 'A')));
            scrim && scrim.addEventListener('click', () => closeDrawer());
            drawer && drawer.addEventListener('keydown', e => { if (e.key === 'Escape') closeDrawer(); else trapFocus(drawer, e); });
            $('#dr-clear').addEventListener('click', () => { clear(); toast('Cotización vaciada'); });
            $('#dr-send').addEventListener('click', () => {
                if (!items.length) return;
                window.open(waUrl(message()), '_blank', 'noopener');
                toast('Abriendo WhatsApp con tu cotización…');
            });
            changed();
        }
        return { init, add, remove, toggle, has, setQty, clear, items: () => items.slice(), total, message, syncFab, byId };
    })();

    /* ───────── 14 · CONSTRUCCIÓN (hotspots) ───────── */
    function initAnatomy() {
        const fig = $('[data-anat]');
        const list = $('[data-anat-list]');
        if (!fig || !list) return;
        const hs = $$('.hs', fig), items = $$('[data-hs-item]', list);
        let cur = 0, touched = false, auto;
        function activate(i, user) {
            cur = i;
            if (user) touched = true;
            hs.forEach((h, k) => h.classList.toggle('is-active', k === i));
            items.forEach((li, k) => li.classList.toggle('is-active', k === i));
        }
        hs.forEach((h, i) => { h.addEventListener('click', () => activate(i, true)); h.addEventListener('mouseenter', () => { if (finePointer) activate(i, true); }); });
        items.forEach((li, i) => { $('button', li).addEventListener('click', () => activate(i, true)); });
        activate(0);
        if (!reduceMotion && 'IntersectionObserver' in window) {
            new IntersectionObserver(en => {
                clearInterval(auto);
                if (en[0].isIntersecting) auto = setInterval(() => { if (touched) return clearInterval(auto); activate((cur + 1) % hs.length); }, 3600);
            }, { threshold: .4 }).observe(fig);
        }
    }

    /* ───────── 15 · PROCESO (timeline) + scroll global ───────── */
    function initScrollEffects() {
        const line = $('[data-timeline]');
        const steps = line ? $$('.tl-step', line) : [];
        let lastY = window.scrollY, ticking = false;

        function update() {
            ticking = false;
            const y = window.scrollY, vh = window.innerHeight;
            const dy = y - lastY; lastY = y;
            scrollVel = lerp(scrollVel, dy, .25);

            if (nav) {
                nav.classList.toggle('is-stuck', y > 24);
                // En móvil la barra se oculta al bajar para ganar pantalla; en escritorio siempre visible (CTA a mano)
                if (window.innerWidth < 900 && !menuOpen && !drawerOpen) {
                    if (y > 520 && dy > 8) nav.classList.add('is-hidden');
                    else if (dy < -6 || y < 520) nav.classList.remove('is-hidden');
                } else nav.classList.remove('is-hidden');
                const max = document.documentElement.scrollHeight - vh;
                nav.style.setProperty('--sp', max > 0 ? (y / max).toFixed(4) : 0);
            }

            // Timeline
            if (line) {
                const r = line.getBoundingClientRect();
                const mark = vh * .62;
                line.style.setProperty('--tp', clamp((mark - r.top) / r.height, 0, 1).toFixed(4));
                steps.forEach(s => s.classList.toggle('is-on', s.getBoundingClientRect().top < mark));
            }
        }
        const onScroll = () => { if (!ticking) { ticking = true; requestAnimationFrame(update); } };
        window.addEventListener('scroll', onScroll, { passive: true });
        window.addEventListener('resize', onScroll);
        // decaimiento de la velocidad de scroll (para el marquee)
        (function decay() { scrollVel *= .92; requestAnimationFrame(decay); })();
        update();
    }

    /* ───────── 16 · VENTAJAS (slider de volumen) ───────── */
    function initVolume() {
        const range = $('#vol-range'), out = $('#vol-out'), cta = $('#vol-cta');
        if (!range) return;
        const labels = ['Menos de 100 pares', '250 pares', '500 pares', '1,000 pares', 'Más de 2,000 pares'];
        const optionIdx = [1, 2, 2, 3, 4];
        const sync = () => {
            const v = parseInt(range.value, 10);
            out.textContent = labels[v];
            range.setAttribute('aria-valuetext', labels[v]);
            range.style.setProperty('--fill', (v / 4 * 100) + '%');
        };
        range.addEventListener('input', sync);
        sync();
        cta && cta.addEventListener('click', () => {
            const sel = $('#f-qty');
            if (sel) sel.selectedIndex = optionIdx[parseInt(range.value, 10)];
        });
    }

    /* ───────── 17 · FAQ ───────── */
    function initFaq() {
        $$('.qa').forEach(d => {
            const sum = $('summary', d), ans = $('.qa-a', d);
            sum.addEventListener('click', e => {
                e.preventDefault();
                if (reduceMotion || !ans.animate) { d.open = !d.open; return; }
                if (d.dataset.anim) return;
                d.dataset.anim = '1';
                const opts = { duration: 520, easing: 'cubic-bezier(.22,1,.36,1)', fill: 'forwards' };
                if (!d.open) {
                    d.open = true;
                    const h = ans.scrollHeight;
                    const a = ans.animate([{ height: '0px' }, { height: h + 'px' }], opts);
                    a.onfinish = () => { a.cancel(); delete d.dataset.anim; };
                } else {
                    const h = ans.offsetHeight;
                    const a = ans.animate([{ height: h + 'px' }, { height: '0px' }], opts);
                    a.onfinish = () => { d.open = false; a.cancel(); delete d.dataset.anim; };
                }
            });
        });
    }

    /* ───────── 18 · FORMULARIO → WHATSAPP ───────── */
    function initForm() {
        const form = $('#quote-form');
        if (!form) return;
        const rules = {
            'f-name': v => v.trim().length >= 2 ? '' : 'Escribe tu nombre.',
            'f-company': v => v.trim().length >= 2 ? '' : 'Escribe el nombre de tu empresa.',
            'f-phone': v => v.replace(/\D/g, '').length >= 10 ? '' : 'Ingresa un teléfono de 10 dígitos.'
        };
        const setErr = (id, msg) => {
            const input = $('#' + id), box = input.closest('.fg'), err = $(`[data-err="${id}"]`);
            box.classList.toggle('has-err', !!msg);
            input.setAttribute('aria-invalid', msg ? 'true' : 'false');
            if (err) err.textContent = msg;
            return !msg;
        };
        Object.keys(rules).forEach(id => {
            const input = $('#' + id);
            input.addEventListener('blur', () => setErr(id, rules[id](input.value)));
            input.addEventListener('input', () => { if (input.closest('.fg').classList.contains('has-err')) setErr(id, rules[id](input.value)); });
        });
        form.addEventListener('submit', e => {
            e.preventDefault();
            let firstBad = null;
            Object.keys(rules).forEach(id => {
                const ok = setErr(id, rules[id]($('#' + id).value));
                if (!ok && !firstBad) firstBad = $('#' + id);
            });
            if (firstBad) {
                const box = firstBad.closest('.fg');
                box.classList.remove('fg-shake'); void box.offsetWidth; box.classList.add('fg-shake');
                firstBad.focus();
                toast('Revisa los campos marcados.');
                return;
            }
            const v = id => $('#' + id).value.trim();
            const lines = [`Hola, soy ${v('f-name')} de ${v('f-company')}. Quiero solicitar una cotización de guantes industriales.`, ''];
            if (v('f-industry')) lines.push(`• Industria: ${v('f-industry')}`);
            if (v('f-type')) lines.push(`• Tipo de guante: ${v('f-type')}`);
            if (v('f-qty')) lines.push(`• Cantidad aproximada: ${v('f-qty')}`);
            lines.push(`• Teléfono: ${v('f-phone')}`);
            const its = Quote.items();
            if (its.length) {
                lines.push('', 'Modelos de interés:');
                its.forEach(i => { const d = Quote.byId(i.id).dataset; lines.push(`• N° ${d.id} · ${d.name} — ${nf.format(i.qty)} pares`); });
                lines.push(`Total aproximado: ${nf.format(Quote.total())} pares`);
            }
            if (v('f-msg')) lines.push('', `Comentarios: ${v('f-msg')}`);
            const url = waUrl(lines.join('\n'));
            const w = window.open(url, '_blank', 'noopener');
            if (!w) window.location.href = url;
            toast('Abriendo WhatsApp con tu solicitud…');
        });
    }

    /* ───────── 19 · FLOTANTES ───────── */
    function initFloating() {
        const fab = $('.wa-fab');
        if (fab) {
            setTimeout(() => { fab.classList.add('show-tip'); setTimeout(() => fab.classList.remove('show-tip'), 4200); }, 7000);
        }
    }

    /* ───────── INICIO ───────── */
    function init() {
        initReveal();
        initNav();
        initAnchors();
        initCounters();
        initMarquee();
        initTabs();
        initCatalog();
        initLightbox();
        Quote.init();
        initAnatomy();
        initScrollEffects();
        initVolume();
        initFaq();
        initForm();
        initFloating();
        initLoader();
    }
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
    else init();
})();
