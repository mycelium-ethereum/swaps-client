import { useEffect } from "react";

export function useOutsideClick(ref: React.RefObject<HTMLDivElement>, action: () => any) {
  useEffect(() => {
    const detectClickOutside = (event: any) => {
      if (!!ref && !ref?.current?.contains(event.target)) {
        action();
      }
    };
    document.addEventListener("click", detectClickOutside);
    return () => document.removeEventListener("click", detectClickOutside);
  }, [ref, action]);
}
