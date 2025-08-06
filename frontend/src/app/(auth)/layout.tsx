//import "@/styles/globals.css";
import 'antd/dist/reset.css';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className={`
      min-h-screen flex items-center justify-center bg-[#e0e5ec]
    `}>
      {children}
    </div>
  );
}
