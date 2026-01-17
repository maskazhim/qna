import React, { ButtonHTMLAttributes } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'danger' | 'secondary' | 'ghost';
  fullWidth?: boolean;
}

export const Button: React.FC<ButtonProps> = ({ 
  children, 
  variant = 'primary', 
  fullWidth = false, 
  className = '', 
  ...props 
}) => {
  const baseStyles = "transition-all duration-300 font-semibold py-3 px-6 rounded-xl flex items-center justify-center gap-2 backdrop-blur-md shadow-sm";
  
  const variants = {
    primary: "bg-blue-600 hover:bg-blue-700 text-white border border-blue-400/20 shadow-blue-500/30",
    danger: "bg-red-500 hover:bg-red-600 text-white border border-red-400/20 shadow-red-500/30",
    secondary: "bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 shadow-slate-200/50",
    ghost: "bg-transparent hover:bg-slate-200/50 text-slate-600 hover:text-slate-900"
  };

  const disabledStyles = "opacity-50 cursor-not-allowed grayscale";
  const widthClass = fullWidth ? "w-full" : "";

  return (
    <button 
      className={`
        ${baseStyles} 
        ${variants[variant]} 
        ${widthClass} 
        ${props.disabled ? disabledStyles : 'hover:scale-[1.02] active:scale-95'}
        ${className}
      `}
      {...props}
    >
      {children}
    </button>
  );
};