import Image from "next/image";

type BrandLogoProps = {
  size?: number;
  className?: string;
};

export function BrandLogo({ size = 40, className }: BrandLogoProps) {
  return (
    <div
      className={`relative overflow-hidden rounded-2xl ${className ?? ""}`}
      style={{ width: size, height: size }}
    >
      <Image
        src="/logo.png"
        alt="Dreamy Life logo"
        fill
        sizes={`${size}px`}
        className="object-contain"
        priority
      />
    </div>
  );
}

