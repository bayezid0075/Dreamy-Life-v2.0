// Next.js compatible NavLink component (replaces react-router NavLink)
"use client";

import NextLink from "next/link";
import { usePathname } from "next/navigation";
import { forwardRef, useMemo } from "react";
import clsx from "clsx";

export const NavLink = forwardRef(
  ({ to, href, className, activeClassName, children, ...props }, ref) => {
    const pathname = usePathname();
    const url = to || href || "#";
    const isActive = useMemo(
      () => pathname === url || pathname.startsWith(url + "/"),
      [pathname, url]
    );

    // Handle render prop pattern (children as function)
    const content = typeof children === "function" 
      ? children({ isActive })
      : children;

    const finalClassName = typeof className === "function"
      ? className({ isActive })
      : clsx(className, isActive && activeClassName);

    return (
      <NextLink
        href={url}
        ref={ref}
        className={finalClassName}
        {...props}
      >
        {content}
      </NextLink>
    );
  }
);

NavLink.displayName = "NavLink";

