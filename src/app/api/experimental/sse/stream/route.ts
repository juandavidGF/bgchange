import { NextRequest } from 'next/server';
import { getGradioBaseUrl } from '@/utils/gradio';

export const dynamic = 'force-dynamic'; // Ensure dynamic execution

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const eventId = searchParams.get('event_id');
  const client = searchParams.get('client');
  const endpoint = searchParams.get('endpoint');

  if (!eventId || !client || !endpoint) {
    return new Response('Missing event_id, client, or endpoint', { status: 400 });
  }

  const baseUrl = getGradioBaseUrl(client);
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint.substring(1) : endpoint;
  const streamUrl = `${baseUrl}/call/${cleanEndpoint}/${eventId}`;

  console.log(`Attempting to stream from: ${streamUrl}`);

  try {
    const headers: HeadersInit = {};
    if (process.env.HF_TOKEN) {
      headers["Authorization"] = `Bearer ${process.env.HF_TOKEN}`;
    }

    const gradioResponse = await fetch(streamUrl, {
      method: 'GET',
      headers: headers,
      // @ts-ignore - Necessary for streaming
      duplex: 'half'
    });

    if (!gradioResponse.ok) {
      const errorText = await gradioResponse.text();
      console.error(`Gradio SSE request failed (${gradioResponse.status}): ${errorText}`);
      const errorEvent = `event: error_event\ndata: ${JSON.stringify(`Gradio request failed: ${gradioResponse.status}`)}\n\n`;
      return new Response(errorEvent, { status: 200, headers: { 'Content-Type': 'text/event-stream' } });
    }

    if (!gradioResponse.body) {
      throw new Error('Gradio response body is null');
    }

    const reader = gradioResponse.body.getReader();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            controller.enqueue(value);
          }
        } catch (error) {
          console.error("SSE Stream Error:", error);
          controller.error(error);
        } finally {
          controller.close();
          reader.releaseLock();
        }
      },
      cancel() {
        reader.cancel();
      }
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error("SSE Stream Error:", errorMessage);
    const errorEvent = `event: error_event\ndata: ${JSON.stringify(errorMessage)}\n\n`;
    return new Response(errorEvent, { status: 200, headers: { 'Content-Type': 'text/event-stream' } });
  }
}
