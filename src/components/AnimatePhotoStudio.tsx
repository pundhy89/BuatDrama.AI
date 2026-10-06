import React, { useState, useRef, useEffect } from 'react';
import { DramaCharacter, DramaRoom, DramaScene, DramaEpisode, SavedVideoClip } from '../types/drama';
import { CINEMATIC_MOTION_PRESETS } from '../data/presets';
import {
  Video,
  Upload,
  Play,
  Pause,
  Download,
  Sparkles,
  Loader2,
  RefreshCw,
  Film,
  Camera,
  Layers,
  Sliders,
  Volume2,
  CheckCircle2,
  AlertCircle,
  Maximize2,
  Image as ImageIcon,
  Clock,
  BookOpen,
  Type,
  Users,
  MapPin,
  Check,
  ChevronRight,
  Bookmark,
  Share2,
} from 'lucide-react';

export type VeoStudioMode = 'photo' | 'script' | 'text';

interface AnimatePhotoStudioProps {
  characters: DramaCharacter[];
  rooms: DramaRoom[];
  scenes: DramaScene[];
  episodes?: DramaEpisode[];
  preloadedScene?: DramaScene | null;
  onAttachVideoToScene?: (sceneId: string, videoUrl: string) => void;
  onSaveClipToPlayer: (clip: SavedVideoClip) => void;
  onNavigateToPlayer: () => void;
}

export const AnimatePhotoStudio: React.FC<AnimatePhotoStudioProps> = ({
  characters,
  rooms,
  scenes,
  episodes = [],
  preloadedScene,
  onAttachVideoToScene,
  onSaveClipToPlayer,
  onNavigateToPlayer,
}) => {
  // Mode selection: 1. Photo, 2. Script Scene, 3. Text to Clip
  const [activeMode, setActiveMode] = useState<VeoStudioMode>(
    preloadedScene ? 'script' : 'photo'
  );

  // Common Veo settings
  const [aspectRatio, setAspectRatio] = useState<'16:9' | '9:16'>('16:9');
  const [expectedDuration, setExpectedDuration] = useState<number>(5);

  // MODE 1: Foto to Video state
  const [uploadedPhotoUrl, setUploadedPhotoUrl] = useState<string | null>(null);
  const [photoMimeType, setPhotoMimeType] = useState<string>('image/png');
  const [photoMotionPrompt, setPhotoMotionPrompt] = useState<string>(
    'Cinematic slow camera push-in towards character, subtle emotional blink and breathing, dramatic rim lighting, television drama grade'
  );
  const [cameraMovement, setCameraMovement] = useState<string>('Slow Push-in');

  // MODE 2: Script to Video state (Episode & Scene selection)
  const currentEpisodes: DramaEpisode[] =
    episodes.length > 0
      ? episodes
      : [
          {
            id: 'ep-1',
            episodeNumber: 1,
            title: 'Episode 1',
            scenes: scenes,
          },
        ];

  const [selectedEpisodeId, setSelectedEpisodeId] = useState<string>(
    currentEpisodes[0]?.id || 'ep-1'
  );

  const activeEpisode =
    currentEpisodes.find((ep) => ep.id === selectedEpisodeId) || currentEpisodes[0];

  const episodeScenes = activeEpisode?.scenes || scenes;

  const [selectedSceneId, setSelectedSceneId] = useState<string>(
    preloadedScene?.id || episodeScenes[0]?.id || ''
  );

  const selectedScene =
    episodeScenes.find((sc) => sc.id === selectedSceneId) || episodeScenes[0];

  const [scriptCustomPrompt, setScriptCustomPrompt] = useState<string>('');

  // MODE 3: Text to Video state (Prompt, Karakter, Latar)
  const [textPrompt, setTextPrompt] = useState<string>(
    'Dua tokoh konglomerat bertatapan tajam di tengah hujan malam hari, pantulan lampu neon pada aspal basah, ketegangan emosional memuncak.'
  );
  const [selectedCharacterNames, setSelectedCharacterNames] = useState<string[]>([
    characters[0]?.name || '',
  ]);
  const [selectedRoomName, setSelectedRoomName] = useState<string>(
    rooms[0]?.name || ''
  );

  // Veo Generation lifecycle state
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [operationName, setOperationName] = useState<string | null>(null);
  const [progressStep, setProgressStep] = useState<string>('idle');
  const [progressPercent, setProgressPercent] = useState<number>(0);
  const [generatedVideoUrl, setGeneratedVideoUrl] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Save to Player state & Feedback
  const [clipTitleInput, setClipTitleInput] = useState<string>('');
  const [savedSuccessMessage, setSavedSuccessMessage] = useState<string | null>(null);

  // Video Ref
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const pollingTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Synchronize when preloadedScene is passed from ScriptStudio
  useEffect(() => {
    if (preloadedScene) {
      setActiveMode('script');
      if (preloadedScene.episodeNumber) {
        const matchingEp = currentEpisodes.find(
          (e) => e.episodeNumber === preloadedScene.episodeNumber
        );
        if (matchingEp) setSelectedEpisodeId(matchingEp.id);
      }
      setSelectedSceneId(preloadedScene.id);
      if (preloadedScene.durationSeconds) {
        setExpectedDuration(preloadedScene.durationSeconds);
      }
      if (preloadedScene.visualPrompt) {
        setScriptCustomPrompt(preloadedScene.visualPrompt);
      }
      setClipTitleInput(`Klip: ${preloadedScene.title}`);
    }
  }, [preloadedScene]);

  // Clean up timer on unmount
  useEffect(() => {
    return () => {
      if (pollingTimerRef.current) clearInterval(pollingTimerRef.current);
    };
  }, []);

  // Update default clip title when mode or scene changes
  useEffect(() => {
    if (activeMode === 'script' && selectedScene) {
      setClipTitleInput(`Klip Ep ${activeEpisode?.episodeNumber || 1} Sc ${selectedScene.sceneNumber}: ${selectedScene.title}`);
    } else if (activeMode === 'photo') {
      setClipTitleInput('Klip Animasi Foto Sinematik');
    } else if (activeMode === 'text') {
      setClipTitleInput(`Klip Teks: ${selectedRoomName || 'Set Drama'}`);
    }
  }, [activeMode, selectedScene, selectedRoomName]);

  // Handle Photo File Upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setPhotoMimeType(file.type || 'image/png');
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      setUploadedPhotoUrl(result);
      setGeneratedVideoUrl(null);
      setErrorMessage(null);
    };
    reader.readAsDataURL(file);
  };

  const handleSelectFromCharacter = (char: DramaCharacter) => {
    if (char.customUploadedPhoto) {
      setUploadedPhotoUrl(char.customUploadedPhoto);
      setPhotoMotionPrompt(
        `Cinematic portrait video of ${char.name}, ${char.voicePersona}, subtle emotional gaze turning slightly towards the camera, dramatic lighting`
      );
    }
  };

  const handleSelectFromRoom = (room: DramaRoom) => {
    if (room.customUploadedPhoto) {
      setUploadedPhotoUrl(room.customUploadedPhoto);
      setPhotoMotionPrompt(
        `Cinematic atmosphere video of ${room.name}, ${room.lightingSetup}, slow cinematic tracking camera shot`
      );
    }
  };

  // Toggle Character in Mode 3 (Text)
  const toggleCharacterSelection = (name: string) => {
    setSelectedCharacterNames((prev) =>
      prev.includes(name) ? prev.filter((n) => n !== name) : [...prev, name]
    );
  };

  // Start Generation using Veo: model veo-3.1-fast-generate-preview
  const handleStartGeneration = async () => {
    setIsGenerating(true);
    setErrorMessage(null);
    setGeneratedVideoUrl(null);
    setSavedSuccessMessage(null);
    setProgressPercent(15);
    setProgressStep('Mempersiapkan frame dan parameter Veo 3.1...');

    let finalPrompt = '';
    let imageToUse: string | undefined = undefined;

    if (activeMode === 'photo') {
      if (!uploadedPhotoUrl) {
        setErrorMessage('Silakan upload atau pilih foto terlebih dahulu.');
        setIsGenerating(false);
        return;
      }
      finalPrompt = `${photoMotionPrompt}, camera movement: ${cameraMovement}, dramatic cinema grade`;
      imageToUse = uploadedPhotoUrl;
    } else if (activeMode === 'script') {
      if (!selectedScene) {
        setErrorMessage('Silakan pilih adegan dari naskah.');
        setIsGenerating(false);
        return;
      }
      const room = rooms.find((r) => r.name === selectedScene.roomOrLocation);
      const dialoguesSummary = selectedScene.dialogues
        .map((d) => `${d.speaker} (${d.emotion})`)
        .join(', ');

      finalPrompt = `${scriptCustomPrompt || selectedScene.visualPrompt}, Set: ${selectedScene.roomOrLocation}, Camera: ${selectedScene.cameraDirection}, Lighting: ${selectedScene.lighting}, Mood: ${selectedScene.mood}, Dialogues involved: ${dialoguesSummary}, dramatic television drama grade`;

      // Use scene or room image if available
      if (selectedScene.customImageUrl) {
        imageToUse = selectedScene.customImageUrl;
      } else if (room?.customUploadedPhoto) {
        imageToUse = room.customUploadedPhoto;
      }
    } else if (activeMode === 'text') {
      const selectedCharsInfo = characters
        .filter((c) => selectedCharacterNames.includes(c.name))
        .map((c) => `${c.name} (${c.role}, ${c.clothingStyle})`)
        .join(' dan ');

      const roomInfo = rooms.find((r) => r.name === selectedRoomName);

      finalPrompt = `${textPrompt}. Karakter: ${selectedCharsInfo || 'Tokoh Drama'}. Latar Set: ${selectedRoomName || 'Interior'} (${roomInfo?.lightingSetup || 'Sinematik'}). Pencahayaan dramatis, kualitas serial drama 4k.`;

      if (roomInfo?.customUploadedPhoto) {
        imageToUse = roomInfo.customUploadedPhoto;
      }
    }

    try {
      const response = await fetch('/api/generate-video', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: finalPrompt,
          imageBase64: imageToUse,
          mimeType: photoMimeType,
          aspectRatio: aspectRatio,
          resolution: '720p',
        }),
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Gagal memulai render video dengan Veo.');
      }

      setOperationName(data.operationName);
      setProgressPercent(35);
      setProgressStep('Veo 3.1 Fast sedang memproses adegan sinematik...');

      // Start polling
      pollVideoStatus(data.operationName);
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message || 'Gagal merender video.');
      setIsGenerating(false);
      setProgressStep('idle');
    }
  };

  const pollVideoStatus = (opName: string) => {
    let attempts = 0;
    const maxAttempts = 30; // 30 * 4s = 120s

    if (pollingTimerRef.current) clearInterval(pollingTimerRef.current);

    pollingTimerRef.current = setInterval(async () => {
      attempts++;
      const currentProgress = Math.min(92, 35 + attempts * 4);
      setProgressPercent(currentProgress);

      if (attempts === 3) {
        setProgressStep('Mensintesis pencahayaan dan gerakan ekspresi adegan...');
      } else if (attempts === 8) {
        setProgressStep('Melakukan interpolasi frame pada 24 frame per detik...');
      } else if (attempts === 15) {
        setProgressStep('Menyelesaikan encoding video MP4...');
      }

      try {
        const res = await fetch('/api/video-status', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ operationName: opName }),
        });

        const statusData = await res.json();
        if (statusData.done) {
          if (pollingTimerRef.current) clearInterval(pollingTimerRef.current);

          if (statusData.error) {
            throw new Error(statusData.error.message || 'Proses pembuatan video dibatalkan.');
          }

          setProgressPercent(100);
          setProgressStep('Mengunduh video hasil render...');

          // Download video via proxy
          downloadCompletedVideo(opName);
        }
      } catch (pollErr: any) {
        console.error('Polling error:', pollErr);
        if (attempts >= maxAttempts) {
          if (pollingTimerRef.current) clearInterval(pollingTimerRef.current);
          setIsGenerating(false);
          setErrorMessage('Waktu tunggu proses video habis. Silakan coba lagi.');
        }
      }
    }, 4000);
  };

  const downloadCompletedVideo = async (opName: string) => {
    try {
      const res = await fetch('/api/video-download', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ operationName: opName }),
      });

      if (!res.ok) {
        throw new Error('Gagal mengunduh file video hasil render.');
      }

      const blob = await res.blob();
      const videoBlobUrl = URL.createObjectURL(blob);
      setGeneratedVideoUrl(videoBlobUrl);
      setIsGenerating(false);
      setProgressStep('Selesai! Video siap disimpan ke Player.');

      // Auto attach if script scene mode
      if (activeMode === 'script' && selectedScene && onAttachVideoToScene) {
        onAttachVideoToScene(selectedScene.id, videoBlobUrl);
      }
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message || 'Gagal mengunduh video.');
      setIsGenerating(false);
    }
  };

  // SAVE CLIP TO PLAYER
  const handleSaveToPlayer = (autoNavigate: boolean = false) => {
    const finalTitle =
      clipTitleInput.trim() ||
      (activeMode === 'script'
        ? `Klip Adegan ${selectedScene?.sceneNumber || 1}`
        : activeMode === 'photo'
        ? 'Klip Animasi Foto'
        : 'Klip Sinematik Teks');

    let sourceDesc = '';
    if (activeMode === 'script') {
      sourceDesc = `Naskah: Episode ${activeEpisode?.episodeNumber || 1} Adegan ${selectedScene?.sceneNumber || 1} - ${selectedScene?.title || ''}`;
    } else if (activeMode === 'photo') {
      sourceDesc = `Animasi Foto: ${photoMotionPrompt.slice(0, 80)}...`;
    } else {
      sourceDesc = `Prompt Teks: ${textPrompt.slice(0, 80)}...`;
    }

    const newClip: SavedVideoClip = {
      id: `clip-${Date.now()}`,
      title: finalTitle,
      videoUrl: generatedVideoUrl || '',
      sourceType:
        activeMode === 'script'
          ? 'script_scene'
          : activeMode === 'photo'
          ? 'photo_animate'
          : 'text_prompt',
      sourceDescription: sourceDesc,
      episodeNumber: activeMode === 'script' ? activeEpisode?.episodeNumber : undefined,
      sceneNumber: activeMode === 'script' ? selectedScene?.sceneNumber : undefined,
      sceneId: activeMode === 'script' ? selectedScene?.id : undefined,
      aspectRatio: aspectRatio,
      durationSeconds: expectedDuration,
      characterNames:
        activeMode === 'text'
          ? selectedCharacterNames
          : activeMode === 'script'
          ? selectedScene?.dialogues.map((d) => d.speaker)
          : undefined,
      roomName:
        activeMode === 'text'
          ? selectedRoomName
          : activeMode === 'script'
          ? selectedScene?.roomOrLocation
          : undefined,
      createdAt: Date.now(),
    };

    onSaveClipToPlayer(newClip);
    setSavedSuccessMessage(`"${finalTitle}" berhasil disimpan ke playlist Player!`);

    if (autoNavigate) {
      onNavigateToPlayer();
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 lg:px-8 py-8 space-y-8">
      {/* Studio Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-neutral-800">
        <div>
          <div className="flex items-center gap-2 text-xs text-rose-500 font-mono tracking-wider uppercase mb-1">
            <Video className="w-4 h-4" />
            <span>Veo 3.1 Cinematic Video Studio</span>
          </div>
          <h1 className="text-2xl lg:text-3xl font-display font-bold text-white tracking-tight">
            Generator Video Veo Sinematik
          </h1>
          <p className="text-sm text-neutral-400 mt-1 max-w-2xl">
            Buat klip video sinematik berkualitas tinggi dengan teknologi Google Veo 3.1. Pilih dari 3 mode: animasi foto, adegan naskah serial per episode, atau deskripsi teks bebas dengan karakter & set lokasi.
          </p>
        </div>

        {/* Global Aspect Ratio Selector */}
        <div className="flex items-center gap-2 bg-neutral-900/90 p-1.5 rounded-xl border border-neutral-800 self-start md:self-auto">
          <span className="text-xs text-neutral-400 font-mono px-2">Rasio Video:</span>
          <button
            onClick={() => setAspectRatio('16:9')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              aspectRatio === '16:9'
                ? 'bg-rose-600 text-white shadow-md shadow-rose-950/40'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            16:9 Landscape
          </button>
          <button
            onClick={() => setAspectRatio('9:16')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              aspectRatio === '9:16'
                ? 'bg-rose-600 text-white shadow-md shadow-rose-950/40'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            9:16 Portrait
          </button>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 3 SUB-MENU MODE TABS DENGAN DESAIN MODERN               */}
      {/* ======================================================== */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {/* TAB 1: Animasi Foto */}
        <button
          onClick={() => setActiveMode('photo')}
          className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
            activeMode === 'photo'
              ? 'bg-neutral-900 border-rose-500 shadow-xl shadow-rose-950/20 ring-1 ring-rose-500/50'
              : 'bg-neutral-950/60 border-neutral-800 hover:border-neutral-700 hover:bg-neutral-900/40'
          }`}
        >
          <div className="flex items-center gap-2.5 mb-2">
            <div
              className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                activeMode === 'photo'
                  ? 'bg-rose-600 text-white'
                  : 'bg-neutral-900 text-neutral-400 border border-neutral-800'
              }`}
            >
              <ImageIcon className="w-4 h-4" />
            </div>
            <span className="text-xs font-mono uppercase tracking-wider text-rose-400 font-semibold">
              Mode 1
            </span>
          </div>
          <h3 className="text-sm font-bold text-white">
            1. Animasi Foto Menjadi Video
          </h3>
          <p className="text-xs text-neutral-400 mt-1 line-clamp-2">
            Upload foto potret tokoh drama atau latar ruangan dan animasikan dengan Veo.
          </p>
        </button>

        {/* TAB 2: Animasi dari Naskah */}
        <button
          onClick={() => setActiveMode('script')}
          className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
            activeMode === 'script'
              ? 'bg-neutral-900 border-rose-500 shadow-xl shadow-rose-950/20 ring-1 ring-rose-500/50'
              : 'bg-neutral-950/60 border-neutral-800 hover:border-neutral-700 hover:bg-neutral-900/40'
          }`}
        >
          <div className="flex items-center gap-2.5 mb-2">
            <div
              className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                activeMode === 'script'
                  ? 'bg-rose-600 text-white'
                  : 'bg-neutral-900 text-neutral-400 border border-neutral-800'
              }`}
            >
              <BookOpen className="w-4 h-4" />
            </div>
            <span className="text-xs font-mono uppercase tracking-wider text-rose-400 font-semibold">
              Mode 2
            </span>
          </div>
          <h3 className="text-sm font-bold text-white">
            2. Animasi dari Naskah Serial
          </h3>
          <p className="text-xs text-neutral-400 mt-1 line-clamp-2">
            Pilih episode dan adegan langsung dari storyboard naskah untuk di-render.
          </p>
        </button>

        {/* TAB 3: Clip dari Text */}
        <button
          onClick={() => setActiveMode('text')}
          className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
            activeMode === 'text'
              ? 'bg-neutral-900 border-rose-500 shadow-xl shadow-rose-950/20 ring-1 ring-rose-500/50'
              : 'bg-neutral-950/60 border-neutral-800 hover:border-neutral-700 hover:bg-neutral-900/40'
          }`}
        >
          <div className="flex items-center gap-2.5 mb-2">
            <div
              className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                activeMode === 'text'
                  ? 'bg-rose-600 text-white'
                  : 'bg-neutral-900 text-neutral-400 border border-neutral-800'
              }`}
            >
              <Type className="w-4 h-4" />
            </div>
            <span className="text-xs font-mono uppercase tracking-wider text-rose-400 font-semibold">
              Mode 3
            </span>
          </div>
          <h3 className="text-sm font-bold text-white">
            3. Clip dari Text ke Video
          </h3>
          <p className="text-xs text-neutral-400 mt-1 line-clamp-2">
            Tulis prompt deskriptif bebas dengan pengaturan karakter aktor dan set latar.
          </p>
        </button>
      </div>

      {errorMessage && (
        <div className="p-3 bg-red-950/60 border border-red-800/80 rounded-xl text-xs text-red-200 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Main Studio Interactive Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Form Controls based on Active Mode (6 cols) */}
        <div className="lg:col-span-6 space-y-6">
          {/* ======================================================== */}
          {/* FORM MODE 1: ANIMASI FOTO KE VIDEO                       */}
          {/* ======================================================== */}
          {activeMode === 'photo' && (
            <div className="bg-neutral-900/70 p-5 rounded-2xl border border-neutral-800 space-y-5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-neutral-300 uppercase tracking-wider flex items-center gap-1.5">
                  <ImageIcon className="w-4 h-4 text-rose-400" />
                  <span>Foto Sumber Input</span>
                </span>
                <span className="text-[11px] font-mono text-neutral-500">
                  Format JPG/PNG/WebP
                </span>
              </div>

              {/* Photo Upload Dropzone */}
              <div
                onClick={() => fileInputRef.current?.click()}
                className={`relative rounded-xl border-2 border-dashed p-6 text-center cursor-pointer transition-all ${
                  uploadedPhotoUrl
                    ? 'border-rose-500/80 bg-neutral-950'
                    : 'border-neutral-700/80 hover:border-rose-500/60 bg-neutral-950/60 hover:bg-neutral-900/40'
                }`}
              >
                {uploadedPhotoUrl ? (
                  <div className="relative h-44 rounded-lg overflow-hidden mx-auto">
                    <img
                      src={uploadedPhotoUrl}
                      alt="Uploaded frame"
                      className="w-full h-full object-contain"
                    />
                    <div className="absolute inset-0 bg-black/60 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center text-xs text-white">
                      <span>Klik untuk ganti foto</span>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="w-12 h-12 rounded-2xl bg-neutral-900 border border-neutral-800 flex items-center justify-center mx-auto text-neutral-400">
                      <Upload className="w-6 h-6 text-rose-500" />
                    </div>
                    <span className="text-xs font-semibold text-neutral-200 block">
                      Klik atau Seret Foto ke Sini
                    </span>
                    <span className="text-[11px] text-neutral-500 block">
                      Upload foto karakter atau latar untuk dijadikan klip video
                    </span>
                  </div>
                )}
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  accept="image/*"
                  className="hidden"
                />
              </div>

              {/* Quick Pick from Roster Characters & Rooms */}
              <div className="space-y-2">
                <span className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider block">
                  Atau Pilih Cepat dari Galeri Karakter & Latar:
                </span>
                <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin">
                  {characters.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => handleSelectFromCharacter(c)}
                      className="px-2.5 py-1.5 rounded-lg bg-neutral-950 border border-neutral-800 hover:border-rose-500/60 text-xs text-neutral-300 whitespace-nowrap flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Users className="w-3 h-3 text-rose-400" />
                      <span>{c.name}</span>
                    </button>
                  ))}
                  {rooms.map((r) => (
                    <button
                      key={r.id}
                      type="button"
                      onClick={() => handleSelectFromRoom(r)}
                      className="px-2.5 py-1.5 rounded-lg bg-neutral-950 border border-neutral-800 hover:border-amber-500/60 text-xs text-neutral-300 whitespace-nowrap flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <MapPin className="w-3 h-3 text-amber-400" />
                      <span>{r.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Camera Presets */}
              <div className="space-y-2">
                <span className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider block">
                  Preset Gerakan Kamera Sinematik:
                </span>
                <div className="grid grid-cols-2 gap-2">
                  {CINEMATIC_MOTION_PRESETS.slice(0, 4).map((preset) => (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => {
                        setPhotoMotionPrompt(preset.prompt);
                        setCameraMovement(preset.label);
                      }}
                      className="p-2 rounded-lg bg-neutral-950 border border-neutral-800 hover:border-neutral-700 text-left text-xs transition-colors cursor-pointer"
                    >
                      <span className="font-semibold text-neutral-200 block truncate">
                        {preset.label}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Motion Prompt */}
              <div>
                <label className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider block mb-1.5">
                  Prompt Arahan Gerakan Kamera:
                </label>
                <textarea
                  rows={2}
                  value={photoMotionPrompt}
                  onChange={(e) => setPhotoMotionPrompt(e.target.value)}
                  className="w-full text-xs bg-neutral-950 border border-neutral-800 rounded-xl p-3 text-neutral-200 focus:outline-none focus:border-rose-500 leading-relaxed font-sans"
                />
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* FORM MODE 2: ANIMASI DARI NASKAH (EPISODE & SCENE)       */}
          {/* ======================================================== */}
          {activeMode === 'script' && (
            <div className="bg-neutral-900/70 p-5 rounded-2xl border border-neutral-800 space-y-5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-neutral-300 uppercase tracking-wider flex items-center gap-1.5">
                  <BookOpen className="w-4 h-4 text-rose-400" />
                  <span>Pilihan Episode & Adegan Naskah</span>
                </span>
                <span className="text-[11px] font-mono text-rose-400">
                  {currentEpisodes.length} Episode Tersedia
                </span>
              </div>

              {/* 1. Selector Episode */}
              <div>
                <label className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider block mb-1.5">
                  Pilih Episode:
                </label>
                <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin">
                  {currentEpisodes.map((ep) => {
                    const isSelected = ep.id === selectedEpisodeId;
                    return (
                      <button
                        key={ep.id}
                        type="button"
                        onClick={() => {
                          setSelectedEpisodeId(ep.id);
                          if (ep.scenes && ep.scenes.length > 0) {
                            setSelectedSceneId(ep.scenes[0].id);
                          }
                        }}
                        className={`px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all border cursor-pointer ${
                          isSelected
                            ? 'bg-rose-600 text-white border-rose-500 shadow-md shadow-rose-950/40'
                            : 'bg-neutral-950 text-neutral-400 border-neutral-800 hover:text-white'
                        }`}
                      >
                        <span>Episode {ep.episodeNumber}</span>
                        <span className="text-[10px] ml-1.5 opacity-80">
                          ({ep.scenes?.length || 0} Scene)
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 2. Selector Scene didalam Episode Terpilih */}
              <div>
                <label className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider block mb-1.5">
                  Pilih Scene / Adegan di Episode {activeEpisode?.episodeNumber}:
                </label>
                <div className="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto pr-1">
                  {episodeScenes.map((sc) => {
                    const isSelected = sc.id === selectedSceneId;
                    return (
                      <div
                        key={sc.id}
                        onClick={() => {
                          setSelectedSceneId(sc.id);
                          if (sc.durationSeconds) setExpectedDuration(sc.durationSeconds);
                          if (sc.visualPrompt) setScriptCustomPrompt(sc.visualPrompt);
                        }}
                        className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between ${
                          isSelected
                            ? 'bg-neutral-950 border-rose-500 shadow-md ring-1 ring-rose-500/50'
                            : 'bg-neutral-950/60 border-neutral-800 hover:border-neutral-700'
                        }`}
                      >
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-[11px] font-mono font-bold text-rose-400">
                              Scene {sc.sceneNumber}
                            </span>
                            <span className="text-xs font-semibold text-white truncate">
                              {sc.title}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-[11px] text-neutral-400 mt-0.5">
                            <span className="text-amber-400/90">{sc.roomOrLocation}</span>
                            <span>·</span>
                            <span>{sc.durationSeconds || 5}s</span>
                          </div>
                        </div>

                        {isSelected && (
                          <Check className="w-4 h-4 text-rose-400 shrink-0 ml-2" />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* 3. Detail Scene Terpilih & Visual Direction */}
              {selectedScene && (
                <div className="p-4 bg-neutral-950 rounded-xl border border-neutral-800 space-y-3">
                  <div className="flex items-center justify-between text-xs text-neutral-300 pb-2 border-b border-neutral-800">
                    <span className="font-semibold text-white">
                      Scene {selectedScene.sceneNumber}: {selectedScene.title}
                    </span>
                    <span className="text-amber-400 font-mono text-[11px]">
                      {selectedScene.durationSeconds || 5} Detik
                    </span>
                  </div>

                  <div className="text-xs text-neutral-400 space-y-1">
                    <p><strong className="text-neutral-300">Set Ruangan:</strong> {selectedScene.roomOrLocation} ({selectedScene.timeOfDay})</p>
                    <p><strong className="text-neutral-300">Kamera & Lighting:</strong> {selectedScene.cameraDirection}</p>
                    <p><strong className="text-neutral-300">Dialog Terlibat:</strong> {selectedScene.dialogues.length} percakapan tokoh</p>
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider block mb-1">
                      Prompt Visual Khusus Adegan Ini (Veo):
                    </label>
                    <textarea
                      rows={2}
                      value={scriptCustomPrompt || selectedScene.visualPrompt}
                      onChange={(e) => setScriptCustomPrompt(e.target.value)}
                      className="w-full text-xs bg-neutral-900 border border-neutral-800 rounded-lg p-2.5 text-neutral-200 focus:outline-none focus:border-rose-500 leading-relaxed font-sans"
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ======================================================== */}
          {/* FORM MODE 3: CLIP DARI TEXT (KARAKTER & LATAR)           */}
          {/* ======================================================== */}
          {activeMode === 'text' && (
            <div className="bg-neutral-900/70 p-5 rounded-2xl border border-neutral-800 space-y-5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-neutral-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Type className="w-4 h-4 text-rose-400" />
                  <span>Klip dari Teks, Karakter & Latar</span>
                </span>
                <span className="text-[11px] font-mono text-neutral-500">
                  Integrasi Otomatis
                </span>
              </div>

              {/* Free-form text prompt */}
              <div>
                <label className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider block mb-1.5">
                  Deskripsi Adegan / Teks Cerita Drama:
                </label>
                <textarea
                  rows={3}
                  value={textPrompt}
                  onChange={(e) => setTextPrompt(e.target.value)}
                  placeholder="Ketik situasi adegan drama yang ingin dibuat..."
                  className="w-full text-xs bg-neutral-950 border border-neutral-800 rounded-xl p-3 text-neutral-200 focus:outline-none focus:border-rose-500 leading-relaxed font-sans"
                />
              </div>

              {/* Tambahkan Karakter yang Terlibat */}
              <div>
                <label className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider block mb-1.5">
                  Pilih Karakter Terlibat:
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {characters.map((char) => {
                    const isChecked = selectedCharacterNames.includes(char.name);
                    return (
                      <button
                        key={char.id}
                        type="button"
                        onClick={() => toggleCharacterSelection(char.name)}
                        className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between ${
                          isChecked
                            ? 'bg-rose-950/50 border-rose-600 text-rose-200'
                            : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:text-white'
                        }`}
                      >
                        <div className="truncate">
                          <span className="text-xs font-semibold block truncate">
                            {char.name}
                          </span>
                          <span className="text-[10px] text-neutral-500 block truncate">
                            {char.role}
                          </span>
                        </div>
                        {isChecked && <Check className="w-3.5 h-3.5 text-rose-400 shrink-0 ml-1" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Tambahkan Latar / Ruangan */}
              <div>
                <label className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider block mb-1.5">
                  Pilih Latar / Ruangan Set:
                </label>
                <select
                  value={selectedRoomName}
                  onChange={(e) => setSelectedRoomName(e.target.value)}
                  className="w-full text-xs bg-neutral-950 border border-neutral-800 text-neutral-200 rounded-xl p-2.5 focus:outline-none focus:border-rose-500"
                >
                  {rooms.map((r) => (
                    <option key={r.id} value={r.name}>
                      {r.name} ({r.category})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* Durasi Setting & Render Button */}
          <div className="bg-neutral-900/60 p-4 rounded-2xl border border-neutral-800 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs text-neutral-300 font-semibold">
                <Clock className="w-4 h-4 text-amber-400" />
                <span>Panjang Durasi Klip Video:</span>
              </div>
              <div className="flex items-center gap-1">
                {[5, 8, 10, 15].map((sec) => (
                  <button
                    key={sec}
                    type="button"
                    onClick={() => setExpectedDuration(sec)}
                    className={`px-2.5 py-1 text-xs font-mono rounded-lg transition-colors border cursor-pointer ${
                      expectedDuration === sec
                        ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 font-bold'
                        : 'bg-neutral-950 text-neutral-400 border-neutral-800'
                    }`}
                  >
                    {sec}s
                  </button>
                ))}
              </div>
            </div>

            {/* GENERATE BUTTON */}
            <button
              onClick={handleStartGeneration}
              disabled={isGenerating}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-rose-600 via-rose-500 to-amber-600 hover:from-rose-500 hover:to-amber-500 text-white font-semibold text-sm shadow-xl shadow-rose-950/50 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Sedang Merender Video (Veo 3.1)...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-amber-300" />
                  <span>
                    {activeMode === 'photo'
                      ? 'Render Video dari Foto (Veo 3.1)'
                      : activeMode === 'script'
                      ? 'Render Adegan Naskah Ini (Veo 3.1)'
                      : 'Generate Clip dari Teks (Veo 3.1)'}
                  </span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Right Column: Viewport Monitor, Status, & SAVE TO PLAYER (6 cols) */}
        <div className="lg:col-span-6 space-y-5">
          <div className="bg-neutral-900/90 rounded-2xl border border-neutral-800 p-5 space-y-4 shadow-xl shadow-black/40">
            <div className="flex items-center justify-between pb-2 border-b border-neutral-800">
              <span className="text-xs font-semibold text-neutral-300 uppercase tracking-wider flex items-center gap-1.5">
                <Video className="w-4 h-4 text-rose-400" />
                <span>Hasil Render Video Sinematik</span>
              </span>
              <span className="text-[11px] font-mono text-neutral-400">
                {aspectRatio} · Veo 3.1 Fast
              </span>
            </div>

            {/* Viewport Monitor */}
            <div
              className={`relative rounded-xl overflow-hidden border border-neutral-800 bg-neutral-950 flex items-center justify-center ${
                aspectRatio === '16:9'
                  ? 'aspect-video max-h-[360px]'
                  : 'aspect-[9/16] max-h-[440px] mx-auto'
              }`}
            >
              {isGenerating ? (
                <div className="text-center p-6 space-y-3 z-10">
                  <div className="w-12 h-12 rounded-2xl bg-rose-600/20 border border-rose-500/40 flex items-center justify-center mx-auto text-rose-400">
                    <Loader2 className="w-6 h-6 animate-spin" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-white">
                      Veo 3.1 Sedang Merender
                    </h4>
                    <p className="text-xs text-neutral-400 mt-1 max-w-xs mx-auto">
                      {progressStep}
                    </p>
                  </div>
                  {/* Progress bar */}
                  <div className="w-48 mx-auto bg-neutral-800 rounded-full h-1.5 overflow-hidden">
                    <div
                      className="bg-rose-500 h-full transition-all duration-300"
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                </div>
              ) : generatedVideoUrl ? (
                <video
                  ref={videoRef}
                  src={generatedVideoUrl}
                  controls
                  playsInline
                  autoPlay
                  loop
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="text-center p-6 space-y-2 text-neutral-500">
                  <Film className="w-10 h-10 mx-auto text-neutral-600" />
                  <span className="text-xs block text-neutral-400 font-medium">
                    Monitor Pratinjau Klip
                  </span>
                  <span className="text-[11px] block max-w-xs text-neutral-500">
                    Klik tombol render untuk mulai membuat klip video sinematik dengan Veo 3.1
                  </span>
                </div>
              )}
            </div>

            {/* Download Link if ready */}
            {generatedVideoUrl && (
              <div className="flex items-center justify-end pt-1">
                <a
                  href={generatedVideoUrl}
                  download="buatdrama-scene.mp4"
                  className="flex items-center gap-1.5 px-3 py-1 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-medium rounded-lg transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download MP4</span>
                </a>
              </div>
            )}

            {/* ======================================================== */}
            {/* TOMBOL SIMPAN KE MENU PLAYER (USER REQUIREMENT)          */}
            {/* ======================================================== */}
            <div className="pt-4 border-t border-neutral-800/80 space-y-3">
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider block">
                  Judul Klip untuk Menu Player:
                </label>
                <input
                  type="text"
                  value={clipTitleInput}
                  onChange={(e) => setClipTitleInput(e.target.value)}
                  placeholder="Beri nama klip ini..."
                  className="w-full text-xs bg-neutral-950 border border-neutral-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-rose-500 font-sans"
                />
              </div>

              {savedSuccessMessage && (
                <div className="p-3 bg-emerald-950/60 border border-emerald-800/80 rounded-xl text-xs text-emerald-200 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>{savedSuccessMessage}</span>
                  </div>
                  <button
                    onClick={onNavigateToPlayer}
                    className="underline text-emerald-300 hover:text-white font-medium cursor-pointer"
                  >
                    Buka Player →
                  </button>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                {/* 1. Tombol Simpan ke Playlist Player */}
                <button
                  type="button"
                  onClick={() => handleSaveToPlayer(false)}
                  className="w-full py-2.5 px-3 bg-neutral-800 hover:bg-neutral-700 text-white rounded-xl text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
                >
                  <Bookmark className="w-3.5 h-3.5 text-rose-400" />
                  <span>Simpan ke Player</span>
                </button>

                {/* 2. Tombol Simpan & Langsung Buka Menu Player */}
                <button
                  type="button"
                  onClick={() => handleSaveToPlayer(true)}
                  className="w-full py-2.5 px-3 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-md shadow-rose-950/40"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>Simpan & Buka Player</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
