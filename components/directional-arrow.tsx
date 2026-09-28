export function DirectionalArrow({
  backwards = false,
}: {
  backwards?: boolean;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="22"
      height="22"
      aria-hidden="true"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.15"
    >
      <path d={backwards ? "M20 12H5m6-6-6 6 6 6" : "M4 12h15m-6-6 6 6-6 6"} />
    </svg>
  );
}
