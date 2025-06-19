"use client";

import { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import { Configuration } from '@/types';
import MinimalHeader from '@/components/MinimalHeader';
import { triggerCreditUpdate } from '@/components/credits/CreditBalance';

// CSS animations for loading card
const loadingStyles = `
  @keyframes shimmer {
    0% { transform: translateX(-100%); }
    100% { transform: translateX(100%); }
  }
  @keyframes progress {
    0% { width: 0%; }
    50% { width: 70%; }
    100% { width: 100%; }
  }
`;

// Inject styles
if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.textContent = loadingStyles;
  document.head.appendChild(style);
}

interface ProcessedItem {
  _id: string;
  modelName: string;
  originalImageUrl?: string;
  processedImageUrl: string;
  prompt?: string;
  parameters: any;
  createdAt: string;
}

// ProcessedCard component for gallery items
function ProcessedCard({ 
  item, 
  onFullscreen, 
  onDownload,
  onDelete,
  onUseAsBase 
}: { 
  item: ProcessedItem;
  onFullscreen: (item: ProcessedItem) => void;
  onDownload: (url: string, filename: string) => void;
  onDelete: (itemId: string) => void;
  onUseAsBase: (url: string) => void;
}) {
  return (
    <div className="relative group cursor-pointer">
      <div 
        className="relative w-full h-80 bg-gray-700 rounded-lg overflow-hidden transition-all duration-200 hover:shadow-xl hover:scale-[1.02]"
        onClick={() => onFullscreen(item)}
      >
        {/* Background Image (Processed) */}
        <Image 
          src={item.processedImageUrl} 
          alt={`Processed: ${item.modelName}`} 
          fill
          className="object-cover"
        />
      
        {/* Hover Overlay */}
        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-60 transition-all duration-300 flex flex-col justify-between p-4 opacity-0 group-hover:opacity-100">
          {/* Top Action Buttons */}
          <div className="flex justify-end space-x-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onFullscreen(item);
              }}
              className="p-2 bg-gray-700 hover:bg-purple-600 text-white rounded-lg transition-all duration-200 hover:scale-110 shadow-lg"
              title="View fullscreen"
            >
              🔍
            </button>
            {item.originalImageUrl && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onUseAsBase(item.originalImageUrl!);
                }}
                className="p-2 bg-gray-700 hover:bg-green-600 text-white rounded-lg transition-all duration-200 hover:scale-110 shadow-lg"
                title="Use original as new base"
              >
                🔄
              </button>
            )}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDownload(item.processedImageUrl, `processed-${item._id}.jpg`);
              }}
              className="p-2 bg-gray-700 hover:bg-blue-600 text-white rounded-lg transition-all duration-200 hover:scale-110 shadow-lg"
              title="Download"
            >
              📥
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (confirm('Are you sure you want to delete this item?')) {
                  onDelete(item._id);
                }
              }}
              className="p-2 bg-gray-700 hover:bg-red-600 text-white rounded-lg transition-all duration-200 hover:scale-110 shadow-lg"
              title="Delete item"
            >
              🗑️
            </button>
          </div>

          {/* Bottom Details */}
          <div className="text-white">
            <p className="text-sm font-medium mb-2 line-clamp-2 text-white">{item.prompt || 'No prompt'}</p>
            <div className="flex justify-between items-center text-xs">
              <span className="bg-blue-600 px-2 py-1 rounded font-medium shadow-sm">{item.modelName}</span>
              <span className="text-gray-200">{new Date(item.createdAt).toLocaleDateString()}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ModelViewerPage({ configurations }: { configurations: Configuration[] }) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [selectedModel, setSelectedModel] = useState<Configuration | null>(null);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [inputParameters, setInputParameters] = useState<Record<string, any>>({});
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [processedItems, setProcessedItems] = useState<ProcessedItem[]>([]);
  const [loadingItems, setLoadingItems] = useState(false);
  const [fullscreenItem, setFullscreenItem] = useState<ProcessedItem | null>(null);
  const [sliderPosition, setSliderPosition] = useState(50);

  // Initialize with first configuration and load gallery
  useEffect(() => {
    if (configurations.length > 0 && !selectedModel) {
      setSelectedModel(configurations[0]);
      initializeParameters(configurations[0]);
      loadGalleryItems(configurations[0].name);
    }
  }, [configurations, selectedModel]);

  const loadGalleryItems = async (modelName: string) => {
    setLoadingItems(true);
    try {
      const response = await fetch(`/api/modelviewer?model=${modelName}`);
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setProcessedItems(data.items);
        }
      }
    } catch (error) {
      console.error('Error loading gallery items:', error);
    } finally {
      setLoadingItems(false);
    }
  };

  const initializeParameters = (config: Configuration) => {
    const params: Record<string, any> = {};
    config.inputs.forEach(input => {
      if (input.show !== false) {
        params[input.key] = input.value || '';
      }
    });
    setInputParameters(params);
  };

  const handleModelChange = (modelName: string) => {
    const config = configurations.find(c => c.name === modelName);
    if (config) {
      setSelectedModel(config);
      initializeParameters(config);
      setError(null);
      loadGalleryItems(modelName);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setError(null);
      // Convert to base64 for now (in real app, you'd upload to storage)
      const reader = new FileReader();
      reader.onload = () => {
        setUploadedImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Error uploading file:', error);
      setError('Failed to upload image. Please try again.');
    }
  };

  const handleParameterChange = (key: string, value: any) => {
    setInputParameters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleProcess = async () => {
    if (!selectedModel || !uploadedImage) {
      setError('Please select a model and upload an image.');
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      const response = await fetch('/api/modelviewer', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          imageUrl: uploadedImage,
          parameters: inputParameters,
          modelName: selectedModel.name
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to process image');
      }

      const result = await response.json();
      
      if (result.success) {
        const newItem: ProcessedItem = {
          _id: result.result.requestId,
          modelName: selectedModel.name,
          originalImageUrl: uploadedImage,
          processedImageUrl: result.result.processedImageUrl,
          prompt: inputParameters.prompt || 'Processed with ' + selectedModel.name,
          parameters: inputParameters,
          createdAt: new Date().toISOString()
        };

        setProcessedItems(prev => [newItem, ...prev]);
        
        // Trigger credit update
        triggerCreditUpdate();
      } else {
        throw new Error(result.message || 'Failed to process image');
      }
    } catch (error: any) {
      console.error('Error processing:', error);
      setError(error.message || 'Failed to process. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const downloadImage = async (imageUrl: string, filename: string) => {
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error downloading image:', error);
    }
  };

  const handleUseAsBase = (url: string) => {
    setUploadedImage(url);
    setError(null);
  };

  const handleDelete = (itemId: string) => {
    setProcessedItems(prev => prev.filter(item => item._id !== itemId));
  };

  const renderInputField = (input: any) => {
    if (!input.show) return null;

    switch (input.component.toLowerCase()) {
      case 'prompt':
      case 'textbox':
        return (
          <div key={input.key} className="mb-4">
            <label className="block text-sm font-medium mb-2 text-white">
              {input.label || input.key}
            </label>
            <textarea
              value={inputParameters[input.key] || ''}
              onChange={(e) => handleParameterChange(input.key, e.target.value)}
              placeholder={input.placeholder || ''}
              className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 resize-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              rows={3}
            />
            {input.description && (
              <p className="text-xs text-gray-400 mt-1">{input.description}</p>
            )}
          </div>
        );

      case 'number':
      case 'slider':
        return (
          <div key={input.key} className="mb-4">
            <label className="block text-sm font-medium mb-2 text-white">
              {input.label || input.key}: {inputParameters[input.key] || input.value}
            </label>
            <input
              type="range"
              min={input.min || 0}
              max={input.max || 100}
              step={input.step || 1}
              value={inputParameters[input.key] || input.value || 0}
              onChange={(e) => handleParameterChange(input.key, parseFloat(e.target.value))}
              className="w-full"
            />
            {input.description && (
              <p className="text-xs text-gray-400 mt-1">{input.description}</p>
            )}
          </div>
        );

      case 'checkbox':
        return (
          <div key={input.key} className="mb-4">
            <label className="flex items-center text-white">
              <input
                type="checkbox"
                checked={inputParameters[input.key] || input.value || false}
                onChange={(e) => handleParameterChange(input.key, e.target.checked)}
                className="mr-2"
              />
              {input.label || input.key}
            </label>
            {input.description && (
              <p className="text-xs text-gray-400 mt-1">{input.description}</p>
            )}
          </div>
        );

      case 'dropdown':
        return (
          <div key={input.key} className="mb-4">
            <label className="block text-sm font-medium mb-2 text-white">
              {input.label || input.key}
            </label>
            <select
              value={inputParameters[input.key] || input.value || ''}
              onChange={(e) => handleParameterChange(input.key, e.target.value)}
              className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            >
              {input.options?.map((option: string) => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
            {input.description && (
              <p className="text-xs text-gray-400 mt-1">{input.description}</p>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Minimal Header */}
      <MinimalHeader 
        title="AI Model Viewer"
        subtitle={`${configurations.length} models available • Select, configure, and process`}
      />
      
      <div className="h-screen bg-black text-white flex overflow-hidden">
        {/* Fixed Sidebar with Internal Scrolling */}
        <div className="w-80 bg-black border-r border-gray-700 flex flex-col h-screen">
          {/* Model Selection - Fixed */}
          <div className="p-6 border-b border-gray-700 flex-shrink-0">
            <h3 className="text-xl font-semibold mb-4 text-white">Select Model</h3>
            <select
              value={selectedModel?.name || ''}
              onChange={(e) => handleModelChange(e.target.value)}
              className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            >
              {configurations.map((config) => (
                <option key={config.name} value={config.name}>
                  {config.name} ({config.type})
                </option>
              ))}
            </select>
            <p className="text-xs text-gray-400 mt-2">
              {selectedModel?.type.toUpperCase()} model • {configurations.length} total available
            </p>
          </div>

          {/* Upload Section - Fixed */}
          <div className="p-6 border-b border-gray-700 flex-shrink-0">
            <h3 className="text-xl font-semibold mb-4 text-white">Upload Image</h3>
            <div 
              className="border-2 border-dashed border-gray-500 rounded-lg p-4 text-center cursor-pointer hover:border-blue-500 transition-colors group"
              onClick={() => fileInputRef.current?.click()}
            >
              {uploadedImage ? (
                <div className="relative w-full h-32">
                  <Image 
                    src={uploadedImage} 
                    alt="Uploaded" 
                    fill
                    className="object-contain rounded-lg"
                  />
                </div>
              ) : (
                <div>
                  <svg className="w-12 h-12 mx-auto mb-2 text-gray-400 group-hover:text-blue-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  <p className="text-gray-400 group-hover:text-blue-500 text-sm transition-colors">Click to upload</p>
                </div>
              )}
            </div>
            
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              className="hidden"
            />
          </div>

          {/* Parameters - Scrollable */}
          <div className="flex-1 overflow-y-auto">
            <div className="p-6">
              <h3 className="text-xl font-semibold mb-4 text-white">Parameters</h3>
              {selectedModel?.inputs.map(input => renderInputField(input))}
            </div>
          </div>

          {/* Process Button - Fixed at Bottom */}
          <div className="p-6 border-t border-gray-700 flex-shrink-0">
            <button
              onClick={handleProcess}
              disabled={isProcessing || !selectedModel || !uploadedImage}
              className="w-full py-4 bg-blue-500 text-white rounded-lg font-bold text-lg hover:bg-blue-600 disabled:bg-gray-600 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-[1.02] active:scale-[0.98]"
            >
              {isProcessing ? 'Processing...' : '🎨 Process Image'}
            </button>

            {/* Error Display */}
            {error && (
              <div className="mt-4 p-3 bg-red-900 border border-red-600 rounded-lg text-red-200 text-sm">
                {error}
              </div>
            )}
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 overflow-y-auto">        
          <div className="p-8">
            {/* Gallery */}
            <div>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-white">Gallery</h2>
                <div className="flex items-center space-x-4">
                  <span className="text-gray-400">{processedItems.length} items</span>
                  {selectedModel && (
                    <span className="bg-blue-600 px-3 py-1 rounded-full text-sm font-medium">
                      {selectedModel.name}
                    </span>
                  )}
                </div>
              </div>
              
              {loadingItems ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-4"></div>
                  <div className="text-gray-400">Loading gallery...</div>
                </div>
              ) : processedItems.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {processedItems.map((item) => (
                    <ProcessedCard 
                      key={item._id} 
                      item={item} 
                      onFullscreen={setFullscreenItem}
                      onDownload={downloadImage}
                      onDelete={handleDelete}
                      onUseAsBase={handleUseAsBase}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="text-gray-400 mb-4">No processed items yet</div>
                  <p className="text-gray-500">Upload an image and select a model to get started!</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Fullscreen Modal */}
        {fullscreenItem && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-95 z-50 flex items-center justify-center"
            onClick={() => setFullscreenItem(null)}
          >
            <div className="relative w-full h-full flex flex-col items-center justify-center p-8">
              {/* Header */}
              <div className="mb-6 text-center">
                <h2 className="text-2xl font-bold text-white mb-2">
                  {fullscreenItem.modelName}
                </h2>
                <p className="text-gray-400 text-sm mb-4">{fullscreenItem.prompt}</p>
              </div>

              {/* Image Display */}
              <div className="flex-1 w-full max-w-7xl flex items-center justify-center">
                {fullscreenItem.originalImageUrl ? (
                  /* Before/After Comparison */
                  <div className="relative w-full h-full max-h-[75vh] bg-gray-800 rounded-lg overflow-hidden">
                    {/* Base image (processed) */}
                    <img 
                      src={fullscreenItem.processedImageUrl} 
                      alt="Processed" 
                      className="w-full h-full object-contain"
                    />
                    
                    {/* Overlay image (original) with clipping */}
                    <div 
                      className="absolute inset-0 overflow-hidden"
                      style={{ clipPath: `inset(0 ${100 - sliderPosition}% 0 0)` }}
                    >
                      <img 
                        src={fullscreenItem.originalImageUrl} 
                        alt="Original" 
                        className="w-full h-full object-contain"
                      />
                    </div>
                    
                    {/* Slider control */}
                    <div 
                      className="absolute inset-0 cursor-ew-resize"
                      onMouseMove={(e) => {
                        e.stopPropagation();
                        const rect = e.currentTarget.getBoundingClientRect();
                        const x = e.clientX - rect.left;
                        const percentage = (x / rect.width) * 100;
                        setSliderPosition(Math.max(0, Math.min(100, percentage)));
                      }}
                    >
                      {/* Slider line */}
                      <div 
                        className="absolute top-0 bottom-0 w-0.5 bg-white shadow-lg pointer-events-none"
                        style={{ left: `${sliderPosition}%` }}
                      >
                        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-8 h-8 bg-white rounded-full shadow-lg flex items-center justify-center">
                          <svg className="w-4 h-4 text-gray-700" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                          </svg>
                        </div>
                      </div>
                    </div>
                    
                    {/* Labels */}
                    <div className="absolute top-4 left-4 bg-black bg-opacity-70 text-white px-3 py-1 rounded-full text-sm">
                      📷 Original
                    </div>
                    <div className="absolute top-4 right-4 bg-black bg-opacity-70 text-white px-3 py-1 rounded-full text-sm">
                      ✨ Processed
                    </div>
                  </div>
                ) : (
                  /* Single Image Display */
                  <div className="w-full h-full max-h-[75vh] bg-gray-800 rounded-lg overflow-hidden flex items-center justify-center">
                    <img 
                      src={fullscreenItem.processedImageUrl} 
                      alt="Processed" 
                      className="max-w-full max-h-full object-contain"
                    />
                  </div>
                )}
              </div>
              
              {/* Action Buttons */}
              <div className="mt-6 flex space-x-4">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    downloadImage(fullscreenItem.processedImageUrl, `processed-${fullscreenItem._id}.jpg`);
                  }}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center space-x-2"
                >
                  <span>📥</span>
                  <span>Download Processed</span>
                </button>
                {fullscreenItem.originalImageUrl && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      downloadImage(fullscreenItem.originalImageUrl!, `original-${fullscreenItem._id}.jpg`);
                    }}
                    className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors flex items-center space-x-2"
                  >
                    <span>📥</span>
                    <span>Download Original</span>
                  </button>
                )}
              </div>
              
              {/* Close Button */}
              <button
                onClick={() => setFullscreenItem(null)}
                className="absolute top-6 right-6 p-3 bg-black bg-opacity-80 text-white rounded-full hover:bg-red-600 transition-colors text-xl font-bold"
                title="Close"
              >
                ✕
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}