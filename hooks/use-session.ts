import { useState, useEffect } from "react";
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

export function useSession() {
  const [sessionId, setSessionId] = useState<string>("");
  const [sessionData, setSessionData] = useState<SessionData>({});
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Get or create session ID
    let id = localStorage.getItem("data-alchemist-session");
    if (!id) {
      id = uuidv4();
      localStorage.setItem("data-alchemist-session", id);
    }
    setSessionId(id);

    // Load existing session data
    loadSessionData(id);
  }, []);

  const loadSessionData = async (id: string) => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/upload?sessionId=${id}`);
      const result = await response.json();
      setSessionData(result.sessionData || {});
    } catch (error) {
      console.error("Failed to load session data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const uploadFile = async (file: File, fileType: string) => {
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

      const result = await response.json();
      if (result.success) {
        setSessionData(result.sessionData);
        return result.data;
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error("Upload failed:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const clearSession = () => {
    localStorage.removeItem("data-alchemist-session");
    setSessionData({});
    const newId = uuidv4();
    setSessionId(newId);
    localStorage.setItem("data-alchemist-session", newId);
  };

  return {
    sessionId,
    sessionData,
    isLoading,
    uploadFile,
    clearSession,
    loadSessionData: () => loadSessionData(sessionId),
  };
}
