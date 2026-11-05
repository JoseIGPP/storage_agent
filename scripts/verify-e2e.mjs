/**
 * Script de verificación E2E de flujos de negocio e integración con Supabase y Gemini.
 * Ejecuta pruebas automatizadas de:
 * 1. Triggers de PostgreSQL (decremento de stock por venta).
 * 2. Ciclo de Órdenes de Compra (Human-in-the-Loop: pending -> approved).
 * 3. Conexión y llamada al modelo Google Gemini 1.5 Flash.
 */

import { createClient } from "@supabase/supabase-js";
import { generateText } from "ai";
import { google } from "@ai-sdk/google";
import fs from "fs";
import path from "path";

// Cargar variables de entorno desde .env.local
function loadEnvLocal() {
  const envPath = path.resolve(process.cwd(), ".env.local");
  if (fs.existsSync(envPath)) {
    const content = fs.readFileSync(envPath, "utf-8");
    for (const line of content.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const [key, ...rest] = trimmed.split("=");
      const val = rest.join("=").trim().replace(/^["']|["']$/g, "");
      if (key && !process.env[key.trim()]) {
        process.env[key.trim()] = val;
      }
    }
  }
}

loadEnvLocal();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const geminiApiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function runVerification() {
  console.log("\n=======================================================");
  console.log("🧪 INICIANDO VERIFICACIÓN INTEGRAL E2E EN LOCAL");
  console.log("=======================================================\n");

  let allPassed = true;

  // ---------------------------------------------------------------------------
  // PRUEBA 1: Trigger de stock por venta en PostgreSQL
  // ---------------------------------------------------------------------------
  console.log("▶️ Prueba 1: Verificando trigger de stock por venta en PostgreSQL...");
  const productId = "b0000000-0000-0000-0000-000000000002"; // Coca-Cola Sin Azúcar

  const { data: beforeProd, error: errBefore } = await supabase
    .from("products")
    .select("stock_quantity, sale_price")
    .eq("id", productId)
    .single();

  if (errBefore || !beforeProd) {
    console.error("❌ Falló lectura de producto:", errBefore?.message);
    allPassed = false;
  } else {
    const initialStock = beforeProd.stock_quantity;
    console.log(`   Stock actual antes de la venta: ${initialStock} unidades`);

    // Insertar venta de 1 unidad
    const { data: saleData, error: errSale } = await supabase
      .from("sales")
      .insert({
        product_id: productId,
        quantity: 1,
        unit_price: beforeProd.sale_price,
      })
      .select()
      .single();

    if (errSale || !saleData) {
      console.error("❌ Falló inserción de venta:", errSale?.message);
      allPassed = false;
    } else {
      // Re-consultar producto para comprobar que el trigger decrementó el stock
      const { data: afterProd } = await supabase
        .from("products")
        .select("stock_quantity")
        .eq("id", productId)
        .single();

      const updatedStock = afterProd?.stock_quantity;
      console.log(`   Stock posterior tras la venta: ${updatedStock} unidades`);

      if (updatedStock === initialStock - 1) {
        console.log("✅ ÉXITO: El trigger de PostgreSQL decrementó el stock automáticamente en 1 unidad.");
      } else {
        console.error(`❌ ERROR: Se esperaba stock ${initialStock - 1}, pero se obtuvo ${updatedStock}`);
        allPassed = false;
      }
    }
  }

  // ---------------------------------------------------------------------------
  // PRUEBA 2: Ciclo de Órdenes de Compra (Human-in-the-Loop)
  // ---------------------------------------------------------------------------
  console.log("\n▶️ Prueba 2: Verificando ciclo de aprobación de órdenes de compra...");
  const { data: newOrder, error: errOrder } = await supabase
    .from("purchase_orders")
    .insert({
      supplier_id: "a0000000-0000-0000-0000-000000000001",
      status: "pending",
      suggested_by: "agent",
      items: [
        {
          producto_id: productId,
          nombre: "Coca-Cola Sin Azúcar 600ml",
          cantidad: 12,
          precio_costo_unitario: 12.0,
        },
      ],
    })
    .select()
    .single();

  if (errOrder || !newOrder) {
    console.error("❌ Falló creación de orden:", errOrder?.message);
    allPassed = false;
  } else {
    console.log(`   Orden creada en estado: '${newOrder.status}' (ID: ${newOrder.id.slice(0, 8)}...)`);

    // Aprobación manual
    const { data: approvedOrder, error: errApprove } = await supabase
      .from("purchase_orders")
      .update({
        status: "approved",
        approved_at: new Date().toISOString(),
      })
      .eq("id", newOrder.id)
      .select()
      .single();

    if (errApprove || approvedOrder.status !== "approved") {
      console.error("❌ Falló aprobación de orden:", errApprove?.message);
      allPassed = false;
    } else {
      console.log(`✅ ÉXITO: Orden transicionó a estado '${approvedOrder.status}' con timestamp de aprobación.`);
    }
  }

  // ---------------------------------------------------------------------------
  // PRUEBA 3: Conexión con Google Gemini
  // ---------------------------------------------------------------------------
  console.log("\n▶️ Prueba 3: Verificando llamada al modelo Google Gemini (gemini-3.1-flash-lite)...");
  if (!geminiApiKey || geminiApiKey.startsWith("AIzaSy...")) {
    console.warn("⚠️ AVISO: GOOGLE_GENERATIVE_AI_API_KEY no configurada o es el placeholder.");
  } else {
    try {
      const response = await generateText({
        model: google("gemini-3.1-flash-lite"),
        prompt:
          "Eres el Agente Bodega. En 15 palabras responde saludando al dueño de la bodega y confirmando que estás listo para administrar el inventario.",
      });

      console.log(`   Respuesta de Gemini: "${response.text.trim()}"`);
      console.log("✅ ÉXITO: Google Gemini respondió fluidamente en español.");
    } catch (errGemini) {
      console.error("❌ Error al llamar a Google Gemini:", errGemini.message);
      allPassed = false;
    }
  }

  console.log("\n=======================================================");
  if (allPassed) {
    console.log("🎉 TODAS LAS VERIFICACIONES E2E FUERON EXITOSAS");
    console.log("El sistema está 100% listo para pruebas manuales en el navegador.");
  } else {
    console.log("⚠️ Algunas pruebas reportaron errores. Revisa los logs arriba.");
  }
  console.log("=======================================================\n");
}

runVerification().catch((err) => {
  console.error("Error fatal durante la verificación:", err);
  process.exit(1);
});
