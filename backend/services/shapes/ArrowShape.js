const BaseShape = require('./BaseShape');

class ArrowShape extends BaseShape {
  setProperties(properties) {
    this.x2 = parseInt(properties.x2) || this.x + 100;
    this.y2 = parseInt(properties.y2) || this.y;
    this.headLength = parseInt(properties.headLength) || 20;
    this.headWidth = parseInt(properties.headWidth) || 10;
    this.bodyWidth = parseInt(properties.bodyWidth) || 4;
  }

  draw(ctx) {
    this.applyTransform(ctx);
    
    const angle = Math.atan2(this.y2 - this.y, this.x2 - this.x);
    const length = Math.sqrt(Math.pow(this.x2 - this.x, 2) + Math.pow(this.y2 - this.y, 2));
    
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(angle);
    
    // Draw arrow body
    ctx.beginPath();
    ctx.rect(0, -this.bodyWidth / 2, length - this.headLength, this.bodyWidth);
    this.setFillStyle(ctx);
    ctx.fill();
    
    if (this.strokeWidth > 0) {
      this.setStrokeStyle(ctx);
      ctx.stroke();
    }
    
    // Draw arrow head
    ctx.beginPath();
    ctx.moveTo(length - this.headLength, -this.headWidth / 2);
    ctx.lineTo(length, 0);
    ctx.lineTo(length - this.headLength, this.headWidth / 2);
    ctx.closePath();
    
    this.setFillStyle(ctx);
    ctx.fill();
    
    if (this.strokeWidth > 0) {
      this.setStrokeStyle(ctx);
      ctx.stroke();
    }
    
    ctx.restore();
    this.restoreTransform(ctx);
  }

  getBounds() {
    const minX = Math.min(this.x, this.x2);
    const maxX = Math.max(this.x, this.x2);
    const minY = Math.min(this.y, this.y2) - this.headWidth / 2;
    const maxY = Math.max(this.y, this.y2) + this.headWidth / 2;
    
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
    // Simplified hit testing - use bounding box
    const bounds = this.getBounds();
    return x >= bounds.left && x <= bounds.right && y >= bounds.top && y <= bounds.bottom;
  }

  getAdditionalProperties() {
    return {
      x2: this.x2,
      y2: this.y2,
      headLength: this.headLength,
      headWidth: this.headWidth,
      bodyWidth: this.bodyWidth
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
        headLength: { type: 'number', default: 20, minimum: 5 },
        headWidth: { type: 'number', default: 10, minimum: 2 },
        bodyWidth: { type: 'number', default: 4, minimum: 1 }
      }
    };
  }
}

module.exports = ArrowShape;