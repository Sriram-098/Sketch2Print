# 🎨 Sketch2Print

A powerful full-stack application that allows users to create visual elements on a canvas and export them as high-quality PDF files. Built with a modular, scalable architecture supporting 9+ different drawing types.

## ✨ Features

### **🎯 Canvas Management**
- Initialize canvas with custom dimensions (up to 2000x2000)
- Resize canvas while preserving existing elements
- Real-time preview with smooth rendering
- Element persistence across page refreshes

### **🎨 Drawing Tools (9+ Shape Types)**
- **Basic Shapes**: Rectangles, Circles, Ellipses
- **Lines & Arrows**: Straight lines with customizable caps, directional arrows
- **Complex Shapes**: Triangles, Stars (3-20 points), Custom polygons
- **Text Elements**: Multiple fonts, sizes, and colors with position control
- **Images**: Upload files or use URLs with resize capabilities
- **Free-hand Paths**: Smooth curves and custom drawings

### **🖱️ Interactive Features**
- **Drag & Drop**: Click and drag any element to reposition
- **Multi-Delete Options**: Right-click menu, double-click, keyboard shortcuts
- **Element Selection**: Visual selection with blue outline highlighting
- **Context Menus**: Right-click for Edit, Duplicate, Delete options
- **Keyboard Shortcuts**: Delete key, Escape to deselect

### **📄 PDF Export**
- High-quality PDF generation with compression
- Optimized file sizes (JPEG compression + PDF compression)
- Downloadable files with custom naming
- Preserves all visual elements and styling

### **🎮 User Experience**
- **Responsive Design**: Works on desktop, tablet, and mobile
- **Real-time Feedback**: Visual indicators and status messages
- **Error Handling**: Graceful error recovery and user notifications
- **Undo Protection**: Confirmation dialogs for destructive actions

## 🛠️ Technology Stack

- **Frontend**: React 19+ with modern JavaScript (ES6+)
- **Backend**: Node.js with Express framework
- **Canvas Rendering**: HTML5 Canvas API with server-side node-canvas
- **PDF Generation**: PDFKit with advanced compression
- **File Handling**: Multer for image uploads
- **Architecture**: Modular MVC pattern with Shape Factory design

## 🚀 Quick Start

### **Prerequisites**
- Node.js 16+ installed
- 2GB+ available disk space
- Modern web browser (Chrome, Firefox, Safari, Edge)

### **Backend Setup**

1. **Navigate to backend directory:**
   ```bash
   cd backend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start the server:**
   ```bash
   npm start
   ```
   
   ✅ Server runs on `http://localhost:3001`

### **Frontend Setup**

#### **Option 1: React Development (Recommended)**
1. **Navigate to frontend directory:**
   ```bash
   cd frontend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start development server:**
   ```bash
   npm run dev
   ```
   
   ✅ Frontend available at `http://localhost:5173`

#### **Option 2: Static HTML (Simple)**
1. **Open directly in browser:**
   ```bash
   # Navigate to frontend directory
   cd frontend
   
   # Open index.html in your browser
   # Or serve with a simple HTTP server:
   npx http-server
   ```

### **🎉 You're Ready!**
Open your browser and start creating! The application will automatically connect to the backend API.

## 🎮 How to Use

### **1. 🎯 Canvas Setup**
- **Set Dimensions**: Enter width and height (100-2000 pixels)
- **Resize Canvas**: Preserves existing elements while changing size
- **New Canvas**: Clears everything for a fresh start

### **2. 🎨 Adding Elements**

#### **Basic Shapes**
- **Rectangle**: Position (x,y), size (width,height), colors, corner radius
- **Circle**: Center position, radius, fill/stroke colors
- **Ellipse**: Center position, X/Y radius, styling options

#### **Lines & Arrows**
- **Line**: Start/end points, color, width, line caps (butt/round/square)
- **Arrow**: Start/end points, head size, body width, color

#### **Complex Shapes**
- **Triangle**: Three custom points with fill/stroke options
- **Star**: Center, outer/inner radius, number of points (3-20)
- **Polygon**: Multiple custom points for any shape

#### **Text & Images**
- **Text**: Position, content, font (Arial/Times/Courier/Helvetica), size, color
- **Images**: Upload files or use URLs, set position and size

### **3. 🖱️ Interacting with Elements**

#### **Selection & Movement**
- **Click** any element to select it (blue outline appears)
- **Drag** selected elements to new positions
- **All shape types** support drag-and-drop movement

#### **Editing Elements**
- **Right-click** → Context menu (Edit/Duplicate/Delete)
- **Double-click** → Quick delete with confirmation
- **Edit button** → Full property editor modal
- **Element list** → Manage all elements with actions

#### **Keyboard Shortcuts**
- `Delete` or `Backspace` → Delete selected element
- `Escape` → Deselect current element
- `Right-click` → Open context menu

### **4. 📄 Export Options**
- **Export as PDF**: High-quality, compressed PDF download
- **Refresh Preview**: Update canvas display
- **Clear Canvas**: Remove all elements (with confirmation)

### **5. 🎪 Demo Features**
- **Add Shapes Demo**: Instantly creates examples of all shape types
- **Debug Tools**: Test connections and inspect element positions

## 🔌 API Reference

### **Canvas Management**
- `POST /api/canvas/init` - Initialize canvas with dimensions
- `GET /api/canvas` - Get current canvas data
- `DELETE /api/canvas/clear` - Clear all elements

### **Generic Drawing API**
- `POST /api/canvas/draw` - **Universal endpoint for all shape types**
- `GET /api/canvas/drawing-types` - Get supported shape types and schemas
- `GET /api/canvas/drawing-types/:type/schema` - Get schema for specific shape

### **Legacy Shape Endpoints**
- `POST /api/canvas/rectangle` - Add rectangle element
- `POST /api/canvas/circle` - Add circle element  
- `POST /api/canvas/text` - Add text element
- `POST /api/canvas/image` - Add image element (supports file upload and URLs)

### **Element Management**
- `GET /api/canvas/elements` - Get all elements with IDs
- `PUT /api/canvas/elements/:id` - Update element properties
- `DELETE /api/canvas/elements/:id` - Delete specific element
- `POST /api/canvas/elements/:id/duplicate` - Duplicate element
- `PATCH /api/canvas/elements/:id/move` - Move element to new position
- `PATCH /api/canvas/elements/:id/reorder` - Change element layer order

### **Export & Utilities**
- `POST /api/canvas/export-pdf` - Export canvas as optimized PDF
- `GET /api/canvas/text/examples` - Get text positioning examples
- `POST /api/canvas/text/validate` - Validate text positioning
- `POST /api/canvas/test-shape` - Debug endpoint for testing shapes
- `GET /api/health` - API health check

### **Example API Usage**

#### **Universal Drawing Endpoint**
```javascript
// Add any shape type
POST /api/canvas/draw
{
  "type": "star",
  "x": 200, "y": 150,
  "outerRadius": 50, "innerRadius": 25, "points": 5,
  "fillColor": "#ffeb3b", "strokeColor": "#000000"
}
```

#### **Element Management**
```javascript
// Move element
PATCH /api/canvas/elements/0/move
{ "x": 100, "y": 200 }

// Update element properties  
PUT /api/canvas/elements/0
{ "fillColor": "#ff0000", "strokeWidth": 3 }
```

## 🎨 Supported Drawing Types

### **Shape Gallery**

| Shape Type | Description | Key Properties |
|------------|-------------|----------------|
| **Rectangle** | Basic rectangles with optional rounded corners | `x, y, width, height, cornerRadius, fillColor, strokeColor` |
| **Circle** | Perfect circles with center-based positioning | `x, y, radius, fillColor, strokeColor, strokeWidth` |
| **Ellipse** | Oval shapes with separate X/Y radii | `x, y, radiusX, radiusY, fillColor, strokeColor` |
| **Line** | Straight lines with customizable caps | `x, y, x2, y2, strokeColor, strokeWidth, lineCap` |
| **Arrow** | Directional arrows with custom heads | `x, y, x2, y2, headLength, headWidth, bodyWidth, fillColor` |
| **Triangle** | Three-point triangles | `x, y, x2, y2, x3, y3, fillColor, strokeColor` |
| **Star** | Multi-pointed stars (3-20 points) | `x, y, outerRadius, innerRadius, points, fillColor` |
| **Polygon** | Custom multi-point shapes | `points: [{x, y}, ...], fillColor, strokeColor` |
| **Path** | Free-hand curves and complex paths | `pathData: [commands], closed, smoothing, strokeColor` |
| **Text** | Styled text elements | `x, y, text, fontSize, fontFamily, fillColor` |
| **Image** | Uploaded or URL-based images | `x, y, width, height, imagePath` |

### **Advanced Features**
- **Rotation**: All shapes support rotation (0-360 degrees)
- **Opacity**: Transparency control (0-1)
- **Line Styles**: Dashed lines, different caps and joins
- **Smooth Paths**: Bezier curves and path smoothing
- **Layer Management**: Bring to front/back, reorder elements

## 🔧 PDF Optimization

### **Compression Features**
- **JPEG Compression**: Canvas images at 80% quality for optimal size/quality balance
- **PDF Compression**: Built-in PDFKit compression reduces file size
- **Smart Rendering**: Efficient canvas-to-image conversion
- **Size Estimation**: Automatic file size prediction and optimization recommendations

### **Quality Settings**
- **High Resolution**: Maintains crisp edges and text clarity
- **Color Accuracy**: Preserves exact colors and gradients
- **Vector Elements**: Text and shapes remain sharp at any zoom level
- **Image Optimization**: Automatic image compression without quality loss

## 🏗️ Architecture

### **Backend Structure**
```
backend/
├── controllers/        → Business logic & API endpoints
│   └── canvasController.js
├── routes/             → Express route definitions
│   └── canvasRoutes.js
├── services/           → Core canvas & PDF services
│   ├── canvasService.js
│   └── shapes/         → Modular shape system
│       ├── ShapeFactory.js
│       ├── BaseShape.js
│       ├── RectangleShape.js
│       ├── CircleShape.js
│       ├── LineShape.js
│       ├── TriangleShape.js
│       ├── PolygonShape.js
│       ├── PathShape.js
│       ├── EllipseShape.js
│       ├── ArrowShape.js
│       └── StarShape.js
├── utils/              → Helper functions & optimization
│   └── pdfOptimizer.js
├── uploads/            → Image file storage
├── app.js              → Express app configuration
├── server.js           → Server startup
└── package.json
```

### **Frontend Structure**
```
frontend/
├── src/
│   ├── App.jsx         → Main React component
│   ├── App.css         → Styling and responsive design
│   └── main.jsx        → React app entry point
├── index.html          → HTML template
└── package.json
```

### **Design Patterns**
- **Shape Factory**: Modular shape creation and management
- **MVC Architecture**: Clean separation of concerns
- **RESTful API**: Standard HTTP methods and status codes
- **Component-Based UI**: Reusable React components
- **State Management**: Centralized canvas state with local optimizations

## 🛠️ Troubleshooting

### **Common Issues**

#### **🚨 Disk Space Errors**
```bash
# Error: ENOSPC: no space left on device
# Solutions:
1. Free up disk space (need 2GB+ available)
2. Clear npm cache: npm cache clean --force
3. Use npm ci instead of npm install
4. Delete node_modules and reinstall
```

#### **🔧 Canvas Dependencies (Windows)**
```bash
# The canvas package requires native compilation
# Install prerequisites:
1. Visual Studio Build Tools 2019+
2. Python 3.7+ (for node-gyp)
3. Windows SDK

# If installation fails:
npm install --build-from-source
# or
npm install canvas --build-from-source
```

#### **🌐 CORS Issues**
```bash
# Make sure both servers are running:
Backend:  http://localhost:3001
Frontend: http://localhost:5173 (React) or http://localhost:8000 (Static)

# Check browser console for CORS errors
# Verify API_BASE_URL in frontend matches backend port
```

#### **📱 Performance Issues**
```bash
# For large canvases or many elements:
1. Limit canvas size to 1500x1500 or smaller
2. Keep element count under 100 for optimal performance
3. Use smaller images (under 2MB)
4. Clear browser cache if UI becomes sluggish
```

### **🔍 Debug Tools**
- **Debug Shape Button**: Tests shape creation system
- **Debug Positions Button**: Compares frontend vs backend element positions
- **Browser Console**: Detailed logging for all operations
- **Network Tab**: Monitor API calls and responses

## File Structure

```
canvas-pdf-app/
├── backend/
│   ├── package.json
│   ├── server.js
│   └── uploads/ (created automatically)
├── frontend/
│   ├── index.html
│   ├── styles.css
│   └── script.js
└── README.md
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

