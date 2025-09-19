// Apps/Settings/main.js — Uygulama ve kök kısayollarını yönetir, modal uyarı kullanır
const SETTINGS_PATH = '/System/settings.json';

export async function mount(root, { vfs }) {
  // mevcut ayarları yükle
  let current = {};
  try { current = JSON.parse((await vfs.readFile(SETTINGS_PATH)) || '{}'); }
  catch { current = {}; }

  root.innerHTML = `
    <div class="settings">
      <aside class="s-nav">
        <button data-pane="genel" class="active">Genel</button>
        <button data-pane="arkaplan">Arkaplan</button>
        <button data-pane="masaustu">Masaüstü</button>
        <button data-pane="dosyalar">Dosyalar</button>
      </aside>

      <section class="s-body">
        <!-- GENEL -->
        <div class="pane" data-pane="genel">
          <h2>Genel</h2>
          <label class="row">
            <span>Tema</span>
            <select id="theme">
              <option value="dark">Koyu</option>
              <option value="light">Açık</option>
            </select>
          </label>

          <label class="row">
            <span>Kompakt görev çubuğu</span>
            <input type="checkbox" id="taskbarCompact"/>
          </label>

          <label class="row">
            <span>Başlat menüsü yüksekliği (px)</span>
            <input type="number" id="startMenuHeight" min="360" max="900" step="10"/>
          </label>

          <label class="row">
            <span>Explorer varsayılan görünüm</span>
            <select id="defaultExplorerView">
              <option value="small">Küçük</option>
              <option value="medium">Orta</option>
              <option value="large">Büyük</option>
              <option value="list">Liste</option>
              <option value="details">Detaylar</option>
            </select>
          </label>

          <label class="row">
            <span>Başlat menüsü stili</span>
            <select id="taskbarStartStyle">
              <option value="">Simge + Metin</option>
              <option value="icon">Sadece Simge</option>
            </select>
          </label>

          <h3>Masaüstü Kök Kısayolları</h3>
          <label class="row"><span>Documents</span><input type="checkbox" id="showDocuments"/></label>
          <label class="row"><span>Recycle</span><input type="checkbox" id="showRecycle"/></label>
          <label class="row"><span>Apps</span><input type="checkbox" id="showApps"/></label>
          <label class="row"><span>System</span><input type="checkbox" id="showSystem"/></label>

          <h3>Uygulama Kısayolları</h3>
          <div id="appShortcuts"></div>
        </div>

        <!-- ARKA PLAN -->
        <div class="pane" data-pane="arkaplan" hidden>
          <h2>Arkaplan</h2>
          <label class="row">
            <span>Mod</span>
            <select id="bgMode">
              <option value="sphere">Dinamik (Sphere)</option>
              <option value="solid">Düz Renk</option>
              <option value="image">Görsel</option>
            </select>
          </label>

          <label class="row solid-only">
            <span>Renk</span>
            <input type="color" id="bgColor"/>
          </label>

          <div class="row image-only">
            <span>Görsel (VFS)</span>
            <div class="v" style="gap:6px; align-items:center;">
              <input type="text" id="bgImagePath" placeholder="/Documents/wallpapers/..." readonly style="width:280px;"/>
              <button id="pickVfsImage">VFS'ten Seç</button>
              <button id="clearImage" class="ghost">Temizle</button>
            </div>
          </div>
          <div class="hint image-only" style="margin-left:220px; color:var(--text-2); font-size:12px;">
            Not: VFS içindeki görsel dosyaları tercihen <code>data:image/...;base64,...</code> biçiminde saklayın. Dosya içeriği bu biçimde değilse otomatik olarak base64'e çevirmeyi deneriz.
          </div>

          <label class="row sphere-only">
            <span>Dinamik hız</span>
            <input type="range" id="sphereSpeed" min="0.5" max="3" step="0.1"/>
          </label>
        </div>

        <!-- MASAÜSTÜ -->
        <div class="pane" data-pane="masaustu" hidden>
          <h2>Masaüstü Izgarası</h2>
          <label class="row"><span>Genişlik</span><input type="number" id="gridW" min="60" max="200" step="2"/></label>
          <label class="row"><span>Yükseklik</span><input type="number" id="gridH" min="60" max="200" step="2"/></label>
          <label class="row"><span>Sol boşluk</span><input type="number" id="gridMX" min="0" max="60" step="2"/></label>
          <label class="row"><span>Üst boşluk</span><input type="number" id="gridMY" min="0" max="60" step="2"/></label>
        </div>

        <!-- DOSYALAR -->
        <div class="pane" data-pane="dosyalar" hidden>
          <h2>Dosya İlişkilendirmeleri</h2>
          <div class="hint">Örnek: .txt → app.notepad</div>
          <textarea id="assoc" rows="6" spellcheck="false"
            placeholder='{"\\.txt":"app.notepad",".png":"app.paint"}'></textarea>
        </div>

        <footer class="s-foot">
          <div class="left">
            <button id="btnDefaults" class="ghost">Varsayılanlara Dön</button>
          </div>
          <div class="right">
            <button id="btnApply">Uygula</button>
            <button id="btnSave">Kaydet</button>
          </div>
        </footer>
      </section>
    </div>
  `;

  // yardımcılar
  const byId = (id)=> root.querySelector('#'+id);
  const val = (obj, path, def)=> path.split('.').reduce((a,k)=> (a&&a[k]!=null?a[k]:undefined), obj) ?? def;

  // uygulama listesi doldurma
  const appShortcutsDiv = root.querySelector('#appShortcuts');
  let manifestList = [];
  try {
    manifestList = await window.apps.list();
  } catch { manifestList = []; }
  const existingDesktopApps = Array.isArray(current.desktopApps) ? current.desktopApps : [];
  manifestList.forEach(app => {
    const row = document.createElement('label');
    row.className = 'row';
    const span = document.createElement('span');
    span.textContent = app.name;
    const cb = document.createElement('input');
    cb.type = 'checkbox';
    cb.dataset.appId = app.id;
    cb.checked = existingDesktopApps.includes(app.id);
    row.appendChild(span);
    row.appendChild(cb);
    appShortcutsDiv.appendChild(row);
  });

  // formu doldur
  byId('theme').value = val(current,'theme','dark');
  byId('taskbarCompact').checked = !!val(current,'taskbarCompact', false);
  byId('startMenuHeight').value = val(current,'startMenuHeight',520);
  byId('defaultExplorerView').value = val(current,'defaultExplorerView','medium');
  byId('taskbarStartStyle').value = val(current,'taskbarStartStyle','');

  // Masaüstü kök kısayolları
  const di = current.desktopItems || {};
  byId('showDocuments').checked = !!di.documents;
  byId('showRecycle').checked   = !!di.recycle;
  byId('showApps').checked      = !!di.apps;
  byId('showSystem').checked    = !!di.system;

  // Arka plan değerleri
  const bgMode = val(current,'background.mode','sphere');
  byId('bgMode').value = bgMode;
  byId('bgColor').value = val(current,'background.color','#0b0f14');
  if (val(current,'background.imagePath','')) byId('bgImagePath').value = current.background.imagePath || '';
  byId('sphereSpeed').value = val(current,'background.sphere.speed',1);

  // Masaüstü ızgarası
  const grid = current.desktopGrid || { w:96, h:100, marginX:16, marginY:16 };
  byId('gridW').value  = grid.w;
  byId('gridH').value  = grid.h;
  byId('gridMX').value = grid.marginX;
  byId('gridMY').value = grid.marginY;

  byId('assoc').value = JSON.stringify(current.assoc || {}, null, 2);

  // Sekme geçişleri
  root.querySelector('.s-nav').addEventListener('click', (e)=>{
    const btn = e.target.closest('button'); if(!btn) return;
    root.querySelectorAll('.s-nav button').forEach(b=>b.classList.remove('active'));
    btn.classList.add('active');
    const pane = btn.dataset.pane;
    root.querySelectorAll('.pane').forEach(p=>p.hidden = (p.dataset.pane !== pane));
  });

  // Arka plan moduna göre alanları göster/gizle
  function updateBgVisibility() {
    const mode = byId('bgMode').value;
    root.querySelectorAll('.solid-only').forEach(l => l.style.display = (mode==='solid' ? '' : 'none'));
    root.querySelectorAll('.image-only').forEach(l => l.style.display = (mode==='image' ? '' : 'none'));
    root.querySelectorAll('.sphere-only').forEach(l => l.style.display = (mode==='sphere' ? '' : 'none'));
  }
  byId('bgMode').addEventListener('change', updateBgVisibility);
  updateBgVisibility();

  // VFS görsel seçici
  byId('pickVfsImage').addEventListener('click', async ()=>{
    const picker = (window.ui && window.ui.pickVfsFile) ? window.ui.pickVfsFile : localPickVfsFile;
    const path = await picker({ title:'Görsel Seç (VFS)', startPath:'/Documents', acceptExts:['.png','.jpg','.jpeg','.gif','.webp'] });
    if (!path) return;
    byId('bgImagePath').value = path;

    let content = '';
    try { content = await vfs.readFile(path); } catch { content=''; }
    let data = content;
    if (!/^data:image\\//i.test(content||'')) {
      const ext = (path.match(/\\.[^.]+$/)?.[0]||'').toLowerCase();
      const mime = { '.png':'image/png', '.jpg':'image/jpeg', '.jpeg':'image/jpeg', '.gif':'image/gif', '.webp':'image/webp' }[ext] || 'application/octet-stream';
      try { data = `data:${mime};base64,${btoa(content)}`; }
      catch { window.ui.showAlert({ title:'Hata', message:'Seçilen VFS dosyası görüntü olarak çözümlenemedi. Lütfen data URL olarak kaydedin.' }); return; }
    }
    byId('pickVfsImage').dataset.preview = data;
  });
  byId('clearImage').addEventListener('click', ()=>{
    byId('bgImagePath').value = '';
    delete byId('pickVfsImage').dataset.preview;
  });

  // Masaüstü kök kısayollarını güncelleyen yardımcı
  async function updateDesktopLinks(desktopItems) {
    const deskPath = '/Desktop';
    const targets = [
      { key:'documents', name:'Documents.lnk', target:'/Documents' },
      { key:'recycle',   name:'Recycle.lnk',   target:'/Recycle'   },
      { key:'apps',      name:'Apps.lnk',      target:'/Apps'      },
      { key:'system',    name:'System.lnk',    target:'/System'    },
    ];
    const list = await vfs.list(deskPath).catch(()=>[]);
    const names = new Set(list.map(i=>i.name));
    for (const t of targets) {
      const want = !!desktopItems[t.key];
      const exists = names.has(t.name);
      if (want && !exists) {
        const type = await vfs.statType(t.target).catch(()=>null);
        if (!type) continue;
        const link = {
          type:'link', version:1, createdAt:Date.now()/1000, name:t.name,
          target:{ kind:type, targetId:null, targetPath:t.target, appId:null, args:{} },
          icon:{ source:'auto' },
          run:{ startIn: deskPath, arguments:'' }
        };
        await vfs.writeFile(`${deskPath}/${t.name}`, JSON.stringify(link,null,2));
      }
      if (!want && exists) {
        await vfs.delete(deskPath, t.name, { toRecycle:false }).catch(()=>{});
      }
    }
  }

  // Uygulama kısayollarını güncelleyen yardımcı
  async function updateAppShortcuts(appIds) {
    const desktop = '/Desktop';
    const existing = await vfs.list(desktop).catch(()=>[]);
    const names = new Set(existing.map(i => i.name));
    // manifestList hazır: mount başında doldurduk
    for (const app of manifestList) {
      const linkName = `${app.name}.lnk`;
      const want = appIds.includes(app.id);
      const exists = names.has(linkName);
      if (want && !exists) {
        const link = {
          type:'link',
          version:1,
          createdAt:Date.now()/1000,
          name: linkName,
          target: { kind:'app', appId: app.id, targetId:null, targetPath:null, args:{} },
          icon: { source:'auto' },
          run: { startIn: desktop, arguments:'' }
        };
        await vfs.writeFile(`${desktop}/${linkName}`, JSON.stringify(link, null, 2));
      }
      if (!want && exists) {
        await vfs.delete(desktop, linkName, { toRecycle:false }).catch(()=>{});
      }
    }
  }

  // Uygula: kaydetmeden canlı uygula
  byId('btnApply').addEventListener('click', async ()=>{
    const next = collectForm(current, root);
    window.dispatchEvent(new CustomEvent('settings-changed', { detail: next }));
    if (next.desktopGrid) window.dispatchEvent(new CustomEvent('update-desktop-grid', { detail: next.desktopGrid }));
    await updateDesktopLinks(next.desktopItems);
    await updateAppShortcuts(next.desktopApps || []);
    window.dispatchEvent(new Event('render-desktop'));
  });

  // Kaydet (+ canlı uygula)
  byId('btnSave').addEventListener('click', async ()=>{
    const next = collectForm(current, root);
    await vfs.writeFile(SETTINGS_PATH, JSON.stringify(next, null, 2));
    window.dispatchEvent(new CustomEvent('settings-changed', { detail: next }));
    if (next.desktopGrid) window.dispatchEvent(new CustomEvent('update-desktop-grid', { detail: next.desktopGrid }));
    await updateDesktopLinks(next.desktopItems);
    await updateAppShortcuts(next.desktopApps || []);
    window.dispatchEvent(new Event('render-desktop'));
    if (window.ui && window.ui.showAlert) {
      await window.ui.showAlert({ title:'Ayarlar', message:'Ayarlar kaydedildi.', okText:'Tamam' });
    } else {
      alert('Ayarlar kaydedildi.');
    }
  });

  // Varsayılanlar
  byId('btnDefaults').addEventListener('click', ()=>{
    byId('theme').value = 'dark';
    byId('taskbarCompact').checked = false;
    byId('startMenuHeight').value = 520;
    byId('defaultExplorerView').value = 'medium';
    byId('taskbarStartStyle').value = '';
    byId('showDocuments').checked = false;
    byId('showRecycle').checked = false;
    byId('showApps').checked = false;
    byId('showSystem').checked = false;
    // tüm app check'lerini boşalt
    appShortcutsDiv.querySelectorAll('input[type="checkbox"]').forEach(cb => cb.checked = false);
    byId('bgMode').value = 'sphere';
    byId('bgColor').value = '#0b0f14';
    byId('gridW').value = 96;
    byId('gridH').value = 100;
    byId('gridMX').value = 16;
    byId('gridMY').value = 16;
    byId('assoc').value = JSON.stringify({ ".txt":"app.notepad",".md":"app.notepad",".png":"app.paint",".jpg":"app.paint",".jpeg":"app.paint" }, null, 2);
    byId('bgImagePath').value = '';
    byId('sphereSpeed').value = 1;
    delete byId('pickVfsImage').dataset.preview;
    updateBgVisibility();
  });
}

// Form to settings object
function collectForm(prev, root){
  const g = {
    w: num(root, 'gridW', 96),
    h: num(root, 'gridH', 100),
    marginX: num(root, 'gridMX', 16),
    marginY: num(root, 'gridMY', 16),
  };
  const assoc = safeParseJSON(root.querySelector('#assoc').value, prev.assoc || {});
  const imagePath = root.querySelector('#bgImagePath').value || '';
  const imageData = root.querySelector('#pickVfsImage').dataset.preview || (prev.background?.imageData || '');
  const mode = root.querySelector('#bgMode').value;
  const bg = {
    mode,
    color: root.querySelector('#bgColor').value,
    imagePath,
    imageData,
    sphere: prev.background?.sphere || {}
  };
  if (mode === 'sphere') {
    bg.sphere.speed = parseFloat(root.querySelector('#sphereSpeed').value) || 1;
  }

  // uygulama kısayolları
  const selectedApps = Array.from(root.querySelectorAll('#appShortcuts input[type="checkbox"]'))
    .filter(cb => cb.checked)
    .map(cb => cb.dataset.appId);

  return {
    ...prev,
    theme: root.querySelector('#theme').value,
    taskbarCompact: root.querySelector('#taskbarCompact').checked,
    startMenuHeight: num(root, 'startMenuHeight', 520),
    defaultExplorerView: root.querySelector('#defaultExplorerView').value,
    taskbarStartStyle: root.querySelector('#taskbarStartStyle').value,
    desktopGrid: g,
    background: bg,
    assoc,
desktopItems: {
  documents: root.querySelector('#showDocuments').checked,
  recycle:   root.querySelector('#showRecycle').checked,
  apps:      root.querySelector('#showApps').checked,
  system:    root.querySelector('#showSystem').checked, // DÜZELTİLDİ
},
desktopApps: selectedApps // Uygulama kısayolları listesi

  };
}

function num(root, id, def){ const v = Number(root.querySelector('#'+id).value); return Number.isFinite(v) ? v : def; }
function safeParseJSON(s, fallback){ try{ return JSON.parse(s); }catch{ return fallback; } }

// Basit yerel VFS dosya seçici (window.ui.pickVfsFile yoksa)
function localPickVfsFile({ title='VFS Dosya Seç', startPath='/Documents', acceptExts=['.png','.jpg','.jpeg','.gif','.webp'] }={}){
  return new Promise((resolve)=>{
    const ov = document.createElement('div');
    ov.className = 'modal-overlay';
    ov.innerHTML = `
      <div class="modal" role="dialog" aria-modal="true">
        <div class="hd">${title}</div>
        <div class="bd">
          <div class="crumbs" style="font-size:12px; color:var(--text-2); margin-bottom:8px;"></div>
          <div class="list" style="max-height:360px; overflow:auto; border:1px solid var(--border); border-radius:10px;"></div>
        </div>
        <div class="ft">
          <button class="btn cancel">İptal</button>
          <button class="btn primary ok" disabled>Seç</button>
        </div>
      </div>`;
    document.body.appendChild(ov);
    const listEl = ov.querySelector('.list');
    const crumbs = ov.querySelector('.crumbs');
    const btnOk = ov.querySelector('.ok');
    const btnCancel = ov.querySelector('.cancel');
    let cwd = startPath || '/Documents';
    let sel = null;
    function full(p, name){ return (p==='/'?'':p) + '/' + name; }

    async function render(){
      crumbs.textContent = cwd;
      listEl.innerHTML = '';
      if (cwd!=='/') {
        const up = document.createElement('div');
        up.className = 'item';
        up.style.cssText = 'display:flex;gap:8px;align-items:center;padding:8px 10px;';
        up.innerHTML = '<div>⬆️</div><div class="name">..</div>';
        up.onclick = ()=>{ cwd = cwd.split('/').slice(0,-1).join('/') || '/'; sel=null; btnOk.disabled=true; render(); };
        listEl.appendChild(up);
      }
      const rows = await window.vfs.list(cwd).catch(()=>[]);
      const dirs = rows.filter(r=>r.type==='dir').sort((a,b)=> a.name.localeCompare(b.name,'tr'));
      const files = rows.filter(r=>r.type==='file').sort((a,b)=> a.name.localeCompare(b.name,'tr'));

      for (const d of dirs) {
        const el = document.createElement('div');
        el.className = 'item';
        el.style.cssText = 'display:flex;gap:8px;align-items:center;padding:8px 10px;cursor:pointer;';
        el.innerHTML = '<div>📁</div><div class="name"></div>'; el.querySelector('.name').textContent = d.name;
        el.onclick = ()=>{ cwd = full(cwd, d.name); sel=null; btnOk.disabled=true; render(); };
        listEl.appendChild(el);
      }
      for (const f of files) {
        if (!acceptExts || acceptExts.includes((f.ext||'').toLowerCase())) {
          const el = document.createElement('div');
          el.className = 'item';
          el.style.cssText = 'display:flex;gap:8px;align-items:center;padding:8px 10px;cursor:pointer;';
          el.innerHTML = '<div>🖼️</div><div class="name"></div>'; el.querySelector('.name').textContent = f.name;
          el.onclick = ()=>{
            sel = full(cwd, f.name);
            Array.from(listEl.children).forEach(x=> x.classList.remove('sel'));
            el.classList.add('sel');
            btnOk.disabled = !sel;
          };
          el.ondblclick = ()=>{ sel = full(cwd, f.name); close(sel); };
          listEl.appendChild(el);
        }
      }
    }
    function close(v){ ov.remove(); resolve(v); }
    btnCancel.onclick = ()=> close(null);
    btnOk.onclick = ()=> close(sel);
    ov.addEventListener('pointerdown', (e)=>{ if (e.target===ov) close(null); });
    render();
  });
}
