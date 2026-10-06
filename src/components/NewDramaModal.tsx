import React, { useState } from 'react';
import { DramaProject, DramaCharacter, DramaRoom } from '../types/drama';
import { PRESET_DRAMA_PROJECT, PRESET_CHARACTERS, PRESET_ROOMS } from '../data/presets';
import { X, Sparkles, Film, Loader2, AlertCircle } from 'lucide-react';

interface NewDramaModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateProject: (project: DramaProject) => void;
}

export const NewDramaModal: React.FC<NewDramaModalProps> = ({
  isOpen,
  onClose,
  onCreateProject,
}) => {
  const [title, setTitle] = useState('');
  const [premise, setPremise] = useState('');
  const [genre, setGenre] = useState('Drama Intrik Konglomerat & Kekuasaan');
  const [scenesCount, setScenesCount] = useState<number>(3);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleCreateWithAi = async () => {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const response = await fetch('/api/drama/generate-script', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          prompt: premise || 'Dua keluarga konglomerat yang bersaing sengit untuk kepemilikan pulau resor rahasia',
          genre,
          scenesCount,
          characters: PRESET_CHARACTERS.slice(0, 3).map((c) => ({
            name: c.name,
            role: c.role,
            voice: c.recommendedVoice,
          })),
        }),
      });

      const resData = await response.json();
      if (!response.ok || !resData.success) {
        throw new Error(resData.error || 'Gagal menghasilkan konsep serial baru.');
      }

      const generated = resData.data;
      const newProject: DramaProject = {
        id: `proj-${Date.now()}`,
        title: generated.title || title || 'Serial Drama Baru',
        logline: generated.logline || 'Premis serial drama.',
        genre: generated.genre || genre,
        tone: generated.tone || 'Intens & Dramatis',
        episodeTitle: generated.episodeTitle || 'Episode 1',
        episodesSummary: generated.episodesSummary || ['Ep 1: Pengenalan konflik.'],
        characters: PRESET_CHARACTERS.slice(0, 3),
        rooms: PRESET_ROOMS.slice(0, 3),
        aspectRatio: '16:9',
        scenes: (generated.scenes || []).map((sc: any, idx: number) => ({
          id: `sc-${Date.now()}-${idx}`,
          sceneNumber: sc.sceneNumber || idx + 1,
          title: sc.title || `Adegan ${idx + 1}`,
          roomOrLocation: sc.roomOrLocation || PRESET_ROOMS[0].name,
          locationType: sc.locationType || 'Interior',
          timeOfDay: sc.timeOfDay || 'Malam',
          mood: sc.mood || 'Tegang',
          lighting: sc.lighting || 'Cinematic lighting',
          cameraDirection: sc.cameraDirection || 'Slow push-in',
          visualPrompt: sc.visualPrompt || 'Cinematic drama shot',
          dialogues: (sc.dialogues || []).map((dlg: any, dIdx: number) => ({
            id: `dlg-${Date.now()}-${idx}-${dIdx}`,
            speaker: dlg.speaker || PRESET_CHARACTERS[0].name,
            text: dlg.text || '',
            emotion: dlg.emotion || 'Serius',
            voiceStyle: dlg.voiceStyle || 'Ekspresif',
          })),
        })),
      };

      onCreateProject(newProject);
      onClose();
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message || 'Gagal membuat naskah serial drama.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUsePreset = () => {
    onCreateProject({
      ...PRESET_DRAMA_PROJECT,
      id: `proj-${Date.now()}`,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="w-full max-w-lg bg-neutral-950 rounded-2xl border border-neutral-800 shadow-2xl p-6 space-y-5">
        <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
          <div className="flex items-center gap-2">
            <Film className="w-5 h-5 text-rose-500" />
            <h2 className="text-base font-bold text-white font-display">
              Mulai Produksi Serial Drama Baru
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {errorMessage && (
          <div className="p-3 bg-red-950/60 border border-red-800/80 rounded-xl text-xs text-red-200 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-neutral-300 uppercase tracking-wider block mb-1.5">
              Judul Serial Drama (Opsional)
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Cth: Bayang Mahkota di Balik Kaca"
              className="w-full text-xs bg-neutral-900 border border-neutral-800 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-rose-500"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-neutral-300 uppercase tracking-wider block mb-1.5">
              Genre Serial
            </label>
            <select
              value={genre}
              onChange={(e) => setGenre(e.target.value)}
              className="w-full text-xs bg-neutral-900 border border-neutral-800 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-rose-500"
            >
              <option value="Drama Intrik Konglomerat & Kekuasaan">Drama Intrik Konglomerat & Kekuasaan</option>
              <option value="Drama Romansa & Rahasia Masa Lalu">Drama Romansa & Rahasia Masa Lalu</option>
              <option value="Misteri Pembunuhan & Thriller Meja Hijau">Misteri Pembunuhan & Thriller Meja Hijau</option>
              <option value="Kerajaan Nusantara & Perebutan Tahta">Kerajaan Nusantara & Perebutan Tahta</option>
              <option value="Melodrama Kedokteran & Rumah Sakit">Melodrama Kedokteran & Rumah Sakit</option>
            </select>
          </div>

          <div>
            <label className="text-xs font-semibold text-neutral-300 uppercase tracking-wider block mb-1.5">
              Premis / Ide Cerita Singkat
            </label>
            <textarea
              rows={3}
              value={premise}
              onChange={(e) => setPremise(e.target.value)}
              placeholder="Ceritakan konflik utama, rahasia masa lalu, atau titik balik drama..."
              className="w-full text-xs bg-neutral-900 border border-neutral-800 rounded-xl p-3 text-white focus:outline-none focus:border-rose-500"
            />
          </div>

          <div className="flex items-center justify-between text-xs text-neutral-400">
            <span>Jumlah Adegan Awal:</span>
            <div className="flex items-center gap-2">
              {[2, 3, 4, 5].map((num) => (
                <button
                  key={num}
                  type="button"
                  onClick={() => setScenesCount(num)}
                  className={`px-2.5 py-1 rounded-lg font-mono text-xs ${
                    scenesCount === num
                      ? 'bg-rose-600 text-white font-bold'
                      : 'bg-neutral-900 text-neutral-400 border border-neutral-800'
                  }`}
                >
                  {num}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="pt-3 border-t border-neutral-800 flex flex-col sm:flex-row items-center justify-between gap-3">
          <button
            onClick={handleUsePreset}
            className="w-full sm:w-auto text-xs text-neutral-400 hover:text-white underline underline-offset-4"
          >
            Gunakan Contoh Drama Jadi
          </button>

          <button
            onClick={handleCreateWithAi}
            disabled={isLoading}
            className="w-full sm:w-auto px-5 py-2.5 bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white text-xs font-semibold rounded-xl shadow-lg shadow-rose-950 flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Menghasilkan Serial...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Buat dengan AI (Gemini 3.8)</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
