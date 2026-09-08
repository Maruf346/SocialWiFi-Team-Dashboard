import React from 'react'

const DataProtection = () => {
  return (
    <div className="min-h-full px-2 py-2 text-[#666] md:px-8 md:py-4">
      <h1 className="mb-6 text-[18px] font-normal text-[#666] md:text-[22px]">Data protection</h1>

      <p className="mb-4 text-[13px] text-[#666]">
        After submitting this form, we will contact you to verify your request. <span className="font-semibold">NOTE:</span> Some actions cannot be reversed.
      </p>

      <div className="max-w-[740px] rounded border border-[#d9d9d9] bg-[#f0f0f0] p-4 md:p-6">
        <h2 className="mb-5 text-[17px] font-semibold text-[#555]">Data Request Form</h2>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <label className="block text-[12px] font-semibold text-[#555]">
            <span className="mb-1 block">First / last name*</span>
            <input
              type="text"
              className="h-8 w-full rounded border border-[#cfcfcf] bg-white px-2 text-[12px] text-[#666] outline-none focus:border-[#1d2464]"
            />
          </label>

          <label className="block text-[12px] font-semibold text-[#555]">
            <span className="mb-1 block">Account email*</span>
            <input
              type="email"
              className="h-8 w-full rounded border border-[#cfcfcf] bg-white px-2 text-[12px] text-[#666] outline-none focus:border-[#1d2464]"
            />
          </label>

          <label className="block text-[12px] font-semibold text-[#555]">
            <span className="mb-1 block">Plan type*</span>
            <select className="h-8 w-full rounded border border-[#cfcfcf] bg-white px-2 text-[12px] text-[#666] outline-none focus:border-[#1d2464]">
              <option value="">---Select One---</option>
              <option value="team">Team</option>
              <option value="fleet">Fleet</option>
            </select>
          </label>

          <label className="block text-[12px] font-semibold text-[#555]">
            <span className="mb-1 block">Phone number*</span>
            <input
              type="tel"
              className="h-8 w-full rounded border border-[#cfcfcf] bg-white px-2 text-[12px] text-[#666] outline-none focus:border-[#1d2464]"
            />
          </label>

          <label className="block text-[12px] font-semibold text-[#555] md:col-span-2">
            <span className="mb-1 block">Request type*</span>
            <select className="h-8 w-full md:w-1/2 rounded border border-[#cfcfcf] bg-white px-2 text-[12px] text-[#666] outline-none focus:border-[#1d2464]">
              <option value="">---Select One---</option>
              <option value="export">Export User Data</option>
              <option value="delete">Delete User Data</option>
              <option value="anonymize">Anonymize User Data</option>
              <option value="delete_anonymize">Delete and Anonymize Retained Data</option>
            </select>
          </label>
        </div>

        <div className="mt-6 space-y-5 text-[13px] leading-7 text-[#666]">
          <p className="font-semibold text-[#555]">Definitions - please read carefully</p>

          <div className="space-y-4">
            <div>
              <p className="mb-1 font-semibold text-[#555]">Export User Data</p>
              <p>
                You are requesting a copy of the personal information RightRoute maintains about your account. Once approved,
                RightRoute will create a ZIP package containing the available data in PDF, CSV, and JSON formats. The export will be
                provided securely to the verified email address associated with the account.
              </p>
            </div>

            <div>
              <p className="mb-1 font-semibold text-[#555]">Delete User Data</p>
              <p>
                You are requesting deletion of personal information associated with your RightRoute account where deletion is permitted.
                The account will be deactivated and the profile removed from the platform. Certain limited records may be retained where
                required by law, necessary for fraud prevention, accounting, security, dispute handling, or another approved retention
                purpose.
              </p>
            </div>

            <div>
              <p className="mb-1 font-semibold text-[#555]">Anonymize User Data</p>
              <p>
                You are requesting that RightRoute permanently remove or transform identifying information connected with your records.
                Information that can no longer reasonably be associated with you may remain for aggregate analytics, operational reporting,
                and system improvement.
              </p>
            </div>

            <div>
              <p className="mb-1 font-semibold text-[#555]">Delete and Anonymize Retained Data</p>
              <p>
                You are requesting that RightRoute delete personal information that is no longer required and permanently remove identifying
                information from records retained for approved analytics, legal, security, accounting, or operational purposes.
              </p>
            </div>
          </div>
        </div>

        <div className="mt-6 border-t border-[#d9d9d9] pt-4">
          <button
            type="button"
            className="w-full rounded bg-[#ff823d] px-4 py-2 text-[12px] font-semibold uppercase tracking-wide text-white shadow-sm  cursor-pointer"
          >
            Submit
          </button>
        </div>
      </div>
    </div>
  )
}

export default DataProtection
