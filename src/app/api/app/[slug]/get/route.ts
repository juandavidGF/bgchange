import { NextResponse } from 'next/server';
import Replicate from 'replicate';

type Slug = "createVideo" | "freshink";

export async function POST(
  request: Request,
  { params }: { params: { slug: Slug } },
) {
  try {
    const req = await request.json();

    const slug = params.slug;
    if(slug !== 'freshink' && slug !== 'createVideo') return NextResponse.json(
      { error: `Something went wrong, api, slug ${slug} not allowed` },
      { status: 500 }
    );

    const {id} = req;
  
    if(!id) return NextResponse.json(
        { error: 'not id /api' },
        { status: 500 }
      );
    
    const replicate = new Replicate({
      auth: process.env.REPLICATE_API_TOKEN as string,
    });
  
    const state = await replicate.predictions.get(id);
  
    console.log({state});
    return NextResponse.json({ state }, { status: 201 });
  } catch (error: any) {
    console.error(error.message);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}