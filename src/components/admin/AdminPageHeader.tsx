'use client';

import Image from 'next/image';

interface AdminPageHeaderProps {
  title: string;
  subtitle?: string;
  imageUrl: string;
}

export function AdminPageHeader({ title, subtitle, imageUrl }: AdminPageHeaderProps) {
  return (
    <div className="relative rounded-2xl overflow-hidden mb-6 h-36">
      <Image
        src={imageUrl}
        alt=""
        fill
        className="object-cover"
        sizes="(max-width: 768px) 100vw, 900px"
      />
      <div className="absolute inset-0 bg-gradient-to-r from-green-900/85 via-green-900/60 to-green-800/30" />
      {/* Orange accent bar at bottom */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-orange-500 via-orange-400 to-transparent" />
      <div className="relative z-10 h-full flex flex-col justify-end p-6">
        <h1 className="text-2xl font-bold text-white tracking-tight">{title}</h1>
        {subtitle && (
          <p className="text-sm text-green-200/90 mt-1 font-medium">{subtitle}</p>
        )}
      </div>
    </div>
  );
}
