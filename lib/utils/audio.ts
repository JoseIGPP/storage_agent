/**
 * Utilidades para feedback auditivo y háptico en el punto de venta (POS).
 * Emite un sonido 'bip' de alta frecuencia similar a una caja registradora
 * sin necesidad de cargar archivos externos de audio.
 */

// Contexto de audio singleton para reutilizar en el cliente
let sharedAudioContext: AudioContext | null = null;

/**
 * Obtiene o inicializa la instancia compartida de AudioContext
 */
function getAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;

  if (!sharedAudioContext) {
    const AudioContextClass =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;

    if (AudioContextClass) {
      sharedAudioContext = new AudioContextClass();
    }
  }

  // Si el navegador suspendió el audio por política de interacción previa, reactivarlo
  if (sharedAudioContext && sharedAudioContext.state === "suspended") {
    void sharedAudioContext.resume();
  }

  return sharedAudioContext;
}

/**
 * Emite un 'bip' sonoro sintético y una vibración breve al escanear un producto.
 * @param frequency Frecuencia en Hz (por defecto 880 Hz - Nota La5)
 * @param duration Duración del tono en milisegundos (por defecto 90 ms)
 */
export function playScannerBeep(frequency = 880, duration = 90): void {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(frequency, ctx.currentTime);

    // Envolvente de volumen para evitar clics de audio al encender/apagar
    gainNode.gain.setValueAtTime(0.15, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration / 1000);

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    oscillator.start();
    oscillator.stop(ctx.currentTime + duration / 1000);

    // Feedback háptico en dispositivos móviles compatibles
    if (typeof navigator !== "undefined" && "vibrate" in navigator) {
      navigator.vibrate(80);
    }
  } catch (error) {
    // Si el navegador bloquea el audio, ignoramos el error para no romper el flujo
    console.warn("No se pudo reproducir el sonido del escáner:", error);
  }
}
