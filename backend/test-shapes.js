// Test script to verify shapes are working
const ShapeFactory = require('./services/shapes/ShapeFactory');

console.log('🧪 Testing Sketch2Print Shapes...\n');

try {
  // Test 1: Check supported shapes
  console.log('1. Supported shapes:', ShapeFactory.getSupportedShapes());
  
  // Test 2: Create a line shape
  console.log('\n2. Creating a line shape...');
  const lineShape = ShapeFactory.createShape('line', {
    type: 'line',
    x: 100,
    y: 100,
    x2: 200,
    y2: 150,
    strokeColor: '#ff0000',
    strokeWidth: 2
  });
  
  console.log('Line shape created:', lineShape.toJSON());
  
  // Test 3: Create other shapes
  console.log('\n3. Creating other shapes...');
  
  const rectangleShape = ShapeFactory.createShape('rectangle', {
    type: 'rectangle',
    x: 50,
    y: 50,
    width: 100,
    height: 80,
    fillColor: '#00ff00'
  });
  
  console.log('Rectangle shape created:', rectangleShape.toJSON());
  
  const circleShape = ShapeFactory.createShape('circle', {
    type: 'circle',
    x: 200,
    y: 200,
    radius: 50,
    fillColor: '#0000ff'
  });
  
  console.log('Circle shape created:', circleShape.toJSON());
  
  console.log('\n✅ All shape tests passed!');
  
} catch (error) {
  console.error('❌ Shape test failed:', error.message);
  console.error('Stack trace:', error.stack);
}