/**
 * Application Configuration
 * 
 * For sensitive values like API keys and OAuth client IDs, create a local
 * config file: src/config/appConfig.local.ts (this file is gitignored)
 * 
 * Example appConfig.local.ts:
 * ```typescript
 * export const APP_CONFIG = {
 *   GOOGLE_WEB_CLIENT_ID: 'your-actual-client-id.apps.googleusercontent.com',
 * };
 * ```
 */

// Default/fallback config (safe to commit)
export const APP_CONFIG = {
  GOOGLE_WEB_CLIENT_ID: process.env.GOOGLE_WEB_CLIENT_ID || '',
  MAPBOX_ACCESS_TOKEN: process.env.MAPBOX_ACCESS_TOKEN || '',
};

// Try to load local config if it exists (gitignored)
let localConfig: typeof APP_CONFIG | null = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  localConfig = require('./appConfig.local').APP_CONFIG;
} catch {
  // Local config doesn't exist, use default
}

export const CONFIG = localConfig || APP_CONFIG;

