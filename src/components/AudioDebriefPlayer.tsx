import React, { useState, useEffect, useRef } from 'react';

interface AudioDebriefPlayerProps {
  summaryText: string;
  videoTitle: string;
}

export const AudioDebriefPlayer: React.FC<AudioDebriefPlayerProps> = ({ summaryText, videoTitle }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState<number>(1.25);
  const [currentSentenceIndex, setCurrentSentenceIndex] = useState(0);

  const sentences = React.useMemo(() => {
    return summaryText
      .split(/(?<=[.?!])\s+/)
      .map((s) => s.trim())
      .filter((s) => s.length > 5);
  }, [summaryText]);

  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  useEffect(() => {
    return () => {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const playSentence = (index: number) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;

    window.speechSynthesis.cancel();

    if (index >= sentences.length) {
      setIsPlaying(false);
      setCurrentSentenceIndex(0);
      return;
    }

    const textToSpeak = sentences[index];
    const utterance = new SpeechSynthesisUtterance(textToSpeak);
    utterance.rate = speed;
    utterance.pitch = 1.0;

    utterance.onend = () => {
      if (index + 1 < sentences.length) {
        setCurrentSentenceIndex(index + 1);
        playSentence(index + 1);
      } else {
        setIsPlaying(false);
        setCurrentSentenceIndex(0);
      }
    };

    utterance.onerror = () => {
      setIsPlaying(false);
    };

    utteranceRef.current = utterance;
    window.speechSynthesis.speak(utterance);
    setCurrentSentenceIndex(index);
    setIsPlaying(true);
  };

  const togglePlay = () => {
    if (isPlaying) {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
      setIsPlaying(false);
    } else {
      playSentence(currentSentenceIndex);
    }
  };

  const handleSpeedChange = (newSpeed: number) => {
    setSpeed(newSpeed);
    if (isPlaying) {
      playSentence(currentSentenceIndex);
    }
  };

  const handleReset = () => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setIsPlaying(false);
    setCurrentSentenceIndex(0);
  };

  const progressPercent = sentences.length > 0 ? ((currentSentenceIndex + 1) / sentences.length) * 100 : 0;

  return (
    <div className="rounded-3xl border border-[#E8E8E6] bg-white p-6 sm:p-7 shadow-[0_2px_8px_rgba(0,0,0,0.02)]">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#E8E8E6]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-[#111111] text-white flex items-center justify-center shrink-0 shadow-sm">
            <span className="material-symbols-outlined text-[20px]">graphic_eq</span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-[15px] font-semibold text-[#111111] tracking-tight">Audio Executive Debrief</h4>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#F4F4F2] text-[#575754] font-mono font-medium">
                High-Speed Audio
              </span>
            </div>
            <p className="text-[13px] text-[#575754]">{videoTitle}</p>
          </div>
        </div>

        {/* Speed Controls */}
        <div className="flex items-center gap-1.5 self-start sm:self-auto text-xs">
          <span className="text-[#8C8C89] text-[12px] font-mono mr-1">Speed:</span>
          {[1, 1.25, 1.5, 2].map((s) => (
            <button
              key={`speed-${s}`}
              type="button"
              onClick={() => handleSpeedChange(s)}
              className={`px-2.5 py-1 rounded-full font-mono text-[11px] transition ${
                speed === s
                  ? 'bg-[#111111] text-white font-semibold'
                  : 'bg-[#F4F4F2] text-[#575754] hover:text-[#111111]'
              }`}
            >
              {s}x
            </button>
          ))}
        </div>
      </div>

      {/* Live Sentence Display */}
      <div className="my-4 p-4 rounded-2xl bg-[#F9F9F8] border border-[#E8E8E6] min-h-[52px] flex items-center">
        <p className="text-[14px] text-[#111111] leading-relaxed font-normal">
          {sentences[currentSentenceIndex] || 'Ready to play executive audio brief.'}
        </p>
      </div>

      {/* Progress Bar & Controls */}
      <div className="space-y-3">
        <div className="w-full bg-[#E8E8E6] h-1.5 rounded-full overflow-hidden">
          <div
            className="bg-[#111111] h-full rounded-full transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={togglePlay}
              className="flex items-center gap-1.5 px-5 py-2.5 rounded-full bg-[#111111] hover:bg-neutral-800 text-white font-medium text-[13px] shadow-sm transition"
            >
              <span className="material-symbols-outlined text-[17px]">
                {isPlaying ? 'pause' : 'play_arrow'}
              </span>
              <span>{isPlaying ? 'Pause' : 'Play Audio Brief'}</span>
            </button>

            <button
              type="button"
              onClick={handleReset}
              className="p-2 rounded-full bg-[#F4F4F2] hover:bg-[#E8E8E6] text-[#575754] transition"
              title="Restart"
            >
              <span className="material-symbols-outlined text-[17px]">replay</span>
            </button>
          </div>

          <span className="text-[12px] font-mono text-[#8C8C89]">
            Sentence {currentSentenceIndex + 1} of {sentences.length}
          </span>
        </div>
      </div>
    </div>
  );
};
