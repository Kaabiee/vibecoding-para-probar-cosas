const Column = {
    add(name) {
        const board = AppState.currentBoard;
        if (!board || board.columns.length >= MAX_COLUMNS) return;
        board.columns.push({
            id: generateId(),
            name: name,
            cards: []
        });
        AppState.persist();
        Render.board();
    },

    rename(id, name) {
        const col = AppState.getColumn(id);
        if (col) {
            col.name = name;
            AppState.persist();
            Render.board();
        }
    },

    delete(id) {
        const board = AppState.currentBoard;
        if (!board) return;
        const idx = board.columns.findIndex(c => c.id === id);
        if (idx !== -1) {
            board.columns.splice(idx, 1);
            AppState.persist();
            Render.board();
        }
    },

    reorder(fromIndex, toIndex) {
        const board = AppState.currentBoard;
        if (!board) return;
        const [col] = board.columns.splice(fromIndex, 1);
        board.columns.splice(toIndex, 0, col);
        AppState.persist();
        Render.board();
    },

    promptAdd() {
        Modal.show({
            title: 'Nueva Columna',
            fields: [{ name: 'name', label: 'Nombre', placeholder: 'Nombre de la columna' }],
            onConfirm(values) {
                if (values.name) Column.add(values.name);
            }
        });
    },

    promptRename(id) {
        const col = AppState.getColumn(id);
        if (!col) return;
        Modal.show({
            title: 'Renombrar Columna',
            fields: [{ name: 'name', label: 'Nombre', value: col.name }],
            onConfirm(values) {
                if (values.name) Column.rename(id, values.name);
            }
        });
    }
};
