import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { modelName, imageUrl, parameters } = body;
    
    console.log(`Processing request for model: ${modelName}`, { parameters });

    // Simulate processing time
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Mock response - in real implementation, this would call the actual model
    const mockResponse = {
      success: true,
      result: {
        processedImageUrl: imageUrl || '/placeholder-processed.jpg',
        originalImageUrl: imageUrl,
        modelName,
        parameters,
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

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const modelName = searchParams.get('model') || 'all';
    
    // Mock gallery data
    const mockGalleryItems = [
      {
        _id: `item_${Date.now()}_1`,
        modelName: modelName === 'all' ? 'pyramid-flow' : modelName,
        originalImageUrl: 'https://picsum.photos/400/400?random=1',
        processedImageUrl: 'https://picsum.photos/400/400?random=2',
        prompt: `Sample processed with ${modelName === 'all' ? 'pyramid-flow' : modelName}`,
        parameters: { setting1: 'value1', setting2: 'value2' },
        createdAt: new Date().toISOString()
      },
      {
        _id: `item_${Date.now()}_2`,
        modelName: modelName === 'all' ? 'Hivision' : modelName,
        originalImageUrl: 'https://picsum.photos/400/400?random=3',
        processedImageUrl: 'https://picsum.photos/400/400?random=4',
        prompt: `Another sample with ${modelName === 'all' ? 'Hivision' : modelName}`,
        parameters: { setting1: 'value3', setting2: 'value4' },
        createdAt: new Date(Date.now() - 86400000).toISOString() // Yesterday
      },
      {
        _id: `item_${Date.now()}_3`,
        modelName: modelName === 'all' ? 'EVF-SAM' : modelName,
        originalImageUrl: 'https://picsum.photos/400/400?random=5',
        processedImageUrl: 'https://picsum.photos/400/400?random=6',
        prompt: `Third sample with ${modelName === 'all' ? 'EVF-SAM' : modelName}`,
        parameters: { setting1: 'value5', setting2: 'value6' },
        createdAt: new Date(Date.now() - 172800000).toISOString() // Two days ago
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