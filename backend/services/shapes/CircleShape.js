const BaseShape = require('./BaseShape');

class CircleShape extends BaseShape {
  setProperties(properties) {
    this.radius = parseInt(properties.radius) || 50;
  }

  draw(ctx) {
    this.applyTransform(ctx);
    
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, 2 * Math.PI);
    
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
      left: this.x - this.radius,
      top: this.y - this.radius,
      right: this.x + this.radius,
      bottom: this.y + this.radius,
      width: this.radius * 2,
      height: this.radius * 2
    };
  }

  isPointInside(x, y) {
    const distance = Math.sqrt(Math.pow(x - this.x, 2) + Math.pow(y - this.y, 2));
    return distance <= this.radius;
  }

  getAdditionalProperties() {
    return {
      radius: this.radius
    };
  }

  static getSchema() {
    const baseSchema = BaseShape.getSchema();
    return {
      ...baseSchema,
      properties: {
        ...baseSchema.properties,
        radius: { type: 'number', default: 50, minimum: 1 }
      }
    };
  }
}

module.exports = CircleShape;