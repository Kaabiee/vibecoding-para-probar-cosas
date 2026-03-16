const Theme = {
    _key: 'flowboard_theme',

    init() {
        const saved = localStorage.getItem(this._key) || 'dark';
        this._apply(saved);

        $('#theme-toggle').addEventListener('click', () => this.toggle());
    },

    toggle() {
        const current = document.documentElement.getAttribute('data-theme');
        const next = current === 'light' ? 'dark' : 'light';
        this._apply(next);
        localStorage.setItem(this._key, next);
    },

    _apply(theme) {
        document.documentElement.setAttribute('data-theme', theme);
    },

    get current() {
        return document.documentElement.getAttribute('data-theme') || 'dark';
    }
};
