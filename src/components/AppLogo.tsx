import React, { useState } from 'react';
import logo from '../assets/images/logo.jpg';
import { EMBEDDED_LOGO_PNG } from '../lib/logoData';

interface AppLogoProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  className?: string;
  alt?: string;
  useBase64Directly?: boolean;
}

export default function AppLogo({
  className = 'h-12 w-12 rounded-full object-cover',
  alt = 'পবিত্র ঈদে মিলাদুন্নবী (দঃ) উদযাপন পরিষদ লোগো',
  useBase64Directly = false,
  ...props
}: AppLogoProps) {
  const [srcState, setSrcState] = useState<string>(useBase64Directly ? EMBEDDED_LOGO_PNG : logo);

  const handleError = () => {
    if (srcState === logo) {
      setSrcState('/logo.png');
    } else if (srcState === '/logo.png') {
      setSrcState('/logo.jpg');
    } else if (srcState !== EMBEDDED_LOGO_PNG) {
      setSrcState(EMBEDDED_LOGO_PNG);
    }
  };

  return (
    <img
      src={srcState}
      onError={handleError}
      alt={alt}
      className={className}
      referrerPolicy="no-referrer"
      {...props}
    />
  );
}
