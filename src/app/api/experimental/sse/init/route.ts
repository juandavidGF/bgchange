import { NextResponse } from 'next/server';
import { getGradioBaseUrl } from '@/utils/gradio';

// Helper function to determine the correct API path
async function getGradioApiPath(client: string, endpoint: string): Promise<string> {
  const baseUrl = getGradioBaseUrl(client);

  // Try fetching /info to determine the path structure
  try {
    const infoResponse = await fetch(`${baseUrl}/info`);
    if (infoResponse.ok) {
      const infoData = await infoResponse.json();
      const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
      if (infoData?.named_endpoints?.[cleanEndpoint]) {
        console.log(`Using /call/${cleanEndpoint} based on /info`);
        return `${baseUrl}/call/${cleanEndpoint}`;
      }
    }
  } catch (e) {
    console.warn("Failed to fetch /info, falling back to /gradio_api/call");
  }

      // Fallback path - ensure no double slashes
      const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
      console.log(`Using fallback /gradio_api/call/${cleanEndpoint}`);
      return `${baseUrl}/gradio_api/call/${cleanEndpoint}`;
}
// https://Yuanshi-OminiControl_Art.hf.space/gradio_api/call/infer

    export async function POST(request: Request) {
      try {
        const { client, endpoint, inputs } = await request.json();

        if (!client || !endpoint || !inputs) {
          return NextResponse.json({ error: 'Missing client, endpoint, or inputs' }, { status: 400 });
        }

        const apiPath = await getGradioApiPath(client, endpoint);

        // Prepare headers, including HF token if available
        const headers: HeadersInit = { "Content-Type": "application/json" };
        if (process.env.HF_TOKEN) {
          headers["Authorization"] = `Bearer ${process.env.HF_TOKEN}`;
        }

        console.log(`Initiating prediction via POST to: ${apiPath}`);
        const response = await fetch(apiPath, {
          method: 'POST',
          headers: headers,
          body: JSON.stringify({ data: inputs }) // Send inputs in the 'data' field
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error(`Gradio POST failed (${response.status}): ${errorText}`);
          return NextResponse.json({ error: `Gradio API request failed: ${errorText}` }, { status: response.status });
        }

        const responseData = await response.json();
        console.log("Gradio POST response:", responseData);

        if (!responseData.event_id) {
           return NextResponse.json({ error: 'Gradio did not return an event_id' }, { status: 500 });
        }

        // Return only the event_id and the client info needed for the stream request
        return NextResponse.json({ event_id: responseData.event_id, client });

      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error during SSE init';
        console.error("SSE Init Error:", errorMessage);
        return NextResponse.json({ error: errorMessage }, { status: 500 });
      }
    }
