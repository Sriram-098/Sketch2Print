const PDFDocument = require('pdfkit');
const fs = require('fs');
const pdfOptimizer = require('../utils/pdfOptimizer');
const ShapeFactory = require('./shapes/ShapeFactory');

class CanvasService {
  constructor() {
    this.canvasData = {
      width: 800,
      height: 600,
      elements: []
    };
  }

  // Initialize canvas with dimensions
  initializeCanvas(width, height, preserveElements = false) {
    if (preserveElements && this.canvasData.elements.length > 0) {
      // Only update dimensions, keep existing elements
      this.canvasData.width = width;
      this.canvasData.height = height;
    } else {
      // Full initialization (clears elements)
      this.canvasData = {
        width,
        height,
        elements: []
      };
    }
    return this.canvasData;
  }

  // Get current canvas data
  getCanvasData() {
    return this.canvasData;
  }

  // Add element to canvas
  addElement(element) {
    this.canvasData.elements.push(element);
    return element;
  }

  // Clear all elements
  clearElements() {
    this.canvasData.elements = [];
  }

  // Generate PDF from canvas data
  async generatePDF(canvasData, responseStream) {
    return new Promise((resolve, reject) => {
      try {
        // Create PDF document with optimization
        const doc = new PDFDocument({
          size: [canvasData.width, canvasData.height],
          margin: 0,
          compress: true,
          autoFirstPage: true
        });

        // Pipe to response stream
        doc.pipe(responseStream);

        // Set white background
        doc.rect(0, 0, canvasData.width, canvasData.height)
           .fill('white');

        // Draw all elements
        this.drawElements(doc, canvasData.elements);

        // Finalize PDF
        doc.end();

        doc.on('end', () => {
          resolve();
        });

        doc.on('error', (error) => {
          reject(error);
        });

      } catch (error) {
        reject(error);
      }
    });
  }

  // Draw elements on PDF document
  drawElements(doc, elements) {
    elements.forEach((element, index) => {
      try {
        this.drawElement(doc, element);
      } catch (elementError) {
        console.log(`Error drawing element ${index}:`, elementError.message);
      }
    });
  }

  // Create shape instance from element data
  createShape(elementData) {
    try {
      return ShapeFactory.createShape(elementData.type, elementData);
    } catch (error) {
      console.error('Error creating shape:', error);
      return null;
    }
  }

  // Draw individual element
  drawElement(doc, element) {
    // Try to use new shape system first
    const shape = this.createShape(element);
    if (shape) {
      try {
        // Create a canvas context wrapper for PDFKit
        const canvasContext = this.createPDFCanvasContext(doc);
        shape.draw(canvasContext);
        return;
      } catch (error) {
        console.log('Error drawing with shape system:', error.message);
      }
    }

    // Fallback to legacy drawing methods
    switch (element.type) {
      case 'rectangle':
        this.drawRectangle(doc, element);
        break;
      case 'circle':
        this.drawCircle(doc, element);
        break;
      case 'text':
        this.drawText(doc, element);
        break;
      case 'image':
        this.drawImage(doc, element);
        break;
      default:
        console.log(`Unknown element type: ${element.type}`);
    }
  }

  // Create a canvas-like context wrapper for PDFKit
  createPDFCanvasContext(doc) {
    return {
      // Basic drawing methods
      fillRect: (x, y, width, height) => {
        doc.rect(x, y, width, height).fill();
      },
      strokeRect: (x, y, width, height) => {
        doc.rect(x, y, width, height).stroke();
      },
      
      // Path methods
      beginPath: () => {
        // PDFKit doesn't need explicit beginPath
      },
      moveTo: (x, y) => doc.moveTo(x, y),
      lineTo: (x, y) => doc.lineTo(x, y),
      closePath: () => doc.closePath(),
      
      // Arc methods
      arc: (x, y, radius, startAngle, endAngle, counterclockwise) => {
        doc.circle(x, y, radius);
      },
      ellipse: (x, y, radiusX, radiusY, rotation, startAngle, endAngle) => {
        doc.ellipse(x, y, radiusX, radiusY);
      },
      
      // Curve methods
      quadraticCurveTo: (cpx, cpy, x, y) => doc.quadraticCurveTo(cpx, cpy, x, y),
      bezierCurveTo: (cp1x, cp1y, cp2x, cp2y, x, y) => doc.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, x, y),
      
      // Style methods
      fill: () => doc.fill(),
      stroke: () => doc.stroke(),
      
      // Properties
      set fillStyle(color) {
        const rgb = this.hexToRgb(color);
        doc.fillColor(rgb.r, rgb.g, rgb.b);
      },
      set strokeStyle(color) {
        const rgb = this.hexToRgb(color);
        doc.strokeColor(rgb.r, rgb.g, rgb.b);
      },
      set lineWidth(width) {
        doc.lineWidth(width);
      },
      set lineCap(cap) {
        doc.lineCap(cap);
      },
      set globalAlpha(alpha) {
        doc.opacity(alpha);
      },
      
      // Transform methods
      save: () => doc.save(),
      restore: () => doc.restore(),
      translate: (x, y) => doc.translate(x, y),
      rotate: (angle) => doc.rotate(angle),
      
      // Line dash
      setLineDash: (segments) => {
        if (segments.length > 0) {
          doc.dash(segments);
        } else {
          doc.undash();
        }
      },
      
      // Helper method
      hexToRgb: (hex) => {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
          r: parseInt(result[1], 16),
          g: parseInt(result[2], 16),
          b: parseInt(result[3], 16)
        } : { r: 0, g: 0, b: 0 };
      }
    };
  }

  // Draw rectangle
  drawRectangle(doc, element) {
    const fillColor = pdfOptimizer.hexToRgb(element.fillColor);
    const strokeColor = pdfOptimizer.hexToRgb(element.strokeColor);

    // Fill rectangle
    doc.rect(element.x, element.y, element.width, element.height)
       .fillColor(fillColor.r, fillColor.g, fillColor.b)
       .fill();

    // Stroke rectangle if stroke width > 0
    if (element.strokeWidth > 0) {
      doc.rect(element.x, element.y, element.width, element.height)
         .strokeColor(strokeColor.r, strokeColor.g, strokeColor.b)
         .lineWidth(element.strokeWidth)
         .stroke();
    }
  }

  // Draw circle
  drawCircle(doc, element) {
    const fillColor = pdfOptimizer.hexToRgb(element.fillColor);
    const strokeColor = pdfOptimizer.hexToRgb(element.strokeColor);

    // Fill circle
    doc.circle(element.x, element.y, element.radius)
       .fillColor(fillColor.r, fillColor.g, fillColor.b)
       .fill();

    // Stroke circle if stroke width > 0
    if (element.strokeWidth > 0) {
      doc.circle(element.x, element.y, element.radius)
         .strokeColor(strokeColor.r, strokeColor.g, strokeColor.b)
         .lineWidth(element.strokeWidth)
         .stroke();
    }
  }

  // Draw text with enhanced position and color handling
  drawText(doc, element) {
    // Optimize text element for better rendering
    const optimizedElement = pdfOptimizer.optimizeTextElement(
      element, 
      this.canvasData.width, 
      this.canvasData.height
    );

    // Validate and convert color
    const validColor = pdfOptimizer.validateColor(optimizedElement.fillColor);
    const textColor = pdfOptimizer.hexToRgb(validColor);
    
    // Set font properties
    doc.fontSize(optimizedElement.fontSize)
       .font(optimizedElement.fontFamily || 'Helvetica')
       .fillColor(textColor.r, textColor.g, textColor.b);

    // Draw text at optimized position
    doc.text(optimizedElement.text, optimizedElement.x, optimizedElement.y);

    // Log positioning info for debugging
    console.log(`Drawing text "${optimizedElement.text}" at (${optimizedElement.x}, ${optimizedElement.y}) with color ${validColor}`);
  }

  // Draw image
  drawImage(doc, element) {
    try {
      // Check if image file exists (for local files)
      if (fs.existsSync(element.imagePath)) {
        doc.image(element.imagePath, element.x, element.y, {
          width: element.width,
          height: element.height
        });
      } else {
        // Draw placeholder for missing images
        this.drawImagePlaceholder(doc, element);
      }
    } catch (imageError) {
      console.log('Image drawing error:', imageError.message);
      // Draw placeholder for failed images
      this.drawImagePlaceholder(doc, element);
    }
  }

  // Draw image placeholder
  drawImagePlaceholder(doc, element) {
    // Gray background
    doc.rect(element.x, element.y, element.width, element.height)
       .fillColor(220, 220, 220)
       .fill()
       .strokeColor(150, 150, 150)
       .lineWidth(1)
       .stroke();

    // "IMAGE" text in center
    const textX = element.x + element.width / 2;
    const textY = element.y + element.height / 2 - 6;
    
    doc.fontSize(12)
       .fillColor(100, 100, 100)
       .text('IMAGE', textX - 20, textY);
  }

  // Get canvas statistics
  getCanvasStats() {
    return {
      width: this.canvasData.width,
      height: this.canvasData.height,
      elementCount: this.canvasData.elements.length,
      elementTypes: this.canvasData.elements.reduce((acc, element) => {
        acc[element.type] = (acc[element.type] || 0) + 1;
        return acc;
      }, {})
    };
  }

  // Update element by index
  updateElement(index, updates) {
    if (index < 0 || index >= this.canvasData.elements.length) {
      throw new Error('Element index out of bounds');
    }
    
    this.canvasData.elements[index] = { ...this.canvasData.elements[index], ...updates };
    return this.canvasData.elements[index];
  }

  // Delete element by index
  deleteElement(index) {
    if (index < 0 || index >= this.canvasData.elements.length) {
      throw new Error('Element index out of bounds');
    }
    
    const deletedElement = this.canvasData.elements.splice(index, 1)[0];
    return deletedElement;
  }

  // Reorder element (bring to front/back)
  reorderElement(index, direction) {
    if (index < 0 || index >= this.canvasData.elements.length) {
      throw new Error('Element index out of bounds');
    }
    
    const element = this.canvasData.elements[index];
    let newIndex = index;
    
    switch (direction) {
      case 'front':
        // Move to end (top layer)
        this.canvasData.elements.splice(index, 1);
        this.canvasData.elements.push(element);
        newIndex = this.canvasData.elements.length - 1;
        break;
        
      case 'back':
        // Move to beginning (bottom layer)
        this.canvasData.elements.splice(index, 1);
        this.canvasData.elements.unshift(element);
        newIndex = 0;
        break;
        
      case 'forward':
        // Move one step forward
        if (index < this.canvasData.elements.length - 1) {
          this.canvasData.elements.splice(index, 1);
          this.canvasData.elements.splice(index + 1, 0, element);
          newIndex = index + 1;
        }
        break;
        
      case 'backward':
        // Move one step backward
        if (index > 0) {
          this.canvasData.elements.splice(index, 1);
          this.canvasData.elements.splice(index - 1, 0, element);
          newIndex = index - 1;
        }
        break;
        
      default:
        throw new Error('Invalid direction. Use: front, back, forward, backward');
    }
    
    return { element, newIndex };
  }

  // Get element by index
  getElement(index) {
    if (index < 0 || index >= this.canvasData.elements.length) {
      throw new Error('Element index out of bounds');
    }
    
    return this.canvasData.elements[index];
  }

  // Find elements at position (for selection)
  getElementsAtPosition(x, y) {
    const elementsAtPosition = [];
    
    this.canvasData.elements.forEach((element, index) => {
      if (this.isPointInElement(x, y, element)) {
        elementsAtPosition.push({ id: index, ...element });
      }
    });
    
    return elementsAtPosition;
  }

  // Check if point is inside element bounds
  isPointInElement(x, y, element) {
    switch (element.type) {
      case 'rectangle':
      case 'image':
        return x >= element.x && 
               x <= element.x + element.width && 
               y >= element.y && 
               y <= element.y + element.height;
               
      case 'circle':
        const distance = Math.sqrt(
          Math.pow(x - element.x, 2) + Math.pow(y - element.y, 2)
        );
        return distance <= element.radius;

      case 'ellipse':
        const dx = (x - element.x) / element.radiusX;
        const dy = (y - element.y) / element.radiusY;
        return (dx * dx + dy * dy) <= 1;
        
      case 'line':
        return this.isPointNearLine(x, y, element.x, element.y, element.x2, element.y2, element.strokeWidth || 2);

      case 'arrow':
        // Use bounding box for arrows
        const arrowBounds = this.getArrowBounds(element);
        return x >= arrowBounds.left && x <= arrowBounds.right && 
               y >= arrowBounds.top && y <= arrowBounds.bottom;

      case 'triangle':
        return this.isPointInTriangle(x, y, element.x, element.y, element.x2, element.y2, element.x3, element.y3);

      case 'star':
        const starDistance = Math.sqrt(
          Math.pow(x - element.x, 2) + Math.pow(y - element.y, 2)
        );
        return starDistance <= element.outerRadius;

      case 'polygon':
        if (!element.points || element.points.length < 3) return false;
        return this.isPointInPolygon(x, y, element.points);

      case 'path':
        // Use bounding box for paths
        const pathBounds = this.getPathBounds(element);
        return x >= pathBounds.left && x <= pathBounds.right && 
               y >= pathBounds.top && y <= pathBounds.bottom;
        
      case 'text':
        // Rough text bounds estimation
        const textWidth = element.text.length * element.fontSize * 0.6;
        const textHeight = element.fontSize;
        return x >= element.x && 
               x <= element.x + textWidth && 
               y >= element.y - textHeight && 
               y <= element.y;
               
      default:
        return false;
    }
  }

  // Helper methods for advanced hit testing
  isPointNearLine(px, py, x1, y1, x2, y2, threshold = 5) {
    const A = px - x1;
    const B = py - y1;
    const C = x2 - x1;
    const D = y2 - y1;

    const dot = A * C + B * D;
    const lenSq = C * C + D * D;
    
    if (lenSq === 0) return Math.sqrt(A * A + B * B) <= threshold;

    let param = dot / lenSq;
    param = Math.max(0, Math.min(1, param));

    const xx = x1 + param * C;
    const yy = y1 + param * D;

    const dx = px - xx;
    const dy = py - yy;
    return Math.sqrt(dx * dx + dy * dy) <= threshold;
  }

  isPointInTriangle(px, py, x1, y1, x2, y2, x3, y3) {
    const denom = (y2 - y3) * (x1 - x3) + (x3 - x2) * (y1 - y3);
    if (Math.abs(denom) < 0.000001) return false;

    const a = ((y2 - y3) * (px - x3) + (x3 - x2) * (py - y3)) / denom;
    const b = ((y3 - y1) * (px - x3) + (x1 - x3) * (py - y3)) / denom;
    const c = 1 - a - b;

    return a >= 0 && b >= 0 && c >= 0;
  }

  isPointInPolygon(px, py, points) {
    let inside = false;
    
    for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
      if (((points[i].y > py) !== (points[j].y > py)) &&
          (px < (points[j].x - points[i].x) * (py - points[i].y) / (points[j].y - points[i].y) + points[i].x)) {
        inside = !inside;
      }
    }
    
    return inside;
  }

  getArrowBounds(element) {
    const padding = Math.max(element.headWidth || 10, element.bodyWidth || 4) / 2;
    return {
      left: Math.min(element.x, element.x2) - padding,
      top: Math.min(element.y, element.y2) - padding,
      right: Math.max(element.x, element.x2) + padding,
      bottom: Math.max(element.y, element.y2) + padding
    };
  }

  getPathBounds(element) {
    if (!element.pathData || element.pathData.length === 0) {
      return { left: element.x || 0, top: element.y || 0, right: element.x || 0, bottom: element.y || 0 };
    }

    const points = element.pathData.filter(cmd => cmd.x !== undefined && cmd.y !== undefined);
    if (points.length === 0) {
      return { left: 0, top: 0, right: 0, bottom: 0 };
    }

    const xs = points.map(p => p.x);
    const ys = points.map(p => p.y);
    
    return {
      left: Math.min(...xs),
      top: Math.min(...ys),
      right: Math.max(...xs),
      bottom: Math.max(...ys)
    };
  }

  // Calculate how to move an element based on its type
  calculateElementMove(element, newX, newY) {
    const clampedX = Math.max(0, Math.min(newX, this.canvasData.width));
    const clampedY = Math.max(0, Math.min(newY, this.canvasData.height));
    
    const updates = { x: clampedX, y: clampedY };
    
    switch (element.type) {
      case 'rectangle':
      case 'circle':
      case 'ellipse':
      case 'star':
      case 'text':
      case 'image':
        // Simple position update
        break;
        
      case 'line':
      case 'arrow':
        // Move both start and end points by the same offset
        const deltaX = clampedX - element.x;
        const deltaY = clampedY - element.y;
        updates.x2 = element.x2 + deltaX;
        updates.y2 = element.y2 + deltaY;
        break;
        
      case 'triangle':
        // Move all three points by the same offset
        const triDeltaX = clampedX - element.x;
        const triDeltaY = clampedY - element.y;
        updates.x2 = element.x2 + triDeltaX;
        updates.y2 = element.y2 + triDeltaY;
        updates.x3 = element.x3 + triDeltaX;
        updates.y3 = element.y3 + triDeltaY;
        break;
        
      case 'polygon':
        // Move all points by the same offset
        if (element.points && element.points.length > 0) {
          const polyDeltaX = clampedX - element.x;
          const polyDeltaY = clampedY - element.y;
          updates.points = element.points.map(point => ({
            x: point.x + polyDeltaX,
            y: point.y + polyDeltaY
          }));
        }
        break;
        
      case 'path':
        // Move all path points by the same offset
        if (element.pathData && element.pathData.length > 0) {
          const pathDeltaX = clampedX - (element.x || 0);
          const pathDeltaY = clampedY - (element.y || 0);
          updates.pathData = element.pathData.map(cmd => {
            const newCmd = { ...cmd };
            if (cmd.x !== undefined) newCmd.x = cmd.x + pathDeltaX;
            if (cmd.y !== undefined) newCmd.y = cmd.y + pathDeltaY;
            if (cmd.cp1x !== undefined) newCmd.cp1x = cmd.cp1x + pathDeltaX;
            if (cmd.cp1y !== undefined) newCmd.cp1y = cmd.cp1y + pathDeltaY;
            if (cmd.cp2x !== undefined) newCmd.cp2x = cmd.cp2x + pathDeltaX;
            if (cmd.cp2y !== undefined) newCmd.cp2y = cmd.cp2y + pathDeltaY;
            if (cmd.cpx !== undefined) newCmd.cpx = cmd.cpx + pathDeltaX;
            if (cmd.cpy !== undefined) newCmd.cpy = cmd.cpy + pathDeltaY;
            return newCmd;
          });
        }
        break;
    }
    
    return updates;
  }}


module.exports = new CanvasService();