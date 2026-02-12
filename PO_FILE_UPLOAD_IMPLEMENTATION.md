# PO File Upload Implementation - Summary

## Overview
Successfully implemented PO file upload functionality for the Purchase Indent module, replacing the "Link PO" button with a file upload feature that allows QMS users to upload PO files and enables everyone to view them.

## Changes Made

### 1. Database Schema Update
**File:** `server/database/add_purchase_indent_columns.sql`
- Added `po_file_path VARCHAR(255)` column to store uploaded file paths
- Run this SQL script to update your database:
  ```sql
  ALTER TABLE purchase_indents ADD COLUMN po_file_path VARCHAR(255) DEFAULT NULL;
  ```

### 2. Backend Implementation

#### A. File Upload Middleware
**File:** `server/middleware/fileUpload.js` (NEW)
- Created multer configuration for handling file uploads
- Supports: PDF, JPEG, PNG, DOC, DOCX, XLS, XLSX
- Max file size: 10MB
- Files saved in: `server/uploads/po-files/`
- Filename format: `po-{timestamp}-{random}-{originalname}`

#### B. Server Configuration
**File:** `server/index.js`
- Added static file serving for `/uploads` directory
- Files accessible via: `http://localhost:3000/uploads/po-files/{filename}`

#### C. API Routes
**File:** `server/routes/purchaseIndentRoutes.js`
- Added new route: `POST /api/purchase-indents/:id/upload-po`
- Uses multer middleware for file handling

#### D. Controller
**File:** `server/controllers/purchaseIndentController.js`
- Added `uploadPOFile` function to handle file uploads
- Updates `po_file_path` in database
- Returns file path and original filename on success

#### E. Dependencies
**File:** `server/package.json`
- Multer already installed (v2.0.2)

### 3. Frontend Implementation

#### A. API Service
**File:** `client/src/services/apiService.js`
- Added `uploadPOFile` function in purchaseIndentService
- Uses FormData for multipart file upload
- Handles authentication with Bearer token

#### B. Purchase Indent Component
**File:** `client/src/Pages/QMS/PurchaseIndent/PurchaseIndents.jsx`
- **Imports:** Added `Upload`, `FileText`, `Eye` icons and `useRef` hook
- **State:** 
  - Added `uploadingFile` state for upload status
  - Added `fileInputRef` ref for file input
  - Added `poFilePath` to formData
- **Functions:**
  - `handlePOFileUpload`: Handles file selection and upload
  - `handleViewPOFile`: Opens uploaded file in new tab
- **UI Changes:**
  - Replaced "Link PO" button with "Upload PO File" button
  - Added "View PO File" button (shown when file exists)
  - Added file input (hidden)
  - Shows upload status messages
  - Displays warning if indent not saved yet

### 4. File Structure
```
server/
  uploads/
    po-files/
      .gitkeep          (ensures directory exists in git)
  middleware/
    fileUpload.js       (NEW - multer configuration)
```

### 5. Git Configuration
**File:** `server/.gitignore`
- Added `/uploads/po-files/*` to ignore uploaded files
- Exception for `.gitkeep` to maintain directory structure

## How It Works

### Upload Process
1. User opens Purchase Indent in QMS
2. User saves/submits the indent (required)
3. User clicks "Upload PO File" button
4. File selection dialog opens
5. User selects a file (PDF, image, or document)
6. File uploads to server
7. Server saves file and returns file path
8. File path stored in database
9. "View PO File" button appears

### View Process
1. Any user with access to the indent can see "View PO File" button
2. Clicking button opens file in new browser tab
3. File served from: `http://localhost:3000/uploads/po-files/{filename}`

## Security Features
- Authentication required for upload (Bearer token)
- File type validation (only allowed formats)
- File size limit (10MB max)
- Unique filename generation prevents conflicts
- Indent must exist before upload

## User Roles
- **QMS:** Can upload PO files
- **All Users:** Can view uploaded PO files

## Testing Steps

1. **Run Database Migration:**
   ```sql
   USE bhuvaneswari;
   ALTER TABLE purchase_indents ADD COLUMN po_file_path VARCHAR(255) DEFAULT NULL;
   ```

2. **Start Server:**
   ```bash
   cd server
   npm run dev
   ```

3. **Start Client:**
   ```bash
   cd client
   npm run dev
   ```

4. **Test Upload:**
   - Login as QMS user
   - Open/Create a Purchase Indent
   - Save the indent first
   - Click "Upload PO File"
   - Select a PDF/image/document
   - Verify success message
   - See "View PO File" button appear

5. **Test View:**
   - Click "View PO File" button
   - Verify file opens in new tab
   - Test with different user roles

## Environment Variables
Ensure your `.env` file has:
```
PORT=3000
CLIENT_URL=http://localhost:5173
```

And client has (`.env` or `vite.config.js`):
```
VITE_API_URL=http://localhost:3000
```

## Notes
- Files are stored permanently until manually deleted
- Consider implementing file deletion when indent is deleted
- Consider adding file size display in UI
- May want to add admin panel for managing uploaded files
- Future: Add multiple file support if needed
