import { useState, useEffect, useRef } from "react";
import { DropdownContainer, DropdownButton, LinkMenu, ListItem } from "../Dropdown.styles";
import { useOutsideClick } from "../../../hooks/useOutsideClick";
import translateIcon from "../../../img/translate.svg";
import {
  getLanguageFromUrl,
  getLanguageFromLocalStorage,
  changeLanguage,
  changeFontFromLanguage,
} from "../../../Helpers";

const languages = [
  {
    name: "English",
    lang: "en",
    useInterFont: true,
  },
  {
    name: "Chinese (中國人)",
    lang: "zh-CN",
    useInterFont: false,
  },
  {
    name: "Japanese (日本)",
    lang: "ja",
    useInterFont: false,
  },
  {
    name: "Hindi (हिन्दी)",
    lang: "hi",
    useInterFont: false,
  },
  {
    name: "Korean (한국인)",
    lang: "ko",
    useInterFont: false,
  },
  {
    name: "Russian (русский)",
    lang: "ru",
    useInterFont: true,
  },
  {
    name: "Spanish (español)",
    lang: "es",
    useInterFont: true,
  },
];

export default function LanguageDropdown({ currentLang, setCurrentLang }) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentLangLabel, setCurrentLangLabel] = useState(null);
  const handleLanguageClick = (item) => {
    setCurrentLang && setCurrentLang(item);
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
      const languageItem = languages.filter((item) => item.lang === currentLang)[0];
      const label = languageItem?.name || "English";
      changeFontFromLanguage(languageItem?.useInterFont);
      setCurrentLangLabel(label);
    } else {
      setCurrentLangLabel("English");
      changeFontFromLanguage(true);
    }
  }, [currentLang]);

  const containerRef = useRef(null);
  useOutsideClick(containerRef, handleClose);

  return (
    <DropdownContainer ref={containerRef}>
      <DropdownButton onClick={handleToggle} isLanguageDropdown>
        <img src={translateIcon} alt="Arrow down" /> {currentLangLabel}
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
