import 'server-only';

/** Punto de entrada servidor. Función: Expone `analytics` en SSR con proveedor nulo por defecto. */

import { createAnalyticsManager } from './analytics-manager';
import { NullAnalyticsService } from './null-analytics-service';
import type { AnalyticsManager } from './types';

export const analytics: AnalyticsManager = createAnalyticsManager({
  providers: {
    null: () => NullAnalyticsService,
  },
});
