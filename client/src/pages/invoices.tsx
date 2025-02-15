import { Layout } from "@/components/layout/layout";
import { DataTable } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  productId: z.number(),
  quantity: z.number().min(1),
});

type InvoiceFormValues = {
  customerId: number;
  items: {
    productId: number;
    quantity: number;
  }[];
};

export default function Invoices() {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<InvoiceFormValues>({
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
          price: Number(product.price),
        };
      });

      const total = items.reduce((acc, item) => {
        return acc + (item.price * item.quantity);
      }, 0);

      await apiRequest("POST", "/api/invoices", {
        invoice: {
          customerId: values.customerId,
          total,
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
  });

  function onSubmit(values: InvoiceFormValues) {
    mutation.mutate(values);
  }

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
                      <Select
                        onValueChange={(value) => field.onChange(Number(value))}
                        defaultValue={field.value.toString()}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a customer" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {customers?.map((customer) => (
                            <SelectItem
                              key={customer.id}
                              value={customer.id.toString()}
                            >
                              {customer.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
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
                            <Select
                              onValueChange={(value) =>
                                field.onChange(Number(value))
                              }
                              defaultValue={field.value.toString()}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select a product" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {products?.map((product) => (
                                  <SelectItem
                                    key={product.id}
                                    value={product.id.toString()}
                                  >
                                    {product.name} -{" "}
                                    {CURRENCY_FORMATTER.format(
                                      Number(product.price)
                                    )}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
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
                                onChange={(e) =>
                                  field.onChange(Number(e.target.value))
                                }
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