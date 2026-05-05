/**
 * ProviderIcon — single source of truth for cloud provider brand icons.
 *
 * Uses official SVG paths from simple-icons v9 (https://simpleicons.org/).
 * All consumers import this component; no emoji or duplicated icon maps.
 */

import React from 'react';
import {
  siAmazonaws,
  siAmazons3,
  siMicrosoftazure,
  siGooglecloud,
  siCloudflare,
  siOracle,
  siDigitalocean,
  siBackblaze,
  siMinio,
  siVultr,
} from 'simple-icons';
import { Cloud } from 'lucide-react';

// ─── Provider metadata ─────────────────────────────────────────────────────

/** Maps backend provider_type strings → simple-icon + display label */
const PROVIDER_META: Record<
  string,
  { icon: { path: string; hex: string }; label: string }
> = {
  aws:          { icon: siAmazonaws,      label: 'Amazon S3' },
  azure:        { icon: siMicrosoftazure, label: 'Azure Blob Storage' },
  gcp:          { icon: siGooglecloud,    label: 'Google Cloud Storage' },
  cloudflare:   { icon: siCloudflare,     label: 'Cloudflare R2' },
  oracle:       { icon: siOracle,         label: 'Oracle Cloud' },
  digitalocean: { icon: siDigitalocean,   label: 'DigitalOcean Spaces' },
  backblaze:    { icon: siBackblaze,      label: 'Backblaze B2' },
  minio:        { icon: siMinio,          label: 'MinIO' },
  vultr:        { icon: siVultr,          label: 'Vultr Object Storage' },
  // S3-compatible catch-alls
  others:       { icon: siAmazons3,       label: 'S3-Compatible Storage' },
  s3:           { icon: siAmazons3,       label: 'S3-Compatible Storage' },
};

// ─── Types ─────────────────────────────────────────────────────────────────

export type ProviderIconSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

interface ProviderIconProps {
  /** Value of provider.provider_type from the backend */
  type: string;
  size?: ProviderIconSize;
  /** Override the brand colour (e.g. pass 'currentColor' for monochrome) */
  color?: string;
  className?: string;
}

const SIZE_PX: Record<ProviderIconSize, number> = {
  xs: 12,
  sm: 16,
  md: 20,
  lg: 28,
  xl: 40,
};

// ─── Component ─────────────────────────────────────────────────────────────

export const ProviderIcon: React.FC<ProviderIconProps> = ({
  type,
  size = 'md',
  color,
  className = '',
}) => {
  const key = type?.toLowerCase().trim();
  const meta = PROVIDER_META[key];
  const px = SIZE_PX[size];

  if (!meta) {
    // Fallback: generic cloud icon from lucide
    return (
      <Cloud
        style={{ width: px, height: px }}
        className={`text-gray-400 flex-shrink-0 ${className}`}
      />
    );
  }

  const fill = color ?? `#${meta.icon.hex}`;

  return (
    <svg
      role="img"
      viewBox="0 0 24 24"
      width={px}
      height={px}
      fill={fill}
      aria-label={meta.label}
      className={`flex-shrink-0 ${className}`}
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d={meta.icon.path} />
    </svg>
  );
};

/**
 * Get the human-readable display label for a provider type.
 * e.g. 'cloudflare' → 'Cloudflare R2'
 */
export const getProviderLabel = (type: string): string => {
  const key = type?.toLowerCase().trim();
  return PROVIDER_META[key]?.label ?? type ?? 'Unknown';
};

export default ProviderIcon;
