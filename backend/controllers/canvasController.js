const canvasService = require('../services/canvasService');

class CanvasController {
  // Initialize canvas
  async initCanvas(req, res) {
    try {
      const { width, height, preserveElements } = req.body;
      
      if (!width || !height || width <= 0 || height <= 0) {
        return res.status(400).json({ error: 'Valid width and height are required' });
      }
      
      const canvas = canvasService.initializeCanvas(parseInt(width), parseInt(height), preserveElements);
      
      res.json({ 
        message: 'Canvas initialized successfully',
        canvas,
        elementsPreserved: preserveElements && canvas.elements.length > 0
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  // Get canvas data
  async getCanvas(req, res) {
    try {
      const canvas = canvasService.getCanvasData();
      res.json(canvas);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  // Add rectangle
  async addRectangle(req, res) {
    try {
      const { x, y, width, height, fillColor, strokeColor, strokeWidth } = req.body;
      
      const element = {
        type: 'rectangle',
        x: parseInt(x) || 0,
        y: parseInt(y) || 0,
        width: parseInt(width) || 100,
        height: parseInt(height) || 100,
        fillColor: fillColor || '#000000',
        strokeColor: strokeColor || '#000000',
        strokeWidth: parseInt(strokeWidth) || 1
      };
      
      canvasService.addElement(element);
      res.json({ message: 'Rectangle added successfully', element });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  // Add circle
  async addCircle(req, res) {
    try {
      const { x, y, radius, fillColor, strokeColor, strokeWidth } = req.body;
      
      const element = {
        type: 'circle',
        x: parseInt(x) || 0,
        y: parseInt(y) || 0,
        radius: parseInt(radius) || 50,
        fillColor: fillColor || '#000000',
        strokeColor: strokeColor || '#000000',
        strokeWidth: parseInt(strokeWidth) || 1
      };
      
      canvasService.addElement(element);
      res.json({ message: 'Circle added successfully', element });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  // Add text with enhanced validation
  async addText(req, res) {
    try {
      const { x, y, text, fontSize, fontFamily, fillColor } = req.body;
      
      if (!text || text.trim() === '') {
        return res.status(400).json({ error: 'Text content is required' });
      }
      
      // Get current canvas data for validation
      const canvas = canvasService.getCanvasData();
      
      const element = {
        type: 'text',
        x: parseInt(x) || 50,
        y: parseInt(y) || 50,
        text: text.trim(),
        fontSize: parseInt(fontSize) || 16,
        fontFamily: fontFamily || 'Helvetica',
        fillColor: fillColor || '#000000'
      };

      // Validate position bounds
      if (element.x < 0 || element.x > canvas.width) {
        element.x = Math.max(0, Math.min(element.x, canvas.width - 10));
      }
      
      if (element.y < element.fontSize || element.y > canvas.height) {
        element.y = Math.max(element.fontSize, Math.min(element.y, canvas.height - 10));
      }

      // Validate font size
      if (element.fontSize < 8 || element.fontSize > 100) {
        element.fontSize = Math.max(8, Math.min(element.fontSize, 100));
      }

      // Validate color format
      const colorPattern = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
      if (!colorPattern.test(element.fillColor)) {
        element.fillColor = '#000000'; // Default to black
      }
      
      canvasService.addElement(element);
      
      res.json({ 
        message: 'Text added successfully', 
        element,
        position: { x: element.x, y: element.y },
        color: element.fillColor,
        preview: `"${element.text}" at (${element.x}, ${element.y}) in ${element.fillColor}`
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  // Add image
  async addImage(req, res) {
    try {
      const { x, y, width, height, imageUrl } = req.body;
      let imagePath = '';
      
      if (req.file) {
        imagePath = req.file.path;
      } else if (imageUrl) {
        imagePath = imageUrl;
      } else {
        return res.status(400).json({ error: 'Image file or URL is required' });
      }
      
      const element = {
        type: 'image',
        x: parseInt(x) || 0,
        y: parseInt(y) || 0,
        width: parseInt(width) || 100,
        height: parseInt(height) || 100,
        imagePath: imagePath
      };
      
      canvasService.addElement(element);
      res.json({ message: 'Image added successfully', element });
    } catch (error) {
      res.status(500).json({ error: 'Failed to add image: ' + error.message });
    }
  }

  // Clear canvas
  async clearCanvas(req, res) {
    try {
      canvasService.clearElements();
      res.json({ message: 'Canvas cleared successfully' });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  // Export as PDF
  async exportPDF(req, res) {
    try {
      const canvas = canvasService.getCanvasData();
      
      // Set response headers
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'attachment; filename="sketch2print-export.pdf"');
      
      // Generate and stream PDF
      await canvasService.generatePDF(canvas, res);
    } catch (error) {
      console.error('PDF export error:', error);
      res.status(500).json({ error: 'Failed to export PDF: ' + error.message });
    }
  }

  // Get text examples and suggestions
  async getTextExamples(req, res) {
    try {
      const canvas = canvasService.getCanvasData();
      const pdfOptimizer = require('../utils/pdfOptimizer');
      
      const examples = pdfOptimizer.generateTextExamples(canvas.width, canvas.height);
      
      const colorOptions = [
        { name: 'Black', value: '#000000', description: 'Default text color' },
        { name: 'Red', value: '#FF0000', description: 'Bold red text' },
        { name: 'Blue', value: '#0000FF', description: 'Professional blue' },
        { name: 'Green', value: '#008000', description: 'Nature green' },
        { name: 'Orange', value: '#FF6600', description: 'Vibrant orange' },
        { name: 'Purple', value: '#800080', description: 'Royal purple' },
        { name: 'Dark Gray', value: '#333333', description: 'Subtle dark gray' }
      ];

      const positionSuggestions = [
        { name: 'Top Left', x: 50, y: 50, description: 'Header position' },
        { name: 'Top Center', x: canvas.width / 2 - 50, y: 50, description: 'Title position' },
        { name: 'Center', x: canvas.width / 2 - 50, y: canvas.height / 2, description: 'Main content' },
        { name: 'Bottom Left', x: 50, y: canvas.height - 30, description: 'Footer left' },
        { name: 'Bottom Right', x: canvas.width - 150, y: canvas.height - 30, description: 'Footer right' }
      ];

      res.json({
        examples,
        colorOptions,
        positionSuggestions,
        canvasSize: { width: canvas.width, height: canvas.height },
        tips: [
          'Y position represents the baseline of the text',
          'Ensure text color contrasts with background',
          'Consider font size relative to canvas dimensions',
          'Leave margin space around text for better readability'
        ]
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  // Validate text positioning
  async validateTextPosition(req, res) {
    try {
      const { x, y, text, fontSize, fillColor } = req.body;
      const canvas = canvasService.getCanvasData();
      const pdfOptimizer = require('../utils/pdfOptimizer');

      const element = {
        type: 'text',
        x: parseInt(x) || 0,
        y: parseInt(y) || 0,
        text: text || 'Sample Text',
        fontSize: parseInt(fontSize) || 16,
        fillColor: fillColor || '#000000'
      };

      const recommendations = pdfOptimizer.getTextPositionRecommendations(
        element, 
        canvas.width, 
        canvas.height
      );

      const optimized = pdfOptimizer.optimizeTextElement(element, canvas.width, canvas.height);

      res.json({
        original: element,
        optimized,
        recommendations,
        isValid: recommendations.length === 0,
        preview: `"${optimized.text}" at (${optimized.x}, ${optimized.y}) in ${optimized.fillColor}`
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  // Generic drawing endpoint
  async addDrawing(req, res) {
    try {
      const { type, ...properties } = req.body;
      
      if (!type) {
        return res.status(400).json({ error: 'Drawing type is required' });
      }

      const ShapeFactory = require('../services/shapes/ShapeFactory');
      
      // Check if shape type is supported
      const supportedShapes = ShapeFactory.getSupportedShapes();
      if (!supportedShapes.includes(type)) {
        return res.status(400).json({ 
          error: `Unsupported drawing type: ${type}`,
          supportedTypes: supportedShapes
        });
      }

      // Create and validate shape
      const shape = ShapeFactory.createShape(type, { type, ...properties });
      const elementData = shape.toJSON();
      
      canvasService.addElement(elementData);
      
      res.json({ 
        message: `${type} added successfully`, 
        element: elementData,
        id: canvasService.getCanvasData().elements.length - 1
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  // Get supported drawing types and their schemas
  async getDrawingTypes(req, res) {
    try {
      const ShapeFactory = require('../services/shapes/ShapeFactory');
      
      const supportedTypes = ShapeFactory.getSupportedShapes();
      const schemas = ShapeFactory.getAllSchemas();
      
      res.json({
        supportedTypes,
        schemas,
        count: supportedTypes.length
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  // Get schema for specific drawing type
  async getDrawingSchema(req, res) {
    try {
      const { type } = req.params;
      const ShapeFactory = require('../services/shapes/ShapeFactory');
      
      const schema = ShapeFactory.getShapeSchema(type);
      
      if (!schema) {
        return res.status(404).json({ error: `Schema not found for type: ${type}` });
      }
      
      res.json({
        type,
        schema
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  // Test endpoint for debugging shapes
  async testShape(req, res) {
    try {
      console.log('🧪 Testing shape creation...');
      console.log('Request body:', req.body);
      
      const { type = 'line', ...properties } = req.body;
      
      // Test 1: Load ShapeFactory
      const ShapeFactory = require('../services/shapes/ShapeFactory');
      console.log('✅ ShapeFactory loaded');
      
      // Test 2: Get supported shapes
      const supportedShapes = ShapeFactory.getSupportedShapes();
      console.log('✅ Supported shapes:', supportedShapes);
      
      // Test 3: Create shape
      const testData = {
        type,
        x: 100,
        y: 100,
        x2: 200,
        y2: 150,
        strokeColor: '#ff0000',
        strokeWidth: 2,
        ...properties
      };
      
      console.log('Creating shape with data:', testData);
      const shape = ShapeFactory.createShape(type, testData);
      console.log('✅ Shape created:', shape);
      
      // Test 4: Convert to JSON
      const elementData = shape.toJSON();
      console.log('✅ Shape JSON:', elementData);
      
      res.json({
        success: true,
        message: 'Shape test completed successfully',
        supportedShapes,
        testData,
        elementData
      });
      
    } catch (error) {
      console.error('❌ Shape test failed:', error);
      res.status(500).json({ 
        success: false,
        error: error.message,
        stack: error.stack
      });
    }
  }

  // Get all elements with their IDs
  async getElements(req, res) {
    try {
      const canvas = canvasService.getCanvasData();
      const elementsWithIds = canvas.elements.map((element, index) => ({
        id: index,
        ...element
      }));
      
      res.json({
        elements: elementsWithIds,
        count: elementsWithIds.length
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  // Update element position and properties
  async updateElement(req, res) {
    try {
      const { id } = req.params;
      const updates = req.body;
      
      const elementId = parseInt(id);
      const canvas = canvasService.getCanvasData();
      
      if (elementId < 0 || elementId >= canvas.elements.length) {
        return res.status(404).json({ error: 'Element not found' });
      }
      
      // Get current element
      const currentElement = canvas.elements[elementId];
      
      // Merge updates with current element
      const updatedElement = { ...currentElement, ...updates };
      
      // Validate the updated element
      if (updatedElement.type === 'text' && (!updatedElement.text || updatedElement.text.trim() === '')) {
        return res.status(400).json({ error: 'Text content cannot be empty' });
      }
      
      // Update the element
      canvasService.updateElement(elementId, updatedElement);
      
      res.json({ 
        message: 'Element updated successfully', 
        element: { id: elementId, ...updatedElement }
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  // Delete element
  async deleteElement(req, res) {
    try {
      const { id } = req.params;
      const elementId = parseInt(id);
      
      const canvas = canvasService.getCanvasData();
      
      if (elementId < 0 || elementId >= canvas.elements.length) {
        return res.status(404).json({ error: 'Element not found' });
      }
      
      const deletedElement = canvasService.deleteElement(elementId);
      
      res.json({ 
        message: 'Element deleted successfully', 
        deletedElement: { id: elementId, ...deletedElement }
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  // Duplicate element
  async duplicateElement(req, res) {
    try {
      const { id } = req.params;
      const elementId = parseInt(id);
      
      const canvas = canvasService.getCanvasData();
      
      if (elementId < 0 || elementId >= canvas.elements.length) {
        return res.status(404).json({ error: 'Element not found' });
      }
      
      const originalElement = canvas.elements[elementId];
      
      // Create duplicate with slight offset
      const duplicateElement = {
        ...originalElement,
        x: originalElement.x + 20,
        y: originalElement.y + 20
      };
      
      canvasService.addElement(duplicateElement);
      
      res.json({ 
        message: 'Element duplicated successfully', 
        element: { id: canvas.elements.length - 1, ...duplicateElement }
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  // Move element to new position
  async moveElement(req, res) {
    try {
      const { id } = req.params;
      const elementUpdates = req.body;
      
      const elementId = parseInt(id);
      const canvas = canvasService.getCanvasData();
      
      if (elementId < 0 || elementId >= canvas.elements.length) {
        return res.status(404).json({ error: 'Element not found' });
      }
      
      if (elementUpdates.x === undefined || elementUpdates.y === undefined) {
        return res.status(400).json({ error: 'Both x and y coordinates are required' });
      }
      
      // Get the current element to determine how to move it
      const currentElement = canvas.elements[elementId];
      const moveUpdates = canvasService.calculateElementMove(currentElement, elementUpdates.x, elementUpdates.y);
      
      const updatedElement = canvasService.updateElement(elementId, moveUpdates);
      
      res.json({ 
        message: 'Element moved successfully', 
        element: { id: elementId, ...updatedElement },
        newPosition: { x: moveUpdates.x, y: moveUpdates.y }
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  // Reorder elements (bring to front/back)
  async reorderElement(req, res) {
    try {
      const { id } = req.params;
      const { direction } = req.body; // 'front', 'back', 'forward', 'backward'
      
      const elementId = parseInt(id);
      const result = canvasService.reorderElement(elementId, direction);
      
      res.json({ 
        message: `Element moved ${direction} successfully`, 
        newIndex: result.newIndex,
        element: result.element
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }}


module.exports = new CanvasController();