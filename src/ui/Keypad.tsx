import { type ReactNode, useEffect, useState } from "react";
import { haptic } from "./haptics";
import { IconDelete } from "./icons";
import { sfx } from "./sound";

interface Props {
  onDigit: (d: string) => void;
  onDelete: () => void;
  onSkip?: () => void;
  disabled?: boolean;
}

const KEYS = ["1", "2", "3", "4", "5", "6", "7", "8", "9"];

/** Una tecla: se hunde al tocarla (el :active de iOS no es confiable con preventDefault). */
function Key({ label, className = "key", onPress, children, disabled }: { label: string; className?: string; onPress: () => void; children: ReactNode; disabled?: boolean }) {
  const [down, setDown] = useState(false);
  return (
    <button
      className={`${className}${down ? " pressed" : ""}`}
      aria-label={label}
      onPointerDown={(e) => {
        e.preventDefault();
        if (disabled) return;
        setDown(true);
        sfx.tap();
        haptic("tap");
        onPress();
      }}
      onPointerUp={() => setDown(false)}
      onPointerLeave={() => setDown(false)}
      onPointerCancel={() => setDown(false)}
    >
      {children}
    </button>
  );
}

/** Teclado numérico propio. También acepta el teclado físico (para practicar en el computador). */
export function Keypad({ onDigit, onDelete, onSkip, disabled }: Props) {
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (disabled) return;
      if (/^[0-9]$/.test(e.key)) onDigit(e.key);
      else if (e.key === "Backspace") onDelete();
      else if (e.key === "?" && onSkip) onSkip();
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [onDigit, onDelete, onSkip, disabled]);

  return (
    <div className="keypad" aria-label="Teclado numérico">
      {KEYS.map((k) => <Key key={k} label={k} onPress={() => onDigit(k)} disabled={disabled}>{k}</Key>)}
      {onSkip ? <Key label="No sé" className="key fn" onPress={onSkip} disabled={disabled}>No sé</Key> : <span />}
      <Key label="0" onPress={() => onDigit("0")} disabled={disabled}>0</Key>
      <Key label="Borrar" className="key fn" onPress={onDelete} disabled={disabled}><IconDelete /></Key>
    </div>
  );
}
