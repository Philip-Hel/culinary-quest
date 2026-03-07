export default function CQButton({ children, ...props }) {
  return (
    <button
      {...props}
      className="
        bg-cq-primary 
        hover:bg-cq-primaryDark 
        dark:bg-cq-secondary 
        dark:hover:bg-cq-primary 
        text-white 
        px-6 py-3 
        rounded-lg 
        font-medium 
        shadow 
        transition-all 
        duration-300 
        ease-cq-smooth 
        hover:scale-[1.03]
        active:scale-[0.98]
      "
    >
      {children}
    </button>
  );
}