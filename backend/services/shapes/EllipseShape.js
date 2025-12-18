const BaseShape = require('./BaseShape');

class EllipseShape extends BaseShape {
  setProperties(properties) {
    this.radiusX = parseInt(properties.radiusX) || 50;
    this.radiusY = parseInt(properties.radiusY) || 30;
  }

  draw(ctx) {
    this.applyTransform(ctx);
    
    ctx.beginPath();
    ctx.ellipse(this.x, this.y, this.radiusX, this.radiusY, 0, 0, 2 * Math.PI);
    
    this.setFillStyle(ctx);
    ctx.fill();
    
    if (this.strokeWidth > 0) {
      this.setStrokeStyle(ctx);
      ctx.stroke();
    }
    
    this.restoreTransform(ctx);
  }

  getBounds() {
    return {
      left: this.x - this.radiusX,
      top: this.y - this.radiusY,
      right: this.x + this.radiusX,
      bottom: this.y + this.radiusY,
      width: this.radiusX * 2,
      height: this.radiusY * 2
    };
  }

  isPointInside(x, y) {
    const dx = (x - this.x) / this.radiusX;
    const dy = (y - this.y) / this.radiusY;
    return (dx * dx + dy * dy) <= 1;
  }

  getAdditionalProperties() {
    return {
      radiusX: this.radiusX,
      radiusY: this.radiusY
    };
  }

  static getSchema() {
    const baseSchema = BaseShape.getSchema();
    return {
      ...baseSchema,
      properties: {
        ...baseSchema.properties,
        radiusX: { type: 'number', default: 50, minimum: 1 },
        radiusY: { type: 'number', default: 30, minimum: 1 }
      }
    };
  }
}

module.exports = EllipseShape;