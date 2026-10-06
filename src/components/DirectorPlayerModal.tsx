import React, { useState, useEffect, useRef } from 'react';
import { DramaProject, DramaScene, DramaDialogue, DramaCharacter, DramaRoom } from '../types/drama';
import { playBrowserSpeechFallback, stopSpeechSynthesis } from '../utils/speechFallback';
import {
  Play,
  Pause,
  SkipForward,
  SkipBack,
  Volume2,
  VolumeX,
  Maximize,
  Minimize,
  X,
  Film,
  Camera,
  MapPin,
  Sparkles,
  Loader2,
  CheckCircle,
} from 'lucide-react';

interface DirectorPlayerModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: DramaProject;
  characters: DramaCharacter[];
  rooms: DramaRoom[];
}

export const DirectorPlayerModal: React.FC<DirectorPlayerModalProps> = ({
  isOpen,
  onClose,
  project,
  characters,
  rooms,
}) => {
  const [currentSceneIndex, setCurrentSceneIndex] = useState(0);
  const [currentDialogueIndex, setCurrentDialogueIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [playerAspectRatio, setPlayerAspectRatio] = useState<'16:9' | '9:16'>('16:9');
  const [isLoadingAudio, setIsLoadingAudio] = useState(false);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const currentScene: DramaScene | undefined = project.scenes[currentSceneIndex];
  const currentDialogue: DramaDialogue | undefined = currentScene?.dialogues?.[currentDialogueIndex];
  const assignedRoom = rooms.find((r) => r.name === currentScene?.roomOrLocation) || rooms[0];
  const speakingCharacter = characters.find(
    (c) => c.name.toLowerCase() === currentDialogue?.speaker.toLowerCase()
  );

  // Play audio for current dialogue when playing is active
  useEffect(() => {
    if (!isOpen || !isPlaying || !currentDialogue) return;

    let isMounted = true;
    const playCurrentVoice = async () => {
      setIsLoadingAudio(true);
      const voiceName = speakingCharacter?.recommendedVoice || 'Kore';

      try {
        const response = await fetch('/api/drama/generate-voice', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text: currentDialogue.text,
            voiceName,
            style: `${currentDialogue.emotion}, television drama character dialogue`,
          }),
        });

        const data = await response.json();

        if (data.fallbackSpeech || !data.audioUrl) {
          // Play browser speech synthesis fallback
          if (!isMuted && isMounted) {
            playBrowserSpeechFallback(
              currentDialogue.text,
              voiceName,
              () => {
                if (isMounted && isPlaying) {
                  setTimeout(() => advanceNext(), 600);
                }
              },
              () => {
                if (isMounted && isPlaying) {
                  setTimeout(() => advanceNext(), 3500);
                }
              }
            );
          } else {
            setTimeout(() => {
              if (isMounted && isPlaying) advanceNext();
            }, 3000);
          }
          return;
        }

        if (isMounted && audioRef.current && data.audioUrl) {
          audioRef.current.src = data.audioUrl;
          audioRef.current.muted = isMuted;
          await audioRef.current.play();
        }
      } catch (err) {
        console.warn('Playback audio fallback to browser speech:', err);
        if (!isMuted && isMounted) {
          playBrowserSpeechFallback(
            currentDialogue.text,
            voiceName,
            () => {
              if (isMounted && isPlaying) {
                setTimeout(() => advanceNext(), 600);
              }
            },
            () => {
              if (isMounted && isPlaying) {
                setTimeout(() => advanceNext(), 3500);
              }
            }
          );
        } else if (isMounted) {
          setTimeout(() => {
            if (isPlaying) advanceNext();
          }, 3500);
        }
      } finally {
        if (isMounted) setIsLoadingAudio(false);
      }
    };

    playCurrentVoice();

    return () => {
      isMounted = false;
      stopSpeechSynthesis();
    };
  }, [isOpen, isPlaying, currentSceneIndex, currentDialogueIndex]);

  const advanceNext = () => {
    if (!currentScene) return;

    if (currentDialogueIndex < currentScene.dialogues.length - 1) {
      setCurrentDialogueIndex((prev) => prev + 1);
    } else if (currentSceneIndex < project.scenes.length - 1) {
      setCurrentSceneIndex((prev) => prev + 1);
      setCurrentDialogueIndex(0);
    } else {
      setIsPlaying(false); // Finished entire serial
    }
  };

  const handleAudioEnded = () => {
    if (isPlaying) {
      setTimeout(() => {
        advanceNext();
      }, 800);
    }
  };

  const togglePlay = () => {
    if (isPlaying) {
      stopSpeechSynthesis();
    }
    setIsPlaying(!isPlaying);
  };

  const handlePrevScene = () => {
    if (currentSceneIndex > 0) {
      setCurrentSceneIndex((prev) => prev - 1);
      setCurrentDialogueIndex(0);
    }
  };

  const handleNextScene = () => {
    if (currentSceneIndex < project.scenes.length - 1) {
      setCurrentSceneIndex((prev) => prev + 1);
      setCurrentDialogueIndex(0);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-xl flex items-center justify-center p-2 sm:p-6 overflow-hidden">
      <div
        ref={containerRef}
        className="w-full max-w-5xl bg-neutral-950 rounded-2xl border border-neutral-800 shadow-2xl flex flex-col overflow-hidden max-h-[95vh]"
      >
        {/* Top Control Bar */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-neutral-800 bg-neutral-900/80">
          <div className="flex items-center gap-3">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse" />
            <div>
              <h2 className="text-sm font-bold text-white font-display">
                {project.title} · Scene {currentScene?.sceneNumber || 1}
              </h2>
              <span className="text-[11px] text-neutral-400 block">
                {currentScene?.roomOrLocation} · {currentScene?.mood}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Aspect Ratio Switcher */}
            <div className="flex items-center gap-1 bg-neutral-950 p-1 rounded-lg border border-neutral-800 text-[11px]">
              <button
                onClick={() => setPlayerAspectRatio('16:9')}
                className={`px-2 py-0.5 rounded font-medium ${
                  playerAspectRatio === '16:9' ? 'bg-rose-600 text-white' : 'text-neutral-400'
                }`}
              >
                16:9
              </button>
              <button
                onClick={() => setPlayerAspectRatio('9:16')}
                className={`px-2 py-0.5 rounded font-medium ${
                  playerAspectRatio === '9:16' ? 'bg-rose-600 text-white' : 'text-neutral-400'
                }`}
              >
                9:16
              </button>
            </div>

            <button
              onClick={() => {
                stopSpeechSynthesis();
                onClose();
              }}
              className="p-1.5 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Viewport Screen */}
        <div className="flex-1 bg-black flex items-center justify-center p-2 relative overflow-hidden">
          <div
            className={`relative rounded-xl overflow-hidden border border-neutral-800 bg-neutral-950 w-full transition-all duration-300 ${
              playerAspectRatio === '16:9' ? 'aspect-video max-h-[60vh]' : 'aspect-[9/16] max-h-[65vh] mx-auto'
            }`}
          >
            {/* Visual Canvas Backdrop */}
            {currentScene?.videoUrl ? (
              <video
                src={currentScene.videoUrl}
                autoPlay
                loop
                playsInline
                className="w-full h-full object-cover"
              />
            ) : assignedRoom?.customUploadedPhoto ? (
              <img
                src={assignedRoom.customUploadedPhoto}
                alt="Scene backdrop"
                className={`w-full h-full object-cover transition-transform duration-1000 ${
                  isPlaying ? 'scale-105' : 'scale-100'
                }`}
                referrerPolicy="no-referrer"
              />
            ) : (
              <div
                className={`w-full h-full bg-gradient-to-tr ${
                  assignedRoom?.backdropGradient || 'from-slate-950 to-black'
                } flex flex-col items-center justify-center p-6 text-center`}
              >
                <Film className="w-12 h-12 text-neutral-600 mb-2 animate-pulse" />
                <span className="text-base font-semibold text-neutral-200">
                  {currentScene?.roomOrLocation}
                </span>
                <span className="text-xs text-neutral-400 max-w-sm mt-1">
                  {currentScene?.cameraDirection}
                </span>
              </div>
            )}

            {/* Cinematic Scrim */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent pointer-events-none" />

            {/* Speaking Character Inset (Top Left) */}
            {speakingCharacter && (
              <div className="absolute top-4 left-4 flex items-center gap-2.5 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/10 text-white">
                <div className="w-8 h-8 rounded-lg overflow-hidden bg-neutral-800 border border-neutral-700 shrink-0">
                  {speakingCharacter.customUploadedPhoto ? (
                    <img
                      src={speakingCharacter.customUploadedPhoto}
                      alt={speakingCharacter.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div
                      className={`w-full h-full bg-gradient-to-br ${speakingCharacter.avatarPlaceholderColor}`}
                    />
                  )}
                </div>
                <div>
                  <span className="text-xs font-bold block leading-none">
                    {speakingCharacter.name}
                  </span>
                  <span className="text-[10px] text-rose-400 font-mono">
                    Voice: {speakingCharacter.recommendedVoice}
                  </span>
                </div>
              </div>
            )}

            {/* Subtitles Overlay (Bottom) */}
            {currentDialogue && (
              <div className="absolute bottom-6 inset-x-4 sm:inset-x-12 text-center">
                <span className="inline-block px-2.5 py-0.5 rounded bg-rose-600/90 text-white text-[11px] font-bold tracking-wide uppercase mb-2">
                  {currentDialogue.speaker} ({currentDialogue.emotion})
                </span>
                <p className="text-sm sm:text-base md:text-lg font-semibold text-white drop-shadow-lg bg-black/70 backdrop-blur-sm px-4 py-2.5 rounded-xl border border-white/10 max-w-2xl mx-auto leading-relaxed">
                  "{currentDialogue.text}"
                </p>
              </div>
            )}

            {/* Loading Audio Cue Indicator */}
            {isLoadingAudio && (
              <div className="absolute top-4 right-4 bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-lg border border-white/10 flex items-center gap-1.5 text-xs text-neutral-300">
                <Loader2 className="w-3.5 h-3.5 animate-spin text-rose-400" />
                <span>Memuat Suara...</span>
              </div>
            )}
          </div>
        </div>

        {/* Bottom Playback & Scrubber Controls */}
        <div className="p-4 bg-neutral-900/90 border-t border-neutral-800 space-y-3">
          {/* Scenes Marker Scrubber */}
          <div className="flex items-center gap-2">
            {project.scenes.map((sc, i) => (
              <button
                key={sc.id}
                onClick={() => {
                  setCurrentSceneIndex(i);
                  setCurrentDialogueIndex(0);
                }}
                className={`flex-1 h-2 rounded-full transition-all ${
                  i === currentSceneIndex
                    ? 'bg-rose-500 shadow-sm shadow-rose-900'
                    : i < currentSceneIndex
                    ? 'bg-neutral-600'
                    : 'bg-neutral-800 hover:bg-neutral-700'
                }`}
                title={`Scene ${sc.sceneNumber}: ${sc.title}`}
              />
            ))}
          </div>

          {/* Control Buttons */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs text-neutral-400">
              <span>
                Scene {currentSceneIndex + 1} dari {project.scenes.length}
              </span>
              <span aria-hidden="true">·</span>
              <span>
                Dialog {currentDialogueIndex + 1} dari {currentScene?.dialogues?.length || 1}
              </span>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={handlePrevScene}
                disabled={currentSceneIndex === 0}
                className="p-2 text-neutral-400 hover:text-white disabled:opacity-30 rounded-lg hover:bg-neutral-800"
              >
                <SkipBack className="w-4 h-4" />
              </button>

              <button
                onClick={togglePlay}
                className="w-10 h-10 rounded-full bg-rose-600 hover:bg-rose-500 text-white flex items-center justify-center shadow-lg shadow-rose-950 transition-transform active:scale-95"
              >
                {isPlaying ? (
                  <Pause className="w-5 h-5" />
                ) : (
                  <Play className="w-5 h-5 fill-current ml-0.5" />
                )}
              </button>

              <button
                onClick={handleNextScene}
                disabled={currentSceneIndex === project.scenes.length - 1}
                className="p-2 text-neutral-400 hover:text-white disabled:opacity-30 rounded-lg hover:bg-neutral-800"
              >
                <SkipForward className="w-4 h-4" />
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setIsMuted(!isMuted);
                  if (audioRef.current) audioRef.current.muted = !isMuted;
                }}
                className="p-2 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-800"
              >
                {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>

        {/* Hidden Audio Element for Player */}
        <audio ref={audioRef} onEnded={handleAudioEnded} className="hidden" />
      </div>
    </div>
  );
};
