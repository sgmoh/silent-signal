import * as React from "react";
import { VariantProps, cva } from "class-variance-authority";
import { X, CheckCheck, AlertCircle, Info } from "lucide-react";
import { cn } from "@/lib/utils";

const notificationVariants = cva(
  "transform transition-all duration-300 translate-x-full opacity-0 bg-discord-bg-medium border-l-4 shadow-lg rounded-md p-4 flex items-start",
  {
    variants: {
      variant: {
        default: "border-discord-blue",
        success: "border-discord-green",
        destructive: "border-discord-red",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface NotificationProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof notificationVariants> {
  title: string;
  description?: string;
  onClose?: () => void;
  visible?: boolean;
}

const Notification = React.forwardRef<HTMLDivElement, NotificationProps>(
  ({ className, variant, title, description, onClose, visible = true, ...props }, ref) => {
    const IconComponent = React.useMemo(() => {
      switch (variant) {
        case "success":
          return CheckCheck;
        case "destructive":
          return X;
        default:
          return Info;
      }
    }, [variant]);

    const iconColor = React.useMemo(() => {
      switch (variant) {
        case "success":
          return "text-discord-green";
        case "destructive":
          return "text-discord-red";
        default:
          return "text-discord-blue";
      }
    }, [variant]);

    return (
      <div
        ref={ref}
        className={cn(
          notificationVariants({ variant }),
          visible ? "translate-x-0 opacity-100" : "translate-x-full opacity-0",
          className
        )}
        {...props}
      >
        <IconComponent className={cn("w-5 h-5 mr-3 mt-0.5", iconColor)} />
        <div>
          <h3 className="font-medium text-white">{title}</h3>
          {description && <p className="text-sm text-gray-300">{description}</p>}
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="ml-auto text-gray-400 hover:text-white"
            aria-label="Close notification"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
    );
  }
);

Notification.displayName = "Notification";

export { Notification, notificationVariants };
