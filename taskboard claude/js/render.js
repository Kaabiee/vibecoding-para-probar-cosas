const Render = {
    all() {
        this.header();
        this.board();
    },

    header() {
        const board = AppState.currentBoard;
        if (board) {
            $('#board-name').textContent = (board.locked ? '\u{1F512} ' : '') + board.name;
            // Update lock button state
            const lockBtn = $('#btn-lock-board');
            if (board.locked) {
                lockBtn.classList.add('is-locked');
                lockBtn.textContent = '\u{1F513}';
                lockBtn.title = 'Quitar contrasena';
            } else {
                lockBtn.classList.remove('is-locked');
                lockBtn.textContent = '\u{1F512}';
                lockBtn.title = 'Proteger con contrasena';
            }
        }
        // Rebuild dropdown items
        const dropdown = $('#board-dropdown');
        dropdown.innerHTML = '';
        AppState.boards.forEach(b => {
            const label = (b.locked ? '\u{1F512} ' : '') + b.name;
            const item = createElement('button', 'board-dropdown-item', label);
            if (b.id === AppState.currentBoardId) item.classList.add('active');
            item.addEventListener('click', () => {
                if (b.locked && b.id !== AppState.currentBoardId) {
                    Board.promptUnlock(b.id);
                } else {
                    Board.switch(b.id);
                }
                this.closeBoardDropdown();
            });
            dropdown.appendChild(item);
        });
    },

    toggleBoardDropdown() {
        const dropdown = $('#board-dropdown');
        const btn = $('#board-selector');
        const isOpen = !dropdown.classList.contains('hidden');
        if (isOpen) {
            this.closeBoardDropdown();
        } else {
            dropdown.classList.remove('hidden');
            btn.classList.add('open');
        }
    },

    closeBoardDropdown() {
        $('#board-dropdown').classList.add('hidden');
        $('#board-selector').classList.remove('open');
    },

    board() {
        const container = $('#board-container');
        container.innerHTML = '';
        const board = AppState.currentBoard;
        if (!board) return;

        board.columns.forEach((col, colIndex) => {
            container.appendChild(this._column(col, colIndex));
        });

        const addBtn = createElement('button', 'add-column-btn', '+ Agregar Columna');
        addBtn.addEventListener('click', () => Column.promptAdd());
        container.appendChild(addBtn);
    },

    _column(col, colIndex) {
        const column = createElement('div', 'column');
        column.dataset.columnId = col.id;
        column.dataset.columnIndex = colIndex;
        column.draggable = true;

        // Header
        const header = createElement('div', 'column-header');

        const titleWrap = createElement('div');
        titleWrap.style.display = 'flex';
        titleWrap.style.alignItems = 'center';
        titleWrap.style.flex = '1';

        const title = createElement('span', 'column-title', col.name);
        const count = createElement('span', 'column-card-count', `(${col.cards.length})`);
        titleWrap.appendChild(title);
        titleWrap.appendChild(count);

        const actions = createElement('div', 'column-actions');

        const renameBtn = createElement('button', 'btn-icon', '\u270E');
        renameBtn.title = 'Renombrar';
        renameBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            Column.promptRename(col.id);
        });

        const deleteBtn = createElement('button', 'btn-icon', '\u2715');
        deleteBtn.title = 'Eliminar';
        deleteBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            Column.delete(col.id);
        });

        actions.appendChild(renameBtn);
        actions.appendChild(deleteBtn);

        header.appendChild(titleWrap);
        header.appendChild(actions);
        column.appendChild(header);

        // Body (cards)
        const body = createElement('div', 'column-body');
        body.dataset.columnId = col.id;

        col.cards.forEach((card, cardIndex) => {
            body.appendChild(this._card(card, col.id, cardIndex));
        });

        column.appendChild(body);

        // Footer
        const footer = createElement('div', 'column-footer');
        const addBtn = createElement('button', 'btn-add-card', '+ Agregar tarjeta');
        addBtn.addEventListener('click', () => Card.promptAdd(col.id));
        footer.appendChild(addBtn);
        column.appendChild(footer);

        return column;
    },

    _card(card, columnId, cardIndex) {
        const el = createElement('div', 'card');
        el.dataset.cardId = card.id;
        el.dataset.columnId = columnId;
        el.dataset.cardIndex = cardIndex;
        el.draggable = true;

        const title = createElement('div', 'card-title', card.title);
        el.appendChild(title);

        if (card.description) {
            const desc = createElement('div', 'card-description', card.description);
            el.appendChild(desc);
        }

        const actions = createElement('div', 'card-actions');

        const editBtn = createElement('button', 'btn-icon', '\u270E');
        editBtn.title = 'Editar';
        editBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            Card.promptEdit(card.id);
        });

        const deleteBtn = createElement('button', 'btn-icon', '\u2715');
        deleteBtn.title = 'Eliminar';
        deleteBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            Card.delete(card.id);
        });

        actions.appendChild(editBtn);
        actions.appendChild(deleteBtn);
        el.appendChild(actions);

        el.addEventListener('click', () => Card.promptEdit(card.id));

        return el;
    }
};
