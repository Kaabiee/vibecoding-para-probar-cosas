// ─── Screen Manager ──────────────────────────────────────────────────────────

const Screens = {
    init() {
        // Menu buttons
        this.bind('btn-play', () => Game.start());
        this.bind('btn-settings', () => this.show('settings'));
        this.bind('btn-shop', () => { Shop.renderShop(); this.show('shop'); });
        this.bind('btn-skins', () => { Shop.renderSkins(); this.show('skins'); });
        this.bind('btn-achievements', () => { this.renderAchievements(); this.show('achievements'); });

        // Pause
        this.bind('btn-resume', () => { GameState.isPaused = false; this.show('playing'); });
        this.bind('btn-quit', () => { GameState.isAlive = false; this.show('menu'); });

        // Results
        this.bind('btn-play-again', () => Game.start());
        this.bind('btn-to-menu', () => this.show('menu'));

        // Settings
        this.bind('btn-back-settings', () => this.show('menu'));
        this.bind('btn-back-shop', () => this.show('menu'));
        this.bind('btn-back-skins', () => this.show('menu'));
        this.bind('btn-back-achievements', () => this.show('menu'));

        // Sound toggle
        const soundBtn = document.getElementById('btn-sound');
        if (soundBtn) {
            soundBtn.addEventListener('click', () => {
                SaveData.settings.soundEnabled = !SaveData.settings.soundEnabled;
                writeSave();
                this.updateSettingsUI();
                Audio.menuTick();
            });
        }

        // Difficulty
        const diffBtn = document.getElementById('btn-difficulty');
        if (diffBtn) {
            diffBtn.addEventListener('click', () => {
                const keys = Object.keys(DIFFICULTY);
                const idx = keys.indexOf(SaveData.settings.difficulty);
                SaveData.settings.difficulty = keys[(idx + 1) % keys.length];
                writeSave();
                this.updateSettingsUI();
                Audio.menuTick();
            });
        }

        // Reset
        const resetBtn = document.getElementById('btn-reset');
        if (resetBtn) {
            resetBtn.addEventListener('click', () => {
                if (confirm('Reset all progress? This cannot be undone.')) {
                    resetSave();
                    this.updateSettingsUI();
                    Audio.menuTick();
                }
            });
        }

        this.updateSettingsUI();
    },

    bind(id, fn) {
        const el = document.getElementById(id);
        if (el) el.addEventListener('click', () => { Audio.menuTick(); fn(); });
    },

    show(name) {
        document.querySelectorAll('.screen').forEach(s => {
            if (s.classList.contains('active')) {
                s.classList.remove('active');
                s.classList.add('screen-exit');
                setTimeout(() => s.classList.remove('screen-exit'), 200);
            }
        });

        GameState.previousScreen = GameState.currentScreen;
        GameState.currentScreen = name;

        const screen = document.getElementById('screen-' + name);
        if (screen) {
            setTimeout(() => {
                screen.classList.add('active', 'screen-enter');
                setTimeout(() => screen.classList.remove('screen-enter'), 200);
            }, 10);
        }
    },

    showResults(isNewHigh) {
        document.getElementById('result-score').textContent = GameState.score;
        document.getElementById('result-coins').textContent = '+' + GameState.coinsThisGame;
        document.getElementById('result-length').textContent = GameState.snake.length;
        document.getElementById('result-food').textContent = GameState.foodEatenThisGame;

        const highEl = document.getElementById('result-high');
        if (isNewHigh) {
            highEl.textContent = 'NEW HIGH SCORE!';
            highEl.style.color = COLORS.accent;
        } else {
            highEl.textContent = 'High Score: ' + SaveData.highScore;
            highEl.style.color = COLORS.textSecondary;
        }

        this.show('results');
    },

    updateSettingsUI() {
        const soundBtn = document.getElementById('btn-sound');
        if (soundBtn) soundBtn.textContent = 'Sound: ' + (SaveData.settings.soundEnabled ? 'ON' : 'OFF');

        const diffBtn = document.getElementById('btn-difficulty');
        if (diffBtn) diffBtn.textContent = 'Difficulty: ' + DIFFICULTY[SaveData.settings.difficulty].label;
    },

    renderAchievements() {
        const grid = document.getElementById('achievements-grid');
        grid.innerHTML = '';

        Object.entries(ACHIEVEMENTS).forEach(([id, ach]) => {
            const unlocked = SaveData.achievements.includes(id);
            const card = document.createElement('div');
            card.className = 'achievement-card' + (unlocked ? ' unlocked' : '');
            card.innerHTML = `
                <div class="achievement-icon">${unlocked ? ach.icon : '🔒'}</div>
                <div class="achievement-info">
                    <div class="achievement-name">${ach.name}</div>
                    <div class="achievement-desc">${ach.desc}</div>
                </div>
            `;
            grid.appendChild(card);
        });
    },
};
