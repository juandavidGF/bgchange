'use client';

import { useEffect, useState } from 'react';
import { Configurations } from '@/types'; // Adjust the import path as necessary
import {getConfigurations} from '@/common/configuration';
import { useRouter } from 'next/navigation';

const AppList = () => {
  const router = useRouter();
  const [apps, setApps] = useState<Configurations>([]);

  useEffect(() => {
    const fetchApps = async () => {
      try {
        // Combine fetched apps with configurationObj
        setApps(await getConfigurations());
      } catch (error) {
        console.error('Error fetching apps:', error);
      }
    };

    fetchApps();
  }, []);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6 bg-gray-900">
      {apps.map((app) => (
        <div 
          key={app.name} 
          className="bg-gray-800 shadow-lg rounded-lg p-6 hover:bg-gray-700 transition-colors cursor-pointer"
          onClick={() => router.push(`/app/${app.name}`)}
        >
          <h3 className="text-xl font-bold mb-4 text-blue-400">{app.name}</h3>
          <div className="space-y-2">
            <InfoItem label="Type" value={app.type ?? 'N/A'} />
            <InfoItem label="Client" value={app.client ?? 'N/A'} />
            <InfoItem label="Path" value={app.path ?? 'N/A'} />
            <InfoItem label="Endpoint" value={app.endpoint ?? 'N/A'} />
            <InfoItem label="Model" value={app.model ?? 'N/A'} />
            <InfoItem label="Version" value={app.version ?? 'N/A'} />
            <InfoItem label="Inputs" value={app.inputs.map(input => input.key).join(', ')} />
            <InfoItem label="Outputs" value={app.outputs ? app.outputs.map(output => output.key).join(', ') : 'N/A'} />
          </div>
        </div>
      ))}
    </div>
  );
};

const InfoItem = ({ label, value }: { label: string; value: string }) => (
  <p className="text-sm text-gray-300">
    <span className="font-semibold text-gray-100">{label}:</span> {value}
  </p>
);

export default AppList;