(function () {
  const {
    APP_TITLE,
    BACKGROUND_PRESETS,
    DEFAULT_APPEARANCE,
    DEFAULT_PRIORITY,
    PRIORITIES,
  } = window.LumbreConfig;
  const { Storage, createBoardRecord, createCardRecord, createColumnRecord, createTemplateRecord, createNoteRecord } = window.LumbreData;

  function escapeHtml(value) {
    return String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#39;");
  }

  function truncate(value, maxLength) {
    if (!value) {
      return "Sin descripcion";
    }

    return value.length > maxLength ? `${value.slice(0, maxLength - 1)}...` : value;
  }

  function formatDate(isoDate) {
    try {
      return new Intl.DateTimeFormat("es-MX", {
        day: "numeric",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
      }).format(new Date(isoDate));
    } catch (error) {
      return isoDate;
    }
  }

  function formatDueDate(isoDate) {
    if (!isoDate) {
      return "";
    }

    try {
      return new Intl.DateTimeFormat("es-MX", {
        day: "numeric",
        month: "short",
        year: "numeric",
      }).format(new Date(`${isoDate}T00:00:00`));
    } catch (error) {
      return isoDate;
    }
  }

  function fileToDataUrl(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = () => reject(new Error("No se pudo leer la imagen seleccionada."));
      reader.readAsDataURL(file);
    });
  }

  function isHexColor(value) {
    return typeof value === "string" && /^#[0-9a-f]{6}$/i.test(value);
  }

  function getPresetById(presetId) {
    return BACKGROUND_PRESETS.find((preset) => preset.id === presetId) ?? BACKGROUND_PRESETS[0];
  }

  function getPriorityLabel(priorityId) {
    return PRIORITIES[priorityId]?.label ?? PRIORITIES[DEFAULT_PRIORITY].label;
  }

  function getAppearanceSourceLabel(appearance) {
    if (appearance.backgroundMode === "upload" && appearance.uploadedImageName) {
      return appearance.uploadedImageName;
    }

    if (appearance.backgroundMode === "preset") {
      const preset = getPresetById(appearance.backgroundPresetId);
      return `${preset.category}: ${preset.name}`;
    }

    return appearance.backgroundColor;
  }

  class LumbreApp {
    constructor(options) {
      this.root = options.root;
      this.dialog = options.dialog;
      this.state = Storage.loadState();
      this.modal = null;
      this.drag = null;
      this.clockTimer = null;
      this.unlockedBoardIds = new Set();
      this.ui = {
        menuOpen: false,
        boardMenuOpen: false,
      };
      this.bindEvents();
      this.applyAppearance();
      this.render();
      this.startClock();
    }

    bindEvents() {
      this.root.addEventListener("click", (event) => this.handleRootClick(event));
      this.root.addEventListener("input", (event) => this.handleRootInput(event));
      this.root.addEventListener("dragstart", (event) => this.handleDragStart(event));
      this.root.addEventListener("dragend", () => this.handleDragEnd());
      this.root.addEventListener("dragover", (event) => this.handleDragOver(event));
      this.root.addEventListener("dragleave", (event) => this.handleDragLeave(event));
      this.root.addEventListener("drop", (event) => this.handleDrop(event));

      this.dialog.addEventListener("click", (event) => this.handleDialogClick(event));
      this.dialog.addEventListener("submit", (event) => this.handleDialogSubmit(event));
      this.dialog.addEventListener("change", (event) => {
        void this.handleDialogChange(event);
      });
      this.dialog.addEventListener("cancel", (event) => {
        event.preventDefault();
        this.closeModal();
      });
    }

    getActiveBoard() {
      return this.state.boards.find((board) => board.id === this.state.activeBoardId) ?? this.state.boards[0] ?? null;
    }

    getBoardById(boardId) {
      return this.state.boards.find((board) => board.id === boardId) ?? null;
    }

    getTemplateById(templateId) {
      return this.state.templates.find((template) => template.id === templateId) ?? null;
    }

    getActiveNote() {
      return this.state.notes.find((note) => note.id === this.state.activeNoteId) ?? this.state.notes[0] ?? null;
    }

    isBoardProtected(board) {
      return Boolean(board?.password);
    }

    persist() {
      Storage.saveState(this.state);
      this.applyAppearance();
      this.render();
    }

    persistSilently() {
      Storage.saveState(this.state);
    }

    getLocalTimeLabel() {
      try {
        return new Intl.DateTimeFormat("es-MX", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
        }).format(new Date());
      } catch (error) {
        const now = new Date();
        return `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
      }
    }

    syncClock() {
      const clock = this.root.querySelector("[data-clock]");
      if (clock) {
        clock.textContent = this.getLocalTimeLabel();
      }
    }

    startClock() {
      this.syncClock();
      if (this.clockTimer) {
        return;
      }

      this.clockTimer = window.setInterval(() => {
        this.syncClock();
      }, 1000);
    }

    switchBoard(boardId) {
      const board = this.getBoardById(boardId);
      if (!board) {
        return;
      }

      this.state.currentView = "boards";
      this.state.activeBoardId = board.id;
      this.ui.menuOpen = false;
      this.ui.boardMenuOpen = false;
      this.persist();
    }

    requestBoardAccess(boardId) {
      const board = this.getBoardById(boardId);
      if (!board) {
        return;
      }

      if (!this.isBoardProtected(board) || this.unlockedBoardIds.has(board.id) || board.id === this.state.activeBoardId) {
        this.switchBoard(board.id);
        if (this.dialog.open) {
          this.closeModal();
        }
        return;
      }

      this.openModal({
        type: "unlock-board",
        boardId: board.id,
        error: "",
      });
    }

    unlockBoard(boardId, password) {
      const board = this.getBoardById(boardId);
      if (!board) {
        this.closeModal();
        return;
      }

      if (board.password !== String(password ?? "").trim()) {
        this.modal = {
          ...this.modal,
          error: "Contrasena incorrecta.",
        };
        this.renderDialog();
        return;
      }

      this.unlockedBoardIds.add(board.id);
      this.closeModal();
      this.switchBoard(board.id);
    }

    updateBoard(boardId, updater) {
      this.state.boards = this.state.boards.map((board) => {
        if (board.id !== boardId) {
          return board;
        }

        const updated = updater({
          ...board,
          columnOrder: [...board.columnOrder],
          columnsById: { ...board.columnsById },
          cardsById: { ...board.cardsById },
        });

        return {
          ...updated,
          updatedAt: new Date().toISOString(),
        };
      });

      this.persist();
    }

    applyAppearance() {
      const appearance = this.state.appearance ?? DEFAULT_APPEARANCE;
      const rootStyle = document.documentElement.style;
      document.documentElement.dataset.theme = appearance.theme === "dark" ? "dark" : "light";

      let imageUrl = "";
      if (appearance.backgroundMode === "preset") {
        imageUrl = getPresetById(appearance.backgroundPresetId).image;
      } else if (appearance.backgroundMode === "upload" && appearance.uploadedImage) {
        imageUrl = appearance.uploadedImage;
      }

      rootStyle.setProperty("--scene-color", appearance.backgroundColor);
      rootStyle.setProperty("--scene-image", imageUrl ? `url("${imageUrl}")` : "none");
    }

    openModal(modal) {
      this.modal = modal;
      this.renderDialog();
      if (!this.dialog.open) {
        this.dialog.showModal();
      }
    }

    closeModal() {
      this.modal = null;
      if (this.dialog.open) {
        this.dialog.close();
      }
      this.dialog.innerHTML = "";
    }

    setMenuOpen(isOpen) {
      this.ui.menuOpen = Boolean(isOpen);
      this.render();
    }

    downloadBackup() {
      try {
        const blob = new Blob([JSON.stringify(this.state, null, 2)], {
          type: "application/json",
        });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `nido-backup-${new Date().toISOString().slice(0, 10)}.json`;
        document.body.appendChild(link);
        link.click();
        link.remove();
        URL.revokeObjectURL(url);
      } catch (error) {
        console.error("No se pudo exportar el respaldo.", error);
      }
    }

    setTheme(theme) {
      this.state.appearance.theme = theme === "dark" ? "dark" : "light";
      this.persist();
    }

    toggleTheme() {
      this.setTheme(this.state.appearance.theme === "dark" ? "light" : "dark");
    }

    setColorBackground(color) {
      if (!isHexColor(color)) {
        return;
      }

      this.state.appearance.backgroundColor = color;
      this.state.appearance.backgroundMode = "color";
      this.persist();
    }

    applyPresetBackground(presetId) {
      const preset = BACKGROUND_PRESETS.find((item) => item.id === presetId);
      if (!preset) {
        return;
      }

      this.state.appearance.backgroundMode = "preset";
      this.state.appearance.backgroundPresetId = preset.id;
      this.persist();
    }

    applyUploadedBackground() {
      if (!this.state.appearance.uploadedImage) {
        return;
      }

      this.state.appearance.backgroundMode = "upload";
      this.persist();
    }

    clearUploadedBackground() {
      this.state.appearance.uploadedImage = "";
      this.state.appearance.uploadedImageName = "";
      this.state.appearance.backgroundMode = "color";
      this.persist();
    }

    resetAppearance() {
      this.state.appearance = JSON.parse(JSON.stringify(DEFAULT_APPEARANCE));
      this.persist();
    }

    async handleBackgroundUpload(file) {
      if (!file) {
        return;
      }

      try {
        const result = await fileToDataUrl(file);
        this.state.appearance.uploadedImage = typeof result === "string" ? result : "";
        this.state.appearance.uploadedImageName = file.name || "Imagen personalizada";
        this.state.appearance.backgroundMode = "upload";
        this.persist();
      } catch (error) {
        console.error(error);
      }
    }

    handleRootClick(event) {
      const trigger = event.target.closest("[data-action]");
      if (!trigger) {
        return;
      }

      const action = trigger.dataset.action;
      const boardId = trigger.dataset.boardId ?? this.state.activeBoardId;
      const columnId = trigger.dataset.columnId;
      const cardId = trigger.dataset.cardId;

      switch (action) {
        case "open-menu":
          this.ui.boardMenuOpen = false;
          this.setMenuOpen(true);
          break;
        case "close-menu":
          this.setMenuOpen(false);
          break;
        case "switch-board":
          this.requestBoardAccess(boardId);
          break;
        case "open-boards-view":
          this.state.currentView = "boards";
          this.ui.menuOpen = false;
          this.ui.boardMenuOpen = false;
          this.persist();
          break;
        case "toggle-board-menu":
          this.ui.boardMenuOpen = !this.ui.boardMenuOpen;
          this.render();
          break;
        case "open-notes":
          this.state.currentView = "notes";
          this.ui.menuOpen = false;
          this.ui.boardMenuOpen = false;
          if (!this.state.activeNoteId && this.state.notes[0]) {
            this.state.activeNoteId = this.state.notes[0].id;
          }
          this.persist();
          break;
        case "create-note":
          this.createNote();
          break;
        case "switch-note":
          this.state.activeNoteId = trigger.dataset.noteId ?? this.state.activeNoteId;
          this.state.currentView = "notes";
          this.persist();
          break;
        case "delete-note":
          this.openModal({
            type: "confirm",
            title: "Eliminar nota",
            description: "Esta nota se borrara para siempre.",
            confirmLabel: "Eliminar nota",
            intent: "delete-note",
            payload: { noteId: trigger.dataset.noteId ?? this.state.activeNoteId },
          });
          break;
        case "create-board":
          this.ui.boardMenuOpen = false;
          this.openModal({ type: "create-board" });
          break;
        case "open-all-boards":
          this.ui.boardMenuOpen = false;
          this.openModal({ type: "all-boards" });
          break;
        case "open-templates":
          this.ui.boardMenuOpen = false;
          this.openModal({ type: "templates" });
          break;
        case "save-template":
          this.ui.boardMenuOpen = false;
          this.openModal({ type: "save-template" });
          break;
        case "export-backup":
          this.ui.boardMenuOpen = false;
          this.downloadBackup();
          break;
        case "rename-board":
          this.ui.boardMenuOpen = false;
          this.openModal({ type: "rename-board", boardId });
          break;
        case "delete-board":
          this.openModal({
            type: "confirm",
            title: "Eliminar tablero",
            description: "Se borraran todas sus columnas y tarjetas. Esta accion no se puede deshacer.",
            confirmLabel: "Eliminar tablero",
            intent: "delete-board",
            payload: { boardId },
          });
          break;
        case "create-column":
          this.ui.boardMenuOpen = false;
          this.openModal({ type: "create-column", boardId });
          break;
        case "rename-column":
          this.openModal({ type: "rename-column", boardId, columnId });
          break;
        case "delete-column":
          this.openModal({
            type: "confirm",
            title: "Eliminar columna",
            description: "Las tarjetas de esta columna tambien se eliminaran.",
            confirmLabel: "Eliminar columna",
            intent: "delete-column",
            payload: { boardId, columnId },
          });
          break;
        case "create-card":
          this.ui.boardMenuOpen = false;
          this.openModal({ type: "create-card", boardId, columnId });
          break;
        case "edit-card":
          this.ui.boardMenuOpen = false;
          this.openModal({ type: "edit-card", boardId, columnId, cardId });
          break;
        case "delete-card":
          this.openModal({
            type: "confirm",
            title: "Eliminar tarjeta",
            description: "Esta tarjeta se borrara para siempre.",
            confirmLabel: "Eliminar tarjeta",
            intent: "delete-card",
            payload: { boardId, columnId, cardId },
          });
          break;
        case "toggle-theme":
          this.toggleTheme();
          break;
        case "open-appearance":
          this.openModal({ type: "appearance" });
          break;
        default:
          break;
      }
    }

    handleDialogClick(event) {
      const trigger = event.target.closest("[data-dialog-action]");
      if (!trigger) {
        return;
      }

      const action = trigger.dataset.dialogAction;
      switch (action) {
        case "close":
          this.closeModal();
          break;
        case "confirm":
          this.applyModalIntent();
          break;
        case "delete-card":
          if (this.modal?.type === "edit-card") {
            this.deleteCard(this.modal.boardId, this.modal.columnId, this.modal.cardId);
            this.closeModal();
          }
          break;
        case "toggle-theme":
          this.toggleTheme();
          break;
        case "use-upload":
          this.applyUploadedBackground();
          break;
        case "clear-upload":
          this.clearUploadedBackground();
          break;
        case "use-color":
          this.setColorBackground(this.state.appearance.backgroundColor);
          break;
        case "use-preset":
          this.applyPresetBackground(trigger.dataset.presetId);
          break;
        case "reset-appearance":
          this.resetAppearance();
          break;
        case "switch-board-modal":
          this.requestBoardAccess(trigger.dataset.boardId ?? this.state.activeBoardId);
          break;
        case "use-template":
          this.createBoardFromTemplate(trigger.dataset.templateId);
          break;
        case "open-create-board":
          this.openModal({ type: "create-board" });
          break;
        case "open-save-template":
          this.openModal({ type: "save-template" });
          break;
        default:
          break;
      }
    }

    handleDialogSubmit(event) {
      event.preventDefault();
      const form = event.target;
      const formType = form.dataset.form;
      const formData = new FormData(form);

      switch (formType) {
        case "create-board":
          this.createBoard(formData.get("name"), formData.get("password"));
          break;
        case "rename-board":
          this.renameBoard(formData.get("boardId"), formData.get("name"), formData.get("password"));
          break;
        case "unlock-board":
          this.unlockBoard(formData.get("boardId"), formData.get("password"));
          break;
        case "save-template":
          this.saveTemplate(formData.get("name"), formData.get("description"));
          break;
        case "create-column":
          this.createColumn(formData.get("boardId"), formData.get("title"));
          break;
        case "rename-column":
          this.renameColumn(formData.get("boardId"), formData.get("columnId"), formData.get("title"));
          break;
        case "create-card":
          this.createCard(formData.get("boardId"), formData.get("columnId"), {
            title: formData.get("title"),
            description: formData.get("description"),
            priority: formData.get("priority"),
            dueDate: formData.get("dueDate"),
          });
          break;
        case "edit-card":
          this.updateCard(formData.get("boardId"), formData.get("columnId"), formData.get("cardId"), {
            title: formData.get("title"),
            description: formData.get("description"),
            priority: formData.get("priority"),
            dueDate: formData.get("dueDate"),
          });
          break;
        case "appearance-color":
          this.setColorBackground(formData.get("backgroundColor"));
          break;
        default:
          break;
      }
    }

    async handleDialogChange(event) {
      const target = event.target;
      if (!target.matches("input[name='uploadedBackground']")) {
        return;
      }

      const file = target.files?.[0];
      await this.handleBackgroundUpload(file);
    }

    handleDragStart(event) {
      const card = event.target.closest(".task-card[draggable='true']");
      if (card) {
        this.drag = {
          type: "card",
          boardId: this.state.activeBoardId,
          fromColumnId: card.dataset.columnId,
          cardId: card.dataset.cardId,
        };
        event.dataTransfer.effectAllowed = "move";
        event.dataTransfer.setData("text/plain", card.dataset.cardId ?? "");
        this.syncDragUi();
        return;
      }

      const columnHandle = event.target.closest(".column-drag-handle[draggable='true']");
      if (columnHandle) {
        this.drag = {
          type: "column",
          boardId: this.state.activeBoardId,
          columnId: columnHandle.dataset.columnId,
        };
        event.dataTransfer.effectAllowed = "move";
        event.dataTransfer.setData("text/plain", columnHandle.dataset.columnId ?? "");
        this.syncDragUi();
      }
    }

    handleDragEnd() {
      this.drag = null;
      this.clearDropHighlights();
      this.syncDragUi();
    }

    handleDragOver(event) {
      const zone = event.target.closest(".dropzone");
      if (!zone || !this.isCompatibleDropzone(zone)) {
        return;
      }

      event.preventDefault();
      event.dataTransfer.dropEffect = "move";
      zone.classList.add("is-over");
    }

    handleDragLeave(event) {
      const zone = event.target.closest(".dropzone");
      if (!zone) {
        return;
      }

      const relatedTarget = event.relatedTarget;
      if (relatedTarget && zone.contains(relatedTarget)) {
        return;
      }

      zone.classList.remove("is-over");
    }

    handleDrop(event) {
      const zone = event.target.closest(".dropzone");
      if (!zone || !this.drag || !this.isCompatibleDropzone(zone)) {
        return;
      }

      event.preventDefault();
      const drag = this.drag;
      this.drag = null;

      if (drag.type === "column") {
        this.moveColumn(drag.boardId, drag.columnId, Number(zone.dataset.targetIndex));
      }

      if (drag.type === "card") {
        this.moveCard(drag.boardId, drag.fromColumnId, zone.dataset.columnId, drag.cardId, Number(zone.dataset.targetIndex));
      }

      this.clearDropHighlights();
    }

    isCompatibleDropzone(zone) {
      return Boolean(this.drag) && zone.dataset.kind === this.drag.type;
    }

    clearDropHighlights() {
      this.root.querySelectorAll(".dropzone.is-over").forEach((zone) => {
        zone.classList.remove("is-over");
      });
    }

    syncDragUi() {
      const shell = this.root.querySelector(".shell");
      if (shell) {
        shell.dataset.dragging = this.drag?.type ?? "";
      }

      this.root.querySelectorAll("[data-drag-active='true']").forEach((node) => {
        node.dataset.dragActive = "false";
      });

      if (!this.drag) {
        return;
      }

      if (this.drag.type === "card") {
        const card = this.root.querySelector(`.task-card[data-card-id="${this.drag.cardId}"]`);
        if (card) {
          card.dataset.dragActive = "true";
        }
      }

      if (this.drag.type === "column") {
        const column = this.root.querySelector(`.kanban-column[data-column-id="${this.drag.columnId}"]`);
        if (column) {
          column.dataset.dragActive = "true";
        }
      }
    }

    createBoard(name, password) {
      const board = createBoardRecord({ name, password });
      this.state.boards = [...this.state.boards, board];
      this.state.currentView = "boards";
      this.state.activeBoardId = board.id;
      this.ui.menuOpen = false;
      if (board.password) {
        this.unlockedBoardIds.add(board.id);
      }
      this.persist();
      this.closeModal();
    }

    createBoardFromTemplate(templateId) {
      const template = this.getTemplateById(templateId);
      if (!template) {
        return;
      }

      const board = createBoardRecord({
        name: template.name,
        columns: template.columns,
      });

      this.state.boards = [...this.state.boards, board];
      this.state.currentView = "boards";
      this.state.activeBoardId = board.id;
      this.persist();
      this.closeModal();
    }

    saveTemplate(name, description) {
      const board = this.getActiveBoard();
      if (!board) {
        return;
      }

      const template = createTemplateRecord({
        name,
        description,
        columns: board.columnOrder.map((columnId) => {
          const column = board.columnsById[columnId];
          return {
            title: column.title,
            cards: column.cardIds.map((cardId) => {
              const card = board.cardsById[cardId];
              return {
                title: card.title,
                description: card.description,
                priority: card.priority,
                dueDate: card.dueDate,
              };
            }),
          };
        }),
      });

      this.state.templates = [...this.state.templates, template];
      this.persist();
      this.closeModal();
    }

    renameBoard(boardId, name, password) {
      const nextPassword = String(password ?? "").trim();
      this.updateBoard(boardId, (board) => ({
        ...board,
        name: String(name ?? "").trim() || board.name,
        password: nextPassword,
      }));
      if (nextPassword) {
        this.unlockedBoardIds.add(boardId);
      } else {
        this.unlockedBoardIds.delete(boardId);
      }
      this.closeModal();
    }

    deleteBoard(boardId) {
      this.state.boards = this.state.boards.filter((board) => board.id !== boardId);
      this.state.activeBoardId = this.state.boards[0]?.id ?? null;
      this.unlockedBoardIds.delete(boardId);
      this.persist();
      this.closeModal();
    }

    createColumn(boardId, title) {
      this.updateBoard(boardId, (board) => {
        const column = createColumnRecord({ title });
        return {
          ...board,
          columnOrder: [...board.columnOrder, column.id],
          columnsById: {
            ...board.columnsById,
            [column.id]: column,
          },
        };
      });
      this.closeModal();
    }

    renameColumn(boardId, columnId, title) {
      this.updateBoard(boardId, (board) => ({
        ...board,
        columnsById: {
          ...board.columnsById,
          [columnId]: {
            ...board.columnsById[columnId],
            title: String(title ?? "").trim() || board.columnsById[columnId].title,
          },
        },
      }));
      this.closeModal();
    }

    deleteColumn(boardId, columnId) {
      this.updateBoard(boardId, (board) => {
        const column = board.columnsById[columnId];
        if (!column) {
          return board;
        }

        const cardsById = { ...board.cardsById };
        column.cardIds.forEach((cardId) => {
          delete cardsById[cardId];
        });

        const columnsById = { ...board.columnsById };
        delete columnsById[columnId];

        return {
          ...board,
          columnOrder: board.columnOrder.filter((entry) => entry !== columnId),
          columnsById,
          cardsById,
        };
      });
      this.closeModal();
    }

    createCard(boardId, columnId, payload) {
      this.updateBoard(boardId, (board) => {
        const card = createCardRecord(payload);
        const column = board.columnsById[columnId];
        return {
          ...board,
          cardsById: {
            ...board.cardsById,
            [card.id]: card,
          },
          columnsById: {
            ...board.columnsById,
            [columnId]: {
              ...column,
              cardIds: [...column.cardIds, card.id],
            },
          },
        };
      });
      this.closeModal();
    }

    updateCard(boardId, columnId, cardId, payload) {
      this.updateBoard(boardId, (board) => ({
        ...board,
        cardsById: {
          ...board.cardsById,
          [cardId]: {
            ...board.cardsById[cardId],
            title: String(payload.title ?? "").trim() || board.cardsById[cardId].title,
            description: typeof payload.description === "string" ? payload.description.trim() : "",
            priority: PRIORITIES[payload.priority] ? payload.priority : DEFAULT_PRIORITY,
            dueDate: typeof payload.dueDate === "string" ? payload.dueDate : "",
            updatedAt: new Date().toISOString(),
          },
        },
      }));
      this.closeModal();
    }

    deleteCard(boardId, columnId, cardId) {
      this.updateBoard(boardId, (board) => {
        const cardsById = { ...board.cardsById };
        delete cardsById[cardId];

        return {
          ...board,
          cardsById,
          columnsById: {
            ...board.columnsById,
            [columnId]: {
              ...board.columnsById[columnId],
              cardIds: board.columnsById[columnId].cardIds.filter((entry) => entry !== cardId),
            },
          },
        };
      });
    }

    moveColumn(boardId, columnId, targetIndex) {
      this.updateBoard(boardId, (board) => {
        const fromIndex = board.columnOrder.indexOf(columnId);
        if (fromIndex === -1) {
          return board;
        }

        const nextOrder = [...board.columnOrder];
        nextOrder.splice(fromIndex, 1);
        const adjustedIndex = fromIndex < targetIndex ? targetIndex - 1 : targetIndex;
        nextOrder.splice(adjustedIndex, 0, columnId);

        return {
          ...board,
          columnOrder: nextOrder,
        };
      });
    }

    moveCard(boardId, fromColumnId, toColumnId, cardId, targetIndex) {
      this.updateBoard(boardId, (board) => {
        const fromColumn = board.columnsById[fromColumnId];
        const toColumn = board.columnsById[toColumnId];
        if (!fromColumn || !toColumn) {
          return board;
        }

        const fromIndex = fromColumn.cardIds.indexOf(cardId);
        if (fromIndex === -1) {
          return board;
        }

        const nextFromCardIds = [...fromColumn.cardIds];
        nextFromCardIds.splice(fromIndex, 1);

        const nextToCardIds = fromColumnId === toColumnId ? nextFromCardIds : [...toColumn.cardIds];
        const adjustedIndex = fromColumnId === toColumnId && fromIndex < targetIndex ? targetIndex - 1 : targetIndex;
        nextToCardIds.splice(adjustedIndex, 0, cardId);

        return {
          ...board,
          columnsById: {
            ...board.columnsById,
            [fromColumnId]: {
              ...fromColumn,
              cardIds: fromColumnId === toColumnId ? nextToCardIds : nextFromCardIds,
            },
            [toColumnId]: {
              ...toColumn,
              cardIds: nextToCardIds,
            },
          },
        };
      });
    }

    applyModalIntent() {
      if (this.modal?.type !== "confirm") {
        return;
      }

      const { intent, payload } = this.modal;
      this.closeModal();

      if (intent === "delete-board") {
        this.deleteBoard(payload.boardId);
      }

      if (intent === "delete-column") {
        this.deleteColumn(payload.boardId, payload.columnId);
      }

      if (intent === "delete-card") {
        this.deleteCard(payload.boardId, payload.columnId, payload.cardId);
      }

      if (intent === "delete-note") {
        this.deleteNote(payload.noteId);
      }
    }

    render() {
      const board = this.getActiveBoard();
      const activeColumns = board ? board.columnOrder.map((columnId) => board.columnsById[columnId]).filter(Boolean) : [];
      this.root.innerHTML = `
        <div class="shell" data-dragging="${this.drag?.type ?? ""}">
          <header class="topbar">
            <div class="topbar__left">
              <div class="topbar__left-main">
                <button class="menu-button" type="button" data-action="open-menu" aria-label="Abrir menu">
                  <span></span>
                  <span></span>
                  <span></span>
                </button>
                <div class="brand-mark">
                  <div class="brand-logo" aria-hidden="true">
                    <svg viewBox="0 0 64 64" role="presentation">
                      <path d="M17 25 21 11l11 9 11-9 4 14v18c0 7-5 11-11 11H28c-6 0-11-4-11-11V25Z"></path>
                      <path d="M25 30.5c1.1 0 2 .9 2 2s-.9 2-2 2-2-.9-2-2 .9-2 2-2Zm14 0c1.1 0 2 .9 2 2s-.9 2-2 2-2-.9-2-2 .9-2 2-2Z" class="brand-logo__eye"></path>
                      <path d="M30 38c1 1.2 2.2 1.8 3 1.8s2-.6 3-1.8" class="brand-logo__nose"></path>
                      <path d="M22 42c3.2 4 6.5 5.9 10 5.9 3.5 0 6.8-1.9 10-5.9" class="brand-logo__line"></path>
                      <path d="M18 36.5h7.5m20.5 0H38.5m-20 4.5h7m20.5 0h-7" class="brand-logo__whisker"></path>
                    </svg>
                  </div>
                  <div class="brand-lockup">
                    <p class="eyebrow">Nido workspace</p>
                    <h1>${APP_TITLE}</h1>
                  </div>
                </div>
                ${this.state.currentView === "boards" && board ? this.renderTopbarBoardSummary(board, activeColumns) : ""}
              </div>
            </div>
            <div class="topbar__right">
              <div class="topbar-clock" data-clock>${escapeHtml(this.getLocalTimeLabel())}</div>
              ${this.renderThemeToggle()}
              <button class="button-ghost" type="button" data-action="open-appearance">Fondo</button>
              <button class="button-ghost" type="button" data-action="open-notes">Notas</button>
              <button class="button-primary" type="button" data-action="create-board">Nuevo tablero</button>
            </div>
          </header>

          ${this.renderDrawer()}

          <main class="workspace">
            ${this.state.currentView === "notes" ? this.renderNotesPage() : board ? this.renderBoard(board) : this.renderNoBoardState()}
          </main>
        </div>
      `;

      this.renderDialog();
      this.syncDragUi();
    }

    renderTopbarBoardSummary(board, columns) {
      return `
        <div class="topbar-board">
          <p class="eyebrow">Tablero activo</p>
          <div class="board-title-row">
            <h2>${escapeHtml(board.name)}</h2>
            <button class="board-menu-toggle" type="button" data-action="toggle-board-menu" aria-label="Mostrar tableros">
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="m6 9 6 6 6-6"></path>
              </svg>
            </button>
          </div>
          ${this.renderBoardMenu(board.id)}
        </div>
      `;
    }

    renderDrawer() {
      const board = this.getActiveBoard();
      const totalColumns = this.state.boards.reduce((sum, item) => sum + item.columnOrder.length, 0);
      const totalCards = this.state.boards.reduce((sum, item) => sum + Object.keys(item.cardsById).length, 0);
      const appearance = this.state.appearance;
      const isOpen = this.ui.menuOpen ? "is-open" : "";

      return `
        <div class="drawer-shell ${isOpen}">
          <button class="drawer-backdrop" type="button" data-action="close-menu" aria-label="Cerrar menu"></button>
          <aside class="drawer">
            <div class="drawer__header">
              <div>
                <p class="eyebrow">Menu</p>
                <h2>Espacios y fondo</h2>
              </div>
              <button class="icon-button" type="button" data-action="close-menu" aria-label="Cerrar menu">X</button>
            </div>

            <section class="drawer-section">
              <div class="drawer-section__head">
                <h3>Explorar</h3>
              </div>
              <div class="menu-grid">
                <button class="menu-card" type="button" data-action="open-all-boards">
                  <strong>Todos tus tableros</strong>
                  <span>Ver, cambiar o abrir cualquiera.</span>
                </button>
                <button class="menu-card" type="button" data-action="open-boards-view">
                  <strong>Tableros</strong>
                  <span>Volver a la vista kanban principal.</span>
                </button>
                <button class="menu-card" type="button" data-action="open-notes">
                  <strong>Notas</strong>
                  <span>Escribe apuntes y cosas del dia a dia.</span>
                </button>
                <button class="menu-card" type="button" data-action="open-templates">
                  <strong>Plantillas</strong>
                  <span>Crear tableros a partir de estructuras listas.</span>
                </button>
                <button class="menu-card" type="button" data-action="open-appearance">
                  <strong>Fondos</strong>
                  <span>Editar color, imagen y preset actual.</span>
                </button>
                <button class="menu-card" type="button" data-action="export-backup">
                  <strong>Respaldo</strong>
                  <span>Descargar una copia JSON de todo tu espacio.</span>
                </button>
              </div>
            </section>

            <section class="drawer-section">
              <div class="drawer-section__head">
                <h3>Acciones</h3>
              </div>
              <div class="menu-grid">
                <button class="menu-card" type="button" data-action="create-board">
                  <strong>Nuevo tablero</strong>
                  <span>Empieza un espacio desde cero.</span>
                </button>
                <button class="menu-card" type="button" data-action="save-template">
                  <strong>Guardar como plantilla</strong>
                  <span>Reutiliza este tablero mas tarde.</span>
                </button>
              </div>
            </section>

            <section class="drawer-section">
              <div class="drawer-section__head">
                <h3>Apariencia actual</h3>
                <button class="button-ghost button-ghost--small" type="button" data-action="open-appearance">Editar</button>
              </div>
              <article class="drawer-card">
                <div class="drawer-card__preview" style="${this.getBackgroundPreviewInlineStyle()}"></div>
                <strong>${appearance.theme === "dark" ? "Modo oscuro" : "Modo claro"}</strong>
                <p>${escapeHtml(getAppearanceSourceLabel(appearance))}</p>
              </article>
            </section>

            <section class="drawer-metrics">
              <article class="metric-chip">
                <span>Tableros</span>
                <strong>${this.state.boards.length}</strong>
              </article>
              <article class="metric-chip">
                <span>Columnas</span>
                <strong>${totalColumns}</strong>
              </article>
              <article class="metric-chip">
                <span>Tarjetas</span>
                <strong>${totalCards}</strong>
              </article>
              <article class="metric-chip">
                <span>Activa</span>
                <strong>${escapeHtml(board?.name ?? "-")}</strong>
              </article>
            </section>
          </aside>
        </div>
      `;
    }

    getBackgroundPreviewInlineStyle() {
      const appearance = this.state.appearance;
      let image = "";
      if (appearance.backgroundMode === "upload" && appearance.uploadedImage) {
        image = appearance.uploadedImage;
      } else if (appearance.backgroundMode === "preset") {
        image = getPresetById(appearance.backgroundPresetId).image;
      }

      const imageStyle = image ? `background-image:url('${image}');` : "";
      return `background-color:${appearance.backgroundColor};${imageStyle}`;
    }

    renderThemeToggle() {
      return `
        <button class="theme-toggle" type="button" data-action="toggle-theme" data-dialog-action="toggle-theme" aria-label="Cambiar tema">
          <span class="theme-toggle__track">
            <span class="theme-toggle__sun">☼</span>
            <span class="theme-toggle__moon">☾</span>
            <span class="theme-toggle__thumb"></span>
          </span>
        </button>
      `;
    }

    renderBoardTabs() {
      if (!this.state.boards.length) {
        return '<div class="mini-empty"><p>No hay tableros.</p></div>';
      }

      return `
        <div class="board-tabs">
          ${this.state.boards
            .map((board, index) => {
              const isActive = board.id === this.state.activeBoardId ? "is-active" : "";
              const protectionLabel = this.isBoardProtected(board) ? " · clave" : "";
              return `
                <button class="board-tab ${isActive}" type="button" data-action="switch-board" data-board-id="${board.id}" style="--enter-index:${index}">
                  <strong>${escapeHtml(board.name)}</strong>
                  <span>${board.columnOrder.length} col${protectionLabel}</span>
                </button>
              `;
            })
            .join("")}
        </div>
      `;
    }

    renderBoardList() {
      if (!this.state.boards.length) {
        return '<article class="mini-empty"><p>No hay tableros.</p></article>';
      }

      return this.state.boards
        .map((board, index) => {
          const isActive = board.id === this.state.activeBoardId ? "is-active" : "";
          const protectionLabel = this.isBoardProtected(board) ? " · clave" : "";
          return `
            <button class="board-card ${isActive}" type="button" data-action="switch-board" data-board-id="${board.id}" style="--enter-index:${index}">
              <strong>${escapeHtml(board.name)}</strong>
              <span>${board.columnOrder.length} col · ${Object.keys(board.cardsById).length} tar${protectionLabel}</span>
            </button>
          `;
        })
        .join("");
    }

    getBoardPreviewColumns(board) {
      return board.columnOrder
        .map((columnId) => {
          const column = board.columnsById[columnId];
          if (!column) {
            return null;
          }

          return {
            title: column.title,
            cards: column.cardIds.map((cardId) => board.cardsById[cardId]).filter(Boolean),
          };
        })
        .filter(Boolean);
    }

    renderMiniBoardPreview(columns) {
      const previewColumns = columns.slice(0, 3);

      return `
        <div class="mini-board-preview">
          ${previewColumns
            .map((column) => {
              const previewCards = (column.cards || []).slice(0, 2);
              return `
                <div class="mini-board-preview__column">
                  <div class="mini-board-preview__head"></div>
                  <div class="mini-board-preview__stack">
                    ${
                      previewCards.length
                        ? previewCards
                            .map(
                              () => `
                                <div class="mini-board-preview__card">
                                  <span></span>
                                  <span></span>
                                </div>
                              `
                            )
                            .join("")
                        : '<div class="mini-board-preview__card mini-board-preview__card--empty"></div>'
                    }
                  </div>
                </div>
              `;
            })
            .join("")}
        </div>
      `;
    }

    renderBoard(board) {
      const columns = board.columnOrder.map((columnId) => board.columnsById[columnId]).filter(Boolean);

      return `
        <section class="board-panel">
          <header class="board-toolbar">
            <div class="board-actions">
              <button class="button-ghost" type="button" data-action="rename-board" data-board-id="${board.id}">Renombrar</button>
              <button class="button-danger" type="button" data-action="delete-board" data-board-id="${board.id}">Eliminar</button>
            </div>
          </header>

          <section class="board-stage">
            <div class="board-stage__content">
              <div class="board-stage__status status-row">
                <span class="pill">${columns.length} columnas</span>
                <span class="pill">${Object.keys(board.cardsById).length} tarjetas</span>
              </div>
              ${
                columns.length
                  ? `
                    <div class="kanban-scroll">
                      <div class="kanban-board">
                        ${this.renderColumns(board, columns)}
                      </div>
                    </div>
                  `
                  : `
                    <article class="empty-state">
                      <h3>Este tablero aun no tiene columnas</h3>
                      <p>Crea la primera columna para empezar.</p>
                      <button class="button-secondary" type="button" data-action="create-column" data-board-id="${board.id}">Crear primera columna</button>
                    </article>
                  `
              }
            </div>
          </section>
        </section>
      `;
    }

    renderBoardMenu(activeBoardId) {
      if (!this.ui.boardMenuOpen) {
        return "";
      }

      const otherBoards = this.state.boards.filter((board) => board.id !== activeBoardId);
      if (!otherBoards.length) {
        return `
          <div class="board-menu-popover">
            <p class="board-menu-empty">No tienes mas tableros.</p>
          </div>
        `;
      }

      return `
        <div class="board-menu-popover">
          ${otherBoards
            .map(
              (board) => `
                <button class="board-menu-item" type="button" data-action="switch-board" data-board-id="${board.id}">
                  <strong>${escapeHtml(board.name)}</strong>
                  <span>${board.columnOrder.length} col · ${Object.keys(board.cardsById).length} tar${this.isBoardProtected(board) ? " · clave" : ""}</span>
                </button>
              `
            )
            .join("")}
        </div>
      `;
    }

    renderColumns(board, columns) {
      const fragments = [];

      for (let index = 0; index <= columns.length; index += 1) {
        fragments.push(`<div class="dropzone column-dropzone" data-kind="column" data-target-index="${index}"></div>`);
        if (index === columns.length) {
          continue;
        }

        fragments.push(this.renderColumn(board, columns[index], index));
      }

      fragments.push(`
        <button class="add-column-card" type="button" data-action="create-column" data-board-id="${board.id}">
          <span>+ Agregar columna</span>
        </button>
      `);

      return fragments.join("");
    }

    renderColumn(board, column, columnIndex) {
      const cards = column.cardIds.map((cardId) => board.cardsById[cardId]).filter(Boolean);
      const isDragging = this.drag?.type === "column" && this.drag.columnId === column.id ? "true" : "false";

      return `
        <section class="kanban-column" data-column-id="${column.id}" data-drag-active="${isDragging}" style="--enter-index:${columnIndex}">
          <div class="column-header">
            <div class="column-header__main">
              <div class="column-drag-handle" draggable="true" data-column-id="${column.id}" aria-label="Mover columna" title="Arrastra para mover">
                <span></span>
                <span></span>
                <span></span>
              </div>
              <div>
                <h3>${escapeHtml(column.title)}</h3>
                <p class="column-subtitle">${cards.length} tarjetas</p>
              </div>
            </div>
            <div class="column-actions">
              <button class="icon-button" type="button" data-action="rename-column" data-board-id="${board.id}" data-column-id="${column.id}" aria-label="Renombrar columna">
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M4 20h4.2l9.9-9.9a2 2 0 0 0 0-2.8l-1.4-1.4a2 2 0 0 0-2.8 0L4 15.8V20Z"></path>
                  <path d="m12.5 7.5 4 4"></path>
                </svg>
              </button>
              <button class="icon-button" type="button" data-action="delete-column" data-board-id="${board.id}" data-column-id="${column.id}" aria-label="Eliminar columna">
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M9.25 5.5h5.5"></path>
                  <path d="M6.5 7.5h11"></path>
                  <path d="M8.5 7.5v10a1.5 1.5 0 0 0 1.5 1.5h4a1.5 1.5 0 0 0 1.5-1.5v-10"></path>
                  <path d="M10.5 10.25v5.25"></path>
                  <path d="M13.5 10.25v5.25"></path>
                </svg>
              </button>
            </div>
          </div>

          <div class="column-body">
            ${this.renderCards(board, column, cards)}
            <button class="button-ghost button-ghost--footer" type="button" data-action="create-card" data-board-id="${board.id}" data-column-id="${column.id}">Nueva tarjeta</button>
          </div>
        </section>
      `;
    }

    renderCards(board, column, cards) {
      if (!cards.length) {
        return `
          <div class="dropzone card-dropzone card-dropzone--empty" data-kind="card" data-column-id="${column.id}" data-target-index="0">
            <article class="mini-empty mini-empty--column">
              <p>Columna lista para usar.</p>
            </article>
          </div>
        `;
      }

      const fragments = [];

      for (let index = 0; index <= cards.length; index += 1) {
        fragments.push(`<div class="dropzone card-dropzone" data-kind="card" data-column-id="${column.id}" data-target-index="${index}"></div>`);
        if (index === cards.length) {
          continue;
        }

        const card = cards[index];
        const isDragging = this.drag?.type === "card" && this.drag.cardId === card.id ? "true" : "false";
        fragments.push(`
          <article
            class="task-card"
            draggable="true"
            data-action="edit-card"
            data-board-id="${board.id}"
            data-column-id="${column.id}"
            data-card-id="${card.id}"
            data-drag-active="${isDragging}"
            style="--enter-index:${index}"
            role="button"
            tabindex="0"
          >
            <div class="task-card__header">
              <h3>${escapeHtml(card.title)}</h3>
              <div class="card-actions">
                <button class="icon-button icon-button--card" type="button" data-action="edit-card" data-board-id="${board.id}" data-column-id="${column.id}" data-card-id="${card.id}" aria-label="Editar tarjeta">
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M4 20h4.2l9.9-9.9a2 2 0 0 0 0-2.8l-1.4-1.4a2 2 0 0 0-2.8 0L4 15.8V20Z"></path>
                    <path d="m12.5 7.5 4 4"></path>
                  </svg>
                </button>
                <button class="icon-button icon-button--card" type="button" data-action="delete-card" data-board-id="${board.id}" data-column-id="${column.id}" data-card-id="${card.id}" aria-label="Eliminar tarjeta">
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M9.25 5.5h5.5"></path>
                    <path d="M6.5 7.5h11"></path>
                    <path d="M8.5 7.5v10a1.5 1.5 0 0 0 1.5 1.5h4a1.5 1.5 0 0 0 1.5-1.5v-10"></path>
                    <path d="M10.5 10.25v5.25"></path>
                    <path d="M13.5 10.25v5.25"></path>
                  </svg>
                </button>
              </div>
            </div>
            <p>${escapeHtml(truncate(card.description, 88))}</p>
            <div class="card-footer">
              <span class="priority-badge" data-priority="${card.priority}">${escapeHtml(getPriorityLabel(card.priority))}</span>
              ${card.dueDate ? `<span class="due-date-badge">${escapeHtml(formatDueDate(card.dueDate))}</span>` : ""}
            </div>
          </article>
        `);
      }

      return fragments.join("");
    }

    renderNoBoardState() {
      return `
        <section class="board-stage board-stage--empty">
          <div class="board-stage__content">
            <article class="empty-state">
              <h3>No hay tableros disponibles</h3>
              <p>Crea uno nuevo y empieza a organizar tareas.</p>
              <button class="button-primary" type="button" data-action="create-board">Crear tablero</button>
            </article>
          </div>
        </section>
      `;
    }

    renderNotesPage() {
      const activeNote = this.getActiveNote();

      return `
        <section class="notes-page">
          <aside class="notes-sidebar">
            <div class="notes-sidebar__header">
              <div>
                <p class="eyebrow">Apuntes</p>
                <h2>Notas cotidianas</h2>
              </div>
              <button class="button-primary button-primary--small" type="button" data-action="create-note">Nueva nota</button>
            </div>
            <div class="notes-list">
              ${
                this.state.notes.length
                  ? this.state.notes
                      .map((note) => {
                        const isActive = note.id === this.state.activeNoteId ? "is-active" : "";
                        return `
                          <button class="note-list-item ${isActive}" type="button" data-action="switch-note" data-note-id="${note.id}">
                            <strong>${escapeHtml(note.title || "Nota sin titulo")}</strong>
                            <span>${escapeHtml(truncate(note.content, 72))}</span>
                            <small>${escapeHtml(formatDate(note.updatedAt))}</small>
                          </button>
                        `;
                      })
                      .join("")
                  : `
                    <article class="mini-empty notes-empty">
                      <p>No tienes notas todavia.</p>
                      <button class="button-ghost" type="button" data-action="create-note">Crear primera nota</button>
                    </article>
                  `
              }
            </div>
          </aside>
          <section class="notes-editor-shell">
            ${
              activeNote
                ? `
                  <div class="notes-editor__toolbar">
                    <p class="eyebrow">Editor</p>
                    <button class="button-danger button-danger--small" type="button" data-action="delete-note" data-note-id="${activeNote.id}">Eliminar nota</button>
                  </div>
                  <div class="notes-editor">
                    <input
                      class="notes-title-input"
                      type="text"
                      value="${escapeHtml(activeNote.title)}"
                      data-note-field="title"
                      data-note-id="${activeNote.id}"
                      placeholder="Titulo de la nota"
                    />
                    <textarea
                      class="notes-content-input"
                      data-note-field="content"
                      data-note-id="${activeNote.id}"
                      placeholder="Escribe aqui tus apuntes, ideas, pendientes o cualquier cosa del dia..."
                    >${escapeHtml(activeNote.content)}</textarea>
                    <p class="notes-editor__meta">Actualizado ${escapeHtml(formatDate(activeNote.updatedAt))}</p>
                  </div>
                `
                : `
                  <article class="empty-state notes-editor-empty">
                    <h3>No hay notas abiertas</h3>
                    <p>Crea una nota nueva para empezar a escribir.</p>
                    <button class="button-primary" type="button" data-action="create-note">Crear nota</button>
                  </article>
                `
            }
          </section>
        </section>
      `;
    }

    renderDialog() {
      if (!this.modal) {
        if (this.dialog.open) {
          this.dialog.close();
        }
        this.dialog.innerHTML = "";
        return;
      }

      this.dialog.innerHTML = this.getDialogMarkup();
    }

    getDialogMarkup() {
      const board = this.state.boards.find((item) => item.id === this.modal?.boardId) ?? this.getActiveBoard();
      const column = board && this.modal?.columnId ? board.columnsById[this.modal.columnId] : null;
      const card = board && this.modal?.cardId ? board.cardsById[this.modal.cardId] : null;

      if (this.modal.type === "confirm") {
        return `
          <article class="dialog-card">
            <p class="eyebrow">Confirmacion</p>
            <h2>${escapeHtml(this.modal.title)}</h2>
            <p>${escapeHtml(this.modal.description)}</p>
            <div class="dialog-actions">
              <button class="button-ghost" type="button" data-dialog-action="close">Cancelar</button>
              <button class="button-danger" type="button" data-dialog-action="confirm">${escapeHtml(this.modal.confirmLabel)}</button>
            </div>
          </article>
        `;
      }

      if (this.modal.type === "all-boards") {
        return this.renderAllBoardsDialog();
      }

      if (this.modal.type === "templates") {
        return this.renderTemplatesDialog();
      }

      if (this.modal.type === "appearance") {
        return this.renderAppearanceDialog();
      }

      if (this.modal.type === "save-template") {
        const boardName = this.getActiveBoard()?.name ?? "";
        return `
          <article class="dialog-card">
            <p class="eyebrow">Plantilla</p>
            <h2>Guardar tablero como plantilla</h2>
            <form data-form="save-template">
              <div class="field-group">
                <label for="template-name">Nombre</label>
                <input id="template-name" name="name" maxlength="80" required value="${escapeHtml(`${boardName} plantilla`)}" />
              </div>
              <div class="field-group">
                <label for="template-description">Descripcion</label>
                <textarea id="template-description" name="description" maxlength="220" placeholder="Explica cuando usar esta plantilla."></textarea>
              </div>
              <div class="dialog-actions">
                <button class="button-ghost" type="button" data-dialog-action="close">Cancelar</button>
                <button class="button-primary" type="submit">Guardar plantilla</button>
              </div>
            </form>
          </article>
        `;
      }

      if (this.modal.type === "unlock-board") {
        const protectedBoard = this.getBoardById(this.modal.boardId);
        return `
          <article class="dialog-card">
            <p class="eyebrow">Seguridad</p>
            <h2>Abrir tablero protegido</h2>
            <p>Escribe la contrasena para entrar a <strong>${escapeHtml(protectedBoard?.name ?? "este tablero")}</strong>.</p>
            <form data-form="unlock-board">
              <input type="hidden" name="boardId" value="${escapeHtml(protectedBoard?.id ?? "")}" />
              <div class="field-group">
                <label for="board-password-unlock">Contrasena</label>
                <input id="board-password-unlock" name="password" type="password" maxlength="80" autocomplete="current-password" required />
              </div>
              ${
                this.modal.error
                  ? `<p class="dialog-feedback dialog-feedback--error">${escapeHtml(this.modal.error)}</p>`
                  : ""
              }
              <div class="dialog-actions">
                <button class="button-ghost" type="button" data-dialog-action="close">Cancelar</button>
                <button class="button-primary" type="submit">Entrar</button>
              </div>
            </form>
          </article>
        `;
      }

      if (this.modal.type === "create-board" || this.modal.type === "rename-board") {
        const boardName = this.modal.type === "rename-board" ? board?.name ?? "" : "";
        const boardPassword = this.modal.type === "rename-board" ? board?.password ?? "" : "";
        return `
          <article class="dialog-card">
            <p class="eyebrow">Tablero</p>
            <h2>${this.modal.type === "create-board" ? "Nuevo tablero" : "Renombrar tablero"}</h2>
            <form data-form="${this.modal.type}">
              ${this.modal.type === "rename-board" ? `<input type="hidden" name="boardId" value="${board?.id ?? ""}" />` : ""}
              <div class="field-group">
                <label for="board-name">Nombre</label>
                <input id="board-name" name="name" maxlength="80" required value="${escapeHtml(boardName)}" />
              </div>
              <div class="field-group">
                <label for="board-password">Contrasena</label>
                <input
                  id="board-password"
                  name="password"
                  type="password"
                  maxlength="80"
                  autocomplete="${this.modal.type === "create-board" ? "new-password" : "current-password"}"
                  value="${escapeHtml(boardPassword)}"
                  placeholder="Opcional"
                />
                <small class="muted">Si la llenas, ese tablero pedira clave al abrirse.</small>
              </div>
              <div class="dialog-actions">
                <button class="button-ghost" type="button" data-dialog-action="close">Cancelar</button>
                <button class="button-primary" type="submit">${this.modal.type === "create-board" ? "Crear tablero" : "Guardar"}</button>
              </div>
            </form>
          </article>
        `;
      }

      if (this.modal.type === "create-column" || this.modal.type === "rename-column") {
        return `
          <article class="dialog-card">
            <p class="eyebrow">Columna</p>
            <h2>${this.modal.type === "create-column" ? "Nueva columna" : "Renombrar columna"}</h2>
            <form data-form="${this.modal.type}">
              <input type="hidden" name="boardId" value="${board?.id ?? ""}" />
              ${this.modal.type === "rename-column" ? `<input type="hidden" name="columnId" value="${column?.id ?? ""}" />` : ""}
              <div class="field-group">
                <label for="column-title">Titulo</label>
                <input id="column-title" name="title" maxlength="60" required value="${escapeHtml(column?.title ?? "")}" />
              </div>
              <div class="dialog-actions">
                <button class="button-ghost" type="button" data-dialog-action="close">Cancelar</button>
                <button class="button-primary" type="submit">${this.modal.type === "create-column" ? "Crear columna" : "Guardar"}</button>
              </div>
            </form>
          </article>
        `;
      }

      if (this.modal.type === "create-card" || this.modal.type === "edit-card") {
        const currentCard = card ?? {
          title: "",
          description: "",
          priority: DEFAULT_PRIORITY,
          dueDate: "",
        };

        return `
          <article class="dialog-card">
            <p class="eyebrow">Tarjeta</p>
            <h2>${this.modal.type === "create-card" ? "Nueva tarjeta" : "Editar tarjeta"}</h2>
            <form data-form="${this.modal.type}">
              <input type="hidden" name="boardId" value="${board?.id ?? ""}" />
              <input type="hidden" name="columnId" value="${column?.id ?? ""}" />
              ${this.modal.type === "edit-card" ? `<input type="hidden" name="cardId" value="${card?.id ?? ""}" />` : ""}
              <div class="field-group">
                <label for="card-title">Titulo</label>
                <input id="card-title" name="title" maxlength="90" required value="${escapeHtml(currentCard.title)}" />
              </div>
              <div class="field-group">
                <label for="card-description">Descripcion</label>
                <textarea id="card-description" name="description" maxlength="400">${escapeHtml(currentCard.description)}</textarea>
              </div>
              <div class="field-group">
                <label for="card-priority">Prioridad</label>
                <select id="card-priority" name="priority">
                  ${Object.values(PRIORITIES)
                    .map((priority) => {
                      const isSelected = priority.id === currentCard.priority ? "selected" : "";
                      return `<option value="${priority.id}" ${isSelected}>${priority.label}</option>`;
                    })
                    .join("")}
                </select>
              </div>
              <div class="field-group">
                <label for="card-due-date">Fecha</label>
                <input id="card-due-date" name="dueDate" type="date" value="${escapeHtml(currentCard.dueDate || "")}" />
              </div>
              <div class="dialog-actions dialog-actions--between">
                ${
                  this.modal.type === "edit-card"
                    ? '<button class="button-danger" type="button" data-dialog-action="delete-card">Eliminar</button>'
                    : '<span class="dialog-spacer"></span>'
                }
                <div class="dialog-actions">
                  <button class="button-ghost" type="button" data-dialog-action="close">Cancelar</button>
                  <button class="button-primary" type="submit">${this.modal.type === "create-card" ? "Crear" : "Guardar"}</button>
                </div>
              </div>
            </form>
          </article>
        `;
      }

      return "";
    }

    renderAppearanceDialog() {
      const appearance = this.state.appearance;

      return `
        <article class="dialog-card dialog-card--wide">
          <p class="eyebrow">Personalizacion</p>
          <h2>Tema y fondo</h2>
          <section class="appearance-section">
            <div class="appearance-section__header">
              <div>
                <h3>Tema</h3>
                <p>Alterna entre claro y oscuro.</p>
              </div>
              ${this.renderThemeToggle()}
            </div>
          </section>

          <section class="appearance-section">
            <div class="appearance-section__header">
              <div>
                <h3>Color</h3>
                <p>Fondo liso sin imagen.</p>
              </div>
              <span class="pill">${escapeHtml(appearance.backgroundColor)}</span>
            </div>
            <form class="appearance-form" data-form="appearance-color">
              <input type="color" name="backgroundColor" value="${escapeHtml(appearance.backgroundColor)}" aria-label="Elegir color de fondo" />
              <button class="button-secondary" type="submit">Usar color</button>
            </form>
          </section>

          <section class="appearance-section">
            <div class="appearance-section__header">
              <div>
                <h3>Imagen propia</h3>
                <p>Se guarda en este navegador.</p>
              </div>
            </div>
            <label class="upload-field">
              <span>Elegir imagen</span>
              <input type="file" name="uploadedBackground" accept="image/*" />
            </label>
            ${
              appearance.uploadedImage
                ? `
                  <div class="upload-preview">
                    <div class="upload-preview__image" style="background-image:url('${appearance.uploadedImage}')"></div>
                    <div class="upload-preview__body">
                      <strong>${escapeHtml(appearance.uploadedImageName || "Imagen personalizada")}</strong>
                    </div>
                    <div class="upload-preview__actions">
                      <button class="button-ghost" type="button" data-dialog-action="use-upload">Usar</button>
                      <button class="button-danger" type="button" data-dialog-action="clear-upload">Quitar</button>
                    </div>
                  </div>
                `
                : '<div class="mini-empty"><p>No has cargado imagen.</p></div>'
            }
          </section>

          <section class="appearance-section">
            <div class="appearance-section__header">
              <div>
                <h3>Fondos incluidos</h3>
                <p>Paisajes, tierra, ciudades y animales.</p>
              </div>
            </div>
            <div class="preset-grid">
              ${BACKGROUND_PRESETS.map((preset) => {
                const isSelected = appearance.backgroundMode === "preset" && appearance.backgroundPresetId === preset.id ? "is-selected" : "";
                return `
                  <button
                    class="preset-card ${isSelected}"
                    type="button"
                    data-dialog-action="use-preset"
                    data-preset-id="${preset.id}"
                    style="background-image:linear-gradient(180deg, rgba(20, 20, 19, 0.12), rgba(20, 20, 19, 0.55)), url('${preset.image}')"
                  >
                    <span>${escapeHtml(preset.category)}</span>
                    <strong>${escapeHtml(preset.name)}</strong>
                  </button>
                `;
              }).join("")}
            </div>
          </section>

          <div class="dialog-actions dialog-actions--between">
            <button class="button-ghost" type="button" data-dialog-action="reset-appearance">Restablecer</button>
            <div class="dialog-actions">
              <button class="button-ghost" type="button" data-dialog-action="use-color">Solo color</button>
              <button class="button-primary" type="button" data-dialog-action="close">Cerrar</button>
            </div>
          </div>
        </article>
      `;
    }

    renderAllBoardsDialog() {
      return `
        <article class="dialog-card dialog-card--wide">
          <p class="eyebrow">Tableros</p>
          <h2>Todos tus tableros</h2>
          <div class="boards-gallery">
            ${this.state.boards
              .map((board) => {
                const isActive = board.id === this.state.activeBoardId ? "is-active" : "";
                return `
                  <button class="gallery-card ${isActive}" type="button" data-dialog-action="switch-board-modal" data-board-id="${board.id}">
                    ${this.renderMiniBoardPreview(this.getBoardPreviewColumns(board))}
                    <strong>${escapeHtml(board.name)}</strong>
                    <span>${board.columnOrder.length} columnas · ${Object.keys(board.cardsById).length} tarjetas</span>
                    <small>${this.isBoardProtected(board) ? "Con clave · " : ""}${escapeHtml(formatDate(board.updatedAt))}</small>
                  </button>
                `;
              })
              .join("")}
          </div>
          <div class="dialog-actions">
            <button class="button-ghost" type="button" data-dialog-action="close">Cerrar</button>
            <button class="button-primary" type="button" data-dialog-action="open-create-board">Nuevo tablero</button>
          </div>
        </article>
      `;
    }

    renderTemplatesDialog() {
      return `
        <article class="dialog-card dialog-card--wide">
          <p class="eyebrow">Plantillas</p>
          <h2>Plantillas de tableros</h2>
          <div class="template-gallery">
            ${this.state.templates
              .map((template) => {
                const cardCount = template.columns.reduce((sum, column) => sum + column.cards.length, 0);
                return `
                  <article class="template-card">
                    ${this.renderMiniBoardPreview(template.columns)}
                    <strong>${escapeHtml(template.name)}</strong>
                    <p>${escapeHtml(template.description || "Plantilla lista para reutilizar.")}</p>
                    <span>${template.columns.length} columnas · ${cardCount} tarjetas</span>
                    <button class="button-primary" type="button" data-dialog-action="use-template" data-template-id="${template.id}">Usar plantilla</button>
                  </article>
                `;
              })
              .join("")}
          </div>
          <div class="dialog-actions dialog-actions--between">
            <button class="button-ghost" type="button" data-dialog-action="open-save-template">Guardar tablero actual</button>
            <button class="button-ghost" type="button" data-dialog-action="close">Cerrar</button>
          </div>
        </article>
      `;
    }

    handleRootInput(event) {
      const field = event.target.closest("[data-note-field]");
      if (!field) {
        return;
      }

      const noteId = field.dataset.noteId;
      const noteIndex = this.state.notes.findIndex((note) => note.id === noteId);
      if (noteIndex === -1) {
        return;
      }

      const key = field.dataset.noteField;
      const nextValue = key === "title" ? String(field.value || "").slice(0, 120) : String(field.value || "");
      const note = this.state.notes[noteIndex];
      this.state.notes[noteIndex] = {
        ...note,
        [key]: nextValue,
        updatedAt: new Date().toISOString(),
      };
      this.persistSilently();
    }

    createNote() {
      const note = createNoteRecord({
        title: `Nota ${this.state.notes.length + 1}`,
        content: "",
      });
      this.state.notes = [note, ...this.state.notes];
      this.state.activeNoteId = note.id;
      this.state.currentView = "notes";
      this.ui.menuOpen = false;
      this.persist();
    }

    deleteNote(noteId) {
      this.state.notes = this.state.notes.filter((note) => note.id !== noteId);
      this.state.activeNoteId = this.state.notes[0]?.id ?? null;
      this.state.currentView = "notes";
      this.persist();
      this.closeModal();
    }
  }

  window.LumbreApp = LumbreApp;
})();
