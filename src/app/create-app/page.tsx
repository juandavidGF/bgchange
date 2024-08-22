"use client";

import { useState } from 'react';
import { InputItem, OutputItem } from "@/types";

export default function CreateAppForm() {
  const [appName, setAppName] = useState('');
  const [appType, setAppType] = useState('gradio');
  const [inputs, setInputs] = useState<InputItem[]>([]);
  const [outputs, setOutputs] = useState<OutputItem[]>([]);

  const addInput = () => {
    setInputs([...inputs, { type: 'text', key: '', show: true }]);
  };

  const addOutput = () => {
    setOutputs([...outputs, { type: 'text', key: '', show: true }]);
  };

  const updateInput = (index: number, field: string, value: any) => {
    const newInputs = [...inputs];
    newInputs[index] = { ...newInputs[index], [field]: value };
    setInputs(newInputs);
  };

  const updateOutput = (index: number, field: string, value: any) => {
    const newOutputs = [...outputs];
    newOutputs[index] = { ...newOutputs[index], [field]: value };
    setOutputs(newOutputs);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newApp = {
      name: appName,
      type: appType,
      inputs,
      outputs,
    };

    try {
      const response = await fetch('/api/create-app', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newApp),
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

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl mx-auto p-6 space-y-6 bg-gray-800 rounded-lg shadow-lg mt-16">
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
          onChange={(e) => setAppType(e.target.value)}
          className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="gradio">Gradio</option>
          <option value="replicate">Replicate</option>
        </select>
      </div>

      <div>
        <h3 className="text-lg font-semibold text-gray-200 mb-2">Inputs:</h3>
        {inputs.map((input, index) => (
          <div key={index} className="flex space-x-2 mb-2">
            <select
              value={input.type}
              onChange={(e) => updateInput(index, 'type', e.target.value)}
              className="px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="text">Text</option>
              <option value="image">Image</option>
              <option value="prompt">Prompt</option>
            </select>
            <input
              type="text"
              value={input.key}
              onChange={(e) => updateInput(index, 'key', e.target.value)}
              placeholder="Key"
              className="flex-grow px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <label className="flex items-center space-x-2 text-gray-300">
              <input
                type="checkbox"
                checked={input.show}
                onChange={(e) => updateInput(index, 'show', e.target.checked)}
                className="form-checkbox h-5 w-5 text-blue-500"
              />
              <span>Show</span>
            </label>
          </div>
        ))}
        <button type="button" onClick={addInput} className="mt-2 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-800">
          Add Input
        </button>
      </div>

      <div>
        <h3 className="text-lg font-semibold text-gray-200 mb-2">Outputs:</h3>
        {outputs.map((output, index) => (
          <div key={index} className="flex space-x-2 mb-2">
            <select
              value={output.type}
              onChange={(e) => updateOutput(index, 'type', e.target.value)}
              className="px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="text">Text</option>
              <option value="image">Image</option>
            </select>
            <input
              type="text"
              value={output.key}
              onChange={(e) => updateOutput(index, 'key', e.target.value)}
              placeholder="Key"
              className="flex-grow px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <label className="flex items-center space-x-2 text-gray-300">
              <input
                type="checkbox"
                checked={output.show}
                onChange={(e) => updateOutput(index, 'show', e.target.checked)}
                className="form-checkbox h-5 w-5 text-blue-500"
              />
              <span>Show</span>
            </label>
          </div>
        ))}
        <button type="button" onClick={addOutput} className="mt-2 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-800">
          Add Output
        </button>
      </div>

      <button type="submit" className="w-full px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 focus:ring-offset-gray-800">
        Create App
      </button>
    </form>
  );
}