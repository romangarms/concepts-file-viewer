// Stub for 'fs' module - not needed in browser
export function readFile() {
  throw new Error('fs.readFile is not supported in browser');
}

export function readFileSync() {
  throw new Error('fs.readFileSync is not supported in browser');
}
