import React from 'react';
import { motion } from 'framer-motion';
import { Upload, X, FileImage } from 'lucide-react';

// A chunky, tactile-looking button
export const RetroButton: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' | 'danger' }> = ({ 
  children, 
  variant = 'primary', 
  className = '', 
  ...props 
}) => {
  const baseStyles = "relative font-mono font-bold uppercase tracking-wider transition-transform active:translate-y-1 active:shadow-none border-b-4 border-r-4 rounded-sm px-6 py-3 text-sm flex items-center justify-center";
  
  const variants = {
    primary: "bg-amber-600 border-amber-800 text-stone-900 hover:bg-amber-500 shadow-[4px_4px_0px_rgba(0,0,0,0.5)]",
    secondary: "bg-stone-700 border-stone-900 text-stone-300 hover:bg-stone-600 shadow-[4px_4px_0px_rgba(0,0,0,0.5)]",
    danger: "bg-red-700 border-red-900 text-stone-100 hover:bg-red-600 shadow-[4px_4px_0px_rgba(0,0,0,0.5)]",
  };

  return (
    <button className={`${baseStyles} ${variants[variant]} ${className}`} {...props}>
      {children}
    </button>
  );
};

// A data display panel
export const DataPanel: React.FC<{ 
  title: string; 
  children: React.ReactNode; 
  className?: string;
  noPadding?: boolean;
}> = ({ title, children, className = '', noPadding = false }) => {
  return (
    <div className={`bg-stone-900 border-2 border-stone-700 rounded-sm relative overflow-hidden flex flex-col ${noPadding ? 'p-0' : 'p-4'} ${className}`}>
        {/* Header Label - positioned absolute to overlay content if noPadding is true */}
        <div className="absolute top-0 left-0 bg-stone-700 px-3 py-1 text-[10px] font-bold text-stone-300 uppercase tracking-widest border-b border-r border-stone-600 z-10 pointer-events-none">
            {title}
        </div>
        
        {/* Content Container */}
        <div className={`relative ${noPadding ? 'w-full h-full flex-1' : 'mt-4'}`}>
            {children}
        </div>

        {/* Decorative corner */}
        <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-amber-500/50 pointer-events-none z-10"></div>
    </div>
  );
};

// Text Input Field
export const RetroInput: React.FC<React.InputHTMLAttributes<HTMLInputElement>> = (props) => {
    return (
        <input 
            {...props}
            className="w-full bg-black/40 border-b-2 border-stone-600 text-amber-500 font-mono p-3 focus:outline-none focus:border-amber-500 focus:bg-black/60 transition-colors placeholder-stone-600"
        />
    )
}

// File Upload Component
export const RetroFileUpload: React.FC<{ 
  onFileSelect: (file: File) => void;
  className?: string;
}> = ({ onFileSelect, className = '' }) => {
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onFileSelect(e.target.files[0]);
    }
  };

  return (
    <div className={`relative group ${className}`}>
      <input 
        type="file" 
        ref={fileInputRef}
        onChange={handleChange}
        accept="image/*"
        className="hidden"
      />
      <button 
        onClick={() => fileInputRef.current?.click()}
        className="w-full border-2 border-dashed border-stone-600 bg-stone-900/50 p-4 flex flex-col items-center justify-center gap-2 text-stone-500 hover:text-amber-500 hover:border-amber-500 hover:bg-stone-800 transition-all cursor-pointer group-active:translate-y-0.5"
      >
        <Upload size={20} className="mb-1" />
        <span className="text-xs uppercase tracking-widest font-bold">Insert Visual Data [IMG]</span>
        <span className="text-[10px] opacity-50">SUPPORTS .JPG .PNG .WEBP</span>
      </button>
    </div>
  );
};

// Image Preview Component
export const ImagePreview: React.FC<{ 
  src: string; 
  onClear: () => void;
}> = ({ src, onClear }) => {
  return (
    <div className="relative border border-stone-600 bg-black p-2 flex items-center gap-3 animate-fadeIn">
      <div className="w-12 h-12 bg-stone-800 overflow-hidden border border-stone-700 relative shrink-0">
        <img src={src} alt="Input" className="w-full h-full object-cover opacity-80" />
        <div className="absolute inset-0 bg-amber-500/10 mix-blend-overlay"></div>
      </div>
      
      <div className="flex-1 min-w-0">
        <div className="text-[10px] text-amber-500 font-bold uppercase tracking-wider flex items-center gap-1">
          <FileImage size={10} /> Visual Data Loaded
        </div>
        <div className="text-[10px] text-stone-500 truncate">READY FOR ANALYSIS</div>
      </div>

      <button 
        onClick={onClear}
        className="p-2 hover:text-red-500 text-stone-500 transition-colors border-l border-stone-800"
        title="Eject Image"
      >
        <X size={16} />
      </button>
    </div>
  );
};

// Typing effect text
export const TypewriterText: React.FC<{ text: string }> = ({ text }) => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="whitespace-pre-wrap font-mono text-stone-300"
    >
      {text}
    </motion.div>
  );
};