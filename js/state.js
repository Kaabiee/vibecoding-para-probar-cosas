// ─── Game State ──────────────────────────────────────────────────────────────

const GameState = {
    // Current screen
    currentScreen: 'menu',
    previousScreen: null,

    // Snake
    snake: [],
    direction: DIRECTIONS.RIGHT,
    nextDirection: DIRECTIONS.RIGHT,
    directionQueue: [],

    // Food
    food: null,

    // Score
    score: 0,
    coinsThisGame: 0,
    foodEatenThisGame: 0,

    // Timing
    moveTimer: 0,
    currentSpeed: 10, // ticks per second

    // Powerups
    activePowerup: null,    // { type, endsAt }

    // Game flags
    isAlive: false,
    isPaused: false,
    gameStarted: false,

    // Animation
    lastTimestamp: 0,
    deathAnimation: 0,

    // Achievement toast queue
    toastQueue: [],
    activeToast: null,

    reset() {
        const diff = DIFFICULTY[SaveData.settings.difficulty];
        this.snake = [
            { x: 5, y: 10 },
            { x: 4, y: 10 },
            { x: 3, y: 10 },
        ];
        this.direction = DIRECTIONS.RIGHT;
        this.nextDirection = DIRECTIONS.RIGHT;
        this.directionQueue = [];
        this.food = null;
        this.score = 0;
        this.coinsThisGame = 0;
        this.foodEatenThisGame = 0;
        this.moveTimer = 0;
        this.currentSpeed = diff.baseSpeed;
        this.activePowerup = null;
        this.isAlive = true;
        this.isPaused = false;
        this.gameStarted = true;
        this.deathAnimation = 0;
    },
};
