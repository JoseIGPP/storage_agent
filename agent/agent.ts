import { defineAgent } from "eve";

/**
 * Configuracion del agente inteligente de administracion de bodega.
 * Utiliza el modelo OpenAI GPT-4o-mini a traves del framework Eve.
 */
export default defineAgent({
  description: "Intelligent inventory and store management assistant for convenience stores",
  model: "openai/gpt-4o-mini",
});
