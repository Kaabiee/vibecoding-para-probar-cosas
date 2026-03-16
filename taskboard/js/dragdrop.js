const DragDrop = {
    _dragData: null,
    _indicator: null,

    init() {
        const container = $('#board-container');

        container.addEventListener('dragstart', (e) => this._onDragStart(e));
        container.addEventListener('dragover', (e) => this._onDragOver(e));
        container.addEventListener('dragleave', (e) => this._onDragLeave(e));
        container.addEventListener('drop', (e) => this._onDrop(e));
        container.addEventListener('dragend', (e) => this._onDragEnd(e));
    },

    _onDragStart(e) {
        const card = e.target.closest('.card');
        const column = e.target.closest('.column');

        if (card) {
            this._dragData = {
                type: 'card',
                cardId: card.dataset.cardId,
                sourceColumnId: card.dataset.columnId
            };
            card.classList.add('dragging');
            e.dataTransfer.effectAllowed = 'move';
            e.dataTransfer.setData('text/plain', '');
        } else if (column && e.target.closest('.column-header')) {
            this._dragData = {
                type: 'column',
                columnId: column.dataset.columnId,
                columnIndex: parseInt(column.dataset.columnIndex)
            };
            column.classList.add('dragging');
            e.dataTransfer.effectAllowed = 'move';
            e.dataTransfer.setData('text/plain', '');
        }
    },

    _onDragOver(e) {
        if (!this._dragData) return;
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';

        this._removeIndicator();

        if (this._dragData.type === 'card') {
            this._handleCardDragOver(e);
        } else if (this._dragData.type === 'column') {
            this._handleColumnDragOver(e);
        }
    },

    _handleCardDragOver(e) {
        const columnBody = e.target.closest('.column-body');
        if (!columnBody) return;

        columnBody.classList.add('drag-over');

        const cards = [...columnBody.querySelectorAll('.card:not(.dragging)')];
        const insertIndex = this._getCardInsertIndex(cards, e.clientY);

        this._indicator = createElement('div', 'drop-indicator');
        if (insertIndex >= cards.length) {
            columnBody.appendChild(this._indicator);
        } else {
            columnBody.insertBefore(this._indicator, cards[insertIndex]);
        }
    },

    _handleColumnDragOver(e) {
        const container = $('#board-container');
        const columns = [...container.querySelectorAll('.column:not(.dragging)')];
        const insertIndex = this._getColumnInsertIndex(columns, e.clientX);

        this._indicator = createElement('div', 'column-drop-indicator');
        if (insertIndex >= columns.length) {
            const addBtn = container.querySelector('.add-column-btn');
            container.insertBefore(this._indicator, addBtn);
        } else {
            container.insertBefore(this._indicator, columns[insertIndex]);
        }
    },

    _onDragLeave(e) {
        const columnBody = e.target.closest('.column-body');
        if (columnBody && !columnBody.contains(e.relatedTarget)) {
            columnBody.classList.remove('drag-over');
        }
    },

    _onDrop(e) {
        e.preventDefault();
        if (!this._dragData) return;

        if (this._dragData.type === 'card') {
            this._dropCard(e);
        } else if (this._dragData.type === 'column') {
            this._dropColumn(e);
        }

        this._cleanup();
    },

    _dropCard(e) {
        const columnBody = e.target.closest('.column-body');
        if (!columnBody) return;

        const targetColumnId = columnBody.dataset.columnId;
        const cards = [...columnBody.querySelectorAll('.card:not(.dragging)')];
        const insertIndex = this._getCardInsertIndex(cards, e.clientY);

        // If dropping in the same column, adjust index for the removed card
        if (targetColumnId === this._dragData.sourceColumnId) {
            const result = AppState.getCard(this._dragData.cardId);
            if (!result) return;
            const currentIndex = result.column.cards.findIndex(c => c.id === this._dragData.cardId);
            let adjustedIndex = insertIndex;
            if (currentIndex < insertIndex) adjustedIndex--;
            Card.move(this._dragData.cardId, targetColumnId, adjustedIndex);
        } else {
            Card.move(this._dragData.cardId, targetColumnId, insertIndex);
        }
    },

    _dropColumn(e) {
        const container = $('#board-container');
        const columns = [...container.querySelectorAll('.column:not(.dragging)')];
        let insertIndex = this._getColumnInsertIndex(columns, e.clientX);

        const fromIndex = this._dragData.columnIndex;
        if (fromIndex < insertIndex) insertIndex--;

        if (fromIndex !== insertIndex) {
            Column.reorder(fromIndex, insertIndex);
        }
    },

    _onDragEnd(e) {
        this._cleanup();
    },

    _cleanup() {
        this._removeIndicator();
        $$('.dragging').forEach(el => el.classList.remove('dragging'));
        $$('.drag-over').forEach(el => el.classList.remove('drag-over'));
        this._dragData = null;
    },

    _removeIndicator() {
        if (this._indicator && this._indicator.parentNode) {
            this._indicator.parentNode.removeChild(this._indicator);
        }
        this._indicator = null;
    },

    _getCardInsertIndex(cards, clientY) {
        for (let i = 0; i < cards.length; i++) {
            const rect = cards[i].getBoundingClientRect();
            const midY = rect.top + rect.height / 2;
            if (clientY < midY) return i;
        }
        return cards.length;
    },

    _getColumnInsertIndex(columns, clientX) {
        for (let i = 0; i < columns.length; i++) {
            const rect = columns[i].getBoundingClientRect();
            const midX = rect.left + rect.width / 2;
            if (clientX < midX) return i;
        }
        return columns.length;
    }
};
