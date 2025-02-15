import type { Express } from "express";
import { createServer } from "http";
import { storage } from "./storage";
import { insertProductSchema, insertCustomerSchema, insertInvoiceSchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express) {
  const httpServer = createServer(app);

  // Products
  app.get("/api/products", async (req, res) => {
    const products = await storage.getProducts();
    res.json(products);
  });

  app.get("/api/products/:id", async (req, res) => {
    const product = await storage.getProduct(Number(req.params.id));
    if (!product) return res.status(404).json({ message: "Product not found" });
    res.json(product);
  });

  app.post("/api/products", async (req, res) => {
    const result = insertProductSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({ message: "Invalid product data" });
    }
    const product = await storage.createProduct(result.data);
    res.status(201).json(product);
  });

  app.patch("/api/products/:id", async (req, res) => {
    const result = insertProductSchema.partial().safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({ message: "Invalid product data" });
    }
    try {
      const product = await storage.updateProduct(Number(req.params.id), result.data);
      res.json(product);
    } catch (error) {
      res.status(404).json({ message: "Product not found" });
    }
  });

  // Customers
  app.get("/api/customers", async (req, res) => {
    const customers = await storage.getCustomers();
    res.json(customers);
  });

  app.get("/api/customers/:id", async (req, res) => {
    const customer = await storage.getCustomer(Number(req.params.id));
    if (!customer) return res.status(404).json({ message: "Customer not found" });
    res.json(customer);
  });

  app.post("/api/customers", async (req, res) => {
    const result = insertCustomerSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({ message: "Invalid customer data" });
    }
    const customer = await storage.createCustomer(result.data);
    res.status(201).json(customer);
  });

  // Invoices
  app.get("/api/invoices", async (req, res) => {
    const invoices = await storage.getInvoices();
    res.json(invoices);
  });

  app.get("/api/invoices/:id", async (req, res) => {
    const invoice = await storage.getInvoice(Number(req.params.id));
    if (!invoice) return res.status(404).json({ message: "Invoice not found" });
    res.json(invoice);
  });

  app.post("/api/invoices", async (req, res) => {
    const schema = z.object({
      invoice: z.object({
        customerId: z.number(),
        total: z.string(),
        status: z.string(),
      }),
      items: z.array(z.object({
        productId: z.number(),
        quantity: z.number(),
        price: z.string(),
      })),
    });

    const result = schema.safeParse(req.body);
    if (!result.success) {
      console.error("Invalid invoice data:", result.error);
      return res.status(400).json({ message: "Invalid invoice data", errors: result.error.errors });
    }

    try {
      const invoice = await storage.createInvoice(result.data.invoice, result.data.items);
      res.status(201).json(invoice);
    } catch (error) {
      console.error("Failed to create invoice:", error);
      res.status(500).json({ message: "Failed to create invoice" });
    }
  });

  app.patch("/api/invoices/:id/status", async (req, res) => {
    const schema = z.object({ status: z.string() });
    const result = schema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({ message: "Invalid status" });
    }

    try {
      const invoice = await storage.updateInvoiceStatus(
        Number(req.params.id),
        result.data.status
      );
      res.json(invoice);
    } catch (error) {
      res.status(404).json({ message: "Invoice not found" });
    }
  });

  return httpServer;
}