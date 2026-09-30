import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '../../../context/useAuth'
import { teamSecurityApi } from '../../../services/teamSecurityApi'

const fallbackRequestTypes = [
  {
    key: 'EXPORT',
    label: 'Export User Data',
    description:
      'You are requesting a copy of the personal information RightRoute maintains about your account. Once approved, RightRoute will create a ZIP package containing the available data in PDF, CSV, and JSON formats. The export will be provided securely to the verified email address associated with the account.',
  },
  {
    key: 'DELETE',
    label: 'Delete User Data',
    description:
      'You are requesting deletion of personal information associated with your RightRoute account where deletion is permitted. The account will be deactivated and the profile removed from the platform. Certain limited records may be retained where required by law, necessary for fraud prevention, accounting, security, dispute handling, or another approved retention purpose.',
  },
  {
    key: 'ANONYMIZE',
    label: 'Anonymize User Data',
    description:
      'You are requesting that RightRoute permanently remove or transform identifying information connected with your records. Information that can no longer reasonably be associated with you may remain for aggregate analytics, operational reporting, and system improvement.',
  },
  {
    key: 'DELETE_ANONYMIZE',
    label: 'Delete and Anonymize Retained Data',
    description:
      'You are requesting that RightRoute delete personal information that is no longer required and permanently remove identifying information from records retained for approved analytics, legal, security, accounting, or operational purposes.',
  },
]

const fallbackPlanChoices = ['Team', 'Fleet']

const initialForm = {
  name: '',
  account_email: '',
  plan_type: 'Team',
  phone_number: '',
  request_type: '',
}

const DataProtection = () => {
  const { accessToken } = useAuth()

  const [form, setForm] = useState(initialForm)
  const [planChoices, setPlanChoices] = useState(fallbackPlanChoices)
  const [requestTypes, setRequestTypes] = useState(fallbackRequestTypes)
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')

  const selectedRequestType = useMemo(
    () => requestTypes.find((type) => type.key === form.request_type),
    [form.request_type, requestTypes],
  )


  useEffect(() => {
    if (!accessToken) return undefined

    const controller = new AbortController()

    const loadFormData = async () => {
      await Promise.resolve()
      setIsLoading(true)
      setError('')

      try {
        const [prefill, options] = await Promise.all([
          teamSecurityApi.getDataProtectionPrefill(accessToken, { signal: controller.signal }),
          teamSecurityApi.getDataProtectionOptions(accessToken, { signal: controller.signal }),
        ])

        const nextPlanChoices = Array.isArray(options?.plan_choices) && options.plan_choices.length
          ? options.plan_choices
          : fallbackPlanChoices
        const nextRequestTypes = Array.isArray(options?.request_types) && options.request_types.length
          ? options.request_types
          : fallbackRequestTypes

        setPlanChoices(nextPlanChoices)
        setRequestTypes(nextRequestTypes)
        setForm((current) => ({
          ...current,
          name: prefill?.name || current.name,
          account_email: prefill?.account_email || current.account_email,
          phone_number: prefill?.phone_number || current.phone_number,
          plan_type: prefill?.plan_type || nextPlanChoices[0] || current.plan_type,
        }))
      } catch (loadError) {
        if (loadError.name !== 'AbortError') {
          setError(loadError.message || 'Unable to load data protection form.')
        }
      } finally {
        setIsLoading(false)
      }
    }

    void loadFormData()
    return () => controller.abort()
  }, [accessToken])


  const updateField = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')
    setSuccessMessage('')

    if (!form.name.trim() || !form.account_email.trim() || !form.request_type) {
      setError('Name, account email, and request type are required.')
      return
    }

    setIsSubmitting(true)

    try {
      const response = await teamSecurityApi.submitDataProtectionRequest(accessToken, {
        name: form.name.trim(),
        account_email: form.account_email.trim(),
        plan_type: form.plan_type,
        phone_number: form.phone_number.trim(),
        request_type: form.request_type,
      })

      setSuccessMessage(
        response?.request_id
          ? `Data protection request ${response.request_id} submitted.`
          : response?.message || 'Data protection request submitted.',
      )
      updateField('request_type', '')
    } catch (submitError) {
      setError(submitError.message || 'Unable to submit data protection request.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-full px-2 py-2 text-[#888] md:px-10 md:py-4">
      <h1 className="mb-8 text-xl font-normal text-[#999] md:text-2xl">Data protection</h1>

      <p className="mb-4 text-[13px] text-[#666]">
        After submitting this form, we will contact you to verify your request. <span className="font-semibold">NOTE:</span> Some actions cannot be reversed.
      </p>

      {error && (
        <div className="mb-4 max-w-[980px] rounded border border-red-200 bg-red-50 px-3 py-2 text-[13px] text-red-700">
          {error}
        </div>
      )}

      {successMessage && (
        <div className="mb-4 max-w-[980px] rounded border border-green-200 bg-green-50 px-3 py-2 text-[13px] text-green-700">
          {successMessage}
        </div>
      )}

      <div className="max-w-[740px]">
        <form onSubmit={handleSubmit} className="rounded border border-[#d9d9d9] bg-[#f0f0f0] p-4 md:p-6">
          <h2 className="mb-5 text-[17px] font-semibold text-[#555]">Data Request Form</h2>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <label className="block text-[12px] font-semibold text-[#555]">
              <span className="mb-1 block">First / last name*</span>
              <input
                type="text"
                value={form.name}
                onChange={(event) => updateField('name', event.target.value)}
                disabled={isLoading}
                className="h-8 w-full rounded border border-[#cfcfcf] bg-white px-2 text-[12px] text-[#666] outline-none focus:border-[#1d2464] disabled:bg-[#f7f7f7]"
              />
            </label>

            <label className="block text-[12px] font-semibold text-[#555]">
              <span className="mb-1 block">Account email*</span>
              <input
                type="email"
                value={form.account_email}
                onChange={(event) => updateField('account_email', event.target.value)}
                disabled={isLoading}
                className="h-8 w-full rounded border border-[#cfcfcf] bg-white px-2 text-[12px] text-[#666] outline-none focus:border-[#1d2464] disabled:bg-[#f7f7f7]"
              />
            </label>

            <label className="block text-[12px] font-semibold text-[#555]">
              <span className="mb-1 block">Plan type*</span>
              <select
                value={form.plan_type}
                onChange={(event) => updateField('plan_type', event.target.value)}
                disabled={isLoading}
                className="h-8 w-full rounded border border-[#cfcfcf] bg-white px-2 text-[12px] text-[#666] outline-none focus:border-[#1d2464] disabled:bg-[#f7f7f7]"
              >
                <option value="">---Select One---</option>
                {planChoices.map((choice) => (
                  <option key={choice} value={choice}>{choice}</option>
                ))}
              </select>
            </label>

            <label className="block text-[12px] font-semibold text-[#555]">
              <span className="mb-1 block">Phone number*</span>
              <input
                type="tel"
                value={form.phone_number}
                onChange={(event) => updateField('phone_number', event.target.value)}
                disabled={isLoading}
                className="h-8 w-full rounded border border-[#cfcfcf] bg-white px-2 text-[12px] text-[#666] outline-none focus:border-[#1d2464] disabled:bg-[#f7f7f7]"
              />
            </label>

            <label className="block text-[12px] font-semibold text-[#555] md:col-span-2">
              <span className="mb-1 block">Request type*</span>
              <select
                value={form.request_type}
                onChange={(event) => updateField('request_type', event.target.value)}
                disabled={isLoading}
                className="h-8 w-full rounded border border-[#cfcfcf] bg-white px-2 text-[12px] text-[#666] outline-none focus:border-[#1d2464] disabled:bg-[#f7f7f7] md:w-1/2"
              >
                <option value="">---Select One---</option>
                {requestTypes.map((type) => (
                  <option key={type.key} value={type.key}>{type.label}</option>
                ))}
              </select>
            </label>
          </div>

          {selectedRequestType && (
            <div className="mt-5 rounded border border-[#d9d9d9] bg-white px-3 py-2 text-[13px] leading-6 text-[#666]">
              <p className="font-semibold text-[#555]">{selectedRequestType.label}</p>
              <p>{selectedRequestType.description}</p>
            </div>
          )}

          <div className="mt-6 space-y-5 text-[13px] leading-7 text-[#666]">
            <p className="font-semibold text-[#555]">Definitions - please read carefully</p>

            <div className="space-y-4">
              {requestTypes.map((type) => (
                <div key={type.key}>
                  <p className="mb-1 font-semibold text-[#555]">{type.label}</p>
                  <p>{type.description}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-6 border-t border-[#d9d9d9] pt-4">
            <button
              type="submit"
              disabled={isSubmitting || isLoading}
              className="w-full rounded bg-[#ff823d] px-4 py-2 text-[12px] font-semibold uppercase tracking-wide text-white shadow-sm cursor-pointer disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? 'Submitting...' : 'Submit'}
            </button>
          </div>
        </form>

        {/* Request history panel temporarily hidden.
            The API is already available via teamSecurityApi.listDataProtectionRequests()
            if we need to restore this later. */}
      </div>
    </div>
  )
}

export default DataProtection