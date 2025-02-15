import { Layout } from "@/components/layout/layout";
import { DataTable } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import { Combobox } from "@/components/ui/combobox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  type Invoice,
  type Product,
  type Customer,
  type InvoiceWithItems,
} from "@shared/schema";
import { INVOICE_STATUSES, CURRENCY_FORMATTER, DATE_FORMATTER } from "@/lib/constants";
import type { ColumnDef } from "@tanstack/react-table";
import { apiRequest } from "@/lib/queryClient";
import { z } from "zod";

const columns: ColumnDef<Invoice>[] = [
  {
    accessorKey: "id",
    header: "Invoice #",
  },
  {
    accessorKey: "date",
    header: "Date",
    cell: ({ row }) => DATE_FORMATTER.format(new Date(row.original.date)),
  },
  {
    accessorKey: "total",
    header: "Total",
    cell: ({ row }) => CURRENCY_FORMATTER.format(Number(row.original.total)),
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => (
      <span className={`capitalize ${
        row.original.status === "paid"
          ? "text-green-600"
          : row.original.status === "cancelled"
          ? "text-red-600"
          : "text-yellow-600"
      }`}>
        {row.original.status}
      </span>
    ),
  },
];

const invoiceItemSchema = z.object({
  productId: z.number().min(1, "Please select a product"),
  quantity: z.number().min(1, "Quantity must be at least 1"),
});

const invoiceFormSchema = z.object({
  customerId: z.number().min(1, "Please select a customer"),
  items: z.array(invoiceItemSchema).min(1, "Add at least one item"),
});

type InvoiceFormValues = z.infer<typeof invoiceFormSchema>;

export default function Invoices() {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<InvoiceFormValues>({
    resolver: zodResolver(invoiceFormSchema),
    defaultValues: {
      customerId: 0,
      items: [{ productId: 0, quantity: 1 }],
    },
  });

  const { data: invoices, isLoading: loadingInvoices } = useQuery<Invoice[]>({
    queryKey: ["/api/invoices"],
  });

  const { data: products } = useQuery<Product[]>({
    queryKey: ["/api/products"],
  });

  const { data: customers } = useQuery<Customer[]>({
    queryKey: ["/api/customers"],
  });

  const mutation = useMutation({
    mutationFn: async (values: InvoiceFormValues) => {
      const items = values.items.map(item => {
        const product = products?.find(p => p.id === item.productId);
        if (!product) throw new Error("Product not found");
        return {
          ...item,
          price: product.price,
        };
      });

      const total = items.reduce((acc, item) => {
        const product = products?.find(p => p.id === item.productId);
        return acc + (Number(product?.price || 0) * item.quantity);
      }, 0);

      await apiRequest("POST", "/api/invoices", {
        invoice: {
          customerId: values.customerId,
          total: total.toString(),
          status: "pending",
        },
        items,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/invoices"] });
      setOpen(false);
      form.reset();
      toast({
        title: "Invoice created",
        description: "The invoice has been created successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create invoice",
        variant: "destructive",
      });
    },
  });

  async function onSubmit(values: InvoiceFormValues) {
    try {
      await mutation.mutateAsync(values);
    } catch (error) {
      console.error("Failed to create invoice:", error);
    }
  }

  const customerOptions = customers?.map(customer => ({
    label: customer.name,
    value: customer.id.toString(),
  })) || [];

  const productOptions = products?.map(product => ({
    label: `${product.name} - ${CURRENCY_FORMATTER.format(Number(product.price))}`,
    value: product.id.toString(),
  })) || [];

  return (
    <Layout heading="Invoices">
      <div className="mb-4">
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>Create Invoice</Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create Invoice</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="customerId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Customer</FormLabel>
                      <FormControl>
                        <Combobox
                          options={customerOptions}
                          value={field.value.toString()}
                          onValueChange={(value) => field.onChange(Number(value))}
                          placeholder="Search customers..."
                          emptyText="No customers found."
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="space-y-2">
                  {form.watch("items").map((_, index) => (
                    <div key={index} className="flex gap-4">
                      <FormField
                        control={form.control}
                        name={`items.${index}.productId`}
                        render={({ field }) => (
                          <FormItem className="flex-1">
                            <FormControl>
                              <Combobox
                                options={productOptions}
                                value={field.value.toString()}
                                onValueChange={(value) => field.onChange(Number(value))}
                                placeholder="Search products..."
                                emptyText="No products found."
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name={`items.${index}.quantity`}
                        render={({ field }) => (
                          <FormItem className="w-24">
                            <FormControl>
                              <Input
                                type="number"
                                min="1"
                                {...field}
                                onChange={(e) => field.onChange(Number(e.target.value))}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          const items = form.getValues("items");
                          if (items.length > 1) {
                            form.setValue(
                              "items",
                              items.filter((_, i) => i !== index)
                            );
                          }
                        }}
                      >
                        Remove
                      </Button>
                    </div>
                  ))}
                </div>

                <Button
                  type="button"
                  variant="outline"
                  onClick={() =>
                    form.setValue("items", [
                      ...form.getValues("items"),
                      { productId: 0, quantity: 1 },
                    ])
                  }
                >
                  Add Item
                </Button>

                <Button type="submit" className="w-full">
                  Create Invoice
                </Button>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {loadingInvoices ? (
        <div>Loading...</div>
      ) : (
        <DataTable columns={columns} data={invoices || []} />
      )}
    </Layout>
  );
}