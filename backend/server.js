const app = require('./app');

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`✅ Sketch2Print Server running on port ${PORT}`);
  console.log(`🎨 Sketch2Print API is ready!`);
  console.log(`📋 Health check: http://localhost:${PORT}/api/health`);
});