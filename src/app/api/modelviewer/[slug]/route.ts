import { NextRequest, NextResponse } from 'next/server';

export async function POST(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const { slug } = params;
    const body = await request.json();
    
    console.log(`Processing request for model: ${slug}`, body);

    // Simulate processing time
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Mock response - in real implementation, this would call the actual model
    const mockResponse = {
      success: true,
      result: {
        processedImageUrl: body.imageUrl || '/placeholder-processed.jpg',
        originalImageUrl: body.imageUrl,
        modelName: slug,
        parameters: body.parameters,
        processingTime: '2.3s',
        requestId: `req_${Date.now()}`
      }
    };

    return NextResponse.json(mockResponse);
  } catch (error) {
    console.error('Error processing model request:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to process request' },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const { slug } = params;
    
    // Mock gallery data for the specific model
    const mockGalleryItems = [
      {
        _id: `item_${Date.now()}_1`,
        modelName: slug,
        originalImageUrl: '/placeholder-original.jpg',
        processedImageUrl: '/placeholder-processed.jpg',
        prompt: `Sample processed with ${slug}`,
        parameters: { setting1: 'value1', setting2: 'value2' },
        createdAt: new Date().toISOString()
      },
      {
        _id: `item_${Date.now()}_2`,
        modelName: slug,
        originalImageUrl: '/placeholder-original-2.jpg',
        processedImageUrl: '/placeholder-processed-2.jpg',
        prompt: `Another sample with ${slug}`,
        parameters: { setting1: 'value3', setting2: 'value4' },
        createdAt: new Date(Date.now() - 86400000).toISOString() // Yesterday
      }
    ];

    return NextResponse.json({
      success: true,
      items: mockGalleryItems
    });
  } catch (error) {
    console.error('Error fetching gallery items:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch gallery items' },
      { status: 500 }
    );
  }
}