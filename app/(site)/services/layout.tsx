import { Metadata } from "next";
import { metadata } from "./metadata";

export { metadata };

export default function ServicesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen">
      {children}
    </div>
  );
}
