/**
 * Shared Vite configuration for library builds.
 *
 * This ensures that:
 * 1. React is always externalized (peer dependency)
 * 2. @preact/signals-* packages are externalized to prevent duplicate state
 * 3. @storyteller/* workspace packages are externalized so libraries don't bundle each other
 *
 * Without this, stateful modules like signals get bundled multiple times,
 * causing state isolation issues in production builds.
 */

/**
 * Returns true if the given module ID should be externalized during library builds.
 */
export function isExternal(id: string): boolean {
  // Always externalize React
  if (
    id === 'react' ||
    id === 'react-dom' ||
    id === 'react/jsx-runtime' ||
    id.startsWith('react/') ||
    id.startsWith('react-dom/')
  ) {
    return true;
  }

  // Other react libraries
  if (
    id === 'react-hot-toast' ||
    id === 'react-router-dom' ||
    id.startsWith('react-')
  ) {
    return true;
  }

  // Externalize @preact/signals to prevent duplicate signal state
  if (id.startsWith('@preact/signals')) {
    return true;
  }

  // Other important libraries
  if (
    id === 'konva' ||
    id === 'three' ||
    id === 'zustand' ||
    id === 'wavesurfer.js' ||
    id.startsWith('@fortawesome/')
  ) {
    return true;
  }

  // Externalize all workspace packages so libraries don't bundle each other
  if (id.startsWith('@storyteller/') || id.startsWith('@frontend/')) {
    return true;
  }

  return false;
}
