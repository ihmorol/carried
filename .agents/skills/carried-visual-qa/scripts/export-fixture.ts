import { exportLineCard } from "@/lib/canvas";
import type { LinePayload } from "@/lib/line";

declare global {
  interface Window {
    carriedAcceptanceExport: (payload: LinePayload, id: string) => Promise<string>;
  }
}

window.carriedAcceptanceExport = async (payload, id) => {
  const blob = await exportLineCard(payload, id);
  return await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};
