// Lightweight per-game session tracker.
// Counts gentle mistakes during the current game so the final celebration
// can adapt its kind words to how the player did (never mentioning numbers).

let mistakes = 0

export function resetMistakes() {
  mistakes = 0
}

export function addMistake() {
  mistakes += 1
}

export function getMistakes(): number {
  return mistakes
}
