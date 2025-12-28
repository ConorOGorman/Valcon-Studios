import { placeholderDataUri } from "../../lib/placeholder";

type MediaProps = {
  alt: string;
  remoteSrc?: string;
  remoteSrcSet?: string;
  className?: string;
};

export function Media({ alt, remoteSrc, remoteSrcSet, className }: MediaProps) {
  const placeholder = placeholderDataUri("Lucid Studio's");

  return (
    <img
      alt={alt}
      loading="lazy"
      decoding="async"
      className={className}
      style={{ color: "transparent" }}
      src={placeholder}
      data-remote-src={remoteSrc}
      data-remote-srcset={remoteSrcSet}
    />
  );
}
