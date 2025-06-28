import { createClient } from "redis";

const redisUrl = process.env.REDIS_URL || "redis://localhost:6379";

let client: ReturnType<typeof createClient> | null = null;

export async function getRedisClient() {
  if (!client) {
    client = createClient({
      url: redisUrl,
      socket: {
        connectTimeout: 60000,
        lazyConnect: true,
      },
    });

    client.on("error", (err) => {
      console.error("Redis Client Error:", err);
    });

    client.on("connect", () => {
      console.log("Redis Client Connected");
    });

    client.on("disconnect", () => {
      console.log("Redis Client Disconnected");
    });
  }

  if (!client.isOpen) {
    await client.connect();
  }

  return client;
}

export async function closeRedisConnection() {
  if (client && client.isOpen) {
    await client.disconnect();
    client = null;
  }
}

// Graceful shutdown
if (typeof process !== "undefined") {
  process.on("SIGINT", closeRedisConnection);
  process.on("SIGTERM", closeRedisConnection);
}
