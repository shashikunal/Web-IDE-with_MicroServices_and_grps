# Postman-like Features Implementation Plan

## Current Status ✅
The API Tester already has MongoDB persistence with user ID integration! Here's what's working:

### Backend (Already Implemented)
- ✅ MongoDB models for Collections, Requests, Environments, and History
- ✅ API Test Service with full CRUD operations
- ✅ Gateway routes with authentication
- ✅ Redis caching for performance
- ✅ RabbitMQ event publishing

### Frontend (Partially Implemented)
- ✅ Collections sidebar
- ✅ Request editor with tabs (Params, Auth, Headers, Body, Tests)
- ✅ Response viewer
- ✅ History panel
- ✅ Environment variables support
- ✅ Variable substitution with {{variable}} syntax

## Issues to Fix 🔧

### 1. Gateway Route Mismatch
**Problem:** Gateway uses different HTTP methods than frontend expects
- Gateway POST `/collections` expects PUT method
- Gateway POST `/requests` expects PUT method
- Frontend uses GET for collections but gateway expects POST

**Solution:** Fix gateway routes to match REST conventions

### 2. Frontend API Integration
**Problem:** Frontend makes incorrect API calls
- Uses `workspaceId` query param instead of authenticated user
- Doesn't properly handle response structure
- Missing error handling

**Solution:** Update frontend to use proper authenticated endpoints

### 3. Missing Postman Features
Need to add:
- ✅ Collections (implemented)
- ✅ Requests (implemented)
- ✅ Environments (implemented)
- ✅ History (implemented)
- ⚠️ Folders/Nested collections (partially - parentId exists)
- ❌ Request duplication
- ❌ Collection export/import
- ❌ Pre-request scripts
- ❌ Tests/Assertions
- ❌ Collection runner
- ❌ Variables (global, collection, environment) - only environment exists
- ❌ Request description/documentation
- ❌ Code generation (curl, etc.)

## Implementation Steps

### Phase 1: Fix Current Integration (Priority: HIGH)

#### Step 1.1: Fix Gateway Routes
File: `services/gateway/src/routes/api-test.js`

**Changes:**
```javascript
// Collections
router.get('/collections', ...) // ✅ Already correct
router.post('/collections', ...) // Change internal method from PUT to POST
router.put('/collections/:id', ...) // Add update endpoint
router.delete('/collections/:id', ...) // ✅ Already correct

// Requests  
router.get('/requests', ...) // ✅ Already correct
router.post('/requests', ...) // Change internal method from PUT to POST
router.put('/requests/:id', ...) // Add update endpoint
router.delete('/requests/:id', ...) // ✅ Already correct

// Environments
router.get('/environments', ...) // ✅ Already correct
router.post('/environments', ...) // Change internal method from PUT to POST
router.put('/environments/:id', ...) // Add update endpoint
router.delete('/environments/:id', ...) // ✅ Already correct

// History
router.get('/history', ...) // ✅ Already correct
router.post('/history', ...) // Add create endpoint
```

#### Step 1.2: Fix Backend Service
File: `services/api-test-service/src/index.js`

**Changes:**
```javascript
// Add PUT endpoints for updates
app.put('/collections/:id', ...) // Update collection
app.put('/requests/:id', ...) // Update request
app.put('/environments/:id', ...) // Update environment

// Fix POST endpoints to create new documents
app.post('/collections', ...) // Create new collection
app.post('/requests', ...) // Create new request
app.post('/environments', ...) // Create new environment
```

#### Step 1.3: Fix Frontend API Calls
File: `frontend/src/components/api-test/ApiTestPanel.tsx`

**Changes:**
```typescript
// Fix loadData to use proper endpoints
const loadData = async () => {
  const token = localStorage.getItem('token');
  const headers = { 
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  };

  const [colRes, reqRes, histRes, envRes] = await Promise.all([
    axios.get('http://localhost:3000/api/apitest/collections', { headers }),
    axios.get('http://localhost:3000/api/apitest/requests', { headers }),
    axios.get('http://localhost:3000/api/apitest/history', { headers }),
    axios.get('http://localhost:3000/api/apitest/environments', { headers })
  ]);

  setCollections(colRes.data.collections || []);
  setRequests(reqRes.data.requests || []);
  setHistoryItems(histRes.data.history || []);
  setEnvironments(envRes.data.environments || []);
};

// Fix create/update/delete methods
const handleCreateCollection = async (name: string) => {
  const token = localStorage.getItem('token');
  const res = await axios.post(
    'http://localhost:3000/api/apitest/collections',
    { name, parentId: null },
    { headers: { 'Authorization': `Bearer ${token}` } }
  );
  setCollections([...collections, res.data.collection]);
};

// Similar fixes for other CRUD operations
```

### Phase 2: Add Missing Postman Features (Priority: MEDIUM)

#### Feature 1: Request Duplication
- Add "Duplicate" button in request context menu
- Clone request with new ID
- Append "(Copy)" to name

#### Feature 2: Collection Folders
- Update UI to show nested collections
- Add "New Folder" option
- Implement drag-and-drop for organization

#### Feature 3: Request Description
- Add description field to request model
- Show description in request editor
- Support markdown formatting

#### Feature 4: Pre-request Scripts
- Add pre-request script tab
- Execute JavaScript before request
- Access to environment variables

#### Feature 5: Tests/Assertions
- Enhance test script functionality
- Add assertion library (chai-like)
- Show test results in response viewer

#### Feature 6: Collection Variables
- Add collection-level variables
- Variable precedence: Global < Collection < Environment < Local
- Variable management UI

#### Feature 7: Collection Runner
- Run all requests in collection
- Show progress and results
- Export results

#### Feature 8: Import/Export
- Export collections as JSON
- Import Postman collections
- Support for Postman format v2.1

#### Feature 9: Code Generation
- Generate curl commands
- Generate code snippets (JavaScript, Python, etc.)
- Copy to clipboard

### Phase 3: Advanced Features (Priority: LOW)

#### Feature 1: Mock Servers
- Create mock responses
- Match requests by URL pattern
- Return predefined responses

#### Feature 2: API Documentation
- Auto-generate docs from collections
- Publish documentation
- Share with team

#### Feature 3: Collaboration
- Share collections with team members
- Real-time collaboration
- Comments and annotations

#### Feature 4: Monitoring
- Schedule collection runs
- Monitor API uptime
- Alert on failures

## Database Schema Updates

### Collections
```javascript
{
  _id: ObjectId,
  userId: String, // Required, indexed
  workspaceId: String, // Optional, for workspace-specific collections
  name: String,
  description: String, // NEW
  parentId: String, // For folders
  variables: Map<String, String>, // NEW - Collection variables
  auth: Object, // NEW - Collection-level auth
  createdAt: Date,
  updatedAt: Date
}
```

### Requests
```javascript
{
  _id: ObjectId,
  userId: String,
  workspaceId: String,
  collectionId: String,
  name: String,
  description: String, // NEW
  method: String,
  url: String,
  headers: [{ key, value, enabled }],
  bodyType: String,
  body: Mixed,
  formData: [{ key, value, type, enabled }],
  auth: Object,
  preRequestScript: String, // NEW
  testScript: String,
  createdAt: Date,
  updatedAt: Date
}
```

### Environments
```javascript
{
  _id: ObjectId,
  userId: String,
  workspaceId: String,
  name: String,
  variables: Map<String, String>,
  isGlobal: Boolean, // NEW - For global variables
  createdAt: Date,
  updatedAt: Date
}
```

## Testing Checklist

### Phase 1 Testing
- [ ] Create collection with authentication
- [ ] Create request in collection
- [ ] Update request and save
- [ ] Delete request
- [ ] Delete collection (cascade delete requests)
- [ ] Create environment with variables
- [ ] Use {{variable}} in request URL
- [ ] View request history
- [ ] Execute request and see response

### Phase 2 Testing
- [ ] Duplicate request
- [ ] Create nested folders
- [ ] Add request description
- [ ] Write pre-request script
- [ ] Write test assertions
- [ ] Set collection variables
- [ ] Run collection
- [ ] Export collection
- [ ] Import Postman collection
- [ ] Generate curl command

## API Endpoints Summary

### Collections
- `GET /api/apitest/collections` - List all collections for user
- `POST /api/apitest/collections` - Create new collection
- `PUT /api/apitest/collections/:id` - Update collection
- `DELETE /api/apitest/collections/:id` - Delete collection

### Requests
- `GET /api/apitest/requests?collectionId=xxx` - List requests
- `POST /api/apitest/requests` - Create new request
- `PUT /api/apitest/requests/:id` - Update request
- `DELETE /api/apitest/requests/:id` - Delete request
- `POST /api/apitest/requests/:id/duplicate` - Duplicate request

### Environments
- `GET /api/apitest/environments` - List environments
- `POST /api/apitest/environments` - Create environment
- `PUT /api/apitest/environments/:id` - Update environment
- `DELETE /api/apitest/environments/:id` - Delete environment

### History
- `GET /api/apitest/history` - List history
- `POST /api/apitest/history` - Add to history
- `DELETE /api/apitest/history/:id` - Delete history item

### Execution
- `POST /api/apitest/execute` - Execute request

## Next Steps

1. **Fix gateway routes** (30 minutes)
2. **Fix backend service endpoints** (30 minutes)
3. **Update frontend API integration** (1 hour)
4. **Test basic CRUD operations** (30 minutes)
5. **Add missing features incrementally** (ongoing)

---

**Status:** Ready to implement Phase 1
**Estimated Time:** 2-3 hours for Phase 1
**Dependencies:** None - all infrastructure is in place
