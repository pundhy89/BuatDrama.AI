import React, { useState, useRef, useEffect } from 'react';
import { DramaProject, SavedVideoClip, DramaCharacter, DramaRoom } from '../types/drama';
import { playBrowserSpeechFallback, stopSpeechSynthesis } from '../utils/speechFallback';
import {
  Play,
  Pause,
  SkipForward,
  SkipBack,
  ArrowUp,
  ArrowDown,
  Trash2,
  Film,
  Video,
  Plus,
  Clock,
  Sparkles,
  Volume2,
  VolumeX,
  Maximize2,
  RotateCcw,
  CheckCircle2,
  SlidersHorizontal,
  Layers,
  ChevronRight,
  BookOpen,
  Image as ImageIcon,
  Type,
  User,
  AlertCircle,
} from 'lucide-react';
import { ConfirmModal } from './ConfirmModal';

interface ClipPlayerStudioProps {
  project: DramaProject;
  savedClips: SavedVideoClip[];
  onUpdateClips: (clips: SavedVideoClip[]) => void;
  onNavigateToVeo: () => void;
  onOpenDirectorTheater?: () => void;
  characters: DramaCharacter[];
  rooms: DramaRoom[];
}

export const ClipPlayerStudio: React.FC<ClipPlayerStudioProps> = ({
  project,
  savedClips,
  onUpdateClips,
  onNavigateToVeo,
  onOpenDirectorTheater,
  characters,
  rooms,
}) => {
  const [activeClipIndex, setActiveClipIndex] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isPlayAllMode, setIsPlayAllMode] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Active clip
  const currentClip: SavedVideoClip | undefined = savedClips[activeClipIndex] || savedClips[0];

  // Reset time when active clip changes
  useEffect(() => {
    setCurrentTime(0);
    if (currentClip?.videoUrl && videoRef.current) {
      videoRef.current.currentTime = 0;
      if (isPlaying) {
        videoRef.current.play().catch((e) => console.log('Autoplay blocked:', e));
      }
    }
  }, [activeClipIndex]);

  // Handle continuous play timer for clips that have simulation/no mp4
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isPlaying && (!currentClip?.videoUrl)) {
      const clipDuration = currentClip?.durationSeconds || 5;
      setDuration(clipDuration);

      timer = setInterval(() => {
        setCurrentTime((prev) => {
          if (prev >= clipDuration) {
            handleClipEnded();
            return 0;
          }
          return prev + 0.5;
        });
      }, 500);
    }
    return () => clearInterval(timer);
  }, [isPlaying, activeClipIndex, currentClip, isPlayAllMode]);

  // Handle clip end event (For both real video & simulated clip)
  const handleClipEnded = () => {
    if (isPlayAllMode) {
      if (activeClipIndex < savedClips.length - 1) {
        // Advance to next clip
        setActiveClipIndex((prev) => prev + 1);
        setIsPlaying(true);
      } else {
        // Reached end of sequence
        setIsPlaying(false);
        setIsPlayAllMode(false);
        setActiveClipIndex(0);
      }
    } else {
      setIsPlaying(false);
    }
  };

  // Play a specific clip
  const handlePlayClip = (index: number) => {
    setActiveClipIndex(index);
    setIsPlaying(true);
    setIsPlayAllMode(false);
    if (videoRef.current) {
      videoRef.current.currentTime = 0;
      videoRef.current.play().catch((e) => console.log(e));
    }
  };

  // Play All sequence
  const handleStartPlayAll = () => {
    setIsPlayAllMode(true);
    setIsPlaying(true);
    if (activeClipIndex >= savedClips.length - 1) {
      setActiveClipIndex(0);
    }
    if (videoRef.current) {
      videoRef.current.currentTime = 0;
      videoRef.current.play().catch((e) => console.log(e));
    }
  };

  const handleTogglePlay = () => {
    if (isPlaying) {
      setIsPlaying(false);
      if (videoRef.current) videoRef.current.pause();
    } else {
      setIsPlaying(true);
      if (videoRef.current) {
        videoRef.current.play().catch((e) => console.log(e));
      }
    }
  };

  const handleNextClip = () => {
    if (activeClipIndex < savedClips.length - 1) {
      setActiveClipIndex((prev) => prev + 1);
    }
  };

  const handlePrevClip = () => {
    if (activeClipIndex > 0) {
      setActiveClipIndex((prev) => prev - 1);
    }
  };

  // Reordering functions
  const handleMoveClip = (index: number, direction: 'up' | 'down') => {
    const newClips = [...savedClips];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newClips.length) return;

    const temp = newClips[index];
    newClips[index] = newClips[targetIndex];
    newClips[targetIndex] = temp;

    // Adjust active index if it moved
    if (activeClipIndex === index) {
      setActiveClipIndex(targetIndex);
    } else if (activeClipIndex === targetIndex) {
      setActiveClipIndex(index);
    }

    onUpdateClips(newClips);
  };

  const [clipToDelete, setClipToDelete] = useState<SavedVideoClip | null>(null);
  const [limitWarningMessage, setLimitWarningMessage] = useState<string | null>(null);

  const handleDeleteClip = (id: string) => {
    if (savedClips.length <= 1) {
      setLimitWarningMessage('Playlist memerlukan minimal satu klip video.');
      setTimeout(() => setLimitWarningMessage(null), 3500);
      return;
    }
    const target = savedClips.find((c) => c.id === id);
    if (target) {
      setClipToDelete(target);
    }
  };

  const handleConfirmDeleteClip = () => {
    if (!clipToDelete) return;
    const id = clipToDelete.id;
    const filtered = savedClips.filter((c) => c.id !== id);
    onUpdateClips(filtered);
    if (activeClipIndex >= filtered.length) {
      setActiveClipIndex(Math.max(0, filtered.length - 1));
    }
    setClipToDelete(null);
  };

  // Total duration of all clips in playlist
  const totalPlaylistDuration = savedClips.reduce(
    (acc, clip) => acc + (clip.durationSeconds || 5),
    0
  );

  // Matching room backdrop if available
  const currentRoom = rooms.find((r) => r.name === currentClip?.roomName) || rooms[0];

  return (
    <div className="max-w-7xl mx-auto px-4 lg:px-8 py-8 space-y-8">
      {/* Top Banner Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-neutral-800">
        <div>
          <div className="flex items-center gap-2 text-xs text-rose-500 font-mono tracking-wider uppercase mb-1">
            <Film className="w-4 h-4" />
            <span>Studio Player & Pengatur Urutan Klip</span>
          </div>
          <h1 className="text-2xl lg:text-3xl font-display font-bold text-white tracking-tight">
            Player Serial & Rangkaian Klip
          </h1>
          <p className="text-sm text-neutral-400 mt-1 max-w-2xl">
            Tonton klip drama per adegan atau putar seluruh episode secara berurutan (*continuous playback*). Atur urutan tayang klip sesuai alur cerita drama Anda.
          </p>
        </div>

        {/* Global Controls & Add Clip CTA */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={onNavigateToVeo}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-gradient-to-r from-amber-600 to-rose-600 hover:from-amber-500 hover:to-rose-500 text-white text-xs font-semibold rounded-xl shadow-md shadow-rose-950/40 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>+ Buat Klip Baru (Veo)</span>
          </button>

          {onOpenDirectorTheater && (
            <button
              onClick={onOpenDirectorTheater}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-neutral-900 hover:bg-neutral-800 text-neutral-300 hover:text-white text-xs font-semibold rounded-xl border border-neutral-800 transition-colors cursor-pointer"
            >
              <Maximize2 className="w-3.5 h-3.5 text-rose-400" />
              <span>Full Cinema Theater</span>
            </button>
          )}
        </div>
      </div>

      {limitWarningMessage && (
        <div className="p-3 bg-amber-950/60 border border-amber-800/80 rounded-xl text-xs text-amber-200 flex items-center gap-2 animate-in fade-in">
          <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
          <span>{limitWarningMessage}</span>
        </div>
      )}

      {/* Main Grid: Player Viewport (Left 7 cols) & Playlist Sequencer (Right 5 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Video Viewport Screen & Playback Controls */}
        <div className="lg:col-span-7 space-y-4">
          <div
            ref={containerRef}
            className="bg-neutral-900/90 rounded-2xl border border-neutral-800 p-4 md:p-5 space-y-4 shadow-xl shadow-black/40"
          >
            {/* Monitor Screen Area */}
            <div className="relative rounded-xl overflow-hidden bg-black border border-neutral-800 flex items-center justify-center">
              <div
                className={`relative w-full transition-all duration-300 ${
                  currentClip?.aspectRatio === '9:16'
                    ? 'aspect-[9/16] max-h-[480px] mx-auto'
                    : 'aspect-video max-h-[450px]'
                }`}
              >
                {/* Real Video or Scenic Backdrop */}
                {currentClip?.videoUrl ? (
                  <video
                    ref={videoRef}
                    src={currentClip.videoUrl}
                    playsInline
                    muted={isMuted}
                    onEnded={handleClipEnded}
                    onTimeUpdate={(e) => {
                      const v = e.currentTarget;
                      setCurrentTime(v.currentTime);
                      if (v.duration) setDuration(v.duration);
                    }}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div
                    className={`w-full h-full bg-gradient-to-tr ${
                      currentRoom?.backdropGradient || 'from-slate-950 via-zinc-900 to-black'
                    } flex flex-col items-center justify-center p-6 text-center relative overflow-hidden`}
                  >
                    {/* Visual Photo fallback */}
                    {currentRoom?.customUploadedPhoto ? (
                      <img
                        src={currentRoom.customUploadedPhoto}
                        alt="Scene backdrop"
                        className={`absolute inset-0 w-full h-full object-cover transition-transform duration-1000 ${
                          isPlaying ? 'scale-105 opacity-90' : 'scale-100 opacity-70'
                        }`}
                      />
                    ) : null}

                    {/* Ambient overlay */}
                    <div className="absolute inset-0 bg-black/50" />

                    {/* Content inside fallback */}
                    <div className="relative z-10 space-y-2 max-w-md">
                      <div className="w-12 h-12 rounded-2xl bg-rose-600/30 border border-rose-500/50 flex items-center justify-center mx-auto text-rose-300">
                        <Film className="w-6 h-6" />
                      </div>
                      <span className="text-xs uppercase font-mono tracking-wider text-rose-400 block">
                        Visual Sinematik Drama
                      </span>
                      <h3 className="text-base md:text-lg font-bold text-white font-display">
                        {currentClip?.title || 'Klip Drama'}
                      </h3>
                      <p className="text-xs text-neutral-300 leading-relaxed line-clamp-2">
                        {currentClip?.sourceDescription}
                      </p>
                    </div>
                  </div>
                )}

                {/* Overlaid Badge / Info Bar */}
                <div className="absolute top-3 left-3 right-3 flex items-center justify-between pointer-events-none">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-1 rounded-lg bg-black/70 backdrop-blur-md text-[11px] font-mono text-rose-300 border border-neutral-700/60 font-semibold">
                      Klip #{activeClipIndex + 1} / {savedClips.length}
                    </span>
                    {isPlayAllMode && (
                      <span className="px-2.5 py-1 rounded-lg bg-rose-600/90 text-white text-[10px] font-semibold tracking-wider uppercase animate-pulse">
                        ▶ Putar Semua Aktif
                      </span>
                    )}
                  </div>

                  <span className="px-2 py-0.5 rounded-md bg-black/60 text-[10px] font-mono text-neutral-300 border border-neutral-800">
                    {currentClip?.aspectRatio || '16:9'}
                  </span>
                </div>
              </div>
            </div>

            {/* Playback Control Bar */}
            <div className="space-y-3 pt-2 border-t border-neutral-800/80">
              {/* Progress Slider Bar */}
              <div className="space-y-1">
                <div className="w-full bg-neutral-800 rounded-full h-1.5 overflow-hidden">
                  <div
                    className="bg-rose-500 h-full transition-all duration-200"
                    style={{
                      width: `${
                        duration > 0 ? Math.min(100, (currentTime / duration) * 100) : 0
                      }%`,
                    }}
                  />
                </div>
                <div className="flex items-center justify-between text-[11px] font-mono text-neutral-400">
                  <span>{Math.floor(currentTime)}s</span>
                  <span className="text-amber-400/90">
                    Durasi Klip: {Math.floor(duration || currentClip?.durationSeconds || 5)}s
                  </span>
                </div>
              </div>

              {/* Main Button Controls */}
              <div className="flex items-center justify-between gap-3 pt-1">
                <div className="flex items-center gap-2">
                  {/* Previous Clip Button */}
                  <button
                    onClick={handlePrevClip}
                    disabled={activeClipIndex === 0}
                    className="p-2 text-neutral-400 hover:text-white disabled:opacity-30 disabled:hover:text-neutral-400 rounded-lg hover:bg-neutral-800 transition-colors cursor-pointer"
                    title="Klip sebelumnya"
                  >
                    <SkipBack className="w-4 h-4" />
                  </button>

                  {/* Play / Pause Toggle Button */}
                  <button
                    onClick={handleTogglePlay}
                    className="w-10 h-10 rounded-xl bg-rose-600 hover:bg-rose-500 text-white flex items-center justify-center shadow-lg shadow-rose-950/50 transition-transform active:scale-95 cursor-pointer"
                    title={isPlaying ? 'Jeda' : 'Putar Klip'}
                  >
                    {isPlaying ? (
                      <Pause className="w-5 h-5 fill-current" />
                    ) : (
                      <Play className="w-5 h-5 fill-current ml-0.5" />
                    )}
                  </button>

                  {/* Next Clip Button */}
                  <button
                    onClick={handleNextClip}
                    disabled={activeClipIndex >= savedClips.length - 1}
                    className="p-2 text-neutral-400 hover:text-white disabled:opacity-30 disabled:hover:text-neutral-400 rounded-lg hover:bg-neutral-800 transition-colors cursor-pointer"
                    title="Klip berikutnya"
                  >
                    <SkipForward className="w-4 h-4" />
                  </button>

                  {/* Mute Toggle */}
                  <button
                    onClick={() => setIsMuted(!isMuted)}
                    className="p-2 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-800 transition-colors ml-1 cursor-pointer"
                    title={isMuted ? 'Nyalakan suara' : 'Bisukan'}
                  >
                    {isMuted ? (
                      <VolumeX className="w-4 h-4 text-red-400" />
                    ) : (
                      <Volume2 className="w-4 h-4" />
                    )}
                  </button>
                </div>

                {/* Primary Action: PUTAR SEMUA */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleStartPlayAll}
                    className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer shadow-md ${
                      isPlayAllMode
                        ? 'bg-rose-600 text-white shadow-rose-950 ring-2 ring-rose-400/50'
                        : 'bg-neutral-800 hover:bg-neutral-700 text-neutral-200 border border-neutral-700/80 hover:text-white'
                    }`}
                  >
                    <Play className="w-3.5 h-3.5 fill-current text-rose-400" />
                    <span>Putar Semua Klip</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Active Clip Metadata Details Card */}
          {currentClip && (
            <div className="p-4 bg-neutral-900/60 rounded-xl border border-neutral-800 space-y-2">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[11px] font-mono text-rose-400 font-semibold uppercase tracking-wider">
                  Detail Klip Aktif
                </span>
                <span className="text-xs text-neutral-500 font-mono">
                  {currentClip.sourceType === 'script_scene'
                    ? `Naskah: Ep ${currentClip.episodeNumber || 1} Scene ${currentClip.sceneNumber || 1}`
                    : currentClip.sourceType === 'photo_animate'
                    ? 'Animasi Foto'
                    : 'Text to Video'}
                </span>
              </div>
              <h2 className="text-base font-bold text-white font-display">
                {currentClip.title}
              </h2>
              <p className="text-xs text-neutral-300 leading-relaxed">
                {currentClip.sourceDescription}
              </p>

              {/* Characters & Room tags */}
              <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-neutral-800/80 text-[11px]">
                {currentClip.roomName && (
                  <span className="px-2 py-0.5 rounded-md bg-neutral-950 text-neutral-300 border border-neutral-800">
                    Set: {currentClip.roomName}
                  </span>
                )}
                {currentClip.characterNames?.map((name, i) => (
                  <span
                    key={i}
                    className="px-2 py-0.5 rounded-md bg-rose-950/60 text-rose-300 border border-rose-900/40"
                  >
                    {name}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Playlist Sequence & Reorder Manager (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="p-4 bg-neutral-900/80 rounded-2xl border border-neutral-800 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
              <div>
                <h3 className="text-sm font-bold text-white font-display flex items-center gap-1.5">
                  <Layers className="w-4 h-4 text-rose-500" />
                  <span>Urutan Rangkaian Klip</span>
                </h3>
                <span className="text-xs text-neutral-400">
                  {savedClips.length} Klip · Total {totalPlaylistDuration} Detik
                </span>
              </div>

              <button
                onClick={handleStartPlayAll}
                className="flex items-center gap-1 px-2.5 py-1.5 bg-rose-950/70 hover:bg-rose-900/80 text-rose-300 rounded-lg text-xs font-semibold border border-rose-800/60 transition-colors cursor-pointer"
              >
                <Play className="w-3 h-3 fill-current" />
                <span>Putar Berurutan</span>
              </button>
            </div>

            {/* Clips List with Reordering Controls */}
            <div className="space-y-2.5 max-h-[520px] overflow-y-auto pr-1">
              {savedClips.map((clip, idx) => {
                const isActive = idx === activeClipIndex;

                return (
                  <div
                    key={clip.id}
                    onClick={() => handlePlayClip(idx)}
                    className={`group relative p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                      isActive
                        ? 'bg-neutral-800/90 border-rose-500 shadow-md shadow-rose-950/30 ring-1 ring-rose-500/50'
                        : 'bg-neutral-950/70 border-neutral-800 hover:border-neutral-700 hover:bg-neutral-900/60'
                    }`}
                  >
                    {/* Left: Sequence Number & Thumbnail */}
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="flex flex-col items-center justify-center shrink-0 w-6">
                        <span className={`text-xs font-mono font-bold ${isActive ? 'text-rose-400' : 'text-neutral-500'}`}>
                          #{idx + 1}
                        </span>
                      </div>

                      {/* Mini Thumbnail Icon */}
                      <div className="w-12 h-10 rounded-lg overflow-hidden bg-neutral-900 border border-neutral-800 flex items-center justify-center shrink-0 relative">
                        {clip.videoUrl ? (
                          <div className="w-full h-full bg-rose-950/40 flex items-center justify-center">
                            <Video className="w-4 h-4 text-rose-400" />
                          </div>
                        ) : clip.sourceType === 'script_scene' ? (
                          <BookOpen className="w-4 h-4 text-cyan-400" />
                        ) : clip.sourceType === 'photo_animate' ? (
                          <ImageIcon className="w-4 h-4 text-amber-400" />
                        ) : (
                          <Type className="w-4 h-4 text-rose-400" />
                        )}

                        {isActive && isPlaying && (
                          <div className="absolute inset-0 bg-rose-600/30 flex items-center justify-center">
                            <span className="w-2 h-2 rounded-full bg-white animate-ping" />
                          </div>
                        )}
                      </div>

                      {/* Title & Metadata */}
                      <div className="min-w-0">
                        <span className={`text-xs font-semibold truncate block ${isActive ? 'text-white' : 'text-neutral-200'}`}>
                          {clip.title}
                        </span>
                        <div className="flex items-center gap-2 text-[11px] text-neutral-400 mt-0.5">
                          <span className="font-mono text-amber-400/90">{clip.durationSeconds || 5}s</span>
                          <span>·</span>
                          <span className="truncate">
                            {clip.sourceType === 'script_scene' ? 'Naskah' : clip.sourceType === 'photo_animate' ? 'Foto' : 'Text'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Right: Reorder buttons & Delete */}
                    <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                      {/* Play per klip button */}
                      <button
                        onClick={() => handlePlayClip(idx)}
                        className={`p-1.5 rounded-lg text-xs font-medium transition-colors ${
                          isActive && isPlaying
                            ? 'bg-rose-600 text-white'
                            : 'text-neutral-400 hover:text-white hover:bg-neutral-800'
                        }`}
                        title="Putar klip ini"
                      >
                        <Play className="w-3.5 h-3.5 fill-current" />
                      </button>

                      {/* Move Up */}
                      <button
                        onClick={() => handleMoveClip(idx, 'up')}
                        disabled={idx === 0}
                        className="p-1 text-neutral-400 hover:text-white disabled:opacity-20 transition-colors"
                        title="Geser urutan naik"
                      >
                        <ArrowUp className="w-3.5 h-3.5" />
                      </button>

                      {/* Move Down */}
                      <button
                        onClick={() => handleMoveClip(idx, 'down')}
                        disabled={idx === savedClips.length - 1}
                        className="p-1 text-neutral-400 hover:text-white disabled:opacity-20 transition-colors"
                        title="Geser urutan turun"
                      >
                        <ArrowDown className="w-3.5 h-3.5" />
                      </button>

                      {/* Delete Clip */}
                      {savedClips.length > 1 && (
                        <button
                          onClick={() => handleDeleteClip(clip.id)}
                          className="p-1 text-neutral-500 hover:text-red-400 rounded transition-colors"
                          title="Hapus klip dari playlist"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Bottom Add Clip Button */}
            <button
              onClick={onNavigateToVeo}
              className="w-full py-2.5 rounded-xl border border-dashed border-neutral-700/80 hover:border-rose-500 bg-neutral-950/60 hover:bg-neutral-900 text-neutral-300 hover:text-white text-xs font-semibold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 text-rose-400" />
              <span>+ Buat Klip Baru dari Naskah / Foto / Text</span>
            </button>
          </div>
        </div>
      </div>

      {/* Delete Clip Confirmation Modal */}
      <ConfirmModal
        isOpen={Boolean(clipToDelete)}
        title={`Hapus Klip "${clipToDelete?.title || ''}"?`}
        description="Klip video ini akan dihapus dari urutan playlist serial drama."
        confirmLabel="Ya, Hapus Klip"
        onConfirm={handleConfirmDeleteClip}
        onCancel={() => setClipToDelete(null)}
      />
    </div>
  );
};
