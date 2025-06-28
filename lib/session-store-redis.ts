import { getRedisClient } from "./redis-config";

interface ParsedFileData {
  headers: string[];
  data: Record<string, any>[];
  fileName: string;
  fileType: string;
}

interface SessionData {
  [key: string]: ParsedFileData;
}

interface SessionMetadata {
  lastAccessed: number;
  lastModified: number;
  version: number;
  createdAt: number;
  userAgent?: string;
  ipAddress?: string;
}

// Session configuration
const SESSION_TTL = parseInt(process.env.SESSION_TTL || "86400"); // 24 hours default
const SESSION_PREFIX = "data-alchemist:session:";
const METADATA_PREFIX = "data-alchemist:metadata:";

// Fallback in-memory store for development/fallback
const memoryCache = new Map<string, SessionData>();
const metadataCache = new Map<string, SessionMetadata>();

// Helper function to create session keys
function getSessionKey(sessionId: string): string {
  return `${SESSION_PREFIX}${sessionId}`;
}

function getMetadataKey(sessionId: string): string {
  return `${METADATA_PREFIX}${sessionId}`;
}

// Deep clone function
function deepClone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
}

// lib/session-store-redis.ts
export async function getSession(sessionId: string): Promise<SessionData> {
  if (!sessionId) {
    console.warn("getSession called with empty sessionId");
    return {};
  }

  try {
    const redis = await getRedisClient();

    // Try to get from Redis first
    const sessionData = await redis.get(getSessionKey(sessionId));

    if (sessionData) {
      const parsed = JSON.parse(sessionData);
      console.log(`getSession(${sessionId}) from Redis:`, {
        files: Object.keys(parsed),
        totalFiles: Object.keys(parsed).length,
      });

      // Update last accessed time
      await updateSessionMetadata(sessionId, { lastAccessed: Date.now() });

      return deepClone(parsed);
    }

    // Fallback to memory cache
    const memoryData = memoryCache.get(sessionId) || {};
    console.log(`getSession(${sessionId}) from memory:`, {
      files: Object.keys(memoryData),
      totalFiles: Object.keys(memoryData).length,
    });

    return deepClone(memoryData);
  } catch (error) {
    console.error("Error getting session from Redis:", error);

    // Fallback to memory cache
    const memoryData = memoryCache.get(sessionId) || {};
    console.log(`getSession(${sessionId}) fallback to memory:`, {
      files: Object.keys(memoryData),
      totalFiles: Object.keys(memoryData).length,
    });

    return deepClone(memoryData);
  }
}

export async function setSession(
  sessionId: string,
  data: SessionData,
  metadata?: Partial<SessionMetadata>
): Promise<void> {
  if (!sessionId) {
    console.warn("setSession called with empty sessionId");
    return;
  }

  try {
    const redis = await getRedisClient();
    const clonedData = deepClone(data);

    // Store session data in Redis with TTL
    await redis.setEx(
      getSessionKey(sessionId),
      SESSION_TTL,
      JSON.stringify(clonedData)
    );

    // Update metadata
    const currentMetadata = await getSessionMetadata(sessionId);
    const newMetadata: SessionMetadata = {
      ...currentMetadata,
      ...metadata,
      lastModified: Date.now(),
      lastAccessed: Date.now(),
      version: (currentMetadata?.version || 0) + 1,
    };

    await redis.setEx(
      getMetadataKey(sessionId),
      SESSION_TTL,
      JSON.stringify(newMetadata)
    );

    // Also store in memory as backup
    memoryCache.set(sessionId, clonedData);
    metadataCache.set(sessionId, newMetadata);

    console.log(`setSession(${sessionId}) to Redis:`, {
      files: Object.keys(clonedData),
      totalFiles: Object.keys(clonedData).length,
      version: newMetadata.version,
    });
  } catch (error) {
    console.error("Error setting session in Redis:", error);

    // Fallback to memory cache
    const clonedData = deepClone(data);
    memoryCache.set(sessionId, clonedData);

    const newMetadata: SessionMetadata = {
      lastAccessed: Date.now(),
      lastModified: Date.now(),
      version: (metadataCache.get(sessionId)?.version || 0) + 1,
      createdAt: metadataCache.get(sessionId)?.createdAt || Date.now(),
      ...metadata,
    };
    metadataCache.set(sessionId, newMetadata);

    console.log(`setSession(${sessionId}) fallback to memory:`, {
      files: Object.keys(clonedData),
      totalFiles: Object.keys(clonedData).length,
    });
  }
}

export async function updateSessionFile(
  sessionId: string,
  fileType: string,
  fileData: ParsedFileData
): Promise<SessionData> {
  if (!sessionId || !fileType || !fileData) {
    throw new Error("Invalid parameters for session update");
  }

  try {
    // Get existing session data
    const existingSessionData = await getSession(sessionId);

    console.log(`updateSessionFile - Before update:`, {
      sessionId,
      fileType,
      existingFiles: Object.keys(existingSessionData),
      existingCount: Object.keys(existingSessionData).length,
    });

    // Create updated session data
    const updatedSessionData: SessionData = {
      ...existingSessionData,
      [fileType]: {
        headers: [...fileData.headers],
        data: fileData.data.map((row) => ({ ...row })),
        fileName:
          fileData.fileName ||
          existingSessionData[fileType]?.fileName ||
          `${fileType}.csv`,
        fileType:
          fileData.fileType ||
          existingSessionData[fileType]?.fileType ||
          fileType,
      },
    };

    // Verify no files are lost
    const existingFiles = Object.keys(existingSessionData);
    const newFiles = Object.keys(updatedSessionData);
    const lostFiles = existingFiles.filter((file) => !newFiles.includes(file));

    if (lostFiles.length > 0) {
      console.error(`CRITICAL: Lost files during update:`, lostFiles);
      // Recover lost files
      lostFiles.forEach((lostFile) => {
        if (existingSessionData[lostFile]) {
          updatedSessionData[lostFile] = existingSessionData[lostFile];
        }
      });
    }

    // Save updated session
    await setSession(sessionId, updatedSessionData);

    console.log(`updateSessionFile - After update:`, {
      sessionId,
      updatedFile: fileType,
      allFiles: Object.keys(updatedSessionData),
      totalCount: Object.keys(updatedSessionData).length,
    });

    return updatedSessionData;
  } catch (error) {
    console.error("Error updating session file:", error);
    throw error;
  }
}

export async function hasSession(sessionId: string): Promise<boolean> {
  if (!sessionId) return false;

  try {
    const redis = await getRedisClient();
    const exists = await redis.exists(getSessionKey(sessionId));
    return exists === 1;
  } catch (error) {
    console.error("Error checking session existence in Redis:", error);
    return memoryCache.has(sessionId);
  }
}

export async function deleteSession(sessionId: string): Promise<void> {
  if (!sessionId) return;

  try {
    const redis = await getRedisClient();
    await redis.del(getSessionKey(sessionId));
    await redis.del(getMetadataKey(sessionId));

    // Also remove from memory cache
    memoryCache.delete(sessionId);
    metadataCache.delete(sessionId);

    console.log(`Deleted session: ${sessionId}`);
  } catch (error) {
    console.error("Error deleting session from Redis:", error);

    // Fallback: remove from memory cache
    memoryCache.delete(sessionId);
    metadataCache.delete(sessionId);
  }
}

export async function updateSessionCell(
  sessionId: string,
  fileType: string,
  rowIndex: number,
  column: string,
  value: any
): Promise<SessionData> {
  const sessionData = await getSession(sessionId);

  if (!sessionData[fileType]) {
    throw new Error(`File type ${fileType} not found in session`);
  }

  try {
    const updatedFileData = {
      ...sessionData[fileType],
      headers: [...sessionData[fileType].headers],
      data: sessionData[fileType].data.map((row, index) =>
        index === rowIndex ? { ...row, [column]: value } : { ...row }
      ),
    };

    return await updateSessionFile(sessionId, fileType, updatedFileData);
  } catch (error) {
    console.error("Error updating session cell:", error);
    throw error;
  }
}

async function getSessionMetadata(
  sessionId: string
): Promise<SessionMetadata | null> {
  try {
    const redis = await getRedisClient();
    const metadata = await redis.get(getMetadataKey(sessionId));

    if (metadata) {
      return JSON.parse(metadata);
    }

    // Fallback to memory
    return metadataCache.get(sessionId) || null;
  } catch (error) {
    console.error("Error getting session metadata:", error);
    return metadataCache.get(sessionId) || null;
  }
}

async function updateSessionMetadata(
  sessionId: string,
  updates: Partial<SessionMetadata>
): Promise<void> {
  try {
    const redis = await getRedisClient();
    const existing = (await getSessionMetadata(sessionId)) || {
      createdAt: Date.now(),
      lastAccessed: Date.now(),
      lastModified: Date.now(),
      version: 1,
    };

    const updated = { ...existing, ...updates };

    await redis.setEx(
      getMetadataKey(sessionId),
      SESSION_TTL,
      JSON.stringify(updated)
    );

    // Update memory cache
    metadataCache.set(sessionId, updated);
  } catch (error) {
    console.error("Error updating session metadata:", error);

    // Fallback to memory
    const existing = metadataCache.get(sessionId) || {
      createdAt: Date.now(),
      lastAccessed: Date.now(),
      lastModified: Date.now(),
      version: 1,
    };
    metadataCache.set(sessionId, { ...existing, ...updates });
  }
}

// Debug and utility functions
export async function debugSession(sessionId: string): Promise<void> {
  const sessionData = await getSession(sessionId);
  const metadata = await getSessionMetadata(sessionId);

  console.log(`=== Session Debug: ${sessionId} ===`);
  console.log(`Files:`, Object.keys(sessionData));
  console.log(`Total Files:`, Object.keys(sessionData).length);
  console.log(`Metadata:`, metadata);
  console.log(
    `Details:`,
    Object.entries(sessionData).map(([key, data]) => ({
      file: key,
      rows: data.data.length,
      headers: data.headers.length,
      fileName: data.fileName,
    }))
  );
  console.log(`=== End Debug ===`);
}

export async function getSessionStats(): Promise<{
  sessionCount: number;
  activeSessions: string[];
  redisInfo?: any;
}> {
  try {
    const redis = await getRedisClient();
    const keys = await redis.keys(`${SESSION_PREFIX}*`);
    const sessionIds = keys.map((key) => key.replace(SESSION_PREFIX, ""));

    return {
      sessionCount: keys.length,
      activeSessions: sessionIds,
      redisInfo: await redis.info("memory"),
    };
  } catch (error) {
    console.error("Error getting session stats:", error);
    return {
      sessionCount: memoryCache.size,
      activeSessions: Array.from(memoryCache.keys()),
    };
  }
}

export async function cleanupExpiredSessions(): Promise<number> {
  try {
    const redis = await getRedisClient();
    const keys = await redis.keys(`${SESSION_PREFIX}*`);

    let cleanedCount = 0;
    for (const key of keys) {
      const ttl = await redis.ttl(key);
      if (ttl <= 0) {
        await redis.del(key);
        cleanedCount++;
      }
    }

    console.log(`Cleaned up ${cleanedCount} expired sessions from Redis`);
    return cleanedCount;
  } catch (error) {
    console.error("Error cleaning up expired sessions:", error);
    return 0;
  }
}

// Export the enhanced session store functions
export { SESSION_TTL, getSessionKey, getMetadataKey, deepClone };
