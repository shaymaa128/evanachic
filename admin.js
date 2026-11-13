/* ============================================================
   EVANA CHIC – admin page
   - Category sections: many pictures each
   - Boxes (products): many pictures each
   Everything is saved automatically in this browser.
   ============================================================ */
(async function () {
  const $ = (s, r = document) => r.querySelector(s);
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  await loadStore();
  const data = {
    categories: CATEGORIES.map(c => ({ name: c.name, images: [...(c.images || [])] })),
    products: PRODUCTS.map(p => ({ id: p.id, name: p.name, category: p.category, price: p.price, isNew: !!p.isNew, images: [...p.images], options: [...(p.options || [])], sizes: [...(p.sizes || [])], videos: (p.videos || []).map(v => ({ ...v })) }))
  };

  const parseList = s => [...new Set(String(s).split(/[,\u060c\n]/).map(x => x.trim()).filter(Boolean))];
  let newFiles = [];
  let newVideos = [];                      // videos chosen in the "Create a new box" form

  /* ---------- Videos ---------- */
  const ytId = url => { const m = String(url).match(/(?:youtu\.be\/|[?&]v=|\/shorts\/|\/embed\/|\/live\/)([A-Za-z0-9_-]{11})/); return m ? m[1] : ''; };
  const dl = (blob, name) => {
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name;
    document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 30000);
  };
  const wait = ms => new Promise(r => setTimeout(r, ms));
  /* A chosen video file is kept in this browser; "Export to website" downloads it so you can put it in the "videos" folder */
  async function takeVideo(f) {
    if (!f) return null;
    if (!/^video\//.test(f.type)) { alert('Please choose a video file (for example .mp4).'); return null; }
    const mb = f.size / 1048576;
    if (mb > 95) { alert('This video is ' + Math.round(mb) + ' MB. GitHub does not accept files above 100 MB, and a video this big makes the site slow. Please compress it or use a YouTube link.'); return null; }
    if (mb > 25 && !confirm('This video is ' + Math.round(mb) + ' MB. It is too big for the GitHub website upload (25 MB), so you must publish it with GitHub Desktop, and it will load slowly on phones. A YouTube link is better. Add it anyway?')) return null;
    const ext = ((f.name.match(/\.([A-Za-z0-9]{2,5})$/) || [])[1] || 'mp4').toLowerCase();
    const src = 'videos/v' + Date.now() + Math.floor(Math.random() * 1000) + '.' + ext;
    say('Saving video\u2026');
    try { await idbSet('vf:' + src, f); } catch (e) { alert('Could not keep the video in this browser (storage may be full).'); return null; }
    return { type: 'file', src };
  }
  const vidChips = (list, k, i) => list.length ? `<div class="vids">${list.map((v, j) =>
    `<span class="vchip">${v.type === 'youtube' ? '\u25b6 YouTube ' + esc(v.id) : '\ud83c\udf9e ' + esc(v.src.split('/').pop())}<button type="button" data-a="delvid" data-k="${k}" data-i="${i}" data-j="${j}" title="Remove video">\u2715</button></span>`).join('')}</div>` : '';
  const status = $('#status');
  const say = m => { status.textContent = m; };

  async function save() {
    try { await idbSet('data', data); say('Saved ✓ (in this browser)'); }
    catch (e) { say('Could not save – the browser may be blocking storage or is full.'); }
  }

  /* Resize every chosen picture so the site stays fast */
  async function readImages(files) {
    const out = [];
    for (const f of files) {
      try {
        const bmp = await createImageBitmap(f);
        const max = 1100, k = Math.min(1, max / Math.max(bmp.width, bmp.height));
        const c = document.createElement('canvas');
        c.width = Math.round(bmp.width * k); c.height = Math.round(bmp.height * k);
        c.getContext('2d').drawImage(bmp, 0, 0, c.width, c.height);
        out.push(c.toDataURL('image/jpeg', 0.82));
      } catch (e) { /* skip files that are not pictures */ }
    }
    return out;
  }

  const thumbs = (imgs, kind, i) => `<div class="thumbs">${imgs.map((s, j) =>
    `<div class="th"><img src="${s}" alt=""><button type="button" data-a="delimg" data-k="${kind}" data-i="${i}" data-j="${j}" title="Remove">✕</button></div>`).join('')}</div>`;

  function renderCats() {
    $('#cats').innerHTML = data.categories.map((c, i) => `
      <div class="adm-card">
        <div class="adm-row">
          <input class="adm-in" data-a="catname" data-i="${i}" value="${esc(c.name)}">
          <button type="button" class="adm-del" data-a="delcat" data-i="${i}">Delete category</button>
        </div>
        ${thumbs(c.images, 'cat', i)}
        <label class="btn small">+ Add pictures
          <input type="file" accept="image/*" multiple hidden data-a="addimg" data-k="cat" data-i="${i}">
        </label>
      </div>`).join('') || '<p class="adm-note">No categories yet.</p>';

    const opts = data.categories.map(c => `<option>${esc(c.name)}</option>`).join('');
    const sel = $('#nb-cat'), keep = sel.value;
    sel.innerHTML = opts; if (keep) sel.value = keep;
  }

  function renderProds() {
    $('#prods').innerHTML = data.products.map((p, i) => `
      <div class="adm-card">
        <div class="adm-row">
          <input class="adm-in" data-a="pname" data-i="${i}" value="${esc(p.name)}" placeholder="Name">
          <input class="adm-in" data-a="pprice" data-i="${i}" type="number" min="0" step="0.01" value="${esc(p.price)}" placeholder="Price">
          <select class="adm-in" data-a="pcat" data-i="${i}">
            ${data.categories.map(c => `<option ${c.name === p.category ? 'selected' : ''}>${esc(c.name)}</option>`).join('')}
          </select>
          <label class="adm-check"><input type="checkbox" data-a="pnew" data-i="${i}" ${p.isNew ? 'checked' : ''}> New collection</label>
        </div>
        <div class="adm-row">
          <label class="adm-lbl">Options (commas) <input class="adm-in" data-a="popts" data-i="${i}" value="${esc((p.options || []).join(', '))}" placeholder="1, 2, 3"></label>
          <label class="adm-lbl">Sizes (commas) <input class="adm-in" data-a="psizes" data-i="${i}" value="${esc((p.sizes || []).join(', '))}" placeholder="S, M, L"></label>
        </div>
        ${thumbs(p.images, 'prod', i)}
        ${vidChips(p.videos || [], 'prod', i)}
        <div class="adm-row">
          <input class="adm-in" data-vl="${i}" placeholder="Paste a YouTube link">
          <button type="button" class="btn small" data-a="addlink" data-i="${i}">+ Add video link</button>
          <label class="btn small">+ Add video file
            <input type="file" accept="video/*" hidden data-a="addvfile" data-i="${i}">
          </label>
        </div>
        <div class="adm-row">
          <label class="btn small">+ Add pictures
            <input type="file" accept="image/*" multiple hidden data-a="addimg" data-k="prod" data-i="${i}">
          </label>
          <button type="button" class="adm-del" data-a="delprod" data-i="${i}">Delete box</button>
        </div>
      </div>`).join('') || '<p class="adm-note">No boxes yet – create your first one above.</p>';
  }
  const renderAll = () => { renderCats(); renderProds(); };

  /* ---------- Clicks ---------- */
  document.addEventListener('click', async e => {
    const b = e.target.closest('button[data-a]'); if (!b) return;
    const i = +b.dataset.i, a = b.dataset.a;

    if (a === 'delimg') {
      const list = b.dataset.k === 'cat' ? data.categories[i].images : data.products[i].images;
      list.splice(+b.dataset.j, 1);
      renderAll(); save();
    }
    if (a === 'delvid') {
      const v = data.products[i].videos.splice(+b.dataset.j, 1)[0];
      if (v && v.type === 'file') { try { await idbDelete('vf:' + v.src); } catch (err) {} }
      renderProds(); save();
    }
    if (a === 'addlink') {
      const inp = document.querySelector('input[data-vl="' + i + '"]'), id = ytId(inp ? inp.value : '');
      if (!id) { alert('Please paste a YouTube link (for example https://youtu.be/xxxxxxxxxxx).'); return; }
      data.products[i].videos.push({ type: 'youtube', id });
      renderProds(); save();
    }
    if (a === 'delcat') {
      const name = data.categories[i].name;
      if (data.products.some(p => p.category === name)) { alert('Move or delete the boxes in "' + name + '" first.'); return; }
      if (!confirm('Delete category "' + name + '"?')) return;
      data.categories.splice(i, 1); renderAll(); save();
    }
    if (a === 'delprod') {
      if (!confirm('Delete box "' + data.products[i].name + '"?')) return;
      data.products.splice(i, 1); renderProds(); save();
    }
  });

  /* ---------- Changes (typing, selecting, choosing files) ---------- */
  document.addEventListener('change', async e => {
    const t = e.target, a = t.dataset && t.dataset.a, i = +t.dataset.i;

    if (a === 'catname') {
      const old = data.categories[i].name, nu = t.value.trim();
      if (!nu || data.categories.some((c, k) => k !== i && c.name === nu)) { t.value = old; return; }
      data.products.forEach(p => { if (p.category === old) p.category = nu; });
      data.categories[i].name = nu; renderAll(); save();
    }
    if (a === 'pname') { data.products[i].name = t.value.trim() || data.products[i].name; save(); }
    if (a === 'pprice') { data.products[i].price = parseFloat(t.value) || 0; save(); }
    if (a === 'pcat') { data.products[i].category = t.value; save(); }
    if (a === 'pnew') { data.products[i].isNew = t.checked; save(); }
    if (a === 'popts') { data.products[i].options = parseList(t.value); t.value = data.products[i].options.join(', '); save(); }
    if (a === 'psizes') { data.products[i].sizes = parseList(t.value); t.value = data.products[i].sizes.join(', '); save(); }

    if (a === 'addimg') {
      say('Processing pictures…');
      const imgs = await readImages(t.files);
      const target = t.dataset.k === 'cat' ? data.categories[i] : data.products[i];
      target.images.push(...imgs);
      renderAll(); save();
    }
    if (a === 'addvfile') {
      const v = await takeVideo(t.files[0]); t.value = '';
      if (v) { data.products[i].videos.push(v); renderProds(); save(); } else say('Ready');
    }
    if (t.id === 'nb-vfile') {
      const v = await takeVideo(t.files[0]); t.value = '';
      if (v) newVideos.push(v);
      $('#nb-vcount').textContent = newVideos.length ? newVideos.length + ' video file(s) ready' : 'No video file chosen';
      say('Ready');
    }
    if (t.id === 'nb-files') {
      say('Processing pictures…');
      newFiles = await readImages(t.files);
      $('#nb-count').textContent = newFiles.length ? newFiles.length + ' picture(s) ready' : 'No pictures chosen';
      say('Ready');
    }
  });

  /* ---------- Top buttons ---------- */
  $('#add-cat').onclick = () => {
    const inp = $('#new-cat'), name = inp.value.trim();
    if (!name) return;
    if (data.categories.some(c => c.name === name)) { alert('That category already exists.'); return; }
    data.categories.push({ name, images: [] });
    inp.value = ''; renderAll(); save();
  };

  $('#nb-create').onclick = () => {
    const name = $('#nb-name').value.trim();
    if (!name) { alert('Please type a name for the box.'); return; }
    if (!data.categories.length) { alert('Add a category first.'); return; }
    const link = $('#nb-vlink').value.trim(), vids = [...newVideos];
    if (link) {
      const id = ytId(link);
      if (!id) { alert('The video link is not a YouTube link. Paste a link like https://youtu.be/xxxxxxxxxxx or clear the field.'); return; }
      vids.unshift({ type: 'youtube', id });
    }
    data.products.unshift({
      id: 'p' + Date.now(), name,
      price: parseFloat($('#nb-price').value) || 0,
      category: $('#nb-cat').value, isNew: $('#nb-new').checked,
      images: newFiles.length ? newFiles : [ph(name, 1)],
      options: parseList($('#nb-opts').value), sizes: parseList($('#nb-sizes').value),
      videos: vids
    });
    newFiles = []; newVideos = [];
    ['#nb-name', '#nb-price', '#nb-files', '#nb-vlink', '#nb-vfile'].forEach(s => $(s).value = '');
    $('#nb-count').textContent = 'No pictures chosen';
    $('#nb-vcount').textContent = 'No video file chosen';
    renderProds(); save();
  };

  $('#export').onclick = async () => {
    const js = '/* Exported from the EVANA CHIC admin page */\nwindow.STORE_DATA = ' + JSON.stringify(data) + ';\n';
    dl(new Blob([js], { type: 'text/javascript' }), 'store-data.js');
    // video files added in this browser are downloaded too, so you can put them in the "videos" folder
    let n = 0;
    for (const p of data.products) for (const v of p.videos || []) {
      if (v.type !== 'file') continue;
      let blob = null; try { blob = await idbGet('vf:' + v.src); } catch (e) {}
      if (blob) { await wait(800); dl(blob, v.src.split('/').pop()); n++; }
    }
    say(n
      ? 'Downloaded store-data.js and ' + n + ' video file(s). Put the video files in a folder named "videos" in your site folder, replace store-data.js, then publish. (If the browser asks, allow multiple downloads.)'
      : 'Downloaded store-data.js – replace the old one in your site folder and publish.');
  };

  $('#reset').onclick = async () => {
    if (!confirm('Delete everything you added in this browser and go back to the starter data?')) return;
    await idbDelete('data'); location.reload();
  };

  renderAll();
  say('Ready – changes save automatically.');
})();
