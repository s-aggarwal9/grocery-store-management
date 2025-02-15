import { Sidebar } from "./sidebar";

interface LayoutProps {
  children: React.ReactNode;
  heading: string;
}

export function Layout({ children, heading }: LayoutProps) {
  return (
    <>
      <Sidebar />
      <div className="lg:pl-72">
        <main className="py-10">
          <div className="px-4 sm:px-6 lg:px-8">
            <h1 className="text-2xl font-semibold mb-6">{heading}</h1>
            {children}
          </div>
        </main>
      </div>
    </>
  );
}
