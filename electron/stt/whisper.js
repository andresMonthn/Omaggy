/**
 * @typedef {{ language?: string; model?: string; endpoint?: string; apiKey?: string }} TranscribeOptions
 */

/** @typedef {{ onTranscript?: (text: string) => void } & TranscribeOptions} InitOptions */

/** @type {InitOptions} */
let config = {
  language: 'es',
  model: 'whisper-1',
}

/** @type {((text: string) => void) | undefined} */
let transcriptHandler = undefined

/** @type {Buffer} */
let pendingBuffer = Buffer.alloc(0)

/** @type {NodeJS.Timeout | null} */
let flushTimer = null

const BYTES_PER_SECOND = 16000 * 2 // 16 kHz, 16-bit mono
const MIN_BATCH_MS = 800
const MAX_BATCH_MS = 2000

/**
 * Configura la integración con Whisper y el callback para texto parcial.
 * Debe llamarse una vez desde el proceso principal (main.js).
 *
 * @param {InitOptions} options
 */
function init(options) {
  config = { ...config, ...options }
  if (typeof options.onTranscript === 'function') {
    transcriptHandler = options.onTranscript
  }
}

/**
 * Envía un chunk de audio PCM (s16le, 16 kHz, mono) al acumulador.
 * Se hace batching corto y se invoca Whisper en bloques pequeños.
 *
 * @param {Buffer} buffer
 */
function send(buffer) {
  if (!buffer || buffer.length === 0) return

  pendingBuffer = Buffer.concat([pendingBuffer, buffer])

  // programar flush si no hay suficiente audio aún
  if (!flushTimer) {
    flushTimer = setTimeout(() => {
      flushTimer = null
      flushBatch()
    }, MIN_BATCH_MS)
  }

  const seconds = pendingBuffer.length / BYTES_PER_SECOND
  if (seconds * 1000 >= MAX_BATCH_MS) {
    if (flushTimer) {
      clearTimeout(flushTimer)
      flushTimer = null
    }
    flushBatch()
  }
}

async function flushBatch() {
  if (!pendingBuffer || pendingBuffer.length === 0) return

  const batch = pendingBuffer
  pendingBuffer = Buffer.alloc(0)

  try {
    const text = await transcribe(batch, config)
    if (text && text.trim() && transcriptHandler) {
      transcriptHandler(text)
    }
  } catch (err) {
    console.error('[stt/whisper] Error transcribiendo batch:', err)
  }
}

/**
 * Llama a la API de Whisper (u otro backend compatible) con un buffer PCM.
 *
 * @param {Buffer} buffer
 * @param {TranscribeOptions | undefined} options
 * @returns {Promise<string>}
 */
async function transcribe(buffer, options) {
  const opts = options || {}
  const endpoint =
    opts.endpoint ||
    process.env.WHISPER_API_URL ||
    'http://127.0.0.1:8000/v1/stt/whisper'

  const apiKey = opts.apiKey || process.env.WHISPER_API_KEY || ''

  const headers = {
    'Content-Type': 'application/octet-stream',
    Accept: 'application/json',
  }

  if (apiKey) {
    // @ts-ignore
    headers.Authorization = `Bearer ${apiKey}`
  }

  // @ts-ignore Node 18+ tiene fetch global
  const res = await fetch(endpoint, {
    method: 'POST',
    headers,
    body: /** @type {any} */ (buffer),
  })

  if (!res.ok) {
    const bodyText = await res.text().catch(() => '')
    throw new Error(
      `[stt/whisper] HTTP ${res.status} ${res.statusText} - ${bodyText}`,
    )
  }

  const json = await res.json().catch(() => ({}))
  return json.text || json.transcript || ''
}

module.exports = {
  init,
  send,
  transcribe,
}
