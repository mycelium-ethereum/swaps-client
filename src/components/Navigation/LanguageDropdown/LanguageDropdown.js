import { useState, useEffect, useRef } from "react";
import { DropdownContainer, DropdownButton, LinkMenu, ListItem } from "../Dropdown.styles";
import { useOutsideClick } from "../../../hooks/useOutsideClick";
import chevronDown from "../../../img/chevron-down.svg";
import { getLanguageFromUrl, getLanguageFromLocalStorage, changeLanguage } from "../../../Helpers";

const languages = [
  {
    name: "English",
    lang: "en",
  },
  {
    name: "Chinese",
    lang: "zh-CN",
  },
  {
    name: "Spanish",
    lang: "es",
  },
  {
    name: "Japanese",
    lang: "ja",
  },
  {
    name: "Hindi",
    lang: "hi",
  },
  {
    name: "Korean",
    lang: "ko",
  },
  {
    name: "Russian",
    lang: "ru",
  },
];

export default function LanguageDropdown({ currentLang, setCurrentLang }) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentLangLabel, setCurrentLangLabel] = useState(null);
  const handleLanguageClick = (item) => {
    setCurrentLang(item);
    setIsOpen(false);
  };

  const handleToggle = () => {
    setIsOpen(!isOpen);
  };

  const handleClose = () => {
    setIsOpen(false);
  };

  // Check if previous language selection is stored in local storage or URL param
  useEffect(() => {
    const urlLang = getLanguageFromUrl();
    const localStorageLang = getLanguageFromLocalStorage();
    if (urlLang) {
      const label = languages.filter((item) => item.lang === urlLang)[0]?.name || "English";
      setCurrentLangLabel(label);
    } else if (localStorageLang) {
      const label = languages.filter((item) => item.lang === localStorageLang)[0]?.name || "English";
      setCurrentLangLabel(label);
    }
    setCurrentLang && setCurrentLang(urlLang || localStorageLang);
  }, [setCurrentLang]);

  useEffect(() => {
    if (currentLang && currentLang !== "en") {
      changeLanguage(currentLang);
      const label = languages.filter((item) => item.lang === currentLang)[0]?.name || "English";
      setCurrentLangLabel(label);
    } else {
      setCurrentLangLabel("English");
    }
  }, [currentLang]);

  const containerRef = useRef(null);
  useOutsideClick(containerRef, handleClose);

  return (
    <DropdownContainer ref={containerRef}>
      <DropdownButton onClick={handleToggle}>
        {currentLangLabel} <img src={chevronDown} alt="Arrow down" />
      </DropdownButton>
      <LinkMenu open={isOpen} isLanguageDropdown>
        {languages.map((item) => (
          <MenuItem key={item.name} onClick={handleLanguageClick} lang={item.lang}>
            {item.name}
          </MenuItem>
        ))}
      </LinkMenu>
    </DropdownContainer>
  );
}

const MenuItem = ({ lang, onClick, children }) => (
  <ListItem>
    <button onClick={() => onClick(lang)}>{children}</button>
  </ListItem>
);
