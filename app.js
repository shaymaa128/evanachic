/* ============================================================
   EVANA CHIC – shared logic: header, search, boxes, magnifier, cart
   ============================================================ */
(function () {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const money = n => CURRENCY + Number(n).toFixed(2);
  const byId = id => PRODUCTS.find(p => p.id === id);
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  /* ---------- Cart storage ---------- */
  const getCart = () => { try { return JSON.parse(localStorage.getItem('evana_cart')) || []; } catch (e) { return []; } };
  const saveCart = c => { try { localStorage.setItem('evana_cart', JSON.stringify(c)); } catch (e) {} updateBadge(); };
  function addToCart(id, option, size) {
    const c = getCart();
    const f = c.find(i => i.id === id && i.option === option && (i.size || '') === (size || ''));
    if (f) f.qty++; else c.push({ id, option, size, qty: 1 });
    saveCart(c);
  }
  function updateBadge() {
    const n = getCart().reduce((s, i) => s + i.qty, 0);
    const b = $('#cart-badge');
    if (!b) return;
    b.textContent = n; b.classList.toggle('show', n > 0);
  }

  /* ---------- Toast ---------- */
  function toast(msg) {
    let t = $('.toast');
    if (!t) { t = document.createElement('div'); t.className = 'toast'; document.body.appendChild(t); }
    t.textContent = msg; t.classList.add('show');
    clearTimeout(t._t); t._t = setTimeout(() => t.classList.remove('show'), 2000);
  }

  /* ---------- Header + search (injected on every page) ---------- */
  function buildHeader() {
    const page = location.pathname.split('/').pop() || 'index.html';
    const link = (href, label) => `<a href="${href}" class="${page === href ? 'active' : ''}">${label}</a>`;
    const header = document.createElement('header');
    header.className = 'site-header';
    header.innerHTML = `
      <a href="index.html" class="logo">EVANA CHIC</a>
      <nav class="nav">
        ${link('index.html', 'Home')}${link('categories.html', 'Categories')}${link('closet.html', 'Closet')}
      </nav>
      <div class="actions">
        <button class="icon-btn" id="search-btn" aria-label="Search">
          <svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/></svg>
        </button>
        <a class="icon-btn" href="cart.html" aria-label="Cart">
          <svg viewBox="0 0 24 24"><path d="M3 4h2l2.4 11.2a1 1 0 0 0 1 .8h8.9a1 1 0 0 0 1-.8L20 8H6"/><circle cx="9.5" cy="20" r="1.3"/><circle cx="17" cy="20" r="1.3"/></svg>
          <span class="badge" id="cart-badge">0</span>
        </a>
      </div>`;
    document.body.prepend(header);

    const ov = document.createElement('div');
    ov.className = 'search-overlay';
    ov.innerHTML = `
      <button class="icon-btn search-close" aria-label="Close">✕</button>
      <input type="search" placeholder="Search EVANA CHIC…" autocomplete="off">
      <div class="search-results"></div>`;
    document.body.appendChild(ov);

    const input = $('input', ov), results = $('.search-results', ov);
    const close = () => ov.classList.remove('open');
    $('#search-btn').onclick = () => { ov.classList.add('open'); input.focus(); };
    $('.search-close', ov).onclick = close;
    document.addEventListener('keydown', e => { if (e.key === 'Escape') close(); });
    input.addEventListener('input', () => {
      const q = input.value.trim().toLowerCase();
      if (!q) { results.innerHTML = ''; return; }
      const hits = PRODUCTS.filter(p => (p.name + ' ' + p.category).toLowerCase().includes(q));
      results.innerHTML = hits.length
        ? hits.map(p => `<a class="search-row" href="closet.html?q=${encodeURIComponent(p.name)}">
            <img src="${p.images[0]}" alt=""><div><div>${p.name}</div><small>${p.category} · ${money(p.price)}</small></div></a>`).join('')
        : '<p class="empty">No results</p>';
    });
    input.addEventListener('keydown', e => {
      if (e.key === 'Enter' && input.value.trim()) location.href = 'closet.html?q=' + encodeURIComponent(input.value.trim());
    });
  }

  /* ---------- Product box ---------- */
  function boxHTML(p) {
    const imgs = p.images.map((s, i) => `<img src="${s}" alt="${p.name} ${i + 1}" draggable="false" data-i="${i}" loading="lazy">`).join('');
    const dots = p.images.length > 1 ? `<div class="dots">${p.images.map((_, i) => `<i class="${i ? '' : 'on'}"></i>`).join('')}</div>` : '';
    const btns = (list, attr) => list.map(v => `<button type="button" class="opt" data-${attr}="${esc(v)}">${esc(v)}</button>`).join('');
    const optBlock = (p.options && p.options.length) ? `<div class="opt-label">Choose option</div><div class="opts" data-g="o">${btns(p.options, 'o')}</div>` : '';
    const sizeBlock = (p.sizes && p.sizes.length) ? `<div class="opt-label">Choose size</div><div class="opts" data-g="s">${btns(p.sizes, 's')}</div>` : '';
    return `<article class="box" data-id="${p.id}">
      <div class="slider">${imgs}</div>${dots}
      <div class="hint">Hold a photo to magnify · swipe for more</div>
      <h3>${p.name}</h3>
      <div class="price">${money(p.price)}</div>
      ${optBlock}${sizeBlock}
      <button class="btn add" type="button">Add to Cart</button>
    </article>`;
  }

  function renderGrid(list) {
    const grid = $('#grid');
    grid.innerHTML = list.length ? list.map(boxHTML).join('') : '<p class="empty">Nothing here yet.</p>';
  }

  function wireGrid() {
    const grid = $('#grid');
    if (!grid) return;

    grid.addEventListener('click', e => {
      const box = e.target.closest('.box'); if (!box) return;
      const opt = e.target.closest('.opt');
      if (opt) {                                  // only ONE option and ONE size can be selected
        $$('.opt', opt.parentElement).forEach(o => o.classList.remove('selected'));
        opt.classList.add('selected');
      }
      if (e.target.closest('.add')) {
        const p = byId(box.dataset.id);
        const selO = $('.opts[data-g="o"] .opt.selected', box), selS = $('.opts[data-g="s"] .opt.selected', box);
        const miss = (p.options.length && !selO) ? 'Please choose an option' : (p.sizes.length && !selS) ? 'Please choose a size' : '';
        if (miss) { box.classList.remove('shake'); void box.offsetWidth; box.classList.add('shake'); toast(miss); return; }
        addToCart(box.dataset.id, selO ? selO.dataset.o : '', selS ? selS.dataset.s : '');
        toast('Added to cart ✓');
      }
    });

    grid.addEventListener('scroll', e => {         // dots follow the slider
      const s = e.target; if (!s.classList || !s.classList.contains('slider')) return;
      const i = Math.round(s.scrollLeft / s.clientWidth);
      $$('.dots i', s.parentElement).forEach((d, k) => d.classList.toggle('on', k === i));
    }, true);

    // Long press on a photo -> magnify
    let timer = null, sx = 0, sy = 0;
    const cancel = () => { clearTimeout(timer); timer = null; };
    grid.addEventListener('pointerdown', e => {
      const img = e.target.closest('.slider img'); if (!img) return;
      sx = e.clientX; sy = e.clientY;
      const box = img.closest('.box');
      timer = setTimeout(() => { timer = null; openLightbox(byId(box.dataset.id), +img.dataset.i); }, 450);
    });
    grid.addEventListener('pointermove', e => { if (timer && (Math.abs(e.clientX - sx) > 10 || Math.abs(e.clientY - sy) > 10)) cancel(); });
    ['pointerup', 'pointercancel', 'pointerleave'].forEach(ev => grid.addEventListener(ev, cancel));
    grid.addEventListener('contextmenu', e => { if (e.target.closest('.slider img')) e.preventDefault(); });
  }

  /* ---------- Magnifier / lightbox ---------- */
  function openLightbox(p, start) {
    let lb = $('.lightbox');
    if (!lb) {
      lb = document.createElement('div'); lb.className = 'lightbox';
      lb.innerHTML = `<button class="icon-btn lb-close" aria-label="Close">✕</button>
        <button class="lb-nav lb-prev" aria-label="Previous">‹</button>
        <div class="lb-track"></div>
        <button class="lb-nav lb-next" aria-label="Next">›</button>
        <div class="lb-count"></div>`;
      document.body.appendChild(lb);
      $('.lb-close', lb).onclick = () => lb.classList.remove('open');
      document.addEventListener('keydown', e => {
        if (!lb.classList.contains('open')) return;
        if (e.key === 'Escape') lb.classList.remove('open');
        if (e.key === 'ArrowRight') step(1);
        if (e.key === 'ArrowLeft') step(-1);
      });
      $('.lb-next', lb).onclick = () => step(1);
      $('.lb-prev', lb).onclick = () => step(-1);
      $('.lb-track', lb).addEventListener('scroll', count);
    }
    const track = $('.lb-track', lb);
    track.innerHTML = p.images.map((s, i) => `<img src="${s}" alt="${p.name} ${i + 1}" draggable="false">`).join('');
    lb.classList.add('open');
    track.scrollLeft = start * track.clientWidth;
    count();
    function step(d) { track.scrollBy({ left: d * track.clientWidth, behavior: 'smooth' }); }
    function count() {
      const i = Math.round(track.scrollLeft / (track.clientWidth || 1));
      $('.lb-count', lb).textContent = (i + 1) + ' / ' + p.images.length;
    }
  }

  /* ---------- Page initialisers ---------- */
  function initGridPage() {
    const grid = $('#grid'); if (!grid) return;
    const params = new URLSearchParams(location.search);
    const mode = grid.dataset.filter;           // "new" -> only new collection items
    const q = (params.get('q') || '').toLowerCase();
    const cat = params.get('cat') || 'All';
    let base = mode === 'new' ? PRODUCTS.filter(p => p.isNew) : PRODUCTS;

    const chips = $('#chips');
    if (chips) {
      const names = ['All', ...CATEGORIES.map(c => c.name)];
      chips.innerHTML = names.map(n => `<a class="chip ${n === cat ? 'active' : ''}" href="?cat=${encodeURIComponent(n)}">${n}</a>`).join('');
    }
    if (cat !== 'All') base = base.filter(p => p.category === cat);
    if (q) base = base.filter(p => (p.name + ' ' + p.category).toLowerCase().includes(q));
    renderGrid(base);
    wireGrid();
  }

  function initCategories() {
    const el = $('#cats'); if (!el) return;
    el.innerHTML = CATEGORIES.map(c => {
      const imgs = (c.images && c.images.length) ? c.images : [ph(c.name, '')];
      return `<a class="cat-card" href="closet.html?cat=${encodeURIComponent(c.name)}">
        ${imgs.map((s, i) => `<img src="${s}" alt="${c.name}" class="${i ? '' : 'on'}">`).join('')}
        <div class="label">${c.name}</div></a>`;
    }).join('');
    // each category slowly cycles through its pictures
    setInterval(() => $$('.cat-card', el).forEach(card => {
      const im = $$('img', card); if (im.length < 2) return;
      const k = im.findIndex(x => x.classList.contains('on'));
      im[k].classList.remove('on'); im[(k + 1) % im.length].classList.add('on');
    }), 3000);
  }

  function initCart() {
    const root = $('#cart-root'); if (!root) return;
    let agreed = false;
    const detail = it => [it.option ? `Option: <b>${esc(it.option)}</b>` : '', it.size ? `Size: <b>${esc(it.size)}</b>` : ''].filter(Boolean);
    const plain = it => [it.option ? 'Option ' + it.option : '', it.size ? 'Size ' + it.size : ''].filter(Boolean).join(' - ');

    function receipt(cart, subtotal, total) {
      const lines = cart.map((it, n) => {
        const p = byId(it.id), d = plain(it);
        return `${n + 1}. ${p.name}${d ? ' (' + d + ')' : ''}\n    ${it.qty} x ${money(p.price)} = ${money(p.price * it.qty)}`;
      });
      return `*EVANA CHIC - Order Receipt*\nDate: ${new Date().toLocaleDateString('en-GB')}\n\n${lines.join('\n')}\n\n` +
        `Subtotal: ${money(subtotal)}\nDelivery: ${money(DELIVERY_FEE)}\n*TOTAL: ${money(total)}*\n\n` +
        `Payment method: Whish\nI will send ${money(total)} on Whish to ${WHISH_NUMBER}.\nDelivery: 10-15 days.`;
    }

    function popup(total, onOk) {
      let m = $('.modal');
      if (m) m.remove();
      m = document.createElement('div'); m.className = 'modal';
      m.innerHTML = `<div class="modal-box">
        <h3 class="gold-text">Payment</h3>
        <p>Please send the total amount <b>${money(total)}</b> on <b>Whish</b> to <b>${WHISH_NUMBER}</b>.</p>
        <p>10-15 days to receive your order.<br>Delivery fees are included in the total.</p>
        <button class="btn solid" type="button" id="modal-ok">OK</button>
        <button class="back" type="button" id="modal-back">Back to cart</button>
      </div>`;
      document.body.appendChild(m);
      requestAnimationFrame(() => m.classList.add('open'));
      $('#modal-back', m).onclick = () => m.remove();
      $('#modal-ok', m).onclick = () => { m.remove(); onOk(); };
    }

    const draw = () => {
      const cart = getCart().filter(i => byId(i.id));
      if (!cart.length) {
        root.innerHTML = `<p class="empty">Your cart is empty.</p><p style="text-align:center"><a class="btn" href="collection.html">Discover New Collection</a></p>`;
        return;
      }
      let subtotal = 0;
      const rows = cart.map((it, idx) => {
        const p = byId(it.id), line = p.price * it.qty; subtotal += line;
        return `<div class="cart-item">
          <img src="${p.images[0]}" alt="${esc(p.name)}">
          <div>
            <h3>${esc(p.name)}</h3>
            ${detail(it).map(d => `<div class="meta">${d}</div>`).join('')}
            <div class="meta">Price: <b>${money(p.price)}</b> each</div>
            <div class="qty"><button data-a="minus" data-i="${idx}">−</button><span>${it.qty}</span><button data-a="plus" data-i="${idx}">+</button></div>
          </div>
          <div class="line-total"><div class="amt">${money(line)}</div><button class="remove" data-a="rm" data-i="${idx}">Remove</button></div>
        </div>`;
      }).join('');
      const total = subtotal + DELIVERY_FEE;
      root.innerHTML = rows + `
        <div class="summary">
          <div class="row"><span>Subtotal</span><span>${money(subtotal)}</span></div>
          <div class="row"><span>Delivery</span><span>${money(DELIVERY_FEE)}</span></div>
          <div class="row total"><span>TOTAL</span><span>${money(total)}</span></div>
          <div class="pay-note"><b>Note – Payment method: Whish</b><br>Send the total amount on the Whish app to the number <b>${WHISH_NUMBER}</b>.</div>
          <label class="agree"><input type="checkbox" id="agree" ${agreed ? 'checked' : ''}> <span>I understand and I will send the total amount on Whish.</span></label>
          <button class="btn solid" type="button" id="checkout" ${agreed ? '' : 'disabled'}>Checkout</button>
        </div>`;
      $('#agree').onchange = e => { agreed = e.target.checked; $('#checkout').disabled = !agreed; };
      $('#checkout').onclick = () => {
        if (!$('#agree').checked) { toast('Please tick the box first'); return; }
        popup(total, () => { location.href = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(receipt(cart, subtotal, total))}`; });
      };
    };
    root.addEventListener('click', e => {
      const b = e.target.closest('[data-a]'); if (!b) return;
      const c = getCart().filter(i => byId(i.id)), i = +b.dataset.i;
      if (b.dataset.a === 'plus') c[i].qty++;
      if (b.dataset.a === 'minus') c[i].qty = Math.max(1, c[i].qty - 1);
      if (b.dataset.a === 'rm') c.splice(i, 1);
      saveCart(c); draw();
    });
    draw();
  }

  /* ---------- Social links (footer) + floating WhatsApp ---------- */
  function buildSocials() {
    const ico = {
      wa: '<path d="M3 21l1.6-4.6A8.5 8.5 0 1 1 8 19.6L3 21z"/><path d="M9 8.5c0 3 2.5 5.5 5.5 5.5l1-1.5-2-1-.8.8c-.8-.3-1.7-1.2-2-2l.8-.8-1-2L9 8.5z"/>',
      fb: '<path d="M15 3h-2.5A3.5 3.5 0 0 0 9 6.5V9H7v4h2v8h4v-8h2.5l.5-4h-3V6.8c0-.5.3-.8.8-.8H15z"/>',
      ig: '<rect x="3.5" y="3.5" width="17" height="17" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.2" cy="6.8" r=".6"/>'
    };
    const links = [
      ['WhatsApp', `https://wa.me/${WHATSAPP_NUMBER}`, ico.wa],
      ['Facebook', FACEBOOK_URL, ico.fb],
      ['Instagram', INSTAGRAM_URL, ico.ig]
    ].filter(l => l[1]);
    const f = $('footer');
    if (f && links.length) f.insertAdjacentHTML('afterbegin', `<div class="socials">${links.map(l =>
      `<a class="icon-btn" href="${l[1]}" target="_blank" rel="noopener" aria-label="${l[0]}"><svg viewBox="0 0 24 24">${l[2]}</svg></a>`).join('')}</div>`);
    const fl = document.createElement('a');
    fl.className = 'wa-float'; fl.target = '_blank'; fl.rel = 'noopener'; fl.setAttribute('aria-label', 'Chat on WhatsApp');
    fl.href = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent('Hello EVANA CHIC')}`;
    fl.innerHTML = `<svg viewBox="0 0 24 24">${ico.wa}</svg>`;
    document.body.appendChild(fl);
  }

  /* ---------- Go ---------- */
  buildHeader();
  buildSocials();
  updateBadge();
  loadStore().then(() => {
    initGridPage();
    initCategories();
    initCart();
    updateBadge();
  });
})();
