export function getLanguageFromUrl() {
  const queryString = window.location.search;
  const urlParams = new URLSearchParams(queryString);
  const lang = urlParams.get("lang");
  if (lang) {
    window.localStorage.setItem("selectedLang", lang);
  }
  return lang;
}

export function getLanguageFromLocalStorage() {
  const lang = window.localStorage.getItem("selectedLang");
  return lang;
}

export function changeLanguage(language: string = "") {
  if (language?.length) {
    window.localStorage.setItem("selectedLang", language);
    window.history.replaceState(null, "", `?lang=${language}`);
  }
  else {
    window.localStorage.removeItem("selectedLang");
    window.history.replaceState(null, "", window.location.pathname);
  }
}

export function changeFontFromLanguage(usesInterFont: boolean) {
  if (usesInterFont) {
    document.body.classList.add("inter-font");
  } else {
    document.body.classList.remove("inter-font");
  }
}
