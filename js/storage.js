export class Storage {
    constructor() {
        this.storageKey = 'instruction_manager_data';
    }

    getData() {
        const data = localStorage.getItem(this.storageKey);
        return data ? JSON.parse(data) : { groups: [], instructions: [] };
    }

    saveData(data) {
        localStorage.setItem(this.storageKey, JSON.stringify(data));
    }

    // Группы
    getGroups() {
        return this.getData().groups;
    }

    addGroup(name) {
        const data = this.getData();
        const newGroup = {
            id: Date.now().toString(),
            name,
            createdAt: new Date().toISOString()
        };
        data.groups.push(newGroup);
        this.saveData(data);
        return newGroup;
    }

    updateGroup(id, name) {
        const data = this.getData();
        const group = data.groups.find(g => g.id === id);
        if (group) {
            group.name = name;
            this.saveData(data);
        }
    }

    deleteGroup(id) {
        const data = this.getData();
        data.groups = data.groups.filter(g => g.id !== id);
        data.instructions = data.instructions.filter(i => i.groupId !== id);
        this.saveData(data);
    }

    // Инструкции
    getInstructions(groupId) {
        return this.getData().instructions.filter(i => i.groupId === groupId);
    }

    getInstruction(id) {
        return this.getData().instructions.find(i => i.id === id);
    }

    addInstruction(groupId, instructionData) {
        const data = this.getData();
        const newInstruction = {
            id: Date.now().toString(),
            groupId,
            title: instructionData.title,
            html: instructionData.html,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            favorite: false
        };
        data.instructions.push(newInstruction);
        this.saveData(data);
        return newInstruction;
    }

    updateInstruction(id, instructionData) {
        const data = this.getData();
        const instruction = data.instructions.find(i => i.id === id);
        if (instruction) {
            Object.assign(instruction, instructionData);
            instruction.updatedAt = new Date().toISOString();
            this.saveData(data);
        }
    }

    toggleFavorite(id) {
        const data = this.getData();
        const instruction = data.instructions.find(i => i.id === id);
        if (instruction) {
            instruction.favorite = !instruction.favorite;
            this.saveData(data);
        }
    }

    getFavoriteInstructions() {
        return this.getData().instructions.filter(i => i.favorite);
    }

    deleteInstruction(id) {
        const data = this.getData();
        data.instructions = data.instructions.filter(i => i.id !== id);
        this.saveData(data);
    }
}
