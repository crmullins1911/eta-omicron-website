// Counts the words in a .docx file in the browser (no library): a .docx is a zip, and the body
// text is in word/document.xml. Headers and footers live in other files, so they aren't counted,
// matching the contest rule. Returns null if the file can't be read (e.g. an old .doc file).

export async function countDocxWords(file) {
  try {
    if (typeof DecompressionStream === 'undefined') return null
    const buf = new Uint8Array(await file.arrayBuffer())
    const xml = await readZipEntry(buf, 'word/document.xml')
    if (!xml) return null
    const text = xml
      .replace(/<w:tab\/>/g, ' ')
      .replace(/<\/w:p>/g, '\n')
      .replace(/<w:br[^>]*\/>/g, '\n')
      .replace(/<w:instrText[\s\S]*?<\/w:instrText>/g, '') // field codes aren't visible text
      .replace(/<w:t(?:\s[^>]*)?>([\s\S]*?)<\/w:t>|<[^>]+>/g, (_, t) => (t == null ? '' : t))
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&apos;/g, "'")
      .replace(/&amp;/g, '&')
    return text.split(/\s+/).filter((w) => /[\p{L}\p{N}]/u.test(w)).length
  } catch {
    return null
  }
}

async function readZipEntry(buf, wanted) {
  const view = new DataView(buf.buffer, buf.byteOffset, buf.byteLength)
  // End of central directory record: the last 22+ bytes of the file.
  let eocd = -1
  for (let i = buf.length - 22; i >= Math.max(0, buf.length - 65557); i--) {
    if (view.getUint32(i, true) === 0x06054b50) {
      eocd = i
      break
    }
  }
  if (eocd < 0) return null
  const count = view.getUint16(eocd + 10, true)
  let p = view.getUint32(eocd + 16, true)
  const dec = new TextDecoder()
  for (let n = 0; n < count && p + 46 <= buf.length; n++) {
    if (view.getUint32(p, true) !== 0x02014b50) return null
    const method = view.getUint16(p + 10, true)
    const size = view.getUint32(p + 20, true)
    const nameLen = view.getUint16(p + 28, true)
    const extraLen = view.getUint16(p + 30, true)
    const commentLen = view.getUint16(p + 32, true)
    const local = view.getUint32(p + 42, true)
    const name = dec.decode(buf.subarray(p + 46, p + 46 + nameLen))
    if (name === wanted) {
      const start = local + 30 + view.getUint16(local + 26, true) + view.getUint16(local + 28, true)
      const data = buf.subarray(start, start + size)
      if (method === 0) return dec.decode(data)
      if (method !== 8) return null
      const stream = new Blob([data]).stream().pipeThrough(new DecompressionStream('deflate-raw'))
      return await new Response(stream).text()
    }
    p += 46 + nameLen + extraLen + commentLen
  }
  return null
}
