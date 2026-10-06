import React, { useState, useRef } from 'react';
import { DramaCharacter } from '../types/drama';
import { PRESET_CHARACTERS } from '../data/presets';
import { playBrowserSpeechFallback } from '../utils/speechFallback';
import {
  Users,
  Mic,
  Volume2,
  VolumeX,
  Sparkles,
  Plus,
  Trash2,
  Upload,
  Check,
  User,
  Quote,
  Loader2,
  RefreshCw,
  AlertCircle,
} from 'lucide-react';
import { ConfirmModal } from './ConfirmModal';

interface CharacterStudioProps {
  characters: DramaCharacter[];
  onUpdateCharacters: (chars: DramaCharacter[]) => void;
  dramaGenre: string;
}

const VOICE_OPTIONS: Array<{
  name: DramaCharacter['recommendedVoice'];
  tone: string;
  gender: string;
  desc: string;
}> = [
  { name: 'Kore', tone: 'Alto Jernih & Berwibawa', gender: 'Wanita', desc: 'Cocok untuk CEO, hakim, atau tokoh utama wanita tangguh' },
  { name: 'Charon', tone: 'Bariton Berat & Dingin', gender: 'Pria', desc: 'Cocok untuk konglomerat dingin, mafia, atau tokoh antagonis' },
  { name: 'Puck', tone: 'Tenor Dinamis & Energik', gender: 'Pria', desc: 'Cocok untuk detektif muda, pewaris ceroboh, atau pemuda cerdas' },
  { name: 'Zephyr', tone: 'Sopran Lembut & Melankolis', gender: 'Wanita', desc: 'Cocok untuk kekasih berhati murni, dokter idealis, atau adegan haru' },
  { name: 'Fenrir', tone: 'Bass Rendah Mengintimidasi', gender: 'Pria', desc: 'Cocok untuk kepala keluarga otoriter, kaisar, atau jenderal' },
];

export const CharacterStudio: React.FC<CharacterStudioProps> = ({
  characters,
  onUpdateCharacters,
  dramaGenre,
}) => {
  const [selectedCharId, setSelectedCharId] = useState<string>(characters[0]?.id || 'char-1');
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiRole, setAiRole] = useState('Protagonis');
  const [testQuote, setTestQuote] = useState('');
  const [isAuditionLoading, setIsAuditionLoading] = useState(false);
  const [auditionAudioUrl, setAuditionAudioUrl] = useState<string | null>(null);
  const [isPlayingAudition, setIsPlayingAudition] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const activeChar = characters.find((c) => c.id === selectedCharId) || characters[0];

  const handleUpdateActiveChar = (fields: Partial<DramaCharacter>) => {
    if (!activeChar) return;
    const updated = characters.map((c) => (c.id === activeChar.id ? { ...c, ...fields } : c));
    onUpdateCharacters(updated);
  };

  const handleAuditionVoice = async () => {
    if (!activeChar) return;
    const textToSpeak = testQuote.trim() || activeChar.signatureQuote || `Halo, nama saya ${activeChar.name}. Ini adalah suara karakter saya dalam serial drama ini.`;

    setIsAuditionLoading(true);
    setErrorMessage(null);

    try {
      const response = await fetch('/api/drama/generate-voice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: textToSpeak,
          voiceName: activeChar.recommendedVoice,
          style: `${activeChar.voicePersona}, drama actor voice style`,
        }),
      });

      const data = await response.json();
      if (!response.ok && !data.fallbackSpeech) {
        throw new Error(data.error || 'Gagal menghasilkan sampel suara.');
      }

      if (data.fallbackSpeech || !data.audioUrl) {
        // Fallback to browser Web Speech API
        setIsPlayingAudition(true);
        playBrowserSpeechFallback(
          textToSpeak,
          activeChar.recommendedVoice,
          () => setIsPlayingAudition(false),
          () => setIsPlayingAudition(false)
        );
        return;
      }

      setAuditionAudioUrl(data.audioUrl);
      if (audioRef.current) {
        audioRef.current.src = data.audioUrl;
        audioRef.current.play();
        setIsPlayingAudition(true);
      }
    } catch (err: any) {
      console.warn('Gemini TTS unavailable, falling back to Web Speech API:', err);
      // Seamlessly speak using Web Speech API fallback
      setIsPlayingAudition(true);
      playBrowserSpeechFallback(
        textToSpeak,
        activeChar.recommendedVoice,
        () => setIsPlayingAudition(false),
        () => {
          setIsPlayingAudition(false);
          setErrorMessage('Gagal memutar audio browser.');
        }
      );
    } finally {
      setIsAuditionLoading(false);
    }
  };

  const handleGenerateAiCharacter = async () => {
    setIsGeneratingAi(true);
    setErrorMessage(null);

    try {
      const response = await fetch('/api/drama/generate-character', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          personality: aiPrompt || 'Tokoh kharismatik dengan motif tersembunyi',
          role: aiRole,
          dramaGenre,
        }),
      });

      const resData = await response.json();
      if (!response.ok || !resData.success) {
        throw new Error(resData.error || 'Gagal menghasilkan karakter AI');
      }

      const generated = resData.data;
      const newChar: DramaCharacter = {
        id: `char-${Date.now()}`,
        name: generated.name || 'Tokoh Baru',
        role: generated.role || aiRole,
        gender: generated.gender || 'Pria',
        age: generated.age || '28 tahun',
        archetype: generated.archetype || 'The Enigmatic Figure',
        personality: generated.personality || 'Kompleks dan emosional',
        backstory: generated.backstory || 'Menyimpan rahasia besar di balik statusnya.',
        clothingStyle: generated.clothingStyle || 'Setelan formal monokrom.',
        avatarPlaceholderColor: 'from-violet-800 via-slate-900 to-black',
        recommendedVoice: (generated.recommendedVoice as any) || 'Kore',
        voicePersona: generated.voicePersona || 'Berwibawa dan penuh tekanan emosi.',
        signatureQuote: generated.signatureQuote || 'Kebenaran tidak pernah berpihak pada yang lemah.',
      };

      onUpdateCharacters([...characters, newChar]);
      setSelectedCharId(newChar.id);
      setAiPrompt('');
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message || 'Gagal membuat karakter AI.');
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
      handleUpdateActiveChar({ customUploadedPhoto: result });
    };
    reader.readAsDataURL(file);
  };

  const handleAddPresetCharacter = (preset: DramaCharacter) => {
    const newChar: DramaCharacter = {
      ...preset,
      id: `char-${Date.now()}`,
    };
    onUpdateCharacters([...characters, newChar]);
    setSelectedCharId(newChar.id);
  };

  const [charToDelete, setCharToDelete] = useState<DramaCharacter | null>(null);
  const [limitWarningMessage, setLimitWarningMessage] = useState<string | null>(null);

  const handleDeleteCharacter = (id: string) => {
    if (characters.length <= 1) {
      setLimitWarningMessage('Serial drama memerlukan minimal satu karakter aktor.');
      setTimeout(() => setLimitWarningMessage(null), 3500);
      return;
    }
    const target = characters.find((c) => c.id === id);
    if (target) {
      setCharToDelete(target);
    }
  };

  const handleConfirmDeleteCharacter = () => {
    if (!charToDelete) return;
    const id = charToDelete.id;
    const remaining = characters.filter((c) => c.id !== id);
    onUpdateCharacters(remaining);
    if (selectedCharId === id) {
      setSelectedCharId(remaining[0]?.id || '');
    }
    setCharToDelete(null);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 lg:px-8 py-8">
      {/* Studio Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-neutral-800">
        <div>
          <div className="flex items-center gap-2 text-xs text-rose-500 font-mono tracking-wider uppercase mb-1">
            <Users className="w-4 h-4" />
            <span>Kasting & Voice Persona Studio</span>
          </div>
          <h1 className="text-2xl lg:text-3xl font-display font-bold text-white tracking-tight">
            Menentukan Karakter dan Suara Drama
          </h1>
          <p className="text-sm text-neutral-400 mt-1 max-w-2xl">
            Rancang profil aktor serial drama, kostum khas, latar belakang konflik, serta dengarkan langsung uji vokal menggunakan teknologi Gemini Speech TTS.
          </p>
        </div>

        {/* AI Quick Generator Prompt */}
        <div className="flex items-center gap-2 bg-neutral-900/90 p-2 rounded-xl border border-neutral-800">
          <input
            type="text"
            value={aiPrompt}
            onChange={(e) => setAiPrompt(e.target.value)}
            placeholder="Cth: Pewaris angkuh namun rapuh, mantan narapidana..."
            className="text-xs bg-neutral-950 border border-neutral-800 text-white rounded-lg px-3 py-2 w-52 md:w-64 focus:outline-none focus:border-rose-500"
          />
          <select
            value={aiRole}
            onChange={(e) => setAiRole(e.target.value)}
            className="text-xs bg-neutral-950 border border-neutral-800 text-neutral-300 rounded-lg px-2.5 py-2 focus:outline-none"
          >
            <option value="Protagonis Utama">Protagonis</option>
            <option value="Antagonis Ambisius">Antagonis</option>
            <option value="Detektif / Penyelidik">Detektif</option>
            <option value="Sahabat / Tokoh Kunci">Tokoh Kunci</option>
          </select>
          <button
            onClick={handleGenerateAiCharacter}
            disabled={isGeneratingAi}
            className="flex items-center gap-1.5 px-3 py-2 bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white text-xs font-semibold rounded-lg transition-colors whitespace-nowrap"
          >
            {isGeneratingAi ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Sparkles className="w-3.5 h-3.5" />
            )}
            <span>Rancang AI</span>
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

      {/* Main Studio Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mt-6">
        {/* Left Column: Character List (4 cols) */}
        <div className="lg:col-span-4 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">
              Daftar Tokoh Serial ({characters.length})
            </span>
            <button
              onClick={() => {
                const newChar: DramaCharacter = {
                  id: `char-${Date.now()}`,
                  name: 'Tokoh Baru',
                  role: 'Peran Pembantu',
                  gender: 'Pria',
                  age: '26 tahun',
                  archetype: 'The Loyal Ally',
                  personality: 'Setia, tenang, siap berkorban demi sahabatnya.',
                  backstory: 'Tumbuh bersama tokoh utama di masa-masa sulit.',
                  clothingStyle: 'Pakaian kasual gelap rapi.',
                  avatarPlaceholderColor: 'from-blue-900 to-slate-900',
                  recommendedVoice: 'Puck',
                  voicePersona: 'Tenor jernih dan ramah.',
                  signatureQuote: 'Aku selalu ada di belakangmu, apa pun keputusanmu.',
                };
                onUpdateCharacters([...characters, newChar]);
                setSelectedCharId(newChar.id);
              }}
              className="flex items-center gap-1 text-xs text-rose-400 hover:text-rose-300 font-medium"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Tambah Tokoh</span>
            </button>
          </div>

          <div className="space-y-2">
            {characters.map((char) => {
              const isSelected = char.id === selectedCharId;
              return (
                <div
                  key={char.id}
                  onClick={() => setSelectedCharId(char.id)}
                  className={`group relative p-3.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                    isSelected
                      ? 'bg-neutral-900/95 border-rose-500/80 shadow-md shadow-rose-950/20'
                      : 'bg-neutral-950/60 border-neutral-800/70 hover:border-neutral-700 hover:bg-neutral-900/40'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {/* Character Avatar */}
                    <div className="w-11 h-11 rounded-lg overflow-hidden shrink-0 border border-neutral-700/80 relative">
                      {char.customUploadedPhoto ? (
                        <img
                          src={char.customUploadedPhoto}
                          alt={char.name}
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <div
                          className={`w-full h-full bg-gradient-to-br ${char.avatarPlaceholderColor} flex items-center justify-center`}
                        >
                          <User className="w-5 h-5 text-neutral-300" />
                        </div>
                      )}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm font-semibold text-white truncate block">
                          {char.name}
                        </span>
                        {isSelected && (
                          <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0" />
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-neutral-400 mt-0.5">
                        <span className="truncate">{char.role}</span>
                        <span aria-hidden="true">·</span>
                        <span className="text-neutral-500 font-mono text-[11px]">{char.recommendedVoice}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0 ml-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteCharacter(char.id);
                      }}
                      disabled={characters.length <= 1}
                      className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                        characters.length <= 1
                          ? 'text-neutral-700 cursor-not-allowed'
                          : 'text-neutral-500 hover:text-red-400 hover:bg-red-950/40'
                      }`}
                      title={characters.length <= 1 ? 'Minimal 1 karakter aktor' : `Hapus karakter ${char.name}`}
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
              Katalog Tokoh Drama Siap Pakai
            </span>
            <div className="grid grid-cols-1 gap-2">
              {PRESET_CHARACTERS.map((preset) => (
                <button
                  key={preset.id}
                  onClick={() => handleAddPresetCharacter(preset)}
                  className="flex items-center justify-between p-2 rounded-lg bg-neutral-900/40 hover:bg-neutral-800/60 border border-neutral-800/60 text-left transition-colors"
                >
                  <div className="truncate">
                    <span className="text-xs font-medium text-neutral-200 block truncate">
                      {preset.name}
                    </span>
                    <span className="text-[11px] text-neutral-500 block truncate">
                      {preset.role} · {preset.recommendedVoice}
                    </span>
                  </div>
                  <Plus className="w-3.5 h-3.5 text-neutral-400 shrink-0 ml-2" />
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Character & Voice Detail Editor (8 cols) */}
        {activeChar ? (
          <div className="lg:col-span-8 bg-neutral-900/60 rounded-2xl border border-neutral-800/90 p-6 space-y-6">
            {/* Header of Active Character */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-neutral-800">
              <div className="flex items-center gap-4">
                <div className="relative group w-20 h-20 rounded-xl overflow-hidden border border-neutral-700 bg-neutral-950 shrink-0">
                  {activeChar.customUploadedPhoto ? (
                    <img
                      src={activeChar.customUploadedPhoto}
                      alt={activeChar.name}
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div
                      className={`w-full h-full bg-gradient-to-br ${activeChar.avatarPlaceholderColor} flex items-center justify-center`}
                    >
                      <User className="w-8 h-8 text-neutral-300" />
                    </div>
                  )}

                  {/* Upload photo overlay */}
                  <label
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity text-white text-[10px]"
                  >
                    <Upload className="w-4 h-4 mb-0.5" />
                    <span>Upload Foto</span>
                  </label>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                    accept="image/*"
                    className="hidden"
                  />
                </div>

                <div>
                  <input
                    type="text"
                    value={activeChar.name}
                    onChange={(e) => handleUpdateActiveChar({ name: e.target.value })}
                    className="text-xl lg:text-2xl font-display font-bold text-white bg-transparent border-b border-transparent hover:border-neutral-700 focus:border-rose-500 focus:outline-none w-full"
                  />
                  <div className="flex flex-wrap items-center gap-2 mt-1.5 text-xs text-neutral-400">
                    <input
                      type="text"
                      value={activeChar.role}
                      onChange={(e) => handleUpdateActiveChar({ role: e.target.value })}
                      className="bg-neutral-950 border border-neutral-800 rounded px-2 py-0.5 text-xs text-neutral-300 focus:outline-none focus:border-rose-500 w-36"
                    />
                    <span aria-hidden="true">·</span>
                    <input
                      type="text"
                      value={activeChar.age}
                      onChange={(e) => handleUpdateActiveChar({ age: e.target.value })}
                      className="bg-neutral-950 border border-neutral-800 rounded px-2 py-0.5 text-xs text-neutral-300 focus:outline-none focus:border-rose-500 w-24"
                    />
                    <span aria-hidden="true">·</span>
                    <span className="text-neutral-500">{activeChar.archetype}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-medium rounded-lg transition-colors cursor-pointer"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Ubah Foto Aktor</span>
                </button>

                <button
                  onClick={() => handleDeleteCharacter(activeChar.id)}
                  disabled={characters.length <= 1}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                    characters.length <= 1
                      ? 'bg-neutral-900 text-neutral-600 border border-neutral-800 cursor-not-allowed'
                      : 'bg-red-950/40 hover:bg-red-950/70 text-red-300 border border-red-900/50 hover:border-red-800'
                  }`}
                  title={characters.length <= 1 ? 'Minimal 1 karakter aktor' : 'Hapus karakter ini dari serial'}
                >
                  <Trash2 className="w-3.5 h-3.5 text-red-400" />
                  <span>Hapus Karakter</span>
                </button>
              </div>
            </div>

            {/* Persona and Background fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-neutral-300 uppercase tracking-wider block mb-1.5">
                  Kepribadian & Karakteristik
                </label>
                <textarea
                  rows={3}
                  value={activeChar.personality}
                  onChange={(e) => handleUpdateActiveChar({ personality: e.target.value })}
                  className="w-full text-xs bg-neutral-950 border border-neutral-800 rounded-xl p-3 text-neutral-200 focus:outline-none focus:border-rose-500 leading-relaxed"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-neutral-300 uppercase tracking-wider block mb-1.5">
                  Gaya Busana & Kostum Khas
                </label>
                <textarea
                  rows={3}
                  value={activeChar.clothingStyle}
                  onChange={(e) => handleUpdateActiveChar({ clothingStyle: e.target.value })}
                  className="w-full text-xs bg-neutral-950 border border-neutral-800 rounded-xl p-3 text-neutral-200 focus:outline-none focus:border-rose-500 leading-relaxed"
                />
              </div>

              <div className="md:col-span-2">
                <label className="text-xs font-semibold text-neutral-300 uppercase tracking-wider block mb-1.5">
                  Latar Belakang Rahasia (Backstory)
                </label>
                <textarea
                  rows={2}
                  value={activeChar.backstory}
                  onChange={(e) => handleUpdateActiveChar({ backstory: e.target.value })}
                  className="w-full text-xs bg-neutral-950 border border-neutral-800 rounded-xl p-3 text-neutral-200 focus:outline-none focus:border-rose-500 leading-relaxed"
                />
              </div>
            </div>

            {/* VOICE DESIGNER SECTION */}
            <div className="p-5 bg-neutral-950/80 rounded-xl border border-neutral-800/90 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-rose-500/20 text-rose-400 flex items-center justify-center">
                    <Mic className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-white">
                      Desain Suara & Karakter Vokal (Gemini TTS)
                    </h3>
                    <p className="text-xs text-neutral-400">
                      Tentukan jenis suara yang paling sesuai dengan kepribadian aktor drama
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-xs text-neutral-400 font-mono">
                  <span>Model: gemini-3.8-flash-lite-tts</span>
                </div>
              </div>

              {/* Voice Choice Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 pt-2">
                {VOICE_OPTIONS.map((voice) => {
                  const isSelected = activeChar.recommendedVoice === voice.name;
                  return (
                    <div
                      key={voice.name}
                      onClick={() => handleUpdateActiveChar({ recommendedVoice: voice.name })}
                      className={`p-3 rounded-xl border cursor-pointer transition-all ${
                        isSelected
                          ? 'bg-rose-950/30 border-rose-500 text-white shadow-sm'
                          : 'bg-neutral-900/40 border-neutral-800/80 hover:border-neutral-700 text-neutral-300'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-xs flex items-center gap-1.5">
                          {voice.name}
                          <span className="text-[10px] text-neutral-400 font-normal">
                            ({voice.gender})
                          </span>
                        </span>
                        {isSelected && <Check className="w-3.5 h-3.5 text-rose-400" />}
                      </div>
                      <span className="text-[11px] text-rose-300/80 font-medium block mt-1">
                        {voice.tone}
                      </span>
                      <p className="text-[10px] text-neutral-400 mt-1 leading-snug">
                        {voice.desc}
                      </p>
                    </div>
                  );
                })}
              </div>

              {/* Voice Persona Style Note */}
              <div className="pt-2">
                <label className="text-xs font-medium text-neutral-400 block mb-1">
                  Petunjuk Vokal Tambahan (Gaya Berbicara & Dialek)
                </label>
                <input
                  type="text"
                  value={activeChar.voicePersona}
                  onChange={(e) => handleUpdateActiveChar({ voicePersona: e.target.value })}
                  placeholder="Cth: Bariton dingin dengan jeda dramatis setiap dua kalimat"
                  className="w-full text-xs bg-neutral-900 border border-neutral-800 rounded-lg px-3 py-2 text-neutral-200 focus:outline-none focus:border-rose-500"
                />
              </div>

              {/* Audition Player & Quote Test */}
              <div className="pt-3 border-t border-neutral-800 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                <div className="flex-1 relative">
                  <input
                    type="text"
                    value={testQuote}
                    onChange={(e) => setTestQuote(e.target.value)}
                    placeholder={`Uji kalimat: "${activeChar.signatureQuote}"`}
                    className="w-full text-xs bg-neutral-900 border border-neutral-800 rounded-lg px-3 py-2.5 text-white pr-8 focus:outline-none focus:border-rose-500"
                  />
                  <Quote className="w-3.5 h-3.5 text-neutral-500 absolute right-2.5 top-3" />
                </div>

                <button
                  onClick={handleAuditionVoice}
                  disabled={isAuditionLoading}
                  className="flex items-center justify-center gap-2 px-4 py-2.5 bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors whitespace-nowrap"
                >
                  {isAuditionLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Menggenerate Suara...</span>
                    </>
                  ) : (
                    <>
                      <Volume2 className="w-4 h-4" />
                      <span>Uji Suara Karakter</span>
                    </>
                  )}
                </button>
              </div>

              {/* Hidden HTML audio element for testing */}
              <audio
                ref={audioRef}
                onEnded={() => setIsPlayingAudition(false)}
                className="hidden"
              />
            </div>
          </div>
        ) : (
          <div className="lg:col-span-8 p-12 text-center text-neutral-500">
            Pilih atau buat karakter untuk melihat detail.
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={Boolean(charToDelete)}
        title={`Hapus Karakter "${charToDelete?.name || ''}"?`}
        description="Profil karakter, peran, kostum, dan sampel suara karakter ini akan dihapus dari daftar aktor serial drama."
        confirmLabel="Ya, Hapus Karakter"
        onConfirm={handleConfirmDeleteCharacter}
        onCancel={() => setCharToDelete(null)}
      />
    </div>
  );
};
