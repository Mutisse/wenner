import React from "react";
import { Input } from "@/components/ui/input";

type Props = React.ComponentProps<typeof Input> & {
  label?: string;
  icon?: React.ElementType;
  iconPosition?: "left" | "right";
  error?: string | null;
};

const InputField: React.FC<Props> = ({
  label,
  icon: Icon,
  iconPosition = "right",
  error,
  className,
  ...rest
}) => {
  return (
    <div className="mb-4">
      {label && (
        <label className="text-sm font-medium text-gray-600 uppercase tracking-wide">
          {label}
        </label>
      )}

      <div className="relative">
        {Icon && iconPosition === "left" && (
          <Icon
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            size={18}
          />
        )}

        <Input
          className={`${className ?? ""} ${
            Icon ? (iconPosition === "left" ? "pl-10" : "pr-10") : ""
          } ${error ? "border-red-500" : ""}`}
          {...(rest as any)}
        />

        {Icon && iconPosition === "right" && (
          <Icon
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
            size={18}
          />
        )}
      </div>

      {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
    </div>
  );
};

export default InputField;
