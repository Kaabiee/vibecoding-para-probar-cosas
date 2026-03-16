// ─── Renderer ────────────────────────────────────────────────────────────────

const Renderer = {
    canvas: null,
    ctx: null,

    init(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
    },

    clear() {
        const ctx = this.ctx;
        ctx.fillStyle = COLORS.bg;
        ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
    },

    drawGrid() {
        const ctx = this.ctx;
        ctx.strokeStyle = COLORS.gridLine;
        ctx.lineWidth = 0.5;
        for (let i = 0; i <= GRID_SIZE; i++) {
            const pos = i * CELL_SIZE;
            ctx.beginPath();
            ctx.moveTo(pos, 0);
            ctx.lineTo(pos, CANVAS_SIZE);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(0, pos);
            ctx.lineTo(CANVAS_SIZE, pos);
            ctx.stroke();
        }
    },

    drawSnake() {
        const ctx = this.ctx;
        const snake = GameState.snake;
        const skin = SKINS[SaveData.activeSkin];
        const [headColor, bodyColor, tailColor] = skin.colors;

        for (let i = snake.length - 1; i >= 0; i--) {
            const seg = snake[i];
            const x = seg.x * CELL_SIZE;
            const y = seg.y * CELL_SIZE;
            const pad = 1;

            let color;
            if (i === 0) color = headColor;
            else if (i === snake.length - 1) color = tailColor;
            else color = bodyColor;

            // Apply pattern
            if (skin.pattern === 'striped' && i > 0) {
                color = i % 2 === 0 ? headColor : bodyColor;
            } else if (skin.pattern === 'checkered' && i > 0) {
                color = (seg.x + seg.y) % 2 === 0 ? headColor : bodyColor;
            } else if (skin.pattern === 'dotted' && i > 0) {
                ctx.fillStyle = bodyColor;
                ctx.fillRect(x + pad, y + pad, CELL_SIZE - pad * 2, CELL_SIZE - pad * 2);
                if (i % 2 === 0) {
                    ctx.fillStyle = headColor;
                    ctx.beginPath();
                    ctx.arc(x + CELL_SIZE / 2, y + CELL_SIZE / 2, CELL_SIZE / 5, 0, Math.PI * 2);
                    ctx.fill();
                }
                continue;
            } else if (skin.pattern === 'gradient' && i > 0) {
                const t = i / (snake.length - 1);
                const r1 = parseInt(headColor.slice(1, 3), 16);
                const g1 = parseInt(headColor.slice(3, 5), 16);
                const b1 = parseInt(headColor.slice(5, 7), 16);
                const r2 = parseInt(tailColor.slice(1, 3), 16);
                const g2 = parseInt(tailColor.slice(3, 5), 16);
                const b2 = parseInt(tailColor.slice(5, 7), 16);
                const r = Math.round(lerp(r1, r2, t));
                const g = Math.round(lerp(g1, g2, t));
                const b = Math.round(lerp(b1, b2, t));
                color = `rgb(${r},${g},${b})`;
            }

            // Death animation: fade segments
            if (!GameState.isAlive) {
                const deathDelay = i * 0.03;
                const alpha = clamp(1 - (GameState.deathAnimation - deathDelay) * 2, 0, 1);
                ctx.globalAlpha = alpha;
            }

            ctx.fillStyle = color;
            const radius = 4;
            this.roundRect(x + pad, y + pad, CELL_SIZE - pad * 2, CELL_SIZE - pad * 2, radius);

            // Trail particles for solar skin
            if (skin.trail && i > 0 && i % 3 === 0 && GameState.isAlive && Math.random() < 0.3) {
                Particles.spawnTrail(
                    x + CELL_SIZE / 2,
                    y + CELL_SIZE / 2,
                    skin.colors[2]
                );
            }
        }
        ctx.globalAlpha = 1;

        // Draw eyes on head
        if (GameState.isAlive && snake.length > 0) {
            this.drawEyes(snake[0]);
        }
    },

    drawEyes(head) {
        const ctx = this.ctx;
        const cx = head.x * CELL_SIZE + CELL_SIZE / 2;
        const cy = head.y * CELL_SIZE + CELL_SIZE / 2;
        const dir = GameState.direction;

        const eyeOffset = 4;
        const eyeSize = 3;
        const pupilSize = 1.5;

        let e1x, e1y, e2x, e2y;
        if (dir.x === 1) { // right
            e1x = cx + 4; e1y = cy - eyeOffset;
            e2x = cx + 4; e2y = cy + eyeOffset;
        } else if (dir.x === -1) { // left
            e1x = cx - 4; e1y = cy - eyeOffset;
            e2x = cx - 4; e2y = cy + eyeOffset;
        } else if (dir.y === -1) { // up
            e1x = cx - eyeOffset; e1y = cy - 4;
            e2x = cx + eyeOffset; e2y = cy - 4;
        } else { // down
            e1x = cx - eyeOffset; e1y = cy + 4;
            e2x = cx + eyeOffset; e2y = cy + 4;
        }

        // White of eye
        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath(); ctx.arc(e1x, e1y, eyeSize, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(e2x, e2y, eyeSize, 0, Math.PI * 2); ctx.fill();

        // Pupil
        ctx.fillStyle = '#000000';
        ctx.beginPath(); ctx.arc(e1x + dir.x, e1y + dir.y, pupilSize, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(e2x + dir.x, e2y + dir.y, pupilSize, 0, Math.PI * 2); ctx.fill();
    },

    drawFood(time) {
        if (!GameState.food) return;
        const ctx = this.ctx;
        const food = GameState.food;
        const type = FOOD_TYPES[food.type];
        const cx = food.x * CELL_SIZE + CELL_SIZE / 2;
        const cy = food.y * CELL_SIZE + CELL_SIZE / 2;

        // Pulse animation
        const pulse = 1 + Math.sin(time * 4) * 0.1;
        const size = (CELL_SIZE / 2 - 2) * pulse;

        ctx.fillStyle = type.color;
        ctx.strokeStyle = type.color;
        ctx.lineWidth = 2;

        switch (type.shape) {
            case 'circle':
                ctx.beginPath();
                ctx.arc(cx, cy, size * 0.6, 0, Math.PI * 2);
                ctx.fill();
                break;
            case 'star':
                this.drawStar(cx, cy, size * 0.7, 5);
                break;
            case 'bolt':
                this.drawBolt(cx, cy, size * 0.7);
                break;
            case 'hourglass':
                this.drawHourglass(cx, cy, size * 0.6);
                break;
            case 'diamond':
                this.drawDiamond(cx, cy, size * 0.7);
                break;
        }

        // Glow
        ctx.shadowBlur = 8;
        ctx.shadowColor = type.color;
        ctx.beginPath();
        ctx.arc(cx, cy, 1, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
    },

    drawStar(cx, cy, r, points) {
        const ctx = this.ctx;
        ctx.beginPath();
        for (let i = 0; i < points * 2; i++) {
            const radius = i % 2 === 0 ? r : r * 0.4;
            const angle = (Math.PI * i) / points - Math.PI / 2;
            const x = cx + Math.cos(angle) * radius;
            const y = cy + Math.sin(angle) * radius;
            i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
        }
        ctx.closePath();
        ctx.fill();
    },

    drawBolt(cx, cy, s) {
        const ctx = this.ctx;
        ctx.beginPath();
        ctx.moveTo(cx - s * 0.2, cy - s);
        ctx.lineTo(cx + s * 0.5, cy - s);
        ctx.lineTo(cx + s * 0.1, cy - s * 0.1);
        ctx.lineTo(cx + s * 0.5, cy - s * 0.1);
        ctx.lineTo(cx - s * 0.3, cy + s);
        ctx.lineTo(cx - s * 0.1, cy + s * 0.1);
        ctx.lineTo(cx - s * 0.5, cy + s * 0.1);
        ctx.closePath();
        ctx.fill();
    },

    drawHourglass(cx, cy, s) {
        const ctx = this.ctx;
        ctx.beginPath();
        ctx.moveTo(cx - s, cy - s);
        ctx.lineTo(cx + s, cy - s);
        ctx.lineTo(cx, cy);
        ctx.lineTo(cx + s, cy + s);
        ctx.lineTo(cx - s, cy + s);
        ctx.lineTo(cx, cy);
        ctx.closePath();
        ctx.fill();
    },

    drawDiamond(cx, cy, s) {
        const ctx = this.ctx;
        ctx.beginPath();
        ctx.moveTo(cx, cy - s);
        ctx.lineTo(cx + s * 0.6, cy);
        ctx.lineTo(cx, cy + s);
        ctx.lineTo(cx - s * 0.6, cy);
        ctx.closePath();
        ctx.fill();
    },

    drawHUD() {
        const ctx = this.ctx;
        // Top bar
        ctx.fillStyle = COLORS.hudBg;
        ctx.fillRect(0, 0, CANVAS_SIZE, 32);

        ctx.font = 'bold 14px monospace';
        ctx.textBaseline = 'middle';

        // Score
        ctx.fillStyle = COLORS.text;
        ctx.textAlign = 'left';
        ctx.fillText(`SCORE: ${GameState.score}`, 10, 16);

        // Coins
        ctx.fillStyle = COLORS.accent;
        ctx.textAlign = 'center';
        ctx.fillText(`${GameState.coinsThisGame}`, CANVAS_SIZE / 2, 16);

        // High score
        ctx.fillStyle = COLORS.textSecondary;
        ctx.textAlign = 'right';
        ctx.fillText(`HI: ${SaveData.highScore}`, CANVAS_SIZE - 10, 16);

        // Active powerup
        if (GameState.activePowerup) {
            const pu = GameState.activePowerup;
            const info = POWERUP_EFFECTS[pu.type];
            const remaining = Math.max(0, (pu.endsAt - Date.now()) / 1000);
            ctx.fillStyle = info.color;
            ctx.textAlign = 'center';
            ctx.fillText(`${info.label} ${remaining.toFixed(1)}s`, CANVAS_SIZE / 2, 46);
        }
    },

    drawAchievementToast(time) {
        const toast = GameState.activeToast;
        if (!toast) return;

        const ctx = this.ctx;
        const elapsed = (time - toast.startTime);
        const duration = 2.5;

        if (elapsed > duration) {
            GameState.activeToast = null;
            return;
        }

        let alpha;
        if (elapsed < 0.3) alpha = elapsed / 0.3;
        else if (elapsed > duration - 0.5) alpha = (duration - elapsed) / 0.5;
        else alpha = 1;

        const y = CANVAS_SIZE - 60 - Math.sin(elapsed * 2) * 3;

        ctx.globalAlpha = alpha;
        ctx.fillStyle = 'rgba(0,0,0,0.85)';
        this.roundRect(CANVAS_SIZE / 2 - 130, y - 18, 260, 36, 8);
        ctx.fillStyle = COLORS.accent;
        ctx.font = 'bold 13px monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(`${toast.icon}  ${toast.name}`, CANVAS_SIZE / 2, y);
        ctx.globalAlpha = 1;
    },

    roundRect(x, y, w, h, r) {
        const ctx = this.ctx;
        ctx.beginPath();
        ctx.moveTo(x + r, y);
        ctx.lineTo(x + w - r, y);
        ctx.quadraticCurveTo(x + w, y, x + w, y + r);
        ctx.lineTo(x + w, y + h - r);
        ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
        ctx.lineTo(x + r, y + h);
        ctx.quadraticCurveTo(x, y + h, x, y + h - r);
        ctx.lineTo(x, y + r);
        ctx.quadraticCurveTo(x, y, x + r, y);
        ctx.closePath();
        ctx.fill();
    },

    drawMenuBackground(time) {
        this.clear();
        this.drawGrid();

        // Animated decorative snake
        const ctx = this.ctx;
        const segments = 12;
        ctx.globalAlpha = 0.15;
        for (let i = 0; i < segments; i++) {
            const t = time * 0.5 + i * 0.3;
            const x = CANVAS_SIZE / 2 + Math.sin(t) * 150;
            const y = CANVAS_SIZE / 2 + Math.cos(t * 0.7) * 100;
            ctx.fillStyle = COLORS.accent;
            ctx.beginPath();
            ctx.arc(x, y, CELL_SIZE / 2, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.globalAlpha = 1;
    },

    frame(time) {
        if (GameState.currentScreen === 'playing' || GameState.currentScreen === 'paused') {
            this.clear();
            this.drawGrid();
            this.drawFood(time);
            this.drawSnake();
            Particles.draw(this.ctx);
            this.drawHUD();
            this.drawAchievementToast(time);
        } else {
            this.drawMenuBackground(time);
            this.drawAchievementToast(time);
        }
    },
};
