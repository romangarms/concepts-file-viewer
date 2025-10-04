import express from 'express';

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

app.listen(PORT, HOST, () => {
  console.log(`\n🚀 Server running at http://${HOST}:${PORT}/\n`);
});
