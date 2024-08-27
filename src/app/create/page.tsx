"use client";

import { useState } from 'react';
import { InputItem, OutputItem, Configuration } from "@/types";
import { PlusCircle, X, ChevronDown } from 'lucide-react';

export default function CreateAppForm() {
  const [appName, setAppName] = useState('');
  const [appType, setAppType] = useState<'gradio' | 'replicate'>('gradio');
  const [inputs, setInputs] = useState<InputItem[]>([]);
  const [outputs, setOutputs] = useState<OutputItem[]>([]);
  const [path, setPath] = useState('/predict');
  const [client, setClient] = useState('');
  const [model, setModel] = useState('');
  const [version, setVersion] = useState<string | null>(null);
  const [rawData, setRawData] = useState('');

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
      const response = await fetch('/api/create-app', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ newApp }),
      });

      if (response.ok) {
        alert('App created successfully!');
        // Reset form or redirect
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
    // Add parsing logic here to extract model, version, and inputs
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-4xl mx-auto p-4 sm:p-6 space-y-4 sm:space-y-6 bg-gray-800 rounded-lg shadow-lg mt-8 sm:mt-16">
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
          <div className="relative">
            <select
              value={appType}
              onChange={(e) => setAppType(e.target.value as 'gradio' | 'replicate')}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none"
            >
              <option value="gradio">Gradio</option>
              <option value="replicate">Replicate</option>
            </select>
            <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" size={20} />
          </div>
        </div>
      </div>

      {appType === 'gradio' && (
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
      )}

      {appType === 'replicate' && (
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
              <div className="col-span-2 flex space-x-2">
                <select
                  value={input.type}
                  onChange={(e) => updateInput(index, 'type', e.target.value as InputItem['type'])}
                  className="w-1/3 px-3 py-1.5 bg-gray-600 border border-gray-500 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="text">Text</option>
                  <option value="image">Image</option>
                  <option value="prompt">Prompt</option>
                  <option value="checkbox">Checkbox</option>
                  <option value="number">Number</option>
                </select>
                <input
                  type="text"
                  value={input.key}
                  onChange={(e) => updateInput(index, 'key', e.target.value)}
                  placeholder="Key"
                  className="w-2/3 px-3 py-1.5 bg-gray-600 border border-gray-500 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <input
                type="text"
                value={input.placeholder || ''}
                onChange={(e) => updateInput(index, 'placeholder', e.target.value)}
                placeholder="Placeholder"
                className="px-3 py-1.5 bg-gray-600 border border-gray-500 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="text"
                value={input.gradioName || ''}
                onChange={(e) => updateInput(index, 'gradioName', e.target.value)}
                placeholder="Gradio Name"
                className="px-3 py-1.5 bg-gray-600 border border-gray-500 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="text"
                value={input.label || ''}
                onChange={(e) => updateInput(index, 'label', e.target.value)}
                placeholder="Label"
                className="px-3 py-1.5 bg-gray-600 border border-gray-500 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="text"
                value={input.description || ''}
                onChange={(e) => updateInput(index, 'description', e.target.value)}
                placeholder="Description"
                className="px-3 py-1.5 bg-gray-600 border border-gray-500 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="text"
                value={input.value !== undefined ? String(input.value) : ''}
                onChange={(e) => updateInput(index, 'value', e.target.value)}
                placeholder="Default Value"
                className="px-3 py-1.5 bg-gray-600 border border-gray-500 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="text"
                value={input.component || ''}
                onChange={(e) => updateInput(index, 'component', e.target.value)}
                placeholder="Component"
                className="px-3 py-1.5 bg-gray-600 border border-gray-500 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                  className="p-2 bg-red-500 text-white rounded-md hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-gray-800"
                >
                  <X size={20} />
                </button>
              </div>
            </div>
          </div>
        ))}
        <button 
          type="button" 
          onClick={addInput} 
          className="w-full mt-2 px-4 py-2 bg-gray-700 text-white rounded-md hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-800 flex items-center justify-center"
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
                className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="text">Text</option>
                <option value="image">Image</option>
              </select>
              <input
                type="text"
                value={output.key}
                onChange={(e) => updateOutput(index, 'key', e.target.value)}
                placeholder="Key"
                className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="text"
                value={output.placeholder || ''}
                onChange={(e) => updateOutput(index, 'placeholder', e.target.value)}
                placeholder="Placeholder"
                className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                  className="p-2 bg-red-500 text-white rounded-md hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-gray-800"
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
          className="w-full mt-2 px-4 py-2 bg-gray-700 text-white rounded-md hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-800 flex items-center justify-center"
        >
          <PlusCircle size={20} className="mr-2" />
          Add Output
        </button>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-1">Raw Data:</label>
        <textarea
          value={rawData}
          onChange={handleRawDataChange}
          className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          rows={4}
          placeholder='Paste raw data here...'
        />
      </div>

      <button 
        type="submit" 
        className="w-full px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 focus:ring-offset-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
        disabled={!isFormValid()}
      >
        Create App
      </button>
    </form>
  );
}