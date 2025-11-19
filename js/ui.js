// В UIManager обновим renderGroups для работы с навигацией
renderGroups() {
    const navList = document.getElementById('groups-nav-list');
    const groups = this.storage.getGroups();
    
    // Очищаем, оставляя только "Главная"
    navList.innerHTML = '<li><a href="#" onclick="showHome(); return false;">Главная</a></li>';
    
    groups.forEach(group => {
        const li = document.createElement('li');
        li.innerHTML = `
            <a href="#" data-group-id="${group.id}">${group.name}</a>
        `;
        
        li.addEventListener('click', (e) => {
            e.preventDefault();
            this.selectGroup(group.id);
        });
        
        navList.appendChild(li);
    });
}

// Обновим selectGroup для работы с навигацией
selectGroup(groupId) {
    this.currentGroupId = groupId;

    // Обновить активное состояние в навигации
    document.querySelectorAll('#groups-nav-list a').forEach(link => {
        link.classList.remove('active');
    });

    const selectedLink = document.querySelector(`[data-group-id="${groupId}"]`);
    if (selectedLink) {
        selectedLink.classList.add('active');
    }

    // Показать инструкции группы
    this.renderInstructions(groupId);
    this.showInstructionsGrid();

    // Обновить заголовок
    const group = this.storage.getGroups().find(g => g.id === groupId);
    document.getElementById('content-title').textContent = group.name;
}

// Новый метод для отображения сетки инструкций
renderInstructions(groupId) {
    const grid = document.getElementById('instructions-grid');
    const instructions = this.storage.getInstructions(groupId);
    
    grid.innerHTML = '';
    
    if (instructions.length === 0) {
        grid.innerHTML = '<p class="empty-state">Нет инструкций. Создайте первую!</p>';
        return;
    }
    
    instructions.forEach(instruction => {
        const card = document.createElement('div');
        card.className = 'instruction-card';
        
        const date = new Date(instruction.createdAt).toLocaleDateString('ru-RU');

        card.innerHTML = `
            <div class="card-image">📋</div>
            <div class="card-content">
                <h3>${instruction.title}</h3>
                <p>${instruction.steps ? instruction.steps.length : 0} шагов</p>
                <div class="card-meta">
                    <span class="date">${date}</span>
                    <div class="card-actions">
                        <button class="edit-instruction" data-id="${instruction.id}" title="Редактировать">✏️</button>
                        <button class="favorite-btn ${instruction.favorite ? 'favorite' : ''}" data-id="${instruction.id}">⭐</button>
                        <button class="delete-instruction" data-id="${instruction.id}">🗑️</button>
                    </div>
                </div>
            </div>
        `;

        grid.appendChild(card);
    });
}

// Обновим showInstructionsList на showInstructionsGrid
showInstructionsGrid() {
    document.getElementById('welcome-screen').classList.add('hidden');
    document.getElementById('instructions-grid').classList.remove('hidden');
    document.getElementById('editor-view').classList.add('hidden');
}