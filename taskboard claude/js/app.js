(function () {
    // Initialize state
    AppState.init();

    // Initialize modal system
    Modal.init();

    // Initialize theme (dark/light)
    Theme.init();

    // Render everything
    Render.all();

    // Initialize drag and drop
    DragDrop.init();

    // Initialize background customization
    Background.init();

    // Initialize notes
    Notes.init();

    // Initialize sidebar
    Sidebar.init();

    // Header button events
    $('#btn-new-board').addEventListener('click', () => Board.promptNew());
    $('#btn-rename-board').addEventListener('click', () => Board.promptRename());
    $('#btn-delete-board').addEventListener('click', () => Board.promptDelete());
    $('#btn-lock-board').addEventListener('click', () => Board.promptSetPassword());

    // Board dropdown toggle
    $('#board-selector').addEventListener('click', () => Render.toggleBoardDropdown());

    // Close dropdown on outside click
    document.addEventListener('click', (e) => {
        if (!e.target.closest('#board-bar')) {
            Render.closeBoardDropdown();
        }
    });
})();
