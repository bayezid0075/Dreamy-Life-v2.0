import { WalletIcon } from "@heroicons/react/24/outline";
import { NAV_TYPE_ITEM } from "constants/app.constant";

// ----------------------------------------------------------------------

export const wallet = {
  id: "wallet",
  type: NAV_TYPE_ITEM,
  path: "/wallet",
  title: "Wallet",
  transKey: "nav.wallet.wallet",
  Icon: WalletIcon,
};

