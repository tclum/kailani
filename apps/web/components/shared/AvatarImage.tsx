'use client';
import { useState } from 'react';
import Image from 'next/image';

interface AvatarImageProps {
  src?: string | null;
  alt: string;
  initials?: string;
  size?: number;
  className?: string;
  fill?: boolean;
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

export function AvatarImage({ src, alt, initials, size = 40, className = '', fill = false }: AvatarImageProps) {
  const [errored, setErrored] = useState(false);
  const displayInitials = initials ?? getInitials(alt || '?');

  if (!src || errored) {
    return (
      <div
        className={`flex items-center justify-center font-bold text-white select-none ${className}`}
        style={{ background: 'linear-gradient(135deg,#ec4899,#be185d)', ...(fill ? {} : { width: size, height: size }) }}
      >
        {displayInitials}
      </div>
    );
  }

  if (fill) {
    return (
      <Image
        src={src}
        alt={alt}
        fill
        className={`object-cover ${className}`}
        onError={() => setErrored(true)}
      />
    );
  }

  return (
    <Image
      src={src}
      alt={alt}
      width={size}
      height={size}
      className={`object-cover ${className}`}
      onError={() => setErrored(true)}
    />
  );
}
