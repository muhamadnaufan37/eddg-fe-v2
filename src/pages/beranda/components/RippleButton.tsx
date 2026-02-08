// components/RippleButton.tsx

import type { MouseEvent, ReactNode } from "react";

interface Props {
  children: ReactNode;
  onClick?: () => void;
  className?: string;
}

const RippleButton = ({ children, onClick, className }: Props) => {
  const createRipple = (event: MouseEvent<HTMLButtonElement>) => {
    const button = event.currentTarget;
    const circle = document.createElement("span");

    const diameter = Math.max(button.clientWidth, button.clientHeight);
    const radius = diameter / 2;

    circle.style.width = circle.style.height = `${diameter}px`;
    circle.style.left = `${event.clientX - button.getBoundingClientRect().left - radius}px`;
    circle.style.top = `${event.clientY - button.getBoundingClientRect().top - radius}px`;
    circle.className = "ripple";

    const ripple = button.getElementsByClassName("ripple")[0];
    if (ripple) ripple.remove();

    button.appendChild(circle);
    onClick?.();
  };

  return (
    <button
      onClick={createRipple}
      className={`relative overflow-hidden ${className}`}
    >
      {children}
    </button>
  );
};

export default RippleButton;
