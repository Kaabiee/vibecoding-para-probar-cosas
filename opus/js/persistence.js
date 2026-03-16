// ─── Persistence (localStorage) ──────────────────────────────────────────────

const SAVE_KEY = 'snakeArcade_v1';

const DEFAULT_SAVE = {
    version: 1,
    coins: 0,
    highScore: 0,
    activeSkin: 'classic',
    unlockedSkins: ['classic'],
    achievements: [],
    settings: {
        soundEnabled: true,
        difficulty: 'normal',
    },
    stats: {
        totalFoodEaten: 0,
        totalGamesPlayed: 0,
        totalCoinsEarned: 0,
        longestSnake: 3,
    },
};

let SaveData = null;

function loadSave() {
    try {
        const raw = localStorage.getItem(SAVE_KEY);
        if (raw) {
            const parsed = JSON.parse(raw);
            // Merge with defaults in case new fields were added
            SaveData = { ...structuredClone(DEFAULT_SAVE), ...parsed };
            SaveData.settings = { ...DEFAULT_SAVE.settings, ...parsed.settings };
            SaveData.stats = { ...DEFAULT_SAVE.stats, ...parsed.stats };
        } else {
            SaveData = structuredClone(DEFAULT_SAVE);
        }
    } catch (e) {
        console.warn('Failed to load save, resetting:', e);
        SaveData = structuredClone(DEFAULT_SAVE);
    }
}

function writeSave() {
    try {
        localStorage.setItem(SAVE_KEY, JSON.stringify(SaveData));
    } catch (e) {
        console.warn('Failed to save:', e);
    }
}

function resetSave() {
    SaveData = structuredClone(DEFAULT_SAVE);
    writeSave();
}
