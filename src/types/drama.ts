export interface DramaDialogue {
  id: string;
  speaker: string;
  text: string;
  emotion: string;
  voiceStyle?: string;
  audioUrl?: string;
}

export interface DramaScene {
  id: string;
  sceneNumber: number;
  title: string;
  roomOrLocation: string;
  locationType?: string;
  timeOfDay?: string;
  mood: string;
  lighting: string;
  cameraDirection: string;
  visualPrompt: string;
  dialogues: DramaDialogue[];
  customImageUrl?: string;
  videoUrl?: string;
  videoOperationName?: string;
  videoStatus?: 'idle' | 'generating' | 'ready' | 'failed';
  videoAspectRatio?: '16:9' | '9:16';
  durationSeconds?: number;
  episodeNumber?: number;
}

export interface DramaEpisode {
  id: string;
  episodeNumber: number;
  title: string;
  synopsis?: string;
  scenes: DramaScene[];
}

export interface DramaCharacter {
  id: string;
  name: string;
  role: string;
  gender: string;
  age: string;
  archetype: string;
  personality: string;
  backstory: string;
  clothingStyle: string;
  avatarUrl?: string;
  avatarPlaceholderColor: string;
  recommendedVoice: 'Kore' | 'Puck' | 'Charon' | 'Fenrir' | 'Zephyr';
  voicePersona: string;
  signatureQuote: string;
  customUploadedPhoto?: string;
}

export interface DramaRoom {
  id: string;
  name: string;
  category: string;
  description: string;
  lightingSetup: string;
  colorPalette: string[];
  soundAtmosphere: string;
  visualPrompt: string;
  backdropGradient: string;
  customUploadedPhoto?: string;
  mood: string;
}

export interface SavedVideoClip {
  id: string;
  title: string;
  videoUrl: string;
  sourceType: 'photo_animate' | 'script_scene' | 'text_prompt';
  sourceDescription: string;
  episodeNumber?: number;
  sceneNumber?: number;
  sceneId?: string;
  aspectRatio: '16:9' | '9:16';
  durationSeconds: number;
  characterNames?: string[];
  roomName?: string;
  thumbnailUrl?: string;
  createdAt: number;
}

export interface DramaProject {
  id: string;
  title: string;
  logline: string;
  genre: string;
  tone: string;
  episodeTitle: string;
  episodesSummary: string[];
  characters: DramaCharacter[];
  rooms: DramaRoom[];
  scenes: DramaScene[];
  episodes?: DramaEpisode[];
  aspectRatio: '16:9' | '9:16';
  savedClips?: SavedVideoClip[];
}

export interface AnimateVideoRequest {
  id: string;
  prompt: string;
  imageBase64: string;
  mimeType: string;
  aspectRatio: '16:9' | '9:16';
  resolution: '720p' | '1080p';
  status: 'idle' | 'starting' | 'polling' | 'ready' | 'error';
  operationName?: string;
  videoUrl?: string;
  progressPercent: number;
  statusMessage: string;
  errorMessage?: string;
  createdAt: number;
}
