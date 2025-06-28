"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useSession } from "@/hooks/use-session";

export default function RedisDebug() {
  const [status, setStatus] = useState<string>("Not checked");
  const { sessionId } = useSession();

  const checkRedis = async () => {
    try {
      setStatus("Checking...");
      const response = await fetch("/api/session?action=stats");
      const result = await response.json();

      if (result.success) {
        setStatus(`Connected! Sessions: ${result.stats.sessionCount}`);
      } else {
        setStatus("Error: " + JSON.stringify(result));
      }
    } catch (error) {
      setStatus("Error: " + String(error));
    }
  };

  const checkCurrentSession = async () => {
    try {
      setStatus("Checking current session...");
      const response = await fetch(
        `/api/session?sessionId=${sessionId}&action=debug`
      );
      const result = await response.json();

      if (result.success) {
        setStatus("Session debug info logged to console");
      } else {
        setStatus("Session check failed: " + JSON.stringify(result));
      }
    } catch (error) {
      setStatus("Session check error: " + String(error));
    }
  };

  return (
    <Card className="bg-[#313244] border-[#45475a] mb-4">
      <CardHeader>
        <CardTitle className="text-[#cdd6f4]">
          Redis Connection Status
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <p className="text-[#6c7086]">Status: {status}</p>
          <p className="text-[#6c7086]">Session ID: {sessionId}</p>
          <div className="flex gap-2">
            <Button onClick={checkRedis} size="sm">
              Check Redis
            </Button>
            <Button onClick={checkCurrentSession} size="sm" variant="outline">
              Debug Session
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
