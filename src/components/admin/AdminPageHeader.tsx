'use client';

import Image from 'next/image';

interface AdminPageHeaderProps {
  title: string;
  subtitle?: string;
  imageUrl: string;
}

export function AdminPageHeader({ title, subtitle, imageUrl }: AdminPageHeaderProps) {
  return (
    <div className="relative rounded-xl overflow-hidden mb-6 h-28">
      <Image
        src={imageUrl}
        alt=""
        fill
        className="object-cover"
        sizes="(max-width: 768px) 100vw, 900px"
      />
      <div className="absolute inset-0 bg-gradient-to-r from-green-900/80 to-green-800/40" />
      <div className="relative z-10 h-full flex flex-col justify-end p-5">
        <h1 className="text-xl font-bold text-white">{title}</h1>
        {subtitle && (
          <p className="text-xs text-green-200 mt-0.5">{subtitle}</p>
        )}
      </div>
    </div>
  );
}
