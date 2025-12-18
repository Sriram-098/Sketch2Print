# Sketch2Print Backend API

A well-structured Node.js backend API for creating canvas elements and exporting them as optimized PDF files.

## Project Structure

```
backend/
├── controllers/        → Business logic
│   └── canvasController.js
├── routes/             → API routes
│   └── canvasRoutes.js
├── services/           → Canvas & PDF logic
│   └── canvasService.js
├── utils/              → Helper functions
│   └── pdfOptimizer.js
├── uploads/            → Uploaded images
├── app.js              → Express app setup
├── server.js           → Server start file
├── package.json
└── .env
```

## Installation

```bash
cd backend
npm install
npm start
```

Server will run on `http://localhost:3001`

## API Endpoints

### Canvas Management

#### Initialize Canvas
```http
POST /api/canvas/init
Content-Type: application/json

{
  "width": 800,
  "height": 600
}
```

#### Get Canvas Data
```http
GET /api/canvas
```

#### Clear Canvas
```http
DELETE /api/canvas/clear
```

### Adding Elements

#### Add Rectangle
```http
POST /api/canvas/rectangle
Content-Type: application/json

{
  "x": 50,
  "y": 50,
  "width": 100,
  "height": 100,
  "fillColor": "#FF0000",
  "strokeColor": "#000000",
  "strokeWidth": 2
}
```

#### Add Circle
```http
POST /api/canvas/circle
Content-Type: application/json

{
  "x": 200,
  "y": 100,
  "radius": 50,
  "fillColor": "#00FF00",
  "strokeColor": "#000000",
  "strokeWidth": 2
}
```

#### Add Text (with Position and Color)
```http
POST /api/canvas/text
Content-Type: application/json

{
  "x": 100,
  "y": 150,
  "text": "Hello World",
  "fontSize": 24,
  "fontFamily": "Helvetica",
  "fillColor": "#0000FF"
}
```

**Text Parameters:**
- `x` (number): Horizontal position (0 to canvas width)
- `y` (number): Vertical position - represents text baseline (fontSize to canvas height)
- `text` (string): Text content (required)
- `fontSize` (number): Font size in pixels (8-100, default: 16)
- `fontFamily` (string): Font family (default: "Helvetica")
- `fillColor` (string): Hex color code (default: "#000000")

**Color Examples:**
- Black: `#000000`
- Red: `#FF0000`
- Blue: `#0000FF`
- Green: `#008000`
- Orange: `#FF6600`
- Purple: `#800080`
- Gray: `#808080`

**Position Guidelines:**
- Top-left corner: `{ x: 50, y: 50 }`
- Top-center: `{ x: canvasWidth/2, y: 50 }`
- Center: `{ x: canvasWidth/2, y: canvasHeight/2 }`
- Bottom-left: `{ x: 50, y: canvasHeight - 30 }`
- Bottom-right: `{ x: canvasWidth - 150, y: canvasHeight - 30 }`

#### Add Image
```http
POST /api/canvas/image
Content-Type: multipart/form-data

{
  "x": 400,
  "y": 200,
  "width": 150,
  "height": 150,
  "image": [file],
  "imageUrl": "https://example.com/image.jpg"
}
```

### Text Helper Endpoints

#### Get Text Examples and Suggestions
```http
GET /api/canvas/text/examples
```

Returns:
- Example text elements with different positions and colors
- Available color options
- Position suggestions
- Tips for text placement

#### Validate Text Position
```http
POST /api/canvas/text/validate
Content-Type: application/json

{
  "x": 100,
  "y": 150,
  "text": "Hello World",
  "fontSize": 24,
  "fillColor": "#0000FF"
}
```

Returns:
- Original element data
- Optimized element data
- Positioning recommendations
- Validation status

### Export

#### Export as PDF
```http
POST /api/canvas/export-pdf
```

Returns a downloadable PDF file with all canvas elements.

## Features

### Text Positioning
- Automatic position validation and optimization
- Boundary checking to prevent text overflow
- Position suggestions for common layouts
- Text truncation for oversized content

### Color Management
- Hex color validation
- Named color support (black, red, blue, etc.)
- Color contrast recommendations
- RGB conversion for PDF rendering

### PDF Optimization
- Automatic compression
- Element dimension optimization
- Overlap detection
- File size estimation
- Quality recommendations

## Usage Examples

### Example 1: Simple Text
```javascript
// Add centered title
POST /api/canvas/text
{
  "x": 300,
  "y": 100,
  "text": "My Canvas Title",
  "fontSize": 32,
  "fillColor": "#000000"
}
```

### Example 2: Colored Text at Different Positions
```javascript
// Top-left red text
POST /api/canvas/text
{
  "x": 50,
  "y": 50,
  "text": "Header",
  "fontSize": 20,
  "fillColor": "#FF0000"
}

// Center blue text
POST /api/canvas/text
{
  "x": 350,
  "y": 300,
  "text": "Main Content",
  "fontSize": 24,
  "fillColor": "#0000FF"
}

// Bottom-right green text
POST /api/canvas/text
{
  "x": 650,
  "y": 570,
  "text": "Footer",
  "fontSize": 16,
  "fillColor": "#008000"
}
```

### Example 3: Complete Canvas
```javascript
// 1. Initialize canvas
POST /api/canvas/init
{ "width": 800, "height": 600 }

// 2. Add background rectangle
POST /api/canvas/rectangle
{ "x": 0, "y": 0, "width": 800, "height": 600, "fillColor": "#F0F0F0" }

// 3. Add title text
POST /api/canvas/text
{ "x": 300, "y": 80, "text": "Hello World", "fontSize": 36, "fillColor": "#333333" }

// 4. Add subtitle
POST /api/canvas/text
{ "x": 280, "y": 120, "text": "Canvas to PDF Demo", "fontSize": 18, "fillColor": "#666666" }

// 5. Export to PDF
POST /api/canvas/export-pdf
```

## Environment Variables

Create a `.env` file:

```env
PORT=3001
NODE_ENV=development
MAX_FILE_SIZE=10485760
UPLOAD_DIR=./uploads
PDF_COMPRESSION=true
PDF_MAX_WIDTH=2000
PDF_MAX_HEIGHT=2000
CORS_ORIGIN=http://localhost:5173
```

## Error Handling

All endpoints return appropriate HTTP status codes:
- `200` - Success
- `400` - Bad Request (validation errors)
- `500` - Internal Server Error

Error response format:
```json
{
  "error": "Error message description"
}
```

## Tips for Best Results

1. **Text Positioning:**
   - Y coordinate represents the text baseline
   - Add fontSize to Y position to avoid top cutoff
   - Leave margins (10-50px) from canvas edges

2. **Color Selection:**
   - Use high contrast colors for readability
   - Avoid white text on white background
   - Test color combinations before final export

3. **Font Sizing:**
   - Keep font size between 12-48px for best results
   - Scale font size relative to canvas dimensions
   - Larger canvas = larger fonts work better

4. **Performance:**
   - Limit elements to under 100 for optimal performance
   - Use appropriate canvas dimensions (max 2000x2000)
   - Compress images before uploading

## Dependencies

- `express` - Web framework
- `cors` - CORS middleware
- `multer` - File upload handling
- `pdfkit` - PDF generation

## License

MIT