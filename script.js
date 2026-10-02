(() => {
  'use strict';

  const cfg = window.APP_CONFIG || {};
  const configured = cfg.SUPABASE_URL && cfg.SUPABASE_ANON_KEY && !/IDE_/.test(cfg.SUPABASE_URL + cfg.SUPABASE_ANON_KEY);
  const sb = configured && window.supabase ? window.supabase.createClient(cfg.SUPABASE_URL, cfg.SUPABASE_ANON_KEY) : null;
  const BUCKET = 'recipe-images';
  const SEED_URL = 'db/seed-recipes.json';
  const CATEGORIES = ['Főétel', 'Desszert', 'Leves', 'Péksütemény'];
  const MAX_IMAGE_SIDE = 900;
  const MAX_FILE_BYTES = 10 * 1024 * 1024;

  const $ = (id) => document.getElementById(id);
  const container = $('container');

  let recipes = [];
  let activeCategory = 'Összes';
  let imageBlob = null;
  let loadError = '';

  /* ---------- kis segédfüggvények ---------- */

  function h(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  }

  /* ---------- modalok ---------- */

  function openModal(id) {
    const modal = $(id);
    if (!modal) return;
    modal.classList.add('is-open');
    document.body.classList.add('modal-open');
  }

  function closeModal(id) {
    const modal = $(id);
    if (!modal) return;
    modal.classList.remove('is-open');
    if (!document.querySelector('.modal-overlay.is-open')) {
      document.body.classList.remove('modal-open');
    }
  }

  function openUploadModal() {
    setFormError('');
    openModal('uploadModal');
  }
  function closeUploadModal() {
    closeModal('uploadModal');
  }
  function closeSuccessModal() {
    closeModal('successModal');
  }

  /* ---------- receptek betöltése és megjelenítése ---------- */

  const mapRow = (r) => ({
    id: r.external_id,
    title: r.title,
    description: r.description || '',
    category: r.category,
    cuisine: r.cuisine || '',
    prepTime: r.prep_time_minutes,
    cookTime: r.cook_time_minutes,
    servings: r.servings,
    difficulty: r.difficulty,
    tags: Array.isArray(r.tags) ? r.tags : [],
    image: r.image_path || '',
    ingredients: r.ingredients || [],
    instructions: r.instructions || [],
  });

  async function loadSeed() {
    const res = await fetch(SEED_URL);
    if (!res.ok) throw new Error('HTTP ' + res.status);
    return res.json();
  }

  async function loadRecipes() {
    loadError = '';
    try {
      if (!sb) throw new Error('A Supabase nincs beállítva (config.js).');
      const { data, error } = await sb
        .from('recipes')
        .select('*')
        .order('created_at', { ascending: false })
        .order('id', { ascending: false });
      if (error) throw error;
      recipes = data.map(mapRow);
    } catch (err) {
      console.error('Supabase betöltés sikertelen:', err);
      try {
        recipes = await loadSeed();
        loadError = 'Az adatbázis nem érhető el, csak az alap receptek látszanak (feltöltés ilyenkor nem működik).';
      } catch (e2) {
        console.error(e2);
        recipes = [];
        loadError = 'A receptek betöltése nem sikerült.';
      }
    }
    render();
  }

  const fmtAmount = (n) => String(n).replace('.', ',');

  function ingredientText(i) {
    if (i.amount === null || i.amount === undefined) {
      return i.unit ? `${i.name} (${i.unit})` : i.name;
    }
    return [fmtAmount(i.amount), i.unit, i.name].filter(Boolean).join(' ');
  }

  function imageSrc(path) {
    if (typeof path !== 'string' || !path) return '';
    if (path.startsWith('data:image/') || /^https:\/\//.test(path)) return path;
    return /^[\w.\-%]+(\/[\w.\-%]+)*$/.test(path) ? encodeURI(path) : '';
  }

  function buildCard(r) {
    const card = h('article', 'rc-card');

    const src = imageSrc(r.image);
    if (src) {
      const img = h('img', 'rc-card-img');
      img.src = src;
      img.alt = r.title || 'Recept';
      img.loading = 'lazy';
      img.addEventListener('error', () => img.remove());
      card.appendChild(img);
    }

    const body = h('div', 'rc-card-body');
    body.appendChild(h('h3', 'rc-card-title', r.title));
    const total = (Number(r.prepTime) || 0) + (Number(r.cookTime) || 0);
    body.appendChild(
      h('p', 'rc-card-meta', `${r.category} · ${total} perc · ${r.servings} adag · ${r.difficulty}`)
    );
    if (r.description) body.appendChild(h('p', 'rc-card-desc', r.description));

    if (Array.isArray(r.tags) && r.tags.length) {
      const tags = h('div', 'rc-tags');
      r.tags.forEach((t) => tags.appendChild(h('span', 'rc-tag', '#' + t)));
      body.appendChild(tags);
    }

    const details = h('details', 'rc-details');
    details.appendChild(h('summary', '', 'Hozzávalók és elkészítés'));

    details.appendChild(h('h4', '', 'Hozzávalók'));
    (r.ingredients || []).forEach((g) => {
      if (g.group && (r.ingredients || []).length > 1) details.appendChild(h('h5', '', g.group));
      const ul = h('ul');
      (g.items || []).forEach((i) => ul.appendChild(h('li', '', ingredientText(i))));
      details.appendChild(ul);
    });

    details.appendChild(h('h4', '', 'Elkészítés'));
    (r.instructions || []).forEach((sec) => {
      if (sec.section && (r.instructions || []).length > 1) details.appendChild(h('h5', '', sec.section));
      const ol = h('ol');
      (sec.steps || []).forEach((st) => ol.appendChild(h('li', '', st)));
      details.appendChild(ol);
    });

    body.appendChild(details);
    card.appendChild(body);
    return card;
  }

  function render() {
    container.replaceChildren();
    const wrap = h('div', 'rc-wrap');

    const bar = h('div', 'rc-filters');
    bar.id = 'categoryBar';
    ['Összes', ...new Set([...CATEGORIES, ...recipes.map((r) => r.category)])].forEach((cat) => {
      const btn = h('button', 'rc-chip' + (cat === activeCategory ? ' is-active' : ''), cat);
      btn.type = 'button';
      btn.addEventListener('click', () => {
        activeCategory = cat;
        render();
      });
      bar.appendChild(btn);
    });
    wrap.appendChild(bar);

    if (loadError) {
      const box = h('div', 'rc-error-box');
      box.appendChild(h('p', '', loadError));
      const retry = h('button', 'btn btn-secondary', 'Újrapróbálás');
      retry.type = 'button';
      retry.addEventListener('click', loadRecipes);
      box.appendChild(retry);
      wrap.appendChild(box);
    }

    const visible = recipes.filter((r) => activeCategory === 'Összes' || r.category === activeCategory);
    if (!visible.length) {
      if (!loadError) wrap.appendChild(h('p', 'rc-empty', 'Ebben a kategóriában még nincs recept.'));
    } else {
      const grid = h('div', 'rc-grid');
      visible.forEach((r) => grid.appendChild(buildCard(r)));
      wrap.appendChild(grid);
    }

    container.appendChild(wrap);
  }

  /* ---------- dinamikus sorok az űrlapon ---------- */

  function addIngredientRow() {
    const row = h('div', 'dynamic-row');
    row.innerHTML =
      '<input type="text" placeholder="Mennyiség (pl. 50)" aria-label="Mennyiség" style="flex: 1;" required>' +
      '<input type="text" placeholder="Egység (pl. dkg, ek)" aria-label="Egység" style="flex: 1;">' +
      '<input type="text" placeholder="Hozzávaló neve (pl. finomliszt)" aria-label="Hozzávaló neve" style="flex: 2;" required>' +
      '<button type="button" class="btn btn-danger" onclick="removeRow(this)" title="Törlés" aria-label="Hozzávaló törlése"><i class="fa-solid fa-trash"></i></button>';
    $('ingredientsContainer').appendChild(row);
    row.querySelector('input').focus();
  }

  function removeRow(btn) {
    const list = $('ingredientsContainer');
    const row = btn.closest('.dynamic-row');
    if (list.children.length > 1) {
      row.remove();
    } else {
      row.querySelectorAll('input').forEach((i) => (i.value = ''));
    }
  }

  function renumberSteps() {
    $('stepsContainer')
      .querySelectorAll('textarea')
      .forEach((t, idx) => (t.placeholder = `${idx + 1}. lépés leírása...`));
  }

  function addStepRow() {
    const row = h('div', 'dynamic-row');
    row.innerHTML =
      '<textarea rows="2" aria-label="Lépés leírása" required></textarea>' +
      '<button type="button" class="btn btn-danger" onclick="removeStep(this)" title="Törlés" aria-label="Lépés törlése"><i class="fa-solid fa-trash"></i></button>';
    $('stepsContainer').appendChild(row);
    renumberSteps();
    row.querySelector('textarea').focus();
  }

  function removeStep(btn) {
    const list = $('stepsContainer');
    const row = btn.closest('.dynamic-row');
    if (list.children.length > 1) {
      row.remove();
    } else {
      row.querySelector('textarea').value = '';
    }
    renumberSteps();
  }

  /* ---------- kép kezelése ---------- */

  function compressImage(file) {
    return new Promise((resolve, reject) => {
      const url = URL.createObjectURL(file);
      const img = new Image();
      img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Érvénytelen képfájl.')); };
      img.onload = () => {
        URL.revokeObjectURL(url);
        const scale = Math.min(1, MAX_IMAGE_SIDE / Math.max(img.width, img.height));
        const canvas = document.createElement('canvas');
        canvas.width = Math.max(1, Math.round(img.width * scale));
        canvas.height = Math.max(1, Math.round(img.height * scale));
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error('A kép feldolgozása nem sikerült.'))), 'image/jpeg', 0.8);
      };
      img.src = url;
    });
  }

  async function previewImage(event) {
    const file = event.target.files && event.target.files[0];
    const preview = $('imagePreview');
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setFormError('Csak képfájlt lehet feltölteni.');
      event.target.value = '';
      return;
    }
    if (file.size > MAX_FILE_BYTES) {
      setFormError('A kép túl nagy (maximum 10 MB).');
      event.target.value = '';
      return;
    }
    try {
      imageBlob = await compressImage(file);
      preview.src = URL.createObjectURL(imageBlob);
      preview.style.display = 'block';
      setFormError('');
    } catch (err) {
      imageBlob = null;
      preview.removeAttribute('src');
      preview.style.display = 'none';
      setFormError(err.message);
    }
  }

  /* ---------- űrlap beküldése ---------- */

  function setFormError(message) {
    let box = $('formError');
    if (!box) {
      box = h('p', 'rc-form-error');
      box.id = 'formError';
      box.setAttribute('role', 'alert');
      const submit = document.querySelector('#recipeForm .btn-submit');
      submit.parentNode.insertBefore(box, submit);
    }
    box.textContent = message;
    box.style.display = message ? 'block' : 'none';
  }

  function resetForm() {
    $('recipeForm').reset();
    const ing = $('ingredientsContainer');
    while (ing.children.length > 1) ing.lastElementChild.remove();
    const steps = $('stepsContainer');
    while (steps.children.length > 1) steps.lastElementChild.remove();
    renumberSteps();
    imageBlob = null;
    const preview = $('imagePreview');
    preview.removeAttribute('src');
    preview.style.display = 'none';
    setFormError('');
  }

  const slug = (t) =>
    t.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 60) || 'recept';

  function collectFormData() {
    const items = Array.from($('ingredientsContainer').querySelectorAll('.dynamic-row'))
      .map((row) => {
        const [a, u, n] = Array.from(row.querySelectorAll('input')).map((i) => i.value.trim());
        const num = a.replace(',', '.');
        const isNum = num !== '' && !isNaN(Number(num));
        return { name: n, amount: isNum ? Number(num) : null, unit: u || (isNum ? '' : a) };
      })
      .filter((i) => i.name);

    const steps = Array.from($('stepsContainer').querySelectorAll('textarea'))
      .map((t) => t.value.trim())
      .filter(Boolean);

    if (!items.length) throw new Error('Adj meg legalább egy hozzávalót.');
    if (!steps.length) throw new Error('Adj meg legalább egy lépést.');

    const title = $('recipeTitle').value.trim();
    return {
      external_id: `${slug(title)}-${Math.random().toString(36).slice(2, 10)}`,
      title,
      description: $('description').value.trim() || null,
      category: $('category').value,
      cuisine: null,
      prep_time_minutes: Number($('prepTime').value),
      cook_time_minutes: $('cookTime').value === '' ? 0 : Number($('cookTime').value),
      servings: Number($('servings').value),
      difficulty: $('difficulty').value,
      tags: [],
      image_path: null,
      ingredients: [{ group: 'Hozzávalók', items }],
      instructions: [{ section: 'Elkészítés', steps }],
    };
  }

  async function handleFormSubmit(event) {
    event.preventDefault();
    const submitBtn = event.target.querySelector('.btn-submit');
    const originalHtml = submitBtn.innerHTML;
    setFormError('');
    submitBtn.disabled = true;
    submitBtn.textContent = 'Küldés...';

    try {
      if (!sb) throw new Error('A Supabase nincs beállítva (config.js), ezért most nem lehet menteni.');
      const row = collectFormData();

      if (imageBlob) {
        const path = `${row.external_id}.jpg`;
        const up = await sb.storage.from(BUCKET).upload(path, imageBlob, { contentType: 'image/jpeg' });
        if (up.error) throw new Error('A kép feltöltése nem sikerült: ' + up.error.message);
        row.image_path = sb.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
      }

      const { error } = await sb.from('recipes').insert(row);
      if (error) throw new Error('A mentés nem sikerült: ' + error.message);

      resetForm();
      closeUploadModal();
      openModal('successModal');
      await loadRecipes();
    } catch (err) {
      console.error('Feltöltési hiba:', err);
      setFormError(err instanceof TypeError ? 'Hálózati hiba, ellenőrizd a kapcsolatot.' : err.message);
    } finally {
      submitBtn.disabled = false;
      submitBtn.innerHTML = originalHtml;
    }
  }

  /* ---------- eseménykezelők és indulás ---------- */

  // Az index.html inline onclick/onsubmit attribútumai ezeket a globális neveket várják.
  Object.assign(window, {
    closeUploadModal,
    closeSuccessModal,
    handleFormSubmit,
    addIngredientRow,
    removeRow,
    addStepRow,
    removeStep,
    previewImage,
  });

  const openBtn = $('openUploadBtn');
  if (openBtn) {
    openBtn.addEventListener('click', (e) => {
      e.preventDefault();
      openUploadModal();
    });
  }

  document.querySelectorAll('.modal-overlay').forEach((overlay) => {
    overlay.addEventListener('mousedown', (e) => {
      if (e.target === overlay) closeModal(overlay.id);
    });
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      document.querySelectorAll('.modal-overlay.is-open').forEach((m) => closeModal(m.id));
    }
  });

  render();
  loadRecipes();
})();