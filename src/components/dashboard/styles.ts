
import { cva } from "class-variance-authority";

export const cardVariants = cva("rounded-lg shadow-lg", {
  variants: {
    variant: {
      default: "bg-card text-card-foreground",
      highlight: "bg-primary text-primary-foreground",
    },
  },
  defaultVariants: {
    variant: "default",
  },
});

export const cardHeaderVariants = cva("p-6", {
  variants: {
    size: {
      default: "text-2xl font-bold",
      sm: "text-xl font-semibold",
    },
  },
  defaultVariants: {
    size: "default",
  },
});

export const cardContentVariants = cva("p-6", {
  variants: {
    size: {
      default: "text-base",
      lg: "text-lg",
    },
  },
  defaultVariants: {
    size: "default",
  },
});
