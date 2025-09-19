// Apps/FileManager/main.js
export async function mount(container, { vfs, apps, ui, launchApp, args }) {
  // Açılacak yol: parametre verilmişse onu, yoksa kök dizini kullan
  const targetPath = args && args.path ? args.path : '/';

  // Var olan Explorer dosya yöneticisini çağır
  window.dispatchEvent(new CustomEvent('open-folder', { detail: { path: targetPath } }));

  // Bu uygulamaya ait pencereyi kapatmak için window öğesini bulup kaldır
  // (close tuşuna basmak yerine doğrudan DOM’dan silmek yeterlidir)
  const winEl = container.closest('.window');
  if (winEl) {
    setTimeout(() => {
      winEl.remove();
    }, 0);
  }
}
