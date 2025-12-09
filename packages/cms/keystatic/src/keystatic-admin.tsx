'use client';

/** Admin Keystatic. Función: Exporta la página de administración generada desde configuración. */

import { makePage } from '@keystatic/next/ui/app';

import { keyStaticConfig } from './keystatic.config';

export default makePage(keyStaticConfig);
