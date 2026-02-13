# Debug: Missing X-Organization-ID Header

## Problem
The API request is failing with 400 Bad Request because the `X-Organization-ID` header is missing.

## Current Request Headers
```json
{
  "Accept": "application/json, text/plain, */*",
  "Content-Type": "application/json",
  "Authorization": "Bearer ..."
  // ❌ Missing: "X-Organization-ID"
}
```

## Solution

### Step 1: Check if organizationId exists in localStorage

Open browser console and run:
```javascript
console.log('organizationId:', localStorage.getItem('organizationId'));
```

If it returns `null`, you need to set it:

```javascript
// Get the organization ID from your user/project data
// Then set it:
localStorage.setItem('organizationId', 'YOUR_ORG_ID_HERE');
```

### Step 2: Restart the dev server

The axios interceptor changes require a restart:

```bash
# Stop the current dev server (Ctrl+C)
# Then restart:
npm run dev
```

### Step 3: Hard refresh the browser

After restart:
- **Mac**: `Cmd + Shift + R`
- **Windows/Linux**: `Ctrl + Shift + R`

Or clear cache:
- Open DevTools → Application → Clear storage → Clear site data

## How to Get Organization ID

### Option 1: From API Response
When you login or fetch user data, the organization ID should be in the response:

```javascript
// After successful login
const response = await api.post('/auth/login', credentials);
const user = response.data;

// Store organization ID
if (user.organizations && user.organizations.length > 0) {
  localStorage.setItem('organizationId', user.organizations[0]._id);
}
```

### Option 2: From Project Data
When you select a project, get the organization from it:

```javascript
// When fetching project
const project = await api.get(`/pm/projects/${projectId}`);
if (project.organizationId) {
  localStorage.setItem('organizationId', project.organizationId);
}
```

### Option 3: Temporary Fix for Testing
If you just want to test Planning Poker now, you can manually set it in the console:

```javascript
// Open browser console and run:
localStorage.setItem('organizationId', '693de9d82e33d18218cfd8dc'); // Use your actual org ID
```

Then refresh the page.

## Verify the Fix

After applying the solution, check the request headers again in Network tab:

```json
{
  "Accept": "application/json, text/plain, */*",
  "Content-Type": "application/json",
  "Authorization": "Bearer ...",
  "X-Organization-ID": "693de9d82e33d18218cfd8dc" // ✅ Should be present
}
```

## Updated axios.ts Code

The interceptor has been updated to automatically add the header:

```typescript
// Request interceptor - add auth token and organization context
axiosInstance.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Add organization context for PM module
    const organizationId = localStorage.getItem('organizationId');
    if (organizationId) {
      config.headers['X-Organization-ID'] = organizationId;
    }
  }
  return config;
});
```

## Next Steps

1. ✅ Set `organizationId` in localStorage
2. ✅ Restart dev server
3. ✅ Hard refresh browser
4. ✅ Test Planning Poker again

The 400 error should be resolved once the `X-Organization-ID` header is present.
