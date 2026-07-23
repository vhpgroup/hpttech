import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/cn";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 rounded-md font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        // primary = xanh thương hiệu (token primary-*). Trước đây variant "primary"
        // render màu cam accent (đặt tên đảo) — đã chuẩn hóa lại theo design system.
        primary:
          "bg-primary-600 text-white hover:bg-primary-700 focus-visible:ring-primary-500",
        // accent = cam nhấn (tên mới của variant "primary" cũ).
        accent:
          "bg-accent-500 text-white hover:bg-accent-600 focus-visible:ring-accent-500",
        // DEPRECATED: "secondary" là alias của primary (giữ tương thích ngược,
        // sẽ gỡ sau khi xác nhận không còn call-site nào dùng).
        secondary:
          "bg-primary-600 text-white hover:bg-primary-700 focus-visible:ring-primary-500",
        outline:
          "border border-border bg-white text-ink/80 hover:border-primary-600 hover:text-primary-600 focus-visible:ring-primary-500",
        ghost:
          "bg-transparent text-ink/80 hover:bg-surface focus-visible:ring-primary-500",
        danger:
          "bg-danger text-white hover:bg-danger/90 focus-visible:ring-danger"
      },
      size: {
        sm: "h-9 px-3 text-sm",
        md: "h-10 px-4 text-sm",
        lg: "h-12 px-6 text-base"
      }
    },
    defaultVariants: {
      variant: "primary",
      size: "md"
    }
  }
);

type ButtonBaseProps = VariantProps<typeof buttonVariants> & {
  asChild?: boolean;
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
};

export type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & ButtonBaseProps;

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant,
      size,
      asChild,
      loading = false,
      leftIcon,
      rightIcon,
      children,
      disabled,
      ...props
    },
    ref
  ) => {
    const content = (
      <>
        {loading ? <Spinner /> : leftIcon}
        <span>{children}</span>
        {!loading && rightIcon}
      </>
    );

    if (asChild) {
      const child = React.Children.only(children) as React.ReactElement<{
        className?: string;
        children?: React.ReactNode;
      }>;

      return (
        <Slot
          ref={ref}
          className={cn(buttonVariants({ variant, size }), className)}
          aria-disabled={disabled || loading}
          {...props}
        >
          {React.cloneElement(child, {
            className: cn(child.props.className),
            children: (
              <>
                {loading ? <Spinner /> : leftIcon}
                <span>{child.props.children}</span>
                {!loading && rightIcon}
              </>
            )
          })}
        </Slot>
      );
    }

    return (
      <button
        ref={ref}
        className={cn(buttonVariants({ variant, size }), className)}
        disabled={disabled || loading}
        aria-disabled={disabled || loading}
        {...props}
      >
        {content}
      </button>
    );
  }
);

Button.displayName = "Button";

function Spinner() {
  return (
    <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 0 1 8-8v4a4 4 0 0 0-4 4H4Z"
      />
    </svg>
  );
}

export { buttonVariants };
