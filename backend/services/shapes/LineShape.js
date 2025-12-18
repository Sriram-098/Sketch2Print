const BaseShape = require('./BaseShape');

class LineShape extends BaseShape {
  setProperties(properties) {
    this.x2 = parseInt(properties.x2) || this.x + 100;
    this.y2 = parseInt(properties.y2) || this.y;
    this.lineCap = properties.lineCap || 'butt'; // 'butt', 'round', 'square'
    this.lineDash = properties.lineDash || []; // Array for dashed lines
  }

  draw(ctx) {
    this.applyTransform(ctx);
    
    ctx.beginPath();
    ctx.moveTo(this.x, this.y);
    ctx.lineTo(this.x2, this.y2);
    
    this.setStrokeStyle(ctx);
    ctx.lineCap = this.lineCap;
    
    if (this.lineDash.length > 0) {
      ctx.setLineDash(this.lineDash);
    }
    
    ctx.stroke();
    
    // Reset line dash
    if (this.lineDash.length > 0) {
      ctx.setLineDash([]);
    }
    
    this.restoreTransform(ctx);
  }

  getBounds() {
    const minX = Math.min(this.x, this.x2);
    const maxX = Math.max(this.x, this.x2);
    const minY = Math.min(this.y, this.y2);
    const maxY = Math.max(this.y, this.y2);
    
    return {
      left: minX - this.strokeWidth / 2,
      top: minY - this.strokeWidth / 2,
      right: maxX + this.strokeWidth / 2,
      bottom: maxY + this.strokeWidth / 2,
      width: maxX - minX + this.strokeWidth,
      height: maxY - minY + this.strokeWidth
    };
  }

  isPointInside(x, y) {
    // Distance from point to line
    const A = this.y2 - this.y;
    const B = this.x - this.x2;
    const C = this.x2 * this.y - this.x * this.y2;
    
    const distance = Math.abs(A * x + B * y + C) / Math.sqrt(A * A + B * B);
    return distance <= this.strokeWidth / 2 + 2; // Add small tolerance
  }

  getAdditionalProperties() {
    return {
      x2: this.x2,
      y2: this.y2,
      lineCap: this.lineCap,
      lineDash: this.lineDash
    };
  }

  static getSchema() {
    const baseSchema = BaseShape.getSchema();
    return {
      ...baseSchema,
      properties: {
        ...baseSchema.properties,
        x2: { type: 'number', default: 100 },
        y2: { type: 'number', default: 0 },
        lineCap: { type: 'string', enum: ['butt', 'round', 'square'], default: 'butt' },
        lineDash: { type: 'array', items: { type: 'number' }, default: [] }
      }
    };
  }
}

module.exports = LineShape;