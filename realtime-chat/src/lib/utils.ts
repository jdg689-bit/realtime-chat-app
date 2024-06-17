import { ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function classnames(...inputs: ClassValue[]) { 
    // uses clsx and tailwind-merge dependencies
    return twMerge(clsx(inputs));
}