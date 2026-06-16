import Image from "next/image";

export default function NavLogo() {
  return (
    <div className="hpt-admin-brand">
      <Image alt="HPT Technology" height={46} priority src="/assets/logo/hptlogo.jpg" width={180} />
    </div>
  );
}
