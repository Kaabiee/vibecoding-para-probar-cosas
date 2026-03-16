const Background = {
    _key: 'flowboard_bg',
    _current: null,

    init() {
        this._renderPresets();
        this._bindEvents();
        this._loadSaved();
    },

    _renderPresets() {
        // Preset colors
        const colorsGrid = $('#bg-preset-colors');
        PRESET_COLORS.forEach(color => {
            const btn = createElement('button', 'bg-preset-color');
            btn.style.background = color;
            btn.dataset.color = color;
            btn.addEventListener('click', () => this.setColor(color));
            colorsGrid.appendChild(btn);
        });

        // Preset images
        const imagesGrid = $('#bg-image-grid');
        PRESET_IMAGES.forEach(img => {
            const btn = createElement('button', 'bg-image-option');
            btn.style.backgroundImage = `url(${img.url})`;
            btn.dataset.url = img.url;
            const label = createElement('span', 'bg-image-label', img.name);
            btn.appendChild(label);
            btn.addEventListener('click', () => this.setImage(img.url));
            imagesGrid.appendChild(btn);
        });
    },

    _bindEvents() {
        $('#btn-bg-settings').addEventListener('click', () => this.togglePanel());
        $('#bg-panel-close').addEventListener('click', () => this.closePanel());

        $('#bg-color-apply').addEventListener('click', () => {
            const color = $('#bg-color-picker').value;
            this.setColor(color);
        });

        $('#bg-upload-btn').addEventListener('click', () => {
            $('#bg-file-input').click();
        });

        $('#bg-file-input').addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = (ev) => {
                this.setImage(ev.target.result);
            };
            reader.readAsDataURL(file);
            e.target.value = '';
        });

        $('#bg-reset').addEventListener('click', () => this.reset());
    },

    togglePanel() {
        $('#bg-panel').classList.toggle('open');
    },

    closePanel() {
        $('#bg-panel').classList.remove('open');
    },

    setColor(color) {
        this._clearActiveStates();
        document.body.classList.remove('has-bg-image');
        document.body.style.backgroundImage = '';
        document.body.style.background = color;
        document.documentElement.style.setProperty('--board-bg', color);

        // Mark active
        const btn = $(`.bg-preset-color[data-color="${color}"]`);
        if (btn) btn.classList.add('active');

        this._current = { type: 'color', value: color };
        this._save();
    },

    setImage(url) {
        this._clearActiveStates();
        document.body.classList.add('has-bg-image');
        document.body.style.background = '';
        document.body.style.backgroundImage = `url(${url})`;
        document.body.style.backgroundSize = 'cover';
        document.body.style.backgroundPosition = 'center';
        document.body.style.backgroundRepeat = 'no-repeat';
        document.documentElement.style.setProperty('--board-bg', 'transparent');

        // Mark active
        const btn = $(`.bg-image-option[data-url="${url}"]`);
        if (btn) btn.classList.add('active');

        this._current = { type: 'image', value: url };
        this._save();
    },

    reset() {
        this._clearActiveStates();
        document.body.classList.remove('has-bg-image');
        document.body.style.background = '';
        document.body.style.backgroundImage = '';
        document.documentElement.style.removeProperty('--board-bg');
        this._current = null;
        localStorage.removeItem(this._key);
    },

    _clearActiveStates() {
        $$('.bg-preset-color.active').forEach(el => el.classList.remove('active'));
        $$('.bg-image-option.active').forEach(el => el.classList.remove('active'));
    },

    _save() {
        if (this._current) {
            localStorage.setItem(this._key, JSON.stringify(this._current));
        }
    },

    _loadSaved() {
        try {
            const raw = localStorage.getItem(this._key);
            if (!raw) return;
            const saved = JSON.parse(raw);
            if (saved.type === 'color') {
                this.setColor(saved.value);
            } else if (saved.type === 'image') {
                this.setImage(saved.value);
            }
        } catch {
            // ignore
        }
    }
};
