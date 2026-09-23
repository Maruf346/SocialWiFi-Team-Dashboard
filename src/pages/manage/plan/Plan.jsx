import React from "react";

const Plan = () => {
  return (
    <div className="min-h-full px-2 py-2 text-[#888] md:px-10 md:py-4">
      <h1 className="mb-8 text-xl font-normal text-[#999] md:text-2xl">
        Manage plan
      </h1>

      <div className="grid gap-6 xl:grid-cols-[1.1fr_1fr]">
        <div className="space-y-6">
          <div className="rounded-md border border-[#d4d4d4] bg-[#f2f2f2] p-5">
            <h2 className="mb-4 text-[18px] font-bold text-[#2e2e2e]">
              Current plan
            </h2>

            <div className="space-y-3 text-[15px] leading-7 text-[#4d4d4d]">
              <p>Fleet-438</p>
              <p>Payment frequency: Yearly</p>
              <p>Renewal date: 09/13/2026</p>
              <p>Total number of users allowed: 438</p>
              <p>Total enrolled users: 382</p>
            </div>
          </div>

          <div className="rounded-md border border-[#d4d4d4] bg-[#f2f2f2] p-5">
            <h2 className="mb-4 text-[18px] font-bold leading-[1.3] text-[#2e2e2e]">
              Change Fleet plan (customized pricing for businesses with more than
              100 drivers)
            </h2>

            <div className="space-y-4 text-[15px] leading-7 text-[#4f4f4f]">
              <p>
                Please contact us at {" "}
                <a
                  href="mailto:sales@getrightroute.app"
                  className="text-[#1d2464] underline underline-offset-2 "
                >
                  sales@getrightroute.app
                </a>{" "}
                or fill out the Fleet Pricing Request Form on our website: {" "}
                <a
                  href="https://getrightroute.app/pricing/"
                  target="_blank"
                  rel="noreferrer"
                  className="text-[#1d2464] underline underline-offset-2 "
                >
                  https://getrightroute.app/pricing/
                </a>
                . We will work up a new proposal based on your requested changes.
              </p>

              <p>
                <span className="font-extrabold uppercase text-[#2b2b2b]">
                  IMPORTANT NOTE:
                </span>{" "}
                If you are planning to downgrade to a plan with fewer than 100
                drivers, please follow the steps for subscribing to a monthly Team
                plan.
              </p>

              <p>
                Also, be sure to contact us about this change because Fleet plans are
                not handled through the app store like Team plans are. We will need
                to manually change your Fleet plan to expire at the end of it&apos;s
                billing cycle and you will need to remove drivers before your new
                plan starts to meet to lower driver allowance.
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-md border border-[#d4d4d4] bg-[#f2f2f2] p-5">
          <h2 className="mb-4 text-[18px] font-bold leading-[1.3] text-[#2e2e2e]">
            Change Team plan (app store subscriptions for businesses with 100 or
            less drivers)
          </h2>

          <div className="space-y-4 text-[15px] leading-7 text-[#4f4f4f]">
            <p>1. Open the RightRoute app on your device, top the ACCOUNT icon at the bottom of the screen and tap CHANGE PLAN.</p>
            <p>2. Choose from our monthly Team subscription plans. You will be connected to the app store to subscribe.</p>
            <p>Payments are handled by the app store and plan changes will occur at the next billing cycle.</p>

            <p>
              <span className="font-extrabold uppercase text-[#2b2b2b]">
                IMPORTANT NOTE:
              </span>{" "}
              If you choose a plan that has a lower number of users than you
              currently have enrolled, you will need to remove drivers from your
              User list in your Team Manager.
            </p>

            <p>
              Removing the overage of drivers needs to be completed prior to the
              next billing cycle. If not completed, your plan will remain at the
              current level and you will continue to be charged accordingly.
            </p>

            <p>
              Example: Changing from a 50 driver plan to 25 driver plan, where you
              currently have 50 drivers enrolled, you will need to remove 25
              drivers before your subscription renewal date. Failure to do so will
              result in your plan remaining the same, and you will be charged
              accordingly.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Plan;
