export function mount(el) {
  const container = document.createElement('div');
  container.classList.add('calendar-app');
  container.innerHTML = `
    <h1>Takvim & Görev Listesi</h1>
    <div class="calendar-controls">
      <label for="calendar-date-input">Tarih:</label>
      <input type="date" id="calendar-date-input" />
    </div>
    <ul id="calendar-task-list" class="task-list"></ul>
    <div class="task-entry">
      <input type="text" id="calendar-task-input" placeholder="Yeni görev..." />
      <button id="calendar-add-task">Ekle</button>
    </div>
  `;
  el.appendChild(container);

  // State
  let tasks = {};
  let selectedDate = new Date().toISOString().substring(0, 10);

  // Elements
  const dateInput = container.querySelector('#calendar-date-input');
  const taskListEl = container.querySelector('#calendar-task-list');
  const taskInput = container.querySelector('#calendar-task-input');
  const addTaskBtn = container.querySelector('#calendar-add-task');

  async function loadTasks() {
    try {
      const data = await window.vfs.readFile('/calendar.json');
      tasks = JSON.parse(data);
    } catch (e) {
      tasks = {};
    }
  }

  async function saveTasks() {
    await window.vfs.writeFile('/calendar.json', JSON.stringify(tasks));
  }

  function renderTaskList() {
    taskListEl.innerHTML = '';
    const dateTasks = tasks[selectedDate] || [];
    dateTasks.forEach((task, idx) => {
      const li = document.createElement('li');
      li.className = 'task-item';
      const span = document.createElement('span');
      span.textContent = task;
      const removeBtn = document.createElement('button');
      removeBtn.textContent = 'X';
      removeBtn.className = 'remove-btn';
      removeBtn.addEventListener('click', async () => {
        dateTasks.splice(idx, 1);
        tasks[selectedDate] = dateTasks;
        await saveTasks();
        renderTaskList();
      });
      li.appendChild(span);
      li.appendChild(removeBtn);
      taskListEl.appendChild(li);
    });
  }

  dateInput.value = selectedDate;
  dateInput.addEventListener('change', () => {
    selectedDate = dateInput.value;
    renderTaskList();
  });

  addTaskBtn.addEventListener('click', async () => {
    const value = taskInput.value.trim();
    if (!value) return;
    if (!tasks[selectedDate]) tasks[selectedDate] = [];
    tasks[selectedDate].push(value);
    taskInput.value = '';
    await saveTasks();
    renderTaskList();
  });

  // Initial load
  loadTasks().then(() => {
    if (!tasks[selectedDate]) tasks[selectedDate] = [];
    renderTaskList();
  });

  return () => {
    // Cleanup on unmount
    container.remove();
  };
}
