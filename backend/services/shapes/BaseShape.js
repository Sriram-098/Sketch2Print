class BaseShape {
  constructor(properties) {
    this.type = properties.type;
    this.x = parseInt(properties.x) || 0;
    this.y = parseInt(properties.y) || 0;
    this.fillColor = properties.fillColor || '#000000';
    this.strokeColor = properties.strokeColor || '#000000';
    this.strokeWidth = parseInt(properties.strokeWidth) || 1;
    this.opacity = parseFloat(properties.opacity) || 1;
    this.rotation = parseFloat(properties.rotation) || 0;
    
    // Validate and set additional properties
    this.setProperties(properties);
  }

  // Override in subclasses
  setProperties(properties) {
    // Default implementation - no additional properties
  }

  // Override in subclasses
  draw(ctx) {
    throw new Error('draw() method must be implemented by subclass');
  }

  // Override in subclasses
  getBounds() {
    throw new Error('getBounds() method must be implemented by subclass');
  }

  // Override in subclasses
  isPointInside(x, y) {
    throw new Error('isPointInside() method must be implemented by subclass');
  }

  // Override in subclasses
  static getSchema() {
    return {
      type: 'object',
      properties: {
        type: { type: 'string' },
        x: { type: 'number', default: 0 },
        y: { type: 'number', default: 0 },
        fillColor: { type: 'string', default: '#000000' },
        strokeColor: { type: 'string', default: '#000000' },
        strokeWidth: { type: 'number', default: 1, minimum: 0 },
        opacity: { type: 'number', default: 1, minimum: 0, maximum: 1 },
        rotation: { type: 'number', default: 0 }
      },
      required: ['type']
    };
  }

  // Helper methods
  applyTransform(ctx) {
    if (this.rotation !== 0) {
      ctx.save();
      ctx.translate(this.x, this.y);
      ctx.rotate(this.rotation * Math.PI / 180);
      ctx.translate(-this.x, -this.y);
    }
    
    if (this.opacity !== 1) {
      ctx.globalAlpha = this.opacity;
    }
  }

  restoreTransform(ctx) {
    if (this.rotation !== 0) {
      ctx.restore();
    }
    
    if (this.opacity !== 1) {
      ctx.globalAlpha = 1;
    }
  }

  setFillStyle(ctx) {
    ctx.fillStyle = this.fillColor;
  }

  setStrokeStyle(ctx) {
    ctx.strokeStyle = this.strokeColor;
    ctx.lineWidth = this.strokeWidth;
  }

  // Convert to JSON for storage
  toJSON() {
    return {
      type: this.type,
      x: this.x,
      y: this.y,
      fillColor: this.fillColor,
      strokeColor: this.strokeColor,
      strokeWidth: this.strokeWidth,
      opacity: this.opacity,
      rotation: this.rotation,
      ...this.getAdditionalProperties()
    };
  }

  // Override in subclasses to include additional properties
  getAdditionalProperties() {
    return {};
  }
}

module.exports = BaseShape;