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
  red: 'bg-red-100 text-red-700 border-red-200 dark:bg-red-950/60 dark:text-red-300',
  orange: 'bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-950/60 dark:text-orange-300',
  yellow: 'bg-yellow-100 text-yellow-700 border-yellow-200 dark:bg-yellow-950/60 dark:text-yellow-300',
  green: 'bg-green-100 text-green-700 border-green-200 dark:bg-green-950/60 dark:text-green-300',
  blue: 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-950/60 dark:text-blue-300',
  purple: 'bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-950/60 dark:text-purple-300',
  pink: 'bg-pink-100 text-pink-700 border-pink-200 dark:bg-pink-950/60 dark:text-pink-300',
  teal: 'bg-teal-100 text-teal-700 border-teal-200 dark:bg-teal-950/60 dark:text-teal-300',
  gray: 'bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-800 dark:text-gray-300',
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
  red: 'bg-red-100 text-red-700 border-red-200 dark:bg-red-950/60 dark:text-red-300',
  orange: 'bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-950/60 dark:text-orange-300',
  yellow: 'bg-yellow-100 text-yellow-700 border-yellow-200 dark:bg-yellow-950/60 dark:text-yellow-300',
  green: 'bg-green-100 text-green-700 border-green-200 dark:bg-green-950/60 dark:text-green-300',
  blue: 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-950/60 dark:text-blue-300',
  purple: 'bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-950/60 dark:text-purple-300',
  pink: 'bg-pink-100 text-pink-700 border-pink-200 dark:bg-pink-950/60 dark:text-pink-300',
  indigo: 'bg-indigo-100 text-indigo-700 border-indigo-200 dark:bg-indigo-950/60 dark:text-indigo-300',
  teal: 'bg-teal-100 text-teal-700 border-teal-200 dark:bg-teal-950/60 dark:text-teal-300',
  cyan: 'bg-cyan-100 text-cyan-700 border-cyan-200 dark:bg-cyan-950/60 dark:text-cyan-300',
  gray: 'bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-800 dark:text-gray-300',
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