const mic = require('./mic')
const system = require('./system')

/** @type {{ start(config: unknown): void; stop(): void } | null }*/
let active = null

/**
 * @param {{ source?: 'mic' | 'system' } | undefined} config
 */
function start(config) {
  stop()
  const source = config && config.source === 'system' ? system : mic
  active = source
  if (active && typeof active.start === 'function') {
    active.start(config)
  }
}

function stop() {
  if (active && typeof active.stop === 'function') {
    active.stop()
  }
  active = null
}

module.exports = {
  start,
  stop,
}
