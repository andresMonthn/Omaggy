'use client';

import { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MessageSquare,
  Plus,
  X,
  Settings,
  EyeOff,
  Eye,
  Download,
  AudioLines,
  Trash2,
} from 'lucide-react';
import { Button } from './components/Button';

interface SidebarProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  isTransparent: boolean;
  setIsTransparent: (isTransparent: boolean) => void;
  hasMessages: boolean;
  onDownloadConversation: () => void;
  onClearConversation: () => void;
  hasAudioBridge: boolean;
  isSystemCapturing: boolean;
  setIsSystemCapturing: (isCapturing: boolean) => void;
}

export function Sidebar({
  isOpen,
  setIsOpen,
  isTransparent,
  setIsTransparent,
  hasMessages,
  onDownloadConversation,
  onClearConversation,
  hasAudioBridge,
  isSystemCapturing,
  setIsSystemCapturing,
}: SidebarProps) {
  const [showSettings, setShowSettings] = useState(false);
  const [audioDevices, setAudioDevices] = useState<MediaDeviceInfo[]>([]);
  const [devicesLoading, setDevicesLoading] = useState(false);
  const [devicesError, setDevicesError] = useState<string | null>(null);
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [micLevel, setMicLevel] = useState(0);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const rafRef = useRef<number | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);

  useEffect(() => {
    if (!showSettings) {
      return;
    }

    if (typeof navigator === 'undefined' || !navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) {
      setDevicesError('El navegador no expone dispositivos de audio');
      return;
    }

    let cancelled = false;
    setDevicesLoading(true);
    setDevicesError(null);

    navigator.mediaDevices
      .enumerateDevices()
      .then((devices) => {
        if (cancelled) return;
        const inputs = devices.filter((d) => d.kind === 'audioinput');
        setAudioDevices(inputs);
        if (!inputs.length) {
          setDevicesError('No se encontraron dispositivos de entrada de audio');
        }
      })
      .catch((err) => {
        if (cancelled) return;
        setDevicesError(err?.message || 'No se pudieron obtener los dispositivos de audio');
      })
      .finally(() => {
        if (cancelled) return;
        setDevicesLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [showSettings]);

  const startMonitoring = async () => {
    if (isMonitoring) return;
    if (typeof navigator === 'undefined' || !navigator.mediaDevices) {
      setDevicesError('El navegador no expone dispositivos de audio');
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,
        },
        video: false,
      } as any);
      streamRef.current = stream;
      const AC: any = (window as any).AudioContext || (window as any).webkitAudioContext;
      const ctx = new AC();
      audioCtxRef.current = ctx;
      const source = ctx.createMediaStreamSource(stream);
      sourceRef.current = source;
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 2048;
      source.connect(analyser);
      analyserRef.current = analyser;
      setIsMonitoring(true);
      const buffer = new Float32Array(analyser.frequencyBinCount);
      const tick = () => {
        analyser.getFloatTimeDomainData(buffer);
        let sum = 0;
        for (let i = 0; i < buffer.length; i++) {
          const v = buffer[i] ?? 0;
          sum += v * v;
        }
        const rms = Math.sqrt(sum / buffer.length);
        const clamped = Math.max(0, Math.min(1, rms));
        setMicLevel(clamped);
        rafRef.current = requestAnimationFrame(tick);
      };
      tick();
    } catch (err: any) {
      setDevicesError(err?.message || 'No se pudo acceder al micrófono');
    }
  };

  const stopMonitoring = () => {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    if (sourceRef.current) {
      try {
        sourceRef.current.disconnect();
      } catch { }
      sourceRef.current = null;
    }
    if (analyserRef.current) {
      try {
        analyserRef.current.disconnect();
      } catch { }
      analyserRef.current = null;
    }
    if (audioCtxRef.current) {
      try {
        audioCtxRef.current.close();
      } catch { }
      audioCtxRef.current = null;
    }
    if (streamRef.current) {
      try {
        streamRef.current.getTracks().forEach((t) => t.stop());
      } catch { }
      streamRef.current = null;
    }
    setIsMonitoring(false);
    setMicLevel(0);
  };

  useEffect(() => {
    if (!showSettings && isMonitoring) {
      stopMonitoring();
    }
  }, [showSettings]);

  return (
    <>
      {/* Mobile Overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsOpen(false)}
            className="fixed inset-0 bg-black/50 z-40 sm:hidden backdrop-blur-sm"
          />
        )}
      </AnimatePresence>

      {/* Sidebar Content */}
      <motion.div
        className="fixed sm:relative z-40 h-[100dvh] bg-black/30 backdrop-blur-md border-r border-white/10 flex-shrink-0 flex flex-col overflow-hidden"
        initial={false}
        animate={{
          width: isOpen ? 280 : 0,
          opacity: isOpen ? 1 : 0
        }}
        transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
        style={{ WebkitAppRegion: 'no-drag' } as any}
      >
        <div className="w-[280px] flex flex-col h-full p-4">
            <div className="flex items-center justify-between mb-6 pl-2">
                <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-blue-400" />
              Omaggy
                </h2>
                <button 
                    onClick={() => setIsOpen(false)} 
                    className="sm:hidden p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-full transition-colors"
                >
                    <X className="w-5 h-5" />
                </button>
            </div>

            <Button
            onClick={onClearConversation}
            disabled={!hasMessages}
                variant="neutral"
                size="sm"
                className="w-full justify-start mb-6 border border-white/10 hover:bg-white/5"
            iconLeft={<Trash2 className="w-4 h-4" />}
            >
            Limpiar conversación
            </Button>

          {hasMessages && (
            <Button
              onClick={onDownloadConversation}
              variant="neutral"
              size="sm"
              className="w-full justify-start mb-6 border border-white/10 hover:bg-white/5"
              iconLeft={<Download className="w-4 h-4" />}
            >
              Descargar conversación
            </Button>
          )}

            <div className="flex-1 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                {/* Empty History for now */}
                <div className="flex flex-col items-center justify-center h-full text-white/30 text-sm italic">
                    <p>No hay chats recientes</p>
                </div>
            </div>
            
             <div className="mt-auto pt-4 border-t border-white/10 space-y-2">
                <Button
                    onClick={() => setIsTransparent(!isTransparent)}
                    toggleTransparency={true}
                    variant="neutral"
                    size="sm"
                    className="w-full justify-start hover:bg-white/5"
                    iconLeft={isTransparent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    title={isTransparent ? "Desactivar modo transparente" : "Activar modo transparente"}
                >
                   {isTransparent ? "Modo Normal" : "Modo Transparente"}
                </Button>

            <Button
              onClick={() => {
                if (!hasAudioBridge) {
                  return;
                }

                if (typeof window === 'undefined' || !(window as any).audio) {
                  return;
                }

                if (!isSystemCapturing) {
                  (window as any).audio.start({ source: 'system' });
                  setIsSystemCapturing(true);
                } else {
                  (window as any).audio.stop();
                  setIsSystemCapturing(false);
                }
              }}
              disabled={!hasAudioBridge}
              variant={isSystemCapturing ? 'primary' : 'neutral'}
              size="sm"
              className="w-full justify-start hover:bg-white/5"
              iconLeft={<AudioLines className="w-4 h-4" />}
              title={
                !hasAudioBridge
                  ? 'Captura de audio disponible solo en la app de escritorio'
                  : isSystemCapturing
                    ? 'Detener captura de audio del sistema'
                    : 'Iniciar captura de audio del sistema'
              }
            >
              Captura de audio del sistema
            </Button>

            <button
              className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-white/5 text-sm text-white/70 transition-colors"
              onClick={() => setShowSettings((s) => !s)}
            >
                    <Settings className="w-4 h-4" />
                    <span>Configuración</span>
                </button>
            {showSettings && (
              <div className="mt-2 rounded-lg border border-white/10 bg-black/40 p-3 text-xs text-white/80 space-y-2">
                <div className="font-semibold text-white/90">Dispositivos de entrada de audio</div>
                {devicesLoading && <div className="text-white/60">Buscando dispositivos...</div>}
                {!devicesLoading && devicesError && (
                  <div className="text-red-400">{devicesError}</div>
                )}
                {!devicesLoading && !devicesError && !audioDevices.length && (
                  <div className="text-white/60">No se detectaron micrófonos disponibles.</div>
                )}
                {!devicesLoading && audioDevices.length > 0 && (
                  <ul className="space-y-1 max-h-32 overflow-y-auto custom-scrollbar pr-1">
                    {audioDevices.map((d) => (
                      <li
                        key={d.deviceId || d.label || d.kind}
                        className="flex flex-col rounded-md bg-white/5 px-2 py-1"
                      >
                        <span className="text-white text-[0.72rem] break-all">
                          {d.label || 'Micrófono sin nombre'}
                        </span>
                        <span className="text-white/50 text-[0.68rem]">
                          {d.deviceId || 'ID no disponible'}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
                <div className="text-white/50 text-[0.68rem]">
                  Esta lista refleja los dispositivos que Windows expone a la aplicación. Si no ves tu
                  micrófono aquí, revisa los permisos de audio del sistema y del antivirus.
                </div>
                <div className="mt-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-white/80">Nivel de entrada del micrófono</span>
                    <button
                      onClick={() => {
                        if (isMonitoring) {
                          stopMonitoring();
                        } else {
                          startMonitoring();
                        }
                      }}
                      className={`px-2 py-1 rounded-md border border-white/10 ${isMonitoring ? 'bg-white/20' : 'bg-white/10'} hover:bg-white/20 transition-colors`}
                    >
                      {isMonitoring ? 'Detener' : 'Monitorear'}
                    </button>
                  </div>
                  <div className="h-3 w-full rounded-md bg-white/10 overflow-hidden">
                    <div
                      className="h-3 bg-gradient-to-r from-green-400 via-yellow-400 to-red-500 transition-[width] duration-75 ease-linear"
                      style={{ width: `${Math.round(micLevel * 100)}%` }}
                    />
                  </div>
                  <div className="text-white/60">
                    {`${Math.round(micLevel * 100)}%`}
                  </div>
                </div>
              </div>
            )}
            </div>
        </div>
      </motion.div>
    </>
  );
}
