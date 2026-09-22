import ringLogo from "@/assets/oxyvra-ring.png.asset.json";

export function OxyvraLogo({
  size = 48,
  className = "",
}: {
  size?: number;
  className?: string;
}) {
  return (
    <img
      src={ringLogo.url}
      alt="Oxyvra"
      width={size}
      height={size}
      className={className}
      style={{ objectFit: "contain" }}
    />
  );
}
