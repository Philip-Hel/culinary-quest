export default function CQCard({ children }) {
  return (
    <div className="
      bg-cq-surface 
      dark:bg-cq-darkSurface 
      border 
      border-cq-border 
      dark:border-cq-darkBorder 
      rounded-xl 
      shadow-cq 
      dark:shadow-cqDark 
      p-6 
      transition-all 
      duration-500 
      animate-fadeIn
    ">
      {children}
    </div>
  );
}