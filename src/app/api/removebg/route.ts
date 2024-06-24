import { NextResponse } from 'next/server';
import Replicate from 'replicate';

export async function POST(request: Request) {
  // 1. Get request data (in JSON format) from the client
  const req = await request.json();

  const {image} = req;

  if(!image) return NextResponse.json(
      { error: 'not image or prompt /api' },
      { status: 500 }
    );
  
  const replicate = new Replicate({
    auth: process.env.REPLICATE_API_TOKEN as string,
  });

  const model =
    "smoretalk/rembg-enhance:4067ee2a58f6c161d434a9c077cfa012820b8e076efa2772aa171e26557da919";

  const model2 =
    "codeplugtech/background_remover:37ff2aa89897c0de4a140a3d50969dc62b663ea467e1e2bde18008e3d3731b2b";

  const input = {
    image
  };

  const output = await replicate.run(model2, { input });

  // const output = "https://replicate.delivery/pbxt/P9oH8knhkOqvAlGPiLI72IwWs8OJ65u7uIZc1wOqkiOa4dwE/out.png"

  if (!output) {
    console.log('Something went wrong');
    return NextResponse.json(
      { error: 'Something went wrong' },
      { status: 500 }
    );
  }

  console.log('route', output);
  return NextResponse.json({ output }, { status: 201 });
}
