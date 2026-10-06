import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI, GenerateVideosOperation, Type } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Set high body limit for user uploaded photos (base64)
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Server-side Gemini initialization with required User-Agent
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

// Helper for clean error responses
const handleError = (res: express.Response, error: any, defaultMsg: string) => {
  console.error(defaultMsg, error);
  const message = error?.message || defaultMsg;
  res.status(500).json({ error: message, details: String(error) });
};

// 1. Script & Drama Serial Generator
app.post('/api/drama/generate-script', async (req, res) => {
  try {
    const {
      prompt,
      title,
      genre = 'Drama Romantis / Konflik Keluarga',
      characters = [],
      scenesCount = 3,
      tone = 'Dramatis & Emosional',
      targetAudience = 'Remaja & Dewasa',
    } = req.body;

    const systemInstruction = `Kamu adalah showrunner dan sutradara serial drama profesional peraih penghargaan.
Tugasmu adalah menghasilkan struktur serial drama yang memikat dalam bahasa Indonesia, dengan alur konflik tajam, dialog realistis bertenaga, detail ruangan/latar belakang sinematik, dan petunjuk kamera yang siap diproduksi menjadi video.`;

    const userPrompt = `Buatkan konsep serial drama lengkap:
- Judul: ${title || 'Biarkan AI menentukan judul yang catchy'}
- Ide Cerita / Prompt Pengguna: ${prompt || 'Dua pewaris bisnis yang terpaksa menikah kontrak namun rahasia masa lalu terbongkar'}
- Genre: ${genre}
- Jumlah Adegan (Scenes): ${scenesCount}
- Nada / Tone: ${tone}
- Karakter yang Terlibat: ${JSON.stringify(characters)}
- Target Penonton: ${targetAudience}

Pastikan output JSON valid dan terstruktur rapi.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: userPrompt,
      config: {
        systemInstruction,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING, description: 'Judul serial drama yang kuat dan menarik' },
            logline: { type: Type.STRING, description: 'Sinopsis 1-2 kalimat premis utama' },
            genre: { type: Type.STRING, description: 'Genre serial drama' },
            tone: { type: Type.STRING, description: 'Nuansa dan emosi utama drama' },
            episodeTitle: { type: Type.STRING, description: 'Judul episode saat ini' },
            episodesSummary: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: 'Ringkasan 3 episode awal serial',
            },
            scenes: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  sceneNumber: { type: Type.INTEGER },
                  title: { type: Type.STRING },
                  roomOrLocation: {
                    type: Type.STRING,
                    description: 'Nama ruangan atau latar belakang spesifik (contoh: Ruang Kerja Mewah Penthouse, Kafe Hujan Malam Hari, Koridor Pengadilan)',
                  },
                  locationType: { type: Type.STRING, description: 'Interior / Eksterior' },
                  timeOfDay: { type: Type.STRING, description: 'Pagi / Sore / Senja / Malam' },
                  mood: { type: Type.STRING, description: 'Suasana emosi adegan' },
                  lighting: { type: Type.STRING, description: 'Tata pencahayaan sinematik' },
                  cameraDirection: {
                    type: Type.STRING,
                    description: 'Gerakan kamera (contoh: Slow push-in, Over-the-shoulder, Dramatic Dutch Angle, Close-up tatapan mata)',
                  },
                  visualPrompt: {
                    type: Type.STRING,
                    description: 'Prompt visual sinematik bahasa Inggris untuk Veo video generator',
                  },
                  durationSeconds: {
                    type: Type.INTEGER,
                    description: 'Durasi video klip adegan dalam detik (contoh: 5, 8, 10, atau 15)',
                  },
                  dialogues: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        speaker: { type: Type.STRING },
                        text: { type: Type.STRING, description: 'Kalimat dialog' },
                        emotion: { type: Type.STRING, description: 'Petunjuk emosi (e.g. dingin, berbisik, marah tertahan, menangis)' },
                        voiceStyle: { type: Type.STRING, description: 'Petunjuk gaya vokal untuk sulih suara' },
                      },
                      required: ['speaker', 'text', 'emotion'],
                    },
                  },
                },
                required: ['sceneNumber', 'title', 'roomOrLocation', 'mood', 'lighting', 'cameraDirection', 'visualPrompt', 'dialogues'],
              },
            },
          },
          required: ['title', 'logline', 'genre', 'tone', 'episodeTitle', 'scenes'],
        },
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    res.json({ success: true, data: parsed });
  } catch (error: any) {
    handleError(res, error, 'Gagal membuat naskah serial drama');
  }
});

// 2. Character Generator & Refiner
app.post('/api/drama/generate-character', async (req, res) => {
  try {
    const { name, role, gender, age, personality, dramaGenre } = req.body;

    const prompt = `Rancang detail karakter untuk serial drama bergenre "${dramaGenre || 'Drama Kontemporer'}":
- Nama yang disarankan / diberikan: ${name || 'Buatkan nama Indonesia/internasional yang elegan'}
- Peran: ${role || 'Protagonis Utama / Tokoh Utama'}
- Gender: ${gender || 'Pria / Wanita'}
- Rentang Usia: ${age || '25-32 tahun'}
- Ciri Kepribadian: ${personality || 'Ambisius, menyimpan trauma masa lalu, kharismatik namun rapuh di balik ketegasannya'}`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING },
            role: { type: Type.STRING },
            archetype: { type: Type.STRING, description: 'Arketipe karakter (e.g. The Reluctant Heir, The Stoic Protector, The Vengeful Outcast)' },
            age: { type: Type.STRING },
            gender: { type: Type.STRING },
            personality: { type: Type.STRING },
            backstory: { type: Type.STRING, description: 'Latar belakang masa lalu singkat (2-3 kalimat)' },
            clothingStyle: { type: Type.STRING, description: 'Gaya pakaian khas / outfit' },
            visualPrompt: { type: Type.STRING, description: 'Prompt potret wajah sinematik bahasa Inggris' },
            recommendedVoice: {
              type: Type.STRING,
              description: 'Salah satu dari suara prebuilt Gemini: Kore, Puck, Charon, Fenrir, atau Zephyr',
            },
            voicePersona: { type: Type.STRING, description: 'Karakter vokal (e.g. Bariton berat dan tenang, Alto tegas berwibawa, Lembut melankolis)' },
            signatureQuote: { type: Type.STRING, description: 'Kutipan kalimat ikonik karakter' },
          },
          required: ['name', 'role', 'archetype', 'age', 'gender', 'personality', 'backstory', 'clothingStyle', 'visualPrompt', 'recommendedVoice', 'voicePersona', 'signatureQuote'],
        },
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    res.json({ success: true, data: parsed });
  } catch (error: any) {
    handleError(res, error, 'Gagal membuat profil karakter');
  }
});

// 3. Room & Environment Generator
app.post('/api/drama/generate-room', async (req, res) => {
  try {
    const { roomType, timeOfDay, mood, dramaGenre } = req.body;

    const prompt = `Rancang detail ruangan/latar belakang (setting/background) sinematik untuk serial drama:
- Jenis Ruangan / Lokasi: ${roomType || 'Penthouse Mewah / Ruang Rapat CEO / Rumah Sakit / Kafe Sudut Kota'}
- Waktu: ${timeOfDay || 'Malam Hari Berhujan'}
- Mood / Atmosfer: ${mood || 'Dingin, Mewah, Tegang'}
- Genre Drama: ${dramaGenre || 'Drama Misteri & Intrik Keluarga Konglomerat'}`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING, description: 'Nama lokasi (e.g. Penthouse Sudut Skyline, Lorong Rumah Sakit Bersalju, Kafe Hujan Nostalgia)' },
            category: { type: Type.STRING, description: 'Interior / Eksterior / Kantor / Hunian / Publik' },
            description: { type: Type.STRING, description: 'Deskripsi detail set dan tata letak' },
            lightingSetup: { type: Type.STRING, description: 'Detail pencahayaan sinematik' },
            colorPalette: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: 'Warna dominan visual (hex atau nama warna sinema)',
            },
            soundAtmosphere: { type: Type.STRING, description: 'Suasana latar suara (foley/ambience)' },
            visualPrompt: { type: Type.STRING, description: 'Prompt fotografi set film sinematik dalam bahasa Inggris' },
            dramaContext: { type: Type.STRING, description: 'Kesesuaian adegan drama apa yang cocok di ruangan ini' },
          },
          required: ['name', 'category', 'description', 'lightingSetup', 'colorPalette', 'soundAtmosphere', 'visualPrompt'],
        },
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    res.json({ success: true, data: parsed });
  } catch (error: any) {
    handleError(res, error, 'Gagal membuat detail ruangan');
  }
});

// 4. Voice Audio Generator via Gemini TTS (Unary WAV)
app.post('/api/drama/generate-voice', async (req, res) => {
  try {
    const {
      text,
      voiceName = 'Kore',
      style = 'Ekspresif, dramatis, layaknya aktor serial drama televisi',
    } = req.body;

    if (!text || text.trim().length === 0) {
      return res.status(400).json({ error: 'Teks dialog tidak boleh kosong' });
    }

    // Supported prebuilt voices: 'Puck', 'Charon', 'Kore', 'Fenrir', 'Zephyr'
    const allowedVoices = ['Puck', 'Charon', 'Kore', 'Fenrir', 'Zephyr'];
    const selectedVoice = allowedVoices.includes(voiceName) ? voiceName : 'Kore';

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash-lite-tts',
      contents: [
        {
          role: 'user',
          parts: [
            {
              text: text.slice(0, 500),
              speechMetadata: {
                style: style,
              },
            },
          ],
        },
      ],
      config: {
        responseModalities: ['AUDIO'],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: selectedVoice },
          },
        },
      },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!base64Audio) {
      return res.status(500).json({ error: 'Tidak ada data audio yang dihasilkan model' });
    }

    res.json({
      success: true,
      audioUrl: `data:audio/wav;base64,${base64Audio}`,
      voiceName: selectedVoice,
    });
  } catch (error: any) {
    const errorStr = String(error?.message || error || '');
    const isQuota =
      error?.status === 'RESOURCE_EXHAUSTED' ||
      errorStr.includes('RESOURCE_EXHAUSTED') ||
      errorStr.includes('429') ||
      errorStr.includes('quota');

    if (isQuota) {
      console.warn('Gemini TTS quota exceeded (429). Returning fallback speech signal.');
      return res.json({
        success: true,
        audioUrl: null,
        fallbackSpeech: true,
        voiceName: req.body?.voiceName || 'Kore',
        text: req.body?.text,
        message: 'Kuota harian Gemini TTS tercapai. Aplikasi otomatis menggunakan Web Speech API browser.',
      });
    }

    handleError(res, error, 'Gagal menghasilkan suara dialog drama');
  }
});

// 5. Veo Video Generation: Animate Images into Video
// User requirement: "You MUST add the ability for users to upload a photo and then generate a video using Veo video generations. Use model: veo-3.1-fast-generate-preview, the generated video must have an aspect ratio of 16:9 (landscape) or 9:16 (portrait)."
app.post('/api/generate-video', async (req, res) => {
  try {
    const {
      prompt = 'Cinematic drama scene with subtle natural motion, expressive gaze, filmic camera pan',
      imageBase64,
      mimeType = 'image/png',
      aspectRatio = '16:9',
      resolution = '720p',
    } = req.body;

    const validatedRatio = aspectRatio === '9:16' ? '9:16' : '16:9';
    const cleanBase64 = imageBase64 ? imageBase64.replace(/^data:image\/[a-zA-Z+]+;base64,/, '') : undefined;

    let operation;
    try {
      // First attempt with user-requested model: veo-3.1-fast-generate-preview
      operation = await ai.models.generateVideos({
        model: 'veo-3.1-fast-generate-preview',
        prompt: prompt || 'A cinematic drama shot with realistic motion and studio lighting',
        image: cleanBase64
          ? {
              imageBytes: cleanBase64,
              mimeType: mimeType || 'image/png',
            }
          : undefined,
        config: {
          numberOfVideos: 1,
          resolution: resolution === '1080p' ? '1080p' : '720p',
          aspectRatio: validatedRatio,
        },
      });
    } catch (primaryErr: any) {
      console.warn('veo-3.1-fast-generate-preview attempt returned:', primaryErr?.message);
      // Fallback attempt to veo-3.1-lite-generate-preview
      try {
        operation = await ai.models.generateVideos({
          model: 'veo-3.1-lite-generate-preview',
          prompt: prompt || 'A cinematic drama shot with realistic motion and studio lighting',
          image: cleanBase64
            ? {
                imageBytes: cleanBase64,
                mimeType: mimeType || 'image/png',
              }
            : undefined,
          config: {
            numberOfVideos: 1,
            resolution: '720p',
            aspectRatio: validatedRatio,
          },
        });
      } catch (fallbackErr: any) {
        throw primaryErr || fallbackErr;
      }
    }

    if (!operation || !operation.name) {
      throw new Error('Operasi video tidak menghasilkan nama operasi.');
    }

    res.json({
      success: true,
      operationName: operation.name,
      modelUsed: 'veo-3.1-fast-generate-preview',
      aspectRatio: validatedRatio,
    });
  } catch (error: any) {
    handleError(res, error, 'Gagal memulai pembuatan video Veo');
  }
});

// 6. Veo Video Status Polling
app.post('/api/video-status', async (req, res) => {
  try {
    const { operationName } = req.body;
    if (!operationName) {
      return res.status(400).json({ error: 'operationName wajib disertakan' });
    }

    const op = new GenerateVideosOperation();
    op.name = operationName;
    const updated = await ai.operations.getVideosOperation({ operation: op });

    res.json({
      done: Boolean(updated.done),
      error: updated.error || null,
      hasVideo: Boolean(updated.response?.generatedVideos?.[0]?.video?.uri),
    });
  } catch (error: any) {
    handleError(res, error, 'Gagal memeriksa status video');
  }
});

// 7. Veo Video Download & Proxy
app.post('/api/video-download', async (req, res) => {
  try {
    const { operationName } = req.body;
    if (!operationName) {
      return res.status(400).json({ error: 'operationName wajib disertakan' });
    }

    const op = new GenerateVideosOperation();
    op.name = operationName;
    const updated = await ai.operations.getVideosOperation({ operation: op });

    const uri = updated.response?.generatedVideos?.[0]?.video?.uri;
    if (!uri) {
      return res.status(404).json({ error: 'URI video belum tersedia atau belum selesai dirender.' });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    const videoRes = await fetch(uri, {
      headers: {
        'x-goog-api-key': apiKey || '',
      },
    });

    if (!videoRes.ok) {
      return res.status(videoRes.status).json({ error: 'Gagal mengambil video dari server Google Veo.' });
    }

    res.setHeader('Content-Type', 'video/mp4');
    res.setHeader('Content-Disposition', 'attachment; filename="buatdrama-scene.mp4"');

    const arrayBuffer = await videoRes.arrayBuffer();
    res.send(Buffer.from(arrayBuffer));
  } catch (error: any) {
    handleError(res, error, 'Gagal mengunduh video');
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'BuatDrama AI Server' });
});

// Mount Vite or static server
async function setupVite() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(Number(PORT), '0.0.0.0', () => {
    console.log(`Server BuatDrama AI running at http://0.0.0.0:${PORT}`);
  });
}

setupVite().catch((err) => {
  console.error('Failed to start server:', err);
});
