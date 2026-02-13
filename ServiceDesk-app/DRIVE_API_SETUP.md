# Drive Page - API Configuration Setup

## 🔧 Environment Configuration

The Drive page requires the `NEXT_PUBLIC_API_URL` environment variable to be set for proper API communication.

### Required Environment Variable

```bash
NEXT_PUBLIC_API_URL=http://localhost:5000/api/v1
```

### Setup Instructions

1. **Create `.env.local` file** in the project root:
   ```bash
   cd /Users/nawaf-space/CascadeProjects/ServiceDesk/ServiceDesk-app
   ```

2. **Add the following line** to `.env.local`:
   ```
   NEXT_PUBLIC_API_URL=http://localhost:5000/api/v1
   ```

3. **Restart the development server**:
   ```bash
   npm run dev
   ```

### Environment Variables Explained

| Variable | Value | Purpose |
|----------|-------|---------|
| `NEXT_PUBLIC_API_URL` | `http://localhost:5000/api/v1` | Backend API base URL for file operations |

### API Endpoints Used

The Drive page communicates with these backend endpoints:

- `GET /api/v1/files/{fileId}/preview` - Preview file content
- `GET /api/v1/files/{fileId}/download` - Download file
- `GET /api/v1/files/{fileId}` - Get file metadata
- `POST /api/v1/files/upload` - Upload files
- `POST /api/v1/folders` - Create folders
- `GET /api/v1/folders` - List folder contents
- `GET /api/v1/folders/{folderId}` - Get folder contents
- `PUT /api/v1/files/{fileId}` - Update file metadata
- `DELETE /api/v1/files/{fileId}` - Delete file
- `GET /api/v1/files/search` - Search files
- `GET /api/v1/files/stats` - Get storage stats

### Error: "404 Not Found" on Preview

If you see errors like:
```
GET http://localhost:3000/undefined/files/694a2bd1c6078b7c5ce7921c/preview 404
```

**This means `NEXT_PUBLIC_API_URL` is not set.**

**Solution**: Add the environment variable to `.env.local` and restart the server.

### Fallback Behavior

The Drive page has a built-in fallback:
```typescript
const apiUrl = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, '') || 'http://localhost:5000/api/v1';
```

If `NEXT_PUBLIC_API_URL` is not set, it defaults to `http://localhost:5000/api/v1`.

### Verification

After setting the environment variable:

1. **Check the browser console** - No more "undefined" in URLs
2. **File previews work** - Images, PDFs, and text files display correctly
3. **File uploads work** - Can upload files to the Drive
4. **Folder operations work** - Can create and navigate folders

### Production Deployment

For production, set `NEXT_PUBLIC_API_URL` to your production API URL:

```bash
NEXT_PUBLIC_API_URL=https://api.yourdomain.com/api/v1
```

### Troubleshooting

**Issue**: Still seeing "undefined" in URLs
- **Solution**: Verify `.env.local` is in the project root (not in a subdirectory)
- **Solution**: Restart the dev server after adding the environment variable
- **Solution**: Check that the variable name is exactly `NEXT_PUBLIC_API_URL` (case-sensitive)

**Issue**: 404 errors when previewing files
- **Solution**: Ensure backend is running: `docker-compose up -d` in ServiceDesk-backend
- **Solution**: Verify the API URL is correct and accessible
- **Solution**: Check authentication token is valid

**Issue**: CORS errors
- **Solution**: Backend should have CORS enabled for your frontend URL
- **Solution**: Check backend CORS configuration in `src/app.ts`
