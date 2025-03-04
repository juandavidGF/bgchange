import { useState, useEffect } from 'react';
import { Configuration } from '@/types';
import { PhotoIcon, FaceSmileIcon, SparklesIcon, VideoCameraIcon } from "@heroicons/react/24/outline";
import { ThreeDots } from "react-loader-spinner";
import { Prompt } from './prompt';
import { NumberInput, Slider, Checkbox, CheckboxGroup, NumberOutput } from './numericInput';
import { FaDownload } from "react-icons/fa";
import { SelectMenu } from "@/app/selectmenu";
import Dropzone, { FileRejection } from 'react-dropzone';

interface AppPreviewProps {
  config: Configuration & {
    endpoints?: string[];
  };
  onEndpointChange?: (endpoint: string) => void;
  onAppNameChange?: (name: string) => void;
}

export default function AppPreview({ config, onEndpointChange, onAppNameChange }: AppPreviewProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [inputValues, setInputValues] = useState<{ [key: string]: string | number | boolean | null }>({});
  const [outputValues, setOutputValues] = useState<{ [key: string]: string | number | boolean | null }>({});

  const [files, setFiles] = useState<{ [key: string]: File }>({});
  const [base64Images, setBase64Images] = useState<{ [key: string]: string }>({});

  // Reset all states when endpoint changes
  useEffect(() => {
    setInputValues({});
    setOutputValues({});
    setFiles({});
    setBase64Images({});
    setError(null);
  }, [config.endpoint]);

  // Initialize input values from config
  useEffect(() => {
    const initialValues: Record<string, any> = {};
    config.inputs.forEach(input => {
      if (input.show) {
        initialValues[input.key] = input.value ?? null;
      }
    });
    setInputValues(initialValues);
  }, [config.inputs]);

  const handleInputChange = (key: string, value: any) => {
    setInputValues(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const onImageDrop = (
    acceptedFiles: File[],
    rejectedFiles: FileRejection[],
    key: string
  ): void => {
    if (rejectedFiles.length > 0) {
      setError(`Please upload a PNG or JPEG image less than 5MB.`);
      return;
    }

    setError("");
    setFiles(prev => ({ ...prev, [key]: acceptedFiles[0] }));

    // Convert to base64
    const reader = new FileReader();
    reader.readAsDataURL(acceptedFiles[0]);
    reader.onload = () => {
      const binaryStr = reader.result as string;
      setBase64Images(prev => ({ ...prev, [key]: binaryStr }));
      handleInputChange(key, binaryStr);
    };
  };

  const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  const handleSubmit = async () => {
    setError(null);
    // Validate required inputs first
    let hasErrors = false;
    config.inputs.forEach(input => {
      if (!input.show) return;
      
      switch(input.component.toLowerCase()) {
        case 'prompt':
        case 'textbox':
          if (!inputValues[input.key]) {
            setError(`Must fill the field ${input.label || input.key}`);
            hasErrors = true;
          }
          break;
        case 'image':
          if (!files[input.key]) {
            setError(`Must upload an image at "${input.label || input.key}"`);
            hasErrors = true;
          }
          break;
        case 'video':
          if (!files[input.key]) {
            setError(`Must upload a video at "${input.label || input.key}"`);
            hasErrors = true;
          }
          break;
      }
    });

    if (hasErrors) {
      return;
    }

    setLoading(true);
    setOutputValues({});

    try {
      // Package both config and params into a single request
      const params: any = {
        prompt: null,
        image: {},
        video: null
      };

      config.inputs.forEach(input => {
        if (!input.show) return;
        
        switch (input.component.toLowerCase()) {
          case 'prompt':
          case 'textbox':
            params.prompt = inputValues[input.key] || null;
            break;
          case 'image':
            params.image[input.key] = base64Images[input.key] || null;
            break;
          case 'video':
            params.video = base64Images[input.key] || null;
            break;
          default:
            params[input.key] = inputValues[input.key] || null;
        }
      });

      const response = await fetch('/api/preview', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          config,
          params
        })
      });

      if (!response.ok) {
        throw new Error('Failed to process request');
      }

      const responseData = await response.json();
      
      let result;
      
      // If we have an ID, use polling. Otherwise use immediate result
      if (responseData.id) {
        // Start polling for results
        let status = null;
        do {
          await sleep(1000);
          const pollResponse = await fetch(`/api/preview/get?id=${responseData.id}`);
          result = await pollResponse.json();
          
          if (result.error) {
            throw new Error(result.error);
          }
          
          status = result.status;
        } while (status !== 'succeeded' && status !== 'failed');

        if (status === 'failed') {
          throw new Error('Processing failed');
        }
      } else {
        // Use immediate result
        result = {
          status: 'succeeded',
          output: responseData.output
        };
      }

      // Map the outputs based on the configuration
      const outputs: Record<string, any> = {};
      console.log('Mapping outputs:', { result, configOutputs: config.outputs });
      (config.outputs || []).forEach((output, index) => {
        if (!output.show) return;
        
        if (Array.isArray(result.output)) {
          // If output is an array, try to match with config keys or use index
          if (output.key && typeof result.output[0] === 'object') {
            console.log("if (output.key && typeof result.output[0] === 'object') {", output.key, result.output[0]); 
            outputs[output.key] = result.output[0].url || result.output[0][output.key];

            console.log('outputs[output.key]', outputs, outputs[output.key])
          } else {
            outputs[output.key] = result.output[index];
          }
        } else {
          // If it's a single value, assign it to the first output
          outputs[output.key] = result.output;
        }
      });

      console.log('Setting outputs:', outputs);
      setOutputValues(outputs);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const downloadOutputImage = (url: string) => {
    const link = document.createElement('a');
    link.href = url;
    link.download = 'output.png';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="mx-auto w-full max-w-4xl">
      <div className="flex flex-col space-y-8">
        <div className="space-y-4">
          <div className="flex items-center space-x-4">
            <label className="text-sm font-medium text-gray-300">App Name:</label>
            <input
              type="text"
              value={config.name || ''}
              onChange={(e) => onAppNameChange?.(e.target.value)}
              placeholder="Enter app name"
              className="flex-grow px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {config.type === 'gradio' && (
            <div className="flex items-center space-x-4">
              <label className="text-sm font-medium text-gray-300">Endpoint:</label>
              <select
                value={config.endpoint}
                onChange={(e) => onEndpointChange?.(e.target.value)}
                className="flex-grow px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {config.endpoints?.map(item => (
                  <option key={item} value={item}>{item}</option>
                ))}
              </select>
            </div>
          )}
        </div>
        {error && (
          <div className="rounded-md bg-red-50 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 gap-8">
          <div className="space-y-6">
            <h3 className="text-lg font-medium text-gray-300">Inputs</h3>
            {config.inputs.map((input, index) => {
              if (!input.show) return null;

              switch (input.component.toLowerCase()) {
                case 'prompt':
                  return (
                    <Prompt
                      key={index}
                      label={input.label || input.key}
                      placeholder={input.placeholder || ''}
                      description={input.description || ''}
                      placeholderTextArea={input.value?.toString() || ''}
                      setPrompt={(value) => handleInputChange(input.key, value)}
                    />
                  );
                case 'textbox':
                  return (
                    <Prompt
                      key={index}
                      label={input.label || input.key}
                      placeholder={input.placeholder || ''}
                      description={input.description || ''}
                      placeholderTextArea={input.value?.toString() || ''}
                      setPrompt={(value) => handleInputChange(input.key, value)}
                    />
                  );
                case 'image':
                  return (
                    <Dropzone
                      key={index}
                      onDrop={(accepted, rejected) => onImageDrop(accepted, rejected, input.key)}
                      accept={{ 'image/*': ['.png', '.jpg', '.jpeg'] }}
                      maxSize={5 * 1024 * 1024}
                    >
                      {({ getRootProps, getInputProps }) => (
                        <div {...getRootProps()} className="relative block w-full rounded-lg border-2 border-dashed border-gray-300 p-12 text-center hover:border-gray-400 focus:outline-none">
                          <input {...getInputProps()} />
                          {files[input.key] ? (
                            <img
                              src={URL.createObjectURL(files[input.key])}
                              alt="Preview"
                              className="mx-auto h-48 w-auto object-contain"
                            />
                          ) : (
                            <>
                              <PhotoIcon className="mx-auto h-12 w-12 text-gray-400" />
                              <span className="mt-2 block text-sm font-medium text-gray-300">
                                Drop an image here or click to upload
                              </span>
                            </>
                          )}
                        </div>
                      )}
                    </Dropzone>
                  );
                case 'number':
                  return (
                    <NumberInput
                      key={index}
                      label={input.label || input.key}
                      description={input.description}
                      min={input.min}
                      max={input.max}
                      step={input.step}
                      defaultValue={input.value as number}
                      onChange={(value) => handleInputChange(input.key, value)}
                    />
                  );
                case 'slider':
                  return (
                    <Slider
                      key={index}
                      label={input.label || input.key}
                      description={input.description}
                      min={input.min}
                      max={input.max}
                      step={input.step}
                      defaultValue={input.value as number}
                      onChange={(value) => handleInputChange(input.key, value)}
                    />
                  );
                case 'checkbox':
                  return (
                    <Checkbox
                      key={index}
                      label={input.label || input.key}
                      description={input.description}
                      defaultChecked={input.value as boolean}
                      onChange={(checked) => handleInputChange(input.key, checked)}
                    />
                  );
                case 'dropdown':
                  return (
                    <SelectMenu
                      key={index}
                      label={input.label || input.key}
                      options={input.options || []}
                      selected={input.value as string || (input.options || [])[0] || ''}
                      onChange={(value) => handleInputChange(input.key, value)}
                    />
                  );
                default:
                  return (
                    <div key={index}>
                      Unsupported input type: {input.component}
                    </div>
                  );
              }
            })}
          </div>

          <div className="space-y-6">
            <h3 className="text-lg font-medium text-gray-300">Outputs</h3>
            {config.outputs?.map((output, index) => {
              if (!output.show) return null;

              return (
                <div key={index} className="relative">
                  <div className="mb-2 text-sm font-medium text-gray-300">
                    {output.title || output.key}
                  </div>
                  <div className="min-h-[200px] rounded-lg bg-gray-800 p-4">
                    {loading ? (
                      <div className="flex h-full items-center justify-center">
                        <ThreeDots
                          height="50"
                          width="60"
                          color="#eee"
                          ariaLabel="loading"
                          visible={true}
                        />
                      </div>
                    ) : outputValues[output.key] ? (
                      <div className="relative">
                        {output.component}
                        {output.component === 'image' && (
                          <>
                            {console.log('Rendering image with:', {
                              outputKey: output.key,
                              value: outputValues[output.key],
                              fullOutputValues: outputValues
                            })}
                            <img
                              src={String(outputValues[output.key])}
                              alt={output.title || 'Output'}
                              className="h-full w-full rounded-lg object-contain"
                            />
                            <button
                              onClick={() => downloadOutputImage(String(outputValues[output.key]))}
                              className="absolute right-2 top-2 rounded bg-gray-700 p-2 hover:bg-gray-600"
                            >
                              <FaDownload className="h-4 w-4 text-gray-300" />
                            </button>
                          </>
                        )}
                        {(output.component === 'textbox' || output.component === 'prompt') && (
                          <div className="text-gray-300">
                            {String(outputValues[output.key])}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="flex h-full items-center justify-center text-gray-500">
                        Output will appear here
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="flex justify-end">
          <button
            onClick={handleSubmit}
            disabled={loading || !config.name}
            className={`inline-flex items-center rounded-md px-4 py-2 text-sm font-medium shadow-sm ${
              loading || !config.name
                ? 'cursor-not-allowed bg-gray-600 text-gray-400'
                : 'bg-indigo-600 text-white hover:bg-indigo-700'
            }`}
          >
            {loading ? 'Processing...' : 'Test Configuration'}
            <SparklesIcon className="ml-2 h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
