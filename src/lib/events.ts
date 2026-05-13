import "server-only";
import { EventEmitter } from "events";

// Singleton so hot-reload in dev doesn't create multiple instances.
const globalForEvents = globalThis as unknown as { __adminEvents?: EventEmitter };

export const adminEvents: EventEmitter =
  globalForEvents.__adminEvents ?? new EventEmitter();

adminEvents.setMaxListeners(50); // allow up to 50 concurrent admin tabs

if (process.env.NODE_ENV !== "production") {
  globalForEvents.__adminEvents = adminEvents;
}
