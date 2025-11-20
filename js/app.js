window.app = {
  data: null,
  activeGroupId: null,

  init() {
    this.data = loadStorage();
    this.render();
    this.bindEvents();
  },

  bindEvents() {
    // уже есть обработчики в ui.js и editor.js
  },

  render() {
    ui.renderGroups(this.data.groups, this.activeGroupId);

    if (this.activeGroupId === 'favorites') {
      document.getElementById('group-title').textContent = 'Избранные инструкции';
      const favorites = this.data.instructions.filter(i => i.favorite);
      ui.renderInstructions(favorites, true);
    } else if (this.activeGroupId) {
      const group = this.data.groups.find(g => g.id === this.activeGroupId);
      document.getElementById('group-title').textContent = group ? group.name : 'Неизвестная группа';
      const instructions = this.data.instructions.filter(i => i.groupId === this.activeGroupId);
      ui.renderInstructions(instructions, false);
    } else {
      // Ничего не выбрано
      document.getElementById('group-title').textContent = 'Выберите группу или "Главная"';
      ui.renderInstructions([], false);
    }
  },

  setActiveGroup(id) {
    this.activeGroupId = id;
    this.render();
  },

  addGroup(name) {
    const newId = 'group-' + Date.now();
    this.data.groups.push({ id: newId, name });
    saveStorage(this.data);
    this.render();
  },

  addInstruction(name, content) {
    const newId = 'instr-' + Date.now();
    this.data.instructions.push({
      id: newId,
      groupId: this.activeGroupId,
      name,
      content,
      favorite: false // по умолчанию не в избранном
    });
    saveStorage(this.data);
    this.render();
  },

  updateInstruction(id, name, content) {
    const instr = this.data.instructions.find(i => i.id === id);
    if (instr) {
      instr.name = name;
      instr.content = content;
      saveStorage(this.data);
      this.render();
    }
  },

  toggleFavorite(id) {
    const instr = this.data.instructions.find(i => i.id === id);
    if (instr) {
      instr.favorite = !instr.favorite;
      saveStorage(this.data);
      this.render(); // перерисовать текущий вид
    }
  },

  deleteInstruction(id) {
    this.data.instructions = this.data.instructions.filter(i => i.id !== id);
    saveStorage(this.data);
    this.render();
  }
};