import { useState, useEffect, useRef } from 'react';
import { Configuration } from '@/types';
import { PhotoIcon, FaceSmileIcon, SparklesIcon, VideoCameraIcon, MicrophoneIcon } from "@heroicons/react/24/outline";
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

  const [files, setFiles] = useState<Record<string, File>>({});
  const [base64Images, setBase64Images] = useState<Record<string, string>>({});

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

  const onAudioDrop = (
    acceptedFiles: File[],
    rejectedFiles: FileRejection[],
    key: string
  ): void => {
    if (rejectedFiles.length > 0) {
      setError(`Please upload an MP3, WAV or OGG audio file less than 10MB.`);
      return;
    }

    setError("");
    setFiles(prev => {
      const newFiles = { ...prev };
      if (acceptedFiles[0]) {
        newFiles[key] = acceptedFiles[0];
      } else {
        delete newFiles[key];
      }
      return newFiles;
    });

    // Convert to base64
    const reader = new FileReader();
    reader.readAsDataURL(acceptedFiles[0]);
    reader.onload = () => {
      const binaryStr = reader.result as string;
      setBase64Images(prev => {
        const newImages = { ...prev };
        if (binaryStr) {
          newImages[key] = binaryStr;
        } else {
          delete newImages[key];
        }
        return newImages;
      });
      handleInputChange(key, binaryStr);
    };
  };

  const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
  const eventSourceRef = useRef<EventSource | null>(null);

  // Cleanup SSE connection on component unmount
  useEffect(() => {
    return () => {
      if (eventSourceRef.current) {
        console.log("Closing SSE connection on unmount");
        eventSourceRef.current.close();
      }
    };
  }, []);

  const fetchRegularPreview = async () => {
    console.log('Fetching regular preview');
    setLoading(true);
    setOutputValues({});
    setError(null);

    try {
      const params: any = {};
      config.inputs.forEach(input => {
        if (!input.show) return;
        params[input.key] = inputValues[input.key] ?? null;
        if (input.component === 'image' && base64Images[input.key]) {
          params[input.key] = base64Images[input.key];
        }
        // Add handling for other file types if needed (audio, video)
      });

      const response = await fetch('/api/preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ config, params })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Request failed with status ' + response.status }));
        throw new Error(errorData.error || `Request failed with status ${response.status}`);
      }

      const responseData = await response.json();
      // Define a type for the expected result structure
      type PredictionResult = {
        status: 'succeeded' | 'failed' | 'processing' | 'starting';
        output?: any; // Can be array, object, or primitive
        error?: string;
      };

      let result: PredictionResult;

      if (responseData.id && config.type === 'replicate') { // Only poll for Replicate
        console.log("Polling Replicate prediction:", responseData.id);
        let status = responseData.status;
        let pollCount = 0;
        const maxPolls = 60; // Poll for max 60 seconds

        // Initialize result before loop
        result = { status: responseData.status, output: responseData.output };

        while (status !== 'succeeded' && status !== 'failed' && pollCount < maxPolls) {
          await sleep(1000);
          const pollResponse = await fetch(`/api/preview/get?id=${responseData.id}`);
          // Assign the fetched result, ensuring it matches PredictionResult type
          result = await pollResponse.json() as PredictionResult;
          console.log("Poll status:", result.status);
          if (result.error) throw new Error(result.error);
          status = result.status;
          pollCount++;
        }
        if (status === 'failed') throw new Error(result.error || 'Processing failed');
        if (pollCount >= maxPolls && status !== 'succeeded') throw new Error('Prediction timed out');

      } else { // Gradio or immediate Replicate result
        result = { status: 'succeeded', output: responseData.output };
      }

      // Map outputs
      const outputs: Record<string, any> = {};
      console.log('Mapping outputs:', { result, configOutputs: config.outputs });
      (config.outputs || []).forEach((output, index) => {
        if (!output.show || !result || result.output === undefined) return; // Add checks for result and result.output

        if (Array.isArray(result.output)) {
           if (output.type === 'array') {
             outputs[output.key] = result.output; // Assign whole array if expected
           } else {
             // Ensure index is within bounds
             if (index < result.output.length) {
              outputs[output.key] = result.output[index]; // Assign by index otherwise
             } else {
              console.warn(`Output index ${index} out of bounds for result array.`);
             }
           }
        } else if (typeof result.output === 'object' && result.output !== null) {
           // Handle cases where output might be an object with keys matching output keys
          outputs[output.key] = result.output[output.key] ?? result.output;
        } else {
           // Assign single value to the first output key
          if (index === 0) {
          outputs[output.key] = result.output;
          }
        }
      });

      console.log('Setting outputs:', outputs);
      setOutputValues(outputs);
    } catch (err) {
      console.error("Regular preview fetch error:", err);
      setError(err instanceof Error ? err.message : 'An error occurred during preview.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitPreview = async () => {
    console.log('App Preview Submit');
    setError(null);
    setOutputValues({}); // Clear previous outputs

    // Close any existing SSE connection
    if (eventSourceRef.current) {
      console.log("Closing previous SSE connection");
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }

    // Validate inputs
    let hasErrors = false;
    config.inputs.forEach(input => {
      if (!input.show) return;
      // Basic check: if required is true (or undefined, assuming required by default if shown)
      // and the value is null/undefined/empty string, and it's not a file input with a file selected
      const isFileSelected = (input.component === 'image' || input.component === 'audio' || input.component === 'video') && files[input.key];
      const valueIsEmpty = inputValues[input.key] === null || inputValues[input.key] === undefined || inputValues[input.key] === '';

      if ((input.required !== false) && valueIsEmpty && !isFileSelected) {
        setError(`Input "${input.label || input.key}" is required.`);
        hasErrors = true;
      }
    });
    if (hasErrors) return;

    setLoading(true);

    // Check feature flag and app type
    const useSSE = process.env.NEXT_PUBLIC_USE_SSE_EXPERIMENTAL === 'true' && config.type === 'gradio';
    console.log('Using SSE:', useSSE);
    console.log('Input values:', inputValues);

    if (useSSE) {
      console.log('Attempting SSE connection for Gradio preview...');
      try {
        // Construct query parameters for SSE endpoint
        const params = new URLSearchParams();
        params.append('client', config.client || '');
        params.append('endpoint', config.endpoint || '');

        // Add input values to query params
        config.inputs.forEach(input => {
          if (input.show) {
            const value = inputValues[input.key];
            if (value !== null && value !== undefined) {
              // Handle file inputs (send base64)
              if ((input.component === 'image' || input.component === 'audio' || input.component === 'video') && base64Images[input.key]) {
                 params.append(input.key, base64Images[input.key]);
              } else if (typeof value === 'boolean') {
                 params.append(input.key, value.toString());
              } else {
                 params.append(input.key, String(value)); // Convert numbers etc. to string
              }
            }
          }
        });

        // Phase 1: POST to /init to get event_id
        const inputData: any[] = [];
        config.inputs.forEach(input => {
          if (input.show) {
            const value = inputValues[input.key];
            if ((input.component === 'image' || input.component === 'audio' || input.component === 'video') && base64Images[input.key]) {
              inputData.push({ 
                name: files[input.key]?.name || 'input_file', 
                data: base64Images[input.key], 
                is_file: true 
              });
            } else {
              inputData.push(value ?? null);
            }
          } else {
            inputData.push(input.value ?? null);
          }
        });

        const initResponse = await fetch('/api/experimental/sse/init', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            client: config.client,
            endpoint: config.endpoint,
            inputs: inputData
          })
        });

        if (!initResponse.ok) {
          const errorData = await initResponse.json().catch(() => ({ error: 'Init request failed' }));
          throw new Error(errorData.error || `SSE Init failed: ${initResponse.status}`);
        }

        const { event_id, client: returnedClient } = await initResponse.json();
        if (!event_id) throw new Error('Did not receive event_id from init endpoint');

        // Phase 2: GET from /stream using the event_id
        const streamUrl = `/api/experimental/sse/stream?event_id=${event_id}&client=${returnedClient}&endpoint=${config.endpoint}`;
        const eventSource = new EventSource(streamUrl);
        eventSourceRef.current = eventSource; // Store reference for cleanup

        eventSource.onmessage = (event) => {
          console.log('SSE Message:', event.data ? event.data.substring(0,100) + '...' : 'No data');
          setLoading(false); // Stop loading indicator on first message (might be heartbeat or generating)
          try {
            // Check for specific SSE events if the backend sends them
             if (event.type === 'message') { // Default event type
               const messageData = JSON.parse(event.data);
               // Assuming messageData is the array of outputs or final result object
               const outputs: Record<string, any> = {};
                (config.outputs || []).forEach((output, index) => {
                  if (!output.show) return;
                  if (Array.isArray(messageData)) {
                    outputs[output.key] = messageData[index];
                  } else if (typeof messageData === 'object' && messageData !== null) {
                    outputs[output.key] = messageData[output.key] ?? messageData; // Try matching key or assign whole object
                  } else {
                    // Assign single value to the first output key
                    if (index === 0) {
                       outputs[output.key] = messageData;
                    }
                  }
                });
                setOutputValues(prev => ({ ...prev, ...outputs })); // Merge updates
             } else if (event.type === 'generating') {
                console.log("SSE Generating:", event.data);
                // Potentially update UI with intermediate state
             } else if (event.type === 'complete') {
                console.log("SSE Complete event received.");
                eventSource.close();
                eventSourceRef.current = null;
             } else if (event.type === 'heartbeat') {
                console.log("SSE Heartbeat");
             }

          } catch (parseError) {
            console.error('Error parsing SSE data:', parseError, "Raw data:", event.data);
            setError('Received invalid data from server.');
            eventSource.close();
            eventSourceRef.current = null;
            setLoading(false);
          }
        };

        eventSource.onerror = (error) => {
          console.error('SSE Error:', error);
          // Avoid setting error if it was just closed normally
          if (eventSourceRef.current) {
             setError('SSE connection failed.');
             eventSource.close();
             eventSourceRef.current = null;
             setLoading(false);
          }
          // Optional: Fallback to regular fetch
          // fetchRegularPreview();
        };

        // Note: The backend currently sends 'message' event. If it sends 'complete' or custom 'error_event',
        // add specific listeners here like:
        // eventSource.addEventListener('complete', () => { ... });
        // eventSource.addEventListener('error_event', (event: any) => { ... });


      } catch (err) {
        console.error('Error initiating SSE:', err);
        setError(err instanceof Error ? err.message : 'Failed to start SSE connection.');
        setLoading(false);
        // Optional: Fallback
        // fetchRegularPreview();
      }
    } else {
      // Use existing fetch implementation for Replicate or if SSE is disabled
      fetchRegularPreview();
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

  const downloadOutputAudio = (url: string) => {
    const link = document.createElement('a');
    link.href = url;
    link.download = 'output.mp3';
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
                case 'audio':
                  return (
                    <Dropzone
                      key={index}
                      onDrop={(accepted, rejected) => onAudioDrop(accepted, rejected, input.key)}
                      accept={{ 'audio/*': ['.mp3', '.wav', '.ogg'] }}
                      maxSize={10 * 1024 * 1024}
                    >
                      {({ getRootProps, getInputProps }) => (
                        <div {...getRootProps()} className="relative block w-full rounded-lg border-2 border-dashed border-gray-300 p-6 text-center hover:border-gray-400 focus:outline-none">
                          <input {...getInputProps()} />
                          {files[input.key] ? (
                            <div className="space-y-2">
                              <div className="flex items-center justify-between">
                                <span className="text-sm font-medium text-gray-300 truncate max-w-xs">
                                  {files[input.key].name}
                                </span>
                                <span className="text-xs text-gray-400">
                                  {(files[input.key].size / (1024 * 1024)).toFixed(2)}MB
                                </span>
                              </div>
                              <audio 
                                src={URL.createObjectURL(files[input.key])} 
                                controls
                                className="w-full mt-2"
                              />
                              <button 
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setFiles(prev => {
                                    const newFiles = {...prev};
                                    delete newFiles[input.key];
                                    return newFiles;
                                  });
                                  setBase64Images(prev => {
                                    const newImages = {...prev};
                                    delete newImages[input.key];
                                    return newImages;
                                  });
                                }}
                                className="text-xs text-red-400 hover:text-red-300"
                              >
                                Remove Audio
                              </button>
                            </div>
                          ) : (
                            <>
                              <MicrophoneIcon className="mx-auto h-10 w-10 text-gray-400" />
                              <p className="mt-2 text-sm font-medium text-gray-300">
                                Drop audio file or click to browse
                              </p>
                              <p className="text-xs text-gray-400 mt-1">
                                MP3, WAV, OGG (max 10MB)
                              </p>
                            </>
                          )}
                        </div>
                      )}
                    </Dropzone>
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
                        {output.component === 'audio' && outputValues[output.key] && (
                          <div className="space-y-2">
                            <audio 
                              src={String(outputValues[output.key])} 
                              controls
                              className="w-full"
                            />
                            <button
                              onClick={() => downloadOutputAudio(String(outputValues[output.key]))}
                              className="flex items-center text-sm text-gray-300 hover:text-white"
                            >
                              <FaDownload className="mr-1 h-3 w-3" />
                              Download Audio
                            </button>
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
            onClick={handleSubmitPreview}
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
