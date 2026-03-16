// ─── Utility Functions ───────────────────────────────────────────────────────

function randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function clamp(val, min, max) {
    return Math.max(min, Math.min(max, val));
}

function lerp(a, b, t) {
    return a + (b - a) * t;
}

function weightedRandom(items) {
    const total = items.reduce((sum, item) => sum + item.weight, 0);
    let r = Math.random() * total;
    for (const item of items) {
        r -= item.weight;
        if (r <= 0) return item;
    }
    return items[items.length - 1];
}

function easeOutQuad(t) {
    return t * (2 - t);
}

function easeInOutCubic(t) {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

function posEqual(a, b) {
    return a.x === b.x && a.y === b.y;
}

function posInArray(pos, arr) {
    return arr.some(p => p.x === pos.x && p.y === pos.y);
}

function formatNumber(n) {
    return n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}
