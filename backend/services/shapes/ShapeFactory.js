const RectangleShape = require('./RectangleShape');
const CircleShape = require('./CircleShape');
const LineShape = require('./LineShape');
const TriangleShape = require('./TriangleShape');
const PolygonShape = require('./PolygonShape');
const PathShape = require('./PathShape');
const EllipseShape = require('./EllipseShape');
const ArrowShape = require('./ArrowShape');
const StarShape = require('./StarShape');

class ShapeFactory {
  constructor() {
    this.shapes = new Map();
    this.registerDefaultShapes();
  }

  registerDefaultShapes() {
    this.registerShape('rectangle', RectangleShape);
    this.registerShape('circle', CircleShape);
    this.registerShape('line', LineShape);
    this.registerShape('triangle', TriangleShape);
    this.registerShape('polygon', PolygonShape);
    this.registerShape('path', PathShape);
    this.registerShape('ellipse', EllipseShape);
    this.registerShape('arrow', ArrowShape);
    this.registerShape('star', StarShape);
  }

  registerShape(type, ShapeClass) {
    this.shapes.set(type, ShapeClass);
  }

  createShape(type, properties) {
    const ShapeClass = this.shapes.get(type);
    
    if (!ShapeClass) {
      throw new Error(`Unknown shape type: ${type}`);
    }

    return new ShapeClass(properties);
  }

  getSupportedShapes() {
    return Array.from(this.shapes.keys());
  }

  getShapeSchema(type) {
    const ShapeClass = this.shapes.get(type);
    return ShapeClass ? ShapeClass.getSchema() : null;
  }

  getAllSchemas() {
    const schemas = {};
    this.shapes.forEach((ShapeClass, type) => {
      schemas[type] = ShapeClass.getSchema();
    });
    return schemas;
  }
}

module.exports = new ShapeFactory();