import Image from "next/image";

type AvatarProps = {
  src: string;
  alt: string;
  size?: number;
  className?: string;
};

export function Avatar({ src, alt, size = 64, className = "" }: AvatarProps) {
  return (
    <Image
      src={src}
      alt={alt}
      width={size}
      height={size}
      priority
      className={`rounded-full object-cover ${className}`}
      style={{ width: size, height: size }}
    />
  );
}
