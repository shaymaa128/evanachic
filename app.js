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
    const vlist = p.videos || [];
    const vids = vlist.map((v, k) => v.type === 'youtube'
      ? `<div class="vslide" data-vk="${k}" style="background-image:url('https://img.youtube.com/vi/${encodeURIComponent(v.id)}/hqdefault.jpg')"><span class="play">▶</span></div>`
      : `<div class="vslide" data-vk="${k}"><video src="${esc(v.src)}#t=0.1" preload="metadata" muted playsinline></video><span class="play">▶</span></div>`).join('');
    const slides = p.images.length + vlist.length;
    const dots = slides > 1 ? `<div class="dots">${Array.from({ length: slides }, (_, i) => `<i class="${i ? '' : 'on'}"></i>`).join('')}</div>` : '';
    const btns = (list, attr) => list.map(v => `<button type="button" class="opt" data-${attr}="${esc(v)}">${esc(v)}</button>`).join('');
    const optBlock = (p.options && p.options.length) ? `<div class="opt-label">Choose option</div><div class="opts" data-g="o">${btns(p.options, 'o')}</div>` : '';
    const sizeBlock = (p.sizes && p.sizes.length) ? `<div class="opt-label">Choose size</div><div class="opts" data-g="s">${btns(p.sizes, 's')}</div>` : '';
    return `<article class="box" data-id="${p.id}">
      <div class="slider">${imgs}${vids}</div>${dots}
      <div class="hint">Hold a photo to magnify · swipe for more${vlist.length ? ' · tap ▶ to watch the video' : ''}</div>
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
      const vs = e.target.closest('.vslide');
      if (vs) { const p = byId(box.dataset.id); openVideo(p && (p.videos || [])[+vs.dataset.vk]); return; }
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

  /* ---------- Video player (opens when a ▶ slide is tapped) ---------- */
  function openVideo(v) {
    if (!v) return;
    const m = document.createElement('div'); m.className = 'vmodal';
    m.innerHTML = `<button class="icon-btn vm-close" type="button" aria-label="Close">✕</button><div class="vm-box">${
      v.type === 'youtube'
        ? `<iframe src="https://www.youtube-nocookie.com/embed/${encodeURIComponent(v.id)}?autoplay=1&playsinline=1&rel=0" allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowfullscreen></iframe>`
        : `<video src="${esc(v.src)}" controls autoplay playsinline></video>`}</div>`;
    const onKey = e => { if (e.key === 'Escape') close(); };
    const close = () => { m.remove(); document.removeEventListener('keydown', onKey); };
    m.querySelector('.vm-close').onclick = close;
    m.addEventListener('click', e => { if (e.target === m) close(); });
    document.addEventListener('keydown', onKey);
    document.body.appendChild(m);
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

    function receipt(cart, subtotal, total, cust) {
      const lines = cart.map((it, n) => {
        const p = byId(it.id), d = plain(it);
        return `${n + 1}. ${p.name}${d ? ' (' + d + ')' : ''}\n    ${it.qty} x ${money(p.price)} = ${money(p.price * it.qty)}`;
      });
      const who = cust ? `Name: ${cust.name}\nPhone: ${cust.phone}\nAddress: ${cust.address}\n\n` : '';
      return `*EVANA CHIC - Order Receipt*\nDate: ${new Date().toLocaleDateString('en-GB')}\n\n${who}${lines.join('\n')}\n\n` +
        `Subtotal: ${money(subtotal)}\nDelivery: ${money(DELIVERY_FEE)}\n*TOTAL: ${money(total)}*\n\n` +
        `Payment method: Whish\nI will send ${money(total)} on Whish to ${WHISH_NUMBER}.\nDelivery: 10-15 days.`;
    }

    /* ---------- Modal helper ---------- */
    function openModal(html) {
      const old = $('.modal'); if (old) old.remove();
      const m = document.createElement('div'); m.className = 'modal';
      m.innerHTML = `<div class="modal-box">${html}</div>`;
      document.body.appendChild(m);
      requestAnimationFrame(() => m.classList.add('open'));
      return m;
    }

    /* ---------- Customer details form (name, address, phone) ---------- */
    function detailsForm(onDone) {
      const m = openModal(`
        <h3 class="gold-text">Delivery Details</h3>
        <form id="cust-form" novalidate>
          <label class="field"><span>Full name</span><input id="c-name" type="text" autocomplete="name" placeholder="Your full name"></label>
          <label class="field"><span>Address</span><textarea id="c-addr" rows="3" autocomplete="street-address" placeholder="City, street, building, floor"></textarea></label>
          <label class="field"><span>Phone number</span><input id="c-phone" type="tel" autocomplete="tel" inputmode="tel" placeholder="e.g. 71 123 456"></label>
          <button class="btn solid" type="submit">Continue</button>
          <button class="back" type="button" id="cust-back">Back to cart</button>
        </form>`);
      $('#cust-back', m).onclick = () => m.remove();
      $('#cust-form', m).onsubmit = e => {
        e.preventDefault();
        const name = $('#c-name', m).value.trim(), address = $('#c-addr', m).value.trim(), phone = $('#c-phone', m).value.trim();
        if (name.length < 3) { toast('Please enter your full name'); $('#c-name', m).focus(); return; }
        if (address.length < 6) { toast('Please enter your address'); $('#c-addr', m).focus(); return; }
        if (phone.replace(/\D/g, '').length < 7) { toast('Please enter a valid phone number'); $('#c-phone', m).focus(); return; }
        onDone({ name, address, phone });
      };
      setTimeout(() => $('#c-name', m).focus(), 50);
    }

    /* ---------- PDF receipt (drawn on canvas, so Arabic names/addresses work too) ---------- */
    function loadImg(src) {
      return new Promise(res => {
        const im = new Image(); let done = false;
        const fin = v => { if (!done) { done = true; res(v); } };
        im.onload = () => fin(im); im.onerror = () => fin(null);
        setTimeout(() => fin(null), 8000);
        im.src = src;
      });
    }
    function wrapText(ctx, text, maxW) {
      const out = [];
      String(text).split('\n').forEach(par => {
        let line = '';
        par.split(/\s+/).forEach(w => {
          const t = line ? line + ' ' + w : w;
          if (ctx.measureText(t).width <= maxW || !line) line = t; else { out.push(line); line = w; }
        });
        out.push(line);
      });
      return out;
    }
    function fitText(ctx, text, maxW) {
      let t = String(text);
      while (t.length > 1 && ctx.measureText(t).width > maxW) t = t.slice(0, -1);
      return t.length < String(text).length ? t.trim() + '…' : t;
    }
    function drawCover(ctx, im, x, y, w, h) {
      const r = Math.max(w / im.width, h / im.height), sw = w / r, sh = h / r;
      ctx.drawImage(im, (im.width - sw) / 2, (im.height - sh) / 2, sw, sh, x, y, w, h);
    }
    function makePdf(pages) {            // pages: [{w, h, bytes(JPEG)}] -> PDF Blob (A4)
      const enc = new TextEncoder(), chunks = [], offs = []; let len = 0;
      const push = d => { const u = typeof d === 'string' ? enc.encode(d) : d; chunks.push(u); len += u.length; };
      const obj = (n, body) => { offs[n] = len; push(n + ' 0 obj\n' + body + '\nendobj\n'); };
      const n = pages.length;
      push('%PDF-1.4\n');
      obj(1, '<< /Type /Catalog /Pages 2 0 R >>');
      obj(2, '<< /Type /Pages /Kids [' + pages.map((_, i) => (3 + 3 * i) + ' 0 R').join(' ') + '] /Count ' + n + ' >>');
      pages.forEach((p, i) => {
        const pg = 3 + 3 * i, ct = 4 + 3 * i, im = 5 + 3 * i, content = `q 595 0 0 842 0 0 cm /Im${i} Do Q`;
        obj(pg, `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /XObject << /Im${i} ${im} 0 R >> >> /Contents ${ct} 0 R >>`);
        obj(ct, `<< /Length ${content.length} >>\nstream\n${content}\nendstream`);
        offs[im] = len;
        push(`${im} 0 obj\n<< /Type /XObject /Subtype /Image /Width ${p.w} /Height ${p.h} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${p.bytes.length} >>\nstream\n`);
        push(p.bytes); push('\nendstream\nendobj\n');
      });
      const size = 3 + 3 * n, xref = len;
      let x = `xref\n0 ${size}\n0000000000 65535 f \n`;
      for (let k = 1; k < size; k++) x += String(offs[k]).padStart(10, '0') + ' 00000 n \n';
      push(x + `trailer\n<< /Size ${size} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`);
      return new Blob(chunks, { type: 'application/pdf' });
    }

    async function buildReceiptPdf(cart, subtotal, total, cust, orderNo) {
      const W = 1240, H = 1754, M = 80, GOLD = '#b8912a', DARK = '#161616', GREY = '#666';
      const SANS = '"Segoe UI", Roboto, Helvetica, Arial, sans-serif', SERIF = 'Georgia, "Times New Roman", serif';
      const imgs = await Promise.all(cart.map(it => loadImg(byId(it.id).images[0])));
      const pages = []; let ctx, y;
      const newPage = first => {
        const c = document.createElement('canvas'); c.width = W; c.height = H; pages.push(c);
        ctx = c.getContext('2d'); ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, W, H);
        ctx.textBaseline = 'alphabetic';
        if (first) {
          ctx.fillStyle = '#0b0b0b'; ctx.fillRect(0, 0, W, 230);
          ctx.fillStyle = GOLD; ctx.textAlign = 'center';
          ctx.font = `700 78px ${SERIF}`; ctx.fillText('EVANA CHIC', W / 2, 120);
          ctx.fillStyle = '#f6e3a1'; ctx.font = `400 30px ${SANS}`; ctx.fillText('ORDER RECEIPT', W / 2, 175);
          y = 290;
        } else {
          ctx.fillStyle = GOLD; ctx.textAlign = 'left'; ctx.font = `700 34px ${SERIF}`;
          ctx.fillText('EVANA CHIC – Order ' + orderNo + ' (continued)', M, M + 20); y = M + 80;
        }
        ctx.textAlign = 'left';
      };
      const line = (x1, x2, yy, col = '#ddd', w = 2) => { ctx.strokeStyle = col; ctx.lineWidth = w; ctx.beginPath(); ctx.moveTo(x1, yy); ctx.lineTo(x2, yy); ctx.stroke(); };
      const kv = (k, v, maxW) => {
        ctx.font = `600 28px ${SANS}`; ctx.fillStyle = GREY; ctx.fillText(k, M, y);
        ctx.font = `400 30px ${SANS}`; ctx.fillStyle = DARK;
        const base = y, ls = wrapText(ctx, v, maxW || W - M * 2 - 190);
        ls.forEach((t, i) => ctx.fillText(t, M + 190, base + i * 40));
        y = base + (ls.length - 1) * 40 + 48;
      };

      newPage(true);
      ctx.font = `400 28px ${SANS}`; ctx.fillStyle = GREY;
      ctx.fillText('Order no: ' + orderNo, M, y); ctx.textAlign = 'right';
      ctx.fillText('Date: ' + new Date().toLocaleDateString('en-GB'), W - M, y); ctx.textAlign = 'left';
      y += 40; line(M, W - M, y, GOLD, 3); y += 55;

      ctx.font = `700 32px ${SERIF}`; ctx.fillStyle = GOLD; ctx.fillText('CUSTOMER', M, y); y += 50;
      kv('Name', cust.name); kv('Phone', cust.phone); kv('Address', cust.address);
      y += 10; line(M, W - M, y, GOLD, 3); y += 55;

      ctx.font = `700 32px ${SERIF}`; ctx.fillStyle = GOLD; ctx.fillText('ITEMS', M, y); y += 30;

      const ROW = 200, IW = 130, IH = 170;
      for (let i = 0; i < cart.length; i++) {
        if (y + ROW > H - M - 20) newPage(false);
        const it = cart[i], p = byId(it.id), tx = M + IW + 30, rightX = W - M;
        if (imgs[i]) { try { drawCover(ctx, imgs[i], M, y + 10, IW, IH); } catch (e) {} }
        else { ctx.fillStyle = '#eee'; ctx.fillRect(M, y + 10, IW, IH); }
        ctx.strokeStyle = GOLD; ctx.lineWidth = 2; ctx.strokeRect(M, y + 10, IW, IH);
        ctx.fillStyle = DARK; ctx.font = `700 32px ${SANS}`;
        ctx.fillText(fitText(ctx, p.name, rightX - tx - 190), tx, y + 50);
        ctx.font = `400 27px ${SANS}`; ctx.fillStyle = GREY;
        let ly = y + 92;
        if (it.option) { ctx.fillText('Option: ' + it.option, tx, ly); ly += 38; }
        if (it.size) { ctx.fillText('Size: ' + it.size, tx, ly); ly += 38; }
        ctx.fillText(`${it.qty} x ${money(p.price)}`, tx, ly);
        ctx.textAlign = 'right'; ctx.fillStyle = DARK; ctx.font = `700 34px ${SANS}`;
        ctx.fillText(money(p.price * it.qty), rightX, y + 50); ctx.textAlign = 'left';
        y += ROW; line(M, W - M, y - 5);
      }

      if (y + 430 > H - M) newPage(false);
      y += 40;
      const row = (k, v, big) => {
        ctx.font = `${big ? 700 : 400} ${big ? 40 : 30}px ${big ? SERIF : SANS}`; ctx.fillStyle = big ? GOLD : DARK;
        ctx.fillText(k, W - M - 480, y); ctx.textAlign = 'right'; ctx.fillText(v, W - M, y); ctx.textAlign = 'left'; y += big ? 70 : 50;
      };
      row('Subtotal', money(subtotal)); row('Delivery', money(DELIVERY_FEE));
      line(W - M - 480, W - M, y - 25, GOLD, 3); y += 15; row('TOTAL', money(total), true);
      y += 20; line(M, W - M, y, GOLD, 3); y += 50;
      ctx.font = `600 28px ${SANS}`; ctx.fillStyle = DARK;
      ctx.fillText('Payment method: Whish', M, y); y += 42;
      ctx.font = `400 27px ${SANS}`; ctx.fillStyle = GREY;
      [`Send ${money(total)} on the Whish app to ${WHISH_NUMBER}.`, 'Delivery in 10-15 days. Delivery fees are included in the total.'].forEach(t => { ctx.fillText(t, M, y); y += 38; });
      ctx.textAlign = 'center'; ctx.fillStyle = GOLD; ctx.font = `italic 30px ${SERIF}`;
      ctx.fillText('Thank you for shopping at EVANA CHIC', W / 2, H - M); ctx.textAlign = 'left';

      const out = pages.map(c => {
        const bin = atob(c.toDataURL('image/jpeg', 0.88).split(',')[1]), bytes = new Uint8Array(bin.length);
        for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
        return { w: c.width, h: c.height, bytes };
      });
      return makePdf(out);
    }

    /* ---------- Final step: make the PDF, then share it to WhatsApp ---------- */
    async function finishOrder(cart, subtotal, total, cust) {
      const m = openModal(`<h3 class="gold-text">Preparing your receipt…</h3><p>Please wait a moment.</p>`);
      const orderNo = 'EC-' + Date.now().toString().slice(-6);
      let blob;
      try { blob = await buildReceiptPdf(cart, subtotal, total, cust, orderNo); }
      catch (e) { blob = null; }
      const textUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(receipt(cart, subtotal, total, cust))}`;
      if (!blob) {
        m.remove();
        openModal(`<h3 class="gold-text">Send Order</h3><p>We could not create the PDF, but you can send your order as a message.</p>
          <a class="btn solid" style="display:block;margin-top:18px;text-align:center" href="${textUrl}">Send on WhatsApp</a>
          <button class="back" type="button" id="done-close">Back to cart</button>`).querySelector('#done-close').onclick = () => $('.modal').remove();
        return;
      }
      const fileName = `EVANA-CHIC-${orderNo}.pdf`;
      const file = new File([blob], fileName, { type: 'application/pdf' });
      const download = () => {
        const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = fileName;
        document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 20000);
      };
      // Phones that can share files: the PDF goes into WhatsApp automatically (attached, nothing to pick from storage).
      // Other devices: the PDF is saved and the WhatsApp chat opens with the order typed in.
      const canShare = !!(navigator.canShare && navigator.canShare({ files: [file] }));
      const waUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(receipt(cart, subtotal, total, cust) + '\n\nOrder no: ' + orderNo + '\n(PDF receipt attached)')}`;
      if (!canShare) download();
      const done = openModal(`
        <h3 class="gold-text">Receipt Ready ✓</h3>
        <p>${canShare
          ? `Tap the button, choose <b>WhatsApp</b>, then choose <b>EVANA CHIC</b> (${WHISH_NUMBER}) and press send. Your PDF receipt is attached automatically.`
          : `Your PDF receipt <b>${orderNo}</b> was saved on your device. Tap the button to open WhatsApp, then <b>attach the PDF</b> and press send.`}</p>
        <button class="btn solid" type="button" id="send-pdf">Send receipt on WhatsApp</button>`);
      $('#send-pdf', done).onclick = async () => {
        if (canShare) {
          try { await navigator.share({ files: [file], title: 'EVANA CHIC order ' + orderNo, text: receipt(cart, subtotal, total, cust) }); return; }
          catch (e) { if (e && e.name === 'AbortError') return; download(); }
        }
        window.open(waUrl, '_blank');
      };
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
          <button class="clear-btn" type="button" data-a="clear">Clear cart</button>
        </div>`;
      $('#agree').onchange = e => { agreed = e.target.checked; $('#checkout').disabled = !agreed; };
      $('#checkout').onclick = () => {
        if (!$('#agree').checked) { toast('Please tick the box first'); return; }
        popup(total, () => detailsForm(cust => finishOrder(cart, subtotal, total, cust)));
      };
    };
    root.addEventListener('click', e => {
      const b = e.target.closest('[data-a]'); if (!b) return;
      if (b.dataset.a === 'clear') {
        const m = openModal(`<h3 class="gold-text">Clear cart?</h3><p>All items will be removed from your cart.</p>
          <button class="btn solid" type="button" id="clear-yes">Yes, clear</button>
          <button class="back" type="button" id="clear-no">Cancel</button>`);
        $('#clear-no', m).onclick = () => m.remove();
        $('#clear-yes', m).onclick = () => { m.remove(); agreed = false; saveCart([]); draw(); toast('Cart cleared'); };
        return;
      }
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
