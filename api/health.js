export default function handler(req, res) {
  res.status(200).json({
    status: 'OK',
    message: 'Sketch2Print API is running',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
}