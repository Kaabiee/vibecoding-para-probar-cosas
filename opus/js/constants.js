// ─── Configuration & Constants ───────────────────────────────────────────────

const GRID_SIZE = 20;
const CANVAS_SIZE = 600;
const CELL_SIZE = CANVAS_SIZE / GRID_SIZE;

const COLORS = {
    bg: '#0A0A0A',
    bgGrid: '#111111',
    gridLine: '#1A1A1A',
    text: '#FFFFFF',
    textSecondary: '#AAAAAA',
    accent: '#FFD700',
    accentDark: '#B8860B',
    danger: '#FF4444',
    success: '#44FF44',
    hudBg: 'rgba(0,0,0,0.7)',
};

const DIFFICULTY = {
    easy:   { label: 'Easy',   baseSpeed: 7,  speedIncrement: 0.15, maxSpeed: 12 },
    normal: { label: 'Normal', baseSpeed: 10, speedIncrement: 0.25, maxSpeed: 18 },
    hard:   { label: 'Hard',   baseSpeed: 14, speedIncrement: 0.35, maxSpeed: 24 },
};

const DIRECTIONS = {
    UP:    { x: 0, y: -1 },
    DOWN:  { x: 0, y: 1 },
    LEFT:  { x: -1, y: 0 },
    RIGHT: { x: 1, y: 0 },
};

const SKINS = {
    classic:   { name: 'Classic Gold',    price: 0,   colors: ['#FFD700','#DAA520','#B8860B'],   pattern: 'solid' },
    ivory:     { name: 'Ivory Serpent',    price: 50,  colors: ['#FFFFF0','#F5F5DC','#D4C5A9'],   pattern: 'solid' },
    obsidian:  { name: 'Obsidian',         price: 75,  colors: ['#2C2C2C','#1A1A1A','#0D0D0D'],   pattern: 'solid' },
    amber:     { name: 'Amber Wave',       price: 100, colors: ['#FFBF00','#FF8C00','#CC5500'],   pattern: 'gradient' },
    phantom:   { name: 'Phantom',          price: 150, colors: ['#C0C0C0','#808080','#505050'],   pattern: 'striped' },
    honeycomb: { name: 'Honeycomb',        price: 200, colors: ['#FFD700','#FFA500','#CC8400'],   pattern: 'checkered' },
    arctic:    { name: 'Arctic Frost',     price: 250, colors: ['#E0FFFF','#B0E0E6','#87CEEB'],   pattern: 'dotted' },
    eclipse:   { name: 'Eclipse',          price: 350, colors: ['#FFD700','#1A1A1A','#FFD700'],   pattern: 'striped' },
    royal:     { name: 'Royal Python',     price: 500, colors: ['#FFD700','#4B0082','#FFD700'],   pattern: 'checkered' },
    solar:     { name: 'Solar Flare',      price: 750, colors: ['#FFF8DC','#FFD700','#FF6347'],   pattern: 'gradient', trail: true },
};

const SKIN_ORDER = ['classic','ivory','obsidian','amber','phantom','honeycomb','arctic','eclipse','royal','solar'];

const FOOD_TYPES = {
    normal: { color: '#FFFFFF', shape: 'circle',    points: 10, coins: 1, weight: 70, effect: null },
    bonus:  { color: '#FFD700', shape: 'star',      points: 30, coins: 3, weight: 15, effect: null },
    speed:  { color: '#FF4444', shape: 'bolt',      points: 10, coins: 1, weight: 8,  effect: 'speed',  duration: 5000 },
    slow:   { color: '#4488FF', shape: 'hourglass', points: 10, coins: 1, weight: 5,  effect: 'slow',   duration: 5000 },
    magnet: { color: '#FF44FF', shape: 'diamond',   points: 10, coins: 2, weight: 2,  effect: 'magnet', duration: 8000 },
};

const ACHIEVEMENTS = {
    first_bite:  { name: 'First Bite',    desc: 'Eat your first food',        icon: '🍎' },
    hungry:      { name: 'Hungry',        desc: 'Eat 50 food total',          icon: '🍔' },
    glutton:     { name: 'Glutton',       desc: 'Eat 200 food total',         icon: '🍕' },
    score_50:    { name: 'Half Century',  desc: 'Score 50 in one game',       icon: '⭐' },
    score_100:   { name: 'Century',       desc: 'Score 100 in one game',      icon: '🌟' },
    score_200:   { name: 'Double Century',desc: 'Score 200 in one game',      icon: '💫' },
    rich:        { name: 'Rich Snake',    desc: 'Accumulate 100 coins',       icon: '💰' },
    shopper:     { name: 'Shopper',       desc: 'Buy your first skin',        icon: '🛒' },
    collector:   { name: 'Collector',     desc: 'Own 5 skins',               icon: '🎨' },
    fashionista: { name: 'Fashionista',   desc: 'Own all skins',             icon: '👑' },
    survivor:    { name: 'Survivor',      desc: 'Reach length 20',           icon: '🐍' },
    veteran:     { name: 'Veteran',       desc: 'Play 25 games',             icon: '🎮' },
};

const POWERUP_EFFECTS = {
    speed:  { speedMul: 1.5, label: 'SPEED!',  color: '#FF4444' },
    slow:   { speedMul: 0.6, label: 'SLOW MO', color: '#4488FF' },
    magnet: { speedMul: 1.0, label: '2X COINS', color: '#FF44FF' },
};
