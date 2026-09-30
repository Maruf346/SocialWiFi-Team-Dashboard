import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '../../../context/useAuth'
import { teamSupportApi } from '../../../services/teamSupportApi'

const Resources = () => {
  const { accessToken } = useAuth()
  const [resources, setResources] = useState([])
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isDownloading, setIsDownloading] = useState(false)
  const [error, setError] = useState('')

  const loadResources = useCallback(async (signal) => {
    if (!accessToken) return

    setIsLoading(true)
    setError('')

    try {
      const data = await teamSupportApi.listResources(accessToken, { search }, { signal })
      setResources(Array.isArray(data) ? data : [])
    } catch (err) {
      if (err.name !== 'AbortError') {
        setError(err.message || 'Unable to load resources.')
      }
    } finally {
      setIsLoading(false)
    }
  }, [accessToken, search])

  useEffect(() => {
    const controller = new AbortController()
    const timeoutId = window.setTimeout(() => {
      loadResources(controller.signal)
    }, 0)

    return () => {
      window.clearTimeout(timeoutId)
      controller.abort()
    }
  }, [loadResources])

  const openResource = (resource) => {
    const url = resource.download_url || resource.file
    if (url) {
      window.open(url, '_blank', 'noopener,noreferrer')
    }
  }

  const downloadResource = async (resource) => {
    setIsDownloading(true)
    setError('')

    try {
      const result = await teamSupportApi.downloadResource(accessToken, resource.id)
      if (typeof result === 'string' && result) {
        window.open(result, '_blank', 'noopener,noreferrer')
      } else if (resource.download_url || resource.file) {
        window.open(resource.download_url || resource.file, '_blank', 'noopener,noreferrer')
      }
    } catch (err) {
      setError(err.message || 'Unable to download resource.')
    } finally {
      setIsDownloading(false)
    }
  }

  const applySearch = () => {
    setSearch(searchInput.trim())
  }

  return (
    <div className="min-h-full px-2 py-2 text-[#888] md:px-10 md:py-4">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-xl font-normal text-[#999] md:text-2xl">Resources</h1>
      </div>

      {error && (
        <div className="mb-4 rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="mb-2 flex flex-wrap items-end justify-end gap-2 text-sm">
        <label htmlFor="resource-search">
          Search:
          <span className="ml-2 inline-flex items-center gap-1">
            <input
              id="resource-search"
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              onKeyDown={(event) => event.key === 'Enter' && applySearch()}
              className="h-8 w-56 border border-[#ccc] px-2 outline-none"
            />
            <button
              type="button"
              onClick={applySearch}
              className="h-8 border border-[#ccc] bg-[#f4f4f4] px-2 text-xs cursor-pointer"
            >
              Go
            </button>
          </span>
        </label>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[620px] border-collapse text-sm">
          <thead>
            <tr className="bg-[#f3f3f3] text-left text-xs uppercase text-[#888]">
              <th className="px-2 py-2">Resources</th>
              <th className="px-2 py-2">Category</th>
              <th className="px-2 py-2">Size</th>
              <th className="w-24 px-2 py-2" />
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={4} className="py-8 text-center text-[#888]">
                  Loading resources...
                </td>
              </tr>
            ) : resources.length === 0 ? (
              <tr>
                <td colSpan={4} className="py-8 text-center text-[#888]">
                  No resources found.
                </td>
              </tr>
            ) : resources.map((resource) => (
              <tr key={resource.id} className="border-b border-white bg-[#f7f7f7] even:bg-[#fbfbfb]">
                <td className="px-2 py-2">
                  <button
                    type="button"
                    onClick={() => openResource(resource)}
                    className="font-semibold underline underline-offset-2 cursor-pointer"
                  >
                    {resource.title || resource.file_name || 'Untitled resource'}
                  </button>
                  {resource.description && (
                    <p className="mt-1 text-xs text-[#666]">{resource.description}</p>
                  )}
                </td>
                <td className="px-2 py-2 text-xs text-[#666]">{resource.category || '-'}</td>
                <td className="px-2 py-2 text-xs text-[#666]">{resource.file_size_formatted || '-'}</td>
                <td className="px-2 py-2">
                  <button
                    type="button"
                    onClick={() => downloadResource(resource)}
                    disabled={isDownloading}
                    className="rounded border border-[#bbb] bg-[#f5f5f5] px-2 py-1 text-xs disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    Download
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="border-b border-[#eee] py-4 text-sm">
        {resources.length} resources
      </p>
    </div>
  )
}

export default Resources