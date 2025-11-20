window.app = {
  data: null,
  activeGroupId: null,

  init() {
    this.data = loadStorage();
    this.render();
    this.bindEvents();
  },

  bindEvents() {
    // выбор группы и добавление инструкции обрабатываются в editor.js и ui.js
  },

  render() {
    ui.renderGroups(this.data.groups, this.activeGroupId);
    if (this.activeGroupId) {
      const group = this.data.groups.find(g => g.id === this.activeGroupId);
      document.getElementById('group-title').textContent = group ? group.name : 'Неизвестная группа';
      const instructions = this.data.instructions.filter(i => i.groupId === this.activeGroupId);
      ui.renderInstructions(instructions);
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
      content
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
  }
};