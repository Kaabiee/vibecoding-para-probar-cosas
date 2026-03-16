// ─── Game Logic ──────────────────────────────────────────────────────────────

const Game = {
    spawnFood() {
        // Pick type by weight
        const types = Object.entries(FOOD_TYPES).map(([id, f]) => ({ id, weight: f.weight }));
        const chosen = weightedRandom(types);

        let pos;
        let attempts = 0;
        do {
            pos = { x: randomInt(0, GRID_SIZE - 1), y: randomInt(1, GRID_SIZE - 1) }; // y>=1 to avoid HUD
            attempts++;
        } while (posInArray(pos, GameState.snake) && attempts < 100);

        GameState.food = { x: pos.x, y: pos.y, type: chosen.id };
    },

    tick() {
        if (!GameState.isAlive || GameState.isPaused) return;

        // Process direction queue
        if (GameState.directionQueue.length > 0) {
            const next = GameState.directionQueue.shift();
            // Final safety check
            if (!(next.x + GameState.direction.x === 0 && next.y + GameState.direction.y === 0)) {
                GameState.direction = next;
            }
        }

        const head = GameState.snake[0];
        const newHead = {
            x: head.x + GameState.direction.x,
            y: head.y + GameState.direction.y,
        };

        // Wall collision
        if (newHead.x < 0 || newHead.x >= GRID_SIZE || newHead.y < 0 || newHead.y >= GRID_SIZE) {
            this.die();
            return;
        }

        // Self collision
        if (posInArray(newHead, GameState.snake)) {
            this.die();
            return;
        }

        GameState.snake.unshift(newHead);

        // Food collision
        if (GameState.food && posEqual(newHead, GameState.food)) {
            this.eatFood();
        } else {
            GameState.snake.pop();
        }

        // Check powerup expiry
        if (GameState.activePowerup && Date.now() > GameState.activePowerup.endsAt) {
            GameState.activePowerup = null;
            // Restore speed
            const diff = DIFFICULTY[SaveData.settings.difficulty];
            GameState.currentSpeed = diff.baseSpeed + diff.speedIncrement * (GameState.snake.length - 3);
            GameState.currentSpeed = Math.min(GameState.currentSpeed, diff.maxSpeed);
        }

        AchievementSystem.check();
    },

    eatFood() {
        const food = GameState.food;
        const type = FOOD_TYPES[food.type];

        // Score & coins
        GameState.score += type.points;
        let coinGain = type.coins;
        if (GameState.activePowerup && GameState.activePowerup.type === 'magnet') {
            coinGain *= 2;
        }
        GameState.coinsThisGame += coinGain;
        GameState.foodEatenThisGame++;

        // Stats
        SaveData.stats.totalFoodEaten++;

        // Speed increase
        const diff = DIFFICULTY[SaveData.settings.difficulty];
        GameState.currentSpeed = diff.baseSpeed + diff.speedIncrement * (GameState.snake.length - 3);
        GameState.currentSpeed = Math.min(GameState.currentSpeed, diff.maxSpeed);

        // Apply powerup effect
        if (type.effect) {
            const info = POWERUP_EFFECTS[type.effect];
            GameState.activePowerup = {
                type: type.effect,
                endsAt: Date.now() + type.duration,
            };
            if (type.effect === 'speed' || type.effect === 'slow') {
                GameState.currentSpeed *= info.speedMul;
            }
            Audio.powerup();
        }

        // Particles
        const cx = food.x * CELL_SIZE + CELL_SIZE / 2;
        const cy = food.y * CELL_SIZE + CELL_SIZE / 2;
        Particles.spawn(cx, cy, type.color, 10, 4, 0.5);

        // Sound
        if (food.type === 'bonus') {
            Audio.eatBonus();
        } else {
            Audio.eat();
        }

        // Spawn new food
        this.spawnFood();
    },

    die() {
        GameState.isAlive = false;
        Audio.gameOver();

        // Death particles
        const head = GameState.snake[0];
        Particles.spawn(
            head.x * CELL_SIZE + CELL_SIZE / 2,
            head.y * CELL_SIZE + CELL_SIZE / 2,
            SKINS[SaveData.activeSkin].colors[0],
            25, 6, 1
        );

        // Update stats
        SaveData.stats.totalGamesPlayed++;
        SaveData.coins += GameState.coinsThisGame;
        SaveData.stats.totalCoinsEarned += GameState.coinsThisGame;
        if (GameState.snake.length > SaveData.stats.longestSnake) {
            SaveData.stats.longestSnake = GameState.snake.length;
        }
        const isNewHigh = GameState.score > SaveData.highScore;
        if (isNewHigh) {
            SaveData.highScore = GameState.score;
        }
        writeSave();

        AchievementSystem.check();

        // Show game over after death animation
        setTimeout(() => {
            Screens.showResults(isNewHigh);
        }, 1200);
    },

    start() {
        GameState.reset();
        this.spawnFood();
        Particles.clear();
        Screens.show('playing');
    },

    update(dt) {
        if (GameState.currentScreen !== 'playing' || !GameState.isAlive || GameState.isPaused) {
            // Death animation
            if (!GameState.isAlive && GameState.currentScreen === 'playing') {
                GameState.deathAnimation += dt;
            }
            return;
        }

        // Fixed timestep movement
        let effectiveSpeed = GameState.currentSpeed;
        GameState.moveTimer += dt;
        const interval = 1 / effectiveSpeed;

        if (GameState.moveTimer >= interval) {
            GameState.moveTimer -= interval;
            // Prevent spiral: cap accumulated time
            if (GameState.moveTimer > interval) GameState.moveTimer = 0;
            this.tick();
        }
    },
};
