const BaseShape = require('./BaseShape');

class RectangleShape extends BaseShape {
  setProperties(properties) {
    this.width = parseInt(properties.width) || 100;
    this.height = parseInt(properties.height) || 100;
    this.cornerRadius = parseInt(properties.cornerRadius) || 0;
  }

  draw(ctx) {
    this.applyTransform(ctx);
    
    if (this.cornerRadius > 0) {
      this.drawRoundedRect(ctx);
    } else {
      this.setFillStyle(ctx);
      ctx.fillRect(this.x, this.y, this.width, this.height);
      
      if (this.strokeWidth > 0) {
        this.setStrokeStyle(ctx);
        ctx.strokeRect(this.x, this.y, this.width, this.height);
      }
    }
    
    this.restoreTransform(ctx);
  }

  drawRoundedRect(ctx) {
    const radius = Math.min(this.cornerRadius, this.width / 2, this.height / 2);
    
    ctx.beginPath();
    ctx.moveTo(this.x + radius, this.y);
    ctx.lineTo(this.x + this.width - radius, this.y);
    ctx.quadraticCurveTo(this.x + this.width, this.y, this.x + this.width, this.y + radius);
    ctx.lineTo(this.x + this.width, this.y + this.height - radius);
    ctx.quadraticCurveTo(this.x + this.width, this.y + this.height, this.x + this.width - radius, this.y + this.height);
    ctx.lineTo(this.x + radius, this.y + this.height);
    ctx.quadraticCurveTo(this.x, this.y + this.height, this.x, this.y + this.height - radius);
    ctx.lineTo(this.x, this.y + radius);
    ctx.quadraticCurveTo(this.x, this.y, this.x + radius, this.y);
    ctx.closePath();
    
    this.setFillStyle(ctx);
    ctx.fill();
    
    if (this.strokeWidth > 0) {
      this.setStrokeStyle(ctx);
      ctx.stroke();
    }
  }

  getBounds() {
    return {
      left: this.x,
      top: this.y,
      right: this.x + this.width,
      bottom: this.y + this.height,
      width: this.width,
      height: this.height
    };
  }

  isPointInside(x, y) {
    return x >= this.x && x <= this.x + this.width && 
           y >= this.y && y <= this.y + this.height;
  }

  getAdditionalProperties() {
    return {
      width: this.width,
      height: this.height,
      cornerRadius: this.cornerRadius
    };
  }

  static getSchema() {
    const baseSchema = BaseShape.getSchema();
    return {
      ...baseSchema,
      properties: {
        ...baseSchema.properties,
        width: { type: 'number', default: 100, minimum: 1 },
        height: { type: 'number', default: 100, minimum: 1 },
        cornerRadius: { type: 'number', default: 0, minimum: 0 }
      }
    };
  }
}

module.exports = RectangleShape;