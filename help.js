// help.js – Yardım ve kısayollar modali
(function () {
  let helpModal = null;

  function showHelp() {
    // Var olan modal varsa kapat
    if (helpModal) {
      helpModal.remove();
      helpModal = null;
      return;
    }

    // Modal oluştur
    helpModal = document.createElement('div');
    helpModal.className = 'help-overlay';
    helpModal.innerHTML = `
      <div class="help-window">
        <h2>Kısayollar ve Uygulama Yardımı</h2>

        <h3>Genel</h3>
        <ul>
          <li><strong>F1</strong> – Bu yardımı göster/gizle.</li>
          <li><strong>F11</strong> – Tam ekran modunu aç/kapat.</li>
          <li><strong>Alt + F4</strong> – Aktif pencereyi kapat.</li>
          <li><strong>Esc</strong> – Açık diyalog veya menüyü kapat.</li>
          <li><strong>Fareyle sürükle</strong> – Pencereleri taşır.</li>
          <li><strong>Çift tıklama pencere başlığı</strong> – Büyüt/küçült.</li>
        </ul>

        <h3>Notepad</h3>
        <ul>
          <li><strong>Ctrl + N</strong> – Yeni dosya.</li>
          <li><strong>Ctrl + O</strong> – Dosya aç.</li>
          <li><strong>Ctrl + S</strong> – Kaydet.</li>
          <li><strong>Ctrl + Shift + S</strong> – Farklı kaydet.</li>
          <li><strong>Ctrl + Z/Y</strong> – Geri al/Yinele.</li>
          <li><strong>Ctrl + C/X/V</strong> – Kopyala/Kes/Yapıştır.</li>
          <li><strong>Ctrl + A</strong> – Tümünü seç.</li>
          <li><strong>Ctrl + F</strong> – Bul.</li>
        </ul>

        <h3>Dosya Yöneticisi</h3>
        <ul>
          <li><strong>Çift tıklama</strong> – Klasöre gir veya dosyayı aç.</li>
          <li><strong>Geri tuşu / Backspace</strong> – Üst dizine çık.</li>
          <li><strong>F2</strong> – Yeniden adlandır.</li>
          <li><strong>Delete</strong> – Sil (geri dönüşüm kutusuna).</li>
          <li><strong>Ctrl + C/X/V</strong> – Kopyala/Kes/Yapıştır.</li>
          <li><strong>Ctrl + A</strong> – Tüm öğeleri seç.</li>
        </ul>

        <h3>Terminal</h3>
        <p>Komutlar:</p>
        <ul>
          <li><code>ls</code> – Geçerli dizini listele.</li>
          <li><code>cd &lt;dizin&gt;</code> – Dizin değiştir.</li>
          <li><code>mkdir &lt;ad&gt;</code> – Klasör oluştur.</li>
          <li><code>rm &lt;dosya&gt;</code> – Dosya sil.</li>
          <li><code>rm -r &lt;klasör&gt;</code> – Klasörü ve içeriğini sil.</li>
          <li><code>mv &lt;kaynak&gt; &lt;hedef&gt;</code> – Taşı/Yeniden adlandır.</li>
          <li><code>cp &lt;kaynak&gt; &lt;hedef&gt;</code> – Kopyala.</li>
          <li><code>cat &lt;dosya&gt;</code> – Dosya içeriğini görüntüle.</li>
          <li><code>echo &lt;yazı&gt; &gt; dosya</code> – Dosyaya yaz.</li>
          <li><code>help</code> – Terminal komutlarını listeler.</li>
          <li><code>exit</code> – Terminali kapat.</li>
        </ul>

        <h3>Tarayıcı (Browser)</h3>
        <ul>
          <li><strong>Ctrl + L</strong> – Adres çubuğunu seç.</li>
          <li><strong>Ctrl + T</strong> – Yeni sekme.</li>
          <li><strong>Ctrl + W</strong> – Sekmeyi kapat.</li>
          <li><strong>Alt + Sol/Sağ ok</strong> – Geri/İleri git.</li>
          <li><strong>Ctrl + R</strong> – Yenile.</li>
        </ul>

        <h3>Hesap Makinesi (Calculator)</h3>
        <ul>
          <li>Sayı ve operatör tuşlarına tıklayarak hesap yapabilirsiniz.</li>
          <li><strong>MC</strong> – Hafızayı temizler.</li>
          <li><strong>MR</strong> – Hafızadaki değeri çağırır.</li>
          <li><strong>M+</strong> – Hafızaya ekler.</li>
          <li><strong>M-</strong> – Hafızadan çıkarır.</li>
          <li><strong>C</strong> – Hesabı temizler.</li>
          <li><strong>=</strong> – Sonucu hesaplar.</li>
        </ul>

        <h3>Ayarlar (Settings)</h3>
        <ul>
          <li>Masaüstü ikonlarının görünürlüğünü açıp kapatabilirsiniz.</li>
          <li>Tema veya arka plan seçenekleri burada düzenlenebilir.</li>
        </ul>

        <button class="help-close">Kapat</button>
      </div>
    `;

    // Kapatma butonu
    helpModal.querySelector('.help-close').addEventListener('click', () => {
      helpModal.remove();
      helpModal = null;
    });

    document.body.appendChild(helpModal);
  }

  // F1 tuşunu dinle
  window.addEventListener('keydown', (ev) => {
    if (ev.key === 'F1') {
      ev.preventDefault();
      showHelp();
    }
  });

  // Stil (sayfanın geri kalanına karışmaması için burada ekliyoruz)
  const style = document.createElement('style');
  style.textContent = `
    .help-overlay {
      position: fixed;
      z-index: 9999;
      inset: 0;
      background: rgba(0, 0, 0, 0.6);
      display: flex;
      align-items: center;
      justify-content: center;
      backdrop-filter: blur(4px);
      animation: fadeIn 0.2s ease;
    }
    .help-window {
      max-width: 600px;
      max-height: 80vh;
      overflow-y: auto;
      background: var(--surface-1, #2b2b2b);
      color: var(--text-0, #f1f1f1);
      padding: 20px;
      border-radius: 8px;
      box-shadow: 0 10px 25px rgba(0, 0, 0, 0.4);
    }
    .help-window h2 {
      margin-top: 0;
    }
    .help-window h3 {
      margin-bottom: 6px;
      border-bottom: 1px solid var(--bg-3, #444);
      padding-bottom: 4px;
    }
    .help-window ul {
      margin: 0 0 12px 20px;
      padding: 0;
      list-style-type: disc;
    }
    .help-window li + li {
      margin-top: 4px;
    }
    .help-window code {
      background: rgba(0,0,0,0.2);
      padding: 2px 4px;
      border-radius: 3px;
      font-family: monospace;
    }
    .help-close {
      display: block;
      margin: 16px auto 0;
      padding: 8px 16px;
      background: var(--bg-2, #444);
      color: var(--text-0, #f1f1f1);
      border: none;
      border-radius: 4px;
      cursor: pointer;
      transition: background 0.2s, transform 0.1s;
    }
    .help-close:hover {
      background: var(--bg-3, #666);
      transform: scale(1.05);
    }
    @keyframes fadeIn {
      from { opacity: 0; }
      to   { opacity: 1; }
    }
  `;
  document.head.appendChild(style);
})();
