const AppState = {
    data: null,

    init() {
        this.data = Storage.load();
    },

    get currentBoardId() {
        return this.data.currentBoardId;
    },

    set currentBoardId(id) {
        this.data.currentBoardId = id;
        this.persist();
    },

    get boards() {
        return this.data.boards;
    },

    get currentBoard() {
        return this.data.boards.find(b => b.id === this.data.currentBoardId);
    },

    getColumn(columnId) {
        const board = this.currentBoard;
        if (!board) return null;
        return board.columns.find(c => c.id === columnId);
    },

    getCard(cardId) {
        const board = this.currentBoard;
        if (!board) return null;
        for (const col of board.columns) {
            const card = col.cards.find(c => c.id === cardId);
            if (card) return { card, column: col };
        }
        return null;
    },

    persist() {
        Storage.save(this.data);
    }
};
