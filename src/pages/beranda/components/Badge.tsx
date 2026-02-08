// components/Badge.tsx
interface Props {
  count?: number;
}

const Badge = ({ count }: Props) => {
  if (!count) {
    return (
      <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
    );
  }

  return (
    <span
      className="
    absolute -top-1 -right-1
    bg-red-500 text-white text-[10px]
    px-1.5 py-0.5 rounded-full
    min-w-4.5 text-center
  "
    >
      {count}
    </span>
  );
};

export default Badge;
