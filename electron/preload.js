window.addEventListener('DOMContentLoaded', () => {
  /**
   * @param {string} selector
   * @param {string} text
   */
  const replaceText = (selector, text) => {
    const element = document.getElementById(selector)
    if (element) element.innerText = text
  }

  for (const type of ['chrome', 'node', 'electron']) {
    replaceText(`${type}-version`, process.versions[type] || 'stocjs')
  }
})
