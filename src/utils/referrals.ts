import { REFERRAL_CODE_QUERY_PARAMS } from "../config/localstorage";
import { REFERRAL_CODE_REGEX, MAX_REFERRAL_CODE_LENGTH } from "../config/referrals";
import { helperToast } from "../Helpers";
import { copyToClipboard } from "./common";

export function copyReferralCode(code: string) {
  copyToClipboard(`https://swaps.mycelium.xyz?${REFERRAL_CODE_QUERY_PARAMS}=${code}`);
  helperToast.success("Referral link copied to your clipboard");
}

export function getCodeError(value: string) {
  const trimmedValue = value.trim();
  if (!trimmedValue) return "";

  if (trimmedValue.length > MAX_REFERRAL_CODE_LENGTH) {
    return `The referral code can't be more than ${MAX_REFERRAL_CODE_LENGTH} characters.`;
  }

  if (!REFERRAL_CODE_REGEX.test(trimmedValue)) {
    return "Only letters, numbers and underscores are allowed.";
  }
  return "";
}

export function getTierIdDisplay(tierId?: string) {
  if (tierId === undefined) {
    return "";
  }
  return Number(tierId) + 1;
}
