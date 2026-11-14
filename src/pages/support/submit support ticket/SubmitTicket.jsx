import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Upload, X } from 'lucide-react'
import { useAuth } from '../../../context/useAuth'
import { teamSupportApi } from '../../../services/teamSupportApi'

const initialFormData = {
  name: '',
  account_email: '',
  phone: '',
  company: '',
  plan_type: 'Team',
  preferred_contact_method: 'Email',
  platform: 'Web Dashboard',
  other_device: '',
  subject: '',
  description: '',
  safety_critical: false,
}

const platformOptions = ['iPhone', 'iPod', 'Android Phone', 'Android Tablet', 'Web Dashboard', 'Other']
const MAX_UPLOADS = 3
const ALLOWED_FILE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.pdf', '.doc', '.docx']

const isAllowedFile = (file) => {
  if (file.type.startsWith('image/')) return true
  const filename = file.name.toLowerCase()
  return ALLOWED_FILE_EXTENSIONS.some((extension) => filename.endsWith(extension))
}

const SubmitTicket = () => {
  const { accessToken } = useAuth()
  const fileInputRef = useRef(null)
  const [topics, setTopics] = useState([])
  const [selectedTopic, setSelectedTopic] = useState('')
  const [selectedSubtopic, setSelectedSubtopic] = useState('')
  const [uploadedFiles, setUploadedFiles] = useState([])
  const [formData, setFormData] = useState(initialFormData)
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [isDraggingFiles, setIsDraggingFiles] = useState(false)

  const selectedTopicData = useMemo(() => {
    return topics.find((topic) => topic.key === selectedTopic || topic.label === selectedTopic) || null
  }, [selectedTopic, topics])

  const subtopics = selectedTopicData?.subtopics || []

  const loadTicketData = useCallback(async (signal) => {
    if (!accessToken) return

    setIsLoading(true)
    setError('')

    try {
      const [prefill, topicsResponse] = await Promise.all([
        teamSupportApi.getTicketPrefill(accessToken, { signal }),
        teamSupportApi.getTopics(accessToken, { signal }),
      ])

      setFormData((prev) => ({
        ...prev,
        name: prefill.name || '',
        account_email: prefill.account_email || '',
        phone: prefill.phone || '',
        company: prefill.company || '',
        plan_type: prefill.plan_type || 'Team',
      }))
      setTopics(Array.isArray(topicsResponse.topics) ? topicsResponse.topics : [])
    } catch (err) {
      if (err.name !== 'AbortError') {
        setError(err.message || 'Unable to load support ticket form.')
      }
    } finally {
      setIsLoading(false)
    }
  }, [accessToken])

  useEffect(() => {
    const controller = new AbortController()
    const timeoutId = window.setTimeout(() => {
      loadTicketData(controller.signal)
    }, 0)

    return () => {
      window.clearTimeout(timeoutId)
      controller.abort()
    }
  }, [loadTicketData])

  const handleTopicChange = (value) => {
    setSelectedTopic(value)
    setSelectedSubtopic('')
  }

  const handleFieldChange = (event) => {
    const { name, value } = event.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handlePlatformChange = (platform) => {
    setFormData((prev) => ({ ...prev, platform }))
  }

  const addFiles = (incomingFiles) => {
    const files = Array.from(incomingFiles || [])
    const unsupportedFile = files.find((file) => !isAllowedFile(file))
    if (unsupportedFile) {
      setError(`${unsupportedFile.name} is not a supported image, PDF, DOC, or DOCX file.`)
      return
    }

    setUploadedFiles((currentFiles) => {
      const combinedFiles = [...currentFiles]
      files.forEach((file) => {
        const isDuplicate = combinedFiles.some((existingFile) =>
          existingFile.name === file.name &&
          existingFile.size === file.size &&
          existingFile.lastModified === file.lastModified
        )
        if (!isDuplicate) combinedFiles.push(file)
      })

      if (combinedFiles.length > MAX_UPLOADS) {
        setError(`You can upload up to ${MAX_UPLOADS} files only.`)
        return currentFiles
      }

      setError('')
      return combinedFiles
    })
  }

  const handleFileChange = (event) => {
    addFiles(event.target.files)
    event.target.value = ''
  }

  const handleDrop = (event) => {
    event.preventDefault()
    event.stopPropagation()
    setIsDraggingFiles(false)
    addFiles(event.dataTransfer.files)
  }

  const handleDragOver = (event) => {
    event.preventDefault()
    event.stopPropagation()
    event.dataTransfer.dropEffect = 'copy'
    setIsDraggingFiles(true)
  }

  const handleDragLeave = (event) => {
    event.preventDefault()
    event.stopPropagation()
    if (!event.currentTarget.contains(event.relatedTarget)) setIsDraggingFiles(false)
  }

  const removeFile = (fileToRemove) => {
    setUploadedFiles((files) => files.filter((file) => file !== fileToRemove))
    setError('')
  }

  const resetForm = () => {
    setFormData((prev) => ({
      ...initialFormData,
      name: prev.name,
      account_email: prev.account_email,
      phone: prev.phone,
      company: prev.company,
      plan_type: prev.plan_type,
    }))
    setSelectedTopic('')
    setSelectedSubtopic('')
    setUploadedFiles([])
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const validateForm = () => {
    if (!formData.name.trim()) return 'First/last name is required.'
    if (!formData.account_email.trim()) return 'Account email is required.'
    if (!selectedTopic) return 'Please select a topic.'
    if (!formData.subject.trim()) return 'Subject is required.'
    if (!formData.description.trim()) return 'Detailed description is required.'
    return ''
  }

  const handleSubmit = async () => {
    const validationError = validateForm()
    if (validationError) {
      setError(validationError)
      return
    }

    setIsSubmitting(true)
    setError('')
    setSuccessMessage('')

    try {
      const topic = topics.find((item) => item.key === selectedTopic || item.label === selectedTopic)
      const response = await teamSupportApi.submitTicket(accessToken, {
        ...formData,
        platform: formData.platform === 'Other' ? 'Other' : formData.platform,
        other_device: formData.platform === 'Other' ? formData.other_device : '',
        main_category: topic?.key || selectedTopic,
        subcategory: selectedSubtopic,
        safety_critical: formData.safety_critical,
        uploaded_files: uploadedFiles,
      })

      setSuccessMessage(
        response.ticket_number
          ? `Support ticket ${response.ticket_number} submitted successfully.`
          : 'Support ticket submitted successfully.',
      )
      resetForm()
    } catch (err) {
      setError(err.message || 'Unable to submit support ticket.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-full px-2 py-2 text-[#888] md:px-10 md:py-4">
      <h1 className="mb-8 text-xl font-normal text-[#999] md:text-2xl">
        Support ticket
      </h1>

      <p className="mb-4 text-[14px] text-[#666]">
        If you&apos;re having trouble with the RightRoute app or account, please
        fill out our support form below. We will get back to you as soon as we
        can.
      </p>

      {error && (
        <div className="mb-4 rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      {successMessage && (
        <div className="mb-4 rounded border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
          {successMessage}
        </div>
      )}

      {isLoading ? (
        <p className="text-sm text-[#666]">Loading support ticket form...</p>
      ) : (
        <div className="w-full">
          <div className="space-y-3">
            <div className="grid grid-cols-[180px_1fr] items-center gap-4 border-b border-[#d9d9d9] pb-3">
              <label className="text-[14px] font-semibold text-[#555]">
                First/Last name <span className="text-[#d92d20]">*</span>:
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleFieldChange}
                placeholder="Enter your first and last name"
                className="h-8 w-full max-w-[400px] rounded border border-[#cfcfcf] bg-white px-2 text-[12px] text-[#666] outline-none focus:border-[#1d2464]"
              />
            </div>

            <div className="grid grid-cols-[180px_1fr] items-center gap-4 border-b border-[#d9d9d9] pb-3">
              <label className="text-[14px] font-semibold text-[#555]">
                Account email <span className="text-[#d92d20]">*</span>:
              </label>
              <input
                type="email"
                name="account_email"
                value={formData.account_email}
                onChange={handleFieldChange}
                className="h-8 w-full max-w-[400px] rounded border border-[#cfcfcf] bg-white px-2 text-[12px] text-[#666] outline-none focus:border-[#1d2464]"
                placeholder="Enter your account email"
              />
            </div>

            <div className="grid grid-cols-[180px_1fr] items-center gap-4 border-b border-[#d9d9d9] pb-3">
              <label className="text-[14px] font-semibold text-[#555]">Phone:</label>
              <input
                className="h-8 w-full max-w-[400px] rounded border border-[#cfcfcf] bg-white px-2 text-[12px] text-[#666] outline-none focus:border-[#1d2464]"
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleFieldChange}
                placeholder="Enter your phone number"
              />
            </div>

            <div className="grid grid-cols-[180px_1fr] items-center gap-4 border-b border-[#d9d9d9] pb-3">
              <label className="text-[14px] font-semibold text-[#555]">Company (if applicable):</label>
              <input
                className="h-8 w-full max-w-[400px] rounded border border-[#cfcfcf] bg-white px-2 text-[12px] text-[#666] outline-none focus:border-[#1d2464]"
                type="text"
                name="company"
                value={formData.company}
                onChange={handleFieldChange}
                placeholder="Enter your company name"
              />
            </div>

            <div className="grid grid-cols-[180px_1fr] items-center gap-4 border-b border-[#d9d9d9] pb-3">
              <label className="text-[14px] font-semibold text-[#555]">
                Plan type <span className="text-[#d92d20]">*</span>:
              </label>
              <div className="flex flex-wrap gap-4 text-[12px] text-[#555]">
                {['Team', 'Fleet', 'Trial user', 'Individual'].map((planType) => (
                  <label key={planType} className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="plan_type"
                      checked={formData.plan_type === planType}
                      onChange={() => setFormData((prev) => ({ ...prev, plan_type: planType }))}
                    />
                    {planType}
                  </label>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-[180px_1fr] items-center gap-4 border-b border-[#d9d9d9] pb-3">
              <label className="text-[14px] font-semibold text-[#555]">
                Preferred contact method <span className="text-[#d92d20]">*</span>:
              </label>
              <div className="flex flex-wrap gap-4 text-[12px] text-[#555]">
                {['Phone', 'Email'].map((method) => (
                  <label key={method} className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="preferred_contact_method"
                      checked={formData.preferred_contact_method === method}
                      onChange={() => setFormData((prev) => ({ ...prev, preferred_contact_method: method }))}
                    />
                    {method}
                  </label>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-[180px_1fr] items-center gap-4 border-b border-[#d9d9d9] pb-3">
              <label className="text-[14px] font-semibold text-[#555]">
                Platform <span className="text-[#d92d20]">*</span>:
              </label>
              <div className="flex flex-wrap items-center gap-4 text-[12px] text-[#555]">
                {platformOptions.map((platform) => (
                  <label key={platform} className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="platform"
                      checked={formData.platform === platform}
                      onChange={() => handlePlatformChange(platform)}
                    />
                    {platform}
                  </label>
                ))}

                {formData.platform === 'Other' && (
                  <input
                    name="other_device"
                    value={formData.other_device}
                    onChange={handleFieldChange}
                    className="h-8 w-[220px] rounded border border-[#cfcfcf] bg-white px-2 text-[12px] text-[#666] outline-none focus:border-[#1d2464]"
                    placeholder="Enter device"
                  />
                )}
              </div>
            </div>

            <div className="grid grid-cols-[180px_1fr] items-center gap-4 border-b border-[#d9d9d9] pb-3">
              <label className="text-[14px] font-semibold text-[#555]">
                Select a topic <span className="text-[#d92d20]">*</span>:
              </label>
              <select
                value={selectedTopic}
                onChange={(event) => handleTopicChange(event.target.value)}
                className="h-8 w-full max-w-[400px] rounded border border-[#cfcfcf] bg-white px-2 text-[12px] text-[#666] outline-none focus:border-[#1d2464]"
              >
                <option value="">---Select One---</option>
                {topics.map((topic) => (
                  <option key={topic.key} value={topic.key}>
                    {topic.label}
                  </option>
                ))}
              </select>
            </div>

            {selectedTopic && (
              <div className="grid grid-cols-[180px_1fr] items-center gap-4 border-b border-[#d9d9d9] pb-3">
                <label className="text-[14px] font-semibold text-[#555]">Select a subtopic:</label>
                <select
                  value={selectedSubtopic}
                  onChange={(event) => setSelectedSubtopic(event.target.value)}
                  className="h-8 w-full max-w-[400px] rounded border border-[#cfcfcf] bg-white px-2 text-[12px] text-[#666] outline-none focus:border-[#1d2464]"
                >
                  <option value="">---Select One---</option>
                  {subtopics.map((subtopic) => (
                    <option key={subtopic} value={subtopic}>
                      {subtopic}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="grid grid-cols-[180px_1fr] items-center gap-4 border-b border-[#d9d9d9] pb-3">
              <label className="text-[14px] font-semibold text-[#555]">
                Subject <span className="text-[#d92d20]">*</span>:
              </label>
              <input
                type="text"
                name="subject"
                value={formData.subject}
                onChange={handleFieldChange}
                placeholder="Enter the subject of your support request"
                className="h-8 w-full max-w-[400px] rounded border border-[#cfcfcf] bg-white px-2 text-[12px] text-[#666] outline-none focus:border-[#1d2464]"
              />
            </div>

            <div className="grid grid-cols-[180px_1fr] items-center gap-4 border-b border-[#d9d9d9] pb-3">
              <label className="text-[14px] font-semibold text-[#555]">
                Detailed description <span className="text-[#d92d20]">*</span>:
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleFieldChange}
                placeholder="Enter a detailed description of your support request"
                className="h-24 w-full max-w-[400px] rounded border border-[#cfcfcf] bg-white px-2 py-2 text-[12px] text-[#666] outline-none focus:border-[#1d2464]"
              />
            </div>

            <div className="grid grid-cols-[180px_1fr] items-center gap-4 border-b border-[#d9d9d9] pb-3">
              <label className="text-[14px] font-semibold text-[#555]">
                Is this issue currently preventing you from safely following your permitted route?
              </label>
              <div className="flex flex-wrap gap-4 text-[12px] text-[#555]">
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="safety_critical"
                    checked={formData.safety_critical === true}
                    onChange={() => setFormData((prev) => ({ ...prev, safety_critical: true }))}
                  />
                  Yes
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="safety_critical"
                    checked={formData.safety_critical === false}
                    onChange={() => setFormData((prev) => ({ ...prev, safety_critical: false }))}
                  />
                  No
                </label>
              </div>
            </div>

            <div className="grid grid-cols-[180px_1fr] items-center gap-4 border-b border-[#d9d9d9] pb-3">
              <label className="text-[14px] font-semibold text-[#555]">Upload a screenshot of file</label>
              <div className="w-full max-w-[520px]">
                <div
                  onDragEnter={handleDragOver}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  className={`flex h-28 w-full flex-col items-center justify-center gap-2 rounded border-2 border-dashed px-4 py-3 text-center text-[12px] transition-colors ${
                    isDraggingFiles
                      ? 'border-[#ff823d] bg-[#fff2e9] text-[#b84e16]'
                      : 'border-[#c8c8c8] bg-[#f6f6f6] text-[#777]'
                  }`}
                >
                    <input
                      ref={fileInputRef}
                      id="ticket-upload"
                      type="file"
                      accept="image/*,.pdf,.doc,.docx"
                      multiple
                      className="sr-only"
                      onChange={handleFileChange}
                    />
                    <Upload size={24} strokeWidth={2} />
                    <div>
                      <span>Drag &amp; Drop Files, </span>
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="font-medium text-[#303b80] underline underline-offset-2 hover:text-[#ff823d] cursor-pointer"
                      >
                        Choose Files to Upload
                      </button>
                    </div>
                    <span>{isDraggingFiles ? 'Release to add files' : `You can upload up to ${MAX_UPLOADS} files`}</span>
                </div>

                {uploadedFiles.length > 0 && (
                  <div aria-live="polite" className="mt-2 rounded border border-[#d9d9d9] bg-white px-2 py-2 text-[11px] text-[#555]">
                    <div className="mb-1 font-medium text-[#333]">Selected files:</div>
                    <ul className="space-y-1">
                      {uploadedFiles.map((file) => (
                        <li key={`${file.name}-${file.lastModified}`} className="flex items-center justify-between gap-3">
                          <span className="min-w-0 truncate" title={file.name}>{file.name}</span>
                          <button
                            type="button"
                            onClick={() => removeFile(file)}
                            aria-label={`Remove ${file.name}`}
                            className="flex-shrink-0 text-[#b42318] hover:text-[#7a1710] cursor-pointer"
                          >
                            <X size={14} />
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="mt-5 rounded border border-[#d9d9d9] bg-[#f6f6f6] p-3">
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="w-max rounded bg-[#ff823d] px-4 py-3 text-[12px] font-semibold uppercase tracking-wide text-white hover:bg-[#e66e2f] disabled:opacity-60 cursor-pointer"
            >
              Submit
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default SubmitTicket
