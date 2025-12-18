const BaseShape = require('./BaseShape');

class TriangleShape extends BaseShape {
  setProperties(properties) {
    // Three points of the triangle
    this.x2 = parseInt(properties.x2) || this.x + 50;
    this.y2 = parseInt(properties.y2) || this.y + 100;
    this.x3 = parseInt(properties.x3) || this.x - 50;
    this.y3 = parseInt(properties.y3) || this.y + 100;
  }

  draw(ctx) {
    this.applyTransform(ctx);
    
    ctx.beginPath();
    ctx.moveTo(this.x, this.y);
    ctx.lineTo(this.x2, this.y2);
    ctx.lineTo(this.x3, this.y3);
    ctx.closePath();
    
    this.setFillStyle(ctx);
    ctx.fill();
    
    if (this.strokeWidth > 0) {
      this.setStrokeStyle(ctx);
      ctx.stroke();
    }
    
    this.restoreTransform(ctx);
  }

  getBounds() {
    const minX = Math.min(this.x, this.x2, this.x3);
    const maxX = Math.max(this.x, this.x2, this.x3);
    const minY = Math.min(this.y, this.y2, this.y3);
    const maxY = Math.max(this.y, this.y2, this.y3);
    
    return {
      left: minX,
      top: minY,
      right: maxX,
      bottom: maxY,
      width: maxX - minX,
      height: maxY - minY
    };
  }

  isPointInside(x, y) {
    // Use barycentric coordinates to check if point is inside triangle
    const denom = (this.y2 - this.y3) * (this.x - this.x3) + (this.x3 - this.x2) * (this.y - this.y3);
    const a = ((this.y2 - this.y3) * (x - this.x3) + (this.x3 - this.x2) * (y - this.y3)) / denom;
    const b = ((this.y3 - this.y) * (x - this.x3) + (this.x - this.x3) * (y - this.y3)) / denom;
    const c = 1 - a - b;
    
    return a >= 0 && b >= 0 && c >= 0;
  }

  getAdditionalProperties() {
    return {
      x2: this.x2,
      y2: this.y2,
      x3: this.x3,
      y3: this.y3
    };
  }

  static getSchema() {
    const baseSchema = BaseShape.getSchema();
    return {
      ...baseSchema,
      properties: {
        ...baseSchema.properties,
        x2: { type: 'number', default: 50 },
        y2: { type: 'number', default: 100 },
        x3: { type: 'number', default: -50 },
        y3: { type: 'number', default: 100 }
      }
    };
  }
}

module.exports = TriangleShape;