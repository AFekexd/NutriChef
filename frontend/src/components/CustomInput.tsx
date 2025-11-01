import { Input } from "./ui/input";

interface CustomInputProps {
  type?: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  className?: string;
  placeholder?: string;
  required?: boolean;
}

const CustomInput: React.FC<CustomInputProps> = ({
  type = "text",
  value,
  onChange,
  className = "pl-10 dark:text-gray-300",
  placeholder = "Your name",
  required = false,
}) => {
  return (
    <Input
      type={type}
      value={value}
      onChange={onChange}
      className={className}
      placeholder={placeholder}
      required={required}
    />
  );
};

export default CustomInput;
