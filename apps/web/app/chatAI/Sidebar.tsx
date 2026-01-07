'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, Plus, X, Settings, History, EyeOff, Eye } from 'lucide-react';
import { Button } from './components/Button';

interface SidebarProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  isTransparent: boolean;
  setIsTransparent: (isTransparent: boolean) => void;
}

export function Sidebar({ isOpen, setIsOpen, isTransparent, setIsTransparent }: SidebarProps) {
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
      >
        <div className="w-[280px] flex flex-col h-full p-4">
            <div className="flex items-center justify-between mb-6 pl-2">
                <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
                    <History className="w-5 h-5 text-blue-400" />
                    Historial
                </h2>
                <button 
                    onClick={() => setIsOpen(false)} 
                    className="sm:hidden p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-full transition-colors"
                >
                    <X className="w-5 h-5" />
                </button>
            </div>

            <Button
                onClick={() => {}}
                variant="neutral"
                size="sm"
                className="w-full justify-start mb-6 border border-white/10 hover:bg-white/5"
                iconLeft={<Plus className="w-4 h-4" />}
            >
                Nuevo Chat
            </Button>

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

                <button className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-white/5 text-sm text-white/70 transition-colors">
                    <Settings className="w-4 h-4" />
                    <span>Configuración</span>
                </button>
            </div>
        </div>
      </motion.div>
    </>
  );
}
