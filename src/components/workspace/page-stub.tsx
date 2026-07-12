// Shared placeholder for workspace sections not built yet. Renders inside the
// shell (sidebar + header) from the workspace layout.
export function PageStub({
  title,
  description,
}: {
  title: string;
  description?: string;
}) {
  return (
    <div className="flex flex-1 flex-col gap-3">
      <div className="space-y-1">
        <h1 className="text-xl">{title}</h1>
        {description && (
          <p className="text-sm text-muted-foreground">{description}</p>
        )}
      </div>
      <div className="flex min-h-[60vh] flex-1 items-center justify-center rounded-xl border border-dashed text-sm text-muted-foreground">
        Nothing here yet — this section is coming soon.
      </div>
    </div>
  );
}
