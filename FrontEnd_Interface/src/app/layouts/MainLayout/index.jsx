// Import Dependencies
import clsx from "clsx";

// Local Imports
import { Header } from "./Header";
import { Sidebar } from "./Sidebar";

// ----------------------------------------------------------------------

export default function MainLayout({ children }) {
  return (
    <>
      <Header />
      <main
        className={clsx("main-content transition-content grid grid-cols-1")}
      >
        {children}
      </main>
      <Sidebar />
    </>
  );
}
