import express from 'express';
import path from 'path';

const PORT = 8000;
const HOST = 'localhost';

const app = express();

// Logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// Serve static files from current directory
app.use(express.static('.'));

// Fallback for client-side routing - serve index.html for non-file routes
app.use((req, res, next) => {
  // If the request has a file extension, let it 404
  if (path.extname(req.path)) {
    return next();
  }
  // Otherwise serve index.html for client-side routing
  res.sendFile(path.join(process.cwd(), 'index.html'));
});

app.listen(PORT, HOST, () => {
  console.log(`\n🚀 Server running at http://${HOST}:${PORT}/\n`);
});
