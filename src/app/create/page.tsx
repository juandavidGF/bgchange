"use client";

import { useState, useRef, useEffect } from 'react';
import { InputItem, OutputItem, Configuration } from "@/types";
import { PlusCircle, X, ChevronDown, ArrowRight } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { getConfigurations } from '@/common/configuration';

interface GradioEndpoint {
  key: string;
  inputs: InputItem[];
  outputs: OutputItem[];
}

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
  const [appType, setAppType] = useState<'gradio' | 'replicate'>('gradio');
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
  const [endpoint, setEndpoint] = useState('');
  const [endpoints, setEndpoints] = useState<string[]>([]);
  const [gradioEndpoints, setGradioEndpoints] = useState<GradioEndpoint[] | undefined>(undefined);

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const currentConfig = {
      name: appName,
      type: appType,
      ...(appType === 'gradio' ? { client, path, endpoint } : { model, version }),
      endpoint,
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
  }, [appName, appType, client, path, model, version, inputs, outputs, endpoint]);

  useEffect(() => {
    if (configurations.length > 0) {
      const initialInputs = configurations[0].inputs.map((input: InputItem) => ({
        ...input,
        type: input.type === 'string' ? 'string' : 'array' // Adjusted to only check for 'string' and 'array'
      }));
      setInputs(initialInputs);
    }
  }, [configurations]);

  useEffect(() => {
    if (gradioEndpoints) {
      const gradioEndpoint = gradioEndpoints.find((item) => item.key === endpoint);
      console.log({gradioEndpoint});
      if (gradioEndpoint) {
        const { inputs, outputs, key } = gradioEndpoint;
        console.log({key, inputs, outputs});
        setInputs(inputs || []);
        setOutputs(outputs || []);
      }
    }
  }, [endpoint]);

  const handleInputChange = (index: number, field: keyof InputItem, value: any) => {
    setInputs(prevInputs => {
      const updatedInputs = [...prevInputs];
      updatedInputs[index] = { ...updatedInputs[index], [field]: value };
      return updatedInputs;
    });
  };

  const handleOutputChange = (index: number, field: keyof OutputItem, value: any) => {
    setOutputs(prevOutputs => {
      const updatedOutputs = [...prevOutputs];
      updatedOutputs[index] = { ...updatedOutputs[index], [field]: value };
      updateJsonConfig(inputs, updatedOutputs);
      return updatedOutputs;
    });
  };

  const addInput = () => {
    setInputs([...inputs, { component: 'prompt', type: 'string', key: '', show: false }]);
  };

  const addOutput = () => {
    setOutputs([...outputs, { component: 'image', type: 'string', key: '', show: true }]);
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
    const isOutputsValid = outputs.length > 0;
    return isInputsValid && isOutputsValid && appName.trim() !== '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isFormValid()) {
      alert('Please fill all required fields and add at least one input and one output.');
      return;
    }

    const filteredInputs = inputs.filter(input => input.value !== null); // Exclude inputs with null value
    // const filteredOutputs = outputs.filter(output => output.key !== null);

    const newApp: Configuration = {
      name: appName,
      type: appType,
      inputs: filteredInputs,
      outputs,
    };

    if (appType === 'gradio') {
      newApp.client = client;
      newApp.path = path;
      newApp.endpoint = endpoint;
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

        router.push(`/app/${appName}`);
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
              type: Array.isArray(value) ? 'array' : typeof value === 'boolean' ? 'boolean' : typeof value === 'number' && Number.isInteger(value) ? 'integer' : 'string',
              key,
              value: value as any, // Explicitly cast value to any
              show: false,
              required: value.required || false,
              component: value.component || 'prompt'
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
        setEndpoint(parsedConfig.endpoint);
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

  interface PropertyValue {
    type: 'string' | 'array' | 'integer' | 'boolean';
    default?: string | number | boolean;
    description?: string;
    title?: string;
    required?: boolean;
    items?: {
      type?: string;
      format?: string;
    };
    format?: string; // Add this line
    component?: 'image' | 'prompt' | 'checkbox' | 'number' | 'video';
  }

  const handleFetchModelDetails = async (type: 'replicate' | 'gradio') => {
    try {
      const response = await fetch('/api/create/fetch-model-details', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ type, client, model, version }), // Send model and version in the request body
      });

      if (!response.ok) {
        throw new Error('Failed to fetch model data');
      }
      
      const data = await response.json();

      console.log('Fetched data:', data);

      // Populate inputs based on the schema
      const { formattedEndpoints }: { formattedEndpoints: GradioEndpoint[] } = data;
      
      console.log({formattedEndpoints});

      // I: I have the enpoints on formattedEndpoints
      // 2 I should have a select on endpoint, and be able to select the endpoint
      //    When changes the endpoint should appear the Inputs and Outputs,

      // I have to change the logic, when 

      // O: can be able to select the endpoint when is gradio.

      // It should happens depends on the endpoint, for example have one as default.
      // So here I should just I mean, update the endpoint, and for that endpoint,
      //  update the respective inputs and outputs,
      // So I can select the formattedParams to zero, and so on, and get the inputs, and otputs for that.
      // And, yeah, maybe review the useEffect, when something change here,

      let inputItems: InputItem[] = [];
      let outputItems: OutputItem[] = [];


      if (type === 'gradio') {
        console.log({type})

        const endpoints = formattedEndpoints.map((item: any) => item.key);
        const defaultEndpoint = endpoints[0]; // Default to first endpoint

        // Set Gradio endpoints and default endpoint
        setEndpoints(endpoints);
        setEndpoint(defaultEndpoint);
        setGradioEndpoints(formattedEndpoints);
        
        // Find the default endpoint data
        const defaultGradioEndpoint = formattedEndpoints.find((item) => item.key === defaultEndpoint);
        if (defaultGradioEndpoint) {
          inputItems = defaultGradioEndpoint.inputs || [];
          outputItems = defaultGradioEndpoint.outputs || [];

          // Immediately set inputs and outputs
          setInputs(inputItems);
          setOutputs(outputItems);

          // Sync JSON config with default endpoint data
          updateJsonConfig(inputItems, outputItems);
        }

        setIsRawDataStep(false); 
      } else if (type === 'replicate') {
        // Process inputs
        inputItems = Object.entries(inputs).map(([key, value]) => {
          const typedValue = value as PropertyValue;
          return {
            component: typedValue.component || 'prompt',
            key,
            type: typedValue.type,
            value: (typedValue.default !== undefined ? typedValue.default : null) as string | number | boolean | undefined,
            show: false,
            placeholder: typedValue.description || '',
            label: typedValue.title || '',
            required: false,
          };
        });
      
        // Process outputs
        const processOutput = (key: string, value: PropertyValue): OutputItem => {
          let outputItem: OutputItem = {
            component: value.component || 'image',
            key,
            type: value.type as 'string' | 'number' | 'boolean' | 'array',
            show: true,
            title: value.title || key,
            placeholder: value.description || '',
          };
        
          if (value.type === 'array' && value.items) {
            outputItem.typeItem = value.items.type as 'string' | 'number' | 'boolean';
            if (value.items.format) {
              outputItem.formatItem = value.items.format;
            }
          } else if (value.type === 'string' && value.format) {
            outputItem.format = value.format;
          }
        
          return outputItem;
        };

        outputItems = Object.entries({outputs}).map(([key, value]) => processOutput(key, value as PropertyValue));
      }
        

      // Sort inputs to have required fields at the top
      // const sortedInputs = [
      //   ...inputItems.filter((input: InputItem) => input.required),
      //   ...inputItems.filter((input: InputItem) => !input.required),
      // ];

      const validInputs = inputItems.filter((item): item is InputItem => item !== undefined);
      const validOutputs = outputItems.filter((item): item is OutputItem => item !== undefined);
      setInputs(validInputs);
      setOutputs(validOutputs);
      updateJsonConfig(validInputs, validOutputs);
      setIsRawDataStep(false);
    } catch (error: any) {
      console.error('Error fetching model details:', error.message);
      alert('Error fetching model data. Please check the URL and try again.');
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

  const updateJsonConfig = (inputs: InputItem[], outputs: OutputItem[]) => {
    const config: Configuration = {
      name: appName,
      type: appType,
      inputs,
      outputs: outputs.map(output => {
        // Include all properties, including formatItem if it exists
        const outputItem: OutputItem = {
          key: output.key,
          type: output.type,
          show: output.show,
          title: output.title,
          placeholder: output.placeholder,
          component: output.component || 'image'
        };
        if (output.format) outputItem.format = output.format;
        if (output.typeItem) outputItem.typeItem = output.typeItem;
        if (output.formatItem) outputItem.formatItem = output.formatItem;
        return outputItem;
      })
    };

    if (appType === 'replicate') {
      config.model = model as `${string}/${string}`;
      config.version = version;
    } else if (appType === 'gradio') {
      config.client = client;
      config.path = path;
      config.endpoint = endpoint;
    }

    setJsonConfig(JSON.stringify(config, null, 2));
  };

  const handleAppNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAppName(e.target.value);
    updateJsonConfig(inputs, outputs);
  };

  const handleAppTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setAppType(e.target.value as 'gradio' | 'replicate');
    updateJsonConfig(inputs, outputs);
  };

  const handleModelChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setModel(e.target.value);
    updateJsonConfig(inputs, outputs);
  };

  const handleVersionChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setVersion(e.target.value);
    updateJsonConfig(inputs, outputs);
  };

  const handleClientChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setClient(e.target.value);
    updateJsonConfig(inputs, outputs);
  };

  const handlePathChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPath(e.target.value);
    updateJsonConfig(inputs, outputs);
  };

  const handleEndpointChange = (e: React.ChangeEvent<HTMLInputElement> | React.ChangeEvent<HTMLSelectElement>) => {
    setEndpoint(e.target.value);
    updateJsonConfig(inputs, outputs);
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
                onClick={() => handleFetchModelDetails('replicate')}
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
                <label className="block text-sm font-medium text-gray-300 mb-1">Client:</label>
                <input
                  type="text"
                  value={client}
                  onChange={(e) => setClient(e.target.value)}
                  placeholder="Enter the gradio client"
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <button
                type="button"
                onClick={() => handleFetchModelDetails('gradio')}
                disabled={isLoading || !client}
                className="w-full px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:bg-gray-400"
              >
                {isLoading ? 'Fetching...' : 'Fetch Model Details'}
              </button>
              {/* <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Raw Data (Optional):</label>
                <textarea
                  ref={textareaRef}
                  value={rawData}
                  onChange={handleRawDataChange}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500 h-[20vh]"
                  placeholder='Paste raw data here (optional)...'
                />
              </div> */}
            </div>
          )}

          {/* {appType === 'gradio' && (
            <button
              type="button"
              onClick={handleParseRawData}
              className="w-full px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
            >
              Parse Raw Data
            </button>
          )} */}
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
                    onChange={handleAppNameChange}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">App Type:</label>
                  <select
                    value={appType}
                    onChange={handleAppTypeChange}
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
                      onChange={handleClientChange}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Path:</label>
                    <input
                      type="text"
                      value={path}
                      onChange={handlePathChange}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Endpoint:</label>
                    {endpoints ? (
                      <select
                      onChange={handleEndpointChange}
                      className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded-md text-white"
                      >
                        {endpoints && endpoints.map((item: string) => 
                          (<option key={item} value={item}>{item}</option>)
                        )}
                      </select>
                    ) : (
                      <input
                        type="text"
                        value={endpoint}
                        onChange={handleEndpointChange}
                        className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                      />
                    )}
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Model:</label>
                    <input
                      type="text"
                      value={model}
                      onChange={handleModelChange}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Version:</label>
                    <input
                      type="text"
                      value={version || ''}
                      onChange={handleVersionChange}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  {appType === 'replicate' && (
                    <div className="mt-4">
                      <button
                        type="button"
                        onClick={() => handleFetchModelDetails('replicate')}
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
                          <input
                            type="text"
                            value={input.key}
                            onChange={(e) => handleInputChange(index, 'key', e.target.value)}
                            placeholder="Key"
                            className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded-md text-white"
                          />
                          <select
                            value={input.component}
                            onChange={(e) => handleInputChange(index, 'component', e.target.value as InputItem['component'])}
                            className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded-md text-white"
                          >
                            <option value="prompt">Prompt</option>
                            <option value="image">Image</option>
                            <option value="checkbox">Checkbox</option>
                            <option value="number">Number</option>
                            <option value="video">Video</option>
                          </select>
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
                              value={input.label || ''}
                              onChange={(e) => handleInputChange(index, 'label', e.target.value)}
                              placeholder="Label"
                              className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded-md text-white"
                            />
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
                          <input
                            type="text"
                            value={output.title}
                            onChange={(e) => handleOutputChange(index, 'title', e.target.value)}
                            placeholder="Title"
                            className="w-full mt-2 px-3 py-2 bg-gray-600 border border-gray-500 rounded-md text-white"
                          />
                          <select
                            value={output.component}
                            onChange={(e) => handleOutputChange(index, 'component', e.target.value as OutputItem['component'])}
                            className="w-full mt-2 px-3 py-2 bg-gray-600 border border-gray-500 rounded-md text-white"
                          >
                            <option value="image">Image</option>
                            <option value="prompt">Prompt</option>
                            <option value="checkbox">Checkbox</option>
                            <option value="number">Number</option>
                            <option value="video">Video</option>
                          </select>
                        </div>
                        <div className="grid grid-cols-2 gap-4 mt-2">
                          <input
                            type="text"
                            value={output.placeholder || ''}
                            onChange={(e) => handleOutputChange(index, 'placeholder', e.target.value)}
                            placeholder="Placeholder"
                            className="w-full mt-2 px-3 py-2 bg-gray-600 border border-gray-500 rounded-md text-white"
                          />
                          <div className="flex items-center justify-between">
                            <label className="flex items-center space-x-2 text-gray-300">
                              <input
                                type="checkbox"
                                checked={output.show}
                                onChange={(e) => handleOutputChange(index, 'show', e.target.checked)}
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
                        {output.show && (
                          <div className="mt-4 grid grid-cols-2 gap-4">
                            <input
                              type="text"
                              value={output.key}
                              onChange={(e) => handleOutputChange(index, 'key', e.target.value)}
                              placeholder="Key"
                              className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded-md text-white"
                            />
                            <select
                              value={output.type}
                              onChange={(e) => handleOutputChange(index, 'type', e.target.value as OutputItem['type'])}
                              className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded-md text-white"
                            >
                              <option value="string">String</option>
                              <option value="number">Number</option>
                              <option value="boolean">Boolean</option>
                              <option value="array">Array</option>
                            </select>
                            {output.type === 'array' && (
                              <>
                                <select
                                  value={output.typeItem || ''}
                                  onChange={(e) => handleOutputChange(index, 'typeItem', e.target.value as OutputItem['typeItem'])}
                                  className="w-full mt-2 px-3 py-2 bg-gray-600 border border-gray-500 rounded-md text-white"
                                >
                                  <option value="">Select Item Type</option>
                                  <option value="string">String</option>
                                  <option value="number">Number</option>
                                  <option value="boolean">Boolean</option>
                                </select>
                                <input
                                  type="text"
                                  value={output.formatItem || ''}
                                  onChange={(e) => handleOutputChange(index, 'formatItem', e.target.value)}
                                  placeholder="Format Item"
                                  className="w-full mt-2 px-3 py-2 bg-gray-600 border border-gray-500 rounded-md text-white"
                                />
                              </>
                            )}
                            {output.type === 'string' && (
                              <input
                                type="text"
                                value={output.format || ''}
                                onChange={(e) => handleOutputChange(index, 'format', e.target.value)}
                                placeholder="Format"
                                className="w-full mt-2 px-3 py-2 bg-gray-600 border border-gray-500 rounded-md text-white"
                              />
                            )}
                          </div>
                        )}
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