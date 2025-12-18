const app = require('./app');

const PORT = process.env.PORT || 3001;
const HOST = process.env.NODE_ENV === 'production' ? '0.0.0.0' : 'localhost';

app.listen(PORT, HOST, () => {
  console.log(`✅ Sketch2Print Server running on ${HOST}:${PORT}`);
  console.log(`🎨 Sketch2Print API is ready!`);
  console.log(`📋 Health check: http://${HOST}:${PORT}/api/health`);
});