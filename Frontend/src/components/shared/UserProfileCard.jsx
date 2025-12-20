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
    <div
      className={clsx(
        "mx-4 mb-4 overflow-hidden rounded-2xl shadow-xl",
        className,
      )}
      {...props}
    >
      {/* Modern Gradient Card - All in One */}
      <div className="relative overflow-hidden bg-gradient-to-br from-purple-600 via-indigo-600 to-pink-600 p-6 pb-8">
        {/* Animated Background Pattern */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.1)_1px,transparent_1px)] bg-[length:20px_20px]"></div>
        </div>

        {/* Glowing Orbs */}
        <div className="absolute -top-10 -right-10 size-32 rounded-full bg-white/10 blur-3xl"></div>
        <div className="absolute -bottom-10 -left-10 size-32 rounded-full bg-pink-500/20 blur-3xl"></div>

        {/* User Info */}
        <div className="relative z-10 flex flex-col items-center text-center">
          <div className="relative mb-4">
            <div className="absolute inset-0 animate-pulse rounded-full bg-white/20 blur-xl"></div>
            <Avatar
              src={avatarSrc}
              name={username}
              size={20}
              className="relative shadow-2xl ring-4 ring-white/30"
            />
            {showStatus && (
              <AvatarDot
                color={statusColor}
                className="absolute -right-1 -bottom-1 size-5 border-3 border-white shadow-lg dark:border-purple-900"
              />
            )}
          </div>
          <h3 className="mb-2 text-xl font-bold text-white drop-shadow-lg">
            {username}
          </h3>
          <div className="mb-6 flex items-center gap-2 rounded-full bg-white/20 px-4 py-1.5 backdrop-blur-sm">
            <PhoneIcon className="size-4 shrink-0 text-white" />
            <span className="text-sm font-medium text-white">
              {phoneNumber}
            </span>
          </div>

          {/* Referral Code Section - Integrated */}
          <div className="w-full">
            <div className="mb-3">
              <label className="text-xs font-semibold tracking-wider text-white/80 uppercase">
                Referral Code
              </label>
            </div>
            <CopyButton value={referralCode} timeout={2000}>
              {({ copy, copied }) => (
                <div className="group relative overflow-hidden rounded-xl border-2 border-white/30 bg-white/10 p-1 backdrop-blur-md transition-all hover:border-white/50 hover:bg-white/20">
                  <div className="flex items-center gap-2 rounded-lg bg-white/10 px-4 py-3 backdrop-blur-sm">
                    <code className="flex-1 font-mono text-base font-bold text-white drop-shadow-md">
                      {referralCode}
                    </code>
                    <Button
                      onClick={copy}
                      isIcon
                      variant="flat"
                      className={clsx(
                        "size-9 shrink-0 rounded-lg shadow-lg transition-all",
                        copied
                          ? "bg-gradient-to-br from-green-400 to-green-600 text-white shadow-green-200"
                          : "bg-white/20 text-white backdrop-blur-sm hover:bg-white/30",
                      )}
                      aria-label={copied ? "Copied!" : "Copy referral code"}
                    >
                      {copied ? (
                        <CheckIcon className="size-5" />
                      ) : (
                        <DocumentDuplicateIcon className="size-5" />
                      )}
                    </Button>
                  </div>
                </div>
              )}
            </CopyButton>
            {referralCode && (
              <p className="mt-3 text-center text-xs font-medium text-white/70">
                Share this code with friends to earn rewards
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
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
