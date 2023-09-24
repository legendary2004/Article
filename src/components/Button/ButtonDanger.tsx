import Button, { ButtonProps } from "components/Button/Button";
import React from "react";

export interface ButtonDangerProps extends ButtonProps {}

const ButtonDanger: React.FC<ButtonDangerProps> = ({
  className = "",
  ...args
}) => {
  return (
    <Button
      className={`ttnc-ButtonDanger disabled:bg-opacity-70 bg-red-100 hover:bg-rose-50 text-rose-600 ${className}`}
      {...args}
    />
  );
};

export default ButtonDanger;
