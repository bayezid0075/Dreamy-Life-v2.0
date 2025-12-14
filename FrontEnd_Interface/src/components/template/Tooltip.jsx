"use client";

import { useEffect, useState } from "react";
import { Tooltip as ReactTooltip } from "components/shared/Tooltip";
import { isServer } from "utils/isServer";

export default function Tooltip() {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (isServer || !isMounted) {
    return null;
  }

  return (
    <ReactTooltip
      anchorSelect="[data-tooltip]"
      opacity={1}
      style={{
        padding: "0.3rem 0.75rem",
        borderRadius: "0.5rem",
        zIndex: 1000,
      }}
    />
  );
}
