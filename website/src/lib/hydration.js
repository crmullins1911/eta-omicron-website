// Tracks whether the page is still taking over prerendered HTML ("hydrating").
// main.jsx sets this before hydrateRoot; it ends on the first client-side navigation.

let hydrating = false

export function startHydration() {
  hydrating = true
}

export function endHydration() {
  hydrating = false
}

export function isHydrating() {
  return hydrating
}
