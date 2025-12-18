# Sketch2Print Deployment Guide

## Backend Deployment (Render)

1. **Create Web Service on Render:**
   - Repository: Connect your GitHub repo
   - Root Directory: `backend`
   - Build Command: `npm install`
   - Start Command: `npm start`

2. **Environment Variables:**
   ```
   NODE_ENV=production
   PORT=10000
   CORS_ORIGIN=*
   APP_NAME=Sketch2Print
   APP_VERSION=1.0.0
   MAX_FILE_SIZE=10485760
   UPLOAD_DIR=./uploads
   PDF_COMPRESSION=true
   PDF_MAX_WIDTH=2000
   PDF_MAX_HEIGHT=2000
   PDF_DEFAULT_FILENAME=sketch2print-export.pdf
   ```

3. **Test Backend:**
   - Visit: `https://your-backend-url.onrender.com/health`
   - Should return: `{"status":"OK","service":"Sketch2Print Backend"}`

## Frontend Deployment (Render Static Site)

1. **Create Static Site on Render:**
   - Repository: Connect your GitHub repo
   - Root Directory: `frontend`
   - Build Command: `npm install && npm run build`
   - Publish Directory: `dist`

2. **Environment Variables:**
   ```
   VITE_API_URL=https://your-backend-url.onrender.com/api
   NODE_ENV=production
   ```

3. **Test Frontend:**
   - Visit your frontend URL
   - Check browser console for API connection
   - Test adding shapes and PDF export

## Troubleshooting

### Backend Issues:
- Check Render logs for errors
- Verify environment variables are set
- Test health endpoint directly

### Frontend Issues:
- Check browser console for CORS errors
- Verify API_URL environment variable
- Test API endpoints directly in browser

### CORS Issues:
- Backend allows all origins (`CORS_ORIGIN=*`)
- Check browser network tab for failed requests
- Verify frontend is using correct API URL

## Post-Deployment Checklist:
- [ ] Backend health check works
- [ ] Frontend loads without errors
- [ ] Can add shapes to canvas
- [ ] Can export PDF
- [ ] No CORS errors in browser console