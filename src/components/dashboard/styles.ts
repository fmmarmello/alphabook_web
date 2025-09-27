
import { cva } from "class-variance-authority";

export const cardVariants = cva("rounded-lg shadow-lg", {
  variants: {
    variant: {
      default: "bg-white dark:bg-gray-800",
      highlight: "bg-blue-500 text-white dark:bg-blue-400",
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
