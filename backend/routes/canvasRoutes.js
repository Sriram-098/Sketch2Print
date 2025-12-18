const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const canvasController = require('../controllers/canvasController');

const router = express.Router();

// File upload configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const upload = multer({ 
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    // Accept images only
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  }
});

// Canvas routes
router.post('/init', canvasController.initCanvas);
router.get('/', canvasController.getCanvas);
router.delete('/clear', canvasController.clearCanvas);

// Element management routes
router.get('/elements', canvasController.getElements);
router.put('/elements/:id', canvasController.updateElement);
router.delete('/elements/:id', canvasController.deleteElement);
router.post('/elements/:id/duplicate', canvasController.duplicateElement);
router.patch('/elements/:id/move', canvasController.moveElement);
router.patch('/elements/:id/reorder', canvasController.reorderElement);

// Element routes
router.post('/rectangle', canvasController.addRectangle);
router.post('/circle', canvasController.addCircle);
router.post('/text', canvasController.addText);
router.post('/image', upload.single('image'), canvasController.addImage);

// Export routes
router.post('/export-pdf', canvasController.exportPDF);

// Text helper routes
router.get('/text/examples', canvasController.getTextExamples);
router.post('/text/validate', canvasController.validateTextPosition);

// Generic drawing routes
router.post('/draw', canvasController.addDrawing);
router.get('/drawing-types', canvasController.getDrawingTypes);
router.get('/drawing-types/:type/schema', canvasController.getDrawingSchema);

// Test route for debugging
router.post('/test-shape', canvasController.testShape);

module.exports = router;