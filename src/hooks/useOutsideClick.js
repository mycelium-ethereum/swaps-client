import { useEffect } from "react";

export function useOutsideClick(containerRef, action) {
  useEffect(() => {
    const detectClickOutside = (event) => {
      if (!!containerRef && !containerRef?.current?.contains(event.target)) {
        action();
      }
    };
    document.addEventListener("click", detectClickOutside);
    return () => document.removeEventListener("click", detectClickOutside);
  }, [containerRef, action]);
}
