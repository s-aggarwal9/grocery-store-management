import { db } from "./db";
import { eq } from "drizzle-orm";
import {
  products,
  customers,
  invoices,
  invoiceItems,
  type Product,
  type Customer,
  type Invoice,
  type InvoiceItem,
  type InsertProduct,
  type InsertCustomer,
  type InsertInvoice,
  type InsertInvoiceItem,
  type InvoiceWithItems,
} from "@shared/schema";

export interface IStorage {
  // Products
  getProducts(): Promise<Product[]>;
  getProduct(id: number): Promise<Product | undefined>;
  createProduct(product: InsertProduct): Promise<Product>;
  updateProduct(id: number, product: Partial<InsertProduct>): Promise<Product>;

  // Customers
  getCustomers(): Promise<Customer[]>;
  getCustomer(id: number): Promise<Customer | undefined>;
  createCustomer(customer: InsertCustomer): Promise<Customer>;

  // Invoices
  getInvoices(): Promise<Invoice[]>;
  getInvoice(id: number): Promise<InvoiceWithItems | undefined>;
  createInvoice(invoice: InsertInvoice, items: InsertInvoiceItem[]): Promise<Invoice>;
  updateInvoiceStatus(id: number, status: string): Promise<Invoice>;
}

export class DatabaseStorage implements IStorage {
  async getProducts(): Promise<Product[]> {
    return db.select().from(products);
  }

  async getProduct(id: number): Promise<Product | undefined> {
    const [product] = await db.select().from(products).where(eq(products.id, id));
    return product;
  }

  async createProduct(product: InsertProduct): Promise<Product> {
    const [newProduct] = await db.insert(products).values(product).returning();
    return newProduct;
  }

  async updateProduct(id: number, update: Partial<InsertProduct>): Promise<Product> {
    const [updatedProduct] = await db
      .update(products)
      .set(update)
      .where(eq(products.id, id))
      .returning();

    if (!updatedProduct) throw new Error("Product not found");
    return updatedProduct;
  }

  async getCustomers(): Promise<Customer[]> {
    return db.select().from(customers);
  }

  async getCustomer(id: number): Promise<Customer | undefined> {
    const [customer] = await db.select().from(customers).where(eq(customers.id, id));
    return customer;
  }

  async createCustomer(customer: InsertCustomer): Promise<Customer> {
    const [newCustomer] = await db.insert(customers).values(customer).returning();
    return newCustomer;
  }

  async getInvoices(): Promise<Invoice[]> {
    return db.select().from(invoices);
  }

  async getInvoice(id: number): Promise<InvoiceWithItems | undefined> {
    const [invoice] = await db.select().from(invoices).where(eq(invoices.id, id));
    if (!invoice) return undefined;

    const items = await db
      .select()
      .from(invoiceItems)
      .where(eq(invoiceItems.invoiceId, id));

    const [customer] = await db
      .select()
      .from(customers)
      .where(eq(customers.id, invoice.customerId));

    const itemsWithProducts = await Promise.all(
      items.map(async (item) => {
        const [product] = await db
          .select()
          .from(products)
          .where(eq(products.id, item.productId));
        return { ...item, product };
      })
    );

    return {
      ...invoice,
      items: itemsWithProducts,
      customer,
    };
  }

  async createInvoice(invoice: InsertInvoice, items: InsertInvoiceItem[]): Promise<Invoice> {
    // Create invoice
    const [newInvoice] = await db.insert(invoices).values(invoice).returning();

    // Create invoice items
    await Promise.all(
      items.map(async (item) => {
        const [product] = await db
          .select()
          .from(products)
          .where(eq(products.id, item.productId));

        // Update product stock
        await db
          .update(products)
          .set({ stock: product.stock - item.quantity })
          .where(eq(products.id, item.productId));

        // Create invoice item
        await db.insert(invoiceItems).values({
          ...item,
          invoiceId: newInvoice.id,
        });
      })
    );

    return newInvoice;
  }

  async updateInvoiceStatus(id: number, status: string): Promise<Invoice> {
    const [updatedInvoice] = await db
      .update(invoices)
      .set({ status })
      .where(eq(invoices.id, id))
      .returning();

    if (!updatedInvoice) throw new Error("Invoice not found");
    return updatedInvoice;
  }
}

export const storage = new DatabaseStorage();