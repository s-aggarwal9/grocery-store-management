import {
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

export class MemStorage implements IStorage {
  private products: Map<number, Product>;
  private customers: Map<number, Customer>;
  private invoices: Map<number, Invoice>;
  private invoiceItems: Map<number, InvoiceItem>;
  private currentIds: { [key: string]: number };

  constructor() {
    this.products = new Map();
    this.customers = new Map();
    this.invoices = new Map();
    this.invoiceItems = new Map();
    this.currentIds = {
      products: 1,
      customers: 1,
      invoices: 1,
      invoiceItems: 1,
    };
  }

  async getProducts(): Promise<Product[]> {
    return Array.from(this.products.values());
  }

  async getProduct(id: number): Promise<Product | undefined> {
    return this.products.get(id);
  }

  async createProduct(product: InsertProduct): Promise<Product> {
    const id = this.currentIds.products++;
    const newProduct = { ...product, id };
    this.products.set(id, newProduct);
    return newProduct;
  }

  async updateProduct(id: number, update: Partial<InsertProduct>): Promise<Product> {
    const product = await this.getProduct(id);
    if (!product) throw new Error("Product not found");
    
    const updatedProduct = { ...product, ...update };
    this.products.set(id, updatedProduct);
    return updatedProduct;
  }

  async getCustomers(): Promise<Customer[]> {
    return Array.from(this.customers.values());
  }

  async getCustomer(id: number): Promise<Customer | undefined> {
    return this.customers.get(id);
  }

  async createCustomer(customer: InsertCustomer): Promise<Customer> {
    const id = this.currentIds.customers++;
    const newCustomer = { ...customer, id };
    this.customers.set(id, newCustomer);
    return newCustomer;
  }

  async getInvoices(): Promise<Invoice[]> {
    return Array.from(this.invoices.values());
  }

  async getInvoice(id: number): Promise<InvoiceWithItems | undefined> {
    const invoice = this.invoices.get(id);
    if (!invoice) return undefined;

    const items = Array.from(this.invoiceItems.values())
      .filter(item => item.invoiceId === id)
      .map(item => ({
        ...item,
        product: this.products.get(item.productId)!
      }));

    const customer = this.customers.get(invoice.customerId)!;
    
    return {
      ...invoice,
      items,
      customer
    };
  }

  async createInvoice(invoice: InsertInvoice, items: InsertInvoiceItem[]): Promise<Invoice> {
    const id = this.currentIds.invoices++;
    const newInvoice = { 
      ...invoice, 
      id, 
      date: new Date(),
    };
    
    this.invoices.set(id, newInvoice);

    // Create invoice items
    items.forEach(item => {
      const itemId = this.currentIds.invoiceItems++;
      const newItem = { ...item, id: itemId, invoiceId: id };
      this.invoiceItems.set(itemId, newItem);

      // Update product stock
      const product = this.products.get(item.productId)!;
      this.products.set(item.productId, {
        ...product,
        stock: product.stock - item.quantity
      });
    });

    return newInvoice;
  }

  async updateInvoiceStatus(id: number, status: string): Promise<Invoice> {
    const invoice = this.invoices.get(id);
    if (!invoice) throw new Error("Invoice not found");

    const updatedInvoice = { ...invoice, status };
    this.invoices.set(id, updatedInvoice);
    return updatedInvoice;
  }
}

export const storage = new MemStorage();
