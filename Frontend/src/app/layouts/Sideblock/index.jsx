// Import Dependencies

// Local Imports
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";

// ----------------------------------------------------------------------

export default function Sideblock({ children }) {
  return (
    <>
      <Header />
      <main className="main-content transition-content grid grid-cols-1">
        {children}
      </main>
      <Sidebar />
    </>
  );
}
