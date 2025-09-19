export async function mount(container, { vfs }) {
  container.innerHTML = '';
  container.className = 'downloads';

  const header = document.createElement('h2');
  header.textContent = 'Downloads';
  container.appendChild(header);

  const upload = document.createElement('input');
  upload.type = 'file';
  upload.multiple = true;
  upload.addEventListener('change', async () => {
    const files = Array.from(upload.files || []);
    for (const file of files) {
      const buffer = await file.arrayBuffer();
      const bytes = new Uint8Array(buffer);
      let binary = '';
      for (const b of bytes) binary += String.fromCharCode(b);
      const base64 = btoa(binary);
      const mime = file.type || 'application/octet-stream';
      const dataUrl = `data:${mime};base64,${base64}`;
      try { await vfs.mkdir('/Downloads'); } catch {}
      await vfs.writeFile('/Downloads/' + file.name, dataUrl);
    }
    upload.value = '';
    renderList();
  });
  container.appendChild(upload);

  const listEl = document.createElement('div');
  listEl.className = 'downloads-list';
  container.appendChild(listEl);

  async function ensureDownloadsDir() {
    try {
      await vfs.mkdir('/Downloads');
    } catch {}
  }

  async function renderList() {
    await ensureDownloadsDir();
    const items = await vfs.list('/Downloads');
    listEl.innerHTML = '';
    if (!items.length) {
      const empty = document.createElement('p');
      empty.textContent = 'No downloaded files';
      listEl.appendChild(empty);
      return;
    }
    const supported = ['txt','md','png','jpg','jpeg'];
    items.forEach(item => {
      if (item.type !== 'file') return;
      const row = document.createElement('div');
      row.className = 'downloads-item';
      const nameSpan = document.createElement('span');
      nameSpan.textContent = item.name;
      row.appendChild(nameSpan);
      const ext = item.name.split('.').pop().toLowerCase();
      if (!supported.includes(ext)) {
        const btn = document.createElement('button');
        btn.textContent = 'Analyze';
        btn.className = 'analyze';
        btn.addEventListener('click', async () => {
          const content = await vfs.readFile('/Downloads/' + item.name);
          await vfs.writeFile('/Documents/' + item.name, content);
          alert('File analyzed and copied to Documents.');
        });
        row.appendChild(btn);
      }
      listEl.appendChild(row);
    });
  }

  await renderList();
}
