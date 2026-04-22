function Skeleton({ className }: { className?: string }) {
  return (
    <div className={`animate-pulse rounded-md bg-secondary/60 ${className ?? ""}`} />
  );
}

export { Skeleton };
