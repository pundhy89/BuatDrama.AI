import React, { useState, useEffect } from 'react';
import { DramaProject, DramaCharacter, DramaRoom, DramaScene, SavedVideoClip } from './types/drama';
import { PRESET_DRAMA_PROJECT, PRESET_CHARACTERS, PRESET_ROOMS } from './data/presets';
import { Header, ActiveTab } from './components/Header';
import { ScriptStudio } from './components/ScriptStudio';
import { CharacterStudio } from './components/CharacterStudio';
import { RoomStudio } from './components/RoomStudio';
import { AnimatePhotoStudio } from './components/AnimatePhotoStudio';
import { ClipPlayerStudio } from './components/ClipPlayerStudio';
import { DirectorPlayerModal } from './components/DirectorPlayerModal';
import { ExportModal } from './components/ExportModal';
import { NewDramaModal } from './components/NewDramaModal';
import { Film, Video, Users, Play, Sparkles, SlidersHorizontal } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('script');
  const [project, setProject] = useState<DramaProject>(() => {
    try {
      const saved =
        typeof window !== 'undefined' && window.localStorage
          ? localStorage.getItem('buatdrama_project') || localStorage.getItem('cinedrama_project')
          : null;
      if (saved) {
        const parsed = JSON.parse(saved);
        if (!parsed.episodes || parsed.episodes.length === 0) {
          if (PRESET_DRAMA_PROJECT.episodes && PRESET_DRAMA_PROJECT.episodes.length > 0) {
            parsed.episodes = PRESET_DRAMA_PROJECT.episodes;
          } else {
            parsed.episodes = [
              {
                id: 'ep-1',
                episodeNumber: 1,
                title: parsed.episodeTitle || 'Episode 1: Perjanjian Tanpa Hati',
                synopsis: parsed.episodesSummary?.[0] || 'Pertemuan tak terduga yang memulai konflik keluarga.',
                scenes: parsed.scenes || [],
              },
            ];
          }
        }
        if (!parsed.savedClips || parsed.savedClips.length === 0) {
          parsed.savedClips = PRESET_DRAMA_PROJECT.savedClips || [];
        }
        return parsed;
      }
    } catch (e) {
      console.warn('Error reading from localStorage:', e);
    }
    return PRESET_DRAMA_PROJECT;
  });

  const [characters, setCharacters] = useState<DramaCharacter[]>(() => {
    return project.characters?.length ? project.characters : PRESET_CHARACTERS;
  });

  const [rooms, setRooms] = useState<DramaRoom[]>(() => {
    return project.rooms?.length ? project.rooms : PRESET_ROOMS;
  });

  // Modal states
  const [isPlayerOpen, setIsPlayerOpen] = useState(false);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [isNewDramaOpen, setIsNewDramaOpen] = useState(false);

  // Sync project to characters and rooms, and persist safely
  useEffect(() => {
    try {
      const updated = { ...project, characters, rooms };
      const serialized = JSON.stringify(updated);
      try {
        localStorage.setItem('buatdrama_project', serialized);
        localStorage.setItem('cinedrama_project', serialized);
      } catch (storageError) {
        console.warn('localStorage quota exceeded, pruning heavy media before storing:', storageError);
        // Prune large base64/blob data to stay well within localStorage limits
        const pruned = {
          ...updated,
          characters: updated.characters.map((c) => ({
            ...c,
            customUploadedPhoto:
              c.customUploadedPhoto && c.customUploadedPhoto.length > 50000
                ? undefined
                : c.customUploadedPhoto,
          })),
          rooms: updated.rooms.map((r) => ({
            ...r,
            customUploadedPhoto:
              r.customUploadedPhoto && r.customUploadedPhoto.length > 50000
                ? undefined
                : r.customUploadedPhoto,
          })),
          scenes: updated.scenes.map((s) => ({
            ...s,
            customImageUrl:
              s.customImageUrl && s.customImageUrl.length > 50000
                ? undefined
                : s.customImageUrl,
            videoUrl: s.videoUrl?.startsWith('blob:') ? undefined : s.videoUrl,
          })),
          savedClips: updated.savedClips?.map((c) => ({
            ...c,
            videoUrl: c.videoUrl?.startsWith('blob:') ? '' : c.videoUrl,
          })),
        };
        try {
          const prunedSerialized = JSON.stringify(pruned);
          localStorage.setItem('buatdrama_project', prunedSerialized);
        } catch (innerErr) {
          console.warn('Unable to persist even pruned data to localStorage:', innerErr);
        }
      }
    } catch (e) {
      console.warn('Error serializing project for localStorage:', e);
    }
  }, [project, characters, rooms]);

  const handleUpdateCharacters = (newChars: DramaCharacter[]) => {
    setCharacters(newChars);
    setProject((prev) => ({ ...prev, characters: newChars }));
  };

  const handleUpdateRooms = (newRooms: DramaRoom[]) => {
    setRooms(newRooms);
    setProject((prev) => ({ ...prev, rooms: newRooms }));
  };

  // Preloaded scene when navigating from ScriptStudio to AnimatePhotoStudio
  const [preloadedSceneForAnimate, setPreloadedSceneForAnimate] = useState<DramaScene | null>(null);

  const handleNavigateToAnimate = (scene: DramaScene) => {
    setPreloadedSceneForAnimate(scene);
    setActiveTab('animate');
  };

  const handleAttachVideoToScene = (sceneId: string, videoUrl: string) => {
    setProject((prev) => ({
      ...prev,
      scenes: prev.scenes.map((sc) =>
        sc.id === sceneId ? { ...sc, videoUrl, videoStatus: 'ready' } : sc
      ),
    }));
  };

  const handleSaveClipToPlayer = (newClip: SavedVideoClip) => {
    setProject((prev) => {
      const existing = prev.savedClips || [];
      return {
        ...prev,
        savedClips: [newClip, ...existing],
      };
    });
  };

  const handleUpdateSavedClips = (newClips: SavedVideoClip[]) => {
    setProject((prev) => ({
      ...prev,
      savedClips: newClips,
    }));
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col selection:bg-rose-500/30 selection:text-rose-200">
      {/* 3-Zone Top Bar Navigation */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onNewDramaClick={() => setIsNewDramaOpen(true)}
        onOpenPlayer={() => setIsPlayerOpen(true)}
        onExportClick={() => setIsExportOpen(true)}
        currentProjectTitle={project.title}
      />

      {/* Main Workspace Canvas */}
      <main className="flex-1 pb-16 lg:pb-0">
        {activeTab === 'script' && (
          <ScriptStudio
            project={project}
            onUpdateProject={setProject}
            characters={characters}
            rooms={rooms}
            onNavigateToAnimate={handleNavigateToAnimate}
          />
        )}

        {activeTab === 'characters' && (
          <CharacterStudio
            characters={characters}
            onUpdateCharacters={handleUpdateCharacters}
            dramaGenre={project.genre}
          />
        )}

        {activeTab === 'rooms' && (
          <RoomStudio
            rooms={rooms}
            onUpdateRooms={handleUpdateRooms}
            dramaGenre={project.genre}
          />
        )}

        {activeTab === 'animate' && (
          <AnimatePhotoStudio
            characters={characters}
            rooms={rooms}
            scenes={project.scenes}
            episodes={project.episodes || []}
            preloadedScene={preloadedSceneForAnimate}
            onAttachVideoToScene={handleAttachVideoToScene}
            onSaveClipToPlayer={handleSaveClipToPlayer}
            onNavigateToPlayer={() => setActiveTab('player')}
          />
        )}

        {activeTab === 'player' && (
          <ClipPlayerStudio
            project={project}
            savedClips={
              project.savedClips && project.savedClips.length > 0
                ? project.savedClips
                : PRESET_DRAMA_PROJECT.savedClips || []
            }
            onUpdateClips={handleUpdateSavedClips}
            onNavigateToVeo={() => setActiveTab('animate')}
            onOpenDirectorTheater={() => setIsPlayerOpen(true)}
            characters={characters}
            rooms={rooms}
          />
        )}
      </main>

      {/* Mobile Portrait Quick Step Bar */}
      <nav className="lg:hidden fixed bottom-0 inset-x-0 z-30 bg-neutral-950/95 backdrop-blur-lg border-t border-neutral-800/80 px-1 py-1 flex items-center justify-around">
        <button
          onClick={() => setActiveTab('script')}
          className={`flex flex-col items-center justify-center py-1 px-2 rounded-lg text-[10px] font-medium transition-all ${
            activeTab === 'script' ? 'text-rose-400 font-bold' : 'text-neutral-400 hover:text-neutral-200'
          }`}
        >
          <SlidersHorizontal className="w-4 h-4 mb-0.5" />
          <span>Naskah</span>
        </button>

        <button
          onClick={() => setActiveTab('characters')}
          className={`flex flex-col items-center justify-center py-1 px-2 rounded-lg text-[10px] font-medium transition-all ${
            activeTab === 'characters' ? 'text-rose-400 font-bold' : 'text-neutral-400 hover:text-neutral-200'
          }`}
        >
          <Users className="w-4 h-4 mb-0.5" />
          <span>Karakter</span>
        </button>

        <button
          onClick={() => setActiveTab('rooms')}
          className={`flex flex-col items-center justify-center py-1 px-2 rounded-lg text-[10px] font-medium transition-all ${
            activeTab === 'rooms' ? 'text-rose-400 font-bold' : 'text-neutral-400 hover:text-neutral-200'
          }`}
        >
          <Film className="w-4 h-4 mb-0.5" />
          <span>Ruangan</span>
        </button>

        <button
          onClick={() => setActiveTab('animate')}
          className={`flex flex-col items-center justify-center py-1 px-2 rounded-lg text-[10px] font-medium transition-all ${
            activeTab === 'animate' ? 'text-amber-400 font-bold' : 'text-amber-500/70 hover:text-amber-300'
          }`}
        >
          <Video className="w-4 h-4 mb-0.5" />
          <span>Veo Video</span>
        </button>

        <button
          onClick={() => setActiveTab('player')}
          className={`flex flex-col items-center justify-center py-1 px-2 rounded-lg text-[10px] font-medium transition-all ${
            activeTab === 'player' ? 'text-rose-400 font-bold' : 'text-neutral-400 hover:text-neutral-200'
          }`}
        >
          <Play className="w-4 h-4 mb-0.5" />
          <span>Player</span>
        </button>
      </nav>

      {/* Editorial Footer */}
      <footer className="border-t border-neutral-900 bg-neutral-950 px-6 py-6 text-xs text-neutral-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="font-display font-bold text-neutral-300">BuatDrama.AI</span>
            <span aria-hidden="true">·</span>
            <span>Studio Produksi Serial Drama</span>
            <span aria-hidden="true">·</span>
            <span className="font-mono text-neutral-500">Veo 3.1 & Gemini 3.8 Flash</span>
          </div>
          <div>
            <span>Format Rasio: 16:9 Landscape & 9:16 Portrait</span>
          </div>
        </div>
      </footer>

      {/* Modals */}
      <DirectorPlayerModal
        isOpen={isPlayerOpen}
        onClose={() => setIsPlayerOpen(false)}
        project={project}
        characters={characters}
        rooms={rooms}
      />

      <ExportModal
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
        project={project}
      />

      <NewDramaModal
        isOpen={isNewDramaOpen}
        onClose={() => setIsNewDramaOpen(false)}
        onCreateProject={(newProj) => {
          setProject(newProj);
          setCharacters(newProj.characters);
          setRooms(newProj.rooms);
          setActiveTab('script');
        }}
      />
    </div>
  );
}
