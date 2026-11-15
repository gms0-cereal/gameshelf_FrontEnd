
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";

interface ScreenshotLightboxProps {
  activeScreenshot: string | null;
  onClose: () => void;
}

export default function ScreenshotLightbox({
  activeScreenshot,
  onClose,
}: ScreenshotLightboxProps) {
  return (
    <AnimatePresence>
      {activeScreenshot && (
        <motion.div
          role="dialog"
          aria-modal="true"
          aria-label="Enlarged screenshot"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.button
            whileTap={{ scale: 0.92 }}
            type="button"
            onClick={onClose}
            aria-label="Close lightbox"
            className="absolute right-6 top-6 flex size-10 cursor-pointer items-center justify-center rounded-xl border border-[#302438] bg-[#17191E] text-[#E6E1EA] hover:bg-[#20232B]"
          >
            <X className="size-5" />
          </motion.button>

          <motion.img
            initial={{ opacity: 0, scale: 0.94 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{
              type: "spring",
              stiffness: 350,
              damping: 28,
            }}
            src={activeScreenshot}
            alt="Enlarged game screenshot"
            className="max-h-[90vh] max-w-[90vw] rounded-2xl object-contain shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
