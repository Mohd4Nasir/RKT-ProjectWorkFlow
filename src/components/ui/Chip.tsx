// components/ui/TagChip.tsx
import { Flag } from 'lucide-react';

export type TagVariant = 
  | 'red'
  | 'orange'
  | 'yellow'
  | 'green'
  | 'blue'
  | 'purple'
  | 'pink'
  | 'teal'
  | 'gray';

interface TagChipProps {
  label: string;
  variant?: TagVariant;
  size?: 'sm' | 'md';
  showFlag?: boolean;
  className?: string;
}

// Color variants
const variantStyles: Record<TagVariant, string> = {
  red: 'bg-red-100 text-danger border-red-200 dark:bg-red-950/60 dark:text-danger',
  orange: 'bg-orange-100 text-warning border-orange-200 dark:bg-orange-950/60 dark:text-warning',
  yellow: 'bg-yellow-100 text-warning border-yellow-200 dark:bg-yellow-950/60 dark:text-warning',
  green: 'bg-green-100 text-success border-green-200 dark:bg-green-950/60 dark:text-success',
  blue: 'bg-blue-100 text-info border-blue-200 dark:bg-blue-950/60 dark:text-info',
  purple: 'bg-purple-100 text-primary border-purple-200 dark:bg-purple-950/60 dark:text-primary',
  pink: 'bg-pink-100 text-primary border-pink-200 dark:bg-pink-950/60 dark:text-primary',
  teal: 'bg-teal-100 text-accent border-teal-200 dark:bg-teal-950/60 dark:text-accent',
  gray: 'bg-gray-100 text-heading border-gray-200 dark:bg-gray-800 dark:text-muted-foreground',
};

const sizeStyles = {
  sm: 'px-2 py-0.5 text-xs gap-1.5',
  md: 'px-2.5 py-1 text-sm gap-2',
};

// Auto detect variant from label text
function getVariantFromLabel(label: string): TagVariant {
  const lowerLabel = label.toLowerCase();
  
  if (lowerLabel.includes('critical') || lowerLabel.includes('bug') || 
      lowerLabel.includes('issue') || lowerLabel.includes('error')) 
    return 'red';
  
  if (lowerLabel.includes('high') || lowerLabel.includes('urgent') || 
      lowerLabel.includes('important')) 
    return 'orange';
  
  if (lowerLabel.includes('medium') || lowerLabel.includes('normal')) 
    return 'yellow';
  
  if (lowerLabel.includes('low') || lowerLabel.includes('minor')) 
    return 'blue';
  
  if (lowerLabel.includes('done') || lowerLabel.includes('complete') || 
      lowerLabel.includes('success')) 
    return 'green';
  
  if (lowerLabel.includes('wip') || lowerLabel.includes('progress')) 
    return 'teal';
  
  if (lowerLabel.includes('design') || lowerLabel.includes('ui') || 
      lowerLabel.includes('ux')) 
    return 'purple';
  
  if (lowerLabel.includes('test') || lowerLabel.includes('qa')) 
    return 'pink';
  
  return 'gray';
}

export function TagChip({ 
  label, 
  variant, 
  size = 'sm', 
  showFlag = true,
  className = '' 
}: TagChipProps) {
  const finalVariant = variant || getVariantFromLabel(label);
  
  return (
    <span
      className={`
        inline-flex items-center rounded-full border font-medium
        ${variantStyles[finalVariant]}
        ${sizeStyles[size]}
        ${className}
      `}
    >
      {showFlag && <Flag className={size === 'sm' ? 'h-3 w-3' : 'h-3.5 w-3.5'} />}
      <span>{label}</span>
    </span>
  );
}

// Tag List Component for multiple tags
interface TagListProps {
  tags: string[];
  size?: 'sm' | 'md';
  showFlag?: boolean;
  maxTags?: number;
  className?: string;
}

export function TagList({ 
  tags, 
  size = 'sm', 
  showFlag = true, 
  maxTags,
  className = '' 
}: TagListProps) {
  const displayTags = maxTags ? tags.slice(0, maxTags) : tags;
  const remainingCount = maxTags && tags.length > maxTags ? tags.length - maxTags : 0;

  return (
    <div className={`flex flex-wrap gap-1.5 ${className}`}>
      {displayTags.map((tag, idx) => (
        <TagChip 
          key={`${tag}-${idx}`} 
          label={tag} 
          size={size} 
          showFlag={showFlag}
        />
      ))}
      {remainingCount > 0 && (
        <TagChip 
          label={`+${remainingCount}`} 
          size={size} 
          showFlag={false}
          variant="gray"
        />
      )}
    </div>
  );
}// components/ui/ColorfulChip.tsx
import { ReactNode } from 'react';

interface ColorfulChipProps {
  label: string;
  color?: string; // Direct color like 'red', 'blue', 'green', etc.
  bgColor?: string; // Custom background color
  textColor?: string; // Custom text color
  size?: 'sm' | 'md' | 'lg';
  icon?: ReactNode;
  className?: string;
}

const colorStyles: Record<string, string> = {
  red: 'bg-red-100 text-danger border-red-200 dark:bg-red-950/60 dark:text-danger',
  orange: 'bg-orange-100 text-warning border-orange-200 dark:bg-orange-950/60 dark:text-warning',
  yellow: 'bg-yellow-100 text-warning border-yellow-200 dark:bg-yellow-950/60 dark:text-warning',
  green: 'bg-green-100 text-success border-green-200 dark:bg-green-950/60 dark:text-success',
  blue: 'bg-blue-100 text-info border-blue-200 dark:bg-blue-950/60 dark:text-info',
  purple: 'bg-purple-100 text-primary border-purple-200 dark:bg-purple-950/60 dark:text-primary',
  pink: 'bg-pink-100 text-primary border-pink-200 dark:bg-pink-950/60 dark:text-primary',
  indigo: 'bg-indigo-100 text-primary border-indigo-200 dark:bg-indigo-950/60 dark:text-primary',
  teal: 'bg-teal-100 text-accent border-teal-200 dark:bg-teal-950/60 dark:text-accent',
  cyan: 'bg-cyan-100 text-accent border-cyan-200 dark:bg-cyan-950/60 dark:text-accent',
  gray: 'bg-gray-100 text-heading border-gray-200 dark:bg-gray-800 dark:text-muted-foreground',
};



export function ColorfulChip({ 
  label, 
  color = 'gray',
  bgColor,
  textColor,
  size = 'sm', 
  icon,
  className = '' 
}: ColorfulChipProps) {
  // Agar custom color diya hai toh use karo, warna predefined color
  const customStyle = bgColor || textColor 
    ? `bg-${bgColor} text-${textColor}`
    : colorStyles[color];

  return (
    <span
      className={`
        inline-flex items-center rounded-full border font-medium
        ${customStyle}
        ${sizeStyles[size]}
        ${className}
      `}
    >
      {icon && <span className="inline-flex">{icon}</span>}
      <span>{label}</span>
    </span>
  );
}

// Multiple chips ka group
interface ChipGroupProps {
  items: Array<{ label: string; color?: string }>;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function ChipGroup({ items, size = 'sm', className = '' }: ChipGroupProps) {
  return (
    <div className={`flex flex-wrap gap-1.5 ${className}`}>
      {items.map((item, idx) => (
        <ColorfulChip
          key={idx}
          label={item.label}
          color={item.color}
          size={size}
        />
      ))}
    </div>
  );
}   