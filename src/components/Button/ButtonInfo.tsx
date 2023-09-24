import React, { ButtonHTMLAttributes } from "react";
import twFocusClass from "utils/twFocusClass";

export interface ButtonInfoProps
  extends ButtonHTMLAttributes<HTMLButtonElement> {
  size?: string;
  title?: string;
}

const ButtonInfo: React.FC<ButtonInfoProps> = ({
  className = " ",
  size = " w-9 h-9 ",
  title = "",
  ...args
}) => {
  return (
    <button title={title}
      className={
        `ttnc-ButtonInfo inline-flex w-11 h-11 items-center justify-center rounded-full bg-white hover:bg-neutral-100 border border-neutral-200 text-neutral-6000 dark:text-neutral-400 dark:bg-neutral-900 dark:hover:bg-neutral-800 dark:border-neutral-700 focus:outline-none ${className} ${size} ` +
        twFocusClass(false)
      }
      {...args}
    />
  );
};

export default ButtonInfo;
