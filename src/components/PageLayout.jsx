export default function PageLayout({ children }) {
  return (
    <div className="
      min-h-screen 
      bg-cq-bg 
      dark:bg-cq-darkBg 
      text-cq-text 
      dark:text-cq-darkText 
      transition-colors duration-500
    ">
      <header className="py-10 text-center">
        <h1 className="text-5xl font-serif text-cq-primary dark:text-cq-secondary transition-colors">
          Culinary Quest
        </h1>
        <p className="text-cq-muted dark:text-cq-darkMuted text-lg mt-2">
          Explore the globe, one dish at a time.
        </p>
      </header>

      <main className="max-w-4xl mx-auto px-4 pb-20">
        {children}
      </main>
    </div>
  );
}