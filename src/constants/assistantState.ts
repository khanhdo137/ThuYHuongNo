// Simple in-memory state to coordinate assistant modal/ FAB behavior
let lastModalCloseTs = 0;

export function setModalClosedNow() {
  lastModalCloseTs = Date.now();
}

export function wasModalClosedRecently(ms = 300) {
  return Date.now() - lastModalCloseTs < ms;
}
