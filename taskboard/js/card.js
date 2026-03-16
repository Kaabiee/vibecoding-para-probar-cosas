const Card = {
    add(columnId, title) {
        const col = AppState.getColumn(columnId);
        if (!col || col.cards.length >= MAX_CARDS) return;
        col.cards.push({
            id: generateId(),
            title: title,
            description: '',
            createdAt: Date.now()
        });
        AppState.persist();
        Render.board();
    },

    edit(cardId, title, description) {
        const result = AppState.getCard(cardId);
        if (!result) return;
        result.card.title = title;
        result.card.description = description;
        AppState.persist();
        Render.board();
    },

    delete(cardId) {
        const result = AppState.getCard(cardId);
        if (!result) return;
        const idx = result.column.cards.findIndex(c => c.id === cardId);
        if (idx !== -1) {
            result.column.cards.splice(idx, 1);
            AppState.persist();
            Render.board();
        }
    },

    move(cardId, targetColumnId, targetIndex) {
        const result = AppState.getCard(cardId);
        if (!result) return;
        const sourceCol = result.column;
        const targetCol = AppState.getColumn(targetColumnId);
        if (!targetCol) return;

        const sourceIdx = sourceCol.cards.findIndex(c => c.id === cardId);
        const [card] = sourceCol.cards.splice(sourceIdx, 1);

        if (targetIndex === undefined || targetIndex >= targetCol.cards.length) {
            targetCol.cards.push(card);
        } else {
            targetCol.cards.splice(targetIndex, 0, card);
        }

        AppState.persist();
        Render.board();
    },

    promptAdd(columnId) {
        Modal.show({
            title: 'Nueva Tarjeta',
            fields: [
                { name: 'title', label: 'Titulo', placeholder: 'Titulo de la tarjeta' }
            ],
            onConfirm(values) {
                if (values.title) Card.add(columnId, values.title);
            }
        });
    },

    promptEdit(cardId) {
        const result = AppState.getCard(cardId);
        if (!result) return;

        const board = AppState.currentBoard;
        const columnOptions = board.columns.map(col => ({
            value: col.id,
            label: col.name
        }));

        Modal.show({
            title: 'Editar Tarjeta',
            fields: [
                { name: 'title', label: 'Titulo', value: result.card.title },
                { name: 'description', label: 'Descripcion', type: 'textarea', value: result.card.description, placeholder: 'Descripcion opcional...' },
                { name: 'columnId', label: 'Mover a columna', type: 'select', options: columnOptions, value: result.column.id }
            ],
            onConfirm(values) {
                if (!values.title) return;
                Card.edit(cardId, values.title, values.description);
                if (values.columnId !== result.column.id) {
                    Card.move(cardId, values.columnId);
                }
            }
        });
    }
};
