// Illustration components - using img tags for complex SVGs
// These are large illustrations that don't need to be styled with CSS variables

export function Error404Magnify({ className = "", style, ...props }) {
  return (
    <img
      src="/images/illustrations/error-404-magnify.svg"
      alt="404 Error"
      className={className}
      style={style}
      {...props}
    />
  );
}

export function RepairServer({ className = "", style, ...props }) {
  return (
    <img
      src="/images/illustrations/repair-server.svg"
      alt="Server Error"
      className={className}
      style={style}
      {...props}
    />
  );
}

export function WindowCrash({ className = "", style, ...props }) {
  return (
    <img
      src="/images/illustrations/window-crash.svg"
      alt="429 Error"
      className={className}
      style={style}
      {...props}
    />
  );
}

export function Authorize({ className = "", style, ...props }) {
  return (
    <img
      src="/images/illustrations/authorize.svg"
      alt="401 Error"
      className={className}
      style={style}
      {...props}
    />
  );
}

export function GirlEmptyBox({ className = "", ...props }) {
  return (
    <img
      src="/images/illustrations/girl-empty-box.svg"
      alt="Empty"
      className={className}
      {...props}
    />
  );
}

