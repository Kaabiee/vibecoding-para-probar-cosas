const Notes = {
    _notes: [],

    init() {
        this._notes = this._load();

        $('#btn-notes').addEventListener('click', () => this.toggle());
        $('#notes-panel-close').addEventListener('click', () => this.close());

        $('#notes-add-btn').addEventListener('click', () => this._addFromInput());
        $('#notes-input').addEventListener('keydown', (e) => {
            if (e.key === 'Enter') this._addFromInput();
        });

        this.render();
    },

    toggle() {
        const panel = $('#notes-panel');
        if (panel.classList.contains('open')) {
            this.close();
        } else {
            this.render();
            panel.classList.add('open');
        }
    },

    close() {
        $('#notes-panel').classList.remove('open');
    },

    render() {
        const container = $('#notes-list');
        container.innerHTML = '';

        if (this._notes.length === 0) {
            const empty = createElement('div', 'notes-empty');
            empty.textContent = 'No tienes notas aun. Escribe algo abajo para empezar.';
            container.appendChild(empty);
            return;
        }

        // Sort: pinned first, then by date descending
        const sorted = [...this._notes].sort((a, b) => {
            if (a.pinned && !b.pinned) return -1;
            if (!a.pinned && b.pinned) return 1;
            return b.createdAt - a.createdAt;
        });

        sorted.forEach(note => {
            container.appendChild(this._renderNote(note));
        });
    },

    _renderNote(note) {
        const item = createElement('div', 'note-item');
        if (note.pinned) item.classList.add('pinned');

        const text = createElement('div', 'note-text');
        text.textContent = note.text;
        text.contentEditable = true;
        text.spellcheck = false;

        text.addEventListener('blur', () => {
            const newText = text.textContent.trim();
            if (newText && newText !== note.text) {
                note.text = newText;
                this._save();
            } else if (!newText) {
                text.textContent = note.text;
            }
        });

        text.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                text.blur();
            }
        });

        const meta = createElement('div', 'note-meta');

        const date = createElement('span', 'note-date');
        date.textContent = this._formatDate(note.createdAt);

        const actions = createElement('div', 'note-actions');

        const pinBtn = createElement('button', 'note-action-btn');
        pinBtn.textContent = '\u{1F4CC}';
        pinBtn.title = note.pinned ? 'Desfijar' : 'Fijar arriba';
        if (note.pinned) pinBtn.classList.add('pin-active');
        pinBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this._togglePin(note.id);
        });

        const deleteBtn = createElement('button', 'note-action-btn');
        deleteBtn.textContent = '\u2715';
        deleteBtn.title = 'Eliminar';
        deleteBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this._delete(note.id);
        });

        actions.appendChild(pinBtn);
        actions.appendChild(deleteBtn);

        meta.appendChild(date);
        meta.appendChild(actions);

        item.appendChild(text);
        item.appendChild(meta);

        return item;
    },

    _addFromInput() {
        const input = $('#notes-input');
        const text = input.value.trim();
        if (!text) return;

        this._notes.push({
            id: generateId(),
            text: text,
            createdAt: Date.now(),
            pinned: false
        });

        this._save();
        input.value = '';
        this.render();
    },

    _togglePin(id) {
        const note = this._notes.find(n => n.id === id);
        if (note) {
            note.pinned = !note.pinned;
            this._save();
            this.render();
        }
    },

    _delete(id) {
        this._notes = this._notes.filter(n => n.id !== id);
        this._save();
        this.render();
    },

    _formatDate(timestamp) {
        const d = new Date(timestamp);
        const now = new Date();
        const diff = now - d;

        if (diff < 60000) return 'Ahora';
        if (diff < 3600000) return Math.floor(diff / 60000) + ' min';
        if (diff < 86400000) return Math.floor(diff / 3600000) + ' h';

        return d.toLocaleDateString('es', { day: 'numeric', month: 'short' });
    },

    _load() {
        try {
            const raw = localStorage.getItem(NOTES_KEY);
            return raw ? JSON.parse(raw) : [];
        } catch {
            return [];
        }
    },

    _save() {
        localStorage.setItem(NOTES_KEY, JSON.stringify(this._notes));
    }
};
