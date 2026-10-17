type PlaceholderImageProps = {
  src: string;
  alt: string;
  className?: string;
  priority?: boolean;
};

export function PlaceholderImage({ src, alt, className = "", priority = false }: PlaceholderImageProps) {
  return (
    <figure className={`replaceable-image ${className}`}>
      <img alt={alt} loading={priority ? "eager" : "lazy"} src={src} />
    </figure>
  );
}