"use client";

interface MinimalHeaderProps {
  title: string;
  subtitle?: string;
}

export default function MinimalHeader({ title, subtitle }: MinimalHeaderProps) {
  return (
    <div className="border-b border-gray-700 bg-black">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="py-6">
          <h1 className="text-3xl font-bold text-white">{title}</h1>
          {subtitle && (
            <p className="mt-2 text-gray-400">{subtitle}</p>
          )}
        </div>
      </div>
    </div>
  );
}