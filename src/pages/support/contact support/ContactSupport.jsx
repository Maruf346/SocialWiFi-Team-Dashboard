import React from "react";

const ContactSupport = () => {
  return (
    <div className="min-h-full px-2 py-2 text-[#888] md:px-10 md:py-4">
      <h1 className="mb-8 text-xl font-normal text-[#999] md:text-2xl">
        Contact us
      </h1>

      <div className="max-w-[520px] rounded border border-[#d9d9d9] bg-[#f0f0f0] p-5 md:p-7">
        <div className="space-y-2 text-[14px] leading-7 text-[#666]">
          <p className="text-base">
            <span className="font-semibold text-[#555]">Phone:</span>{" "}
            888-603-6317
          </p>

          <div>
            <p className="font-semibold text-[#555]">Emails:</p>
            <p>
              <span className="font-semibold text-[#555]">
                Technical issues:
              </span>{" "}
              <a
                href="mailto:help@getrouteoute.app"
                className=" underline"
              >
                help@getrouteoute.app
              </a>
            </p>
            <p>
              <span className="font-semibold text-[#555]">
                Subscription or team plan help:
              </span>{" "}
              <a
                href="mailto:service@getrouteoute.app"
                className=" underline"
              >
                service@getrouteoute.app
              </a>
            </p>
            <p>
              <span className="font-semibold text-[#555]">
                Fleet plan sales:
              </span>{" "}
              <a
                href="mailto:sales@getrouteoute.app"
                className=" underline"
              >
                sales@getrouteoute.app
              </a>
            </p>
            <p>
              <span className="font-semibold text-[#555]">Legal:</span>{" "}
              <a
                href="mailto:legal@getrouteoute.app"
                className=" underline"
              >
                legal@getrouteoute.app
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContactSupport;
