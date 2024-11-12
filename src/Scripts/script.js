// Инициализация списка задач
let tasks = JSON.parse(localStorage.getItem('tasks')) || [];

// Элементы интерфейса
const elements = {
    addTaskBtn: document.getElementById('addTaskBtn'),
    taskModal: document.getElementById('taskModal'),
    taskForm: document.getElementById('taskForm'),
    taskInput: document.getElementById('taskInput'),
    cancelBtn: document.getElementById('cancelBtn'),
    todoList: document.getElementById('todoList'),
    inProgressList: document.getElementById('inProgressList'),
    doneList: document.getElementById('doneList'),
    sortAscBtn: document.getElementById('sortAscBtn'),
    sortDescBtn: document.getElementById('sortDescBtn')
};

// Открытие/закрытие модального окна
const toggleModal = (isVisible) => {
    elements.taskModal.style.display = isVisible ? 'flex' : 'none';
    if (!isVisible) elements.taskForm.reset(); // Сброс поля ввода
};

elements.addTaskBtn.addEventListener('click', () => {
    toggleModal(true);
    elements.taskInput.focus();
});

elements.cancelBtn.addEventListener('click', () => toggleModal(false));
elements.taskModal.addEventListener('click', (e) => {
    if (e.target === elements.taskModal) toggleModal(false);
});

// Добавление задачи
elements.taskForm.addEventListener('submit', (e) => {
    e.preventDefault();
    addTask();
});

// Обработка нажатия клавиши Enter в поле ввода
elements.taskInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
        e.preventDefault(); // Чтобы не отправлялась форма
        addTask();
    }
});

function addTask() {
    const taskName = elements.taskInput.value.trim();
    if (taskName) {
        const task = { id: Date.now(), name: taskName, status: 'todo' };
        tasks.push(task);
        localStorage.setItem('tasks', JSON.stringify(tasks));
        addTaskToBoard(task);
        toggleModal(false);
    }
}

// Загрузка задач при загрузке страницы
window.onload = () => tasks.forEach(addTaskToBoard);

// Добавление задачи в соответствующую колонку
function addTaskToBoard(task) {
    const taskDiv = createTaskElement(task);
    getTaskList(task.status).appendChild(taskDiv);
}

// Создание HTML элемента задачи
function createTaskElement(task) {
    const taskDiv = document.createElement('div');
    taskDiv.classList.add('task');
    taskDiv.draggable = true;
    taskDiv.dataset.id = task.id;

    const taskText = document.createElement('span');
    taskText.textContent = task.name;
    taskText.classList.add('task-name');
    taskText.addEventListener('dblclick', () => editTask(taskDiv, task));

    const deleteBtn = document.createElement('button');
    deleteBtn.classList.add('delete-btn');
    deleteBtn.innerHTML = '×';
    deleteBtn.addEventListener('click', () => deleteTask(task.id));

    taskDiv.append(taskText, deleteBtn);
    taskDiv.addEventListener('dragstart', dragStart);
    taskDiv.addEventListener('dragend', dragEnd);

    return taskDiv;
}

// Редактирование задачи
function editTask(taskDiv, task) {
    const input = document.createElement('textarea');
    input.value = task.name;
    input.classList.add('edit-input');
    input.style.height = '100px'; // Задаем фиксированную высоту

    input.addEventListener('wheel', (e) => {
        if (input.scrollHeight > input.clientHeight) {
            e.stopPropagation(); // Остановить всплытие события
        }
    });

    input.addEventListener('blur', () => saveTaskName(input, task, taskDiv));
    input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            saveTaskName(input, task, taskDiv);
        }
    });

    taskDiv.innerHTML = '';
    taskDiv.appendChild(input);
    input.focus();
}

// Сохранение нового названия задачи
function saveTaskName(input, task, taskDiv) {
    const newName = input.value.trim();
    if (newName) task.name = newName;
    localStorage.setItem('tasks', JSON.stringify(tasks));
    taskDiv.replaceWith(createTaskElement(task));
}

// Автоматическое изменение высоты текстового поля
function autoResizeTextarea(textarea) {
    textarea.style.height = 'auto';
    textarea.style.height = `${textarea.scrollHeight}px`;
}

// Применяем autoResizeTextarea
elements.taskInput.addEventListener('input', () => autoResizeTextarea(elements.taskInput));

// Устанавливаем высоту при загрузке страницы
document.addEventListener('DOMContentLoaded', () => autoResizeTextarea(elements.taskInput));

// Перетаскивание задач
function dragStart(e) {
    e.dataTransfer.setData('text/plain', e.target.dataset.id);
    setTimeout(() => e.target.classList.add('dragging'), 0);
}

function dragEnd(e) {
    e.target.classList.remove('dragging');
}

// Перемещение задач между колонками
const boards = document.querySelectorAll('.board');
boards.forEach(board => {
    board.addEventListener('dragover', e => e.preventDefault());
    board.addEventListener('drop', dropTask);
});

function dropTask(e) {
    e.preventDefault();
    const id = e.dataTransfer.getData('text/plain');
    const task = tasks.find(t => t.id == id);
    task.status = e.currentTarget.dataset.status;
    localStorage.setItem('tasks', JSON.stringify(tasks));
    e.currentTarget.querySelector('.task-list').appendChild(document.querySelector(`[data-id='${id}']`));
}

// Удаление задачи
function deleteTask(id) {
    tasks = tasks.filter(task => task.id != id);
    localStorage.setItem('tasks', JSON.stringify(tasks));
    document.querySelector(`[data-id='${id}']`).remove();
}

// Получение списка задач по статусу
function getTaskList(status) {
    return {
        'todo': elements.todoList,
        'in-progress': elements.inProgressList,
        'done': elements.doneList
    }[status];
}

elements.sortAscBtn.addEventListener('click', () => sortTasks(true));
elements.sortDescBtn.addEventListener('click', () => sortTasks(false));

function sortTasks(isAscending) {
    // Создаем отдельные массивы для каждой колонки
    const todoTasks = tasks.filter(task => task.status === 'todo');
    const inProgressTasks = tasks.filter(task => task.status === 'in-progress');
    const doneTasks = tasks.filter(task => task.status === 'done');

    // Сортируем каждый массив отдельно
    const sortedTodoTasks = sortIndividualArray(todoTasks, isAscending);
    const sortedInProgressTasks = sortIndividualArray(inProgressTasks, isAscending);
    const sortedDoneTasks = sortIndividualArray(doneTasks, isAscending);

    // Обновляем основной массив задач в зависимости от статуса
    tasks = [...sortedTodoTasks, ...sortedInProgressTasks, ...sortedDoneTasks];
    
    // Сохраняем в localStorage
    localStorage.setItem('tasks', JSON.stringify(tasks));

    // Обновляем интерфейс
    refreshTaskBoard();
}

function sortIndividualArray(taskArray, isAscending) {
    return taskArray.sort((a, b) => {
        return isAscending 
            ? a.name.localeCompare(b.name) 
            : b.name.localeCompare(a.name);
    });
}

function refreshTaskBoard() {
    // Очищаем все колонки
    elements.todoList.innerHTML = '';
    elements.inProgressList.innerHTML = '';
    elements.doneList.innerHTML = '';

    // Перебираем и добавляем задачи в соответствующие колонки снова
    tasks.forEach(addTaskToBoard);
}

// Загрузка задач при загрузке страницы
window.onload = () => {
    tasks.forEach(addTaskToBoard);
};