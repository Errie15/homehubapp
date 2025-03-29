import { CSSProperties } from 'react';

interface AvatarProps {
  src?: string;
  alt?: string;
  name?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  status?: 'online' | 'offline' | 'away' | 'busy';
  className?: string;
  style?: CSSProperties;
}

export default function Avatar({ 
  src, 
  alt, 
  name, 
  size = 'md', 
  status, 
  className = '',
  style
}: AvatarProps) {
  const sizeClasses = {
    xs: 'w-6 h-6 text-xs',
    sm: 'w-8 h-8 text-sm',
    md: 'w-10 h-10 text-base',
    lg: 'w-12 h-12 text-lg',
    xl: 'w-16 h-16 text-xl',
  };
  
  const statusClasses = {
    online: 'bg-green-500',
    offline: 'bg-gray-400',
    away: 'bg-yellow-500',
    busy: 'bg-red-500'
  };
  
  // Få initialer från namn
  const getInitials = () => {
    if (!name) return '';
    
    const names = name.split(' ');
    if (names.length === 1) return names[0].charAt(0).toUpperCase();
    return (names[0].charAt(0) + names[names.length - 1].charAt(0)).toUpperCase();
  };
  
  // Få en pseudorandom bakgrundsfärg baserat på namnet
  const getBackgroundColor = () => {
    if (!name) return 'bg-gray-400';
    
    const colors = [
      'bg-blue-500', 'bg-green-500', 'bg-purple-500', 
      'bg-pink-500', 'bg-indigo-500', 'bg-red-500', 
      'bg-yellow-500', 'bg-teal-500'
    ];
    
    const hash = name.split('').reduce((acc, char) => {
      return acc + char.charCodeAt(0);
    }, 0);
    
    return colors[hash % colors.length];
  };

  return (
    <div 
      className={`relative inline-flex rounded-full ${sizeClasses[size]} ${className}`}
      style={style}
    >
      {src ? (
        <img 
          src={src} 
          alt={alt || name || 'Avatar'} 
          className="w-full h-full object-cover rounded-full"
        />
      ) : (
        <div 
          className={`flex items-center justify-center w-full h-full rounded-full text-white ${getBackgroundColor()}`}
          aria-label={name || 'Avatar'}
        >
          {getInitials()}
        </div>
      )}
      
      {status && (
        <span 
          className={`absolute bottom-0 right-0 block h-3 w-3 rounded-full ring-2 ring-white dark:ring-gray-800 ${statusClasses[status]}`}
        />
      )}
    </div>
  );
} 