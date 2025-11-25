import React, { useEffect, useRef, useState } from 'react';

interface ProcessingUnitProps {
  streamLog?: string;
}

export const BootSequence: React.FC<ProcessingUnitProps> = ({ streamLog = "" }) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [coords, setCoords] = useState({ x: 0, y: 0 });

  // Auto-scroll to bottom of log
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [streamLog]);

  // Random coordinate effect
  useEffect(() => {
    const interval = setInterval(() => {
      setCoords({
        x: Math.floor(Math.random() * 2000),
        y: Math.floor(Math.random() * 2000)
      });
    }, 200);
    return () => clearInterval(interval);
  }, []);

  // Extract thinking part vs JSON part for display
  const thinkingMatch = streamLog.match(/<thinking>([\s\S]*?)(?:<\/thinking>|$)/);
  const thinkingContent = thinkingMatch ? thinkingMatch[1] : streamLog;
  
  const hasJsonStart = streamLog.includes('<json>');
  const isComplete = streamLog.includes('</json>');

  return (
    <div className="w-full h-full bg-[#0c0a09] relative flex flex-col p-6 overflow-hidden font-mono text-xs md:text-sm">
      
      {/* Background Grid */}
      <div 
        className="absolute inset-0 pointer-events-none opacity-10 z-0"
        style={{
            backgroundImage: `linear-gradient(#f59e0b 1px, transparent 1px), linear-gradient(90deg, #f59e0b 1px, transparent 1px)`,
            backgroundSize: '40px 40px'
        }}
      ></div>

      {/* Header */}
      <div className="relative z-10 flex justify-between items-center border-b border-amber-900/50 pb-4 mb-4 shrink-0">
        <div>
          <div className="text-amber-500 font-bold text-lg tracking-wider">> NEURAL_PROCESSING_UNIT</div>
          <div className="text-stone-500 text-[10px] tracking-[0.2em] uppercase">
            {hasJsonStart ? "COMPILING_GEOMETRIC_DATA_STRUCTURE..." : "ANALYZING_INPUT_VECTORS..."}
          </div>
        </div>
        <div className="flex gap-4 text-[10px] font-bold text-amber-500/80">
            <div className="hidden md:block">CPU: {isComplete ? 'IDLE' : '98%'}</div>
            <div className="animate-pulse">{isComplete ? 'DONE' : 'BUSY'}</div>
        </div>
      </div>

      {/* Main Terminal Output */}
      <div className="relative z-10 flex-1 overflow-hidden border-l-2 border-amber-500/20 pl-4 bg-black/40">
        <div 
            ref={scrollRef}
            className="h-full overflow-y-auto pr-2 custom-scrollbar space-y-1"
        >
            {/* If we have specific thinking tags, render that content cleanly */}
            {thinkingContent.split('\n').map((line, i) => {
                if (!line.trim()) return <div key={i} className="h-2"></div>;
                return (
                    <div key={i} className="break-words text-stone-300">
                        <span className="text-stone-600 mr-2 select-none">{(i + 1).toString().padStart(3, '0')}</span>
                        {line}
                    </div>
                );
            })}
            
            {/* Show JSON construction indicator */}
            {hasJsonStart && (
                <div className="mt-4 pt-4 border-t border-dashed border-stone-800 text-cyan-500 animate-pulse">
                    > CONSTRUCTING_JSON_PAYLOAD...
                    <br/>
                    > VALIDATING_VERTICES...
                    <br/>
                    > RENDERING_EDGES...
                </div>
            )}
            
            {/* Cursor */}
            {!isComplete && (
                <div className="inline-block w-2 h-4 bg-amber-500 animate-pulse mt-1 align-middle"></div>
            )}
        </div>
      </div>

      {/* Footer Info */}
      <div className="relative z-10 pt-4 mt-2 border-t border-amber-900/30 flex justify-between text-[10px] text-stone-600 uppercase shrink-0">
        <div>Coordinates: X:{coords.x} Y:{coords.y}</div>
        <div>Buffer: {streamLog.length} bytes</div>
      </div>

    </div>
  );
};