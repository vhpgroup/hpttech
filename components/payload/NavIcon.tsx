import Image from "next/image";

export default function NavIcon() {
  return (
    <div aria-label="HPT Tech" className="hpt-admin-icon">
      <Image alt="" height={24} src="/assets/logo/hptlogo.jpg" width={34} />
    </div>
  );
}
