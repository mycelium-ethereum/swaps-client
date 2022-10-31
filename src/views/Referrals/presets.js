import firstPlaceIcon from "../../img/referrals-comp/first.svg";
import secondPlaceIcon from "../../img/referrals-comp/second.svg";
import thirdPlaceIcon from "../../img/referrals-comp/third.svg";

export const competitionPodiumContent = [
  {
    icon: firstPlaceIcon,
    prize: "$10,000 USDC",
    eligibility: <span>For the referral code generating the most volume</span>,
    className: "first",
    mobileOnly: true,
  },
  {
    icon: secondPlaceIcon,
    prize: "$5,000 USDC",
    eligibility: <span>For second highest volume on referral card</span>,
    className: "second",
  },
  {
    icon: firstPlaceIcon,
    prize: "$10,000 USDC",
    eligibility: <span>For the referral code generating the most volume</span>,
    className: "first",
    desktopOnly: true,
  },
  {
    icon: thirdPlaceIcon,
    prize: "$3,000 USDC",
    eligibility: (
      <>
        <span>For most creative Tweet sharing referral code</span>
        <small>(must tag @mycelium_xyz to be eligible)</small>
      </>
    ),
    className: "third",
  },
  {
    prize: "$2,000 USDC Wildcard",
    eligibility: <span>For the referral code generating the most volume</span>,
    className: "wildcard",
  },
];
