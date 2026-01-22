
// KONFIGURASI PENTING
// Buat API KEY di Appwrite Console dengan scope:
// - Database: read/write
// - Collections: read/write
// - Attributes: read/write
// - Indexes: read/write
// - Documents: read/write

const CONFIG = {
  ENDPOINT: 'https://cloud.appwrite.io/v1',
  PROJECT_ID: 'GANTI_DENGAN_PROJECT_ID_ANDA', 
  API_KEY: 'GANTI_DENGAN_API_KEY_ANDA',
  DATABASE_ID: 'aksoro-db'
};

// Main Function to Run
function setupAppwriteSchema() {
  Logger.log('=== STARTING APPWRITE SCHEMA SETUP ===');
  
  // 1. Create Database
  createDatabase();
  
  // 2. Create Collections & Attributes
  setupEventsCollection(); // Dulunya App State
  setupSessionsCollection();
  setupQueueCollection();
  setupAdminsCollection();
  
  Logger.log('=== SETUP COMPLETE ===');
  Logger.log('Jangan lupa update PROJECT_ID di file frontend: services/appwriteClient.ts');
}

// --- HELPER FUNCTIONS ---

function callApi(path, method, payload = null) {
  const url = `${CONFIG.ENDPOINT}${path}`;
  const options = {
    method: method,
    headers: {
      'Content-Type': 'application/json',
      'X-Appwrite-Project': CONFIG.PROJECT_ID,
      'X-Appwrite-Key': CONFIG.API_KEY
    },
    muteHttpExceptions: true
  };
  
  if (payload) {
    options.payload = JSON.stringify(payload);
  }
  
  Utilities.sleep(500); // Throttling prevent 429
  const response = UrlFetchApp.fetch(url, options);
  const code = response.getResponseCode();
  const content = response.getContentText();
  
  if (code >= 400) {
    // If resource already exists (409), it's usually fine
    if (code === 409) {
      Logger.log(`[INFO] Resource likely exists: ${path}`);
      return null;
    }
    Logger.log(`[ERROR] ${code} on ${path}: ${content}`);
    return null;
  }
  
  return JSON.parse(content);
}

function createDatabase() {
  Logger.log(`Checking Database: ${CONFIG.DATABASE_ID}`);
  const payload = {
    databaseId: CONFIG.DATABASE_ID,
    name: 'Aksoro Database'
  };
  callApi('/databases', 'post', payload);
}

// --- EVENTS (Formerly App State) ---
function setupEventsCollection() {
  const colId = 'app_state'; // Keeping ID same to avoid breaking changes
  Logger.log(`Setting up Collection: ${colId} (Events)`);
  
  // Create Collection
  callApi(`/databases/${CONFIG.DATABASE_ID}/collections`, 'post', {
    collectionId: colId,
    name: 'Events',
    permissions: [
       'read("any")', // Public Read (for dropdown)
       'create("any")', // Allow create for admin (managed via app logic usually)
       'update("any")' 
    ]
  });
  
  // Create Attributes
  // IMPORTANT: For existing collections with documents, we cannot add REQUIRED attributes without a default value.
  const attributes = [
    // req: false + default value allows adding this to existing documents
    { key: 'event_code', type: 'string', size: 50, req: false, default: 'GENERAL' }, 
    { key: 'is_public', type: 'boolean', req: false, default: true }, 
    { key: 'created_by', type: 'string', size: 255, req: false },
    
    { key: 'is_session_active', type: 'boolean', req: false, default: false },
    { key: 'current_session_id', type: 'string', size: 255, req: false },
    { key: 'active_speaker_id', type: 'string', size: 255, req: false },
    { key: 'event_name', type: 'string', size: 255, req: false, default: 'Event Aksoro' }
  ];
  
  createAttributes(colId, attributes);
  
  Logger.log('Waiting for attributes to be fully processed (20s)...');
  Utilities.sleep(20000); 
  
  // Indexes for querying
  createIndex(colId, 'idx_event_code', 'key', ['event_code']); // Changed to key from unique to allow default values on existing docs
  createIndex(colId, 'idx_is_public', 'key', ['is_public']);
}

// --- ADMINS ---
function setupAdminsCollection() {
  const colId = 'admins';
  Logger.log(`Setting up Collection: ${colId}`);
  
  callApi(`/databases/${CONFIG.DATABASE_ID}/collections`, 'post', {
    collectionId: colId,
    name: 'Admins',
    permissions: [
       'read("any")',
       'create("any")',
       'update("any")'
    ]
  });
  
  const attributes = [
    { key: 'username', type: 'string', size: 255, req: true },
    { key: 'password_hash', type: 'string', size: 255, req: true }
  ];
  createAttributes(colId, attributes);

  Logger.log('Waiting for attributes to be fully processed (15s)...');
  Utilities.sleep(15000);
  
  createIndex(colId, 'idx_username', 'key', ['username']);
  createIndex(colId, 'idx_password_hash', 'key', ['password_hash']);
}

// --- SESSIONS ---
function setupSessionsCollection() {
  const colId = 'sessions';
  Logger.log(`Setting up Collection: ${colId}`);
  
  callApi(`/databases/${CONFIG.DATABASE_ID}/collections`, 'post', {
    collectionId: colId,
    name: 'Sessions History',
    permissions: ['read("any")', 'create("any")', 'update("any")']
  });
  
  const attributes = [
    { key: 'ended_at', type: 'datetime', req: false },
    { key: 'event_code', type: 'string', size: 50, req: false, default: 'GENERAL' } // NEW
  ];
  createAttributes(colId, attributes);
  
  Logger.log('Waiting for attributes to be fully processed (15s)...');
  Utilities.sleep(15000);

  createIndex(colId, 'idx_event_code', 'key', ['event_code']);
}

// --- QUEUE ---
function setupQueueCollection() {
  const colId = 'queue';
  Logger.log(`Setting up Collection: ${colId}`);
  
  callApi(`/databases/${CONFIG.DATABASE_ID}/collections`, 'post', {
    collectionId: colId,
    name: 'Queue Participants',
    permissions: ['read("any")', 'create("any")', 'update("any")']
  });
  
  const attributes = [
    { key: 'session_id', type: 'string', size: 255, req: true },
    { key: 'name', type: 'string', size: 255, req: true },
    { key: 'business_name', type: 'string', size: 255, req: false },
    { key: 'status', type: 'string', size: 50, req: false, default: 'waiting' },
    { key: 'event_code', type: 'string', size: 50, req: false, default: 'GENERAL' } // NEW
  ];
  createAttributes(colId, attributes);
  
  Logger.log('Waiting for attributes to be fully processed (15s)...');
  Utilities.sleep(15000); 
  
  createIndex(colId, 'idx_session', 'key', ['session_id']);
  createIndex(colId, 'idx_status', 'key', ['status']);
  createIndex(colId, 'idx_event_code', 'key', ['event_code']);
}

function createAttributes(colId, attrs) {
  attrs.forEach(attr => {
    let path = `/databases/${CONFIG.DATABASE_ID}/collections/${colId}/attributes`;
    let payload = { key: attr.key, required: attr.req };
    
    if (attr.type === 'string') {
        path += '/string';
        payload.size = attr.size || 255;
    } else if (attr.type === 'boolean') {
        path += '/boolean';
    } else if (attr.type === 'integer') {
        path += '/integer';
    } else if (attr.type === 'datetime') {
        path += '/datetime';
    }
    
    if (attr.default !== undefined) {
        payload.default = attr.default;
    }
    
    callApi(path, 'post', payload);
    Utilities.sleep(1500); 
  });
}

function createIndex(colId, key, type, attrs) {
   Logger.log(`Creating index ${key} on ${colId}`);
   callApi(`/databases/${CONFIG.DATABASE_ID}/collections/${colId}/indexes`, 'post', {
     key: key,
     type: type, // key, fulltext, unique
     attributes: attrs
   });
   Utilities.sleep(1000);
}
