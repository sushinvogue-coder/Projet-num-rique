export const metadata = { title: "Connexion – Ton SaaS" };

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  );
}
