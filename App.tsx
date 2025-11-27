import React, { useState } from 'react';
import { solveMathProblem } from './services/geminiService';
import { Visualizer3D } from './components/Visualizer3D';
import { RetroButton, DataPanel, RetroInput, TypewriterText, RetroFileUpload, ImagePreview } from './components/CassetteUI';
import { BootSequence } from './components/BootSequence';
import { AppStatus, MathSolution, SolveStep } from './types';
import { ChevronRight, ChevronLeft, RotateCcw, Cpu, Box, Play } from 'lucide-react';

const SAMPLE_PROBLEM = "Find the volume of a square pyramid with base side length 4 and height 6. Show the triangle used to find the slant height if needed.";

export default function App() {
  const [input, setInput] = useState(SAMPLE_PROBLEM);
  const [selectedImage, setSelectedImage] = useState<{ src: string, base64: string, mimeType: string } | null>(null);
  const [status, setStatus] = useState<AppStatus>(AppStatus.IDLE);
  const [solution, setSolution] = useState<MathSolution | null>(null);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [thinkingLog, setThinkingLog] = useState<string>("");

  const handleFileSelect = (file: File) => {
    const reader = new FileReader();
    reader.onloadend = () => {
        const result = reader.result as string;
        // Extract base64 and mimeType
        const matches = result.match(/^data:(.+);base64,(.+)$/);
        if (matches) {
            setSelectedImage({
                src: result,
                mimeType: matches[1],
                base64: matches[2]
            });
            // Clear text input if it matches sample to encourage describing the image
            if (input === SAMPLE_PROBLEM) {
                setInput(""); 
            }
        }
    };
    reader.readAsDataURL(file);
  };

  const handleClearImage = () => {
    setSelectedImage(null);
  };

  const handleSolve = async () => {
    if (!input.trim() && !selectedImage) return;
    
    setStatus(AppStatus.THINKING);
    setError(null);
    setThinkingLog(""); // Reset log
    setSolution(null);
    
    try {
      // Pass image data if available
      const result = await solveMathProblem(
          input, 
          selectedImage?.base64, 
          selectedImage?.mimeType,
          (log) => setThinkingLog(log) // Update log state as chunks arrive
      );
      setSolution(result);
      setCurrentStepIndex(0);
      setStatus(AppStatus.SOLVED);
    } catch (err) {
      console.error(err);
      setError("COMPUTATION FAILURE. CHECK CONNECTION OR INPUT INTEGRITY.");
      setStatus(AppStatus.ERROR);
    }
  };

  // Safely access current step using optional chaining for the index access as well
  const currentStep: SolveStep | undefined = solution?.steps?.[currentStepIndex];

  return (
    <div className="min-h-screen bg-[#121212] p-4 md:p-8 font-mono text-stone-200 selection:bg-amber-500/30 selection:text-amber-100 flex flex-col items-center">
      
      {/* Header */}
      <header className="w-full max-w-7xl mb-8 flex justify-between items-end border-b-2 border-stone-800 pb-4">
        <div>
            <h1 className="text-4xl font-black text-amber-500 tracking-tighter uppercase flex items-center gap-3">
                <Box className="w-8 h-8" />
                Geo<span className="text-stone-600">Metric</span>_v2.5
            </h1>
            <p className="text-xs text-stone-500 mt-1 uppercase tracking-[0.2em]">Cassette Futurism Solver Unit</p>
        </div>
        <div className="text-right hidden md:block">
            <div className="text-xs text-stone-600">SYS.STATUS</div>
            <div className={`text-sm font-bold ${status === AppStatus.ERROR ? 'text-red-500' : 'text-green-500'}`}>
                {status === AppStatus.THINKING ? 'PROCESSING...' : 'ONLINE'}
            </div>
        </div>
      </header>

      <main className="w-full max-w-7xl grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: Input and Steps */}
        <section className="lg:col-span-4 flex flex-col gap-6 h-full">
            
            {/* Input Panel */}
            <DataPanel title="Input_Stream" className="bg-stone-900/50">
                <div className="space-y-4">
                    {/* Image Upload Area */}
                    {!selectedImage ? (
                        <RetroFileUpload onFileSelect={handleFileSelect} />
                    ) : (
                        <ImagePreview src={selectedImage.src} onClear={handleClearImage} />
                    )}

                    {/* Text Input */}
                    <div>
                        <div className="text-[10px] text-stone-500 mb-1 uppercase tracking-wider">Additional Context / Query</div>
                        <textarea
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            className="w-full h-24 bg-black border border-stone-700 p-3 text-amber-500 font-mono text-sm resize-none focus:outline-none focus:border-amber-500 placeholder-stone-700"
                            placeholder={selectedImage ? "DESCRIBE THE PROBLEM OR ASK A SPECIFIC QUESTION..." : "ENTER GEOMETRY PROBLEM SEQUENCE..."}
                        />
                    </div>

                    <RetroButton 
                        onClick={handleSolve} 
                        disabled={status === AppStatus.THINKING || (!input.trim() && !selectedImage)}
                        className="w-full flex justify-center items-center gap-2"
                    >
                        {status === AppStatus.THINKING ? <Cpu className="animate-spin" /> : <Play size={16} />}
                        {status === AppStatus.THINKING ? "COMPUTING..." : "EXECUTE"}
                    </RetroButton>
                </div>
            </DataPanel>

            {/* Error Display */}
            {status === AppStatus.ERROR && (
                <div className="bg-red-900/20 border border-red-500/50 p-4 text-red-400 text-xs font-bold uppercase">
                    Error: {error}
                </div>
            )}

            {/* Steps Navigation (Only if solved) */}
            {status === AppStatus.SOLVED && solution && (
                <DataPanel title="Computation_Log" className="flex-1 flex flex-col gap-4 min-h-[300px]">
                    <div className="flex justify-between items-center mb-2 border-b border-stone-800 pb-2">
                        <span className="text-xs text-stone-500">STEP {currentStepIndex + 1} / {solution.steps.length}</span>
                        <div className="flex gap-2">
                             <button 
                                onClick={() => setCurrentStepIndex(Math.max(0, currentStepIndex - 1))}
                                disabled={currentStepIndex === 0}
                                className="p-1 hover:text-amber-500 disabled:opacity-30"
                             >
                                <ChevronLeft />
                             </button>
                             <button 
                                onClick={() => setCurrentStepIndex(Math.min(solution.steps.length - 1, currentStepIndex + 1))}
                                disabled={currentStepIndex === solution.steps.length - 1}
                                className="p-1 hover:text-amber-500 disabled:opacity-30"
                             >
                                <ChevronRight />
                             </button>
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
                        {currentStep && (
                            <div className="space-y-4 animate-fadeIn">
                                <h3 className="text-lg font-bold text-amber-500 leading-tight">
                                    {currentStep.title}
                                </h3>
                                <div className="text-sm text-stone-300 leading-relaxed">
                                    <TypewriterText text={currentStep.description} />
                                </div>
                                {currentStep.mathExpression && (
                                    <div className="bg-black/40 border border-stone-700 p-3 text-center text-cyan-400 font-mono text-lg my-4">
                                        {currentStep.mathExpression}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {currentStepIndex === solution.steps.length - 1 && (
                         <div className="mt-4 pt-4 border-t border-stone-700">
                            <div className="text-xs text-stone-500 uppercase">Final Output</div>
                            <div className="text-xl font-bold text-green-400 mt-1">
                                {solution.finalAnswer}
                            </div>
                         </div>
                    )}
                </DataPanel>
            )}
        </section>

        {/* Right Column: 3D Visualization */}
        <section className="lg:col-span-8 flex flex-col h-[600px] lg:h-[750px]">
            <DataPanel title="Holographic_Display" className="h-full flex flex-col" noPadding>
                <div className="w-full h-full bg-black relative">
                    {status === AppStatus.THINKING ? (
                        <BootSequence streamLog={thinkingLog} />
                    ) : status === AppStatus.SOLVED && currentStep ? (
                        <Visualizer3D data={currentStep.visuals} />
                    ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center text-stone-600 bg-[#0c0a09]">
                                <div className="text-center opacity-50">
                                    <Box size={48} className="mx-auto mb-2 opacity-20" />
                                    <p className="text-xs tracking-widest">NO DATA DETECTED</p>
                                    <p className="text-[10px] mt-1">AWAITING INPUT SEQUENCE</p>
                                </div>
                        </div>
                    )}
                </div>
            </DataPanel>
        </section>

      </main>
      
      <footer className="w-full max-w-7xl mt-8 pt-4 border-t border-stone-800 flex justify-between text-[10px] text-stone-600 uppercase">
        <div>Proprietary Algorithm v1.0.4</div>
        <div>Memory: 64KB OK</div>
      </footer>
    </div>
  );
}