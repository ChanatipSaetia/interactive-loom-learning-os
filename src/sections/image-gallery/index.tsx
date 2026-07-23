import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, ChevronLeft, ChevronRight, ImageOff } from 'lucide-react';
import { SectionTitleBar } from '../../components/layout/SectionTitleBar';

export interface GalleryItem {
  id: string;
  url: string;
  caption: string;
  credit?: string;
}

export interface ImageGalleryProps {
  title?: string;
  items?: GalleryItem[];
  sectionIndex?: number;
}

function GalleryImage({ item, onClick }: { item: GalleryItem; onClick: () => void }) {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);

  return (
    <motion.button
      className="group relative w-full aspect-video rounded-lg overflow-hidden border border-border/50 bg-muted/20 flex items-center justify-center p-2 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
      onClick={onClick}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      transition={{ type: 'spring', stiffness: 300, damping: 24 }}
      aria-label={`Open image: ${item.caption}`}
    >
      {!loaded && !error && (
        <div className="absolute inset-0 bg-muted/30 animate-pulse flex items-center justify-center">
          <div className="w-8 h-8 rounded-full bg-muted/50" />
        </div>
      )}

      {error && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-muted-foreground">
          <ImageOff className="w-6 h-6" />
          <span className="text-xs font-mono">Image unavailable</span>
        </div>
      )}

      {!error && (
        <img
          src={item.url}
          alt={item.caption}
          loading="lazy"
          className={`max-w-full max-h-full object-contain transition-all duration-500 group-hover:scale-105 ${loaded ? 'opacity-100' : 'opacity-0'}`}
          onLoad={() => setLoaded(true)}
          onError={() => setError(true)}
        />
      )}

      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-3 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out z-10">
        <p className="text-white text-sm font-medium leading-snug line-clamp-2">{item.caption}</p>
        {item.credit && (
          <p className="text-white/60 text-xs mt-0.5 truncate">{item.credit}</p>
        )}
      </div>
    </motion.button>
  );
}

function Lightbox({
  items,
  initialIndex,
  onClose,
}: {
  items: GalleryItem[];
  initialIndex: number;
  onClose: () => void;
}) {
  const [index, setIndex] = useState(initialIndex);
  const [direction, setDirection] = useState(0);
  const item = items[index];

  const goPrev = useCallback(() => {
    setDirection(-1);
    setIndex((i) => (i - 1 + items.length) % items.length);
  }, [items.length]);

  const goNext = useCallback(() => {
    setDirection(1);
    setIndex((i) => (i + 1) % items.length);
  }, [items.length]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') goPrev();
      if (e.key === 'ArrowRight') goNext();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose, goPrev, goNext]);

  const slideVariants = {
    initial: (dir: number) => ({ x: dir > 0 ? 80 : -80, opacity: 0 }),
    active: { x: 0, opacity: 1, transition: { type: 'spring' as const, damping: 22, stiffness: 200 } },
    exit: (dir: number) => ({ x: dir > 0 ? -80 : 80, opacity: 0, transition: { duration: 0.15 } }),
  };

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
      id="lightbox-overlay"
    >
      <button
        id="lightbox-close-btn"
        onClick={onClose}
        className="absolute top-4 right-4 w-10 h-10 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors z-10"
        aria-label="Close lightbox"
      >
        <X className="w-5 h-5" />
      </button>

      <div className="absolute top-4 left-1/2 -translate-x-1/2 font-mono text-xs text-white/60 tracking-widest">
        {String(index + 1).padStart(2, '0')} / {String(items.length).padStart(2, '0')}
      </div>

      {items.length > 1 && (
        <button
          id="lightbox-prev-btn"
          onClick={(e) => { e.stopPropagation(); goPrev(); }}
          className="absolute left-4 w-12 h-12 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors z-10"
          aria-label="Previous image"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
      )}

      {items.length > 1 && (
        <button
          id="lightbox-next-btn"
          onClick={(e) => { e.stopPropagation(); goNext(); }}
          className="absolute right-4 w-12 h-12 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors z-10"
          aria-label="Next image"
        >
          <ChevronRight className="w-6 h-6" />
        </button>
      )}

      <div
        className="flex flex-col items-center max-w-5xl w-full px-20 gap-4"
        onClick={(e) => e.stopPropagation()}
      >
        <AnimatePresence custom={direction} mode="wait" initial={false}>
          <motion.div
            key={item.id}
            custom={direction}
            variants={slideVariants}
            initial="initial"
            animate="active"
            exit="exit"
            className="w-full flex justify-center"
          >
            <img
              src={item.url}
              alt={item.caption}
              className="max-w-full max-h-[70vh] object-contain rounded-lg shadow-2xl"
            />
          </motion.div>
        </AnimatePresence>

        <AnimatePresence mode="wait">
          <motion.div
            key={item.id + '-caption'}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.2 }}
            className="text-center space-y-1"
          >
            <p className="text-white font-medium text-base leading-snug">{item.caption}</p>
            {item.credit && (
              <p className="text-white/50 text-xs font-mono">{item.credit}</p>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

export default function ImageGallery({ title, items = [], sectionIndex = 0 }: ImageGalleryProps) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  if (!items || items.length === 0) {
    return (
      <div className="p-8 text-center text-muted-foreground font-mono text-sm">
        No gallery images provided.
      </div>
    );
  }

  return (
    <div className="w-full max-w-full" id="image-gallery">
      <SectionTitleBar title={title || 'Image Gallery'} sectionIndex={sectionIndex} />
      <div className="flex items-center w-full mb-6">
        <div className="flex-shrink-0 flex items-center px-3.5 py-1.5 rounded-full bg-muted/10 border border-border font-mono text-xs font-bold tracking-widest text-muted-foreground ml-4">
          {String(items.length).padStart(2, '0')} images
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {items.map((item, idx) => (
          <GalleryImage
            key={item.id}
            item={item}
            onClick={() => setLightboxIndex(idx)}
          />
        ))}
      </div>

      <AnimatePresence>
        {lightboxIndex !== null && (
          <Lightbox
            items={items}
            initialIndex={lightboxIndex}
            onClose={() => setLightboxIndex(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
