/*
 * Spreadsheet app
 * Basit bir hesap tablosu düzenleyici: kullanıcı yeni bir tablo olu015fturabilir, dosya açıp kaydedebilir,
 * hazır şablonlar (fatura/bütçe) arasından seçim yapabilir, satır ve sütun ekleyebilir,
 * hücrelere veri girebilir ve çıktıyı yazdırabilir. Veriler VFS'te JSON olarak saklanır.
 */

const COL_LABELS = (n) => {
  // Oluşturulacak sütun etiketlerini hesaplar (A, B, ..., Z, AA, AB, ...)
  const labels = [];
  let i = 0;
  while (labels.length < n) {
    let s = '';
    let x = i;
    do {
      s = String.fromCharCode(65 + (x % 26)) + s;
      x = Math.floor(x / 26) - 1;
    } while (x >= 0);
    labels.push(s);
    i++;
  }
  return labels;
};

function createTable(root, rows, cols, data) {
  // Tablonun başlıklarını ve hücrelerini olu015fturur
  const table = document.createElement('table');
  table.className = 'spreadsheet-table';
  const thead = document.createElement('thead');
  const headerRow = document.createElement('tr');
  headerRow.appendChild(document.createElement('th')); // sol üst boş
  COL_LABELS(cols).forEach((label) => {
    const th = document.createElement('th');
    th.textContent = label;
    headerRow.appendChild(th);
  });
  thead.appendChild(headerRow);
  table.appendChild(thead);
  const tbody = document.createElement('tbody');
  for (let r = 0; r < rows; r++) {
    const tr = document.createElement('tr');
    const rowHeader = document.createElement('th');
    rowHeader.textContent = r + 1;
    tr.appendChild(rowHeader);
    for (let c = 0; c < cols; c++) {
      const td = document.createElement('td');
      td.contentEditable = 'true';
      td.dataset.row = r;
      td.dataset.col = c;
      td.textContent = data[r] && data[r][c] != null ? data[r][c] : '';
      td.addEventListener('input', (e) => {
        data[r] = data[r] || [];
        data[r][c] = td.textContent;
      });
      tr.appendChild(td);
    }
    tbody.appendChild(tr);
  }
  table.appendChild(tbody);
  return table;
}

function loadTemplate(name) {
  // Hazır şablon verilerini döndürür
  if (name === 'invoice') {
    return {
      rows: 15,
      cols: 6,
      data: [
        ['FATURA', '', '', '', '', ''],
        ['', '', '', '', '', ''],
        ['Ürün', 'Açıklama', 'Birim', 'Adet', 'Fiyat', 'Toplam'],
        ['Ürün 1', '', 'adet', '1', '100', '100'],
        ['Ürün 2', '', 'adet', '2', '50', '100'],
        ['', '', '', '', 'Ara toplam', '200'],
        ['', '', '', '', 'KDV (0.18)', '36'],
        ['', '', '', '', 'Genel Toplam', '236'],
      ],
    };
  }
  if (name === 'budget') {
    return {
      rows: 12,
      cols: 4,
      data: [
        ['Kategori', 'Tahmini', 'Gerçekleşen', 'Fark'],
        ['Kira', '5000', '', ''],
        ['Elektrik', '600', '', ''],
        ['Su', '200', '', ''],
        ['İnternet', '300', '', ''],
        ['Gıda', '1500', '', ''],
        ['Ulaşım', '800', '', ''],
      ],
    };
  }
  // Varsayılan boş tablo
  return { rows: 20, cols: 10, data: [] };
}

export async function mount(root, { args = {}, vfs }) {
  let currentPath = args.path || null;
  let { rows, cols, data } = loadTemplate('');
  // Eğer dosya yüklenecekse onu oku
  if (currentPath) {
    try {
      const json = await vfs.readFile(currentPath);
      const parsed = JSON.parse(json || '{}');
      rows = parsed.rows || rows;
      cols = parsed.cols || cols;
      data = parsed.data || data;
    } catch (e) {
      console.error('Dosya okunamadı:', e);
    }
  }

  root.classList.add('spreadsheet');
  const toolbar = document.createElement('div');
  toolbar.className = 'spreadsheet-toolbar';
  toolbar.innerHTML = `
    <button id="btnNew">Yeni</button>
    <button id="btnOpen">Aç</button>
    <button id="btnSave">Kaydet</button>
    <select id="selTemplate">
      <option value="">Şablon Yok</option>
      <option value="invoice">Fatura Şablonu</option>
      <option value="budget">Bütçe Şablonu</option>
    </select>
    <button id="btnAddRow">Satır Ekle</button>
    <button id="btnAddCol">Sütun Ekle</button>
    <button id="btnPrint">Yazdır</button>
    <input id="filePath" type="text" placeholder="/Documents/spreadsheet.json" style="flex:1 1 auto;" />
  `;
  root.appendChild(toolbar);

  let tableEl = createTable(root, rows, cols, data);
  root.appendChild(tableEl);

  function rebuildTable() {
    // Mevcut tabloyu kaldırıp yeni tablo oluştur
    if (tableEl) root.removeChild(tableEl);
    tableEl = createTable(root, rows, cols, data);
    root.appendChild(tableEl);
  }

  async function saveToFile() {
    const path = filePath.value.trim() || currentPath || '/Documents/spreadsheet.json';
    const content = JSON.stringify({ rows, cols, data });
    await vfs.writeFile(path, content);
    currentPath = path;
    alert('Dosya kaydedildi: ' + path);
  }

  async function openFile() {
    const path = prompt('Açılacak dosya yolu:', '/Documents/spreadsheet.json');
    if (!path) return;
    try {
      const json = await vfs.readFile(path);
      const parsed = JSON.parse(json || '{}');
      rows = parsed.rows || rows;
      cols = parsed.cols || cols;
      data = parsed.data || [];
      currentPath = path;
      filePath.value = path;
      rebuildTable();
    } catch (e) {
      alert('Dosya okunamadı: ' + e.message);
    }
  }

  function newTable() {
    rows = 20;
    cols = 10;
    data = [];
    currentPath = null;
    filePath.value = '';
    rebuildTable();
  }

  // Toolbar elementlerini seç
  const btnNew = toolbar.querySelector('#btnNew');
  const btnOpen = toolbar.querySelector('#btnOpen');
  const btnSave = toolbar.querySelector('#btnSave');
  const selTemplate = toolbar.querySelector('#selTemplate');
  const btnAddRow = toolbar.querySelector('#btnAddRow');
  const btnAddCol = toolbar.querySelector('#btnAddCol');
  const btnPrint = toolbar.querySelector('#btnPrint');
  const filePath = toolbar.querySelector('#filePath');

  btnNew.addEventListener('click', newTable);
  btnOpen.addEventListener('click', openFile);
  btnSave.addEventListener('click', saveToFile);
  btnAddRow.addEventListener('click', () => {
    rows += 1;
    rebuildTable();
  });
  btnAddCol.addEventListener('click', () => {
    cols += 1;
    rebuildTable();
  });
  selTemplate.addEventListener('change', (e) => {
    const tpl = loadTemplate(e.target.value);
    rows = tpl.rows;
    cols = tpl.cols;
    data = tpl.data;
    rebuildTable();
  });
  btnPrint.addEventListener('click', () => {
    // Yazdırma için yeni bir pencere açıp tabloyu yansıtalım
    const printWin = window.open('', '', 'width=800,height=600');
    printWin.document.write('<html><head><title>Yazdır</title>');
    printWin.document.write('<link rel="stylesheet" href="style.css">');
    printWin.document.write('</head><body>');
    const cloneTable = tableEl.cloneNode(true);
    cloneTable.style.width = '100%';
    cloneTable.style.borderCollapse = 'collapse';
    printWin.document.body.appendChild(cloneTable);
    printWin.document.write('</body></html>');
    printWin.document.close();
    printWin.focus();
    printWin.print();
    printWin.close();
  });
}
