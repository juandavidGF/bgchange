import { Suspense } from 'react';
import ClientPage from '../[slug]/ClientPage';
import { getConfigurations } from '@/common/configuration';

export default async function TestModelViewerPage() {
  const configurations = await getConfigurations();

  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ClientPage slug="test" configurations={configurations} />
    </Suspense>
  );
}