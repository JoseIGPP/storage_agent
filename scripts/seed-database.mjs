/**
 * Script de inicialización y carga de datos de prueba (Seed Data).
 * Carga proveedores, catálogo de 20 productos, historial de ventas, gastos
 * y crea el usuario administrador para pruebas locales en Supabase.
 *
 * Ejecutar con: npm run db:seed
 */

import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";

// Función para cargar variables de entorno desde .env.local manualmente si es necesario
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

if (
  !supabaseUrl ||
  !serviceRoleKey ||
  supabaseUrl.includes("tu-proyecto") ||
  supabaseUrl.includes("placeholder")
) {
  console.error("\n❌ ERROR DE CONFIGURACIÓN:");
  console.error("Debes definir 'NEXT_PUBLIC_SUPABASE_URL' y 'SUPABASE_SERVICE_ROLE_KEY'");
  console.error("en tu archivo '.env.local' con valores reales de tu proyecto Supabase.\n");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function runSeed() {
  console.log("\n🚀 Conectando a Supabase para cargar datos de prueba...");

  // 1. Proveedores
  console.log("📦 Insertando proveedores...");
  const suppliers = [
    {
      id: "a0000000-0000-0000-0000-000000000001",
      name: "Distribuidora Bebidas del Norte",
      phone: "555-0101",
      email: "ventas@bebidasnorte.com",
      notes: "Entrega los martes y jueves",
    },
    {
      id: "a0000000-0000-0000-0000-000000000002",
      name: "Comercializadora Abarrotes Central",
      phone: "555-0102",
      email: "pedidos@centralabarrotes.com",
      notes: "Pedido mínimo $500",
    },
  ];

  const { error: errSuppliers } = await supabase.from("suppliers").upsert(suppliers);
  if (errSuppliers) {
    console.error("Error al insertar proveedores:", errSuppliers.message);
    process.exit(1);
  }

  // 2. Catálogo de 20 Productos
  console.log("🛒 Insertando 20 productos de catálogo con códigos de barras...");
  const products = [
    {
      id: "b0000000-0000-0000-0000-000000000001",
      name: "Coca-Cola 600ml",
      barcode: "7501055301072",
      category: "Bebidas",
      cost_price: 12.0,
      sale_price: 18.0,
      stock_quantity: 4,
      min_stock: 12,
      supplier_id: "a0000000-0000-0000-0000-000000000001",
    },
    {
      id: "b0000000-0000-0000-0000-000000000002",
      name: "Coca-Cola Sin Azúcar 600ml",
      barcode: "7501055365449",
      category: "Bebidas",
      cost_price: 12.0,
      sale_price: 18.0,
      stock_quantity: 15,
      min_stock: 8,
      supplier_id: "a0000000-0000-0000-0000-000000000001",
    },
    {
      id: "b0000000-0000-0000-0000-000000000003",
      name: "Agua Purificada Ciel 1L",
      barcode: "7501055312344",
      category: "Bebidas",
      cost_price: 7.5,
      sale_price: 13.0,
      stock_quantity: 2,
      min_stock: 10,
      supplier_id: "a0000000-0000-0000-0000-000000000001",
    },
    {
      id: "b0000000-0000-0000-0000-000000000004",
      name: "Jugo Del Valle Mango 413ml",
      barcode: "7501055323456",
      category: "Bebidas",
      cost_price: 11.0,
      sale_price: 16.5,
      stock_quantity: 9,
      min_stock: 6,
      supplier_id: "a0000000-0000-0000-0000-000000000001",
    },
    {
      id: "b0000000-0000-0000-0000-000000000005",
      name: "Electrolit Fresa 625ml",
      barcode: "7501125101014",
      category: "Bebidas",
      cost_price: 21.0,
      sale_price: 32.0,
      stock_quantity: 5,
      min_stock: 8,
      supplier_id: "a0000000-0000-0000-0000-000000000001",
    },
    {
      id: "b0000000-0000-0000-0000-000000000006",
      name: "Papas Sabritas Sal 45g",
      barcode: "7501011115678",
      category: "Snacks",
      cost_price: 13.5,
      sale_price: 20.0,
      stock_quantity: 3,
      min_stock: 10,
      supplier_id: "a0000000-0000-0000-0000-000000000002",
    },
    {
      id: "b0000000-0000-0000-0000-000000000007",
      name: "Doritos Nacho 58g",
      barcode: "7501011123456",
      category: "Snacks",
      cost_price: 14.0,
      sale_price: 21.0,
      stock_quantity: 14,
      min_stock: 10,
      supplier_id: "a0000000-0000-0000-0000-000000000002",
    },
    {
      id: "b0000000-0000-0000-0000-000000000008",
      name: "Ruffles Queso 48g",
      barcode: "7501011134567",
      category: "Snacks",
      cost_price: 14.0,
      sale_price: 21.0,
      stock_quantity: 8,
      min_stock: 8,
      supplier_id: "a0000000-0000-0000-0000-000000000002",
    },
    {
      id: "b0000000-0000-0000-0000-000000000009",
      name: "Cacahuates Japoneses Karate 100g",
      barcode: "7501011145678",
      category: "Snacks",
      cost_price: 9.0,
      sale_price: 15.0,
      stock_quantity: 18,
      min_stock: 5,
      supplier_id: "a0000000-0000-0000-0000-000000000002",
    },
    {
      id: "b0000000-0000-0000-0000-000000000010",
      name: "Galletas Emperador Chocolate 101g",
      barcode: "7501000612345",
      category: "Galletas",
      cost_price: 11.5,
      sale_price: 18.0,
      stock_quantity: 12,
      min_stock: 6,
      supplier_id: "a0000000-0000-0000-0000-000000000002",
    },
    {
      id: "b0000000-0000-0000-0000-000000000011",
      name: "Leche Entera Lala 1L",
      barcode: "7501020512345",
      category: "Lácteos",
      cost_price: 19.5,
      sale_price: 27.5,
      stock_quantity: 4,
      min_stock: 10,
      supplier_id: "a0000000-0000-0000-0000-000000000002",
    },
    {
      id: "b0000000-0000-0000-0000-000000000012",
      name: "Leche Deslactosada Lala 1L",
      barcode: "7501020523456",
      category: "Lácteos",
      cost_price: 21.0,
      sale_price: 29.5,
      stock_quantity: 11,
      min_stock: 8,
      supplier_id: "a0000000-0000-0000-0000-000000000002",
    },
    {
      id: "b0000000-0000-0000-0000-000000000013",
      name: "Huevos San Juan 12 piezas",
      barcode: "7501030412345",
      category: "Abarrotes",
      cost_price: 32.0,
      sale_price: 45.0,
      stock_quantity: 6,
      min_stock: 8,
      supplier_id: "a0000000-0000-0000-0000-000000000002",
    },
    {
      id: "b0000000-0000-0000-0000-000000000014",
      name: "Pan Blanco Bimbo Grande 680g",
      barcode: "7501000112345",
      category: "Panadería",
      cost_price: 36.0,
      sale_price: 48.0,
      stock_quantity: 5,
      min_stock: 6,
      supplier_id: "a0000000-0000-0000-0000-000000000002",
    },
    {
      id: "b0000000-0000-0000-0000-000000000015",
      name: "Frijoles Negros Isadora 430g",
      barcode: "7501040512345",
      category: "Abarrotes",
      cost_price: 14.0,
      sale_price: 22.0,
      stock_quantity: 15,
      min_stock: 6,
      supplier_id: "a0000000-0000-0000-0000-000000000002",
    },
    {
      id: "b0000000-0000-0000-0000-000000000016",
      name: "Atún Dolores en Agua 140g",
      barcode: "7501050612345",
      category: "Abarrotes",
      cost_price: 16.0,
      sale_price: 24.5,
      stock_quantity: 20,
      min_stock: 8,
      supplier_id: "a0000000-0000-0000-0000-000000000002",
    },
    {
      id: "b0000000-0000-0000-0000-000000000017",
      name: "Papel Higiénico Pétalo 4 rollos",
      barcode: "7501060712345",
      category: "Limpieza",
      cost_price: 24.0,
      sale_price: 36.0,
      stock_quantity: 10,
      min_stock: 6,
      supplier_id: "a0000000-0000-0000-0000-000000000002",
    },
    {
      id: "b0000000-0000-0000-0000-000000000018",
      name: "Jabón Zote Rosa 400g",
      barcode: "7501070812345",
      category: "Limpieza",
      cost_price: 18.0,
      sale_price: 26.0,
      stock_quantity: 12,
      min_stock: 5,
      supplier_id: "a0000000-0000-0000-0000-000000000002",
    },
    {
      id: "b0000000-0000-0000-0000-000000000019",
      name: "Cloro Cloralex El Rendidor 950ml",
      barcode: "7501080912345",
      category: "Limpieza",
      cost_price: 14.5,
      sale_price: 22.0,
      stock_quantity: 8,
      min_stock: 5,
      supplier_id: "a0000000-0000-0000-0000-000000000002",
    },
    {
      id: "b0000000-0000-0000-0000-000000000020",
      name: "Detergente Foca 1kg",
      barcode: "7501090112345",
      category: "Limpieza",
      cost_price: 28.0,
      sale_price: 42.0,
      stock_quantity: 7,
      min_stock: 5,
      supplier_id: "a0000000-0000-0000-0000-000000000002",
    },
  ];

  const { error: errProducts } = await supabase.from("products").upsert(products);
  if (errProducts) {
    console.error("Error al insertar productos:", errProducts.message);
    process.exit(1);
  }

  // 3. Gastos Operativos
  console.log("💡 Insertando gastos operativos...");
  const now = new Date();
  const d1 = new Date(now.getTime() - 45 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
  const d2 = new Date(now.getTime() - 35 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
  const d3 = new Date(now.getTime() - 28 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];

  const expenses = [
    {
      category: "Servicios",
      description: "Recibo de luz (Refrigeradores)",
      amount: 1250.0,
      expense_date: d1,
    },
    {
      category: "Mantenimiento",
      description: "Reparación de enfriador de vitrina",
      amount: 450.0,
      expense_date: d2,
    },
    {
      category: "Suministros",
      description: "Rollo de bolsas plásticas y papel térmico",
      amount: 280.0,
      expense_date: d3,
    },
  ];

  await supabase.from("expenses").insert(expenses);

  // 4. Ventas Históricas
  console.log("📊 Insertando ventas históricas...");
  const sales = [
    {
      product_id: "b0000000-0000-0000-0000-000000000001",
      quantity: 12,
      unit_price: 18.0,
      sold_at: new Date(now.getTime() - 55 * 86400000).toISOString(),
    },
    {
      product_id: "b0000000-0000-0000-0000-000000000006",
      quantity: 8,
      unit_price: 20.0,
      sold_at: new Date(now.getTime() - 52 * 86400000).toISOString(),
    },
    {
      product_id: "b0000000-0000-0000-0000-000000000011",
      quantity: 6,
      unit_price: 27.5,
      sold_at: new Date(now.getTime() - 48 * 86400000).toISOString(),
    },
    {
      product_id: "b0000000-0000-0000-0000-000000000001",
      quantity: 18,
      unit_price: 18.0,
      sold_at: new Date(now.getTime() - 25 * 86400000).toISOString(),
    },
    {
      product_id: "b0000000-0000-0000-0000-000000000007",
      quantity: 9,
      unit_price: 21.0,
      sold_at: new Date(now.getTime() - 22 * 86400000).toISOString(),
    },
    {
      product_id: "b0000000-0000-0000-0000-000000000011",
      quantity: 10,
      unit_price: 27.5,
      sold_at: new Date(now.getTime() - 18 * 86400000).toISOString(),
    },
    {
      product_id: "b0000000-0000-0000-0000-000000000001",
      quantity: 14,
      unit_price: 18.0,
      sold_at: new Date(now.getTime() - 4 * 86400000).toISOString(),
    },
    {
      product_id: "b0000000-0000-0000-0000-000000000006",
      quantity: 11,
      unit_price: 20.0,
      sold_at: new Date(now.getTime() - 3 * 86400000).toISOString(),
    },
    {
      product_id: "b0000000-0000-0000-0000-000000000003",
      quantity: 12,
      unit_price: 13.0,
      sold_at: new Date(now.getTime() - 2 * 86400000).toISOString(),
    },
    {
      product_id: "b0000000-0000-0000-0000-000000000011",
      quantity: 4,
      unit_price: 27.5,
      sold_at: new Date(now.getTime() - 1 * 86400000).toISOString(),
    },
    {
      product_id: "b0000000-0000-0000-0000-000000000014",
      quantity: 3,
      unit_price: 48.0,
      sold_at: new Date(now.getTime() - 5 * 3600000).toISOString(),
    },
  ];

  await supabase.from("sales").insert(sales);

  // 5. Usuario Administrador de Prueba en Supabase Auth
  console.log("👤 Creando usuario administrador de prueba (admin@bodega.com)...");
  try {
    const { error: errUser } = await supabase.auth.admin.createUser({
      email: "admin@bodega.com",
      password: "password123",
      email_confirm: true,
    });

    if (errUser && !errUser.message.includes("already")) {
      console.warn("Nota sobre usuario admin:", errUser.message);
    } else {
      console.log("✅ Usuario 'admin@bodega.com' listo con contraseña 'password123'");
    }
  } catch (errAuth) {
    console.warn("Advertencia al gestionar auth user:", errAuth);
  }

  console.log("\n=======================================================");
  console.log("🎉 SEED DATA CARGADO EXITOSAMENTE");
  console.log("  • Proveedores: 2");
  console.log("  • Productos: 20 (con códigos de barras reales)");
  console.log("  • Ventas Históricas: 11 transacciones distribuidas");
  console.log("  • Gastos Operativos: 3 registros");
  console.log("  • Usuario de acceso: admin@bodega.com / password123");
  console.log("=======================================================\n");
}

runSeed().catch((err) => {
  console.error("Error fatal durante el seed:", err);
  process.exit(1);
});
