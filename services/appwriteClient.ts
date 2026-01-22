
import { Client, Databases, Account } from 'appwrite';

export const PROJECT_ID = '6972389a001da7b10bb1'; // Ganti dengan Project ID Appwrite Anda
export const DATABASE_ID = 'aksoro-db';

// Repurposing 'app_state' collection to act as 'events' collection
// Each document in this collection is now a separate Event
export const COLLECTION_EVENTS = 'app_state'; 

export const COLLECTION_SESSIONS = 'sessions';
export const COLLECTION_QUEUE = 'queue';
export const COLLECTION_ADMINS = 'admins'; 

// We no longer use a single static doc ID globally, 
// but we might keep it for backward compatibility or default fallback
export const LEGACY_GLOBAL_STATE_DOC_ID = 'global_state_config'; 

const client = new Client();

client
    .setEndpoint('https://appwrite.app.malika.ai/v1')
    .setProject(PROJECT_ID);

export const databases = new Databases(client);
export const account = new Account(client);
export { client };
