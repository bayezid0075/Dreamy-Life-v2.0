// Root layout must be a server component in Next.js 15
import { ClientProviders } from "./layout-client";

export const metadata = {
  title: "Dreamy Life",
  description: "Dreamy Life Platform",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <ClientProviders>{children}</ClientProviders>
      </body>
    </html>
  );
}

