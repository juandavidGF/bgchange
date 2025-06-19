# Model Viewer

A new dynamic page for selecting AI models, configuring parameters, and viewing processing results with an interactive gallery.

## Features

### 🎯 Model Selection
- Dynamic dropdown with all available models from configurations
- Support for Gradio, Replicate, and FAL model types
- Real-time parameter configuration based on selected model

### 📤 Image Upload
- Drag and drop interface
- File input support
- Base64 encoding for processing

### ⚙️ Dynamic Parameters
- **Text inputs**: Prompts, descriptions, and text fields
- **Number inputs**: Sliders and numeric ranges with min/max/step controls
- **Checkboxes**: Boolean toggles for model settings
- **Dropdowns**: Selection from predefined options
- Auto-generated from model configuration

### 🖼️ Interactive Gallery
- Grid layout of processed results
- Hover effects with action buttons
- Before/after comparison views
- Download functionality
- Delete management

### 🔍 Fullscreen Comparison
- Side-by-side before/after view
- Interactive slider for comparison
- Download original and processed images
- Keyboard navigation support

### 📱 Responsive Design
- Fixed sidebar with scrolling content area
- Mobile-friendly interface
- Dark theme optimized for AI workflows

## Routes

### Main Route
```
/modelviewer/[slug]
```
- `slug`: Dynamic parameter for model identification
- Loads all configurations and allows model selection

### Test Route
```
/modelviewer/test
```
- Demonstration page with sample configurations
- Good for testing new models and features

## API Endpoints

### Process Image
```
POST /api/modelviewer/[slug]
```
**Request Body:**
```json
{
  "imageUrl": "base64_or_url",
  "parameters": {
    "prompt": "text",
    "setting1": "value1"
  },
  "modelName": "model-name"
}
```

**Response:**
```json
{
  "success": true,
  "result": {
    "processedImageUrl": "url",
    "originalImageUrl": "url",
    "modelName": "string",
    "parameters": {},
    "processingTime": "2.3s",
    "requestId": "req_123"
  }
}
```

### Get Gallery Items
```
GET /api/modelviewer/[slug]
```
**Response:**
```json
{
  "success": true,
  "items": [
    {
      "_id": "item_123",
      "modelName": "model-name",
      "originalImageUrl": "url",
      "processedImageUrl": "url",
      "prompt": "description",
      "parameters": {},
      "createdAt": "2023-..."
    }
  ]
}
```

## Component Structure

```
src/app/modelviewer/
├── [slug]/
│   ├── page.tsx              # Server component wrapper
│   └── ClientPage.tsx        # Main client component
├── test/
│   └── page.tsx              # Test/demo page
└── api/
    └── [slug]/
        └── route.ts          # API handlers
```

## Integration

### With Existing App
The model viewer integrates with:
- `@/common/configuration` for model definitions
- `@/components/MinimalHeader` for consistent UI
- `@/components/credits/CreditBalance` for credit tracking
- `@/types` for TypeScript definitions

### Configuration Format
Models are defined in `/src/common/configuration.ts` with:
```typescript
{
  name: 'model-name',
  type: 'gradio' | 'replicate' | 'fal',
  inputs: [
    {
      component: 'prompt' | 'number' | 'checkbox' | 'dropdown',
      key: 'parameter_name',
      label: 'Display Name',
      show: true,
      // ... other properties
    }
  ],
  outputs: [
    {
      component: 'image' | 'video' | 'audio',
      key: 'output_key',
      show: true
    }
  ]
}
```

## Usage Examples

### Basic Model Processing
1. Navigate to `/modelviewer/test`
2. Select a model from dropdown
3. Upload an image
4. Configure parameters
5. Click "Process Image"
6. View results in gallery

### Comparison View
1. Click any gallery item
2. Use slider to compare before/after
3. Download images as needed
4. Navigate with keyboard arrows

### Model Switching
1. Change model in dropdown
2. Parameters auto-update
3. Gallery refreshes for new model
4. Previous settings are reset

## Technical Notes

- **State Management**: React hooks for local state
- **API Integration**: Fetch API with error handling
- **File Handling**: Base64 encoding for image processing
- **Responsive**: Tailwind CSS for styling
- **Accessibility**: Keyboard navigation and screen reader support

## Future Enhancements

- [ ] Batch processing support
- [ ] Custom preset saving
- [ ] Advanced parameter validation
- [ ] Real-time processing status
- [ ] Export/import configurations
- [ ] User authentication integration
- [ ] Cloud storage integration