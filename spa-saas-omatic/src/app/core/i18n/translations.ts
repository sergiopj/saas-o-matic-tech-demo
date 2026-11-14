export const TRANSLATIONS = {
  es: {
    'currency.selector.aria': 'Seleccionar divisa de visualización',
    'currency.status.aria': 'Estado de sincronización de tipos de cambio',
    'currency.sync.loading': 'Actualizando tipos de cambio en vivo...',
    'currency.sync.error': 'API de tipos de cambio no disponible. Usando tipos de contingencia en caché.',
    'currency.sync.synced': 'Tipos de cambio actualizados en vivo vía open.er-api.com',
    'navbar.title': 'SaaS-O-Matic',
    'navbar.subtitle': 'Optimizador Comercial',
    'navbar.lang.aria': 'Cambiar idioma de la aplicación',
    'navbar.home.aria': 'Ir al inicio del Dashboard',
    'error.banner.dismiss.aria': 'Cerrar notificación de error',
    'error.banner.invalidParams.title': 'Parámetros no válidos:',
    'error.banner.field': 'Campo',
    'error.banner.reason': 'Motivo',
    'error.banner.status': 'Código HTTP',
  },
  en: {
    'currency.selector.aria': 'Select display currency',
    'currency.status.aria': 'Exchange rates synchronization status',
    'currency.sync.loading': 'Updating live exchange rates...',
    'currency.sync.error': 'Exchange rates API unavailable. Using resilient cached rates.',
    'currency.sync.synced': 'Exchange rates updated live via open.er-api.com',
    'navbar.title': 'SaaS-O-Matic',
    'navbar.subtitle': 'Commercial Optimizer',
    'navbar.lang.aria': 'Change application language',
    'navbar.home.aria': 'Go to Dashboard home',
    'error.banner.dismiss.aria': 'Dismiss error notification',
    'error.banner.invalidParams.title': 'Invalid parameters:',
    'error.banner.field': 'Field',
    'error.banner.reason': 'Reason',
    'error.banner.status': 'HTTP Status',
  },
} as const;

export type SupportedLanguage = keyof typeof TRANSLATIONS;
export type TranslationKey = keyof (typeof TRANSLATIONS)['es'];
