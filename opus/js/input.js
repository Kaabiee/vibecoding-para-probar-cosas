// ─── Input Handler ───────────────────────────────────────────────────────────

const Input = {
    init() {
        document.addEventListener('keydown', (e) => this.onKeyDown(e));
    },

    onKeyDown(e) {
        // Pause toggle
        if (e.key === 'Escape') {
            e.preventDefault();
            if (GameState.currentScreen === 'playing') {
                GameState.isPaused = true;
                Screens.show('paused');
            } else if (GameState.currentScreen === 'paused') {
                GameState.isPaused = false;
                Screens.show('playing');
            }
            return;
        }

        // Direction input during gameplay
        if (GameState.currentScreen === 'playing' && GameState.isAlive && !GameState.isPaused) {
            let dir = null;
            switch (e.key) {
                case 'ArrowUp':    case 'w': case 'W': dir = DIRECTIONS.UP;    break;
                case 'ArrowDown':  case 's': case 'S': dir = DIRECTIONS.DOWN;  break;
                case 'ArrowLeft':  case 'a': case 'A': dir = DIRECTIONS.LEFT;  break;
                case 'ArrowRight': case 'd': case 'D': dir = DIRECTIONS.RIGHT; break;
            }
            if (dir) {
                e.preventDefault();
                this.queueDirection(dir);
            }
        }
    },

    queueDirection(dir) {
        const queue = GameState.directionQueue;
        // Max 2 in queue
        if (queue.length >= 2) return;

        // Get last queued direction or current
        const last = queue.length > 0 ? queue[queue.length - 1] : GameState.direction;

        // Prevent reverse and same direction
        if (dir.x + last.x === 0 && dir.y + last.y === 0) return;
        if (dir.x === last.x && dir.y === last.y) return;

        queue.push(dir);
    },
};
