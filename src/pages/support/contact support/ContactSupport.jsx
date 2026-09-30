import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '../../../context/useAuth'
import { teamSupportApi } from '../../../services/teamSupportApi'

const emailLabels = {
  technical_issues: 'Technical issues',
  subscription_help: 'Subscription or team plan help',
  fleet_sales: 'Fleet plan sales',
  legal: 'Legal',
}

const ContactSupport = () => {
  const { accessToken } = useAuth()
  const [contactInfo, setContactInfo] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  const loadContactInfo = useCallback(async (signal) => {
    if (!accessToken) return

    setIsLoading(true)
    setError('')

    try {
      const data = await teamSupportApi.getContactInfo(accessToken, { signal })
      setContactInfo(data)
    } catch (err) {
      if (err.name !== 'AbortError') {
        setError(err.message || 'Unable to load contact information.')
      }
    } finally {
      setIsLoading(false)
    }
  }, [accessToken])

  useEffect(() => {
    const controller = new AbortController()
    const timeoutId = window.setTimeout(() => {
      loadContactInfo(controller.signal)
    }, 0)

    return () => {
      window.clearTimeout(timeoutId)
      controller.abort()
    }
  }, [loadContactInfo])

  const emailEntries = Object.entries(contactInfo?.emails || {})

  return (
    <div className="min-h-full px-2 py-2 text-[#888] md:px-10 md:py-4">
      <h1 className="mb-8 text-xl font-normal text-[#999] md:text-2xl">
        Contact us
      </h1>

      <div className="max-w-[520px] rounded border border-[#d9d9d9] bg-[#f0f0f0] p-5 md:p-7">
        {isLoading ? (
          <p className="text-[14px] text-[#666]">Loading contact information...</p>
        ) : error ? (
          <div className="rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </div>
        ) : (
          <div className="space-y-2 text-[14px] leading-7 text-[#666]">
            <p className="text-base">
              <span className="font-semibold text-[#555]">Phone:</span>{' '}
              {contactInfo?.phone || 'Not available'}
            </p>

            <div>
              <p className="font-semibold text-[#555]">Emails:</p>
              {emailEntries.map(([key, email]) => (
                <p key={key}>
                  <span className="font-semibold text-[#555]">
                    {emailLabels[key] || key}:
                  </span>{' '}
                  <a href={`mailto:${email}`} className="underline">
                    {email}
                  </a>
                </p>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default ContactSupport