"use client";

import { useState, useRef, useEffect } from 'react';
import { InputItem, OutputItem, Configuration } from "@/types";
import { PlusCircle, X, ChevronDown, ArrowRight } from 'lucide-react';
import { useRouter } from 'next/navigation';

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
  const [rawData, setRawData] = useState('');
  const [modelUrl, setModelUrl] = useState('');
  const [modelData, setModelData] = useState<any>(null); // Adjust type as needed
  const [editMode, setEditMode] = useState<'form' | 'json'>('form');
  const [jsonConfig, setJsonConfig] = useState('');
  const [appName, setAppName] = useState('');
  const [appType, setAppType] = useState<'gradio' | 'replicate'>('replicate');
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
  const [configurations, setConfigurations] = useState<any[]>([]); // Add this line to define configurations

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
    // Set default values based on configurations when the component mounts
    if (configurations.length > 0) {
      const initialInputs = configurations[0].inputs.map((input: InputItem) => ({
        ...input,
        type: input.type === 'image' ? 'image' : 
              input.type === 'prompt' ? 'prompt' :
              input.type === 'checkbox' ? 'checkbox' :
              input.type === 'number' ? 'number' :
              input.type === 'video' ? 'video' : 'text'
      }));
      setInputs(initialInputs);
    }
  }, [configurations]);

  const handleInputChange = (index: number, field: keyof InputItem, value: any) => {
    const newInputs = [...inputs];
    newInputs[index] = { ...newInputs[index], [field]: value };

    // Update the JSON configuration to match the form input
    setJsonConfig(JSON.stringify(newInputs, null, 2));

    setInputs(newInputs);
  };

  const addInput = () => {
    setInputs([...inputs, { type: 'text', key: '', show: false }]);
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
        // Directly navigate to the new app page
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
    
    // Reset error message
    setErrorMessage('');

    // Check if it's a replicate run
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

      // Extract model and version
      if (modelMatch) {
        const model = modelMatch[1];
        const version = modelMatch[2];
        
        // Step 3: Match the input object
        const step3Regex = /input:\s*({[\s\S]*?})\s*}/;
        const inputMatch = rawData.match(step3Regex);
        console.log("Step 3:", inputMatch ? "Input object found" : "No input object");
        
        if (inputMatch) {
          console.log("Input Match:", inputMatch[1]);

          const inputString = inputMatch[1];

          // Step 4: Create the configuration object directly
          const configuration: Configuration = {
            name: model,
            type: 'replicate',
            model: model as `${string}/${string}`,
            version: version,
            inputs: Object.entries(eval(`(${inputString})`)).map(([key, value]) => ({
              type: typeof value === 'number' ? 'number' : 'text',
              key,
              value,
              show: false
            }))
          };

          console.log("Configuration:", JSON.stringify(configuration, null, 2));

          // Update state with the generated object
          setAppName(configuration.name);
          setAppType(configuration.type);
          setModel(configuration.model as string);
          setVersion(configuration.version || null);
          setInputs(configuration.inputs);
          setIsRawDataStep(false); // Automatically move to the next step
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
      // You can also update other states based on the fetched data
      // For example, if the data contains inputs and outputs, you can set them here
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
    try {
      const response = await fetch('/api/create/fetch-model-details', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model, version }),
      });

      if (!response.ok) throw new Error(`Failed to fetch model details: ${response.status}`);

      const data = await response.json();

      console.log({data});
      
      const newInputs: InputItem[] = Object.entries(data.inputs).map(([key, value]: [string, any]) => ({
        type: value.type === 'integer' ? 'number' : (value.type === 'boolean' ? 'checkbox' : 'text'),
        key,
        show: false, // Set show to false by default
        placeholder: value.description || '',
        label: value.title || key,
        description: value.description || '',
        value: value.default !== undefined ? value.default : null, // Preserve default value
      }));

      // Ensure 'image' type is set correctly
      const correctedInputs = newInputs.map(input => ({
        ...input,
        type: input.key.toLowerCase().includes('image') ? 'image' : input.type,
      }));

      setInputs(correctedInputs);

      const newOutputs: OutputItem[] = [{
        type: data.outputs.type,
        key: data.outputs.title || '', // Assuming key is available in items
        show: true,
        placeholder: data.outputs.title || 'Generated output',
        format: data.outputs.items.format, // Preserve format if needed
      }];

      setOutputs(newOutputs);
      setIsRawDataStep(false); // Automatically move to the next step
    } catch (error: any) {
      console.error('Error fetching model details:', error);
      alert(`Failed to fetch model details. Please check the model and version. ${error.message}`);
    } finally {
      setIsLoading(false);
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
                </div>
              )}

              <div>
                <h3 className="text-lg font-semibold text-gray-200 mb-2">Inputs:</h3>
                {inputs.map((input, index) => (
                  <div key={index} className="mb-4 p-4 bg-gray-700 rounded-md">
                    <div className="grid grid-cols-2 gap-4">
                      <select
                        value={input.type}
                        onChange={(e) => handleInputChange(index, 'type', e.target.value)}
                        className="w-full px-3 py-1.5 bg-gray-600 border border-gray-500 rounded-md text-white"
                      >
                        <option value="image">Image</option>
                        <option value="prompt">Prompt</option>
                        <option value="checkbox">Checkbox</option>
                        <option value="number">Number</option>
                        <option value="video">Video</option>
                      </select>
                      <input
                        type="text"
                        value={input.key}
                        onChange={(e) => updateInput(index, 'key', e.target.value)}
                        placeholder="Key"
                        className="w-full px-3 py-1.5 bg-gray-600 border border-gray-500 rounded-md text-white"
                      />
                      <div className="col-span-2 flex items-center justify-between">
                        <label className="flex items-center space-x-2 text-gray-300">
                          <input
                            type="checkbox"
                            checked={input.show}
                            onChange={(e) => updateInput(index, 'show', e.target.checked)}
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
                      {input.show && (
                        <>
                          <input
                            type="text"
                            value={input.placeholder || ''}
                            onChange={(e) => updateInput(index, 'placeholder', e.target.value)}
                            placeholder="Placeholder"
                            className="px-3 py-1.5 bg-gray-600 border border-gray-500 rounded-md text-white"
                          />
                          <input
                            type="text"
                            value={input.gradioName || ''}
                            onChange={(e) => updateInput(index, 'gradioName', e.target.value)}
                            placeholder="Gradio Name"
                            className="px-3 py-1.5 bg-gray-600 border border-gray-500 rounded-md text-white"
                          />
                          <input
                            type="text"
                            value={input.label || ''}
                            onChange={(e) => updateInput(index, 'label', e.target.value)}
                            placeholder="Label"
                            className="px-3 py-1.5 bg-gray-600 border border-gray-500 rounded-md text-white"
                          />
                          <input
                            type="text"
                            value={input.description || ''}
                            onChange={(e) => updateInput(index, 'description', e.target.value)}
                            placeholder="Description"
                            className="px-3 py-1.5 bg-gray-600 border border-gray-500 rounded-md text-white"
                          />
                          <input
                            type="text"
                            value={input.component || ''}
                            onChange={(e) => updateInput(index, 'component', e.target.value)}
                            placeholder="Component"
                            className="px-3 py-1.5 bg-gray-600 border border-gray-500 rounded-md text-white"
                          />
                        </>
                      )}
                      <input
                        type="text"
                        value={input.value !== undefined ? String(input.value) : ''}
                        onChange={(e) => updateInput(index, 'value', e.target.value)}
                        placeholder="Default Value"
                        className="px-3 py-1.5 bg-gray-600 border border-gray-500 rounded-md text-white"
                      />
                    </div>
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