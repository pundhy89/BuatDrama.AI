import React, { useState, useRef } from 'react';
import { DramaRoom } from '../types/drama';
import { PRESET_ROOMS } from '../data/presets';
import {
  Film,
  Sparkles,
  Plus,
  Trash2,
  Upload,
  Check,
  Loader2,
  Sliders,
  Volume2,
  Sun,
  Palette,
  Camera,
  AlertCircle,
} from 'lucide-react';
import { ConfirmModal } from './ConfirmModal';

interface RoomStudioProps {
  rooms: DramaRoom[];
  onUpdateRooms: (rooms: DramaRoom[]) => void;
  dramaGenre: string;
}

export const RoomStudio: React.FC<RoomStudioProps> = ({
  rooms,
  onUpdateRooms,
  dramaGenre,
}) => {
  const [selectedRoomId, setSelectedRoomId] = useState<string>(rooms[0]?.id || 'room-1');
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);
  const [aiRoomPrompt, setAiRoomPrompt] = useState('');
  const [aiTimeOfDay, setAiTimeOfDay] = useState('Malam Hari');
  const [aiMood, setAiMood] = useState('Tegang & Mewah');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const activeRoom = rooms.find((r) => r.id === selectedRoomId) || rooms[0];

  const handleUpdateActiveRoom = (fields: Partial<DramaRoom>) => {
    if (!activeRoom) return;
    const updated = rooms.map((r) => (r.id === activeRoom.id ? { ...r, ...fields } : r));
    onUpdateRooms(updated);
  };

  const handleGenerateAiRoom = async () => {
    setIsGeneratingAi(true);
    setErrorMessage(null);

    try {
      const response = await fetch('/api/drama/generate-room', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomType: aiRoomPrompt || 'Ruang Kerja Pribadi Konglomerat dengan Koleksi Seni Kuno',
          timeOfDay: aiTimeOfDay,
          mood: aiMood,
          dramaGenre,
        }),
      });

      const resData = await response.json();
      if (!response.ok || !resData.success) {
        throw new Error(resData.error || 'Gagal menghasilkan ruangan AI.');
      }

      const generated = resData.data;
      const newRoom: DramaRoom = {
        id: `room-${Date.now()}`,
        name: generated.name || 'Set Sinematik Baru',
        category: generated.category || 'Interior',
        description: generated.description || 'Lokasi adegan drama dengan detail tinggi.',
        lightingSetup: generated.lightingSetup || 'Pencahayaan sinematik dramatis.',
        colorPalette: generated.colorPalette?.length ? generated.colorPalette : ['#0f172a', '#334155', '#e2e8f0'],
        soundAtmosphere: generated.soundAtmosphere || 'Suasana latar hening mencekam.',
        visualPrompt: generated.visualPrompt || 'Cinematic wide film set shot with dramatic shadows',
        backdropGradient: 'from-zinc-950 via-slate-900 to-black',
        mood: aiMood,
      };

      onUpdateRooms([...rooms, newRoom]);
      setSelectedRoomId(newRoom.id);
      setAiRoomPrompt('');
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message || 'Gagal merancang ruangan AI.');
    } finally {
      setIsGeneratingAi(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      handleUpdateActiveRoom({ customUploadedPhoto: result });
    };
    reader.readAsDataURL(file);
  };

  const handleAddPresetRoom = (preset: DramaRoom) => {
    const newRoom: DramaRoom = {
      ...preset,
      id: `room-${Date.now()}`,
    };
    onUpdateRooms([...rooms, newRoom]);
    setSelectedRoomId(newRoom.id);
  };

  const [roomToDelete, setRoomToDelete] = useState<DramaRoom | null>(null);
  const [limitWarningMessage, setLimitWarningMessage] = useState<string | null>(null);

  const handleDeleteRoom = (id: string) => {
    if (rooms.length <= 1) {
      setLimitWarningMessage('Serial drama memerlukan minimal satu latar belakang / ruangan.');
      setTimeout(() => setLimitWarningMessage(null), 3500);
      return;
    }
    const target = rooms.find((r) => r.id === id);
    if (target) {
      setRoomToDelete(target);
    }
  };

  const handleConfirmDeleteRoom = () => {
    if (!roomToDelete) return;
    const id = roomToDelete.id;
    const remaining = rooms.filter((r) => r.id !== id);
    onUpdateRooms(remaining);
    if (selectedRoomId === id) {
      setSelectedRoomId(remaining[0]?.id || '');
    }
    setRoomToDelete(null);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 lg:px-8 py-8">
      {/* Studio Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-neutral-800">
        <div>
          <div className="flex items-center gap-2 text-xs text-rose-500 font-mono tracking-wider uppercase mb-1">
            <Film className="w-4 h-4" />
            <span>Set Design & Background Environment</span>
          </div>
          <h1 className="text-2xl lg:text-3xl font-display font-bold text-white tracking-tight">
            Ruangan & Latar Belakang Drama
          </h1>
          <p className="text-sm text-neutral-400 mt-1 max-w-2xl">
            Tentukan latar tempat dan atmosfer visual adegan drama—mulai dari penthouse mewah kota, kafe sudut hujan, hingga ruang sidang pengadilan dengan tata cahaya sinematik.
          </p>
        </div>

        {/* AI Room Generator Bar */}
        <div className="flex items-center gap-2 bg-neutral-900/90 p-2 rounded-xl border border-neutral-800">
          <input
            type="text"
            value={aiRoomPrompt}
            onChange={(e) => setAiRoomPrompt(e.target.value)}
            placeholder="Cth: Koridor pengadilan marmer, gudang dermaga..."
            className="text-xs bg-neutral-950 border border-neutral-800 text-white rounded-lg px-3 py-2 w-52 md:w-64 focus:outline-none focus:border-rose-500"
          />
          <select
            value={aiTimeOfDay}
            onChange={(e) => setAiTimeOfDay(e.target.value)}
            className="text-xs bg-neutral-950 border border-neutral-800 text-neutral-300 rounded-lg px-2.5 py-2 focus:outline-none"
          >
            <option value="Malam Hari">Malam Hari</option>
            <option value="Senja / Dusk">Senja</option>
            <option value="Hujan Badai">Hujan Badai</option>
            <option value="Pagi Berkabut">Pagi Kabut</option>
          </select>
          <button
            onClick={handleGenerateAiRoom}
            disabled={isGeneratingAi}
            className="flex items-center gap-1.5 px-3 py-2 bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white text-xs font-semibold rounded-lg transition-colors whitespace-nowrap"
          >
            {isGeneratingAi ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Sparkles className="w-3.5 h-3.5" />
            )}
            <span>Rancang Set AI</span>
          </button>
        </div>
      </div>

      {errorMessage && (
        <div className="mt-4 p-3 bg-red-950/60 border border-red-800/80 rounded-xl text-xs text-red-200">
          {errorMessage}
        </div>
      )}

      {limitWarningMessage && (
        <div className="mt-4 p-3 bg-amber-950/60 border border-amber-800/80 rounded-xl text-xs text-amber-200 flex items-center gap-2 animate-in fade-in">
          <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
          <span>{limitWarningMessage}</span>
        </div>
      )}

      {/* Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mt-6">
        {/* Left Column: List of Rooms (4 cols) */}
        <div className="lg:col-span-4 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">
              Latar Ruangan Serial ({rooms.length})
            </span>
            <button
              onClick={() => {
                const newRoom: DramaRoom = {
                  id: `room-${Date.now()}`,
                  name: 'Ruangan Baru',
                  category: 'Interior',
                  description: 'Deskripsi set ruangan yang siap digunakan adegan drama.',
                  lightingSetup: 'Pencahayaan temaram hangat.',
                  colorPalette: ['#18181b', '#3f3f46', '#e4e4e7'],
                  soundAtmosphere: 'Suara latar senyap alami.',
                  visualPrompt: 'Cinematic indoor set with dramatic soft side lighting',
                  backdropGradient: 'from-slate-900 to-black',
                  mood: 'Netral & Sinematik',
                };
                onUpdateRooms([...rooms, newRoom]);
                setSelectedRoomId(newRoom.id);
              }}
              className="flex items-center gap-1 text-xs text-rose-400 hover:text-rose-300 font-medium"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Tambah Set</span>
            </button>
          </div>

          <div className="space-y-2">
            {rooms.map((room) => {
              const isSelected = room.id === selectedRoomId;
              return (
                <div
                  key={room.id}
                  onClick={() => setSelectedRoomId(room.id)}
                  className={`group relative p-3.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                    isSelected
                      ? 'bg-neutral-900/95 border-rose-500/80 shadow-md shadow-rose-950/20'
                      : 'bg-neutral-950/60 border-neutral-800/70 hover:border-neutral-700 hover:bg-neutral-900/40'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-12 h-10 rounded-lg overflow-hidden shrink-0 border border-neutral-700/80 relative">
                      {room.customUploadedPhoto ? (
                        <img
                          src={room.customUploadedPhoto}
                          alt={room.name}
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <div
                          className={`w-full h-full bg-gradient-to-tr ${room.backdropGradient} flex items-center justify-center`}
                        >
                          <Film className="w-4 h-4 text-neutral-400" />
                        </div>
                      )}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm font-semibold text-white truncate block">
                          {room.name}
                        </span>
                        {isSelected && (
                          <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0" />
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-neutral-400 mt-0.5">
                        <span className="truncate">{room.category}</span>
                        <span aria-hidden="true">·</span>
                        <span className="text-neutral-500 truncate text-[11px]">{room.mood}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0 ml-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteRoom(room.id);
                      }}
                      disabled={rooms.length <= 1}
                      className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                        rooms.length <= 1
                          ? 'text-neutral-700 cursor-not-allowed'
                          : 'text-neutral-500 hover:text-red-400 hover:bg-red-950/40'
                      }`}
                      title={rooms.length <= 1 ? 'Minimal 1 latar belakang' : `Hapus ${room.name}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Quick Presets Roster */}
          <div className="pt-4 border-t border-neutral-900">
            <span className="text-xs font-semibold text-neutral-400 uppercase tracking-wider block mb-2">
              Preset Set Drama Populer
            </span>
            <div className="grid grid-cols-1 gap-2">
              {PRESET_ROOMS.map((preset) => (
                <button
                  key={preset.id}
                  onClick={() => handleAddPresetRoom(preset)}
                  className="flex items-center justify-between p-2 rounded-lg bg-neutral-900/40 hover:bg-neutral-800/60 border border-neutral-800/60 text-left transition-colors"
                >
                  <div className="truncate">
                    <span className="text-xs font-medium text-neutral-200 block truncate">
                      {preset.name}
                    </span>
                    <span className="text-[11px] text-neutral-500 block truncate">
                      {preset.category} · {preset.mood}
                    </span>
                  </div>
                  <Plus className="w-3.5 h-3.5 text-neutral-400 shrink-0 ml-2" />
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Room Details (8 cols) */}
        {activeRoom ? (
          <div className="lg:col-span-8 bg-neutral-900/60 rounded-2xl border border-neutral-800/90 p-6 space-y-6">
            {/* Backdrop Visual Preview Banner */}
            <div className="relative h-48 md:h-56 rounded-xl overflow-hidden border border-neutral-700/80 group">
              {activeRoom.customUploadedPhoto ? (
                <img
                  src={activeRoom.customUploadedPhoto}
                  alt={activeRoom.name}
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div
                  className={`w-full h-full bg-gradient-to-tr ${activeRoom.backdropGradient} flex flex-col items-center justify-center p-6 text-center`}
                >
                  <Film className="w-10 h-10 text-neutral-500 mb-2" />
                  <span className="text-sm font-semibold text-neutral-300">
                    {activeRoom.name}
                  </span>
                  <span className="text-xs text-neutral-500 max-w-md mt-1">
                    {activeRoom.description}
                  </span>
                </div>
              )}

              {/* Scrim Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent flex items-end justify-between p-4">
                <div>
                  <span className="text-xs font-mono uppercase text-rose-400 tracking-wider">
                    {activeRoom.category}
                  </span>
                  <h2 className="text-lg md:text-xl font-bold text-white font-display">
                    {activeRoom.name}
                  </h2>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-neutral-900/90 hover:bg-neutral-800 text-white text-xs font-medium rounded-lg border border-neutral-700 backdrop-blur-sm transition-colors cursor-pointer"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>Upload Foto Latar</span>
                  </button>

                  <button
                    onClick={() => handleDeleteRoom(activeRoom.id)}
                    disabled={rooms.length <= 1}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer backdrop-blur-sm ${
                      rooms.length <= 1
                        ? 'bg-neutral-950/80 text-neutral-600 border border-neutral-800 cursor-not-allowed'
                        : 'bg-red-950/80 hover:bg-red-900/90 text-red-300 border border-red-800/80 hover:border-red-600'
                    }`}
                    title={rooms.length <= 1 ? 'Minimal 1 latar belakang' : 'Hapus latar ruangan ini'}
                  >
                    <Trash2 className="w-3.5 h-3.5 text-red-400" />
                    <span>Hapus Latar Ruangan</span>
                  </button>
                </div>
              </div>

              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileUpload}
                accept="image/*"
                className="hidden"
              />
            </div>

            {/* Room Info Form */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-neutral-300 uppercase tracking-wider block mb-1.5">
                  Nama Ruangan / Set
                </label>
                <input
                  type="text"
                  value={activeRoom.name}
                  onChange={(e) => handleUpdateActiveRoom({ name: e.target.value })}
                  className="w-full text-xs bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-rose-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-neutral-300 uppercase tracking-wider block mb-1.5">
                  Kategori & Mood Suasana
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={activeRoom.category}
                    onChange={(e) => handleUpdateActiveRoom({ category: e.target.value })}
                    className="w-1/2 text-xs bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-rose-500"
                    placeholder="Interior / Eksterior"
                  />
                  <input
                    type="text"
                    value={activeRoom.mood}
                    onChange={(e) => handleUpdateActiveRoom({ mood: e.target.value })}
                    className="w-1/2 text-xs bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-rose-500"
                    placeholder="Mood adegan"
                  />
                </div>
              </div>

              <div className="md:col-span-2">
                <label className="text-xs font-semibold text-neutral-300 uppercase tracking-wider block mb-1.5">
                  Deskripsi Tata Ruang & Properti (Production Design)
                </label>
                <textarea
                  rows={2}
                  value={activeRoom.description}
                  onChange={(e) => handleUpdateActiveRoom({ description: e.target.value })}
                  className="w-full text-xs bg-neutral-950 border border-neutral-800 rounded-xl p-3 text-neutral-200 focus:outline-none focus:border-rose-500 leading-relaxed"
                />
              </div>
            </div>

            {/* Cinematography & Lighting Specs */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-neutral-950/70 rounded-xl border border-neutral-800">
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-xs font-semibold text-amber-400">
                  <Sun className="w-4 h-4" />
                  <span>Tata Pencahayaan Sinematik</span>
                </div>
                <textarea
                  rows={2}
                  value={activeRoom.lightingSetup}
                  onChange={(e) => handleUpdateActiveRoom({ lightingSetup: e.target.value })}
                  className="w-full text-xs bg-neutral-900 border border-neutral-800 rounded-lg p-2.5 text-neutral-200 focus:outline-none focus:border-amber-500"
                  placeholder="Deskripsi lighting (rim light, backlight, neon...)"
                />
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-2 text-xs font-semibold text-cyan-400">
                  <Volume2 className="w-4 h-4" />
                  <span>Suasana Audio & Efek Latar (Foley)</span>
                </div>
                <textarea
                  rows={2}
                  value={activeRoom.soundAtmosphere}
                  onChange={(e) => handleUpdateActiveRoom({ soundAtmosphere: e.target.value })}
                  className="w-full text-xs bg-neutral-900 border border-neutral-800 rounded-lg p-2.5 text-neutral-200 focus:outline-none focus:border-cyan-500"
                  placeholder="Suara hujan lebat di kaca, denting gelas kristal..."
                />
              </div>

              {/* Veo Visual Prompt Formula */}
              <div className="md:col-span-2 space-y-2 pt-2 border-t border-neutral-800">
                <div className="flex items-center gap-2 text-xs font-semibold text-rose-400">
                  <Camera className="w-4 h-4" />
                  <span>Prompt Visual untuk Video Generator Veo</span>
                </div>
                <input
                  type="text"
                  value={activeRoom.visualPrompt}
                  onChange={(e) => handleUpdateActiveRoom({ visualPrompt: e.target.value })}
                  className="w-full text-xs bg-neutral-900 border border-neutral-800 rounded-lg px-3 py-2 text-neutral-200 focus:outline-none focus:border-rose-500 font-mono text-[11px]"
                />
              </div>
            </div>
          </div>
        ) : (
          <div className="lg:col-span-8 p-12 text-center text-neutral-500">
            Pilih atau rancang ruangan untuk melihat detail.
          </div>
        )}
      </div>

      {/* Delete Room Confirmation Modal */}
      <ConfirmModal
        isOpen={Boolean(roomToDelete)}
        title={`Hapus Latar Ruangan "${roomToDelete?.name || ''}"?`}
        description="Latar set ruangan ini beserta setting atmosfer dan pencahayaannya akan dihapus dari serial drama."
        confirmLabel="Ya, Hapus Latar Ruangan"
        onConfirm={handleConfirmDeleteRoom}
        onCancel={() => setRoomToDelete(null)}
      />
    </div>
  );
};
