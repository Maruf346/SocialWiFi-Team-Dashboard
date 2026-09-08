import { useMemo, useRef, useState } from "react";

const resourceNames = [
  "Single-User-Guide.pdf",
  "Team-Manager-User-Guide.pdf",
  "Fleet-Drivers-User-Guide.pdf",
  "RightRoute Promo Video 01.mp4",
  "RightRoute Promo Video 02.mp4",
  "Fleet Contract Template.docx",
  "List of User Testimonials.docx",
];

const initialResources = resourceNames.map((name, index) => ({
  id: `resource-${index}`,
  name,
  url: null,
}));

const Resources = () => {
  const [resources, setResources] = useState(initialResources);
  const [search, setSearch] = useState("");
  const [uploadOpen, setUploadOpen] = useState(false);
  const fileInputRef = useRef(null);
  const visibleResources = useMemo(
    () =>
      resources.filter((resource) =>
        resource.name.toLowerCase().includes(search.toLowerCase()),
      ),
    [resources, search],
  );

  const openResource = (resource) => {
    if (resource.url)
      window.open(resource.url, "_blank", "noopener,noreferrer");
  };
  const downloadResource = (resource) => {
    if (resource.url) {
      const link = document.createElement("a");
      link.href = resource.url;
      link.download = resource.name;
      link.click();
    }
  };
  const handleUpload = (event) => {
    const files = Array.from(event.target.files || []);
    setResources((current) => [
      ...current,
      ...files.map((file) => ({
        id: `${file.name}-${file.lastModified}`,
        name: file.name,
        url: URL.createObjectURL(file),
      })),
    ]);
    setUploadOpen(false);
    event.target.value = "";
  };

  return (
    <div className="min-h-full px-2 py-2 text-[#777] md:px-4 md:py-3">
      <div className="mb-12 flex items-center justify-between">
        <h1 className="text-2xl font-normal text-[#999]">Resources</h1>
        
      </div>
      <div className="mb-2 flex flex-wrap items-end justify-end gap-2 text-sm">
        
        <label htmlFor="resource-search">
          Search:
          <span className="ml-2 inline-flex items-center gap-1">
            <input
              id="resource-search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="h-8 w-56 border border-[#ccc] px-2 outline-none"
            />
            <button
              type="button"
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
              <th className="w-24 px-2 py-2" />
            </tr>
          </thead>
          <tbody>
            {visibleResources.map((resource) => (
              <tr
                key={resource.id}
                className="border-b border-white bg-[#f7f7f7] even:bg-[#fbfbfb]"
              >
                <td className="px-2 py-2">
                  <button
                    type="button"
                    onClick={() => openResource(resource)}
                    className="font-semibold underline underline-offset-2 cursor-pointer"
                  >
                    {resource.name}
                  </button>
                </td>
                <td className="px-2 py-2">
                  <button
                    type="button"
                    onClick={() => downloadResource(resource)}
                    disabled={!resource.url}
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
        {visibleResources.length} resources
      </p>
      <input
        ref={fileInputRef}
        type="file"
        multiple
        className="hidden"
        onChange={handleUpload}
      />
      {uploadOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="upload-resource-title"
            className="w-full max-w-md rounded border border-[#ccc] bg-white p-5 shadow-lg"
          >
            <div className="flex items-center justify-between">
              <h2
                id="upload-resource-title"
                className="text-lg font-semibold text-[#444]"
              >
                Upload resource
              </h2>
              <button
                type="button"
                onClick={() => setUploadOpen(false)}
                aria-label="Close upload dialog"
                className="text-xl"
              >
                &times;
              </button>
            </div>
            <p className="mt-3 text-sm">
              Select one or more files to add them to the resource list.
            </p>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="mt-5 rounded bg-[#ff823d] px-4 py-2 text-sm font-semibold text-white"
            >
              Choose files
            </button>
            <button
              type="button"
              onClick={() => setUploadOpen(false)}
              className="ml-2 rounded border border-[#bbb] px-4 py-2 text-sm"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Resources;
