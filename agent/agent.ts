import { defineAgent } from "eve";

/**
 * Configuracion del agente inteligente de administracion de bodega.
 * Utiliza el modelo Google Gemini a traves del framework Eve.
 */
export default defineAgent({
  description: "Intelligent inventory and store management assistant for convenience stores",
  model: "google/gemini-3.1-flash-lite",
});
