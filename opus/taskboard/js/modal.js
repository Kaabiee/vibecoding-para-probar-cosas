const Modal = {
    _onConfirm: null,

    show({ title, fields, confirmText = 'Confirmar', onConfirm, extraContent }) {
        const overlay = $('#modal-overlay');
        const titleEl = $('#modal-title');
        const body = $('#modal-body');
        const confirmBtn = $('#modal-confirm');

        titleEl.textContent = title;
        confirmBtn.textContent = confirmText;
        body.innerHTML = '';

        fields.forEach(field => {
            const wrapper = createElement('div', 'modal-field');
            if (field.label) {
                const label = createElement('label', null, field.label);
                wrapper.appendChild(label);
            }

            let input;
            if (field.type === 'textarea') {
                input = createElement('textarea');
                input.rows = 3;
            } else if (field.type === 'select') {
                input = createElement('select');
                field.options.forEach(opt => {
                    const option = createElement('option', null, opt.label);
                    option.value = opt.value;
                    if (opt.value === field.value) option.selected = true;
                    input.appendChild(option);
                });
            } else {
                input = createElement('input');
                input.type = field.type || 'text';
            }

            input.name = field.name;
            input.placeholder = field.placeholder || '';
            if (field.value && field.type !== 'select') input.value = field.value;
            wrapper.appendChild(input);
            body.appendChild(wrapper);
        });

        if (extraContent) {
            extraContent(body);
        }

        this._onConfirm = onConfirm;
        overlay.classList.remove('hidden');

        const firstInput = body.querySelector('input, textarea');
        if (firstInput) {
            firstInput.focus();
            firstInput.select();
        }
    },

    hide() {
        $('#modal-overlay').classList.add('hidden');
        this._onConfirm = null;
    },

    _getValues() {
        const inputs = $$('#modal-body input, #modal-body textarea, #modal-body select');
        const values = {};
        inputs.forEach(input => {
            values[input.name] = input.value.trim();
        });
        return values;
    },

    init() {
        $('#modal-cancel').addEventListener('click', () => this.hide());
        $('#modal-confirm').addEventListener('click', () => {
            if (this._onConfirm) {
                this._onConfirm(this._getValues());
            }
            this.hide();
        });
        $('#modal-overlay').addEventListener('click', (e) => {
            if (e.target === e.currentTarget) this.hide();
        });
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') this.hide();
            if (e.key === 'Enter' && !$('#modal-overlay').classList.contains('hidden')) {
                const textarea = $('#modal-body textarea:focus');
                if (textarea) return;
                e.preventDefault();
                if (this._onConfirm) {
                    this._onConfirm(this._getValues());
                }
                this.hide();
            }
        });
    }
};
