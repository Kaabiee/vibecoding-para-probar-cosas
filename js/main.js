// ─── Main Entry Point ────────────────────────────────────────────────────────

(function () {
    // Init persistence
    loadSave();

    // Init canvas
    const canvas = document.getElementById('game-canvas');
    canvas.width = CANVAS_SIZE;
    canvas.height = CANVAS_SIZE;
    Renderer.init(canvas);

    // Init input
    Input.init();

    // Init screens
    Screens.init();
    Screens.show('menu');

    // Init audio on first interaction
    document.addEventListener('click', () => initAudio(), { once: true });
    document.addEventListener('keydown', () => initAudio(), { once: true });

    // Main loop
    let lastTime = 0;

    function loop(timestamp) {
        const dt = Math.min((timestamp - lastTime) / 1000, 0.2); // cap at 200ms
        lastTime = timestamp;

        Game.update(dt);
        Particles.update(dt);
        Renderer.frame(timestamp / 1000);

        requestAnimationFrame(loop);
    }

    requestAnimationFrame((timestamp) => {
        lastTime = timestamp;
        requestAnimationFrame(loop);
    });
})();
