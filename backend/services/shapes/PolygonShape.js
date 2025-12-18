const BaseShape = require('./BaseShape');

class PolygonShape extends BaseShape {
  setProperties(properties) {
    // Array of points [{x, y}, {x, y}, ...]
    this.points = properties.points || [
      { x: this.x, y: this.y },
      { x: this.x + 50, y: this.y + 50 },
      { x: this.x - 50, y: this.y + 50 }
    ];
    
    // Ensure points are properly formatted
    this.points = this.points.map(point => ({
      x: parseInt(point.x) || 0,
      y: parseInt(point.y) || 0
    }));
  }

  draw(ctx) {
    if (this.points.length < 3) return;
    
    this.applyTransform(ctx);
    
    ctx.beginPath();
    ctx.moveTo(this.points[0].x, this.points[0].y);
    
    for (let i = 1; i < this.points.length; i++) {
      ctx.lineTo(this.points[i].x, this.points[i].y);
    }
    
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
    if (this.points.length === 0) {
      return { left: this.x, top: this.y, right: this.x, bottom: this.y, width: 0, height: 0 };
    }
    
    const xs = this.points.map(p => p.x);
    const ys = this.points.map(p => p.y);
    
    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    const minY = Math.min(...ys);
    const maxY = Math.max(...ys);
    
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
    // Ray casting algorithm
    let inside = false;
    const points = this.points;
    
    for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
      if (((points[i].y > y) !== (points[j].y > y)) &&
          (x < (points[j].x - points[i].x) * (y - points[i].y) / (points[j].y - points[i].y) + points[i].x)) {
        inside = !inside;
      }
    }
    
    return inside;
  }

  getAdditionalProperties() {
    return {
      points: this.points
    };
  }

  static getSchema() {
    const baseSchema = BaseShape.getSchema();
    return {
      ...baseSchema,
      properties: {
        ...baseSchema.properties,
        points: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              x: { type: 'number' },
              y: { type: 'number' }
            },
            required: ['x', 'y']
          },
          minItems: 3,
          default: [
            { x: 0, y: 0 },
            { x: 50, y: 50 },
            { x: -50, y: 50 }
          ]
        }
      }
    };
  }
}

module.exports = PolygonShape;