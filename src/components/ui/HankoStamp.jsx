export default function HankoStamp({ className = '' }) {
  return (
    <div
      aria-label="Kaiwa hanko stamp"
      className={`grid h-20 w-20 rotate-[-12deg] place-items-center rounded-full border-[4px] border-border bg-paper font-display text-2xl text-shu shadow-shadow ${className}`}
    >
      会話
    </div>
  );
}
