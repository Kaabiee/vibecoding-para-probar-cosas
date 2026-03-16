const Board = {
    create(name) {
        if (AppState.boards.length >= MAX_BOARDS) return;
        const board = {
            id: generateId(),
            name: name,
            createdAt: Date.now(),
            columns: DEFAULT_COLUMNS.map(col => ({
                id: generateId(),
                name: col.name,
                cards: []
            }))
        };
        AppState.boards.push(board);
        AppState.currentBoardId = board.id;
        Render.all();
    },

    rename(id, name) {
        const board = AppState.boards.find(b => b.id === id);
        if (board) {
            board.name = name;
            AppState.persist();
            Render.header();
        }
    },

    delete(id) {
        const idx = AppState.boards.findIndex(b => b.id === id);
        if (idx === -1 || AppState.boards.length <= 1) return;
        AppState.boards.splice(idx, 1);
        AppState.currentBoardId = AppState.boards[0].id;
        Render.all();
    },

    switch(id) {
        AppState.currentBoardId = id;
        Render.all();
    },

    promptNew() {
        Modal.show({
            title: 'Nuevo Tablero',
            fields: [{ name: 'name', label: 'Nombre', placeholder: 'Nombre del tablero' }],
            onConfirm(values) {
                if (values.name) Board.create(values.name);
            }
        });
    },

    promptRename() {
        const board = AppState.currentBoard;
        if (!board) return;
        Modal.show({
            title: 'Renombrar Tablero',
            fields: [{ name: 'name', label: 'Nombre', value: board.name }],
            onConfirm(values) {
                if (values.name) Board.rename(board.id, values.name);
            }
        });
    },

    promptDelete() {
        const board = AppState.currentBoard;
        if (!board || AppState.boards.length <= 1) return;
        Modal.show({
            title: 'Eliminar Tablero',
            fields: [{ name: 'confirm', label: `Escribe "${board.name}" para confirmar`, placeholder: board.name }],
            confirmText: 'Eliminar',
            onConfirm(values) {
                if (values.confirm === board.name) Board.delete(board.id);
            }
        });
    },

    promptSetPassword() {
        const board = AppState.currentBoard;
        if (!board) return;

        if (board.locked) {
            Modal.show({
                title: 'Quitar contrasena',
                fields: [{ name: 'password', label: 'Contrasena actual', type: 'password', placeholder: 'Ingresa la contrasena' }],
                confirmText: 'Quitar',
                onConfirm(values) {
                    if (Board._hashPassword(values.password) === board.passwordHash) {
                        delete board.locked;
                        delete board.passwordHash;
                        AppState.persist();
                        Render.all();
                    }
                }
            });
        } else {
            Modal.show({
                title: 'Proteger tablero',
                fields: [
                    { name: 'password', label: 'Contrasena', type: 'password', placeholder: 'Ingresa una contrasena' },
                    { name: 'confirm', label: 'Confirmar contrasena', type: 'password', placeholder: 'Repite la contrasena' }
                ],
                confirmText: 'Proteger',
                onConfirm(values) {
                    if (!values.password || values.password.length < 1) return;
                    if (values.password !== values.confirm) return;
                    board.locked = true;
                    board.passwordHash = Board._hashPassword(values.password);
                    AppState.persist();
                    Render.all();
                },
                extraContent: (body) => {
                    const info = createElement('div', 'template-create-info');
                    info.textContent = 'Se pedira la contrasena al abrir este tablero desde otro.';
                    body.appendChild(info);
                }
            });
        }
    },

    promptUnlock(boardId) {
        const board = AppState.boards.find(b => b.id === boardId);
        if (!board) return;

        Modal.show({
            title: '\u{1F512} Tablero protegido',
            fields: [{ name: 'password', label: 'Contrasena para "' + board.name + '"', type: 'password', placeholder: 'Ingresa la contrasena' }],
            confirmText: 'Desbloquear',
            onConfirm(values) {
                if (Board._hashPassword(values.password) === board.passwordHash) {
                    Board.switch(boardId);
                }
            }
        });
    },

    _hashPassword(password) {
        let hash = 0;
        for (let i = 0; i < password.length; i++) {
            const char = password.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        return 'h' + Math.abs(hash).toString(36);
    }
};
