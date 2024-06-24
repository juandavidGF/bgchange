import { NextResponse } from 'next/server';
import Replicate from 'replicate';

export async function POST(request: Request) {
  const req = await request.json();

  const image = req.image;
  const theme = req.theme;
  const room = req.room;

  const replicate = new Replicate({
    auth: process.env.REPLICATE_API_TOKEN as string,
  });

  const model =
    'jagilley/controlnet-hough:854e8727697a057c525cdb45ab037f64ecca770a1769cc52287c2e56472a247b';

  const input = {
    image,
    prompt: `A ${theme} ${room} Editorial Style Photo, Symmetry, Straight On, Modern Living Room, Large Window, Leather, Glass, Metal, Wood Paneling, Neutral Palette, Ikea, Natural Light, Apartment, Afternoon, Serene, Contemporary, 4k`,
    a_prompt: `best quality, extremely detailed, photo from Pinterest, interior, cinematic photo, ultra-detailed, ultra-realistic, award-winning`,
  };

  const output = await replicate.run(model, { input });

  if (!output) {
    console.log('Something went wrong');
    return NextResponse.json(
      { error: 'Something went wrong' },
      { status: 500 }
    );
  }

  console.log('Output', output);
  return NextResponse.json({ output }, { status: 201 });
}
