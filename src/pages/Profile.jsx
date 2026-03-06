import React, { useEffect } from 'react';
import { createPageUrl } from '@/utils';

export default function Profile() {
  useEffect(() => {
    window.location.replace(createPageUrl('Home'));
  }, []);

  return null;
}