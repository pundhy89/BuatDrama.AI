import React, { useState, useRef, useEffect } from 'react';
import { DramaProject, DramaScene, DramaDialogue, DramaCharacter, DramaRoom, DramaEpisode } from '../types/drama';
import { playBrowserSpeechFallback, stopSpeechSynthesis } from '../utils/speechFallback';
import {
  Film,
  Sparkles,
  Plus,
  Trash2,
  Volume2,
  VolumeX,
  Play,
  Square,
  Video,
  Loader2,
  Camera,
  MapPin,
  Smile,
  Quote,
  Edit3,
  SlidersHorizontal,
  ChevronDown,
  ChevronUp,
  Clock,
  Layers,
  BookOpen,
  Calendar,
  AlertCircle,
  Copy,
  ArrowUp,
  ArrowDown,
  Check,
} from 'lucide-react';
import { ConfirmModal } from './ConfirmModal';

interface ScriptStudioProps {
  project: DramaProject;
  onUpdateProject: (project: DramaProject) => void;
  characters: DramaCharacter[];
  rooms: DramaRoom[];
  onNavigateToAnimate: (scene: DramaScene) => void;
}

const DRAMA_GENRES = [
  'Drama Intrik Konglomerat & Kekuasaan',
  'Drama Romansa & Rahasia Masa Lalu',
  'Misteri Pembunuhan & Thriller Meja Hijau',
  'Kerajaan Nusantara & Perebutan Tahta',
  'Melodrama Kedokteran & Rumah Sakit',
  'Komedi Romantis Perkantoran',
];

export const ScriptStudio: React.FC<ScriptStudioProps> = ({
  project,
  onUpdateProject,
  characters,
  rooms,
  onNavigateToAnimate,
}) => {
  // Initialize episodes from project or fallback
  const getInitialEpisodes = (): DramaEpisode[] => {
    if (project.episodes && project.episodes.length > 0) {
      return project.episodes;
    }
    // Backward compatibility: create Episode 1 with existing scenes
    return [
      {
        id: 'ep-1',
        episodeNumber: 1,
        title: project.episodeTitle || 'Episode 1: Perjanjian Tanpa Hati',
        synopsis: project.episodesSummary?.[0] || 'Pertemuan tak terduga yang memulai konflik keluarga.',
        scenes: project.scenes && project.scenes.length > 0 ? project.scenes : [],
      },
    ];
  };

  const [episodes, setEpisodes] = useState<DramaEpisode[]>(getInitialEpisodes);
  const [activeEpisodeId, setActiveEpisodeId] = useState<string>(() => {
    const initial = getInitialEpisodes();
    return initial[0]?.id || 'ep-1';
  });

  const [isGeneratingScript, setIsGeneratingScript] = useState(false);
  const [storyPrompt, setStoryPrompt] = useState('');
  const [selectedGenre, setSelectedGenre] = useState(project.genre);
  const [scenesCount, setScenesCount] = useState<number>(3);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Audio dialogue playback state
  const [playingDialogueId, setPlayingDialogueId] = useState<string | null>(null);
  const [isLoadingAudioId, setIsLoadingAudioId] = useState<string | null>(null);
  const [playingSceneSequenceId, setPlayingSceneSequenceId] = useState<string | null>(null);
  const audioPlayerRef = useRef<HTMLAudioElement | null>(null);

  // Synchronize when external project changes
  useEffect(() => {
    if (project.episodes && project.episodes.length > 0) {
      setEpisodes(project.episodes);
      if (!project.episodes.some((e) => e.id === activeEpisodeId)) {
        setActiveEpisodeId(project.episodes[0].id);
      }
    }
  }, [project.episodes]);

  // Find active episode or fallback to first
  const activeEpisode = episodes.find((e) => e.id === activeEpisodeId) || episodes[0] || {
    id: 'ep-1',
    episodeNumber: 1,
    title: 'Episode 1',
    synopsis: '',
    scenes: [],
  };

  // Helper to sync episodes state back to project
  const updateEpisodesAndProject = (newEpisodes: DramaEpisode[]) => {
    setEpisodes(newEpisodes);
    // Flatten all scenes to keep project.scenes synchronized
    const allScenes = newEpisodes.flatMap((ep) =>
      ep.scenes.map((sc) => ({ ...sc, episodeNumber: ep.episodeNumber }))
    );
    const activeEp = newEpisodes.find((e) => e.id === activeEpisodeId) || newEpisodes[0];

    onUpdateProject({
      ...project,
      episodes: newEpisodes,
      scenes: allScenes,
      episodeTitle: activeEp ? activeEp.title : project.episodeTitle,
    });
  };

  // --- 1. EPISODE MANAGEMENT ---
  const handleAddEpisode = () => {
    const nextNumber = episodes.length + 1;
    const newEp: DramaEpisode = {
      id: `ep-${Date.now()}`,
      episodeNumber: nextNumber,
      title: `Episode ${nextNumber}: Titik Balik Tak Terduga`,
      synopsis: `Kelanjutan konflik dan intrik baru di Episode ${nextNumber}.`,
      scenes: [
        {
          id: `scene-${Date.now()}-1`,
          sceneNumber: 1,
          episodeNumber: nextNumber,
          title: `Adegan Pembuka Episode ${nextNumber}`,
          roomOrLocation: rooms[0]?.name || 'Penthouse Skyline Malam Hari',
          locationType: 'Interior',
          timeOfDay: 'Malam',
          mood: 'Tegang & Emosional',
          lighting: 'Pencahayaan sinematik kontras tinggi',
          cameraDirection: 'Slow push-in shot dari wide angle ke close up',
          visualPrompt: 'Cinematic opening drama scene with tense confrontation',
          durationSeconds: 5,
          dialogues: [
            {
              id: `dlg-${Date.now()}-1`,
              speaker: characters[0]?.name || 'Reyhan Adiwijaya',
              text: 'Aku sudah memperingatkanmu sebelumnya.',
              emotion: 'Dingin dan tegas',
              voiceStyle: 'Bariton berat',
            },
          ],
        },
      ],
    };

    const updated = [...episodes, newEp];
    setActiveEpisodeId(newEp.id);
    updateEpisodesAndProject(updated);
  };

  const [episodeToDelete, setEpisodeToDelete] = useState<DramaEpisode | null>(null);
  const [sceneToDelete, setSceneToDelete] = useState<DramaScene | null>(null);
  const [scriptWarningMessage, setScriptWarningMessage] = useState<string | null>(null);

  const handleDeleteEpisode = (episodeId: string) => {
    if (episodes.length <= 1) {
      setScriptWarningMessage('Serial drama harus memiliki minimal 1 episode.');
      setTimeout(() => setScriptWarningMessage(null), 3500);
      return;
    }

    const targetEp = episodes.find((e) => e.id === episodeId);
    if (targetEp) {
      setEpisodeToDelete(targetEp);
    }
  };

  const handleConfirmDeleteEpisode = () => {
    if (!episodeToDelete) return;
    const episodeId = episodeToDelete.id;
    const remaining = episodes.filter((e) => e.id !== episodeId);
    // Re-number remaining episodes
    const renumbered = remaining.map((e, idx) => ({
      ...e,
      episodeNumber: idx + 1,
      scenes: e.scenes.map((sc) => ({ ...sc, episodeNumber: idx + 1 })),
    }));

    const nextActive = renumbered[0]?.id || '';
    setActiveEpisodeId(nextActive);
    updateEpisodesAndProject(renumbered);
    setEpisodeToDelete(null);
  };

  const handleUpdateActiveEpisode = (fields: Partial<DramaEpisode>) => {
    if (!activeEpisode) return;
    const updated = episodes.map((ep) =>
      ep.id === activeEpisode.id ? { ...ep, ...fields } : ep
    );
    updateEpisodesAndProject(updated);
  };

  // --- 2. SCENE MANAGEMENT KHUSUS UNTUK EPISODE AKTIF ---
  const handleAddSceneToActiveEpisode = () => {
    if (!activeEpisode) return;

    const nextSceneNumber = activeEpisode.scenes.length + 1;
    const defaultRoom = rooms[nextSceneNumber % rooms.length] || rooms[0];
    const defaultChar = characters[0] || { name: 'Tokoh Utama' };

    const newScene: DramaScene = {
      id: `scene-${Date.now()}`,
      sceneNumber: nextSceneNumber,
      episodeNumber: activeEpisode.episodeNumber,
      title: `Adegan ${nextSceneNumber}: Ketegangan Meningkat`,
      roomOrLocation: defaultRoom?.name || 'Penthouse Skyline Malam Hari',
      locationType: 'Interior',
      timeOfDay: 'Malam',
      mood: 'Tegang & Emosional',
      lighting: 'Pencahayaan warm kontras tinggi dengan rim light dramatis',
      cameraDirection: 'Slow push-in camera shot dari medium shot ke close-up emosional',
      visualPrompt: 'Cinematic shot of characters in deep emotional dialogue, dramatic television series quality',
      durationSeconds: 5,
      dialogues: [
        {
          id: `dlg-${Date.now()}-1`,
          speaker: defaultChar.name,
          text: 'Ini bukan akhir dari permainan kita. Aku tahu rahasiamu.',
          emotion: 'Dingin dan bertekad',
          voiceStyle: 'Bariton berat, suara rendah',
        },
      ],
    };

    const updatedScenes = [...activeEpisode.scenes, newScene];
    handleUpdateActiveEpisode({ scenes: updatedScenes });
  };

  const handleDeleteSceneFromActiveEpisode = (sceneId: string) => {
    if (!activeEpisode) return;

    if (activeEpisode.scenes.length <= 1) {
      setScriptWarningMessage('Episode ini harus memiliki minimal 1 adegan (scene). Tambahkan adegan baru terlebih dahulu sebelum menghapus ini.');
      setTimeout(() => setScriptWarningMessage(null), 3500);
      return;
    }

    const targetScene = activeEpisode.scenes.find((sc) => sc.id === sceneId);
    if (targetScene) {
      setSceneToDelete(targetScene);
    }
  };

  const handleConfirmDeleteScene = () => {
    if (!sceneToDelete || !activeEpisode) return;
    const sceneId = sceneToDelete.id;
    const remainingScenes = activeEpisode.scenes.filter((sc) => sc.id !== sceneId);
    // Re-number scenes sequentially
    const renumbered = remainingScenes.map((sc, idx) => ({
      ...sc,
      sceneNumber: idx + 1,
    }));

    handleUpdateActiveEpisode({ scenes: renumbered });
    setSceneToDelete(null);
  };

  const handleDuplicateScene = (scene: DramaScene) => {
    if (!activeEpisode) return;

    const nextNumber = activeEpisode.scenes.length + 1;
    const cloned: DramaScene = {
      ...scene,
      id: `scene-${Date.now()}`,
      sceneNumber: nextNumber,
      title: `${scene.title} (Salinan)`,
      dialogues: scene.dialogues.map((d, dIdx) => ({
        ...d,
        id: `dlg-${Date.now()}-${dIdx}`,
      })),
    };

    handleUpdateActiveEpisode({ scenes: [...activeEpisode.scenes, cloned] });
  };

  const handleMoveScene = (index: number, direction: 'up' | 'down') => {
    if (!activeEpisode) return;
    const scenes = [...activeEpisode.scenes];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;

    if (targetIndex < 0 || targetIndex >= scenes.length) return;

    // Swap scenes
    const temp = scenes[index];
    scenes[index] = scenes[targetIndex];
    scenes[targetIndex] = temp;

    // Renumber scenes
    const renumbered = scenes.map((sc, idx) => ({
      ...sc,
      sceneNumber: idx + 1,
    }));

    handleUpdateActiveEpisode({ scenes: renumbered });
  };

  const handleUpdateSceneInActiveEpisode = (sceneId: string, fields: Partial<DramaScene>) => {
    if (!activeEpisode) return;
    const updatedScenes = activeEpisode.scenes.map((sc) =>
      sc.id === sceneId ? { ...sc, ...fields } : sc
    );
    handleUpdateActiveEpisode({ scenes: updatedScenes });
  };

  // --- 3. DIALOGUE MANAGEMENT ---
  const handleAddDialogue = (sceneId: string) => {
    if (!activeEpisode) return;
    const targetScene = activeEpisode.scenes.find((sc) => sc.id === sceneId);
    if (!targetScene) return;

    // Pick alternating character if available
    const lastSpeaker = targetScene.dialogues[targetScene.dialogues.length - 1]?.speaker;
    const nextChar = characters.find((c) => c.name !== lastSpeaker) || characters[0];

    const newDlg: DramaDialogue = {
      id: `dlg-${Date.now()}`,
      speaker: nextChar?.name || 'Tokoh Utama',
      text: 'Tulis kalimat dialog baru di sini...',
      emotion: 'Serius',
      voiceStyle: 'Berwibawa',
    };

    handleUpdateSceneInActiveEpisode(sceneId, {
      dialogues: [...targetScene.dialogues, newDlg],
    });
  };

  const handleDeleteDialogue = (sceneId: string, dialogueId: string) => {
    if (!activeEpisode) return;
    const targetScene = activeEpisode.scenes.find((sc) => sc.id === sceneId);
    if (!targetScene) return;

    if (targetScene.dialogues.length <= 1) {
      setScriptWarningMessage('Adegan harus memiliki minimal 1 baris dialog.');
      setTimeout(() => setScriptWarningMessage(null), 3500);
      return;
    }

    const remaining = targetScene.dialogues.filter((d) => d.id !== dialogueId);
    handleUpdateSceneInActiveEpisode(sceneId, { dialogues: remaining });
  };

  // --- 4. PLAY DIALOGUE VOICE (TTS DENGAN TOMBOL DI BAWAH TEXT) ---
  const handleStopAudio = () => {
    if (audioPlayerRef.current) {
      audioPlayerRef.current.pause();
      audioPlayerRef.current.currentTime = 0;
    }
    stopSpeechSynthesis();
    setPlayingDialogueId(null);
    setPlayingSceneSequenceId(null);
  };

  const handlePlayDialogueVoice = async (dialogue: DramaDialogue) => {
    // If currently speaking this dialogue, stop it
    if (playingDialogueId === dialogue.id) {
      handleStopAudio();
      return;
    }

    handleStopAudio();

    const speakerChar = characters.find(
      (c) => c.name.toLowerCase() === dialogue.speaker.toLowerCase()
    );
    const voiceName = speakerChar?.recommendedVoice || 'Kore';

    setIsLoadingAudioId(dialogue.id);

    try {
      const response = await fetch('/api/drama/generate-voice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: dialogue.text,
          voiceName: voiceName,
          style: `${dialogue.emotion}, ${dialogue.voiceStyle || 'drama actor style'}`,
        }),
      });

      const data = await response.json();
      if (!response.ok && !data.fallbackSpeech) {
        throw new Error(data.error || 'Gagal menghasilkan sulih suara dialog.');
      }

      if (data.fallbackSpeech || !data.audioUrl) {
        setPlayingDialogueId(dialogue.id);
        playBrowserSpeechFallback(
          dialogue.text,
          voiceName,
          () => setPlayingDialogueId(null),
          () => setPlayingDialogueId(null)
        );
        return;
      }

      if (audioPlayerRef.current) {
        audioPlayerRef.current.src = data.audioUrl;
        audioPlayerRef.current.play();
        setPlayingDialogueId(dialogue.id);
      }
    } catch (err: any) {
      console.warn('Gemini TTS unavailable, using browser speech synthesis fallback:', err);
      setPlayingDialogueId(dialogue.id);
      playBrowserSpeechFallback(
        dialogue.text,
        voiceName,
        () => setPlayingDialogueId(null),
        () => setPlayingDialogueId(null)
      );
    } finally {
      setIsLoadingAudioId(null);
    }
  };

  // Play whole scene dialogues in sequence
  const handlePlaySceneSequence = async (scene: DramaScene) => {
    if (playingSceneSequenceId === scene.id) {
      handleStopAudio();
      return;
    }

    handleStopAudio();
    setPlayingSceneSequenceId(scene.id);

    let idx = 0;
    const playNext = async () => {
      if (idx >= scene.dialogues.length) {
        setPlayingSceneSequenceId(null);
        setPlayingDialogueId(null);
        return;
      }

      const currentDlg = scene.dialogues[idx];
      setPlayingDialogueId(currentDlg.id);
      const speakerChar = characters.find(
        (c) => c.name.toLowerCase() === currentDlg.speaker.toLowerCase()
      );
      const voiceName = speakerChar?.recommendedVoice || 'Kore';

      try {
        const response = await fetch('/api/drama/generate-voice', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text: currentDlg.text,
            voiceName,
            style: `${currentDlg.emotion}, serial drama actor dialogue`,
          }),
        });

        const data = await response.json();
        if (data.fallbackSpeech || !data.audioUrl) {
          playBrowserSpeechFallback(
            currentDlg.text,
            voiceName,
            () => {
              idx++;
              setTimeout(playNext, 400);
            },
            () => {
              idx++;
              setTimeout(playNext, 400);
            }
          );
          return;
        }

        if (audioPlayerRef.current) {
          audioPlayerRef.current.src = data.audioUrl;
          audioPlayerRef.current.onended = () => {
            idx++;
            setTimeout(playNext, 400);
          };
          audioPlayerRef.current.play();
        }
      } catch (e) {
        playBrowserSpeechFallback(
          currentDlg.text,
          voiceName,
          () => {
            idx++;
            setTimeout(playNext, 400);
          },
          () => {
            idx++;
            setTimeout(playNext, 400);
          }
        );
      }
    };

    playNext();
  };

  // --- 5. AI SCRIPT GENERATOR ---
  const handleGenerateScriptWithAi = async () => {
    setIsGeneratingScript(true);
    setErrorMessage(null);

    try {
      const charSummaries = characters.map((c) => ({
        name: c.name,
        role: c.role,
        voice: c.recommendedVoice,
      }));

      const response = await fetch('/api/drama/generate-script', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: storyPrompt || 'Pertemuan tak terduga yang mengungkap rahasia keluarga besar konglomerat',
          title: project.title,
          genre: selectedGenre,
          characters: charSummaries,
          scenesCount,
          tone: project.tone,
        }),
      });

      const resData = await response.json();
      if (!response.ok || !resData.success) {
        throw new Error(resData.error || 'Gagal menghasilkan naskah drama.');
      }

      const generated = resData.data;

      // Transform scenes into full DramaScene structure
      const newScenes: DramaScene[] = (generated.scenes || []).map((sc: any, idx: number) => ({
        id: `scene-${Date.now()}-${idx}`,
        sceneNumber: sc.sceneNumber || idx + 1,
        episodeNumber: activeEpisode?.episodeNumber || 1,
        title: sc.title || `Adegan ${idx + 1}`,
        roomOrLocation: sc.roomOrLocation || rooms[0]?.name || 'Penthouse Skyline Malam Hari',
        locationType: sc.locationType || 'Interior',
        timeOfDay: sc.timeOfDay || 'Malam',
        mood: sc.mood || 'Intens',
        lighting: sc.lighting || 'Pencahayaan sinematik dramatis',
        cameraDirection: sc.cameraDirection || 'Slow push-in shot',
        visualPrompt: sc.visualPrompt || 'Cinematic television drama shot',
        durationSeconds: sc.durationSeconds || 5,
        dialogues: (sc.dialogues || []).map((dlg: any, dIdx: number) => ({
          id: `dlg-${Date.now()}-${idx}-${dIdx}`,
          speaker: dlg.speaker || characters[0]?.name || 'Tokoh',
          text: dlg.text || '',
          emotion: dlg.emotion || 'Biasa',
          voiceStyle: dlg.voiceStyle || 'Ekspresif',
        })),
      }));

      // Update the active episode with generated scenes
      const updatedEpisode: DramaEpisode = {
        ...activeEpisode,
        title: generated.episodeTitle || activeEpisode.title,
        synopsis: generated.logline || activeEpisode.synopsis,
        scenes: newScenes,
      };

      const updatedEpisodes = episodes.map((ep) =>
        ep.id === activeEpisode.id ? updatedEpisode : ep
      );

      setEpisodes(updatedEpisodes);

      const allScenes = updatedEpisodes.flatMap((ep) =>
        ep.scenes.map((sc) => ({ ...sc, episodeNumber: ep.episodeNumber }))
      );

      onUpdateProject({
        ...project,
        title: generated.title || project.title,
        logline: generated.logline || project.logline,
        genre: generated.genre || selectedGenre,
        tone: generated.tone || project.tone,
        episodeTitle: generated.episodeTitle || project.episodeTitle,
        episodesSummary: generated.episodesSummary || project.episodesSummary,
        episodes: updatedEpisodes,
        scenes: allScenes,
      });

      setStoryPrompt('');
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message || 'Gagal membuat naskah.');
    } finally {
      setIsGeneratingScript(false);
    }
  };

  // Total duration of current active episode scenes
  const totalEpisodeDuration = (activeEpisode?.scenes || []).reduce(
    (acc, sc) => acc + (sc.durationSeconds || 5),
    0
  );

  return (
    <div className="max-w-7xl mx-auto px-4 lg:px-8 py-8">
      {/* Studio Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-neutral-800">
        <div>
          <div className="flex items-center gap-2 text-xs text-rose-500 font-mono tracking-wider uppercase mb-1">
            <SlidersHorizontal className="w-4 h-4" />
            <span>Studio Naskah & Storyboard Serial</span>
          </div>
          <h1 className="text-2xl lg:text-3xl font-display font-bold text-white tracking-tight">
            Naskah Serial & Manajemen Adegan
          </h1>
          <p className="text-sm text-neutral-400 mt-1 max-w-2xl">
            Kelola naskah <strong className="text-rose-400">per episode</strong> secara mandiri, tambah & hapus adegan (scenes), dan dengarkan suara karakter dengan tombol <strong className="text-rose-400">Putar Suara (TTS) tepat di bawah teks</strong> dialog.
          </p>
        </div>

        {/* Generate Script AI Quick Bar */}
        <div className="flex items-center gap-2 bg-neutral-900/90 p-2 rounded-xl border border-neutral-800 shrink-0">
          <input
            type="text"
            value={storyPrompt}
            onChange={(e) => setStoryPrompt(e.target.value)}
            placeholder="Prompt alur cerita episode ini..."
            className="text-xs bg-neutral-950 border border-neutral-800 text-white rounded-lg px-3 py-2 w-48 sm:w-64 focus:outline-none focus:border-rose-500"
          />
          <button
            onClick={handleGenerateScriptWithAi}
            disabled={isGeneratingScript}
            className="flex items-center gap-1.5 px-3 py-2 bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white text-xs font-semibold rounded-lg transition-colors whitespace-nowrap cursor-pointer shadow-md shadow-rose-950/40"
          >
            {isGeneratingScript ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Sparkles className="w-3.5 h-3.5" />
            )}
            <span>Generate Naskah AI</span>
          </button>
        </div>
      </div>

      {errorMessage && (
        <div className="mt-4 p-3 bg-red-950/60 border border-red-800/80 rounded-xl text-xs text-red-200 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {scriptWarningMessage && (
        <div className="mt-4 p-3 bg-amber-950/60 border border-amber-800/80 rounded-xl text-xs text-amber-200 flex items-center gap-2 animate-in fade-in">
          <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
          <span>{scriptWarningMessage}</span>
        </div>
      )}

      {/* Drama Metadata Card */}
      <div className="mt-6 p-5 bg-neutral-900/60 rounded-2xl border border-neutral-800">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2 space-y-2">
            <div className="flex items-center gap-2 text-xs text-rose-400 font-mono">
              <span>{project.genre}</span>
              <span aria-hidden="true">·</span>
              <span>Total {episodes.length} Episode</span>
              <span aria-hidden="true">·</span>
              <span>{project.scenes?.length || 0} Total Adegan</span>
            </div>
            <input
              type="text"
              value={project.title}
              onChange={(e) => onUpdateProject({ ...project, title: e.target.value })}
              className="text-xl md:text-2xl font-display font-bold text-white bg-transparent border-b border-transparent hover:border-neutral-700 focus:border-rose-500 focus:outline-none w-full"
            />
            <p className="text-xs text-neutral-300 leading-relaxed">{project.logline}</p>
          </div>

          <div className="space-y-2 bg-neutral-950/60 p-3.5 rounded-xl border border-neutral-800/80">
            <span className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider block">
              Ringkasan Alur Serial Drama:
            </span>
            <ul className="text-xs text-neutral-300 space-y-1.5 max-h-24 overflow-y-auto">
              {project.episodesSummary.map((ep, i) => (
                <li key={i} className="flex items-start gap-1.5">
                  <span className="text-rose-500 font-mono text-[10px] mt-0.5">•</span>
                  <span className="text-neutral-300 leading-snug">{ep}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 2. PENGATURAN NASKAH PER EPISODE (DIVIDED PER EPISODE)   */}
      {/* ======================================================== */}
      <div className="mt-8 space-y-4">
        {/* Episode Section Heading & Add Button */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-neutral-800">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-rose-950/70 border border-rose-800/60 flex items-center justify-center">
              <BookOpen className="w-4 h-4 text-rose-400" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white font-display flex items-center gap-2">
                <span>Pengaturan Naskah Per Episode</span>
                <span className="text-xs font-mono font-normal text-rose-400 bg-rose-950/50 px-2 py-0.5 rounded-full border border-rose-900/50">
                  {episodes.length} Episode Terdaftar
                </span>
              </h2>
              <p className="text-xs text-neutral-400">
                Pilih episode di bawah untuk mengedit naskah, menambah adegan baru, atau menghapus adegan.
              </p>
            </div>
          </div>

          <button
            onClick={handleAddEpisode}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-neutral-900 hover:bg-neutral-800 text-rose-300 text-xs font-semibold rounded-xl border border-rose-800/50 hover:border-rose-600 transition-all cursor-pointer self-start sm:self-auto shadow-sm"
          >
            <Plus className="w-3.5 h-3.5 text-rose-400" />
            <span>+ Tambah Episode Baru</span>
          </button>
        </div>

        {/* Episode Selector Tabs */}
        <div className="flex items-center gap-2.5 overflow-x-auto pb-2 scrollbar-thin">
          {episodes.map((ep) => {
            const isActive = ep.id === activeEpisodeId;
            const sceneCount = ep.scenes?.length || 0;
            const epDuration = (ep.scenes || []).reduce(
              (acc, sc) => acc + (sc.durationSeconds || 5),
              0
            );

            return (
              <button
                key={ep.id}
                onClick={() => setActiveEpisodeId(ep.id)}
                className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all border cursor-pointer ${
                  isActive
                    ? 'bg-rose-600 text-white border-rose-500 shadow-lg shadow-rose-950/50'
                    : 'bg-neutral-900/90 text-neutral-400 border-neutral-800 hover:border-neutral-700 hover:text-neutral-200'
                }`}
              >
                <div className="flex items-center gap-1.5">
                  <span className={`w-2 h-2 rounded-full ${isActive ? 'bg-white' : 'bg-rose-500/60'}`} />
                  <span>Episode {ep.episodeNumber}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full font-mono ${
                      isActive ? 'bg-white/20 text-white font-bold' : 'bg-neutral-800 text-neutral-300'
                    }`}
                  >
                    {sceneCount} Scene
                  </span>
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded-md font-mono ${
                      isActive ? 'bg-black/25 text-amber-200' : 'bg-neutral-950 text-neutral-400'
                    }`}
                  >
                    {epDuration}s
                  </span>
                </div>
              </button>
            );
          })}

          <button
            onClick={handleAddEpisode}
            className="flex items-center gap-1 px-3 py-2.5 rounded-xl text-xs font-semibold whitespace-nowrap text-neutral-400 hover:text-white bg-neutral-950 hover:bg-neutral-900 border border-dashed border-neutral-800 hover:border-neutral-700 transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Episode Baru</span>
          </button>
        </div>

        {/* Active Episode Detail & Controls Card */}
        {activeEpisode && (
          <div className="p-4 sm:p-5 bg-neutral-900/90 rounded-2xl border border-neutral-800 space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-neutral-800">
              <div className="flex-1 space-y-1.5">
                <div className="flex flex-wrap items-center gap-2 text-xs text-rose-400 font-mono">
                  <span className="font-bold uppercase tracking-wider bg-rose-950/80 px-2 py-0.5 rounded border border-rose-800/60">
                    AKTIF: EPISODE {activeEpisode.episodeNumber}
                  </span>
                  <span aria-hidden="true">·</span>
                  <span className="text-neutral-300 font-medium">
                    {activeEpisode.scenes?.length || 0} Adegan Terstruktur
                  </span>
                  <span aria-hidden="true">·</span>
                  <span className="text-amber-400 flex items-center gap-1 font-mono">
                    <Clock className="w-3.5 h-3.5" />
                    Total Durasi: {totalEpisodeDuration} Detik
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={activeEpisode.title}
                    onChange={(e) => handleUpdateActiveEpisode({ title: e.target.value })}
                    placeholder={`Episode ${activeEpisode.episodeNumber}: Judul Episode`}
                    className="text-lg sm:text-xl font-display font-bold text-white bg-transparent border-b border-neutral-800 hover:border-neutral-600 focus:border-rose-500 focus:outline-none w-full py-0.5"
                  />
                </div>
              </div>

              {/* Episode Level Action Buttons */}
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={handleAddSceneToActiveEpisode}
                  className="flex items-center gap-1.5 px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold rounded-xl shadow-md shadow-rose-950/40 transition-colors cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ Tambah Scene di Ep {activeEpisode.episodeNumber}</span>
                </button>

                {episodes.length > 1 && (
                  <button
                    onClick={() => handleDeleteEpisode(activeEpisode.id)}
                    className="flex items-center gap-1 px-3 py-2 text-neutral-400 hover:text-red-400 rounded-xl hover:bg-red-950/40 border border-neutral-800 hover:border-red-900/60 transition-colors text-xs cursor-pointer"
                    title={`Hapus Episode ${activeEpisode.episodeNumber}`}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Hapus Ep {activeEpisode.episodeNumber}</span>
                  </button>
                )}
              </div>
            </div>

            {/* Episode Synopsis Input */}
            <div>
              <label className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider block mb-1">
                Sinopsis & Konflik Utama Episode {activeEpisode.episodeNumber}:
              </label>
              <textarea
                rows={2}
                value={activeEpisode.synopsis || ''}
                onChange={(e) => handleUpdateActiveEpisode({ synopsis: e.target.value })}
                placeholder="Tuliskan fokus konflik drama pada episode ini (misal: penggeledahan dokumen rahasia, pertemuan dua pewaris)..."
                className="w-full text-xs text-neutral-200 bg-neutral-950 border border-neutral-800 rounded-xl p-2.5 focus:outline-none focus:border-rose-500 leading-relaxed"
              />
            </div>
          </div>
        )}
      </div>

      {/* ======================================================== */}
      {/* 3. DAFTAR SCENE KHUSUS UNTUK EPISODE YANG DIPILIH        */}
      {/* ======================================================== */}
      <div className="mt-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-neutral-800/80">
          <div className="flex items-center gap-2">
            <Film className="w-5 h-5 text-rose-500" />
            <h2 className="text-lg font-bold text-white font-display">
              Adegan (Scenes) · {activeEpisode?.title || `Episode ${activeEpisode.episodeNumber}`}
            </h2>
            <span className="text-xs text-neutral-400 font-mono bg-neutral-900 px-2 py-0.5 rounded-full border border-neutral-800">
              {activeEpisode?.scenes?.length || 0} Scene
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleAddSceneToActiveEpisode}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Tambah Scene Baru</span>
            </button>
          </div>
        </div>

        {/* Scene Cards List for Active Episode */}
        <div className="space-y-6">
          {(activeEpisode?.scenes || []).map((scene, sceneIndex) => {
            const isPlayingThisScene = playingSceneSequenceId === scene.id;

            return (
              <div
                key={scene.id}
                className="bg-neutral-900/60 rounded-2xl border border-neutral-800 overflow-hidden hover:border-neutral-700 transition-colors shadow-lg shadow-black/20"
              >
                {/* Scene Header */}
                <div className="p-4 bg-neutral-950/90 border-b border-neutral-800/90 flex flex-col md:flex-row md:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className="px-3 py-1 rounded-lg bg-rose-950/80 border border-rose-800/60 text-rose-300 text-xs font-mono font-bold shrink-0">
                      Scene {scene.sceneNumber} · Ep {activeEpisode.episodeNumber}
                    </span>
                    <div className="min-w-0">
                      <input
                        type="text"
                        value={scene.title}
                        onChange={(e) =>
                          handleUpdateSceneInActiveEpisode(scene.id, { title: e.target.value })
                        }
                        className="text-sm md:text-base font-semibold text-white bg-transparent border-b border-transparent hover:border-neutral-700 focus:border-rose-500 focus:outline-none w-full"
                        placeholder="Judul Adegan..."
                      />
                      <div className="flex flex-wrap items-center gap-2 text-xs text-neutral-400 mt-0.5">
                        <span className="text-amber-400 flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {scene.roomOrLocation}
                        </span>
                        <span aria-hidden="true">·</span>
                        <span className="text-neutral-500">{scene.timeOfDay}</span>
                        <span aria-hidden="true">·</span>
                        <span className="text-neutral-500">{scene.mood}</span>
                        <span aria-hidden="true">·</span>
                        <span className="text-amber-400/90 font-mono text-[11px] flex items-center gap-1 font-semibold">
                          <Clock className="w-3 h-3" />
                          {scene.durationSeconds || 5} Detik
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Scene Controls & Actions */}
                  <div className="flex items-center gap-1.5 shrink-0 self-end md:self-auto">
                    {/* Reorder Buttons */}
                    <div className="flex items-center bg-neutral-900 rounded-lg border border-neutral-800 p-0.5 mr-1">
                      <button
                        onClick={() => handleMoveScene(sceneIndex, 'up')}
                        disabled={sceneIndex === 0}
                        className="p-1 text-neutral-400 hover:text-white disabled:opacity-30 disabled:hover:text-neutral-400 transition-colors"
                        title="Geser adegan ke atas"
                      >
                        <ArrowUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleMoveScene(sceneIndex, 'down')}
                        disabled={sceneIndex === (activeEpisode.scenes?.length || 1) - 1}
                        className="p-1 text-neutral-400 hover:text-white disabled:opacity-30 disabled:hover:text-neutral-400 transition-colors"
                        title="Geser adegan ke bawah"
                      >
                        <ArrowDown className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Duplicate scene */}
                    <button
                      onClick={() => handleDuplicateScene(scene)}
                      className="p-1.5 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-800 transition-colors"
                      title="Duplikasi adegan ini"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>

                    {/* Animate with Veo shortcut */}
                    <button
                      onClick={() => onNavigateToAnimate(scene)}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-amber-600 to-rose-600 hover:from-amber-500 hover:to-rose-500 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors cursor-pointer"
                      title="Buka studio animasi Veo untuk adegan ini"
                    >
                      <Video className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Animasi (Veo)</span>
                    </button>

                    {/* HAPUS SCENE */}
                    <button
                      onClick={() => handleDeleteSceneFromActiveEpisode(scene.id)}
                      className="flex items-center gap-1 px-2.5 py-1.5 text-red-400/90 hover:text-red-300 rounded-lg bg-red-950/30 hover:bg-red-950/60 border border-red-900/40 hover:border-red-800 transition-colors text-xs cursor-pointer"
                      title="Hapus adegan ini dari episode"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Hapus Scene</span>
                    </button>
                  </div>
                </div>

                {/* Scene Content Body */}
                <div className="p-5 grid grid-cols-1 lg:grid-cols-12 gap-6">
                  {/* Left Column: Ruangan, Kamera, Durasi, Prompt (4 cols) */}
                  <div className="lg:col-span-4 space-y-4 border-r-0 lg:border-r border-neutral-800/80 pr-0 lg:pr-6">
                    {/* Location selector */}
                    <div>
                      <label className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider block mb-1.5">
                        Latar Ruangan / Set
                      </label>
                      <select
                        value={scene.roomOrLocation}
                        onChange={(e) =>
                          handleUpdateSceneInActiveEpisode(scene.id, {
                            roomOrLocation: e.target.value,
                          })
                        }
                        className="w-full text-xs bg-neutral-950 border border-neutral-800 text-neutral-200 rounded-lg p-2 focus:outline-none focus:border-rose-500"
                      >
                        {rooms.map((r) => (
                          <option key={r.id} value={r.name}>
                            {r.name} ({r.category})
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Camera Direction & Lighting */}
                    <div>
                      <div className="flex items-center gap-1.5 text-[11px] font-semibold text-neutral-400 uppercase tracking-wider mb-1.5">
                        <Camera className="w-3.5 h-3.5 text-cyan-400" />
                        <span>Arah Kamera & Lighting</span>
                      </div>
                      <p className="text-xs text-neutral-300 bg-neutral-950/70 p-2.5 rounded-lg border border-neutral-800 leading-relaxed">
                        {scene.cameraDirection}
                      </p>
                      <p className="text-[11px] text-neutral-500 mt-1 italic">
                        Lighting: {scene.lighting}
                      </p>
                    </div>

                    {/* DURATION INPUT FIELD (DETIK) */}
                    <div>
                      <div className="flex items-center justify-between text-[11px] font-semibold text-neutral-400 uppercase tracking-wider mb-1.5">
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-amber-400" />
                          <span>Durasi Video Klip (Detik)</span>
                        </div>
                        <span className="font-mono text-amber-400 text-xs tabular-nums font-semibold">
                          {scene.durationSeconds || 5}s
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="relative flex-1">
                          <input
                            type="number"
                            min={1}
                            max={60}
                            value={scene.durationSeconds || 5}
                            onChange={(e) => {
                              const raw = parseInt(e.target.value);
                              const val = isNaN(raw) ? 1 : Math.max(1, Math.min(60, raw));
                              handleUpdateSceneInActiveEpisode(scene.id, {
                                durationSeconds: val,
                              });
                            }}
                            className="w-full text-xs font-mono tabular-nums bg-neutral-950 border border-neutral-800 text-white rounded-lg px-3 py-2 pr-14 focus:outline-none focus:border-amber-500"
                            placeholder="5"
                          />
                          <span className="absolute right-2.5 top-2 text-[11px] text-neutral-500 font-mono pointer-events-none">
                            detik
                          </span>
                        </div>

                        {/* Quick Presets */}
                        <div className="flex items-center gap-1">
                          {[5, 8, 10, 15].map((presetSec) => (
                            <button
                              key={presetSec}
                              type="button"
                              onClick={() =>
                                handleUpdateSceneInActiveEpisode(scene.id, {
                                  durationSeconds: presetSec,
                                })
                              }
                              className={`px-2 py-1.5 text-[11px] font-mono rounded-lg transition-colors border cursor-pointer ${
                                (scene.durationSeconds || 5) === presetSec
                                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 font-semibold'
                                  : 'bg-neutral-950 text-neutral-400 border-neutral-800 hover:border-neutral-700 hover:text-neutral-200'
                              }`}
                              title={`Set durasi ${presetSec} detik`}
                            >
                              {presetSec}s
                            </button>
                          ))}
                        </div>
                      </div>
                      <span className="text-[10px] text-neutral-500 block mt-1">
                        Ekspektasi panjang video adegan yang digenerate oleh Veo.
                      </span>
                    </div>

                    {/* Visual Prompt for Veo */}
                    <div>
                      <span className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider block mb-1.5">
                        Prompt Visual Veo
                      </span>
                      <textarea
                        rows={2}
                        value={scene.visualPrompt}
                        onChange={(e) =>
                          handleUpdateSceneInActiveEpisode(scene.id, {
                            visualPrompt: e.target.value,
                          })
                        }
                        className="w-full text-[11px] font-mono bg-neutral-950 border border-neutral-800 text-neutral-300 rounded-lg p-2 focus:outline-none focus:border-rose-500"
                      />
                    </div>
                  </div>

                  {/* Right Column: Dialogues List with PUTAR SUARA DI BAWAH TEXT (8 cols) */}
                  <div className="lg:col-span-8 space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-1 border-b border-neutral-800/60">
                      <span className="text-xs font-semibold text-neutral-400 uppercase tracking-wider flex items-center gap-1.5">
                        <span>Dialog Tokoh & Sulih Suara ({scene.dialogues.length})</span>
                      </span>

                      <div className="flex items-center gap-2">
                        {/* Play All Dialogues in Scene */}
                        <button
                          onClick={() => handlePlaySceneSequence(scene)}
                          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                            isPlayingThisScene
                              ? 'bg-rose-600 text-white shadow-sm'
                              : 'bg-neutral-900 hover:bg-neutral-800 text-neutral-300 border border-neutral-800'
                          }`}
                          title="Dengarkan seluruh dialog adegan secara berurutan"
                        >
                          {isPlayingThisScene ? (
                            <>
                              <Square className="w-3 h-3 fill-current" />
                              <span>Hentikan Audio Adegan</span>
                            </>
                          ) : (
                            <>
                              <Play className="w-3 h-3 fill-current text-rose-400" />
                              <span>Putar Semua Suara Adegan</span>
                            </>
                          )}
                        </button>

                        <button
                          onClick={() => handleAddDialogue(scene.id)}
                          className="flex items-center gap-1 text-xs text-rose-400 hover:text-rose-300 font-semibold px-2 py-1 rounded-lg bg-rose-950/40 border border-rose-900/50 hover:bg-rose-950/70 transition-colors cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>+ Tambah Dialog</span>
                        </button>
                      </div>
                    </div>

                    {/* Dialogues list */}
                    <div className="space-y-3.5">
                      {scene.dialogues.map((dlg, dIdx) => {
                        const isSpeaking = playingDialogueId === dlg.id;
                        const isLoading = isLoadingAudioId === dlg.id;
                        const speakerChar = characters.find(
                          (c) => c.name.toLowerCase() === dlg.speaker.toLowerCase()
                        );

                        return (
                          <div
                            key={dlg.id}
                            className={`p-3.5 bg-neutral-950/90 rounded-xl border transition-all ${
                              isSpeaking
                                ? 'border-rose-500 shadow-md shadow-rose-950/40 ring-1 ring-rose-500/40'
                                : 'border-neutral-800/90 hover:border-neutral-700'
                            }`}
                          >
                            {/* Dialogue Top Meta: Speaker Selector, Emotion Tag, and Delete */}
                            <div className="flex items-center justify-between gap-2 mb-2">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-[10px] font-mono text-neutral-500">#{dIdx + 1}</span>
                                <select
                                  value={dlg.speaker}
                                  onChange={(e) => {
                                    const newDlgs = scene.dialogues.map((d) =>
                                      d.id === dlg.id ? { ...d, speaker: e.target.value } : d
                                    );
                                    handleUpdateSceneInActiveEpisode(scene.id, {
                                      dialogues: newDlgs,
                                    });
                                  }}
                                  className="text-xs font-semibold text-rose-300 bg-neutral-900 border border-neutral-800 rounded-lg px-2.5 py-1 focus:outline-none focus:border-rose-500"
                                >
                                  {characters.map((c) => (
                                    <option key={c.id} value={c.name}>
                                      {c.name} ({c.role})
                                    </option>
                                  ))}
                                </select>

                                <input
                                  type="text"
                                  value={dlg.emotion}
                                  onChange={(e) => {
                                    const newDlgs = scene.dialogues.map((d) =>
                                      d.id === dlg.id ? { ...d, emotion: e.target.value } : d
                                    );
                                    handleUpdateSceneInActiveEpisode(scene.id, {
                                      dialogues: newDlgs,
                                    });
                                  }}
                                  placeholder="Emosi (dingin, tertawa sinis...)"
                                  className="text-[11px] text-neutral-300 bg-neutral-900 border border-neutral-800 rounded-lg px-2 py-1 w-36 focus:outline-none focus:border-rose-500"
                                />
                              </div>

                              <button
                                onClick={() => handleDeleteDialogue(scene.id, dlg.id)}
                                className="p-1 text-neutral-500 hover:text-red-400 rounded-lg hover:bg-neutral-900 transition-colors"
                                title="Hapus dialog ini"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>

                            {/* DIALOGUE TEXT INPUT */}
                            <textarea
                              rows={2}
                              value={dlg.text}
                              onChange={(e) => {
                                const newDlgs = scene.dialogues.map((d) =>
                                  d.id === dlg.id ? { ...d, text: e.target.value } : d
                                );
                                handleUpdateSceneInActiveEpisode(scene.id, {
                                  dialogues: newDlgs,
                                });
                              }}
                              className="w-full text-xs text-neutral-100 bg-neutral-900/80 border border-neutral-800 rounded-xl p-2.5 focus:outline-none focus:border-rose-500 leading-relaxed font-sans"
                              placeholder="Tulis kalimat dialog karakter drama di sini..."
                            />

                            {/* ======================================================== */}
                            {/* 1. PUTAR SUARA DILETAKKAN TEPAT DI BAWAH TEXT DIALOG     */}
                            {/* ======================================================== */}
                            <div className="mt-2.5 pt-2 border-t border-neutral-900 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                              {/* Character Voice identity badge */}
                              <div className="flex items-center gap-1.5 text-[11px] text-neutral-400 font-mono">
                                <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0" />
                                <span>Suara: <strong className="text-neutral-200">{speakerChar?.recommendedVoice || 'Kore'}</strong></span>
                                <span className="text-neutral-600">·</span>
                                <span className="text-neutral-400 truncate max-w-[180px]">
                                  {speakerChar?.voicePersona || 'Standar TV Drama'}
                                </span>
                              </div>

                              {/* Prominent Play Voice (TTS) button right below text */}
                              <div className="flex items-center gap-2 self-end sm:self-auto">
                                <button
                                  onClick={() => handlePlayDialogueVoice(dlg)}
                                  disabled={isLoading}
                                  className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer shadow-sm ${
                                    isSpeaking
                                      ? 'bg-rose-600 hover:bg-rose-500 text-white ring-2 ring-rose-400/50 shadow-rose-950/60'
                                      : 'bg-neutral-900 hover:bg-neutral-800 text-rose-300 border border-rose-900/50 hover:border-rose-700'
                                  }`}
                                  title="Putar suara karakter (Gemini TTS)"
                                >
                                  {isLoading ? (
                                    <>
                                      <Loader2 className="w-3.5 h-3.5 animate-spin text-rose-400" />
                                      <span>Membuat Suara...</span>
                                    </>
                                  ) : isSpeaking ? (
                                    <>
                                      <Square className="w-3.5 h-3.5 fill-current text-white animate-pulse" />
                                      <span>Hentikan Suara</span>
                                    </>
                                  ) : (
                                    <>
                                      <Volume2 className="w-3.5 h-3.5 text-rose-400" />
                                      <span>Putar Suara (TTS)</span>
                                    </>
                                  )}
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Big Prominent Card: Tambah Scene Baru ke Episode ini */}
        <button
          onClick={handleAddSceneToActiveEpisode}
          className="w-full py-5 rounded-2xl border-2 border-dashed border-neutral-800 hover:border-rose-600/70 bg-neutral-950/50 hover:bg-rose-950/10 transition-all flex flex-col items-center justify-center gap-2 group cursor-pointer"
        >
          <div className="w-10 h-10 rounded-full bg-neutral-900 group-hover:bg-rose-600/20 border border-neutral-800 group-hover:border-rose-500/50 flex items-center justify-center transition-colors">
            <Plus className="w-5 h-5 text-neutral-400 group-hover:text-rose-400" />
          </div>
          <div className="text-center">
            <span className="text-sm font-semibold text-neutral-200 group-hover:text-white block">
              + Tambah Scene Baru ke Episode {activeEpisode.episodeNumber}
            </span>
            <span className="text-xs text-neutral-500 block mt-0.5">
              Buat adegan drama berikutnya dengan set lokasi, durasi klip video, dan dialog baru
            </span>
          </div>
        </button>
      </div>

      {/* Hidden HTML Audio Player */}
      <audio
        ref={audioPlayerRef}
        onEnded={() => {
          setPlayingDialogueId(null);
        }}
        className="hidden"
      />

      {/* Delete Episode Confirmation Modal */}
      <ConfirmModal
        isOpen={Boolean(episodeToDelete)}
        title={`Hapus Episode ${episodeToDelete?.episodeNumber || ''}: "${episodeToDelete?.title || ''}"?`}
        description="Episode ini beserta seluruh daftar adegan dan dialog di dalamnya akan dihapus dari serial drama."
        confirmLabel="Ya, Hapus Episode"
        onConfirm={handleConfirmDeleteEpisode}
        onCancel={() => setEpisodeToDelete(null)}
      />

      {/* Delete Scene Confirmation Modal */}
      <ConfirmModal
        isOpen={Boolean(sceneToDelete)}
        title={`Hapus Adegan "${sceneToDelete?.title || ''}"?`}
        description={`Adegan ini akan dihapus dari Episode ${activeEpisode?.episodeNumber || 1}.`}
        confirmLabel="Ya, Hapus Adegan"
        onConfirm={handleConfirmDeleteScene}
        onCancel={() => setSceneToDelete(null)}
      />
    </div>
  );
};
