import React, { useState } from 'react';
import { DramaProject } from '../types/drama';
import { X, Download, Copy, Check, FileText, Code } from 'lucide-react';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: DramaProject;
}

export const ExportModal: React.FC<ExportModalProps> = ({ isOpen, onClose, project }) => {
  const [copied, setCopied] = useState(false);
  const [exportFormat, setExportFormat] = useState<'screenplay' | 'json'>('screenplay');

  if (!isOpen) return null;

  // Format screenplay in standard Hollywood / Television script format
  const generateScreenplayText = (): string => {
    let script = `${project.title.toUpperCase()}\n`;
    script += `GENRE: ${project.genre}\n`;
    script += `LOGLINE: ${project.logline}\n\n`;
    script += `=========================================================\n\n`;

    if (project.episodes && project.episodes.length > 0) {
      project.episodes.forEach((ep) => {
        script += `>>> ${ep.title.toUpperCase()} <<<\n`;
        if (ep.synopsis) script += `SINOPSIS: ${ep.synopsis}\n\n`;

        ep.scenes.forEach((scene) => {
          script += `${scene.locationType?.toUpperCase() || 'INT'}. ${scene.roomOrLocation.toUpperCase()} - ${scene.timeOfDay?.toUpperCase() || 'MALAM'}\n\n`;
          script += `[CAMERA: ${scene.cameraDirection}]\n`;
          script += `[LIGHTING: ${scene.lighting}]\n`;
          script += `[MOOD: ${scene.mood}]\n`;
          script += `[DURATION: ${scene.durationSeconds || 5} SECONDS]\n\n`;

          scene.dialogues.forEach((dlg) => {
            script += `\t\t\t\t${dlg.speaker.toUpperCase()}\n`;
            if (dlg.emotion) {
              script += `\t\t\t(${dlg.emotion})\n`;
            }
            script += `\t${dlg.text}\n\n`;
          });

          script += `---------------------------------------------------------\n\n`;
        });
        script += `\n`;
      });
    } else {
      script += `EPISODE: ${project.episodeTitle}\n\n`;
      project.scenes.forEach((scene) => {
        script += `${scene.locationType?.toUpperCase() || 'INT'}. ${scene.roomOrLocation.toUpperCase()} - ${scene.timeOfDay?.toUpperCase() || 'MALAM'}\n\n`;
        script += `[CAMERA: ${scene.cameraDirection}]\n`;
        script += `[LIGHTING: ${scene.lighting}]\n`;
        script += `[MOOD: ${scene.mood}]\n`;
        script += `[DURATION: ${scene.durationSeconds || 5} SECONDS]\n\n`;

        scene.dialogues.forEach((dlg) => {
          script += `\t\t\t\t${dlg.speaker.toUpperCase()}\n`;
          if (dlg.emotion) {
            script += `\t\t\t(${dlg.emotion})\n`;
          }
          script += `\t${dlg.text}\n\n`;
        });

        script += `---------------------------------------------------------\n\n`;
      });
    }

    return script;
  };

  const scriptContent =
    exportFormat === 'screenplay'
      ? generateScreenplayText()
      : JSON.stringify(project, null, 2);

  const handleCopy = () => {
    navigator.clipboard.writeText(scriptContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const filename =
      exportFormat === 'screenplay'
        ? `${project.title.toLowerCase().replace(/\s+/g, '-')}-naskah.txt`
        : `${project.title.toLowerCase().replace(/\s+/g, '-')}-project.json`;

    const blob = new Blob([scriptContent], {
      type: exportFormat === 'screenplay' ? 'text/plain' : 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="w-full max-w-3xl bg-neutral-950 rounded-2xl border border-neutral-800 shadow-2xl flex flex-col overflow-hidden max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-800 bg-neutral-900/80">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-rose-500" />
            <h2 className="text-base font-bold text-white font-display">
              Ekspor Naskah & Proyek Serial Drama
            </h2>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switch */}
        <div className="px-6 pt-4 flex items-center justify-between border-b border-neutral-800 pb-3">
          <div className="flex items-center gap-2 bg-neutral-900 p-1 rounded-xl border border-neutral-800">
            <button
              onClick={() => setExportFormat('screenplay')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                exportFormat === 'screenplay'
                  ? 'bg-rose-600 text-white shadow-sm'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Naskah Skenario Standar</span>
            </button>
            <button
              onClick={() => setExportFormat('json')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                exportFormat === 'json'
                  ? 'bg-rose-600 text-white shadow-sm'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              <Code className="w-3.5 h-3.5" />
              <span>JSON Data Proyek</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-neutral-900 hover:bg-neutral-800 text-neutral-300 text-xs font-medium rounded-lg border border-neutral-800 transition-colors"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Tersalin' : 'Salin Naskah'}</span>
            </button>

            <button
              onClick={handleDownload}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Unduh File</span>
            </button>
          </div>
        </div>

        {/* Script Viewer Container */}
        <div className="flex-1 p-6 overflow-y-auto font-mono text-xs text-neutral-300 bg-neutral-950/60 leading-relaxed whitespace-pre-wrap select-all">
          {scriptContent}
        </div>
      </div>
    </div>
  );
};
