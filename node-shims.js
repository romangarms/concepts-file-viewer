// Shims for Node.js globals
import { Buffer } from 'buffer';
window.Buffer = Buffer;
export { Buffer };
