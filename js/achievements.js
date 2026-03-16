// ─── Achievements ────────────────────────────────────────────────────────────

const AchievementSystem = {
    unlock(id) {
        if (SaveData.achievements.includes(id)) return;
        SaveData.achievements.push(id);
        writeSave();

        const ach = ACHIEVEMENTS[id];
        GameState.toastQueue.push({
            name: ach.name,
            icon: ach.icon,
        });
        Audio.achievement();
        this.processToastQueue();
    },

    processToastQueue() {
        if (GameState.activeToast || GameState.toastQueue.length === 0) return;
        const toast = GameState.toastQueue.shift();
        toast.startTime = performance.now() / 1000;
        GameState.activeToast = toast;
        setTimeout(() => this.processToastQueue(), 3000);
    },

    check() {
        const stats = SaveData.stats;

        if (stats.totalFoodEaten >= 1) this.unlock('first_bite');
        if (stats.totalFoodEaten >= 50) this.unlock('hungry');
        if (stats.totalFoodEaten >= 200) this.unlock('glutton');

        if (GameState.score >= 50) this.unlock('score_50');
        if (GameState.score >= 100) this.unlock('score_100');
        if (GameState.score >= 200) this.unlock('score_200');

        if (SaveData.coins >= 100) this.unlock('rich');

        if (SaveData.unlockedSkins.length >= 5) this.unlock('collector');
        if (SaveData.unlockedSkins.length >= SKIN_ORDER.length) this.unlock('fashionista');

        if (GameState.snake.length >= 20) this.unlock('survivor');
        if (stats.totalGamesPlayed >= 25) this.unlock('veteran');
    },
};
