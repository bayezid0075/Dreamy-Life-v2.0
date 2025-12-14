// Next.js compatible Link component (replaces react-router Link)
"use client";

import NextLink from "next/link";
import { forwardRef } from "react";

export const Link = forwardRef(({ to, href, children, ...props }, ref) => {
  const url = to || href || "#";
  
  return (
    <NextLink href={url} ref={ref} {...props}>
      {children}
    </NextLink>
  );
});

Link.displayName = "Link";

