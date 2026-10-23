/** "/events/" -> "/events", "" -> "/", strips query and hash. */
export function normalize(pathname) {
  const p = (pathname || '/').split(/[?#]/)[0].replace(/\/+$/, '')
  return p === '' ? '/' : p
}
