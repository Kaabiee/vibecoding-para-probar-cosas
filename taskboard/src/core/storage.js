(function () {
  const {
    BACKGROUND_PRESETS,
    DEFAULT_APPEARANCE,
    DEFAULT_PRIORITY,
    DEMO_BOARDS,
    LEGACY_STORAGE_KEYS,
    PRIORITIES,
    STORAGE_KEY,
    STORAGE_VERSION,
    TEMPLATE_PRESETS,
  } = window.LumbreConfig;

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function nowIso() {
    return new Date().toISOString();
  }

  function isRecord(value) {
    return Boolean(value) && typeof value === "object" && !Array.isArray(value);
  }

  function asString(value, fallback) {
    return typeof value === "string" && value.trim() ? value.trim() : fallback;
  }

  function asPriority(value) {
    return PRIORITIES[value] ? value : DEFAULT_PRIORITY;
  }

  function isHexColor(value) {
    return typeof value === "string" && /^#[0-9a-f]{6}$/i.test(value);
  }

  function asDateString(value) {
    return typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : "";
  }

  function asPassword(value) {
    return typeof value === "string" ? value.trim() : "";
  }

  function hasPreset(presetId) {
    return BACKGROUND_PRESETS.some((preset) => preset.id === presetId);
  }

  function hydrateAppearance(rawAppearance) {
    const appearance = isRecord(rawAppearance) ? rawAppearance : {};
    const backgroundMode = ["preset", "color", "upload"].includes(appearance.backgroundMode)
      ? appearance.backgroundMode
      : DEFAULT_APPEARANCE.backgroundMode;

    return {
      theme: appearance.theme === "dark" ? "dark" : "light",
      backgroundMode,
      backgroundColor: isHexColor(appearance.backgroundColor) ? appearance.backgroundColor : DEFAULT_APPEARANCE.backgroundColor,
      backgroundPresetId: hasPreset(appearance.backgroundPresetId)
        ? appearance.backgroundPresetId
        : DEFAULT_APPEARANCE.backgroundPresetId,
      uploadedImage: typeof appearance.uploadedImage === "string" ? appearance.uploadedImage : "",
      uploadedImageName: typeof appearance.uploadedImageName === "string" ? appearance.uploadedImageName : "",
    };
  }

  function createId(prefix) {
    return `${prefix}-${Math.random().toString(36).slice(2, 8)}-${Date.now().toString(36)}`;
  }

  function createCardRecord(input) {
    const createdAt = asString(input?.createdAt, nowIso());
    return {
      id: asString(input?.id, createId("card")),
      title: asString(input?.title, "Nueva tarjeta"),
      description: typeof input?.description === "string" ? input.description.trim() : "",
      priority: asPriority(input?.priority),
      dueDate: asDateString(input?.dueDate),
      createdAt,
      updatedAt: asString(input?.updatedAt, createdAt),
    };
  }

  function createColumnRecord(input) {
    return {
      id: asString(input?.id, createId("col")),
      title: asString(input?.title, "Nueva columna"),
      cardIds: Array.isArray(input?.cardIds) ? [...input.cardIds] : [],
    };
  }

  function createBoardRecord(input) {
    const createdAt = asString(input?.createdAt, nowIso());
    const board = {
      id: asString(input?.id, createId("board")),
      name: asString(input?.name, "Nuevo tablero"),
      password: asPassword(input?.password),
      createdAt,
      updatedAt: asString(input?.updatedAt, createdAt),
      columnOrder: [],
      columnsById: {},
      cardsById: {},
    };

    const sourceColumns = Array.isArray(input?.columns) ? input.columns : [];
    for (const rawColumn of sourceColumns) {
      const column = createColumnRecord(rawColumn);
      const cards = Array.isArray(rawColumn?.cards) ? rawColumn.cards : [];

      for (const rawCard of cards) {
        const card = createCardRecord(rawCard);
        board.cardsById[card.id] = card;
        column.cardIds.push(card.id);
      }

      board.columnsById[column.id] = column;
      board.columnOrder.push(column.id);
    }

    return board;
  }

  function createTemplateRecord(input) {
    const createdAt = asString(input?.createdAt, nowIso());
    const columns = Array.isArray(input?.columns)
      ? input.columns.map((column) => ({
          title: asString(column?.title, "Nueva columna"),
          cards: Array.isArray(column?.cards)
            ? column.cards.map((card) => ({
                title: asString(card?.title, "Nueva tarjeta"),
                description: typeof card?.description === "string" ? card.description.trim() : "",
                priority: asPriority(card?.priority),
                dueDate: asDateString(card?.dueDate),
              }))
            : [],
        }))
      : [];

    return {
      id: asString(input?.id, createId("tpl")),
      name: asString(input?.name, "Nueva plantilla"),
      description: typeof input?.description === "string" ? input.description.trim() : "",
      createdAt,
      updatedAt: asString(input?.updatedAt, createdAt),
      columns,
    };
  }

  function createNoteRecord(input) {
    const createdAt = asString(input?.createdAt, nowIso());
    return {
      id: asString(input?.id, createId("note")),
      title: asString(input?.title, "Nota sin titulo"),
      content: typeof input?.content === "string" ? input.content : "",
      createdAt,
      updatedAt: asString(input?.updatedAt, createdAt),
    };
  }

  function createSeedState() {
    const boards = DEMO_BOARDS.map((board) => createBoardRecord(board));
    const templates = TEMPLATE_PRESETS.map((template) => createTemplateRecord(template));
    return {
      version: STORAGE_VERSION,
      currentView: "boards",
      activeBoardId: boards[0]?.id ?? null,
      activeNoteId: null,
      appearance: clone(DEFAULT_APPEARANCE),
      boards,
      templates,
      notes: [],
    };
  }

  function hydrateCard(rawCard) {
    if (!isRecord(rawCard)) {
      return null;
    }

    return createCardRecord(rawCard);
  }

  function hydrateColumn(rawColumn, cardsById) {
    if (!isRecord(rawColumn)) {
      return null;
    }

    const column = createColumnRecord(rawColumn);
    column.cardIds = column.cardIds.filter((cardId) => Boolean(cardsById[cardId]));
    return column;
  }

  function hydrateBoard(rawBoard) {
    if (!isRecord(rawBoard)) {
      return null;
    }

    const cardsById = {};
    const rawCardsById = isRecord(rawBoard.cardsById) ? rawBoard.cardsById : {};
    Object.values(rawCardsById).forEach((rawCard) => {
      const card = hydrateCard(rawCard);
      if (card) {
        cardsById[card.id] = card;
      }
    });

    const columnsById = {};
    const columnOrder = [];
    const rawColumnsById = isRecord(rawBoard.columnsById) ? rawBoard.columnsById : {};
    const orderedIds = Array.isArray(rawBoard.columnOrder) ? rawBoard.columnOrder : [];

    orderedIds.forEach((columnId) => {
      const column = hydrateColumn(rawColumnsById[columnId], cardsById);
      if (column) {
        columnsById[column.id] = column;
        columnOrder.push(column.id);
      }
    });

    Object.values(rawColumnsById).forEach((rawColumn) => {
      const column = hydrateColumn(rawColumn, cardsById);
      if (column && !columnsById[column.id]) {
        columnsById[column.id] = column;
        columnOrder.push(column.id);
      }
    });

    const createdAt = asString(rawBoard.createdAt, nowIso());
    return {
      id: asString(rawBoard.id, createId("board")),
      name: asString(rawBoard.name, "Nuevo tablero"),
      password: asPassword(rawBoard.password),
      createdAt,
      updatedAt: asString(rawBoard.updatedAt, createdAt),
      columnOrder,
      columnsById,
      cardsById,
    };
  }

  function hydrateNote(rawNote) {
    if (!isRecord(rawNote)) {
      return null;
    }

    return createNoteRecord(rawNote);
  }

  function hydrateState(rawState) {
    if (!isRecord(rawState) || !Array.isArray(rawState.boards)) {
      return createSeedState();
    }

    const boards = rawState.boards.map(hydrateBoard).filter(Boolean);
    const notes = Array.isArray(rawState.notes) ? rawState.notes.map(hydrateNote).filter(Boolean) : [];
    const templates = Array.isArray(rawState.templates)
      ? rawState.templates.map((template) => createTemplateRecord(template)).filter(Boolean)
      : TEMPLATE_PRESETS.map((template) => createTemplateRecord(template));

    return {
      version: STORAGE_VERSION,
      currentView: rawState.currentView === "notes" ? "notes" : "boards",
      activeBoardId: boards.some((board) => board.id === rawState.activeBoardId) ? rawState.activeBoardId : boards[0]?.id ?? null,
      activeNoteId: notes.some((note) => note.id === rawState.activeNoteId) ? rawState.activeNoteId : notes[0]?.id ?? null,
      appearance: hydrateAppearance(rawState.appearance),
      boards,
      templates,
      notes,
    };
  }

  function readLocalStorage(key) {
    try {
      return window.localStorage.getItem(key);
    } catch (error) {
      console.warn("No se pudo leer localStorage.", error);
      return null;
    }
  }

  function writeLocalStorage(key, value) {
    try {
      window.localStorage.setItem(key, value);
    } catch (error) {
      console.warn("No se pudo guardar el estado.", error);
    }
  }

  function loadRawState() {
    const keys = [STORAGE_KEY, ...LEGACY_STORAGE_KEYS];

    for (const key of keys) {
      const raw = readLocalStorage(key);
      if (!raw) {
        continue;
      }

      try {
        const state = hydrateState(JSON.parse(raw));
        if (key !== STORAGE_KEY) {
          writeLocalStorage(STORAGE_KEY, JSON.stringify(state));
        }
        return state;
      } catch (error) {
        console.warn("No se pudo hidratar el estado guardado.", error);
      }
    }

    return createSeedState();
  }

  const Storage = {
    loadState() {
      return loadRawState();
    },

    saveState(state) {
      writeLocalStorage(STORAGE_KEY, JSON.stringify(hydrateState(clone(state))));
    },

    resetState() {
      const state = createSeedState();
      writeLocalStorage(STORAGE_KEY, JSON.stringify(state));
      return state;
    },
  };

  window.LumbreData = {
    Storage,
    createId,
    createCardRecord,
    createColumnRecord,
    createBoardRecord,
    createTemplateRecord,
    createNoteRecord,
  };
})();
