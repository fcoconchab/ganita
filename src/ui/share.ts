// Entregar un archivo al usuario. En el iPhone abre la hoja de compartir
// (Guardar en Archivos, AirDrop, Mail); en el computador, descarga el archivo.
export type ShareOutcome = "shared" | "downloaded" | "cancelled" | "failed";

export async function shareFile(name: string, text: string, mime: string): Promise<ShareOutcome> {
  const file = new File([text], name, { type: mime });
  const nav = navigator as Navigator & { canShare?: (d: ShareData) => boolean };
  const touch = typeof matchMedia !== "undefined" && matchMedia("(pointer: coarse)").matches;
  if (touch && nav.share && nav.canShare?.({ files: [file] })) {
    try {
      await nav.share({ files: [file], title: name });
      return "shared";
    } catch (e) {
      if ((e as DOMException)?.name === "AbortError") return "cancelled";
      // si compartir falla por otra razón, se intenta la descarga
    }
  }
  try {
    const url = URL.createObjectURL(file);
    const a = document.createElement("a");
    a.href = url;
    a.download = name;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 10_000);
    return "downloaded";
  } catch {
    return "failed";
  }
}
