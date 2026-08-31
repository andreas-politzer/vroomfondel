const EVENT_NAME = 'vroomfondel:library-changed'

export function notifyLibraryChanged() {
  window.dispatchEvent(new Event(EVENT_NAME))
}

export function onLibraryChanged(callback: () => void) {
  window.addEventListener(EVENT_NAME, callback)
  return () => window.removeEventListener(EVENT_NAME, callback)
}