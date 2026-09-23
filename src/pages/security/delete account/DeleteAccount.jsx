import React from 'react'

const DeleteAccount = () => {
  return (
    <div className="min-h-full px-2 py-2 text-[#888] md:px-10 md:py-4">
      <h1 className="mb-8 text-xl font-normal text-[#999] md:text-2xl">Delete account</h1>

      <div className="max-w-[740px] space-y-6">
        <div className="rounded border border-[#d9d9d9] bg-[#f0f0f0] p-5 md:p-8">
          <h2 className="mb-4 text-[15px] font-semibold text-[#555]">Team Plan Subscribers</h2>

          <div className="space-y-4 text-[13px] leading-7 text-[#666]">
            <p>
              <span className="font-semibold">IMPORTANT:</span> If you delete this account in this app&apos;s Account Manager before
              canceling your subscription in the app store, your subscription billing will still continue and you will lose app login
              access and all of your data including Route History.
            </p>

            <p>
              You need to first cancel your subscription in the app store.
            </p>

            <p>
              When you have canceled your subscription, the routing features of this app will be inactive but you will still have
              access to your Route History and Settings until you delete this account. You will no longer be billed.
            </p>

            <p>
              <span className="font-semibold">IMPORTANT:</span> If you purchased a single user yearly plan, your subscription will be
              terminated at the end of its billing cycle. We don&apos;t offer refunds for unused months.
            </p>

            <p>Please be sure to cancel your paid subscription at the app store you purchased it from.</p>
          </div>
        </div>

        <div className="rounded border border-[#d9d9d9] bg-[#f0f0f0] p-5 md:p-8">
          <h2 className="mb-4 text-[15px] font-semibold text-[#555]">Fleet Plan Customers</h2>

          <p className="text-[13px] leading-7 text-[#666]">
            Please contact us at{' '}
            <a href="mailto:sales@getrouteapp.com" className="text-[#2c3a8d] underline hover:text-[#ff823d]">
              sales@getrouteapp.com
            </a>{' '}
            to close your account. Fill out the form on the Data Protection page to request the deletion of the data associated with
            this account.
          </p>
        </div>
      </div>
    </div>
  )
}

export default DeleteAccount
