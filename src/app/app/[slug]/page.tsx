import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import ClientPage from './ClientPage';
import { Slug } from '@/types';
import configurationObj from '@/common/configuration';

// ... (keep other imports)

async function getConfigurations() {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const response = await fetch(`${baseUrl}/api/create/get`, { next: { revalidate: 3600 } });
    if (!response.ok) throw new Error('Failed to fetch configurations');
    return response.json();
  } catch (error) {
    console.error('Error fetching configurations:', error);
    return null;
  }
}

export default async function Page({ params }: { params: { slug: Slug } }) {

  const configurations = [...configurationObj, ...(await getConfigurations())];

  console.log({configurations});

  if (!configurations) {
    return notFound();
  }

  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ClientPage slug={params.slug} configurations={configurations} />
    </Suspense>
  );
}