import { useEffect, useState } from 'react'
import { useAuth } from '../../../context/useAuth'
import { teamSecurityApi } from '../../../services/teamSecurityApi'

const fallbackInfo = {
  team_plan: {
    title: 'Team Plan Subscribers',
    instructions: [
      "IMPORTANT: If you delete this account in this app's Account Manager before canceling your subscription in the app store, your subscription billing will still continue and you will lose app login access and all of your data including Route History.",
      'You need to first cancel your subscription in the app store.',
      'When you have canceled your subscription, the routing features of this app will be inactive but you will still have access to your Route History and Settings until you delete this account. You will no longer be billed.',
      "IMPORTANT: If you purchased a single user yearly plan, your subscription will be terminated at the end of its billing cycle. We don't offer refunds for unused months.",
      'Please be sure to cancel your paid subscription at the app store you purchased it from.',
    ],
  },
  fleet_plan: {
    title: 'Fleet Plan Customers',
    instructions: [
      'Please contact us to close your account. Fill out the form on the Data Protection page to request the deletion of the data associated with this account.',
    ],
    contact_email: 'sales@getrouteapp.com',
  },
}

const InfoSection = ({ section }) => {
  if (!section) return null

  return (
    <div className="rounded border border-[#d9d9d9] bg-[#f0f0f0] p-5 md:p-8">
      <h2 className="mb-4 text-[15px] font-semibold text-[#555]">{section.title}</h2>

      <div className="space-y-4 text-[13px] leading-7 text-[#666]">
        {section.instructions?.map((instruction) => (
          <p key={instruction}>
            {instruction.startsWith('IMPORTANT:') ? (
              <>
                <span className="font-semibold">IMPORTANT:</span>
                {instruction.replace('IMPORTANT:', '')}
              </>
            ) : (
              instruction
            )}
          </p>
        ))}

        {section.contact_email && (
          <p>
            Contact:{' '}
            <a
              href={`mailto:${section.contact_email}`}
              className="text-[#2c3a8d] underline hover:text-[#ff823d]"
            >
              {section.contact_email}
            </a>
          </p>
        )}
      </div>
    </div>
  )
}

const DeleteAccount = () => {
  const { accessToken } = useAuth()
  const [info, setInfo] = useState(fallbackInfo)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!accessToken) return undefined

    const controller = new AbortController()

    const loadInfo = async () => {
      await Promise.resolve()
      setIsLoading(true)
      setError('')

      try {
        const response = await teamSecurityApi.getDeleteAccountInfo(accessToken, {
          signal: controller.signal,
        })
        setInfo({
          team_plan: response?.team_plan || fallbackInfo.team_plan,
          fleet_plan: response?.fleet_plan || fallbackInfo.fleet_plan,
        })
      } catch (loadError) {
        if (loadError.name !== 'AbortError') {
          setInfo(fallbackInfo)
          setError(loadError.message || 'Unable to load delete account information.')
        }
      } finally {
        setIsLoading(false)
      }
    }

    void loadInfo()
    return () => controller.abort()
  }, [accessToken])

  return (
    <div className="min-h-full px-2 py-2 text-[#888] md:px-10 md:py-4">
      <h1 className="mb-8 text-xl font-normal text-[#999] md:text-2xl">Delete account</h1>

      {error && (
        <div className="mb-4 max-w-[740px] rounded border border-red-200 bg-red-50 px-3 py-2 text-[13px] text-red-700">
          {error}
        </div>
      )}

      <div className="max-w-[740px] space-y-6">
        {isLoading ? (
          <div className="rounded border border-[#d9d9d9] bg-[#f0f0f0] p-5 text-[13px] text-[#666] md:p-8">
            Loading account deletion information...
          </div>
        ) : (
          <>
            <InfoSection section={info.team_plan} />
            <InfoSection section={info.fleet_plan} />
          </>
        )}
      </div>
    </div>
  )
}

export default DeleteAccount