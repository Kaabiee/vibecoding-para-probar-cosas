const STORAGE_KEY = 'flowboard_v1';

const DEFAULT_COLUMNS = [
    { name: 'Por Hacer' },
    { name: 'En Progreso' },
    { name: 'Hecho' }
];

const MAX_BOARDS = 20;
const MAX_COLUMNS = 12;
const MAX_CARDS = 100;

const PRESET_COLORS = [
    '#1a1a1a', '#2d2d2d', '#1e293b', '#1a2332',
    '#1c1917', '#1f2937', '#f5f5f4', '#fafaf9',
    '#e7e5e4', '#dbeafe', '#fce7f3', '#d1fae5',
    '#fef3c7', '#ede9fe', '#e0e7ff', '#cffafe',
    '#fee2e2', '#f0fdf4'
];

const BOARD_TEMPLATES = [
    {
        name: 'Proyecto basico',
        icon: '\u{1F4CB}',
        description: 'Por Hacer, En Progreso, Hecho',
        columns: [
            { name: 'Por Hacer', cards: [] },
            { name: 'En Progreso', cards: [] },
            { name: 'Hecho', cards: [] }
        ]
    },
    {
        name: 'Desarrollo de software',
        icon: '\u{1F4BB}',
        description: 'Backlog, Desarrollo, Review, QA, Deploy',
        columns: [
            { name: 'Backlog', cards: [] },
            { name: 'En desarrollo', cards: [] },
            { name: 'Code Review', cards: [] },
            { name: 'QA / Testing', cards: [] },
            { name: 'Desplegado', cards: [] }
        ]
    },
    {
        name: 'Marketing',
        icon: '\u{1F4E2}',
        description: 'Ideas, Planificacion, Creacion, Publicado',
        columns: [
            { name: 'Ideas', cards: [] },
            { name: 'Planificacion', cards: [] },
            { name: 'En creacion', cards: [] },
            { name: 'En revision', cards: [] },
            { name: 'Publicado', cards: [] }
        ]
    },
    {
        name: 'Habitos semanales',
        icon: '\u{1F3AF}',
        description: 'Lunes a Viernes + Fin de semana',
        columns: [
            { name: 'Lunes', cards: [] },
            { name: 'Martes', cards: [] },
            { name: 'Miercoles', cards: [] },
            { name: 'Jueves', cards: [] },
            { name: 'Viernes', cards: [] },
            { name: 'Fin de semana', cards: [] }
        ]
    },
    {
        name: 'Planificacion de evento',
        icon: '\u{1F389}',
        description: 'Pendiente, Confirmado, En curso, Completado',
        columns: [
            { name: 'Pendiente', cards: [] },
            { name: 'Confirmado', cards: [] },
            { name: 'En curso', cards: [] },
            { name: 'Completado', cards: [] }
        ]
    },
    {
        name: 'Estudio',
        icon: '\u{1F4DA}',
        description: 'Por estudiar, Estudiando, Repasar, Dominado',
        columns: [
            { name: 'Por estudiar', cards: [] },
            { name: 'Estudiando', cards: [] },
            { name: 'Repasar', cards: [] },
            { name: 'Dominado', cards: [] }
        ]
    },
    {
        name: 'Diseno UX/UI',
        icon: '\u{1F3A8}',
        description: 'Investigacion, Wireframes, Prototipo, Testing',
        columns: [
            { name: 'Investigacion', cards: [] },
            { name: 'Wireframes', cards: [] },
            { name: 'Diseno visual', cards: [] },
            { name: 'Prototipo', cards: [] },
            { name: 'Testing', cards: [] }
        ]
    },
    {
        name: 'Gestion de contenido',
        icon: '\u{270D}\u{FE0F}',
        description: 'Borrador, Edicion, Aprobado, Publicado',
        columns: [
            { name: 'Ideas', cards: [] },
            { name: 'Borrador', cards: [] },
            { name: 'En edicion', cards: [] },
            { name: 'Aprobado', cards: [] },
            { name: 'Publicado', cards: [] }
        ]
    },
    {
        name: 'CRM Ventas',
        icon: '\u{1F4B0}',
        description: 'Prospectos, Contactados, Negociacion, Cerrado',
        columns: [
            { name: 'Prospectos', cards: [] },
            { name: 'Contactados', cards: [] },
            { name: 'Propuesta enviada', cards: [] },
            { name: 'Negociacion', cards: [] },
            { name: 'Cerrado', cards: [] }
        ]
    },
    {
        name: 'Mudanza',
        icon: '\u{1F3E0}',
        description: 'Empacar, Transportar, Desempacar, Organizar',
        columns: [
            { name: 'Por empacar', cards: [] },
            { name: 'Empacado', cards: [] },
            { name: 'En transporte', cards: [] },
            { name: 'Desempacar', cards: [] },
            { name: 'Organizado', cards: [] }
        ]
    },
    {
        name: 'Recetas de cocina',
        icon: '\u{1F373}',
        description: 'Por probar, Ingredientes, Cocinando, Favoritas',
        columns: [
            { name: 'Por probar', cards: [] },
            { name: 'Comprar ingredientes', cards: [] },
            { name: 'En preparacion', cards: [] },
            { name: 'Favoritas', cards: [] }
        ]
    },
    {
        name: 'Fitness',
        icon: '\u{1F4AA}',
        description: 'Rutinas, Cardio, Fuerza, Recuperacion',
        columns: [
            { name: 'Lunes - Pecho', cards: [] },
            { name: 'Martes - Espalda', cards: [] },
            { name: 'Miercoles - Pierna', cards: [] },
            { name: 'Jueves - Hombro', cards: [] },
            { name: 'Viernes - Cardio', cards: [] }
        ]
    },
    {
        name: 'Viaje',
        icon: '\u{2708}\u{FE0F}',
        description: 'Planificar, Reservar, Preparar, Recuerdos',
        columns: [
            { name: 'Investigar destino', cards: [] },
            { name: 'Reservas pendientes', cards: [] },
            { name: 'Reservado', cards: [] },
            { name: 'Maleta', cards: [] },
            { name: 'Recuerdos', cards: [] }
        ]
    }
];

const CUSTOM_TEMPLATES_KEY = 'flowboard_custom_templates';
const NOTES_KEY = 'flowboard_notes';

const PRESET_IMAGES = [
    {
        name: 'Montanas',
        url: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1920&q=80'
    },
    {
        name: 'Oceano',
        url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1920&q=80'
    },
    {
        name: 'Bosque',
        url: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=1920&q=80'
    },
    {
        name: 'Atardecer',
        url: 'https://images.unsplash.com/photo-1495616811223-4d98c6e9c869?w=1920&q=80'
    },
    {
        name: 'Ciudad',
        url: 'https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=1920&q=80'
    },
    {
        name: 'Aurora',
        url: 'https://images.unsplash.com/photo-1531366936337-7c912a4589a7?w=1920&q=80'
    },
    {
        name: 'Tierra',
        url: 'https://images.unsplash.com/photo-1614730321146-b6fa6a46bcb4?w=1920&q=80'
    },
    {
        name: 'Gato',
        url: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=1920&q=80'
    },
    {
        name: 'Leon',
        url: 'https://images.unsplash.com/photo-1546182990-dffeafbe841d?w=1920&q=80'
    },
    {
        name: 'Noche',
        url: 'https://images.unsplash.com/photo-1475274047050-1d0c55b91046?w=1920&q=80'
    },
    {
        name: 'Cascada',
        url: 'https://images.unsplash.com/photo-1432405972618-c6b0cfba5849?w=1920&q=80'
    },
    {
        name: 'Desierto',
        url: 'https://images.unsplash.com/photo-1509316785289-025f5b846b35?w=1920&q=80'
    },
    {
        name: 'Jardin japones',
        url: 'https://images.unsplash.com/photo-1528360983277-13d401cdc186?w=1920&q=80'
    },
    {
        name: 'Nebulosa',
        url: 'https://images.unsplash.com/photo-1462331940025-496dfbfc7564?w=1920&q=80'
    },
    {
        name: 'Playa tropical',
        url: 'https://images.unsplash.com/photo-1506953823976-52e1fdc0149a?w=1920&q=80'
    }
];
