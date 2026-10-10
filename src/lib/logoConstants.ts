import React from 'react';
import logo from '../assets/images/logo.jpg';
import { EMBEDDED_LOGO_PNG, EMBEDDED_LOGO_JPG } from './logoData';

export const APP_LOGO_SRC = logo;
export const APP_LOGO_PUBLIC_PNG = '/logo.png';
export const APP_LOGO_PUBLIC_JPG = '/logo.jpg';
export const APP_LOGO_BASE64 = EMBEDDED_LOGO_PNG;
export const APP_LOGO_BASE64_JPG = EMBEDDED_LOGO_JPG;

/**
 * Handle image load error gracefully by falling back to guaranteed embedded base64 data URI.
 * This guarantees that the logo NEVER disappears under any network or offline conditions.
 */
export function handleLogoError(e: React.SyntheticEvent<HTMLImageElement, Event>) {
  const target = e.currentTarget;
  if (target.src !== EMBEDDED_LOGO_PNG) {
    target.src = EMBEDDED_LOGO_PNG;
  }
}
