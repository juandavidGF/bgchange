import { Suspense } from 'react';
import ClientPage from './ClientPage';
import { getConfigurations } from '@/common/configuration';

export default async function ModelViewerPage() {
  const configurations = await getConfigurations();

  if (!configurations || configurations.length === 0) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl mb-4">No models available</h1>
          <p className="text-gray-400">Please check your configuration.</p>
        </div>
      </div>
    );
  }

  return (
    <Suspense fallback={
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-4"></div>
          <p>Loading models...</p>
        </div>
      </div>
    }>
      <ClientPage configurations={configurations} />
    </Suspense>
  );
}