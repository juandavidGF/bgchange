"use client";

import { useState, useRef, useEffect } from 'react';
import { InputItem, OutputItem, Configuration } from "@/types";
import { PlusCircle, X, ChevronDown, ArrowRight } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { getConfigurations } from '@/common/configuration';

const JsonEditor = ({ value, onChange }: { value: string; onChange: (value: string) => void }) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const scrollPositionRef = useRef<number>(0);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.scrollTop = scrollPositionRef.current;
    }
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChange(e.target.value);
  };

  const handleScroll = () => {
    if (textareaRef.current) {
      scrollPositionRef.current = textareaRef.current.scrollTop;
    }
  };

  return (
    <textarea
      ref={textareaRef}
      value={value}
      onChange={handleChange}
      onScroll={handleScroll}
      className="w-full h-[60vh] px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none overflow-auto"
    />
  );
};

export default function CreateApp() {
  const router = useRouter();

  const [isRawDataStep, setIsRawDataStep] = useState(true);
  const [appType, setAppType] = useState<'gradio' | 'replicate'>('replicate');
  const [rawData, setRawData] = useState('');
  const [modelUrl, setModelUrl] = useState('');
  const [modelData, setModelData] = useState<any>(null);
  const [editMode, setEditMode] = useState<'form' | 'json'>('form');
  const [jsonConfig, setJsonConfig] = useState('');
  const [appName, setAppName] = useState('');
  const [inputs, setInputs] = useState<InputItem[]>([]);
  const [outputs, setOutputs] = useState<OutputItem[]>([]);
  const [path, setPath] = useState('/predict');
  const [client, setClient] = useState('');
  const [modelInput, setModelInput] = useState('');
  const [model, setModel] = useState('');
  const [version, setVersion] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [modelDetails, setModelDetails] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [configurations, setConfigurations] = useState<any[]>([]);
  const [loadingMessage, setLoadingMessage] = useState<string | null>(null); // State for loading message
  const [successMessage, setSuccessMessage] = useState<string | null>(null); // State for success message

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const currentConfig = {
      name: appName,
      type: appType,
      ...(appType === 'gradio' ? { client, path } : { model, version }),
      inputs: inputs.map(input => ({
        type: input.type,
        key: input.key,
        show: input.show,
        placeholder: input.placeholder || "",
        gradioName: input.gradioName || "",
        label: input.label || "",
        description: input.description || "",
        component: input.component || "",
        value: input.value !== undefined ? input.value : null
      })),
      outputs: outputs.map(output => ({
        type: output.type,
        key: output.key,
        show: output.show,
        placeholder: output.placeholder || ""
      }))
    };
    setJsonConfig(JSON.stringify(currentConfig, null, 2));
  }, [appName, appType, client, path, model, version, inputs, outputs]);

  useEffect(() => {
    if (configurations.length > 0) {
      const initialInputs = configurations[0].inputs.map((input: InputItem) => ({
        ...input,
        type: input.type === 'string' ? 'string' : 'array' // Adjusted to only check for 'string' and 'array'
      }));
      setInputs(initialInputs);
    }
  }, [configurations]);

  const handleInputChange = (index: number, field: keyof InputItem, value: any) => {
    setInputs(prevInputs => {
      const updatedInputs = [...prevInputs];
      updatedInputs[index] = { ...updatedInputs[index], [field]: value };
      return updatedInputs;
    });
  };

  const addInput = () => {
    setInputs([...inputs, { type: 'string', key: '', show: false }]); // Changed 'text' to 'string'
  };

  const addOutput = () => {
    setOutputs([...outputs, { type: 'text', key: '', placeholder: '', show: true }]);
  };

  const updateInput = (index: number, field: keyof InputItem, value: any) => {
    const newInputs = [...inputs];
    newInputs[index] = { ...newInputs[index], [field]: value };
    setInputs(newInputs);
  };

  const updateOutput = (index: number, field: keyof OutputItem, value: any) => {
    const newOutputs = [...outputs];
    newOutputs[index] = { ...newOutputs[index], [field]: value };
    setOutputs(newOutputs);
  };

  const removeInput = (index: number) => {
    const newInputs = inputs.filter((_, i) => i !== index);
    setInputs(newInputs);
  };

  const removeOutput = (index: number) => {
    const newOutputs = outputs.filter((_, i) => i !== index);
    setOutputs(newOutputs);
  };

  const isFormValid = () => {
    const isInputsValid = inputs.length > 0 && inputs.every(input => input.key.trim() !== '');
    const isOutputsValid = outputs.length > 0 && outputs.every(output => output.key.trim() !== '');
    return isInputsValid && isOutputsValid && appName.trim() !== '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isFormValid()) {
      alert('Please fill all required fields and add at least one input and one output.');
      return;
    }

    const newApp: Configuration = {
      name: appName,
      type: appType,
      inputs,
      outputs,
    };

    if (appType === 'gradio') {
      newApp.client = client;
      newApp.path = path;
    } else {
      newApp.model = model as `${string}/${string}`;
      newApp.version = version;
    }

    try {
      const response = await fetch('/api/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newApp),
      });

      if (response.ok) {
        alert('App created successfully!');
        const checkAppExists = async () => {
          const res = await fetch(`/api/app/${appName}`);
          return res.ok;
        };

        const interval = setInterval(async () => {
          const exists = await checkAppExists();
          if (exists) {
            clearInterval(interval);
            router.push(`/app/${appName}`);
          }
        }, 1000);
      } else {
        alert('Failed to create app');
      }
    } catch (error) {
      console.error('Error creating app:', error);
      alert('An error occurred while creating the app');
    }
  };

  const handleRawDataChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setRawData(e.target.value);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  };

  const handleParseRawData = () => {
    console.log({rawData});
    
    setErrorMessage('');

    const isReplicate = /\breplicate\.run\(/.test(rawData);
    if (!isReplicate) {
      setErrorMessage('Invalid format for Replicate raw data. Please check your input.');
      return;
    }

    console.log({isReplicate});

    if (isReplicate) {
      const step2Regex = /"([^:]+\/[^:]+):([^"]+)"/;
      const modelMatch = rawData.match(step2Regex);
      console.log("Step 2:", modelMatch ? modelMatch.slice(1) : "No match");

      if (modelMatch) {
        const model = modelMatch[1];
        const version = modelMatch[2];
        
        const step3Regex = /input:\s*({[\s\S]*?})\s*}/;
        const inputMatch = rawData.match(step3Regex);
        console.log("Step 3:", inputMatch ? "Input object found" : "No input object");
        
        if (inputMatch) {
          console.log("Input Match:", inputMatch[1]);

          const inputString = inputMatch[1];

          const configuration: Configuration = {
            name: model,
            type: 'replicate',
            model: model as `${string}/${string}`,
            version: version,
            inputs: Object.entries(eval(`(${inputString})`)).map(([key, value]: [string, any]) => ({
              type: Array.isArray(value) ? 'array' : typeof value === 'boolean' ? 'boolean' : typeof value === 'number' ? 'number' : 'string',
              key,
              value: value as any, // Explicitly cast value to any
              show: false,
              required: value.required || false
            }))
          };

          console.log("Configuration:", JSON.stringify(configuration, null, 2));

          setAppName(configuration.name);
          setAppType(configuration.type);
          setModel(configuration.model as string);
          setVersion(configuration.version || null);
          setInputs(configuration.inputs);
          setIsRawDataStep(false);
        } else {
          console.error("Error: No input object found in raw data. Please check the format.");
        }
      }
    } else {
      console.log("Type not identified as replicate");
    }
  };

  const handleJsonChange = (newValue: string) => {
    setJsonConfig(newValue);
    try {
      const parsedConfig = JSON.parse(newValue);
      setAppName(parsedConfig.name);
      setAppType(parsedConfig.type);
      if (parsedConfig.type === 'gradio') {
        setClient(parsedConfig.client);
        setPath(parsedConfig.path);
      } else {
        setModel(parsedConfig.model);
        setVersion(parsedConfig.version);
      }
      setInputs(parsedConfig.inputs.map((input: any) => ({
        type: input.type,
        key: input.key,
        show: input.show,
        placeholder: input.placeholder || "",
        gradioName: input.gradioName || "",
        label: input.label || "",
        description: input.description || "",
        component: input.component || "",
        value: input.value !== undefined ? input.value : null
      })));
      setOutputs(parsedConfig.outputs.map((output: any) => ({
        type: output.type,
        key: output.key,
        show: output.show,
        placeholder: output.placeholder || ""
      })));
    } catch (error) {
      console.error('Invalid JSON:', error);
    }
  };

  const handleFetchModel = async () => {
    try {
      const response = await fetch(modelUrl);
      if (!response.ok) {
        throw new Error('Failed to fetch model data');
      }
      const data = await response.json();
      setModelData(data);
    } catch (error) {
      console.error('Error fetching model:', error);
      alert('Error fetching model data. Please check the URL and try again.');
    }
  };

  const handleModelInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setModelInput(e.target.value);
    const [modelPart, versionPart] = e.target.value.split(':');
    setModel(modelPart.trim());
    setVersion(versionPart ? versionPart.trim() : null);
  };

  const fetchModelDetails = async () => {
    if (appType !== 'replicate' || !model || !version) return;

    setIsLoading(true);
    setLoadingMessage('Fetching model details...'); // Set loading message
    setSuccessMessage(null); // Clear previous success message

    try {
      const response = await fetch('/api/create/fetch-model-details', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model, version }),
      });

      if (!response.ok) throw new Error(`Failed to fetch model details: ${response.status}`);

      const data = await response.json();

      console.log({ data });

      const newInputs: InputItem[] = Object.entries(data.inputs).map(([key, value]: [string, any]) => ({
        type: value.type, // Use the type from the API directly
        key,
        show: value.show || false, // Use the API value for 'show'
        placeholder: value.description || '',
        label: value.title || key,
        description: value.description || '',
        value: value.default !== undefined ? value.default : '', // Set to empty string if null
        required: value.required || false
      }));

      setInputs(newInputs);

      const newOutputs: OutputItem[] = [{
        type: data.outputs.type,
        key: data.outputs.title || '',
        show: true,
        placeholder: data.outputs.title || 'Generated output',
        format: data.outputs.items.format,
      }];

      setOutputs(newOutputs);
      setIsRawDataStep(false);
      setSuccessMessage('Model details fetched successfully!'); // Set success message
    } catch (error: any) {
      console.error('Error fetching model details:', error);
      alert(`Failed to fetch model details. Please check the model and version. ${error.message}`);
    } finally {
      setIsLoading(false);
      setLoadingMessage(null); // Clear loading message
    }
  };

  const fetchConfigurations = async () => {
    setIsLoading(true);
    try {
      const timestamp = Date.now();
      const configurations = await getConfigurations(true);
      // Handle configurations as needed
    } catch (error) {
      console.error('Error fetching configurations:', error);
      alert('Failed to fetch configurations.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBack = () => {
    setIsRawDataStep(true);
    fetchConfigurations();
  };

  // Component to render inputs dynamically
  const renderInput = (input: InputItem) => {
    switch (input.type) {
      case 'string':
        return <input type="text" value={input.value || ''} placeholder={input.placeholder} />;
      case 'array':
        return (
          <select multiple>
            {/* Populate options based on your needs */}
            <option value="uri">URI</option>
            {/* Add more options as needed */}
          </select>
        );
      default:
        return null;
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 space-y-4 sm:space-y-6 bg-gray-800 rounded-lg shadow-lg mt-8 sm:mt-16">
      {isRawDataStep ? (
        <>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-200">Enter Model Details</h2>
            <button
              type="button"
              onClick={() => setIsRawDataStep(false)}
              className="flex items-center bg-gray-500 text-white px-4 py-2 rounded-md hover:bg-gray-600"
            >
              <ArrowRight size={20} />
              <span className="ml-1">Skip Step</span>
            </button>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-300 mb-1">App Type:</label>
            <select
              value={appType}
              onChange={(e) => setAppType(e.target.value as 'gradio' | 'replicate')}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="replicate">Replicate</option>
              <option value="gradio">Gradio</option>
            </select>
          </div>

          {appType === 'replicate' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Model:Version</label>
                <input
                  type="text"
                  value={modelInput}
                  onChange={handleModelInputChange}
                  placeholder="owner/model_name:version"
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <button
                type="button"
                onClick={fetchModelDetails}
                disabled={isLoading || !model}
                className="w-full px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:bg-gray-400"
              >
                {isLoading ? 'Fetching...' : 'Fetch Model Details'}
              </button>
            </div>
          )}

          {appType === 'gradio' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Model URL:</label>
                <input
                  type="text"
                  value={modelUrl}
                  onChange={(e) => setModelUrl(e.target.value)}
                  placeholder="Enter Gradio model URL"
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Raw Data (Optional):</label>
                <textarea
                  ref={textareaRef}
                  value={rawData}
                  onChange={handleRawDataChange}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500 h-[20vh]"
                  placeholder='Paste raw data here (optional)...'
                />
              </div>
            </div>
          )}

          {appType === 'gradio' && (
            <button
              type="button"
              onClick={handleParseRawData}
              className="w-full px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
            >
              Parse Raw Data
            </button>
          )}
        </>
      ) : (
        <form onSubmit={handleSubmit}>
          <div className="flex justify-between items-center mb-4">
            <div className="flex space-x-4">
              <button 
                type="button"
                onClick={() => setEditMode('form')} 
                className={`px-4 py-2 rounded-md ${editMode === 'form' ? 'bg-blue-500 text-white' : 'bg-gray-700 text-gray-300'}`}
              >
                Form
              </button>
              <button 
                type="button"
                onClick={() => setEditMode('json')} 
                className={`px-4 py-2 rounded-md ${editMode === 'json' ? 'bg-blue-500 text-white' : 'bg-gray-700 text-gray-300'}`}
              >
                JSON
              </button>
            </div>
            <button 
              type="submit" 
              className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600"
            >
              Create App
            </button>
          </div>

          {editMode === 'form' ? (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">App Name:</label>
                  <input
                    type="text"
                    value={appName}
                    onChange={(e) => setAppName(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">App Type:</label>
                  <select
                    value={appType}
                    onChange={(e) => setAppType(e.target.value as 'gradio' | 'replicate')}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="gradio">Gradio</option>
                    <option value="replicate">Replicate</option>
                  </select>
                </div>
              </div>

              {appType === 'gradio' ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Client:</label>
                    <input
                      type="text"
                      value={client}
                      onChange={(e) => setClient(e.target.value)}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Path:</label>
                    <input
                      type="text"
                      value={path}
                      onChange={(e) => setPath(e.target.value)}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Model:</label>
                    <input
                      type="text"
                      value={model}
                      onChange={(e) => setModel(e.target.value)}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Version:</label>
                    <input
                      type="text"
                      value={version || ''}
                      onChange={(e) => setVersion(e.target.value || null)}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  {appType === 'replicate' && (
                    <div className="mt-4">
                      <button
                        type="button"
                        onClick={fetchModelDetails}
                        className="w-full px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
                      >
                        Re-fetch Model Details
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Show loading message */}
              {loadingMessage && <div className="text-yellow-300">{loadingMessage}</div>}

              {/* Hide inputs and outputs while loading */}
              {isLoading ? (
                <div className="text-gray-300">Loading...</div>
              ) : (
                <>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-200 mb-2">Inputs:</h3>
                    {inputs.map((input, index) => (
                      <div key={index} className="mb-4 p-4 bg-gray-700 rounded-md">
                        <div className="grid grid-cols-2 gap-4">
                          <select
                            value={input.type}
                            onChange={(e) => handleInputChange(index, 'type', e.target.value as InputItem['type'])}
                            className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded-md text-white"
                          >
                            <option value="string">String</option>
                            <option value="array">Array</option>
                            <option value="number">Number</option>
                            <option value="boolean">Boolean</option>
                          </select>
                          <input
                            type="text"
                            value={input.key}
                            onChange={(e) => handleInputChange(index, 'key', e.target.value)}
                            placeholder="Key"
                            className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded-md text-white"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-4 mt-2">
                          <input
                            type="text"
                            value={input.value || ''}
                            onChange={(e) => handleInputChange(index, 'value', e.target.value)}
                            placeholder="Value"
                            className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded-md text-white"
                          />
                          <div className="flex items-center justify-between">
                            <label className="flex items-center space-x-2 text-gray-300">
                              <input
                                type="checkbox"
                                checked={input.show}
                                onChange={(e) => handleInputChange(index, 'show', e.target.checked)}
                                className="form-checkbox h-5 w-5 text-blue-500"
                              />
                              <span>Show</span>
                            </label>
                            <button
                              type="button"
                              onClick={() => removeInput(index)}
                              className="p-2 bg-red-500 text-white rounded-md hover:bg-red-600"
                            >
                              <X size={20} />
                            </button>
                          </div>
                        </div>
                        {input.show && (
                          <div className="grid grid-cols-2 gap-4 mt-4">
                            <input
                              type="text"
                              value={input.placeholder || ''}
                              onChange={(e) => handleInputChange(index, 'placeholder', e.target.value)}
                              placeholder="Placeholder"
                              className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded-md text-white"
                            />
                            <input
                              type="text"
                              value={input.gradioName || ''}
                              onChange={(e) => handleInputChange(index, 'gradioName', e.target.value)}
                              placeholder="Gradio Name"
                              className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded-md text-white"
                            />
                            <input
                              type="text"
                              value={input.label || ''}
                              onChange={(e) => handleInputChange(index, 'label', e.target.value)}
                              placeholder="Label"
                              className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded-md text-white"
                            />
                            <input
                              type="text"
                              value={input.description || ''}
                              onChange={(e) => handleInputChange(index, 'description', e.target.value)}
                              placeholder="Description"
                              className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded-md text-white"
                            />
                            <select
                              value={input.component || ''}
                              onChange={(e) => handleInputChange(index, 'component', e.target.value)}
                              className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded-md text-white"
                            >
                              <option value="">Select Component</option>
                              <option value="image">Image</option>
                              <option value="prompt">Prompt</option>
                              <option value="checkbox">Checkbox</option>
                              <option value="number">Number</option>
                              <option value="video">Video</option>
                            </select>
                            <label className="flex items-center space-x-2 text-gray-300">
                              <input
                                type="checkbox"
                                checked={input.required || false}
                                onChange={(e) => handleInputChange(index, 'required', e.target.checked)}
                                className="form-checkbox h-5 w-5 text-blue-500"
                              />
                              <span>Required</span>
                            </label>
                          </div>
                        )}
                      </div>
                    ))}
                    <button 
                      type="button" 
                      onClick={addInput} 
                      className="w-full mt-2 px-4 py-2 bg-gray-700 text-white rounded-md hover:bg-gray-600 flex items-center justify-center"
                    >
                      <PlusCircle size={20} className="mr-2" />
                      Add Input
                    </button>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-200 mb-2">Outputs:</h3>
                    {outputs.map((output, index) => (
                      <div key={index} className="mb-4 p-4 bg-gray-700 rounded-md">
                        <div className="grid grid-cols-2 gap-4">
                          <select
                            value={output.type}
                            onChange={(e) => updateOutput(index, 'type', e.target.value as OutputItem['type'])}
                            className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded-md text-white"
                          >
                            <option value="text">Text</option>
                            <option value="image">Image</option>
                            <option value="array">Array</option>
                          </select>
                          <input
                            type="text"
                            value={output.key}
                            onChange={(e) => updateOutput(index, 'key', e.target.value)}
                            placeholder="Key"
                            className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded-md text-white"
                          />
                          <input
                            type="text"
                            value={output.placeholder || ''}
                            onChange={(e) => updateOutput(index, 'placeholder', e.target.value)}
                            placeholder="Placeholder"
                            className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded-md text-white"
                          />
                          <div className="flex items-center justify-between">
                            <label className="flex items-center space-x-2 text-gray-300">
                              <input
                                type="checkbox"
                                checked={output.show}
                                onChange={(e) => updateOutput(index, 'show', e.target.checked)}
                                className="form-checkbox h-5 w-5 text-blue-500"
                              />
                              <span>Show</span>
                            </label>
                            <button
                              type="button"
                              onClick={() => removeOutput(index)}
                              className="p-2 bg-red-500 text-white rounded-md hover:bg-red-600"
                            >
                              <X size={20} />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                    <button 
                      type="button" 
                      onClick={addOutput} 
                      className="w-full mt-2 px-4 py-2 bg-gray-700 text-white rounded-md hover:bg-gray-600 flex items-center justify-center"
                    >
                      <PlusCircle size={20} className="mr-2" />
                      Add Output
                    </button>
                  </div>
                  {successMessage && <div className="text-green-300">{successMessage}</div>}
                </>
              )}
            </>
          ) : (
            <JsonEditor value={jsonConfig} onChange={handleJsonChange} />
          )}
        </form>
      )}

      {modelData && (
        <div className="mt-4 p-4 bg-gray-700 rounded-md">
          <h3 className="text-lg font-semibold text-gray-200">Model Data:</h3>
          <pre className="text-gray-300">{JSON.stringify(modelData, null, 2)}</pre>
        </div>
      )}
    </div>
  );
}