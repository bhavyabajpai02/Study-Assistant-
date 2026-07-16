import { useEffect } from "react"

/**
 * Global Keyboard Shortcuts Hook
 * 
 * @param {Object} shortcuts - Key-action mapping (e.g. { "ctrl+k": callback })
 */
export function useKeyboardShortcuts(shortcuts) {
  useEffect(() => {
    const handleKeyDown = (event) => {
      const activeEl = document.activeElement
      
      // Ignore global shortcut triggers if the user is active inside inputs or contenteditable containers
      const isInputFocused =
        activeEl &&
        (activeEl.tagName === "INPUT" ||
          activeEl.tagName === "TEXTAREA" ||
          activeEl.tagName === "SELECT" ||
          activeEl.isContentEditable)

      let keyCombo = event.key.toLowerCase()

      if (event.ctrlKey || event.metaKey) {
        keyCombo = `ctrl+${keyCombo}`
      }

      if (isInputFocused && keyCombo !== "ctrl+k" && event.key !== "Escape") {
        return
      }

      if (shortcuts[keyCombo]) {
        event.preventDefault()
        shortcuts[keyCombo](event)
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [shortcuts])
}
