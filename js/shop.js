// ─── Shop & Skins ────────────────────────────────────────────────────────────

const Shop = {
    renderShop() {
        const grid = document.getElementById('shop-grid');
        grid.innerHTML = '';

        SKIN_ORDER.forEach(id => {
            const skin = SKINS[id];
            const owned = SaveData.unlockedSkins.includes(id);
            const canAfford = SaveData.coins >= skin.price;
            const isActive = SaveData.activeSkin === id;

            const card = document.createElement('div');
            card.className = 'skin-card' + (owned ? ' owned' : '') + (isActive ? ' active' : '');

            const preview = this.createPreview(skin);

            let btnHtml;
            if (owned && isActive) {
                btnHtml = '<button class="btn btn-small" disabled>Equipped</button>';
            } else if (owned) {
                btnHtml = `<button class="btn btn-small btn-equip" data-skin="${id}">Equip</button>`;
            } else if (skin.price === 0) {
                btnHtml = '<button class="btn btn-small" disabled>Free</button>';
            } else {
                btnHtml = `<button class="btn btn-small btn-buy ${canAfford ? '' : 'disabled'}" data-skin="${id}" ${canAfford ? '' : 'disabled'}>${skin.price} coins</button>`;
            }

            card.innerHTML = `
                ${preview}
                <div class="skin-name">${skin.name}</div>
                ${btnHtml}
            `;
            grid.appendChild(card);
        });

        document.getElementById('shop-coins').textContent = SaveData.coins;

        // Event listeners
        grid.querySelectorAll('.btn-buy').forEach(btn => {
            btn.addEventListener('click', () => this.buy(btn.dataset.skin));
        });
        grid.querySelectorAll('.btn-equip').forEach(btn => {
            btn.addEventListener('click', () => this.equip(btn.dataset.skin));
        });
    },

    renderSkins() {
        const grid = document.getElementById('skins-grid');
        grid.innerHTML = '';

        SKIN_ORDER.forEach(id => {
            if (!SaveData.unlockedSkins.includes(id)) return;
            const skin = SKINS[id];
            const isActive = SaveData.activeSkin === id;

            const card = document.createElement('div');
            card.className = 'skin-card' + (isActive ? ' active' : '');

            const preview = this.createPreview(skin);
            const btnHtml = isActive
                ? '<button class="btn btn-small" disabled>Equipped</button>'
                : `<button class="btn btn-small btn-equip" data-skin="${id}">Equip</button>`;

            card.innerHTML = `${preview}<div class="skin-name">${skin.name}</div>${btnHtml}`;
            grid.appendChild(card);
        });

        grid.querySelectorAll('.btn-equip').forEach(btn => {
            btn.addEventListener('click', () => {
                this.equip(btn.dataset.skin);
                this.renderSkins();
            });
        });
    },

    createPreview(skin) {
        return `<div class="skin-preview">
            <div class="skin-seg" style="background:${skin.colors[0]}"></div>
            <div class="skin-seg" style="background:${skin.colors[1]}"></div>
            <div class="skin-seg" style="background:${skin.colors[2]}"></div>
        </div>`;
    },

    buy(id) {
        const skin = SKINS[id];
        if (SaveData.coins < skin.price) return;
        if (SaveData.unlockedSkins.includes(id)) return;

        SaveData.coins -= skin.price;
        SaveData.unlockedSkins.push(id);
        writeSave();
        Audio.purchase();

        // Check achievements
        if (!SaveData.achievements.includes('shopper')) {
            AchievementSystem.unlock('shopper');
        }
        AchievementSystem.check();

        // Particles on the canvas
        Particles.spawn(CANVAS_SIZE / 2, CANVAS_SIZE / 2, COLORS.accent, 20, 5, 1);

        this.renderShop();
    },

    equip(id) {
        if (!SaveData.unlockedSkins.includes(id)) return;
        SaveData.activeSkin = id;
        writeSave();
        Audio.equip();
        this.renderShop();
    },
};
