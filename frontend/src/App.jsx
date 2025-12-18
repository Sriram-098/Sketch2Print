import { useState, useRef, useEffect } from 'react'
import './App.css'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api'

// API helper function with better error handling
const apiCall = async (url, options = {}) => {
  try {
    console.log(`API Call: ${options.method || 'GET'} ${url}`);
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      }
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      let errorMessage;
      try {
        const errorJson = JSON.parse(errorText);
        errorMessage = errorJson.error || errorJson.message || `HTTP ${response.status}`;
      } catch {
        errorMessage = `HTTP ${response.status}: ${errorText}`;
      }
      throw new Error(errorMessage);
    }
    
    return response;
  } catch (error) {
    console.error(`API Error for ${url}:`, error);
    throw error;
  }
}

function App() {
  const canvasRef = useRef(null)
  const [canvasData, setCanvasData] = useState({ width: 800, height: 600, elements: [] })
  const [message, setMessage] = useState({ text: '', type: '' })
  const [elements, setElements] = useState([])
  const [selectedElement, setSelectedElement] = useState(null)
  const [editMode, setEditMode] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [dragElement, setDragElement] = useState(null)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
  
  // Canvas configuration
  const [canvasWidth, setCanvasWidth] = useState(800)
  const [canvasHeight, setCanvasHeight] = useState(600)
  
  // Rectangle state
  const [rectData, setRectData] = useState({
    x: 50, y: 50, width: 100, height: 100,
    fillColor: '#ff0000', strokeColor: '#000000', strokeWidth: 2
  })
  
  // Circle state
  const [circleData, setCircleData] = useState({
    x: 200, y: 100, radius: 50,
    fillColor: '#00ff00', strokeColor: '#000000', strokeWidth: 2
  })
  
  // Text state
  const [textData, setTextData] = useState({
    x: 300, y: 150, text: 'Hello World', fontSize: 24,
    fontFamily: 'Arial', fillColor: '#0000ff'
  })
  
  // Image state
  const [imageData, setImageData] = useState({
    x: 400, y: 200, width: 150, height: 150,
    file: null, url: ''
  })

  // New drawing states
  const [lineData, setLineData] = useState({
    x: 100, y: 100, x2: 200, y2: 150,
    strokeColor: '#000000', strokeWidth: 2, lineCap: 'butt'
  })

  const [triangleData, setTriangleData] = useState({
    x: 150, y: 100, x2: 200, y2: 200, x3: 100, y3: 200,
    fillColor: '#ff6600', strokeColor: '#000000', strokeWidth: 2
  })

  const [polygonData, setPolygonData] = useState({
    points: [
      { x: 300, y: 100 },
      { x: 350, y: 150 },
      { x: 320, y: 200 },
      { x: 280, y: 200 },
      { x: 250, y: 150 }
    ],
    fillColor: '#9c27b0', strokeColor: '#000000', strokeWidth: 2
  })

  const [ellipseData, setEllipseData] = useState({
    x: 400, y: 150, radiusX: 60, radiusY: 40,
    fillColor: '#2196f3', strokeColor: '#000000', strokeWidth: 2
  })

  const [arrowData, setArrowData] = useState({
    x: 500, y: 100, x2: 600, y2: 150,
    headLength: 20, headWidth: 15, bodyWidth: 6,
    fillColor: '#f44336', strokeColor: '#000000', strokeWidth: 1
  })

  const [starData, setStarData] = useState({
    x: 650, y: 150, outerRadius: 40, innerRadius: 20, points: 5,
    fillColor: '#ffeb3b', strokeColor: '#000000', strokeWidth: 2
  })

  const [pathData, setPathData] = useState({
    pathData: [],
    closed: false,
    smoothing: 0.3,
    strokeColor: '#4caf50', strokeWidth: 3
  })

  const [supportedTypes, setSupportedTypes] = useState([])
  const [drawingSchemas, setDrawingSchemas] = useState({})
  
  // Context menu state
  const [contextMenu, setContextMenu] = useState({ show: false, x: 0, y: 0, element: null })
  
  // Click timing for double-click detection
  const [lastClickTime, setLastClickTime] = useState(0)
  const [clickTimeout, setClickTimeout] = useState(null)
  
  // Drag state tracking
  const [dragStartPosition, setDragStartPosition] = useState(null)

  const showMessage = (text, type) => {
    setMessage({ text, type })
    setTimeout(() => setMessage({ text: '', type: '' }), 3000)
  }

  const setupPreviewCanvas = (canvasData) => {
    const canvas = canvasRef.current
    if (!canvas) return
    
    // Set canvas dimensions
    canvas.width = canvasData.width
    canvas.height = canvasData.height
    
    // Clear canvas with white background
    const ctx = canvas.getContext('2d')
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, canvasData.width, canvasData.height)
  }

  const initializeCanvas = async (clearElements = false) => {
    try {
      const response = await fetch(`${API_BASE_URL}/canvas/init`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          width: canvasWidth, 
          height: canvasHeight,
          preserveElements: !clearElements
        })
      })

      if (response.ok) {
        const data = await response.json()
        setCanvasData(data.canvas)
        setupPreviewCanvas(data.canvas)
        
        if (data.elementsPreserved) {
          showMessage('Canvas resized - elements preserved!', 'success')
        } else {
          showMessage('Canvas initialized successfully!', 'success')
        }
        
        // Refresh the elements list
        await refreshPreview()
      } else {
        throw new Error('Failed to initialize canvas')
      }
    } catch (error) {
      showMessage('Error initializing canvas: ' + error.message, 'error')
    }
  }

  // Initialize canvas and clear all elements
  const initializeCanvasClean = () => {
    if (elements.length > 0) {
      if (window.confirm('This will clear all elements. Continue?')) {
        initializeCanvas(true)
      }
    } else {
      initializeCanvas(true)
    }
  }

  const addRectangle = async () => {
    try {
      console.log('Adding rectangle:', rectData)
      const response = await fetch(`${API_BASE_URL}/canvas/rectangle`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(rectData)
      })

      if (response.ok) {
        const result = await response.json()
        console.log('Rectangle added:', result)
        showMessage('Rectangle added successfully!', 'success')
        await refreshPreview()
      } else {
        const error = await response.json()
        throw new Error(error.error || 'Failed to add rectangle')
      }
    } catch (error) {
      console.error('Rectangle error:', error)
      showMessage('Error adding rectangle: ' + error.message, 'error')
    }
  }

  const addCircle = async () => {
    try {
      console.log('Adding circle:', circleData)
      const response = await fetch(`${API_BASE_URL}/canvas/circle`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(circleData)
      })

      if (response.ok) {
        const result = await response.json()
        console.log('Circle added:', result)
        showMessage('Circle added successfully!', 'success')
        await refreshPreview()
      } else {
        const error = await response.json()
        throw new Error(error.error || 'Failed to add circle')
      }
    } catch (error) {
      console.error('Circle error:', error)
      showMessage('Error adding circle: ' + error.message, 'error')
    }
  }

  const addText = async () => {
    if (!textData.text.trim()) {
      showMessage('Please enter text content', 'error')
      return
    }

    try {
      const response = await fetch(`${API_BASE_URL}/canvas/text`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(textData)
      })

      if (response.ok) {
        showMessage('Text added successfully!', 'success')
        refreshPreview()
      } else {
        throw new Error('Failed to add text')
      }
    } catch (error) {
      showMessage('Error adding text: ' + error.message, 'error')
    }
  }

  const addImage = async () => {
    if (!imageData.file && !imageData.url) {
      showMessage('Please select an image file or enter an image URL', 'error')
      return
    }

    const formData = new FormData()
    formData.append('x', imageData.x)
    formData.append('y', imageData.y)
    formData.append('width', imageData.width)
    formData.append('height', imageData.height)
    
    if (imageData.file) {
      formData.append('image', imageData.file)
    } else {
      formData.append('imageUrl', imageData.url)
    }

    try {
      const response = await fetch(`${API_BASE_URL}/canvas/image`, {
        method: 'POST',
        body: formData
      })

      if (response.ok) {
        showMessage('Image added successfully!', 'success')
        refreshPreview()
      } else {
        throw new Error('Failed to add image')
      }
    } catch (error) {
      showMessage('Error adding image: ' + error.message, 'error')
    }
  }

  const refreshPreview = async () => {
    try {
      console.log('Refreshing preview...')
      const response = await fetch(`${API_BASE_URL}/canvas`)
      if (response.ok) {
        const data = await response.json()
        console.log('Canvas data received:', data)
        setCanvasData(data)
        drawPreview(data)
        
        // Also fetch elements with IDs
        const elementsResponse = await fetch(`${API_BASE_URL}/canvas/elements`)
        if (elementsResponse.ok) {
          const elementsData = await elementsResponse.json()
          console.log('Elements data received:', elementsData)
          setElements(elementsData.elements)
        }
      } else {
        throw new Error('Failed to fetch canvas data')
      }
    } catch (error) {
      console.error('Refresh error:', error)
      showMessage('Error refreshing preview: ' + error.message, 'error')
    }
  }

  const drawPreview = (data = canvasData) => {
    const canvas = canvasRef.current
    if (!canvas || !data.width || !data.height) return
    
    const ctx = canvas.getContext('2d')
    
    // Ensure canvas dimensions are set
    canvas.width = data.width
    canvas.height = data.height
    
    // Clear canvas with white background
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, data.width, data.height)
    
    console.log('Drawing elements:', data.elements)
    
    // Draw elements
    if (data.elements && data.elements.length > 0) {
      data.elements.forEach((element, index) => {
        console.log('Drawing element:', element)
        drawElement(ctx, element)
        
        // Draw selection highlight
        if (selectedElement && selectedElement.id === index) {
          drawSelectionHighlight(ctx, element)
        }
      })
    }
  }

  // Helper function to draw arrows
  const drawArrow = (ctx, element) => {
    const angle = Math.atan2(element.y2 - element.y, element.x2 - element.x)
    const length = Math.sqrt(Math.pow(element.x2 - element.x, 2) + Math.pow(element.y2 - element.y, 2))
    
    ctx.save()
    ctx.translate(element.x, element.y)
    ctx.rotate(angle)
    
    // Draw arrow body
    ctx.beginPath()
    ctx.rect(0, -element.bodyWidth / 2, length - element.headLength, element.bodyWidth)
    ctx.fillStyle = element.fillColor
    ctx.fill()
    
    // Draw arrow head
    ctx.beginPath()
    ctx.moveTo(length - element.headLength, -element.headWidth / 2)
    ctx.lineTo(length, 0)
    ctx.lineTo(length - element.headLength, element.headWidth / 2)
    ctx.closePath()
    ctx.fillStyle = element.fillColor
    ctx.fill()
    
    ctx.restore()
  }

  // Helper function to draw stars
  const drawStar = (ctx, element) => {
    const angleStep = Math.PI / element.points
    
    ctx.beginPath()
    
    for (let i = 0; i < element.points * 2; i++) {
      const angle = i * angleStep - Math.PI / 2
      const radius = i % 2 === 0 ? element.outerRadius : element.innerRadius
      const x = element.x + Math.cos(angle) * radius
      const y = element.y + Math.sin(angle) * radius
      
      if (i === 0) {
        ctx.moveTo(x, y)
      } else {
        ctx.lineTo(x, y)
      }
    }
    
    ctx.closePath()
    ctx.fillStyle = element.fillColor
    ctx.fill()
    
    if (element.strokeWidth > 0) {
      ctx.strokeStyle = element.strokeColor
      ctx.lineWidth = element.strokeWidth
      ctx.stroke()
    }
  }

  const drawSelectionHighlight = (ctx, element) => {
    ctx.save()
    ctx.strokeStyle = '#2196f3'
    ctx.lineWidth = 2
    ctx.setLineDash([5, 5])
    
    switch (element.type) {
      case 'rectangle':
      case 'image':
        ctx.strokeRect(element.x - 2, element.y - 2, element.width + 4, element.height + 4)
        break
        
      case 'circle':
        ctx.beginPath()
        ctx.arc(element.x, element.y, element.radius + 2, 0, 2 * Math.PI)
        ctx.stroke()
        break
        
      case 'ellipse':
        ctx.beginPath()
        ctx.ellipse(element.x, element.y, element.radiusX + 2, element.radiusY + 2, 0, 0, 2 * Math.PI)
        ctx.stroke()
        break
        
      case 'line':
        // Draw selection line with thicker stroke
        ctx.beginPath()
        ctx.moveTo(element.x, element.y)
        ctx.lineTo(element.x2, element.y2)
        ctx.lineWidth = Math.max(4, (element.strokeWidth || 2) + 2)
        ctx.stroke()
        break
        
      case 'arrow':
        // Draw selection around arrow path
        ctx.beginPath()
        ctx.moveTo(element.x, element.y)
        ctx.lineTo(element.x2, element.y2)
        ctx.lineWidth = Math.max(6, (element.bodyWidth || 4) + 4)
        ctx.stroke()
        break
        
      case 'triangle':
        // Draw selection around triangle
        ctx.beginPath()
        ctx.moveTo(element.x, element.y)
        ctx.lineTo(element.x2, element.y2)
        ctx.lineTo(element.x3, element.y3)
        ctx.closePath()
        ctx.stroke()
        break
        
      case 'star':
        ctx.beginPath()
        ctx.arc(element.x, element.y, element.outerRadius + 2, 0, 2 * Math.PI)
        ctx.stroke()
        break
        
      case 'polygon':
        if (element.points && element.points.length >= 3) {
          ctx.beginPath()
          ctx.moveTo(element.points[0].x, element.points[0].y)
          for (let i = 1; i < element.points.length; i++) {
            ctx.lineTo(element.points[i].x, element.points[i].y)
          }
          ctx.closePath()
          ctx.stroke()
        }
        break
        
      case 'path':
        if (element.pathData && element.pathData.length > 0) {
          ctx.beginPath()
          element.pathData.forEach(cmd => {
            switch (cmd.type) {
              case 'moveTo':
                ctx.moveTo(cmd.x, cmd.y)
                break
              case 'lineTo':
                ctx.lineTo(cmd.x, cmd.y)
                break
              case 'bezierCurveTo':
                ctx.bezierCurveTo(cmd.cp1x, cmd.cp1y, cmd.cp2x, cmd.cp2y, cmd.x, cmd.y)
                break
            }
          })
          if (element.closed) ctx.closePath()
          ctx.lineWidth = Math.max(4, (element.strokeWidth || 2) + 2)
          ctx.stroke()
        }
        break
        
      case 'text':
        const textWidth = element.text.length * element.fontSize * 0.6
        ctx.strokeRect(element.x - 2, element.y - element.fontSize - 2, textWidth + 4, element.fontSize + 4)
        break
        
      default:
        // Generic bounding box for unknown shapes
        const bounds = getElementBounds(element)
        if (bounds && bounds.width > 0 && bounds.height > 0) {
          ctx.strokeRect(bounds.left - 2, bounds.top - 2, bounds.width + 4, bounds.height + 4)
        }
        break
    }
    
    ctx.restore()
  }

  // Helper function for line hit testing
  const isPointNearLine = (px, py, x1, y1, x2, y2, threshold = 5) => {
    const A = px - x1
    const B = py - y1
    const C = x2 - x1
    const D = y2 - y1

    const dot = A * C + B * D
    const lenSq = C * C + D * D
    
    if (lenSq === 0) return Math.sqrt(A * A + B * B) <= threshold

    let param = dot / lenSq
    param = Math.max(0, Math.min(1, param))

    const xx = x1 + param * C
    const yy = y1 + param * D

    const dx = px - xx
    const dy = py - yy
    return Math.sqrt(dx * dx + dy * dy) <= threshold
  }

  // Helper function for triangle hit testing
  const isPointInTriangle = (px, py, x1, y1, x2, y2, x3, y3) => {
    const denom = (y2 - y3) * (x1 - x3) + (x3 - x2) * (y1 - y3)
    if (Math.abs(denom) < 0.000001) return false

    const a = ((y2 - y3) * (px - x3) + (x3 - x2) * (py - y3)) / denom
    const b = ((y3 - y1) * (px - x3) + (x1 - x3) * (py - y3)) / denom
    const c = 1 - a - b

    return a >= 0 && b >= 0 && c >= 0
  }

  // Helper function for polygon hit testing (ray casting)
  const isPointInPolygon = (px, py, points) => {
    let inside = false
    
    for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
      if (((points[i].y > py) !== (points[j].y > py)) &&
          (px < (points[j].x - points[i].x) * (py - points[i].y) / (points[j].y - points[i].y) + points[i].x)) {
        inside = !inside
      }
    }
    
    return inside
  }

  // Helper function to get arrow bounds
  const getArrowBounds = (element) => {
    const padding = Math.max(element.headWidth || 10, element.bodyWidth || 4) / 2
    return {
      left: Math.min(element.x, element.x2) - padding,
      top: Math.min(element.y, element.y2) - padding,
      right: Math.max(element.x, element.x2) + padding,
      bottom: Math.max(element.y, element.y2) + padding
    }
  }

  // Helper function to get path bounds
  const getPathBounds = (element) => {
    if (!element.pathData || element.pathData.length === 0) {
      return { left: element.x || 0, top: element.y || 0, right: element.x || 0, bottom: element.y || 0 }
    }

    const points = element.pathData.filter(cmd => cmd.x !== undefined && cmd.y !== undefined)
    if (points.length === 0) {
      return { left: 0, top: 0, right: 0, bottom: 0 }
    }

    const xs = points.map(p => p.x)
    const ys = points.map(p => p.y)
    
    return {
      left: Math.min(...xs),
      top: Math.min(...ys),
      right: Math.max(...xs),
      bottom: Math.max(...ys)
    }
  }

  // Helper function to get element bounds
  const getElementBounds = (element) => {
    switch (element.type) {
      case 'rectangle':
      case 'image':
        return {
          left: element.x,
          top: element.y,
          width: element.width,
          height: element.height
        }
      case 'circle':
        return {
          left: element.x - element.radius,
          top: element.y - element.radius,
          width: element.radius * 2,
          height: element.radius * 2
        }
      case 'ellipse':
        return {
          left: element.x - element.radiusX,
          top: element.y - element.radiusY,
          width: element.radiusX * 2,
          height: element.radiusY * 2
        }
      case 'line':
        const lineThickness = element.strokeWidth || 2
        return {
          left: Math.min(element.x, element.x2) - lineThickness,
          top: Math.min(element.y, element.y2) - lineThickness,
          width: Math.abs(element.x2 - element.x) + lineThickness * 2,
          height: Math.abs(element.y2 - element.y) + lineThickness * 2
        }
      case 'arrow':
        return getArrowBounds(element)
      case 'triangle':
        const minX = Math.min(element.x, element.x2, element.x3)
        const maxX = Math.max(element.x, element.x2, element.x3)
        const minY = Math.min(element.y, element.y2, element.y3)
        const maxY = Math.max(element.y, element.y2, element.y3)
        return {
          left: minX,
          top: minY,
          width: maxX - minX,
          height: maxY - minY
        }
      case 'star':
        return {
          left: element.x - element.outerRadius,
          top: element.y - element.outerRadius,
          width: element.outerRadius * 2,
          height: element.outerRadius * 2
        }
      case 'polygon':
        if (!element.points || element.points.length === 0) return { left: 0, top: 0, width: 0, height: 0 }
        const xs = element.points.map(p => p.x)
        const ys = element.points.map(p => p.y)
        const minXPoly = Math.min(...xs)
        const maxXPoly = Math.max(...xs)
        const minYPoly = Math.min(...ys)
        const maxYPoly = Math.max(...ys)
        return {
          left: minXPoly,
          top: minYPoly,
          width: maxXPoly - minXPoly,
          height: maxYPoly - minYPoly
        }
      case 'path':
        const pathBounds = getPathBounds(element)
        return {
          left: pathBounds.left,
          top: pathBounds.top,
          width: pathBounds.right - pathBounds.left,
          height: pathBounds.bottom - pathBounds.top
        }
      case 'text':
        const textWidth = element.text.length * element.fontSize * 0.6
        return {
          left: element.x,
          top: element.y - element.fontSize,
          width: textWidth,
          height: element.fontSize
        }
      default:
        return { left: 0, top: 0, width: 0, height: 0 }
    }
  }

  const drawElement = (ctx, element) => {
    console.log('Drawing element type:', element.type, element)
    
    switch (element.type) {
      case 'rectangle':
        ctx.fillStyle = element.fillColor || '#000000'
        ctx.strokeStyle = element.strokeColor || '#000000'
        ctx.lineWidth = element.strokeWidth || 1
        ctx.fillRect(element.x, element.y, element.width, element.height)
        if (element.strokeWidth > 0) {
          ctx.strokeRect(element.x, element.y, element.width, element.height)
        }
        console.log('Rectangle drawn at:', element.x, element.y, element.width, element.height)
        break
        
      case 'circle':
        ctx.beginPath()
        ctx.arc(element.x, element.y, element.radius, 0, 2 * Math.PI)
        ctx.fillStyle = element.fillColor
        ctx.fill()
        if (element.strokeWidth > 0) {
          ctx.strokeStyle = element.strokeColor
          ctx.lineWidth = element.strokeWidth
          ctx.stroke()
        }
        break
        
      case 'text':
        ctx.fillStyle = element.fillColor
        ctx.font = `${element.fontSize}px ${element.fontFamily}`
        ctx.fillText(element.text, element.x, element.y)
        break
        
      case 'image':
        // Placeholder for images in preview
        ctx.fillStyle = '#e0e0e0'
        ctx.fillRect(element.x, element.y, element.width, element.height)
        ctx.strokeStyle = '#999'
        ctx.lineWidth = 1
        ctx.strokeRect(element.x, element.y, element.width, element.height)
        
        ctx.fillStyle = '#666'
        ctx.font = '14px Arial'
        ctx.textAlign = 'center'
        ctx.fillText('IMAGE', element.x + element.width/2, element.y + element.height/2)
        ctx.textAlign = 'start'
        break

      case 'line':
        ctx.beginPath()
        ctx.moveTo(element.x, element.y)
        ctx.lineTo(element.x2, element.y2)
        ctx.strokeStyle = element.strokeColor
        ctx.lineWidth = element.strokeWidth
        ctx.lineCap = element.lineCap || 'butt'
        ctx.stroke()
        break

      case 'triangle':
        ctx.beginPath()
        ctx.moveTo(element.x, element.y)
        ctx.lineTo(element.x2, element.y2)
        ctx.lineTo(element.x3, element.y3)
        ctx.closePath()
        ctx.fillStyle = element.fillColor
        ctx.fill()
        if (element.strokeWidth > 0) {
          ctx.strokeStyle = element.strokeColor
          ctx.lineWidth = element.strokeWidth
          ctx.stroke()
        }
        break

      case 'ellipse':
        ctx.beginPath()
        ctx.ellipse(element.x, element.y, element.radiusX, element.radiusY, 0, 0, 2 * Math.PI)
        ctx.fillStyle = element.fillColor
        ctx.fill()
        if (element.strokeWidth > 0) {
          ctx.strokeStyle = element.strokeColor
          ctx.lineWidth = element.strokeWidth
          ctx.stroke()
        }
        break

      case 'arrow':
        drawArrow(ctx, element)
        break

      case 'star':
        drawStar(ctx, element)
        break

      case 'polygon':
        if (element.points && element.points.length >= 3) {
          ctx.beginPath()
          ctx.moveTo(element.points[0].x, element.points[0].y)
          for (let i = 1; i < element.points.length; i++) {
            ctx.lineTo(element.points[i].x, element.points[i].y)
          }
          ctx.closePath()
          ctx.fillStyle = element.fillColor
          ctx.fill()
          if (element.strokeWidth > 0) {
            ctx.strokeStyle = element.strokeColor
            ctx.lineWidth = element.strokeWidth
            ctx.stroke()
          }
        }
        break

      case 'path':
        if (element.pathData && element.pathData.length > 0) {
          ctx.beginPath()
          element.pathData.forEach(cmd => {
            switch (cmd.type) {
              case 'moveTo':
                ctx.moveTo(cmd.x, cmd.y)
                break
              case 'lineTo':
                ctx.lineTo(cmd.x, cmd.y)
                break
              case 'bezierCurveTo':
                ctx.bezierCurveTo(cmd.cp1x, cmd.cp1y, cmd.cp2x, cmd.cp2y, cmd.x, cmd.y)
                break
            }
          })
          if (element.closed) {
            ctx.closePath()
            ctx.fillStyle = element.fillColor
            ctx.fill()
          }
          ctx.strokeStyle = element.strokeColor
          ctx.lineWidth = element.strokeWidth
          ctx.stroke()
        }
        break
    }
  }

  const clearCanvas = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/canvas/clear`, {
        method: 'DELETE'
      })

      if (response.ok) {
        setCanvasData({ ...canvasData, elements: [] })
        drawPreview({ ...canvasData, elements: [] })
        showMessage('Canvas cleared successfully!', 'success')
      } else {
        throw new Error('Failed to clear canvas')
      }
    } catch (error) {
      showMessage('Error clearing canvas: ' + error.message, 'error')
    }
  }

  const exportPDF = async () => {
    try {
      showMessage('Generating PDF...', 'info')
      
      const response = await fetch(`${API_BASE_URL}/canvas/export-pdf`, {
        method: 'POST'
      })

      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = 'sketch2print-export.pdf'
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        window.URL.revokeObjectURL(url)
        
        showMessage('PDF exported successfully!', 'success')
      } else {
        throw new Error('Failed to export PDF')
      }
    } catch (error) {
      showMessage('Error exporting PDF: ' + error.message, 'error')
    }
  }

  // Test backend connection and load drawing types
  const testConnection = async () => {
    try {
      console.log('Testing connection to:', `${API_BASE_URL}/health`)
      const response = await fetch(`${API_BASE_URL}/health`)
      if (response.ok) {
        const data = await response.json()
        console.log('Backend connected:', data)
        showMessage('Connected to Sketch2Print API', 'success')
        
        // Load supported drawing types
        await loadDrawingTypes()
        
        // Test drawing types endpoint
        await testDrawingEndpoint()
      } else {
        throw new Error('Backend not responding')
      }
    } catch (error) {
      console.error('Backend connection failed:', error)
      showMessage('Cannot connect to backend. Make sure server is running on port 3001', 'error')
    }
  }

  // Test the drawing endpoint
  const testDrawingEndpoint = async () => {
    try {
      console.log('Testing drawing types endpoint...')
      const response = await fetch(`${API_BASE_URL}/canvas/drawing-types`)
      if (response.ok) {
        const data = await response.json()
        console.log('Drawing types response:', data)
      } else {
        console.error('Drawing types endpoint failed:', response.status)
      }
    } catch (error) {
      console.error('Drawing types test failed:', error)
    }
  }

  // Load supported drawing types
  const loadDrawingTypes = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/canvas/drawing-types`)
      if (response.ok) {
        const data = await response.json()
        setSupportedTypes(data.supportedTypes)
        setDrawingSchemas(data.schemas)
        console.log('Loaded drawing types:', data.supportedTypes)
      }
    } catch (error) {
      console.error('Failed to load drawing types:', error)
    }
  }

  // Generic drawing function
  const addDrawing = async (type, drawingData) => {
    try {
      console.log(`Adding ${type}:`, drawingData)
      console.log('API URL:', `${API_BASE_URL}/canvas/draw`)
      console.log('Request body:', JSON.stringify({ type, ...drawingData }))
      
      const response = await fetch(`${API_BASE_URL}/canvas/draw`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, ...drawingData })
      })

      console.log('Response status:', response.status)
      console.log('Response headers:', response.headers)

      if (response.ok) {
        const result = await response.json()
        console.log(`${type} added successfully:`, result)
        showMessage(`${type} added successfully!`, 'success')
        await refreshPreview()
      } else {
        const errorText = await response.text()
        console.error('Error response:', errorText)
        
        let errorMessage
        try {
          const errorJson = JSON.parse(errorText)
          errorMessage = errorJson.error || errorJson.message || `Failed to add ${type}`
        } catch (parseError) {
          errorMessage = `Server error: ${response.status} - ${errorText}`
        }
        
        throw new Error(errorMessage)
      }
    } catch (error) {
      console.error(`${type} error:`, error)
      showMessage(`Error adding ${type}: ` + error.message, 'error')
    }
  }

  // Test simple line function
  const testSimpleLine = async () => {
    const simpleLineData = {
      x: 100,
      y: 100,
      x2: 200,
      y2: 150,
      strokeColor: '#ff0000',
      strokeWidth: 2,
      lineCap: 'butt'
    }
    
    console.log('Testing simple line with data:', simpleLineData)
    await addDrawing('line', simpleLineData)
  }

  // Test shape endpoint for debugging
  const testShapeEndpoint = async () => {
    try {
      console.log('🧪 Testing shape endpoint...')
      const response = await fetch(`${API_BASE_URL}/canvas/test-shape`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'line' })
      })

      const result = await response.json()
      console.log('Shape test result:', result)
      
      if (result.success) {
        showMessage('Shape test passed! ✅', 'success')
      } else {
        showMessage('Shape test failed: ' + result.error, 'error')
      }
    } catch (error) {
      console.error('Shape test error:', error)
      showMessage('Shape test error: ' + error.message, 'error')
    }
  }

  // Debug element positions
  const debugElementPositions = async () => {
    try {
      console.log('🔍 Current element positions:')
      console.log('Frontend elements:', elements)
      console.log('Canvas data elements:', canvasData.elements)
      
      // Fetch server data
      const response = await fetch(`${API_BASE_URL}/canvas`)
      if (response.ok) {
        const serverData = await response.json()
        console.log('Server canvas data:', serverData)
        
        const elementsResponse = await fetch(`${API_BASE_URL}/canvas/elements`)
        if (elementsResponse.ok) {
          const serverElements = await elementsResponse.json()
          console.log('Server elements:', serverElements)
        }
      }
      
      showMessage('Check console for position debug info', 'info')
    } catch (error) {
      console.error('Debug error:', error)
      showMessage('Debug error: ' + error.message, 'error')
    }
  }

  // Specific drawing functions
  const addLine = () => addDrawing('line', lineData)
  const addTriangle = () => addDrawing('triangle', triangleData)
  const addPolygon = () => addDrawing('polygon', polygonData)
  const addEllipse = () => addDrawing('ellipse', ellipseData)
  const addArrow = () => addDrawing('arrow', arrowData)
  const addStar = () => addDrawing('star', starData)
  const addPath = () => addDrawing('path', pathData)

  // Demo function to showcase all shapes
  const addShapesDemo = async () => {
    try {
      showMessage('Adding shapes demo...', 'info')
      
      // Clear canvas first
      await clearCanvas()
      
      // Add various shapes to demonstrate capabilities
      const demoShapes = [
        // Rectangle
        { type: 'rectangle', x: 50, y: 50, width: 100, height: 80, fillColor: '#ff5722', strokeColor: '#d84315', strokeWidth: 2 },
        
        // Circle
        { type: 'circle', x: 250, y: 90, radius: 40, fillColor: '#2196f3', strokeColor: '#1976d2', strokeWidth: 2 },
        
        // Triangle
        { type: 'triangle', x: 400, y: 50, x2: 450, y2: 130, x3: 350, y3: 130, fillColor: '#4caf50', strokeColor: '#388e3c', strokeWidth: 2 },
        
        // Line
        { type: 'line', x: 500, y: 60, x2: 600, y2: 120, strokeColor: '#9c27b0', strokeWidth: 4, lineCap: 'round' },
        
        // Ellipse
        { type: 'ellipse', x: 150, y: 250, radiusX: 60, radiusY: 35, fillColor: '#ff9800', strokeColor: '#f57c00', strokeWidth: 2 },
        
        // Star
        { type: 'star', x: 350, y: 250, outerRadius: 35, innerRadius: 18, points: 5, fillColor: '#ffeb3b', strokeColor: '#fbc02d', strokeWidth: 2 },
        
        // Arrow
        { type: 'arrow', x: 500, y: 200, x2: 600, y2: 250, headLength: 20, headWidth: 12, bodyWidth: 6, fillColor: '#f44336' },
        
        // Polygon (Pentagon)
        { 
          type: 'polygon', 
          points: [
            { x: 150, y: 400 }, { x: 200, y: 380 }, { x: 220, y: 420 }, 
            { x: 180, y: 450 }, { x: 120, y: 430 }
          ], 
          fillColor: '#673ab7', strokeColor: '#512da8', strokeWidth: 2 
        },
        
        // Text
        { type: 'text', x: 300, y: 420, text: 'Sketch2Print Demo!', fontSize: 24, fontFamily: 'Arial', fillColor: '#333333' }
      ]
      
      // Add each shape with a small delay for visual effect
      for (const shape of demoShapes) {
        await addDrawing(shape.type, shape)
        await new Promise(resolve => setTimeout(resolve, 200)) // Small delay
      }
      
      showMessage('Shapes demo completed! 🎨', 'success')
    } catch (error) {
      showMessage('Error adding demo shapes: ' + error.message, 'error')
    }
  }

  // Handle keyboard events
  const handleKeyDown = (e) => {
    if (selectedElement && (e.key === 'Delete' || e.key === 'Backspace')) {
      e.preventDefault()
      deleteElement(selectedElement.id)
    }
    if (e.key === 'Escape') {
      setSelectedElement(null)
      setEditMode(false)
    }
  }

  // Load existing canvas data on startup
  const loadExistingCanvas = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/canvas`)
      if (response.ok) {
        const data = await response.json()
        setCanvasData(data)
        setupPreviewCanvas(data)
        
        // Also load elements
        const elementsResponse = await fetch(`${API_BASE_URL}/canvas/elements`)
        if (elementsResponse.ok) {
          const elementsData = await elementsResponse.json()
          setElements(elementsData.elements)
        }
      } else {
        // If no canvas exists, initialize a new one
        initializeCanvas(true)
      }
    } catch (error) {
      console.log('No existing canvas found, initializing new one')
      initializeCanvas(true)
    }
  }

  useEffect(() => {
    testConnection()
    loadExistingCanvas() // Load existing canvas instead of always initializing
    
    // Add keyboard event listeners
    document.addEventListener('keydown', handleKeyDown)
    
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      // Clean up any pending timeouts
      if (clickTimeout) {
        clearTimeout(clickTimeout)
      }
    }
  }, [selectedElement, clickTimeout])

  useEffect(() => {
    if (canvasRef.current && canvasData.width && canvasData.height) {
      setupPreviewCanvas(canvasData)
      drawPreview(canvasData)
    }
  }, [canvasData])

  // Element management functions
  const selectElement = (elementId) => {
    const element = elements.find(el => el.id === elementId)
    setSelectedElement(element)
    setEditMode(true)
  }

  const updateElement = async (elementId, updates) => {
    try {
      const response = await fetch(`${API_BASE_URL}/canvas/elements/${elementId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      })

      if (response.ok) {
        showMessage('Element updated successfully!', 'success')
        refreshPreview()
        setSelectedElement(null)
        setEditMode(false)
      } else {
        throw new Error('Failed to update element')
      }
    } catch (error) {
      showMessage('Error updating element: ' + error.message, 'error')
    }
  }

  const deleteElement = async (elementId) => {
    try {
      // Find the element to get its type for the message
      const elementToDelete = elements.find(el => el.id === elementId)
      const elementType = elementToDelete ? elementToDelete.type : 'element'
      
      const response = await fetch(`${API_BASE_URL}/canvas/elements/${elementId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        showMessage(`${elementType.charAt(0).toUpperCase() + elementType.slice(1)} deleted! 🗑️`, 'success')
        await refreshPreview()
        setSelectedElement(null)
        setEditMode(false)
      } else {
        throw new Error('Failed to delete element')
      }
    } catch (error) {
      showMessage('Error deleting element: ' + error.message, 'error')
    }
  }

  const duplicateElement = async (elementId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/canvas/elements/${elementId}/duplicate`, {
        method: 'POST'
      })

      if (response.ok) {
        showMessage('Element duplicated successfully!', 'success')
        refreshPreview()
      } else {
        throw new Error('Failed to duplicate element')
      }
    } catch (error) {
      showMessage('Error duplicating element: ' + error.message, 'error')
    }
  }

  // Move element without refreshing all elements (silent update)
  const moveElementSilent = async (elementId, x, y) => {
    try {
      console.log(`Moving element ${elementId} to (${x}, ${y})`)
      
      // Get the element we're moving and calculate all its new properties
      const elementToMove = elements.find(el => el.id === elementId)
      if (!elementToMove) {
        throw new Error('Element not found in local state')
      }
      
      const updatedElement = updateElementPosition(elementToMove, x, y)
      const { id, ...elementData } = updatedElement
      
      const response = await fetch(`${API_BASE_URL}/canvas/elements/${elementId}/move`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(elementData)
      })

      if (response.ok) {
        console.log(`Element ${elementId} moved successfully on server`)
        // The local state is already updated from the drag operation, so we don't need to update it again
      } else {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to move element')
      }
    } catch (error) {
      console.error('Move element error:', error)
      showMessage('Error moving element: ' + error.message, 'error')
      // Revert the position by reloading from server
      await refreshPreview()
    }
  }

  const moveElement = async (elementId, x, y) => {
    try {
      const response = await fetch(`${API_BASE_URL}/canvas/elements/${elementId}/move`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ x, y })
      })

      if (response.ok) {
        showMessage('Element moved successfully!', 'success')
        await refreshPreview()
      } else {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to move element')
      }
    } catch (error) {
      console.error('Move element error:', error)
      showMessage('Error moving element: ' + error.message, 'error')
      // Revert the position
      await refreshPreview()
    }
  }

  // Canvas drag and drop functionality
  const getCanvasCoordinates = (e) => {
    const canvas = canvasRef.current
    if (!canvas) return { x: 0, y: 0 }
    
    const rect = canvas.getBoundingClientRect()
    const scaleX = canvasData.width / rect.width
    const scaleY = canvasData.height / rect.height
    
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY
    }
  }

  const findElementAtPosition = (x, y) => {
    // Check elements in reverse order (top to bottom)
    for (let i = elements.length - 1; i >= 0; i--) {
      const element = elements[i]
      if (isPointInElement(x, y, element)) {
        return element
      }
    }
    return null
  }

  const isPointInElement = (x, y, element) => {
    switch (element.type) {
      case 'rectangle':
      case 'image':
        return x >= element.x && 
               x <= element.x + element.width && 
               y >= element.y && 
               y <= element.y + element.height
               
      case 'circle':
        const distance = Math.sqrt(
          Math.pow(x - element.x, 2) + Math.pow(y - element.y, 2)
        )
        return distance <= element.radius

      case 'ellipse':
        const dx = (x - element.x) / element.radiusX
        const dy = (y - element.y) / element.radiusY
        return (dx * dx + dy * dy) <= 1
        
      case 'line':
        return isPointNearLine(x, y, element.x, element.y, element.x2, element.y2, element.strokeWidth || 2)

      case 'arrow':
        // Use bounding box for arrows (more complex hit testing would require arrow geometry)
        const arrowBounds = getArrowBounds(element)
        return x >= arrowBounds.left && x <= arrowBounds.right && 
               y >= arrowBounds.top && y <= arrowBounds.bottom

      case 'triangle':
        return isPointInTriangle(x, y, element.x, element.y, element.x2, element.y2, element.x3, element.y3)

      case 'star':
        // Use outer radius for hit testing (simplified)
        const starDistance = Math.sqrt(
          Math.pow(x - element.x, 2) + Math.pow(y - element.y, 2)
        )
        return starDistance <= element.outerRadius

      case 'polygon':
        if (!element.points || element.points.length < 3) return false
        return isPointInPolygon(x, y, element.points)

      case 'path':
        // Use bounding box for paths (simplified)
        const pathBounds = getPathBounds(element)
        return x >= pathBounds.left && x <= pathBounds.right && 
               y >= pathBounds.top && y <= pathBounds.bottom
        
      case 'text':
        const textWidth = element.text.length * element.fontSize * 0.6
        const textHeight = element.fontSize
        return x >= element.x && 
               x <= element.x + textWidth && 
               y >= element.y - textHeight && 
               y <= element.y
               
      default:
        return false
    }
  }

  const handleCanvasMouseDown = (e) => {
    // Hide context menu on any click
    setContextMenu({ show: false, x: 0, y: 0, element: null })
    
    const currentTime = Date.now()
    const timeDiff = currentTime - lastClickTime
    
    // If this is a potential double-click (within 300ms), don't start dragging
    if (timeDiff < 300) {
      return
    }
    
    setLastClickTime(currentTime)
    
    // Clear any existing timeout
    if (clickTimeout) {
      clearTimeout(clickTimeout)
    }
    
    const coords = getCanvasCoordinates(e)
    const element = findElementAtPosition(coords.x, coords.y)
    
    if (element) {
      // Delay drag start to allow for double-click detection
      const timeout = setTimeout(() => {
        setIsDragging(true)
        setDragElement(element)
        setDragOffset({
          x: coords.x - element.x,
          y: coords.y - element.y
        })
        setDragStartPosition({ x: element.x, y: element.y })
      }, 150)
      
      setClickTimeout(timeout)
      setSelectedElement(element)
    } else {
      setSelectedElement(null)
    }
  }

  // Handle right-click context menu
  const handleCanvasContextMenu = (e) => {
    e.preventDefault()
    
    const coords = getCanvasCoordinates(e)
    const element = findElementAtPosition(coords.x, coords.y)
    
    if (element) {
      setContextMenu({
        show: true,
        x: e.clientX,
        y: e.clientY,
        element: element
      })
      setSelectedElement(element)
    } else {
      setContextMenu({ show: false, x: 0, y: 0, element: null })
    }
  }

  // Handle double-click to delete
  const handleCanvasDoubleClick = (e) => {
    e.preventDefault()
    e.stopPropagation()
    
    // Clear click timeout to prevent drag start
    if (clickTimeout) {
      clearTimeout(clickTimeout)
      setClickTimeout(null)
    }
    
    // Stop any ongoing drag operation
    setIsDragging(false)
    setDragElement(null)
    setDragOffset({ x: 0, y: 0 })
    
    const coords = getCanvasCoordinates(e)
    const element = findElementAtPosition(coords.x, coords.y)
    
    if (element) {
      // Use a more user-friendly confirmation
      const elementType = element.type.charAt(0).toUpperCase() + element.type.slice(1)
      if (window.confirm(`🗑️ Delete this ${elementType}?\n\nThis action cannot be undone.`)) {
        deleteElement(element.id)
      }
    }
  }

  // Close context menu when clicking elsewhere
  const handleDocumentClick = (e) => {
    if (contextMenu.show) {
      setContextMenu({ show: false, x: 0, y: 0, element: null })
    }
  }

  useEffect(() => {
    document.addEventListener('click', handleDocumentClick)
    return () => {
      document.removeEventListener('click', handleDocumentClick)
    }
  }, [contextMenu.show])

  const handleCanvasMouseMove = (e) => {
    if (!isDragging || !dragElement) return
    
    const coords = getCanvasCoordinates(e)
    const newX = coords.x - dragOffset.x
    const newY = coords.y - dragOffset.y
    
    // Update element position based on element type
    const updatedElements = elements.map(el => {
      if (el.id !== dragElement.id) return el
      
      return updateElementPosition(el, newX, newY)
    })
    
    // Update local state for smooth dragging
    setElements(updatedElements)
    
    // Update canvas data for preview (but don't overwrite other elements)
    const updatedCanvasData = {
      ...canvasData,
      elements: canvasData.elements.map((el, idx) => {
        if (idx === dragElement.id) {
          // Update the dragged element
          const updatedElement = updatedElements.find(uel => uel.id === dragElement.id)
          if (updatedElement) {
            const { id, ...elementData } = updatedElement
            return elementData
          }
        }
        return el
      })
    }
    setCanvasData(updatedCanvasData)
    drawPreview(updatedCanvasData)
  }

  // Helper function to update element position based on type
  const updateElementPosition = (element, newX, newY) => {
    // Ensure position is within canvas bounds with some padding
    const padding = 10
    const clampedX = Math.max(padding, Math.min(newX, canvasData.width - padding))
    const clampedY = Math.max(padding, Math.min(newY, canvasData.height - padding))
    
    // Create a deep copy to avoid mutations
    const updatedElement = { ...element }
    
    switch (element.type) {
      case 'rectangle':
      case 'circle':
      case 'ellipse':
      case 'star':
      case 'text':
      case 'image':
        // Simple position update for center-based or corner-based elements
        updatedElement.x = clampedX
        updatedElement.y = clampedY
        break
        
      case 'line':
      case 'arrow':
        // Move both start and end points by the same offset
        const deltaX = clampedX - element.x
        const deltaY = clampedY - element.y
        updatedElement.x = clampedX
        updatedElement.y = clampedY
        updatedElement.x2 = element.x2 + deltaX
        updatedElement.y2 = element.y2 + deltaY
        break
        
      case 'triangle':
        // Move all three points by the same offset
        const triDeltaX = clampedX - element.x
        const triDeltaY = clampedY - element.y
        updatedElement.x = clampedX
        updatedElement.y = clampedY
        updatedElement.x2 = element.x2 + triDeltaX
        updatedElement.y2 = element.y2 + triDeltaY
        updatedElement.x3 = element.x3 + triDeltaX
        updatedElement.y3 = element.y3 + triDeltaY
        break
        
      case 'polygon':
        // Move all points by the same offset
        if (element.points && element.points.length > 0) {
          const polyDeltaX = clampedX - element.x
          const polyDeltaY = clampedY - element.y
          updatedElement.x = clampedX
          updatedElement.y = clampedY
          updatedElement.points = element.points.map(point => ({
            x: point.x + polyDeltaX,
            y: point.y + polyDeltaY
          }))
        }
        break
        
      case 'path':
        // Move all path points by the same offset
        if (element.pathData && element.pathData.length > 0) {
          const pathDeltaX = clampedX - (element.x || 0)
          const pathDeltaY = clampedY - (element.y || 0)
          updatedElement.x = clampedX
          updatedElement.y = clampedY
          updatedElement.pathData = element.pathData.map(cmd => {
            const newCmd = { ...cmd }
            if (cmd.x !== undefined) newCmd.x = cmd.x + pathDeltaX
            if (cmd.y !== undefined) newCmd.y = cmd.y + pathDeltaY
            if (cmd.cp1x !== undefined) newCmd.cp1x = cmd.cp1x + pathDeltaX
            if (cmd.cp1y !== undefined) newCmd.cp1y = cmd.cp1y + pathDeltaY
            if (cmd.cp2x !== undefined) newCmd.cp2x = cmd.cp2x + pathDeltaX
            if (cmd.cp2y !== undefined) newCmd.cp2y = cmd.cp2y + pathDeltaY
            if (cmd.cpx !== undefined) newCmd.cpx = cmd.cpx + pathDeltaX
            if (cmd.cpy !== undefined) newCmd.cpy = cmd.cpy + pathDeltaY
            return newCmd
          })
        }
        break
        
      default:
        updatedElement.x = clampedX
        updatedElement.y = clampedY
        break
    }
    
    return updatedElement
  }

  const handleCanvasMouseUp = async () => {
    if (isDragging && dragElement) {
      // Send update to server only if we actually moved the element significantly
      const element = elements.find(el => el.id === dragElement.id)
      if (element && dragStartPosition) {
        try {
          // Check if we moved more than 5 pixels (to avoid tiny movements)
          const distanceMoved = Math.sqrt(
            Math.pow(element.x - dragStartPosition.x, 2) + 
            Math.pow(element.y - dragStartPosition.y, 2)
          )
          
          if (distanceMoved > 5) {
            console.log(`Element moved ${distanceMoved.toFixed(1)} pixels, updating server`)
            await moveElementSilent(element.id, element.x, element.y)
          } else {
            console.log('Element moved less than 5 pixels, skipping server update')
          }
        } catch (error) {
          console.error('Move element error:', error)
          // Revert on error - reload from server
          await refreshPreview()
        }
      }
    }
    
    setIsDragging(false)
    setDragElement(null)
    setDragOffset({ x: 0, y: 0 })
    setDragStartPosition(null)
  }

  useEffect(() => {
    drawPreview()
  }, [canvasData])

  // Element Editor Component
  const ElementEditor = ({ element, onUpdate, onCancel }) => {
    const [editData, setEditData] = useState({ ...element })

    const handleUpdate = () => {
      const updates = {}
      
      // Only include changed fields
      Object.keys(editData).forEach(key => {
        if (editData[key] !== element[key] && key !== 'id' && key !== 'type') {
          updates[key] = editData[key]
        }
      })
      
      if (Object.keys(updates).length > 0) {
        onUpdate(updates)
      } else {
        onCancel()
      }
    }

    return (
      <div className="element-editor">
        {/* Position */}
        <div className="edit-section">
          <h4>Position</h4>
          <div className="form-row">
            <input
              type="number"
              placeholder="X"
              value={editData.x}
              onChange={(e) => setEditData({...editData, x: parseInt(e.target.value)})}
            />
            <input
              type="number"
              placeholder="Y"
              value={editData.y}
              onChange={(e) => setEditData({...editData, y: parseInt(e.target.value)})}
            />
          </div>
        </div>

        {/* Type-specific properties */}
        {element.type === 'rectangle' && (
          <div className="edit-section">
            <h4>Size & Style</h4>
            <div className="form-row">
              <input
                type="number"
                placeholder="Width"
                value={editData.width}
                onChange={(e) => setEditData({...editData, width: parseInt(e.target.value)})}
              />
              <input
                type="number"
                placeholder="Height"
                value={editData.height}
                onChange={(e) => setEditData({...editData, height: parseInt(e.target.value)})}
              />
            </div>
            <div className="form-row">
              <input
                type="color"
                value={editData.fillColor}
                onChange={(e) => setEditData({...editData, fillColor: e.target.value})}
              />
              <input
                type="color"
                value={editData.strokeColor}
                onChange={(e) => setEditData({...editData, strokeColor: e.target.value})}
              />
              <input
                type="number"
                placeholder="Stroke Width"
                value={editData.strokeWidth}
                onChange={(e) => setEditData({...editData, strokeWidth: parseInt(e.target.value)})}
              />
            </div>
          </div>
        )}

        {element.type === 'circle' && (
          <div className="edit-section">
            <h4>Size & Style</h4>
            <div className="form-row">
              <input
                type="number"
                placeholder="Radius"
                value={editData.radius}
                onChange={(e) => setEditData({...editData, radius: parseInt(e.target.value)})}
              />
            </div>
            <div className="form-row">
              <input
                type="color"
                value={editData.fillColor}
                onChange={(e) => setEditData({...editData, fillColor: e.target.value})}
              />
              <input
                type="color"
                value={editData.strokeColor}
                onChange={(e) => setEditData({...editData, strokeColor: e.target.value})}
              />
              <input
                type="number"
                placeholder="Stroke Width"
                value={editData.strokeWidth}
                onChange={(e) => setEditData({...editData, strokeWidth: parseInt(e.target.value)})}
              />
            </div>
          </div>
        )}

        {element.type === 'text' && (
          <div className="edit-section">
            <h4>Text Properties</h4>
            <div className="form-row">
              <input
                type="text"
                placeholder="Text content"
                value={editData.text}
                onChange={(e) => setEditData({...editData, text: e.target.value})}
              />
            </div>
            <div className="form-row">
              <input
                type="number"
                placeholder="Font Size"
                value={editData.fontSize}
                onChange={(e) => setEditData({...editData, fontSize: parseInt(e.target.value)})}
              />
              <select
                value={editData.fontFamily}
                onChange={(e) => setEditData({...editData, fontFamily: e.target.value})}
              >
                <option value="Arial">Arial</option>
                <option value="Times New Roman">Times New Roman</option>
                <option value="Courier New">Courier New</option>
                <option value="Helvetica">Helvetica</option>
              </select>
              <input
                type="color"
                value={editData.fillColor}
                onChange={(e) => setEditData({...editData, fillColor: e.target.value})}
              />
            </div>
          </div>
        )}

        {element.type === 'image' && (
          <div className="edit-section">
            <h4>Image Size</h4>
            <div className="form-row">
              <input
                type="number"
                placeholder="Width"
                value={editData.width}
                onChange={(e) => setEditData({...editData, width: parseInt(e.target.value)})}
              />
              <input
                type="number"
                placeholder="Height"
                value={editData.height}
                onChange={(e) => setEditData({...editData, height: parseInt(e.target.value)})}
              />
            </div>
          </div>
        )}

        <div className="edit-actions">
          <button onClick={handleUpdate} className="btn btn-primary">
            Update Element
          </button>
          <button onClick={onCancel} className="btn btn-secondary">
            Cancel
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="app">
      <header className="header">
        <h1>Sketch2Print</h1>
        <p>Create visual elements on a canvas and export as PDF</p>
      </header>

      {message.text && (
        <div className={`message ${message.type}`}>
          {message.text}
        </div>
      )}

      <div className="main-content">
        <div className="controls-panel">
          {/* Canvas Configuration */}
          <section className="config-section">
            <h2>Canvas Configuration</h2>
            <div className="form-group">
              <label>Width:</label>
              <input 
                type="number" 
                value={canvasWidth}
                onChange={(e) => setCanvasWidth(parseInt(e.target.value))}
                min="100" 
                max="2000"
              />
            </div>
            <div className="form-group">
              <label>Height:</label>
              <input 
                type="number" 
                value={canvasHeight}
                onChange={(e) => setCanvasHeight(parseInt(e.target.value))}
                min="100" 
                max="2000"
              />
            </div>
            <button onClick={() => initializeCanvas(false)} className="btn btn-info" style={{marginRight: '10px'}}>
              Resize Canvas
            </button>
            <button onClick={initializeCanvasClean} className="btn btn-primary">
              New Canvas
            </button>
          </section>

          {/* Rectangle Controls */}
          <section className="element-controls">
            <h3>Rectangle</h3>
            <div className="form-row">
              <input 
                type="number" 
                placeholder="X" 
                value={rectData.x}
                onChange={(e) => setRectData({...rectData, x: parseInt(e.target.value)})}
              />
              <input 
                type="number" 
                placeholder="Y" 
                value={rectData.y}
                onChange={(e) => setRectData({...rectData, y: parseInt(e.target.value)})}
              />
              <input 
                type="number" 
                placeholder="Width" 
                value={rectData.width}
                onChange={(e) => setRectData({...rectData, width: parseInt(e.target.value)})}
              />
              <input 
                type="number" 
                placeholder="Height" 
                value={rectData.height}
                onChange={(e) => setRectData({...rectData, height: parseInt(e.target.value)})}
              />
            </div>
            <div className="form-row">
              <input 
                type="color" 
                value={rectData.fillColor}
                onChange={(e) => setRectData({...rectData, fillColor: e.target.value})}
                title="Fill Color"
              />
              <input 
                type="color" 
                value={rectData.strokeColor}
                onChange={(e) => setRectData({...rectData, strokeColor: e.target.value})}
                title="Stroke Color"
              />
              <input 
                type="number" 
                placeholder="Stroke Width" 
                value={rectData.strokeWidth}
                onChange={(e) => setRectData({...rectData, strokeWidth: parseInt(e.target.value)})}
                min="0"
              />
            </div>
            <button onClick={addRectangle} className="btn btn-secondary">
              Add Rectangle
            </button>
          </section>

          {/* Circle Controls */}
          <section className="element-controls">
            <h3>Circle</h3>
            <div className="form-row">
              <input 
                type="number" 
                placeholder="Center X" 
                value={circleData.x}
                onChange={(e) => setCircleData({...circleData, x: parseInt(e.target.value)})}
              />
              <input 
                type="number" 
                placeholder="Center Y" 
                value={circleData.y}
                onChange={(e) => setCircleData({...circleData, y: parseInt(e.target.value)})}
              />
              <input 
                type="number" 
                placeholder="Radius" 
                value={circleData.radius}
                onChange={(e) => setCircleData({...circleData, radius: parseInt(e.target.value)})}
              />
            </div>
            <div className="form-row">
              <input 
                type="color" 
                value={circleData.fillColor}
                onChange={(e) => setCircleData({...circleData, fillColor: e.target.value})}
                title="Fill Color"
              />
              <input 
                type="color" 
                value={circleData.strokeColor}
                onChange={(e) => setCircleData({...circleData, strokeColor: e.target.value})}
                title="Stroke Color"
              />
              <input 
                type="number" 
                placeholder="Stroke Width" 
                value={circleData.strokeWidth}
                onChange={(e) => setCircleData({...circleData, strokeWidth: parseInt(e.target.value)})}
                min="0"
              />
            </div>
            <button onClick={addCircle} className="btn btn-secondary">
              Add Circle
            </button>
          </section>

          {/* Text Controls */}
          <section className="element-controls">
            <h3>Text</h3>
            <div className="form-row">
              <input 
                type="number" 
                placeholder="X" 
                value={textData.x}
                onChange={(e) => setTextData({...textData, x: parseInt(e.target.value)})}
              />
              <input 
                type="number" 
                placeholder="Y" 
                value={textData.y}
                onChange={(e) => setTextData({...textData, y: parseInt(e.target.value)})}
              />
              <input 
                type="text" 
                placeholder="Text content" 
                value={textData.text}
                onChange={(e) => setTextData({...textData, text: e.target.value})}
              />
            </div>
            <div className="form-row">
              <input 
                type="number" 
                placeholder="Font Size" 
                value={textData.fontSize}
                onChange={(e) => setTextData({...textData, fontSize: parseInt(e.target.value)})}
                min="8"
              />
              <select 
                value={textData.fontFamily}
                onChange={(e) => setTextData({...textData, fontFamily: e.target.value})}
              >
                <option value="Arial">Arial</option>
                <option value="Times New Roman">Times New Roman</option>
                <option value="Courier New">Courier New</option>
                <option value="Helvetica">Helvetica</option>
              </select>
              <input 
                type="color" 
                value={textData.fillColor}
                onChange={(e) => setTextData({...textData, fillColor: e.target.value})}
                title="Text Color"
              />
            </div>
            <button onClick={addText} className="btn btn-secondary">
              Add Text
            </button>
          </section>

          {/* Image Controls */}
          <section className="element-controls">
            <h3>Image</h3>
            <div className="form-row">
              <input 
                type="number" 
                placeholder="X" 
                value={imageData.x}
                onChange={(e) => setImageData({...imageData, x: parseInt(e.target.value)})}
              />
              <input 
                type="number" 
                placeholder="Y" 
                value={imageData.y}
                onChange={(e) => setImageData({...imageData, y: parseInt(e.target.value)})}
              />
              <input 
                type="number" 
                placeholder="Width" 
                value={imageData.width}
                onChange={(e) => setImageData({...imageData, width: parseInt(e.target.value)})}
              />
              <input 
                type="number" 
                placeholder="Height" 
                value={imageData.height}
                onChange={(e) => setImageData({...imageData, height: parseInt(e.target.value)})}
              />
            </div>
            <div className="form-row">
              <input 
                type="file" 
                accept="image/*"
                onChange={(e) => setImageData({...imageData, file: e.target.files[0]})}
              />
              <span>or</span>
              <input 
                type="url" 
                placeholder="Image URL"
                value={imageData.url}
                onChange={(e) => setImageData({...imageData, url: e.target.value})}
              />
            </div>
            <button onClick={addImage} className="btn btn-secondary">
              Add Image
            </button>
          </section>

          {/* Line Controls */}
          <section className="element-controls">
            <h3>Line</h3>
            <div className="form-row">
              <input 
                type="number" 
                placeholder="Start X" 
                value={lineData.x}
                onChange={(e) => setLineData({...lineData, x: parseInt(e.target.value)})}
              />
              <input 
                type="number" 
                placeholder="Start Y" 
                value={lineData.y}
                onChange={(e) => setLineData({...lineData, y: parseInt(e.target.value)})}
              />
              <input 
                type="number" 
                placeholder="End X" 
                value={lineData.x2}
                onChange={(e) => setLineData({...lineData, x2: parseInt(e.target.value)})}
              />
              <input 
                type="number" 
                placeholder="End Y" 
                value={lineData.y2}
                onChange={(e) => setLineData({...lineData, y2: parseInt(e.target.value)})}
              />
            </div>
            <div className="form-row">
              <input 
                type="color" 
                value={lineData.strokeColor}
                onChange={(e) => setLineData({...lineData, strokeColor: e.target.value})}
                title="Line Color"
              />
              <input 
                type="number" 
                placeholder="Width" 
                value={lineData.strokeWidth}
                onChange={(e) => setLineData({...lineData, strokeWidth: parseInt(e.target.value)})}
                min="1"
              />
              <select 
                value={lineData.lineCap}
                onChange={(e) => setLineData({...lineData, lineCap: e.target.value})}
              >
                <option value="butt">Butt</option>
                <option value="round">Round</option>
                <option value="square">Square</option>
              </select>
            </div>
            <button onClick={addLine} className="btn btn-secondary">
              Add Line
            </button>
            <button onClick={testSimpleLine} className="btn" style={{backgroundColor: '#e91e63', color: 'white', fontSize: '12px', padding: '5px 10px'}}>
              Test Simple Line
            </button>
            <button onClick={testShapeEndpoint} className="btn" style={{backgroundColor: '#795548', color: 'white', fontSize: '12px', padding: '5px 10px'}}>
              Debug Shape
            </button>
            <button onClick={debugElementPositions} className="btn" style={{backgroundColor: '#607d8b', color: 'white', fontSize: '12px', padding: '5px 10px'}}>
              Debug Positions
            </button>
          </section>

          {/* Triangle Controls */}
          <section className="element-controls">
            <h3>Triangle</h3>
            <div className="form-row">
              <input 
                type="number" 
                placeholder="Point 1 X" 
                value={triangleData.x}
                onChange={(e) => setTriangleData({...triangleData, x: parseInt(e.target.value)})}
              />
              <input 
                type="number" 
                placeholder="Point 1 Y" 
                value={triangleData.y}
                onChange={(e) => setTriangleData({...triangleData, y: parseInt(e.target.value)})}
              />
              <input 
                type="number" 
                placeholder="Point 2 X" 
                value={triangleData.x2}
                onChange={(e) => setTriangleData({...triangleData, x2: parseInt(e.target.value)})}
              />
              <input 
                type="number" 
                placeholder="Point 2 Y" 
                value={triangleData.y2}
                onChange={(e) => setTriangleData({...triangleData, y2: parseInt(e.target.value)})}
              />
            </div>
            <div className="form-row">
              <input 
                type="number" 
                placeholder="Point 3 X" 
                value={triangleData.x3}
                onChange={(e) => setTriangleData({...triangleData, x3: parseInt(e.target.value)})}
              />
              <input 
                type="number" 
                placeholder="Point 3 Y" 
                value={triangleData.y3}
                onChange={(e) => setTriangleData({...triangleData, y3: parseInt(e.target.value)})}
              />
              <input 
                type="color" 
                value={triangleData.fillColor}
                onChange={(e) => setTriangleData({...triangleData, fillColor: e.target.value})}
                title="Fill Color"
              />
              <input 
                type="color" 
                value={triangleData.strokeColor}
                onChange={(e) => setTriangleData({...triangleData, strokeColor: e.target.value})}
                title="Stroke Color"
              />
            </div>
            <button onClick={addTriangle} className="btn btn-secondary">
              Add Triangle
            </button>
          </section>

          {/* Ellipse Controls */}
          <section className="element-controls">
            <h3>Ellipse</h3>
            <div className="form-row">
              <input 
                type="number" 
                placeholder="Center X" 
                value={ellipseData.x}
                onChange={(e) => setEllipseData({...ellipseData, x: parseInt(e.target.value)})}
              />
              <input 
                type="number" 
                placeholder="Center Y" 
                value={ellipseData.y}
                onChange={(e) => setEllipseData({...ellipseData, y: parseInt(e.target.value)})}
              />
              <input 
                type="number" 
                placeholder="Radius X" 
                value={ellipseData.radiusX}
                onChange={(e) => setEllipseData({...ellipseData, radiusX: parseInt(e.target.value)})}
              />
              <input 
                type="number" 
                placeholder="Radius Y" 
                value={ellipseData.radiusY}
                onChange={(e) => setEllipseData({...ellipseData, radiusY: parseInt(e.target.value)})}
              />
            </div>
            <div className="form-row">
              <input 
                type="color" 
                value={ellipseData.fillColor}
                onChange={(e) => setEllipseData({...ellipseData, fillColor: e.target.value})}
                title="Fill Color"
              />
              <input 
                type="color" 
                value={ellipseData.strokeColor}
                onChange={(e) => setEllipseData({...ellipseData, strokeColor: e.target.value})}
                title="Stroke Color"
              />
              <input 
                type="number" 
                placeholder="Stroke Width" 
                value={ellipseData.strokeWidth}
                onChange={(e) => setEllipseData({...ellipseData, strokeWidth: parseInt(e.target.value)})}
                min="0"
              />
            </div>
            <button onClick={addEllipse} className="btn btn-secondary">
              Add Ellipse
            </button>
          </section>

          {/* Arrow Controls */}
          <section className="element-controls">
            <h3>Arrow</h3>
            <div className="form-row">
              <input 
                type="number" 
                placeholder="Start X" 
                value={arrowData.x}
                onChange={(e) => setArrowData({...arrowData, x: parseInt(e.target.value)})}
              />
              <input 
                type="number" 
                placeholder="Start Y" 
                value={arrowData.y}
                onChange={(e) => setArrowData({...arrowData, y: parseInt(e.target.value)})}
              />
              <input 
                type="number" 
                placeholder="End X" 
                value={arrowData.x2}
                onChange={(e) => setArrowData({...arrowData, x2: parseInt(e.target.value)})}
              />
              <input 
                type="number" 
                placeholder="End Y" 
                value={arrowData.y2}
                onChange={(e) => setArrowData({...arrowData, y2: parseInt(e.target.value)})}
              />
            </div>
            <div className="form-row">
              <input 
                type="number" 
                placeholder="Head Length" 
                value={arrowData.headLength}
                onChange={(e) => setArrowData({...arrowData, headLength: parseInt(e.target.value)})}
                min="5"
              />
              <input 
                type="number" 
                placeholder="Head Width" 
                value={arrowData.headWidth}
                onChange={(e) => setArrowData({...arrowData, headWidth: parseInt(e.target.value)})}
                min="2"
              />
              <input 
                type="color" 
                value={arrowData.fillColor}
                onChange={(e) => setArrowData({...arrowData, fillColor: e.target.value})}
                title="Arrow Color"
              />
            </div>
            <button onClick={addArrow} className="btn btn-secondary">
              Add Arrow
            </button>
          </section>

          {/* Star Controls */}
          <section className="element-controls">
            <h3>Star</h3>
            <div className="form-row">
              <input 
                type="number" 
                placeholder="Center X" 
                value={starData.x}
                onChange={(e) => setStarData({...starData, x: parseInt(e.target.value)})}
              />
              <input 
                type="number" 
                placeholder="Center Y" 
                value={starData.y}
                onChange={(e) => setStarData({...starData, y: parseInt(e.target.value)})}
              />
              <input 
                type="number" 
                placeholder="Outer Radius" 
                value={starData.outerRadius}
                onChange={(e) => setStarData({...starData, outerRadius: parseInt(e.target.value)})}
                min="5"
              />
              <input 
                type="number" 
                placeholder="Inner Radius" 
                value={starData.innerRadius}
                onChange={(e) => setStarData({...starData, innerRadius: parseInt(e.target.value)})}
                min="1"
              />
            </div>
            <div className="form-row">
              <input 
                type="number" 
                placeholder="Points" 
                value={starData.points}
                onChange={(e) => setStarData({...starData, points: parseInt(e.target.value)})}
                min="3" max="20"
              />
              <input 
                type="color" 
                value={starData.fillColor}
                onChange={(e) => setStarData({...starData, fillColor: e.target.value})}
                title="Fill Color"
              />
              <input 
                type="color" 
                value={starData.strokeColor}
                onChange={(e) => setStarData({...starData, strokeColor: e.target.value})}
                title="Stroke Color"
              />
            </div>
            <button onClick={addStar} className="btn btn-secondary">
              Add Star
            </button>
          </section>
        </div>

        {/* Canvas Preview */}
        <div className="preview-panel">
          <h2>Canvas Preview</h2>
          {elements.length > 0 && (
            <div className="drag-instructions">
              💡 <strong>Interact with elements:</strong><br/>
              • Click & drag to move • Right-click for menu • Double-click to delete • Press Delete key when selected
            </div>
          )}
          <div className={`canvas-container ${elements.length > 0 ? 'has-elements' : ''} ${isDragging ? 'dragging' : ''}`}>
            <canvas 
              ref={canvasRef}
              width={canvasData.width}
              height={canvasData.height}
              onMouseDown={handleCanvasMouseDown}
              onMouseMove={handleCanvasMouseMove}
              onMouseUp={handleCanvasMouseUp}
              onMouseLeave={handleCanvasMouseUp}
              onContextMenu={handleCanvasContextMenu}
              onDoubleClick={handleCanvasDoubleClick}
              style={{
                maxWidth: '100%',
                maxHeight: '400px',
                border: isDragging ? '2px solid #2196f3' : '1px solid #bdc3c7',
                backgroundColor: 'white',
                cursor: isDragging ? 'grabbing' : (selectedElement ? 'grab' : 'crosshair'),
                imageRendering: 'pixelated',
                transition: 'border-color 0.2s ease'
              }}
            />
          </div>
          <div className="canvas-actions">
            <button onClick={refreshPreview} className="btn btn-info">
              Refresh Preview
            </button>
            <button onClick={clearCanvas} className="btn btn-warning">
              Clear Canvas
            </button>
            <button onClick={addShapesDemo} className="btn" style={{backgroundColor: '#9c27b0', color: 'white'}}>
              Add Shapes Demo
            </button>
            <button onClick={exportPDF} className="btn btn-success">
              Export as PDF
            </button>
          </div>

          {/* Keyboard Shortcuts Hint */}
          {selectedElement && (
            <div className="keyboard-hints">
              <strong>Selected:</strong> {selectedElement.type} • 
              Press <span className="shortcut">Delete</span> to remove • 
              Press <span className="shortcut">Esc</span> to deselect
            </div>
          )}

          {/* Elements List */}
          <div className="elements-section">
            <h3>
              Canvas Elements 
              <span className="element-count">{elements.length}</span>
            </h3>
            {elements.length === 0 ? (
              <p className="no-elements">No elements added yet</p>
            ) : (
              <div className="elements-list">
                {elements.map((element) => (
                  <div key={element.id} className={`element-item ${selectedElement?.id === element.id ? 'selected' : ''}`}>
                    <div className="element-info">
                      <span className="element-type">{element.type}</span>
                      <span className="element-details">
                        {element.type === 'text' && `"${element.text}"`}
                        {element.type === 'rectangle' && `${element.width}×${element.height}`}
                        {element.type === 'circle' && `r=${element.radius}`}
                        {element.type === 'image' && `${element.width}×${element.height}`}
                      </span>
                      <span className="element-position">({element.x}, {element.y})</span>
                    </div>
                    <div className="element-actions">
                      <button onClick={() => selectElement(element.id)} className="btn-small btn-edit">
                        Edit
                      </button>
                      <button onClick={() => duplicateElement(element.id)} className="btn-small btn-duplicate">
                        Copy
                      </button>
                      <button onClick={() => deleteElement(element.id)} className="btn-small btn-delete">
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Context Menu */}
          {contextMenu.show && (
            <div 
              className="context-menu"
              style={{
                position: 'fixed',
                left: contextMenu.x,
                top: contextMenu.y,
                zIndex: 1000
              }}
            >
              <div className="context-menu-item" onClick={() => {
                selectElement(contextMenu.element.id)
                setContextMenu({ show: false, x: 0, y: 0, element: null })
              }}>
                ✏️ Edit {contextMenu.element.type}
              </div>
              <div className="context-menu-item" onClick={() => {
                duplicateElement(contextMenu.element.id)
                setContextMenu({ show: false, x: 0, y: 0, element: null })
              }}>
                📋 Duplicate
              </div>
              <div className="context-menu-separator"></div>
              <div className="context-menu-item delete" onClick={() => {
                deleteElement(contextMenu.element.id)
                setContextMenu({ show: false, x: 0, y: 0, element: null })
              }}>
                🗑️ Delete {contextMenu.element.type}
              </div>
            </div>
          )}

          {/* Edit Element Modal */}
          {editMode && selectedElement && (
            <div className="edit-modal">
              <div className="edit-modal-content">
                <h3>Edit {selectedElement.type}</h3>
                <ElementEditor 
                  element={selectedElement}
                  onUpdate={(updates) => updateElement(selectedElement.id, updates)}
                  onCancel={() => {
                    setEditMode(false)
                    setSelectedElement(null)
                  }}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default App