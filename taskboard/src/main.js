(function () {
  const root = document.getElementById("app-root");
  const dialog = document.getElementById("dialog-root");

  if (!root || !dialog || !window.LumbreApp) {
    throw new Error("No se pudo iniciar Nido.");
  }

  new window.LumbreApp({
    root,
    dialog,
  });
})();
