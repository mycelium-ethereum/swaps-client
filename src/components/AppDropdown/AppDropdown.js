import { useEffect, useRef, useState } from "react";
import cx from "classnames";
import * as Styles from "./AppDropdown.styles";
// import { Button } from "~/components/General/Button";
import { useOutsideClick } from "hooks/useOutsideClick";
// import { OutgoingLink } from "~/components/General/OutgoingLink";
// import { linkRowContent } from "~/components/General/Nav/presets";
// import { socialLinks } from "~/constants/socials";
import { ReactComponent as ChevronDown } from "../../img/icons/chevron-down.svg";

const TABLET_BREAKPOINT = 768;
// const MOBILE_BREAKPOINT = 640;

export default function AppDropdown() {
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const handleClose = () => {
    setDropdownOpen(false);
  };

  const handleOpen = () => {
    setDropdownOpen(true);
  };

  const handleResize = () => {
    if (window.innerWidth < TABLET_BREAKPOINT) setDropdownOpen(false);
  };

  const containerRef = useRef(null);
  useOutsideClick(containerRef, handleClose);

  useEffect(() => {
    window.addEventListener("resize", handleResize);

    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <Styles.DropdownContainer ref={containerRef}>
      <DropdownButton onClick={handleOpen} dropdownOpen={dropdownOpen} />
      <DropdownContent dropdownOpen={dropdownOpen} />
    </Styles.DropdownContainer>
  );
}

const DropdownButton = ({ dropdownOpen, onClick }) => {
  return (
    <Styles.DropdownButton onClick={onClick}>
      Trade Now
      <ChevronDown
        alt="Chevron down"
        className={cx("ml-2.5 w-[19px] transition-colors group-hover:text-white", {
          "text-white": dropdownOpen,
          "text-myc-cell-highlight": !dropdownOpen,
        })}
      />
      <span
        className={cx(
          "absolute top-0 left-0 z-[-1] h-full w-full transition-opacity [background:linear-gradient(241.3deg,#098200_-4.53%,rgba(9,130,0,0.6)_88.49%)]",
          {
            "opacity-100": dropdownOpen,
            "opacity-0": !dropdownOpen,
          }
        )}
      />
    </Styles.DropdownButton>
  );
};

const DropdownContent = ({ dropdownOpen }) => {
  const activeStyles = "opacity-100 translate-y-0 pointer-events-auto";
  const inactiveStyles = "opacity-0 translate-y-2 pointer-events-none";

  return (
    <div
      className={cx(
        "absolute top-11 right-0 w-[280px] rounded-[4px] border border-myc-cell-highlight duration-300 [background:linear-gradient(83.12deg,rgba(9,130,0,0.5)_-208.54%,rgba(9,130,0,0)_159.09%),rgba(0,10,0,0.9)]",
        {
          [activeStyles]: dropdownOpen,
          [inactiveStyles]: !dropdownOpen,
        }
      )}
    >
      {linkRowContent.map((item) => {
        const Logo = item.icon;
        return (
          <LinkWrapper key={item.title} link={item.url}>
            <DropdownItem>
              <Logo title={item.title} className={item.className} />
            </DropdownItem>
          </LinkWrapper>
        );
      })}
      <DropdownItem isSocialRow>
        <div className="grid grid-cols-5 items-center gap-x-5">
          {socialLinks.map((item) => {
            const Logo = item.icon;
            return (
              <OutgoingLink key={item.title} href={item.url} className="group">
                <Logo
                  title={item.title}
                  className={`transition-colors duration-300 group-hover:text-myc-cell-highlight ${item.className}`}
                />
              </OutgoingLink>
            );
          })}
        </div>
      </DropdownItem>
    </div>
  );
};

const DropdownItem = ({ isSocialRow, children }) => {
  return (
    <div
      className={cx("relative flex h-14 w-full items-center justify-center overflow-hidden px-4", {
        group: !isSocialRow,
      })}
    >
      <div className="relative z-10">{children}</div>
      <span className="pointer-events-none absolute top-0 left-0 z-0 h-full w-full translate-x-64 opacity-0 transition-all duration-300 [background:linear-gradient(269.53deg,#098200_-35.12%,rgba(9,130,0,0)_65.48%)] group-hover:translate-x-0 group-hover:opacity-100" />
    </div>
  );
};

const LinkWrapper = ({ link, children }) => {
  return (
    <OutgoingLink href={link} className="inline-block w-full border-b border-myc-cell-highlight last:border-0">
      {children}
    </OutgoingLink>
  );
};
