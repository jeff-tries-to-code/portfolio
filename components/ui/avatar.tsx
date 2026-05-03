import Image from "next/image";

type AvatarProps = {
  src: string;
  alt: string;
  size?: number;
};

export function Avatar({ src, alt, size = 64 }: AvatarProps) {
  return (
    <Image
      src={src}
      alt={alt}
      width={size}
      height={size}
      priority
      className="rounded-full object-cover"
      style={{ width: size, height: size }}
    />
  );
}
