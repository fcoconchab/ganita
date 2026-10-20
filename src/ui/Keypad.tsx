import { useEffect } from "react";
import { IconDelete } from "./icons";
import { sfx } from "./sound";

interface Props {
  onDigit: (d: string) => void;
  onDelete: () => void;
  onSkip?: () => void;
  disabled?: boolean;
}

const KEYS = ["1", "2", "3", "4", "5", "6", "7", "8", "9"];

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

  const press = (fn: () => void) => (e: React.PointerEvent) => {
    e.preventDefault();
    if (disabled) return;
    sfx.tap();
    fn();
  };

  return (
    <div className="keypad" aria-label="Teclado numérico">
      {KEYS.map((k) => (
        <button key={k} className="key" onPointerDown={press(() => onDigit(k))} aria-label={k}>{k}</button>
      ))}
      {onSkip ? (
        <button className="key fn" onPointerDown={press(onSkip)} aria-label="No sé">No sé</button>
      ) : <span />}
      <button className="key" onPointerDown={press(() => onDigit("0"))} aria-label="0">0</button>
      <button className="key fn" onPointerDown={press(onDelete)} aria-label="Borrar"><IconDelete /></button>
    </div>
  );
}
