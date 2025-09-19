export async function mount(container, { vfs, apps, ui, launchApp, args }) {
  container.innerHTML = '';
  container.classList.add('calculator');

  const display = document.createElement('input');
  display.className = 'calc-display';
  display.value = '0';
  display.readOnly = true;
  container.appendChild(display);

  let memory = 0;
  const rows = [
    ['MC', 'MR', 'M+', 'M-'],
    ['7','8','9','/'],
    ['4','5','6','*'],
    ['1','2','3','-'],
    ['0','.','=','+'],
    ['C']
  ];

  rows.forEach(row => {
    const rowDiv = document.createElement('div');
    rowDiv.className = 'calc-row';
    row.forEach(key => {
      const btn = document.createElement('button');
      btn.className = 'calc-btn';
      btn.textContent = key;
      btn.addEventListener('click', () => {
        if (key === 'C') {
          display.value = '0';
        } else if (key === '=') {
          try {
            display.value = eval(display.value).toString();
          } catch {
            display.value = 'Error';
          }
        } else if (key === 'MC') {
          memory = 0;
        } else if (key === 'MR') {
          display.value = memory.toString();
        } else if (key === 'M+') {
          try { memory += parseFloat(eval(display.value)); } catch {}
        } else if (key === 'M-') {
          try { memory -= parseFloat(eval(display.value)); } catch {}
        } else {
          if (display.value === '0' || display.value === 'Error') {
            display.value = key;
          } else {
            display.value += key;
          }
        }
      });
      rowDiv.appendChild(btn);
    });
    container.appendChild(rowDiv);
  });
}
