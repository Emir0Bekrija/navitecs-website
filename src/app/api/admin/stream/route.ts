import { requireAdmin } from "@/lib/proxy";
import { adminEvents } from "@/lib/events";

export const dynamic = "force-dynamic";

// GET /api/admin/stream — Server-Sent Events for real-time admin notifications.
// Emits: new_application, new_contact, heartbeat (every 25 s to keep alive).
export async function GET() {
  const deny = await requireAdmin();
  if (deny) return deny;

  const encoder = new TextEncoder();

  let cleanup: (() => void) | undefined;

  const stream = new ReadableStream({
    start(controller) {
      function send(event: string, data: Record<string, unknown> = {}) {
        try {
          controller.enqueue(
            encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`)
          );
        } catch {
          // client disconnected — controller already closed
        }
      }

      // Send initial ping so the client knows the connection is live
      send("connected", {});

      const heartbeat = setInterval(() => send("heartbeat", {}), 25_000);

      const onApplication = (data: Record<string, unknown>) => send("new_application", data);
      const onContact = (data: Record<string, unknown>) => send("new_contact", data);

      adminEvents.on("new_application", onApplication);
      adminEvents.on("new_contact", onContact);

      cleanup = () => {
        clearInterval(heartbeat);
        adminEvents.off("new_application", onApplication);
        adminEvents.off("new_contact", onContact);
      };
    },
    cancel() {
      cleanup?.();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      // Prevent nginx / proxies from buffering the stream
      "X-Accel-Buffering": "no",
    },
  });
}
