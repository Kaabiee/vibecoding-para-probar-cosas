(function () {
  const APP_TITLE = "Nido";
  const STORAGE_VERSION = 2;
  const STORAGE_KEY = "lumbre-workspace-v2";
  const LEGACY_STORAGE_KEYS = ["kanban-trello-clone-v1"];
  const DEFAULT_PRIORITY = "medium";

  const PRIORITIES = {
    urgent: {
      id: "urgent",
      label: "Urgente",
    },
    low: {
      id: "low",
      label: "Baja",
    },
    medium: {
      id: "medium",
      label: "Media",
    },
    high: {
      id: "high",
      label: "Alta",
    },
  };

  const BACKGROUND_PRESETS = [
    {
      id: "andes-dawn",
      name: "Amanecer andino",
      category: "Paisajes",
      image:
        "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1600&q=80",
    },
    {
      id: "forest-lake",
      name: "Lago en bosque",
      category: "Paisajes",
      image:
        "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1600&q=80",
    },
    {
      id: "earth-orbit",
      name: "Tierra orbital",
      category: "Tierra",
      image:
        "https://images.unsplash.com/photo-1446776653964-20c1d3a81b06?auto=format&fit=crop&w=1600&q=80",
    },
    {
      id: "blue-marble",
      name: "Azul profundo",
      category: "Tierra",
      image:
        "https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=1600&q=80",
    },
    {
      id: "tokyo-night",
      name: "Ciudad nocturna",
      category: "Ciudades",
      image:
        "https://images.unsplash.com/photo-1508050919630-b135583b29ab?auto=format&fit=crop&w=1600&q=80",
    },
    {
      id: "urban-glow",
      name: "Calles encendidas",
      category: "Ciudades",
      image:
        "https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?auto=format&fit=crop&w=1600&q=80",
    },
    {
      id: "cat-lounge",
      name: "Gato sereno",
      category: "Animales",
      image:
        "https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?auto=format&fit=crop&w=1600&q=80",
    },
    {
      id: "dog-sun",
      name: "Perro al sol",
      category: "Animales",
      image:
        "https://images.unsplash.com/photo-1517849845537-4d257902454a?auto=format&fit=crop&w=1600&q=80",
    },
    {
      id: "fox-glance",
      name: "Mirada salvaje",
      category: "Animales",
      image:
        "https://images.unsplash.com/photo-1474511320723-9a56873867b5?auto=format&fit=crop&w=1600&q=80",
    },
    {
      id: "whale-sea",
      name: "Oceano vivo",
      category: "Animales",
      image:
        "https://images.unsplash.com/photo-1535591273668-578e31182c4f?auto=format&fit=crop&w=1600&q=80",
    },
    {
      id: "desert-wind",
      name: "Dunas doradas",
      category: "Paisajes",
      image:
        "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1600&q=80",
    },
    {
      id: "northern-sky",
      name: "Cielo aurora",
      category: "Paisajes",
      image:
        "https://images.unsplash.com/photo-1483347756197-71ef80e95f73?auto=format&fit=crop&w=1600&q=80",
    },
    {
      id: "city-rain",
      name: "Lluvia urbana",
      category: "Ciudades",
      image:
        "https://images.unsplash.com/photo-1519501025264-65ba15a82390?auto=format&fit=crop&w=1600&q=80",
    },
    {
      id: "coast-drive",
      name: "Costa abierta",
      category: "Paisajes",
      image:
        "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1600&q=80",
    },
    {
      id: "moon-dust",
      name: "Polvo lunar",
      category: "Tierra",
      image:
        "https://images.unsplash.com/photo-1446776653964-20c1d3a81b06?auto=format&fit=crop&w=1600&q=80",
    },
    {
      id: "cat-window",
      name: "Gato en ventana",
      category: "Animales",
      image:
        "https://images.unsplash.com/photo-1519052537078-e6302a4968d4?auto=format&fit=crop&w=1600&q=80",
    },
    {
      id: "dog-run",
      name: "Perro en movimiento",
      category: "Animales",
      image:
        "https://images.unsplash.com/photo-1518717758536-85ae29035b6d?auto=format&fit=crop&w=1600&q=80",
    },
    {
      id: "alpine-mist",
      name: "Bruma alpina",
      category: "Paisajes",
      image:
        "https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&w=1600&q=80",
    },
    {
      id: "sunset-cliffs",
      name: "Acantilados al atardecer",
      category: "Paisajes",
      image:
        "https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&w=1600&q=80",
    },
    {
      id: "glacier-light",
      name: "Luz glaciar",
      category: "Paisajes",
      image:
        "https://images.unsplash.com/photo-1482192596544-9eb780fc7f66?auto=format&fit=crop&w=1600&q=80",
    },
    {
      id: "nebula-wave",
      name: "Nebulosa suave",
      category: "Tierra",
      image:
        "https://images.unsplash.com/photo-1462331940025-496dfbfc7564?auto=format&fit=crop&w=1600&q=80",
    },
    {
      id: "planet-shadow",
      name: "Planeta en sombra",
      category: "Tierra",
      image:
        "https://images.unsplash.com/photo-1465101046530-73398c7f28ca?auto=format&fit=crop&w=1600&q=80",
    },
    {
      id: "night-grid",
      name: "Ciudad electrica",
      category: "Ciudades",
      image:
        "https://images.unsplash.com/photo-1493246507139-91e8fad9978e?auto=format&fit=crop&w=1600&q=80",
    },
    {
      id: "europe-street",
      name: "Calle europea",
      category: "Ciudades",
      image:
        "https://images.unsplash.com/photo-1494526585095-c41746248156?auto=format&fit=crop&w=1600&q=80",
    },
    {
      id: "metro-glass",
      name: "Cristal metropolitano",
      category: "Ciudades",
      image:
        "https://images.unsplash.com/photo-1499092346589-b9b6be3e94b2?auto=format&fit=crop&w=1600&q=80",
    },
    {
      id: "tiger-rest",
      name: "Tigre en calma",
      category: "Animales",
      image:
        "https://images.unsplash.com/photo-1549366021-9f761d450615?auto=format&fit=crop&w=1600&q=80",
    },
    {
      id: "horse-field",
      name: "Caballo libre",
      category: "Animales",
      image:
        "https://images.unsplash.com/photo-1501706362039-c6e80948bbd3?auto=format&fit=crop&w=1600&q=80",
    },
    {
      id: "panda-bamboo",
      name: "Panda entre bambu",
      category: "Animales",
      image:
        "https://images.unsplash.com/photo-1564349683136-77e08dba1ef7?auto=format&fit=crop&w=1600&q=80",
    },
  ];

  const DEFAULT_APPEARANCE = {
    theme: "light",
    backgroundMode: "preset",
    backgroundColor: "#faf9f5",
    backgroundPresetId: "andes-dawn",
    uploadedImage: "",
    uploadedImageName: "",
  };

  const DEMO_BOARDS = [
    {
      name: "Estudio creativo",
      columns: [
        {
          title: "Por hacer",
          cards: [
            {
              title: "Definir portada de campaña",
              description: "Explorar una direccion visual calida, editorial y con foco en conversion.",
              priority: "high",
            },
            {
              title: "Escribir mensajes clave",
              description: "Preparar hero, prueba social y beneficios para la landing principal.",
              priority: "medium",
            },
          ],
        },
        {
          title: "En marcha",
          cards: [
            {
              title: "Cerrar estructura del sitio",
              description: "Ordenar secciones, llamadas a la accion y ritmo de lectura mobile.",
              priority: "high",
            },
          ],
        },
        {
          title: "Listo",
          cards: [
            {
              title: "Comprar dominio",
              description: "Dominio activo y conectado al entorno de publicacion.",
              priority: "low",
            },
          ],
        },
      ],
    },
    {
      name: "Semana personal",
      columns: [
        {
          title: "Ideas",
          cards: [
            {
              title: "Separar tareas por energia",
              description: "Dividir pendientes entre rapido, profundo y rutinario para priorizar mejor.",
              priority: "medium",
            },
          ],
        },
        {
          title: "Hoy",
          cards: [
            {
              title: "Pagar servicios",
              description: "Liquidar internet, luz y tarjeta antes del final de la tarde.",
              priority: "high",
            },
          ],
        },
        {
          title: "Hecho",
          cards: [
            {
              title: "Lista de compras",
              description: "Compra base completada para toda la semana.",
              priority: "low",
            },
          ],
        },
      ],
    },
  ];

  const TEMPLATE_PRESETS = [
    {
      name: "Sprint semanal",
      description: "Ideal para organizar una semana de trabajo con foco claro.",
      columns: [
        { title: "Backlog", cards: [] },
        { title: "En progreso", cards: [] },
        { title: "Revision", cards: [] },
        { title: "Completado", cards: [] },
      ],
    },
    {
      name: "Contenido social",
      description: "Planea, produce y publica piezas para redes.",
      columns: [
        { title: "Ideas", cards: [] },
        { title: "Guion", cards: [] },
        { title: "Diseño", cards: [] },
        { title: "Publicado", cards: [] },
      ],
    },
    {
      name: "Proyecto personal",
      description: "Base flexible para tareas personales y seguimiento general.",
      columns: [
        { title: "Pendiente", cards: [] },
        { title: "Hoy", cards: [] },
        { title: "Esperando", cards: [] },
        { title: "Hecho", cards: [] },
      ],
    },
    {
      name: "Estudio y tareas",
      description: "Organiza materias, entregas y pendientes de escuela.",
      columns: [
        { title: "Por estudiar", cards: [] },
        { title: "Tareas", cards: [] },
        { title: "Entregar esta semana", cards: [] },
        { title: "Completado", cards: [] },
      ],
    },
    {
      name: "Lanzamiento de producto",
      description: "Para coordinar idea, construccion, pruebas y salida publica.",
      columns: [
        { title: "Idea", cards: [] },
        { title: "Construccion", cards: [] },
        { title: "QA", cards: [] },
        { title: "Lanzado", cards: [] },
      ],
    },
    {
      name: "Calendario editorial",
      description: "Sirve para blogs, newsletters, videos o contenido largo.",
      columns: [
        { title: "Temas", cards: [] },
        { title: "Investigacion", cards: [] },
        { title: "Redaccion", cards: [] },
        { title: "Publicado", cards: [] },
      ],
    },
    {
      name: "Evento o viaje",
      description: "Checklist simple para planear un evento, salida o viaje.",
      columns: [
        { title: "Por reservar", cards: [] },
        { title: "Preparando", cards: [] },
        { title: "Confirmado", cards: [] },
        { title: "Listo", cards: [] },
      ],
    },
    {
      name: "Habitos semanales",
      description: "Tablero ligero para seguimiento de rutinas y constancia.",
      columns: [
        { title: "Quiero mantener", cards: [] },
        { title: "Hoy", cards: [] },
        { title: "En racha", cards: [] },
        { title: "Cumplido", cards: [] },
      ],
    },
    {
      name: "Roadmap de app",
      description: "Pensada para producto, mejoras y backlog tecnico.",
      columns: [
        { title: "Ideas", cards: [] },
        { title: "Proximo", cards: [] },
        { title: "En desarrollo", cards: [] },
        { title: "Hecho", cards: [] },
      ],
    },
    {
      name: "Proceso de contratacion",
      description: "Ayuda a seguir candidatos y etapas de entrevistas.",
      columns: [
        { title: "Aplicaron", cards: [] },
        { title: "Filtro inicial", cards: [] },
        { title: "Entrevista", cards: [] },
        { title: "Finalistas", cards: [] },
      ],
    },
    {
      name: "Ventas y clientes",
      description: "Seguimiento simple de prospectos y cierres.",
      columns: [
        { title: "Prospectos", cards: [] },
        { title: "Contacto hecho", cards: [] },
        { title: "Propuesta enviada", cards: [] },
        { title: "Cerrado", cards: [] },
      ],
    },
  ];

  window.LumbreConfig = {
    APP_TITLE,
    STORAGE_VERSION,
    STORAGE_KEY,
    LEGACY_STORAGE_KEYS,
    DEFAULT_PRIORITY,
    PRIORITIES,
    BACKGROUND_PRESETS,
    TEMPLATE_PRESETS,
    DEFAULT_APPEARANCE,
    DEMO_BOARDS,
  };
})();
