import { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  title?: string;
  icon?: ReactNode;
  footer?: ReactNode;
  className?: string;
  noPadding?: boolean;
}

export default function Card({ 
  children, 
  title, 
  icon, 
  footer, 
  className = '', 
  noPadding = false 
}: CardProps) {
  return (
    <div className={`bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden ${className}`}>
      {title && (
        <div className="flex items-center px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          {icon && <div className="mr-3">{icon}</div>}
          <h2 className="text-xl font-semibold">{title}</h2>
        </div>
      )}
      
      <div className={noPadding ? '' : 'p-6'}>
        {children}
      </div>
      
      {footer && (
        <div className="px-6 py-4 bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700">
          {footer}
        </div>
      )}
    </div>
  );
} 