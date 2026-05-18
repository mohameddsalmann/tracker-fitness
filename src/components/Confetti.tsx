import { useEffect } from "react";
import { motion } from "framer-motion";

const COUNT = 60;
const colors = ["#10B981", "#6366F1", "#F59E0B", "#EF4444", "#3B82F6"];

export function Confetti({ onDone }: { onDone?: () => void }) {
  useEffect(() => {
    const t = setTimeout(() => onDone?.(), 1800);
    return () => clearTimeout(t);
  }, [onDone]);
  return (
    <div className="pointer-events-none fixed inset-0 z-50 overflow-hidden">
      {Array.from({ length: COUNT }).map((_, i) => {
        const x = (Math.random() - 0.5) * 600;
        const y = -200 - Math.random() * 200;
        const rot = Math.random() * 720;
        const c = colors[i % colors.length];
        const delay = Math.random() * 0.15;
        return (
          <motion.span
            key={i}
            initial={{ x: 0, y: 0, opacity: 1, rotate: 0 }}
            animate={{ x, y, opacity: 0, rotate: rot }}
            transition={{ duration: 1.6, delay, ease: [0.16, 1, 0.3, 1] }}
            style={{
              position: "absolute",
              left: "50%",
              top: "50%",
              width: 8,
              height: 14,
              background: c,
              borderRadius: 2,
            }}
          />
        );
      })}
    </div>
  );
}
