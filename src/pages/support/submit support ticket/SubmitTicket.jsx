import React, { useState } from "react";
import { Upload } from "lucide-react";

const topicOptions = [
  "Account and Login Issues",
  "Billing and Subscription Issues",
  "Permit Import and Processing",
  "Route and Navigation Issues",
  "App Technical Issues",
  "Team and Driver Management",
  "Account Changes and Requests",
  "Complaint or Service Concern",
  "Feature Request or Suggestion",
  "General Question or Other",
];

const subtopicMap = {
  "Account and Login Issues": [
    "Cannot log in",
    "Password reset",
    "Email address change",
    "Account not recognized",
    "Driver invitation issue",
    "Team or fleet account access",
    "Account locked or disabled",
    "Other account/login issues",
  ],
  "Billing and Subscription Issues": [
    "Payment failed",
    "Incorrect charge",
    "Duplicate charge",
    "Subscription cancellation",
    "Monthly-to-annual plan change",
    "Free trial issue",
    "Promotional offer or discount issue",
    "Apple App Store billing",
    "Google Play billing",
    "Fleet contract billing",
    "Other billing/subscription issue",
  ],
  "Permit Import and Processing": [
    "Permit will not upload",
    "Unsupported PDF",
    "Permit text not recognized",
    "Incorrect route extracted",
    "Missing route instructions",
    "Start or end point not detected",
    "Waypoints placed incorrectly",
    "Processing failed",
    "Duplicate permit",
    "Other import/processing issue",
  ],
  "Route and Navigation Issues": [
    "Route is incorrect",
    "Route does not match permit",
    "Missing waypoint",
    "Incorrect road or highway",
    "Navigation will not start",
    "Voice guidance issue",
    "Route recalculation issue",
    "Map display issue",
    "Offline route issue",
    "GPS location issue",
    "Other route/navigation issue",
  ],
  "App Technical Issues": [
    "App crashes",
    "App freezes",
    "Page will not load",
    "Button does not work",
    "Slow performance",
    "Installation issue",
    "Update issue",
    "Device compatibility",
    "Notification issue",
    "Internet connection issue",
    "Unknown technical error",
    "Other technical issue",
  ],
  "Team and Driver Management": [
    "Cannot add driver",
    "Driver invitation not received",
    "Driver cannot activate account",
    "Driver removal issue",
    "Driver limit reached",
    "Incorrect driver access",
    "Team Manager dashboard issue",
    "User role or permission issue",
    "Fleet account setup issue",
    "Other team/driver issue",
  ],
  "Account Changes and Requests": [
    "Update account information",
    "Change company information",
    "Add or remove administrator",
    "Transfer account ownership",
    "Delete account",
    "Request account records",
    "Change plan",
    "Increase driver allowance",
    "Other account issue",
  ],
  "Complaint or Service Concern": [
    "App performance complaint",
    "Routing complaint",
    "Billing complaint",
    "Customer service complaint",
    "Feature dissatisfaction",
    "Pricing complaint",
    "Privacy concern",
    "Safety concern",
    "Other concern",
  ],
  "Feature Request or Suggestion": [
    "New app feature",
    "Dashboard improvement",
    "Permit-processing improvement",
    "Navigation improvement",
    "Offline functionality",
    "Team-management improvement",
    "Billing improvement",
    "General suggestion",
  ],
  "General Question or Other": [
    "How-to question",
    "Product information",
    "Pricing question",
    "Feedback",
    "Testimonial",
    "Other",
  ],
};

const initialFormData = {
  firstLastName: "",
  accountEmail: "",
  phone: "",
  company: "",
  planType: "",
  contactMethod: "",
  otherDevice: "",
  subject: "",
  detailedDescription: "",
  routeIssue: "",
};

const SubmitTicket = () => {
  const [selectedPlatform, setSelectedPlatform] = useState("");
  const [selectedTopic, setSelectedTopic] = useState("");
  const [selectedSubtopic, setSelectedSubtopic] = useState("");
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [formData, setFormData] = useState(initialFormData);

  const handleTopicChange = (value) => {
    setSelectedTopic(value);
    setSelectedSubtopic("");
    setFormData((prev) => ({ ...prev, topic: value, subtopic: "" }));
  };

  const handleFieldChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handlePlatformChange = (platform) => {
    setSelectedPlatform(platform);
    setFormData((prev) => ({ ...prev, platform }));
  };

  const handleFileChange = (event) => {
    const files = Array.from(event.target.files || []);

    if (files.length > 3) {
      alert("You can upload up to 3 files only.");
      event.target.value = "";
      return;
    }

    setUploadedFiles(files);
  };

  const resetForm = () => {
    setFormData(initialFormData);
    setSelectedPlatform("");
    setSelectedTopic("");
    setSelectedSubtopic("");
    setUploadedFiles([]);
  };

  const handleSubmit = () => {
    const payload = {
      ...formData,
      platform:
        selectedPlatform === "Other"
          ? `Other (${formData.otherDevice || ""})`
          : selectedPlatform,
      topic: selectedTopic,
      subtopic: selectedSubtopic,
      uploadedFiles: uploadedFiles.map((file) => ({
        name: file.name,
        size: file.size,
        type: file.type,
      })),
    };

    console.log("Support ticket submitted:", payload);
    resetForm();
  };

  const subtopics = selectedTopic ? subtopicMap[selectedTopic] || [] : [];

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

      <div className="w-full">
        <div className="space-y-3">
          <div className="grid grid-cols-[180px_1fr] items-center gap-4 border-b border-[#d9d9d9] pb-3">
            <label className="text-[14px] font-semibold text-[#555]">
              First/Last name <span className="text-[#d92d20]">*</span>:
            </label>
            <input
              type="text"
              name="firstLastName"
              value={formData.firstLastName}
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
              name="accountEmail"
              value={formData.accountEmail}
              onChange={handleFieldChange}
              className="h-8 w-full max-w-[400px] rounded border border-[#cfcfcf] bg-white px-2 text-[12px] text-[#666] outline-none focus:border-[#1d2464]"
              placeholder="Enter your account email"
            />
          </div>

          <div className="grid grid-cols-[180px_1fr] items-center gap-4 border-b border-[#d9d9d9] pb-3">
            <label className="text-[14px] font-semibold text-[#555]">
              Phone:
            </label>
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
            <label className="text-[14px] font-semibold text-[#555]">
              Company (if applicable):
            </label>
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
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="planType"
                  checked={formData.planType === "Team"}
                  onChange={() => setFormData((prev) => ({ ...prev, planType: "Team" }))}
                />
                Team
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="planType"
                  checked={formData.planType === "Fleet"}
                  onChange={() => setFormData((prev) => ({ ...prev, planType: "Fleet" }))}
                />
                Fleet
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="planType"
                  checked={formData.planType === "Trial user"}
                  onChange={() => setFormData((prev) => ({ ...prev, planType: "Trial user" }))}
                />
                Trial user
              </label>
            </div>
          </div>

          <div className="grid grid-cols-[180px_1fr] items-center gap-4 border-b border-[#d9d9d9] pb-3">
            <label className="text-[14px] font-semibold text-[#555]">
              Preferred contact method <span className="text-[#d92d20]">*</span>
              :
            </label>
            <div className="flex flex-wrap gap-4 text-[12px] text-[#555]">
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="contactMethod"
                  checked={formData.contactMethod === "Phone"}
                  onChange={() => setFormData((prev) => ({ ...prev, contactMethod: "Phone" }))}
                />
                Phone
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="contactMethod"
                  checked={formData.contactMethod === "Email"}
                  onChange={() => setFormData((prev) => ({ ...prev, contactMethod: "Email" }))}
                />
                Email
              </label>
            </div>
          </div>

          <div className="grid grid-cols-[180px_1fr] items-center gap-4 border-b border-[#d9d9d9] pb-3">
            <label className="text-[14px] font-semibold text-[#555]">
              Platform <span className="text-[#d92d20]">*</span>:
            </label>
            <div className="flex flex-wrap items-center gap-4 text-[12px] text-[#555]">
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="platform"
                  checked={selectedPlatform === "iPhone"}
                  onChange={() => handlePlatformChange("iPhone")}
                />{" "}
                iPhone
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="platform"
                  checked={selectedPlatform === "iPod"}
                  onChange={() => handlePlatformChange("iPod")}
                />{" "}
                iPod
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="platform"
                  checked={selectedPlatform === "Android Phone"}
                  onChange={() => handlePlatformChange("Android Phone")}
                />{" "}
                Android Phone
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="platform"
                  checked={selectedPlatform === "Android Tablet"}
                  onChange={() => handlePlatformChange("Android Tablet")}
                />{" "}
                Android Tablet
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="platform"
                  checked={selectedPlatform === "Web Dashboard"}
                  onChange={() => handlePlatformChange("Web Dashboard")}
                />{" "}
                Web Dashboard
              </label>

              <div className="flex items-center gap-2">
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="platform"
                    checked={selectedPlatform === "Other"}
                    onChange={() => handlePlatformChange("Other")}
                  />{" "}
                  Other
                </label>
                {selectedPlatform === "Other" && (
                  <input
                    name="otherDevice"
                    value={formData.otherDevice}
                    onChange={handleFieldChange}
                    className="h-8 w-[220px] rounded border border-[#cfcfcf] bg-white px-2 text-[12px] text-[#666] outline-none focus:border-[#1d2464]"
                    placeholder="Enter device"
                  />
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-[180px_1fr] items-center gap-4 border-b border-[#d9d9d9] pb-3">
            <label className="text-[14px] font-semibold text-[#555]">
              Select a topic <span className="text-[#d92d20]">*</span>:
            </label>
            <select
              value={selectedTopic}
              onChange={(e) => handleTopicChange(e.target.value)}
              className="h-8 w-full max-w-[400px] rounded border border-[#cfcfcf] bg-white px-2 text-[12px] text-[#666] outline-none focus:border-[#1d2464]"
            >
              <option value="">---Select One---</option>
              {topicOptions.map((topic) => (
                <option key={topic} value={topic}>
                  {topic}
                </option>
              ))}
            </select>
          </div>

          {selectedTopic && (
            <div className="grid grid-cols-[180px_1fr] items-center gap-4 border-b border-[#d9d9d9] pb-3">
              <label className="text-[14px] font-semibold text-[#555]">
                Select a subtopic:
              </label>
              <select
                value={selectedSubtopic}
                onChange={(e) => {
                  setSelectedSubtopic(e.target.value);
                  setFormData((prev) => ({ ...prev, subtopic: e.target.value }));
                }}
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
              name="detailedDescription"
              value={formData.detailedDescription}
              onChange={handleFieldChange}
              placeholder="Enter a detailed description of your support request"
              className="h-24 w-full max-w-[400px] rounded border border-[#cfcfcf] bg-white px-2 py-2 text-[12px] text-[#666] outline-none focus:border-[#1d2464]"
            />
          </div>

          <div className="grid grid-cols-[180px_1fr] items-center gap-4 border-b border-[#d9d9d9] pb-3">
            <label className="text-[14px] font-semibold text-[#555]">
              Is this issue currently preventing you from safely following your
              permitted route?
            </label>
            <div className="flex flex-wrap gap-4 text-[12px] text-[#555]">
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="routeIssue"
                  checked={formData.routeIssue === "Yes"}
                  onChange={() => setFormData((prev) => ({ ...prev, routeIssue: "Yes" }))}
                />
                Yes
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="routeIssue"
                  checked={formData.routeIssue === "No"}
                  onChange={() => setFormData((prev) => ({ ...prev, routeIssue: "No" }))}
                />
                No
              </label>
            </div>
          </div>

          <div className="grid grid-cols-[180px_1fr] items-center gap-4 border-b border-[#d9d9d9] pb-3">
            <label className="text-[14px] font-semibold text-[#555]">
              Upload a screenshot of file
            </label>
            <div className="w-full max-w-[520px]">
              <div className="flex h-28 w-full rounded border border-[#d0d0d0] bg-[#f6f6f6] text-center text-[12px] text-[#777]">
                <label
                  htmlFor="ticket-upload"
                  className="flex w-full cursor-pointer flex-col items-center justify-center gap-2 px-4 py-3"
                >
                  <input
                    id="ticket-upload"
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={handleFileChange}
                  />
                  {/* <Upload className="h-7 w-7 text-[#666]" strokeWidth={1.8} /> */}
                  <Upload
      size={24}
      strokeWidth={2}
    />
                  <span>
                    Drag &amp; Drop Files,
                    <span className="ml-1 underline underline-offset-2">
                      Choose Files to Upload
                    </span>
                  </span>
                  <span>You can upload up to 3 files</span>
                </label>
              </div>

              {uploadedFiles.length > 0 && (
                <div className="mt-2 rounded border border-[#d9d9d9] bg-white px-2 py-2 text-[11px] text-[#555]">
                  <div className="mb-1 font-medium text-[#333]">
                    Selected files:
                  </div>
                  <ul className="list-disc pl-5">
                    {uploadedFiles.map((file, index) => (
                      <li key={`${file.name}-${index}`}>{file.name}</li>
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
            className="w-max rounded bg-[#ff823d] px-4 py-3 text-[12px] font-semibold uppercase tracking-wide text-white hover:bg-[#e66e2f] cursor-pointer"
          >
            Submit
          </button>
        </div>
      </div>
    </div>
  );
};

export default SubmitTicket;
