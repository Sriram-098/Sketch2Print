class PDFOptimizer {
  // Convert hex color to RGB
  hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : { r: 0, g: 0, b: 0 };
  }

  // Optimize color values for PDF
  optimizeColor(color) {
    if (typeof color === 'string' && color.startsWith('#')) {
      return this.hexToRgb(color);
    }
    return { r: 0, g: 0, b: 0 };
  }

  // Calculate optimal font size for PDF
  optimizeFontSize(fontSize, canvasWidth, canvasHeight) {
    const minSize = 8;
    const maxSize = Math.min(canvasWidth, canvasHeight) / 10;
    return Math.max(minSize, Math.min(fontSize, maxSize));
  }

  // Optimize stroke width for PDF
  optimizeStrokeWidth(strokeWidth, canvasWidth, canvasHeight) {
    const maxStroke = Math.min(canvasWidth, canvasHeight) / 100;
    return Math.max(0, Math.min(strokeWidth, maxStroke));
  }

  // Validate and optimize element dimensions
  optimizeElementDimensions(element, canvasWidth, canvasHeight) {
    const optimized = { ...element };

    // Ensure element is within canvas bounds
    optimized.x = Math.max(0, Math.min(element.x, canvasWidth));
    optimized.y = Math.max(0, Math.min(element.y, canvasHeight));

    if (element.type === 'rectangle' || element.type === 'image') {
      optimized.width = Math.max(1, Math.min(element.width, canvasWidth - optimized.x));
      optimized.height = Math.max(1, Math.min(element.height, canvasHeight - optimized.y));
    }

    if (element.type === 'circle') {
      const maxRadius = Math.min(
        optimized.x,
        optimized.y,
        canvasWidth - optimized.x,
        canvasHeight - optimized.y
      );
      optimized.radius = Math.max(1, Math.min(element.radius, maxRadius));
    }

    if (element.type === 'text') {
      optimized.fontSize = this.optimizeFontSize(element.fontSize, canvasWidth, canvasHeight);
    }

    if (element.strokeWidth !== undefined) {
      optimized.strokeWidth = this.optimizeStrokeWidth(element.strokeWidth, canvasWidth, canvasHeight);
    }

    return optimized;
  }

  // Compress and optimize canvas data for PDF generation
  optimizeCanvasForPDF(canvasData) {
    const optimized = {
      width: Math.max(100, Math.min(canvasData.width, 2000)),
      height: Math.max(100, Math.min(canvasData.height, 2000)),
      elements: []
    };

    // Optimize each element
    canvasData.elements.forEach(element => {
      try {
        const optimizedElement = this.optimizeElementDimensions(
          element, 
          optimized.width, 
          optimized.height
        );
        optimized.elements.push(optimizedElement);
      } catch (error) {
        console.log('Error optimizing element:', error.message);
      }
    });

    return optimized;
  }

  // Calculate estimated PDF file size
  estimatePDFSize(canvasData) {
    const baseSize = 1024; // Base PDF overhead in bytes
    const pixelSize = canvasData.width * canvasData.height * 0.1; // Rough estimate
    const elementSize = canvasData.elements.length * 100; // Per element overhead
    
    return Math.round(baseSize + pixelSize + elementSize);
  }

  // Get optimization recommendations
  getOptimizationRecommendations(canvasData) {
    const recommendations = [];

    // Check canvas size
    if (canvasData.width > 1200 || canvasData.height > 1200) {
      recommendations.push('Consider reducing canvas dimensions for smaller file size');
    }

    // Check element count
    if (canvasData.elements.length > 50) {
      recommendations.push('Large number of elements may increase processing time');
    }

    // Check for overlapping elements
    const overlapping = this.detectOverlappingElements(canvasData.elements);
    if (overlapping.length > 0) {
      recommendations.push('Some elements may be overlapping and hidden');
    }

    return recommendations;
  }

  // Detect overlapping elements (simplified)
  detectOverlappingElements(elements) {
    const overlapping = [];
    
    for (let i = 0; i < elements.length; i++) {
      for (let j = i + 1; j < elements.length; j++) {
        if (this.elementsOverlap(elements[i], elements[j])) {
          overlapping.push({ element1: i, element2: j });
        }
      }
    }
    
    return overlapping;
  }

  // Check if two elements overlap (simplified)
  elementsOverlap(element1, element2) {
    // Simple bounding box overlap check
    const bounds1 = this.getElementBounds(element1);
    const bounds2 = this.getElementBounds(element2);

    return !(bounds1.right < bounds2.left || 
             bounds2.right < bounds1.left || 
             bounds1.bottom < bounds2.top || 
             bounds2.bottom < bounds1.top);
  }

  // Optimize text element with position and color validation
  optimizeTextElement(element, canvasWidth, canvasHeight) {
    const optimized = { ...element };

    // Validate and optimize position
    optimized.x = Math.max(0, Math.min(element.x || 0, canvasWidth - 10));
    optimized.y = Math.max(element.fontSize || 16, Math.min(element.y || 16, canvasHeight));

    // Validate and optimize color
    if (element.fillColor) {
      const colorRgb = this.hexToRgb(element.fillColor);
      optimized.fillColor = element.fillColor;
      optimized.colorRgb = colorRgb;
    } else {
      optimized.fillColor = '#000000';
      optimized.colorRgb = { r: 0, g: 0, b: 0 };
    }

    // Validate text content
    optimized.text = element.text || 'Hello World';

    // Optimize font size based on canvas size
    optimized.fontSize = this.optimizeFontSize(element.fontSize || 16, canvasWidth, canvasHeight);

    // Ensure text fits within canvas bounds
    const estimatedTextWidth = optimized.text.length * optimized.fontSize * 0.6;
    if (optimized.x + estimatedTextWidth > canvasWidth) {
      // Adjust position or truncate text if needed
      const maxChars = Math.floor((canvasWidth - optimized.x) / (optimized.fontSize * 0.6));
      if (maxChars < optimized.text.length) {
        optimized.text = optimized.text.substring(0, Math.max(1, maxChars - 3)) + '...';
      }
    }

    return optimized;
  }

  // Validate color format and provide fallback
  validateColor(color, fallback = '#000000') {
    if (!color) return fallback;
    
    // Check if it's a valid hex color
    const hexPattern = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
    if (hexPattern.test(color)) {
      return color;
    }
    
    // Check if it's a named color (basic support)
    const namedColors = {
      'black': '#000000',
      'white': '#FFFFFF',
      'red': '#FF0000',
      'green': '#008000',
      'blue': '#0000FF',
      'yellow': '#FFFF00',
      'orange': '#FFA500',
      'purple': '#800080',
      'pink': '#FFC0CB',
      'gray': '#808080',
      'grey': '#808080'
    };
    
    const lowerColor = color.toLowerCase();
    return namedColors[lowerColor] || fallback;
  }

  // Get text positioning recommendations
  getTextPositionRecommendations(element, canvasWidth, canvasHeight) {
    const recommendations = [];
    const estimatedWidth = element.text.length * element.fontSize * 0.6;
    const estimatedHeight = element.fontSize;

    // Check if text goes beyond canvas bounds
    if (element.x + estimatedWidth > canvasWidth) {
      recommendations.push({
        type: 'position',
        message: 'Text may extend beyond canvas width',
        suggestedX: Math.max(0, canvasWidth - estimatedWidth - 10)
      });
    }

    if (element.y < estimatedHeight) {
      recommendations.push({
        type: 'position',
        message: 'Text may be cut off at the top',
        suggestedY: estimatedHeight + 5
      });
    }

    if (element.y > canvasHeight - 5) {
      recommendations.push({
        type: 'position',
        message: 'Text may be cut off at the bottom',
        suggestedY: canvasHeight - 10
      });
    }

    // Color contrast recommendations
    if (element.fillColor === '#FFFFFF' || element.fillColor === '#ffffff') {
      recommendations.push({
        type: 'color',
        message: 'White text may not be visible on white background',
        suggestedColor: '#000000'
      });
    }

    return recommendations;
  }

  // Get element bounding box
  getElementBounds(element) {
    switch (element.type) {
      case 'rectangle':
      case 'image':
        return {
          left: element.x,
          top: element.y,
          right: element.x + element.width,
          bottom: element.y + element.height
        };
      case 'circle':
        return {
          left: element.x - element.radius,
          top: element.y - element.radius,
          right: element.x + element.radius,
          bottom: element.y + element.radius
        };
      case 'text':
        // More accurate text bounds calculation
        const textWidth = element.text.length * element.fontSize * 0.6;
        const textHeight = element.fontSize;
        return {
          left: element.x,
          top: element.y - textHeight,
          right: element.x + textWidth,
          bottom: element.y
        };
      default:
        return { left: 0, top: 0, right: 0, bottom: 0 };
    }
  }

  // Generate example text elements with different positions and colors
  generateTextExamples(canvasWidth, canvasHeight) {
    const examples = [
      {
        type: 'text',
        x: 50,
        y: 50,
        text: 'Hello World',
        fontSize: 24,
        fontFamily: 'Helvetica',
        fillColor: '#000000',
        description: 'Top-left black text'
      },
      {
        type: 'text',
        x: canvasWidth / 2 - 60,
        y: canvasHeight / 2,
        text: 'Center Text',
        fontSize: 32,
        fontFamily: 'Helvetica',
        fillColor: '#FF0000',
        description: 'Centered red text'
      },
      {
        type: 'text',
        x: canvasWidth - 150,
        y: canvasHeight - 30,
        text: 'Bottom Right',
        fontSize: 18,
        fontFamily: 'Helvetica',
        fillColor: '#0000FF',
        description: 'Bottom-right blue text'
      },
      {
        type: 'text',
        x: 100,
        y: 150,
        text: 'Colorful Text',
        fontSize: 28,
        fontFamily: 'Helvetica',
        fillColor: '#FF6600',
        description: 'Orange text'
      }
    ];

    return examples.map(example => this.optimizeTextElement(example, canvasWidth, canvasHeight));
  }
}

module.exports = new PDFOptimizer();