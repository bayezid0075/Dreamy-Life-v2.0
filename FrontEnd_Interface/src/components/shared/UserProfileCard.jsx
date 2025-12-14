// Import Dependencies
import PropTypes from "prop-types";
import { PhoneIcon, DocumentDuplicateIcon } from "@heroicons/react/24/outline";
import { CheckIcon } from "@heroicons/react/20/solid";
import clsx from "clsx";

// Local Imports
import { Avatar, AvatarDot, Card, CopyButton, Button } from "components/ui";

// ----------------------------------------------------------------------

export function UserProfileCard({
  username = "Bayeid hOshen",
  phoneNumber = "+1 234 567 8900",
  avatarSrc,
  referralCode = "REF123456",
  showStatus = true,
  statusColor = "success",
  className,
  ...props
}) {
  return (
    <Card className={clsx("mx-4 mb-4 overflow-hidden", className)} {...props}>
      {/* Gradient Header Section */}
      <div className="relative overflow-hidden bg-gradient-to-br from-purple-600 via-purple-500 to-indigo-600 px-5 pt-6 pb-8">
        {/* Decorative Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIj48Y2lyY2xlIGN4PSIzMCIgY3k9IjMwIiByPSIxLjUiLz48L2c+PC9nPjwvc3ZnPg==')]"></div>
        </div>

        {/* User Info */}
        <div className="relative flex flex-col items-center text-center">
          <div className="relative mb-4">
            <Avatar
              src={avatarSrc}
              name={username}
              size={16}
              className="dark:ring-dark-900/20 ring-4 ring-white/20"
            />
            {showStatus && (
              <AvatarDot
                color={statusColor}
                className="dark:border-dark-900 absolute -right-0.5 -bottom-0.5 size-4 border-2 border-white"
              />
            )}
          </div>
          <h3 className="mb-1 text-lg font-semibold text-white">{username}</h3>
          <div className="flex items-center gap-1.5 text-sm text-white/80">
            <PhoneIcon className="size-4 shrink-0" />
            <span>{phoneNumber}</span>
          </div>
        </div>
      </div>

      {/* Referral Code Section */}
      <div className="px-5 py-4">
        <div className="mb-2">
          <label className="dark:text-dark-300 text-xs font-medium tracking-wider text-gray-500 uppercase">
            Referral Code
          </label>
        </div>
        <CopyButton value={referralCode} timeout={2000}>
          {({ copy, copied }) => (
            <div className="group dark:border-dark-600 dark:bg-dark-800 flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5 transition-all hover:border-purple-300 hover:bg-purple-50/50 dark:hover:border-purple-500/50 dark:hover:bg-purple-900/10">
              <code className="dark:text-dark-100 flex-1 font-mono text-sm font-semibold text-gray-800">
                {referralCode}
              </code>
              <Button
                onClick={copy}
                isIcon
                variant="flat"
                className={clsx(
                  "size-8 shrink-0 rounded-lg transition-all",
                  copied
                    ? "bg-green-100 text-green-600 dark:bg-green-900/20 dark:text-green-400"
                    : "dark:bg-dark-700 dark:text-dark-300 bg-white text-gray-600 hover:bg-purple-100 hover:text-purple-600 dark:hover:bg-purple-900/20 dark:hover:text-purple-400",
                )}
                aria-label={copied ? "Copied!" : "Copy referral code"}
              >
                {copied ? (
                  <CheckIcon className="size-4" />
                ) : (
                  <DocumentDuplicateIcon className="size-4" />
                )}
              </Button>
            </div>
          )}
        </CopyButton>
        {referralCode && (
          <p className="dark:text-dark-400 mt-2 text-xs text-gray-500">
            Share this code with friends to earn rewards
          </p>
        )}
      </div>
    </Card>
  );
}

UserProfileCard.propTypes = {
  username: PropTypes.string,
  phoneNumber: PropTypes.string,
  avatarSrc: PropTypes.string,
  referralCode: PropTypes.string,
  showStatus: PropTypes.bool,
  statusColor: PropTypes.oneOf([
    "primary",
    "secondary",
    "success",
    "warning",
    "error",
    "info",
  ]),
  className: PropTypes.string,
};
