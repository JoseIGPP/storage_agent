import { describe, it, expect, vi } from "vitest";
import { NextRequest } from "next/server";

// Mock de Supabase Admin para ejecucion offline instantanea
vi.mock("@/lib/supabase/admin", () => {
  const createQueryChain = (data: unknown = [], count: number = 0) => {
    const chain: Record<string, unknown> = {};
    const methods = [
      "select",
      "insert",
      "update",
      "delete",
      "eq",
      "neq",
      "gte",
      "lte",
      "ilike",
      "order",
      "range",
    ];

    for (const m of methods) {
      chain[m] = vi.fn().mockImplementation(() => chain);
    }

    chain.maybeSingle = vi.fn().mockResolvedValue({ data: null, error: null });
    chain.single = vi.fn().mockResolvedValue({
      data: Array.isArray(data) ? data[0] || {} : data,
      error: null,
    });
    chain.then = (resolve: (val: unknown) => void) =>
      Promise.resolve({ data, count, error: null }).then(resolve);

    return chain;
  };

  return {
    supabaseAdmin: {
      from: vi.fn().mockImplementation((table: string) => {
        if (table === "products") {
          return createQueryChain([
            {
              id: "b0000000-0000-0000-0000-000000000001",
              name: "Coca-Cola 600ml",
              stock_quantity: 10,
              min_stock: 5,
              cost_price: 12,
              sale_price: 18,
            },
          ]);
        }
        if (table === "sales") {
          return createQueryChain([
            {
              id: "s1",
              product_id: "b0000000-0000-0000-0000-000000000001",
              quantity: 2,
              unit_price: 18,
              total: 36,
              sold_at: new Date().toISOString(),
            },
          ]);
        }
        if (table === "purchases") {
          return createQueryChain([
            {
              id: "p1",
              quantity: 10,
              unit_cost: 12,
              total: 120,
              purchased_at: new Date().toISOString(),
            },
          ]);
        }
        if (table === "expenses") {
          return createQueryChain([
            {
              id: "e1",
              category: "Servicios",
              description: "Luz",
              amount: 500,
              expense_date: new Date().toISOString().slice(0, 10),
            },
          ]);
        }
        if (table === "purchase_orders") {
          return createQueryChain([
            {
              id: "po1",
              status: "pending",
              items: [],
            },
          ]);
        }
        return createQueryChain([]);
      }),
    },
  };
});

// Importacion de los handlers de las rutas de API
import { GET as getProducts, POST as postProducts } from "@/app/api/products/route";
import { GET as getProductBarcode } from "@/app/api/products/barcode/[barcode]/route";
import { GET as getSales, POST as postSales } from "@/app/api/sales/route";
import { GET as getPurchases, POST as postPurchases } from "@/app/api/purchases/route";
import { GET as getExpenses, POST as postExpenses } from "@/app/api/expenses/route";
import { GET as getOrders, POST as postOrders } from "@/app/api/orders/route";
import { GET as getSuppliers, POST as postSuppliers } from "@/app/api/suppliers/route";
import { GET as getDashboardReport } from "@/app/api/reports/dashboard/route";
import { GET as getSalesChart } from "@/app/api/reports/sales-chart/route";
import { POST as postAgent } from "@/app/api/agent/route";

/**
 * Suite de pruebas unitarias y de integracion para endpoints de API.
 * Verifica validaciones de esquemas, codigos de estado HTTP y estructura de respuestas.
 */
describe("API Routes Handlers - Contract & Validation Tests", () => {
  // ---------------------------------------------------------------------------
  // 1. /api/products
  // ---------------------------------------------------------------------------
  describe("/api/products", () => {
    it("GET should return paginated structure with status 200", async () => {
      const req = new NextRequest("http://localhost:3000/api/products?page=1&limit=5");
      const res = await getProducts(req);
      expect(res.status).toBe(200);

      const json = await res.json();
      expect(json).toHaveProperty("data");
      expect(json).toHaveProperty("total");
      expect(json.page).toBe(1);
      expect(json.limit).toBe(5);
    });

    it("POST should reject empty or invalid product body with 400", async () => {
      const req = new NextRequest("http://localhost:3000/api/products", {
        method: "POST",
        body: JSON.stringify({}),
      });
      const res = await postProducts(req);
      expect(res.status).toBe(400);

      const json = await res.json();
      expect(json.error).toBeDefined();
    });

    it("POST should reject negative prices with 400", async () => {
      const req = new NextRequest("http://localhost:3000/api/products", {
        method: "POST",
        body: JSON.stringify({
          name: "Producto Invalido",
          cost_price: -10,
          sale_price: 20,
        }),
      });
      const res = await postProducts(req);
      expect(res.status).toBe(400);
    });
  });

  // ---------------------------------------------------------------------------
  // 2. /api/products/barcode/[barcode]
  // ---------------------------------------------------------------------------
  describe("/api/products/barcode/[barcode]", () => {
    it("GET should return 404 when barcode is not found in database", async () => {
      const req = new NextRequest("http://localhost:3000/api/products/barcode/non-existent-999");
      const res = await getProductBarcode(req, {
        params: Promise.resolve({ barcode: "non-existent-999" }),
      });
      expect(res.status).toBe(404);

      const json = await res.json();
      expect(json.error).toContain("no registrado");
    });
  });

  // ---------------------------------------------------------------------------
  // 3. /api/sales
  // ---------------------------------------------------------------------------
  describe("/api/sales", () => {
    it("GET should return sales list with total_monto and 200 status", async () => {
      const req = new NextRequest("http://localhost:3000/api/sales");
      const res = await getSales(req);
      expect(res.status).toBe(200);

      const json = await res.json();
      expect(json).toHaveProperty("data");
      expect(json).toHaveProperty("total_monto");
    });

    it("POST should reject non-positive quantity with 400", async () => {
      const req = new NextRequest("http://localhost:3000/api/sales", {
        method: "POST",
        body: JSON.stringify({
          product_id: "b0000000-0000-0000-0000-000000000001",
          quantity: 0,
          unit_price: 18.0,
        }),
      });
      const res = await postSales(req);
      expect(res.status).toBe(400);
    });

    it("POST should reject missing product_id with 400", async () => {
      const req = new NextRequest("http://localhost:3000/api/sales", {
        method: "POST",
        body: JSON.stringify({
          quantity: 2,
          unit_price: 18.0,
        }),
      });
      const res = await postSales(req);
      expect(res.status).toBe(400);
    });
  });

  // ---------------------------------------------------------------------------
  // 4. /api/purchases
  // ---------------------------------------------------------------------------
  describe("/api/purchases", () => {
    it("GET should return purchases list and status 200", async () => {
      const req = new NextRequest("http://localhost:3000/api/purchases");
      const res = await getPurchases(req);
      expect(res.status).toBe(200);

      const json = await res.json();
      expect(json).toHaveProperty("data");
      expect(json).toHaveProperty("total_monto");
    });

    it("POST should reject invalid purchase data with 400", async () => {
      const req = new NextRequest("http://localhost:3000/api/purchases", {
        method: "POST",
        body: JSON.stringify({
          quantity: -5,
          unit_cost: -20,
        }),
      });
      const res = await postPurchases(req);
      expect(res.status).toBe(400);
    });
  });

  // ---------------------------------------------------------------------------
  // 5. /api/expenses
  // ---------------------------------------------------------------------------
  describe("/api/expenses", () => {
    it("GET should return expenses list and status 200", async () => {
      const req = new NextRequest("http://localhost:3000/api/expenses");
      const res = await getExpenses(req);
      expect(res.status).toBe(200);

      const json = await res.json();
      expect(json).toHaveProperty("data");
      expect(json).toHaveProperty("total_monto");
    });

    it("POST should reject non-positive amount with 400", async () => {
      const req = new NextRequest("http://localhost:3000/api/expenses", {
        method: "POST",
        body: JSON.stringify({
          category: "Luz",
          description: "Recibo CFE",
          amount: -100,
        }),
      });
      const res = await postExpenses(req);
      expect(res.status).toBe(400);
    });
  });

  // ---------------------------------------------------------------------------
  // 6. /api/orders
  // ---------------------------------------------------------------------------
  describe("/api/orders", () => {
    it("GET should return orders list and status 200", async () => {
      const req = new NextRequest("http://localhost:3000/api/orders");
      const res = await getOrders(req);
      expect(res.status).toBe(200);

      const json = await res.json();
      expect(json).toHaveProperty("data");
      expect(json).toHaveProperty("total");
    });

    it("POST should reject empty items list with 400", async () => {
      const req = new NextRequest("http://localhost:3000/api/orders", {
        method: "POST",
        body: JSON.stringify({
          items: [],
        }),
      });
      const res = await postOrders(req);
      expect(res.status).toBe(400);
    });
  });

  // ---------------------------------------------------------------------------
  // 7. /api/suppliers
  // ---------------------------------------------------------------------------
  describe("/api/suppliers", () => {
    it("GET should return suppliers list and status 200", async () => {
      const res = await getSuppliers();
      expect(res.status).toBe(200);

      const json = await res.json();
      expect(json).toHaveProperty("data");
    });

    it("POST should reject missing name with 400", async () => {
      const req = new NextRequest("http://localhost:3000/api/suppliers", {
        method: "POST",
        body: JSON.stringify({
          phone: "1234567890",
        }),
      });
      const res = await postSuppliers(req);
      expect(res.status).toBe(400);
    });
  });

  // ---------------------------------------------------------------------------
  // 8. /api/reports/dashboard
  // ---------------------------------------------------------------------------
  describe("/api/reports/dashboard", () => {
    it("GET should return consolidated KPIs structure", async () => {
      const res = await getDashboardReport();
      expect(res.status).toBe(200);

      const json = await res.json();
      expect(json).toHaveProperty("ventas_hoy");
      expect(json).toHaveProperty("ventas_mes");
      expect(json).toHaveProperty("ganancia_mes");
      expect(json).toHaveProperty("gastos_mes");
      expect(json).toHaveProperty("productos_bajo_minimo");
      expect(json).toHaveProperty("ordenes_pendientes");
      expect(json).toHaveProperty("top_productos_semana");
    });
  });

  // ---------------------------------------------------------------------------
  // 9. /api/reports/sales-chart
  // ---------------------------------------------------------------------------
  describe("/api/reports/sales-chart", () => {
    it("GET should return time series for 7d period", async () => {
      const req = new NextRequest("http://localhost:3000/api/reports/sales-chart?periodo=7d");
      const res = await getSalesChart(req);
      expect(res.status).toBe(200);

      const json = await res.json();
      expect(json.periodo).toBe("7d");
      expect(json.dias).toBe(7);
      expect(json.data.length).toBe(7);
      expect(json.data[0]).toHaveProperty("fecha");
      expect(json.data[0]).toHaveProperty("ventas");
      expect(json.data[0]).toHaveProperty("ganancias");
    });
  });

  // ---------------------------------------------------------------------------
  // 10. /api/agent
  // ---------------------------------------------------------------------------
  describe("/api/agent", () => {
    it("POST should reject request missing messages array with 400", async () => {
      const req = new NextRequest("http://localhost:3000/api/agent", {
        method: "POST",
        body: JSON.stringify({}),
      });
      const res = await postAgent(req);
      expect(res.status).toBe(400);

      const json = await res.json();
      expect(json.error).toContain("messages");
    });
  });
});
