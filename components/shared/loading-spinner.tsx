export default function LoadingSpinner() {
  return (
    <div
      className="h-4 w-4 animate-spin rounded-full border-2 border-muted-foreground border-t-transparent"
      aria-label="Loading"
    />
  );
}