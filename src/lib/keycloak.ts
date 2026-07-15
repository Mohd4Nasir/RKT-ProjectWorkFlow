/**
 * FILE: src/lib/keycloak.ts
 *
 * Keycloak singleton instance.
 * NEVER import and call `new Keycloak()` anywhere else — always import
 * this module so the same instance is shared across the entire app.
 *
 * Configuration is read from Vite env vars so values differ between
 * dev / staging / production without code changes.
 */

import Keycloak from 'keycloak-js';

const keycloak = new Keycloak({
  /**
   * The base URL of your Keycloak server.
   * Example: 'https://auth.yourcompany.com'
   *          'http://localhost:8080'
   *
   * VITE_ prefix is required for Vite to expose this to the browser bundle.
   */
  url: import.meta.env.VITE_KEYCLOAK_URL,

  /**
   * The realm you created in the Keycloak admin console.
   * Realms isolate identity namespaces — one realm per product/tenant
   * is the standard pattern.
   */
  realm: import.meta.env.VITE_KEYCLOAK_REALM,

  /**
   * The Client ID registered in your realm.
   * For SPAs use a PUBLIC client (no client secret).
   * Flow: Standard (Authorization Code) + PKCE enabled (default in KC 18+).
   */
  clientId: import.meta.env.VITE_KEYCLOAK_CLIENT_ID,
});

export default keycloak;
