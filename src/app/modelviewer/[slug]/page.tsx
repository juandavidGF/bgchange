import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import ClientPage from './ClientPage';
import { getConfigurations } from '@/common/configuration';

export default async function Page({ params }: { params: { slug: string } }) {
  const configurations = await getConfigurations();

  if (!configurations || configurations.length === 0) {
    return notFound();
  }

  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ClientPage slug={params.slug} configurations={configurations} />
    </Suspense>
  );
}