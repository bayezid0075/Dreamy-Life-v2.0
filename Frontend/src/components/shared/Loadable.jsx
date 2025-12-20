// Import Dependencies
import { Suspense } from "react";

// ----------------------------------------------------------------------

// Loadable wrapper for lazy-loaded components
// Handles React.lazy() components and regular components
const Loadable = (Component, Fallback) => {
  // Return a component that wraps the lazy component in Suspense
  const LoadableComponent = (props) => {
    return (
      <Suspense fallback={Fallback ? <Fallback /> : null}>
        <Component {...props} />
      </Suspense>
    );
  };
  
  LoadableComponent.displayName = `Loadable(${Component.displayName || Component.name || 'Component'})`;
  
  return LoadableComponent;
};

export { Loadable };
