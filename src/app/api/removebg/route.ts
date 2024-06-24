import { NextResponse } from 'next/server';
import Replicate from 'replicate';

export async function GET() {

  const output = {
    name: 'juan',
    
  }
  
  return NextResponse.json({ output }, { status: 201 });
}
