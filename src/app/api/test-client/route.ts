import { NextResponse } from 'next/server';
import { Client, handle_file } from "@gradio/client";

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const clientParam = searchParams.get('client');
    // Eliminar el slash inicial si existe
    const client = clientParam?.startsWith('/') ? clientParam.slice(1) : clientParam;

    if (!client) {
      return NextResponse.json({ success: false, error: "No se proporcionó client" });
    }

    try {
      const app = await Client.connect(String(client));

      const root = app?.config?.root;
        
      console.log('flag2, app', { app, root });

      return NextResponse.json({ app, root });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message });
    }
}