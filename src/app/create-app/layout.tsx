import { Inter } from 'next/font/google';

const inter = Inter({ subsets: ['latin'] });

type CreateAppLayoutProps = {
  children: React.ReactNode;
};

export default function CreateAppLayout({ children }: CreateAppLayoutProps) {
  return (
    <div className={`${inter.className}`}>
      {children}
    </div>
  );
}