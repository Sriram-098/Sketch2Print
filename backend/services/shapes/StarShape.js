const BaseShape = require('./BaseShape');

class StarShape extends BaseShape {
  setProperties(properties) {
    this.outerRadius = parseInt(properties.outerRadius) || 50;
    this.innerRadius = parseInt(properties.innerRadius) || 25;
    this.points = parseInt(properties.points) || 5;
  }

  draw(ctx) {
    this.applyTransform(ctx);
    
    const angleStep = Math.PI / this.points;
    
    ctx.beginPath();
    
    for (let i = 0; i < this.points * 2; i++) {
      const angle = i * angleStep - Math.PI / 2;
      const radius = i % 2 === 0 ? this.outerRadius : this.innerRadius;
      const x = this.x + Math.cos(angle) * radius;
      const y = this.y + Math.sin(angle) * radius;
      
      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
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
    return {
      left: this.x - this.outerRadius,
      top: this.y - this.outerRadius,
      right: this.x + this.outerRadius,
      bottom: this.y + this.outerRadius,
      width: this.outerRadius * 2,
      height: this.outerRadius * 2
    };
  }

  isPointInside(x, y) {
    // Simplified - use outer radius for hit testing
    const distance = Math.sqrt(Math.pow(x - this.x, 2) + Math.pow(y - this.y, 2));
    return distance <= this.outerRadius;
  }

  getAdditionalProperties() {
    return {
      outerRadius: this.outerRadius,
      innerRadius: this.innerRadius,
      points: this.points
    };
  }

  static getSchema() {
    const baseSchema = BaseShape.getSchema();
    return {
      ...baseSchema,
      properties: {
        ...baseSchema.properties,
        outerRadius: { type: 'number', default: 50, minimum: 5 },
        innerRadius: { type: 'number', default: 25, minimum: 1 },
        points: { type: 'number', default: 5, minimum: 3, maximum: 20 }
      }
    };
  }
}

module.exports = StarShape;