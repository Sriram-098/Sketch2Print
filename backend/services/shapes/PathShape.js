const BaseShape = require('./BaseShape');

class PathShape extends BaseShape {
  setProperties(properties) {
    // Array of path commands: [{type: 'moveTo', x, y}, {type: 'lineTo', x, y}, {type: 'bezierCurveTo', cp1x, cp1y, cp2x, cp2y, x, y}]
    this.pathData = properties.pathData || [];
    this.closed = properties.closed || false;
    this.smoothing = parseFloat(properties.smoothing) || 0; // 0-1 for path smoothing
  }

  draw(ctx) {
    if (this.pathData.length === 0) return;
    
    this.applyTransform(ctx);
    
    ctx.beginPath();
    
    for (const command of this.pathData) {
      this.executePathCommand(ctx, command);
    }
    
    if (this.closed) {
      ctx.closePath();
    }
    
    // Fill if it's a closed path
    if (this.closed) {
      this.setFillStyle(ctx);
      ctx.fill();
    }
    
    if (this.strokeWidth > 0) {
      this.setStrokeStyle(ctx);
      ctx.stroke();
    }
    
    this.restoreTransform(ctx);
  }

  executePathCommand(ctx, command) {
    switch (command.type) {
      case 'moveTo':
        ctx.moveTo(command.x, command.y);
        break;
      case 'lineTo':
        ctx.lineTo(command.x, command.y);
        break;
      case 'bezierCurveTo':
        ctx.bezierCurveTo(command.cp1x, command.cp1y, command.cp2x, command.cp2y, command.x, command.y);
        break;
      case 'quadraticCurveTo':
        ctx.quadraticCurveTo(command.cpx, command.cpy, command.x, command.y);
        break;
      case 'arc':
        ctx.arc(command.x, command.y, command.radius, command.startAngle, command.endAngle, command.counterclockwise);
        break;
    }
  }

  getBounds() {
    if (this.pathData.length === 0) {
      return { left: this.x, top: this.y, right: this.x, bottom: this.y, width: 0, height: 0 };
    }
    
    const points = this.pathData.filter(cmd => cmd.x !== undefined && cmd.y !== undefined);
    if (points.length === 0) {
      return { left: this.x, top: this.y, right: this.x, bottom: this.y, width: 0, height: 0 };
    }
    
    const xs = points.map(p => p.x);
    const ys = points.map(p => p.y);
    
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
    // For paths, we'll use a simple bounding box check
    // More complex hit testing would require path analysis
    const bounds = this.getBounds();
    return x >= bounds.left && x <= bounds.right && y >= bounds.top && y <= bounds.bottom;
  }

  // Helper method to create smooth paths from points
  static createSmoothPath(points, smoothing = 0.3) {
    if (points.length < 2) return [];
    
    const pathData = [];
    pathData.push({ type: 'moveTo', x: points[0].x, y: points[0].y });
    
    for (let i = 1; i < points.length; i++) {
      if (smoothing > 0 && i > 0 && i < points.length - 1) {
        // Create smooth curves
        const prev = points[i - 1];
        const curr = points[i];
        const next = points[i + 1];
        
        const cp1x = prev.x + (curr.x - prev.x) * smoothing;
        const cp1y = prev.y + (curr.y - prev.y) * smoothing;
        const cp2x = curr.x - (next.x - curr.x) * smoothing;
        const cp2y = curr.y - (next.y - curr.y) * smoothing;
        
        pathData.push({
          type: 'bezierCurveTo',
          cp1x, cp1y, cp2x, cp2y,
          x: curr.x, y: curr.y
        });
      } else {
        pathData.push({ type: 'lineTo', x: points[i].x, y: points[i].y });
      }
    }
    
    return pathData;
  }

  getAdditionalProperties() {
    return {
      pathData: this.pathData,
      closed: this.closed,
      smoothing: this.smoothing
    };
  }

  static getSchema() {
    const baseSchema = BaseShape.getSchema();
    return {
      ...baseSchema,
      properties: {
        ...baseSchema.properties,
        pathData: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              type: { type: 'string', enum: ['moveTo', 'lineTo', 'bezierCurveTo', 'quadraticCurveTo', 'arc'] },
              x: { type: 'number' },
              y: { type: 'number' }
            },
            required: ['type']
          },
          default: []
        },
        closed: { type: 'boolean', default: false },
        smoothing: { type: 'number', minimum: 0, maximum: 1, default: 0 }
      }
    };
  }
}

module.exports = PathShape;