import { useState, useEffect, useRef } from "react";
import { DropdownContainer, LanguageDropdownButton, LanguageMenu, ListItem } from "../Dropdown.styles";
import { useOutsideClick } from "../../../hooks/useOutsideClick";
import translateIcon from "../../../img/translate.svg";
import {
  getLanguageFromUrl,
  getLanguageFromLocalStorage,
  changeLanguage,
  changeFontFromLanguage,
} from "../../../utils/translation";

const languages = [
  {
    name: "English",
    lang: "en",
    useInterFont: true,
  },
  {
    name: "Chinese",
    nativeName: "中國人",
    lang: "zh-CN",
    useInterFont: false,
  },
  {
    name: "Japanese",
    nativeName: "日本",
    lang: "ja",
    useInterFont: false,
  },
  {
    name: "Hindi",
    nativeName: "हिन्दी",
    lang: "hi",
    comingSoon: true,
    useInterFont: false,
  },
  {
    name: "Korean",
    nativeName: "한국인",
    lang: "ko",
    comingSoon: true,
    useInterFont: false,
  },
  {
    name: "Russian",
    nativeName: "русский",
    lang: "ru",
    comingSoon: true,
    useInterFont: true,
  },
  {
    name: "Spanish",
    nativeName: "español",
    lang: "es",
    comingSoon: true,
    useInterFont: true,
  },
];

export default function LanguageDropdown({ currentLang, setCurrentLang, isMobile }) {
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
      changeLanguage();
      setCurrentLangLabel("English");
      changeFontFromLanguage(true);
    }
  }, [currentLang]);

  const containerRef = useRef(null);
  useOutsideClick(containerRef, handleClose);

  return (
    <DropdownContainer ref={containerRef} isMobile={isMobile}>
      <LanguageDropdownButton onClick={handleToggle}>
        <img src={translateIcon} alt="Arrow down" /> <span>{currentLangLabel}</span>
      </LanguageDropdownButton>
      <LanguageMenu open={isOpen}>
        {languages.map((item) => (
          <>
            {!item.comingSoon && (
              <MenuItem key={item.name} onClick={handleLanguageClick} lang={item.lang}>
                {item.name} {item.nativeName && `(${item.nativeName})`}
              </MenuItem>
            )}
          </>
        ))}
      </LanguageMenu>
    </DropdownContainer>
  );
}

const MenuItem = ({ lang, onClick, disabled, children }) => (
  <ListItem disabled={disabled}>
    <button onClick={() => onClick(lang)}>{children}</button>
  </ListItem>
);
