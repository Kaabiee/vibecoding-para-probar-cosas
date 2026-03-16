const Sidebar = {
    init() {
        $('#btn-menu').addEventListener('click', () => this.toggle());
        $('#sidebar-close').addEventListener('click', () => this.close());
        $('#sidebar-overlay').addEventListener('click', () => this.close());
        $('#sidebar-new-board').addEventListener('click', () => {
            this.close();
            Board.promptNew();
        });

        this._renderTemplates();
        this._bindKeyboard();
    },

    toggle() {
        const sidebar = $('#sidebar');
        const overlay = $('#sidebar-overlay');
        const isOpen = sidebar.classList.contains('open');
        if (isOpen) {
            this.close();
        } else {
            this.render();
            sidebar.classList.add('open');
            overlay.classList.remove('hidden');
        }
    },

    close() {
        $('#sidebar').classList.remove('open');
        $('#sidebar-overlay').classList.add('hidden');
    },

    render() {
        this._renderBoards();
        this._renderStats();
        this._renderTemplates();
    },

    _renderBoards() {
        const container = $('#sidebar-boards');
        container.innerHTML = '';
        AppState.boards.forEach(b => {
            const item = createElement('button', 'sidebar-board-item');
            if (b.id === AppState.currentBoardId) item.classList.add('active');

            const icon = createElement('span', 'sidebar-board-icon');
            icon.textContent = b.locked ? '\u{1F512}' : '\u{1F4CB}';

            const name = createElement('span', 'sidebar-board-name', b.name);
            const count = createElement('span', 'sidebar-board-count');

            let totalCards = 0;
            b.columns.forEach(c => totalCards += c.cards.length);
            count.textContent = totalCards + ' tarjetas';

            item.appendChild(icon);
            item.appendChild(name);
            item.appendChild(count);

            // Preview tooltip on hover
            this._addBoardPreview(item, b);

            item.addEventListener('click', () => {
                if (b.locked && b.id !== AppState.currentBoardId) {
                    this.close();
                    Board.promptUnlock(b.id);
                } else {
                    Board.switch(b.id);
                    this.close();
                }
            });
            container.appendChild(item);
        });
    },

    _addBoardPreview(item, board) {
        let tooltip = null;

        item.addEventListener('mouseenter', () => {
            tooltip = createElement('div', 'sidebar-preview-tooltip');
            board.columns.forEach(col => {
                const row = createElement('div', 'preview-col-item');
                const colName = createElement('span', 'preview-col-name', col.name);
                const colCount = createElement('span', 'preview-col-count', col.cards.length + ' tarjetas');
                row.appendChild(colName);
                row.appendChild(colCount);
                tooltip.appendChild(row);
            });
            if (board.columns.length === 0) {
                const empty = createElement('div', 'preview-col-item');
                empty.textContent = 'Sin columnas';
                tooltip.appendChild(empty);
            }
            item.appendChild(tooltip);
        });

        item.addEventListener('mouseleave', () => {
            if (tooltip && tooltip.parentNode) {
                tooltip.remove();
            }
            tooltip = null;
        });
    },

    _addTemplatePreview(item, tpl) {
        let tooltip = null;

        item.addEventListener('mouseenter', () => {
            tooltip = createElement('div', 'sidebar-preview-tooltip');
            tpl.columns.forEach(col => {
                const row = createElement('div', 'preview-col-item');
                const colName = createElement('span', 'preview-col-name', col.name);
                row.appendChild(colName);
                tooltip.appendChild(row);
            });
            item.appendChild(tooltip);
        });

        item.addEventListener('mouseleave', () => {
            if (tooltip && tooltip.parentNode) {
                tooltip.remove();
            }
            tooltip = null;
        });
    },

    _renderTemplates() {
        const container = $('#sidebar-templates');
        container.innerHTML = '';

        // Built-in templates
        BOARD_TEMPLATES.forEach(tpl => {
            container.appendChild(this._createTemplateItem(tpl, false));
        });

        // Custom templates
        const custom = this._loadCustomTemplates();
        custom.forEach(tpl => {
            container.appendChild(this._createTemplateItem(tpl, true));
        });

        // Add custom template button
        const addBtn = createElement('button', 'sidebar-action-btn');
        addBtn.textContent = '+ Crear plantilla';
        addBtn.addEventListener('click', () => {
            this.close();
            this._promptCreateTemplate();
        });
        container.appendChild(addBtn);
    },

    _createTemplateItem(tpl, isCustom) {
        const item = createElement('button', 'sidebar-template-item');

        const header = createElement('div', 'sidebar-template-header');
        const icon = createElement('span', 'sidebar-template-icon', tpl.icon);
        const name = createElement('span', 'sidebar-template-name', tpl.name);
        header.appendChild(icon);
        header.appendChild(name);

        if (isCustom) {
            const badge = createElement('span', 'template-custom-badge', 'Custom');
            header.appendChild(badge);
        }

        const desc = createElement('div', 'sidebar-template-desc', tpl.description);

        item.appendChild(header);
        item.appendChild(desc);

        // Preview tooltip on hover
        this._addTemplatePreview(item, tpl);

        item.addEventListener('click', () => {
            this.close();
            this._promptConfirmTemplate(tpl, isCustom);
        });
        return item;
    },

    _promptConfirmTemplate(tpl, isCustom) {
        const columnsPreview = tpl.columns.map(c => c.name).join(' \u2192 ');

        Modal.show({
            title: 'Crear desde plantilla',
            fields: [
                { name: 'name', label: 'Nombre del tablero', value: tpl.name, placeholder: 'Nombre del tablero' }
            ],
            confirmText: 'Crear tablero',
            onConfirm: (values) => {
                if (!values.name) return;
                this._createFromTemplate(tpl, values.name);
            },
            extraContent: (body) => {
                const preview = createElement('div', 'template-preview');

                const previewTitle = createElement('div', 'template-preview-title');
                previewTitle.textContent = tpl.icon + ' ' + tpl.name;
                preview.appendChild(previewTitle);

                const previewCols = createElement('div', 'template-preview-cols');
                previewCols.textContent = columnsPreview;
                preview.appendChild(previewCols);

                const previewCount = createElement('div', 'template-preview-count');
                previewCount.textContent = tpl.columns.length + ' columnas';
                preview.appendChild(previewCount);

                body.appendChild(preview);

                if (isCustom) {
                    const deleteBtn = createElement('button', 'btn btn-danger template-delete-btn');
                    deleteBtn.textContent = 'Eliminar plantilla';
                    deleteBtn.addEventListener('click', (e) => {
                        e.stopPropagation();
                        Modal.hide();
                        this._deleteCustomTemplate(tpl.id);
                    });
                    body.appendChild(deleteBtn);
                }
            }
        });
    },

    _createFromTemplate(tpl, name) {
        if (AppState.boards.length >= MAX_BOARDS) return;
        const board = {
            id: generateId(),
            name: name,
            createdAt: Date.now(),
            columns: tpl.columns.map(col => ({
                id: generateId(),
                name: col.name,
                cards: []
            }))
        };
        AppState.boards.push(board);
        AppState.currentBoardId = board.id;
        Render.all();
    },

    _promptCreateTemplate() {
        const board = AppState.currentBoard;
        if (!board) return;

        Modal.show({
            title: 'Crear plantilla',
            fields: [
                { name: 'name', label: 'Nombre de la plantilla', placeholder: 'Ej: Mi flujo de trabajo' },
                { name: 'icon', label: 'Icono (emoji)', placeholder: '\u{1F4CB}', value: '\u{1F4CB}' },
                { name: 'description', label: 'Descripcion', placeholder: 'Breve descripcion' }
            ],
            confirmText: 'Guardar plantilla',
            onConfirm: (values) => {
                if (!values.name) return;
                const template = {
                    id: generateId(),
                    name: values.name,
                    icon: values.icon || '\u{1F4CB}',
                    description: values.description || board.columns.map(c => c.name).join(', '),
                    columns: board.columns.map(c => ({ name: c.name, cards: [] }))
                };
                const customs = this._loadCustomTemplates();
                customs.push(template);
                this._saveCustomTemplates(customs);
            },
            extraContent: (body) => {
                const info = createElement('div', 'template-create-info');
                info.textContent = 'Columnas del tablero actual: ' + board.columns.map(c => c.name).join(' \u2192 ');
                body.appendChild(info);
            }
        });
    },

    _loadCustomTemplates() {
        try {
            const raw = localStorage.getItem(CUSTOM_TEMPLATES_KEY);
            return raw ? JSON.parse(raw) : [];
        } catch {
            return [];
        }
    },

    _saveCustomTemplates(templates) {
        localStorage.setItem(CUSTOM_TEMPLATES_KEY, JSON.stringify(templates));
    },

    _deleteCustomTemplate(id) {
        const customs = this._loadCustomTemplates().filter(t => t.id !== id);
        this._saveCustomTemplates(customs);
    },

    _renderStats() {
        const container = $('#sidebar-stats');
        const boards = AppState.boards;

        let totalBoards = boards.length;
        let totalColumns = 0;
        let totalCards = 0;

        boards.forEach(b => {
            totalColumns += b.columns.length;
            b.columns.forEach(c => totalCards += c.cards.length);
        });

        container.innerHTML = '';
        const stats = [
            { label: 'Tableros', value: totalBoards },
            { label: 'Columnas', value: totalColumns },
            { label: 'Tarjetas', value: totalCards }
        ];

        stats.forEach(s => {
            const item = createElement('div', 'stat-item');
            const value = createElement('div', 'stat-value', String(s.value));
            const label = createElement('div', 'stat-label', s.label);
            item.appendChild(value);
            item.appendChild(label);
            container.appendChild(item);
        });
    },

    _bindKeyboard() {
        document.addEventListener('keydown', (e) => {
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.contentEditable === 'true') return;
            if ($('#modal-overlay').classList.contains('hidden') === false) return;

            switch (e.key.toLowerCase()) {
                case 'm':
                    this.toggle();
                    break;
                case 'b':
                    Board.promptNew();
                    break;
                case 't':
                    Theme.toggle();
                    break;
                case 'n':
                    Notes.toggle();
                    break;
                case 'escape':
                    this.close();
                    Notes.close();
                    break;
            }
        });
    }
};
