import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const { model, version } = await request.json();

  try {
    const response = await fetch(`https://api.replicate.com/v1/models/${model}/versions/${version}`, {
      headers: {
        'Authorization': `Token ${process.env.REPLICATE_API_TOKEN}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch model details');
    }

    const data = await response.json();
    // console.log(JSON.stringify(data, null, 2));
    const inputs = data.openapi_schema.components.schemas.Input.properties;
    const outputs = data.openapi_schema.components.schemas.Output;
    const required = data.openapi_schema.components.schemas.Input.required;

    // console.log('Fetching model:', model, 'version:', version);
    // console.log('API response status:', response.status);
    // console.log('API response:', JSON.stringify({inputs, outputs}, null, 2));

    return NextResponse.json({ inputs, outputs, required });
  } catch (error: any) {
    console.error('Error fetching model details:', error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}