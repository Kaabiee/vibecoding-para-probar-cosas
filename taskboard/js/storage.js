const Storage = {
    _createDefaultData() {
        const boardId = generateId();
        return {
            version: 1,
            currentBoardId: boardId,
            boards: [{
                id: boardId,
                name: 'Mi Proyecto',
                createdAt: Date.now(),
                columns: DEFAULT_COLUMNS.map(col => ({
                    id: generateId(),
                    name: col.name,
                    cards: []
                }))
            }]
        };
    },

    load() {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            if (!raw) return this._createDefaultData();
            const data = JSON.parse(raw);
            if (!data || !data.boards || !data.boards.length) {
                return this._createDefaultData();
            }
            return data;
        } catch {
            return this._createDefaultData();
        }
    },

    save(data) {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
        } catch (e) {
            console.error('Error saving data:', e);
        }
    },

    reset() {
        localStorage.removeItem(STORAGE_KEY);
    }
};
