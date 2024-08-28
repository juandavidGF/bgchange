import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import ClientPage from './ClientPage';
import { Slug } from '@/types';
import {getConfigurations} from '@/common/configuration';


export default async function Page({ params }: { params: { slug: Slug } }) {
  const configurations = await getConfigurations();

  if (!configurations) {
    return notFound();
  }

  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ClientPage slug={params.slug} configurations={configurations} />
    </Suspense>
  );
}