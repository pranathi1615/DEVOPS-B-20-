import React from 'react';

const Badge = ({ children, variant = 'default', size = 'md' }) => {
  const variantMap = {
    default: 'bg-slate-100 text-slate-700 border-slate-200',
    primary: 'bg-blue-50 text-blue-700 border-blue-200',
    success: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    warning: 'bg-amber-50 text-amber-700 border-amber-200',
    danger: 'bg-rose-50 text-rose-700 border-rose-200',
    purple: 'bg-purple-50 text-purple-700 border-purple-200',
    navy: 'bg-navy-50 text-navy-800 border-navy-200'
  };

  const sizeMap = {
    sm: 'text-[11px] px-2 py-0.5',
    md: 'text-xs px-2.5 py-1',
    lg: 'text-sm px-3 py-1.5'
  };

  return (
    <span
      className={`inline-flex items-center font-medium rounded-full border ${
        variantMap[variant] || variantMap.default
      } ${sizeMap[size] || sizeMap.md}`}
    >
      {children}
    </span>
  );
};

export default Badge;
