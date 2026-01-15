const { spawn } = require('child_process')
const whisperStt = require('../stt/whisper')

let running = false

/** @typedef {{ ffmpegPath?: string; device?: string }} SystemAudioConfig */

/** @type {import('child_process').ChildProcess | null} */
let ffmpegProc = null

/**
 * Inicia la captura de audio del sistema usando WASAPI + ffmpeg.
 * Salida: PCM s16le, mono, 16kHz, stream continuo por stdout.
 *
 * @param {SystemAudioConfig | undefined} config
 */
function start(config) {
  if (running) return

  if (process.platform !== 'win32') {
    console.warn('[audio/system] Captura WASAPI solo está implementada en Windows')
    return
  }

  const cfg = config && typeof config === 'object' ? config : {}
  const ffmpegPath = cfg.ffmpegPath || 'ffmpeg'
  const device = cfg.device || 'audio=virtual-audio-capturer'

  const args = [
    '-f',
    'wasapi',
    '-i',
    device,
    '-ac',
    '1',
    '-ar',
    '16000',
    '-f',
    's16le',
    'pipe:1',
  ]

  const proc = spawn(ffmpegPath, args, {
    stdio: ['ignore', 'pipe', 'ignore'],
  })

  ffmpegProc = proc
  running = true

  proc.stdout.on('data', (chunk) => {
    if (!running) return
    whisperStt.send(chunk)
  })

  proc.on('error', (err) => {
    console.error('[audio/system] Error al iniciar ffmpeg WASAPI:', err)
    running = false
    ffmpegProc = null
  })

  proc.on('close', (code, signal) => {
    if (code !== 0) {
      console.error(
        '[audio/system] ffmpeg terminó de forma no exitosa',
        'code=',
        code,
        'signal=',
        signal,
      )
    }
    running = false
    ffmpegProc = null
  })
}

function stop() {
  running = false

  if (ffmpegProc) {
    try {
      ffmpegProc.kill('SIGTERM')
    } catch (e) {
      console.error('[audio/system] Error al detener ffmpeg WASAPI:', e)
    }
    ffmpegProc = null
  }
}

module.exports = {
  start,
  stop,
}
