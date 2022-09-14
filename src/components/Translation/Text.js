// import { useEffect } from "react";
import { Translate } from "react-auto-translate";
// import { useLazyTranslate } from 'react-google-translate'

// Requires Translator context
export const Text = ({ children }) => {
  if (!children) return <></>;
  return <Translate>{children}</Translate>;
};

// For inline strings (props)
// export const useTranslateInline = (lang, text) => {
//   const language = lang || 'zh-CN';
//   const [translate, { data }] = useLazyTranslate({
//     language,
//   });
//   useEffect(() => {
//     if (text) {
//       translate(text, language);
//     }
//   }, [translate, text, language]);

//   return data;
// };
