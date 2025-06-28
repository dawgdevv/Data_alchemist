import { useState, useEffect, useCallback, useRef } from "react";
import { v4 as uuidv4 } from "uuid";

interface ParsedFileData {
  headers: string[];
  data: Record<string, any>[];
  fileName: string;
  fileType: string;
}

interface SessionData {
  [key: string]: ParsedFileData;
}

const STORAGE_KEYS = {
  SESSION_ID: "data-alchemist-session",
  SESSION_DATA: "data-alchemist-data",
  SESSION_VERSION: "data-alchemist-version",
};

export function useSession() {
  const [sessionId, setSessionId] = useState<string>("");
  const [sessionData, setSessionData] = useState<SessionData>({});
  const [isLoading, setIsLoading] = useState(false);
  const [lastValidationResult, setLastValidationResult] = useState<any>(null);

  const isUpdatingRef = useRef(false);
  const pendingUpdatesRef = useRef<Map<string, any>>(new Map());
  const isMountedRef = useRef(true);

  // Backup session data to localStorage
  const backupToLocalStorage = useCallback((data: SessionData) => {
    try {
      localStorage.setItem(STORAGE_KEYS.SESSION_DATA, JSON.stringify(data));
      localStorage.setItem(STORAGE_KEYS.SESSION_VERSION, String(Date.now()));
      console.log("Backed up session data to localStorage:", Object.keys(data));
    } catch (error) {
      console.warn("Failed to backup to localStorage:", error);
    }
  }, []);

  // Restore session data from localStorage
  const restoreFromLocalStorage = useCallback((): SessionData => {
    try {
      const storedData = localStorage.getItem(STORAGE_KEYS.SESSION_DATA);
      if (storedData) {
        const parsed = JSON.parse(storedData);
        console.log(
          "Restored session data from localStorage:",
          Object.keys(parsed)
        );
        return parsed;
      }
    } catch (error) {
      console.warn("Failed to restore from localStorage:", error);
    }
    return {};
  }, []);

  // Validation function
  const validateCurrentSession = useCallback(async () => {
    if (!sessionId || Object.keys(sessionData).length === 0) {
      console.log("No session data to validate");
      return null;
    }

    try {
      console.log("Running validation for current session...");
      const response = await fetch("/api/validate-session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ sessionId }),
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success && isMountedRef.current) {
          setLastValidationResult(result.validation);
          console.log("Validation completed:", result.validation);
          return result.validation;
        }
      }
    } catch (error) {
      console.error("Failed to validate session:", error);
    }
    return null;
  }, [sessionId, sessionData]);

  // Load session data function
  const loadSessionData = useCallback(
    async (id: string) => {
      if (!isMountedRef.current) return;

      try {
        setIsLoading(true);

        // Check if session exists in Redis
        const existsResponse = await fetch(
          `/api/session?sessionId=${id}&action=exists`
        );
        const existsResult = await existsResponse.json();

        if (existsResult.exists) {
          console.log("Session found in Redis, loading...");
          const response = await fetch(`/api/upload?sessionId=${id}`);

          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }

          const result = await response.json();

          if (isMountedRef.current && result.sessionData) {
            console.log(
              "Loaded session data from Redis:",
              Object.keys(result.sessionData)
            );
            setSessionData(result.sessionData);
            backupToLocalStorage(result.sessionData);

            // ✅ Run validation after loading session data
            if (Object.keys(result.sessionData).length > 0) {
              console.log("Running validation for restored session data...");
              setTimeout(async () => {
                try {
                  const validationResponse = await fetch(
                    "/api/validate-session",
                    {
                      method: "POST",
                      headers: {
                        "Content-Type": "application/json",
                      },
                      body: JSON.stringify({ sessionId: id }),
                    }
                  );

                  if (validationResponse.ok) {
                    const validationResult = await validationResponse.json();
                    if (validationResult.success && isMountedRef.current) {
                      setLastValidationResult(validationResult.validation);
                      console.log(
                        "Validation completed for restored session:",
                        validationResult.validation
                      );
                    }
                  }
                } catch (validationError) {
                  console.error(
                    "Failed to validate restored session:",
                    validationError
                  );
                }
              }, 100);
            }
          }
        } else {
          console.log("No session found in Redis, checking localStorage...");
          const localData = restoreFromLocalStorage();
          if (Object.keys(localData).length > 0 && isMountedRef.current) {
            console.log("Using localStorage fallback data");
            setSessionData(localData);

            // ✅ Run validation for localStorage data too
            setTimeout(async () => {
              try {
                const validationResponse = await fetch(
                  "/api/validate-session",
                  {
                    method: "POST",
                    headers: {
                      "Content-Type": "application/json",
                    },
                    body: JSON.stringify({ sessionId: id }),
                  }
                );

                if (validationResponse.ok) {
                  const validationResult = await validationResponse.json();
                  if (validationResult.success && isMountedRef.current) {
                    setLastValidationResult(validationResult.validation);
                    console.log(
                      "Validation completed for localStorage data:",
                      validationResult.validation
                    );
                  }
                }
              } catch (validationError) {
                console.error(
                  "Failed to validate localStorage data:",
                  validationError
                );
              }
            }, 100);
          } else if (isMountedRef.current) {
            setSessionData({});
          }
        }
      } catch (error) {
        console.error("Failed to load session data:", error);
        const localData = restoreFromLocalStorage();
        if (Object.keys(localData).length > 0 && isMountedRef.current) {
          console.log("Using localStorage as final fallback");
          setSessionData(localData);
        } else if (isMountedRef.current) {
          setSessionData({});
        }
      } finally {
        if (isMountedRef.current) {
          setIsLoading(false);
        }
      }
    },
    [backupToLocalStorage, restoreFromLocalStorage]
  );

  // Upload file function
  const uploadFile = useCallback(
    async (file: File, fileType: string) => {
      if (!sessionId) {
        throw new Error("Session not initialized");
      }

      const formData = new FormData();
      formData.append("file", file);
      formData.append("fileType", fileType);
      formData.append("sessionId", sessionId);

      try {
        setIsLoading(true);
        const response = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });

        if (!response.ok) {
          throw new Error(`Upload failed with status: ${response.status}`);
        }

        const result = await response.json();

        if (result.success) {
          if (isMountedRef.current) {
            console.log(
              "Upload result - Files:",
              Object.keys(result.sessionData || {})
            );
            setSessionData(result.sessionData || {});
            setLastValidationResult(result.validation || null);
            backupToLocalStorage(result.sessionData || {});
          }
          return result;
        } else {
          throw new Error(result.error || "Upload failed");
        }
      } catch (error) {
        console.error("Upload failed:", error);
        throw error;
      } finally {
        if (isMountedRef.current) {
          setIsLoading(false);
        }
      }
    },
    [sessionId, backupToLocalStorage]
  );

  // Update session data function
  const updateSessionData = useCallback(
    async (fileType: string, newData: ParsedFileData) => {
      if (!sessionId) {
        throw new Error("Session not initialized");
      }

      if (isUpdatingRef.current) {
        console.warn("Update already in progress, queuing...");
        pendingUpdatesRef.current.set(fileType, newData);
        return Promise.resolve();
      }

      try {
        isUpdatingRef.current = true;
        setIsLoading(true);

        const originalData = { ...sessionData };
        const localBackupData = restoreFromLocalStorage();

        const optimisticUpdate = {
          ...originalData,
          ...localBackupData,
          [fileType]: { ...newData },
        };

        if (isMountedRef.current) {
          setSessionData(optimisticUpdate);
          backupToLocalStorage(optimisticUpdate);
        }

        const response = await fetch("/api/update-session", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            sessionId,
            fileType,
            data: newData,
            allSessionData: optimisticUpdate,
          }),
        });

        if (!response.ok) {
          throw new Error(`Update failed with status: ${response.status}`);
        }

        const result = await response.json();

        if (result.success) {
          if (isMountedRef.current) {
            setSessionData(result.sessionData || {});

            if (result.validation) {
              setLastValidationResult(result.validation);
            }

            backupToLocalStorage(result.sessionData || {});
          }
          return result;
        } else {
          if (isMountedRef.current) {
            setSessionData(originalData);
            backupToLocalStorage(originalData);
          }
          throw new Error(result.error || "Update failed");
        }
      } catch (error) {
        console.error("Update failed:", error);
        const fallbackData = restoreFromLocalStorage();
        if (Object.keys(fallbackData).length > 0 && isMountedRef.current) {
          setSessionData(fallbackData);
        }
        throw error;
      } finally {
        isUpdatingRef.current = false;
        if (isMountedRef.current) {
          setIsLoading(false);
        }

        if (pendingUpdatesRef.current.size > 0) {
          const [nextFileType, nextData] = pendingUpdatesRef.current
            .entries()
            .next().value;
          pendingUpdatesRef.current.delete(nextFileType);

          setTimeout(() => {
            if (isMountedRef.current) {
              updateSessionData(nextFileType, nextData);
            }
          }, 200);
        }
      }
    },
    [sessionId, sessionData, restoreFromLocalStorage, backupToLocalStorage]
  );

  // Update session cell function
  const updateSessionCell = useCallback(
    async (fileType: string, rowIndex: number, column: string, value: any) => {
      const currentFileData = sessionData[fileType];
      if (!currentFileData) {
        throw new Error(`File type ${fileType} not found`);
      }

      const updatedData = {
        ...currentFileData,
        data: currentFileData.data.map((row, index) =>
          index === rowIndex ? { ...row, [column]: value } : row
        ),
      };

      const result = await updateSessionData(fileType, updatedData);
      return result;
    },
    [sessionData, updateSessionData]
  );

  // Check session exists function
  const checkSessionExists = useCallback(
    async (id: string): Promise<boolean> => {
      try {
        const response = await fetch(
          `/api/session?sessionId=${id}&action=exists`
        );
        const result = await response.json();
        return result.exists;
      } catch (error) {
        console.error("Failed to check session existence:", error);
        return false;
      }
    },
    []
  );

  // Delete session from server function
  const deleteSessionFromServer = useCallback(
    async (id: string): Promise<void> => {
      try {
        await fetch(`/api/session?sessionId=${id}`, { method: "DELETE" });
        console.log("Session deleted from server");
      } catch (error) {
        console.error("Failed to delete session from server:", error);
      }
    },
    []
  );

  // Clear session function
  const clearSession = useCallback(async () => {
    try {
      if (sessionId) {
        await deleteSessionFromServer(sessionId);
      }

      localStorage.removeItem(STORAGE_KEYS.SESSION_ID);
      localStorage.removeItem(STORAGE_KEYS.SESSION_DATA);
      localStorage.removeItem(STORAGE_KEYS.SESSION_VERSION);

      const newId = uuidv4();
      localStorage.setItem(STORAGE_KEYS.SESSION_ID, newId);

      if (isMountedRef.current) {
        setSessionData({});
        setLastValidationResult(null);
        setSessionId(newId);
      }
    } catch (error) {
      console.error("Failed to clear session:", error);
    }
  }, [sessionId, deleteSessionFromServer]);

  // Initialize session
  useEffect(() => {
    isMountedRef.current = true;

    let id = "";
    try {
      id = localStorage.getItem(STORAGE_KEYS.SESSION_ID) || "";
      if (!id) {
        id = uuidv4();
        localStorage.setItem(STORAGE_KEYS.SESSION_ID, id);
      }
      setSessionId(id);

      // Load session data from Redis/backend
      loadSessionData(id);
    } catch (error) {
      console.error("Failed to initialize session:", error);
      id = uuidv4();
      setSessionId(id);
      localStorage.setItem(STORAGE_KEYS.SESSION_ID, id);
    }

    return () => {
      isMountedRef.current = false;
    };
  }, [loadSessionData]);

  return {
    sessionId,
    sessionData,
    isLoading,
    lastValidationResult,
    uploadFile,
    updateSessionData,
    updateSessionCell,
    clearSession,
    loadSessionData: () => sessionId && loadSessionData(sessionId),
    checkSessionExists,
    deleteSessionFromServer,
    backupToLocalStorage: () => backupToLocalStorage(sessionData),
    restoreFromLocalStorage,
    validateCurrentSession,
  };
}
