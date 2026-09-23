import { useEffect, useMemo, useRef, useState } from "react";
import { History, Pencil, Upload, X } from "lucide-react";
import { useNavigate } from "react-router";

const initialTeamUsers = [
  { id: 1, name: "Ethan Caldwell", email: "ethancaldwell@gmail.com", enrolled: true },
  { id: 2, name: "Marcus Bennett", email: "marcusbennett@yahoo.com", enrolled: true },
  { id: 3, name: "Daniel Reed", email: "danielreed@outlook.com", enrolled: true },
  { id: 4, name: "Nathan Parker", email: "nathanparker@hotmail.com", enrolled: false },
  { id: 5, name: "Lucas Foster", email: "lucasfoster@icloud.com", enrolled: true },
  { id: 6, name: "Adrian Collins", email: "adriancollins@gmail.com", enrolled: true },
  { id: 7, name: "Caleb Brooks", email: "calebbrooks@yahoo.com", enrolled: true },
  { id: 8, name: "Julian Ramirez", email: "julianramirez@outlook.com", enrolled: true },
  { id: 9, name: "Owen Mitchell", email: "owenmitchell@hotmail.com", enrolled: false },
  { id: 10, name: "Miles Sullivan", email: "milessullivan@icloud.com", enrolled: true },
  { id: 11, name: "Simon Turner", email: "simonturner@gmail.com", enrolled: true },
  { id: 12, name: "Henry Morgan", email: "henrymorgan@yahoo.com", enrolled: true },
  { id: 13, name: "Noah Harrison", email: "noahharrison@outlook.com", enrolled: true },
  { id: 14, name: "Liam Jenkins", email: "liamjenkins@hotmail.com", enrolled: false },
  { id: 15, name: "Samuel Hayes", email: "samuelhayes@icloud.com", enrolled: true },
  { id: 16, name: "Benjamin Cooper", email: "benjamincooper@gmail.com", enrolled: true },
  { id: 17, name: "Isaac Richardson", email: "isaacrichardson@yahoo.com", enrolled: true },
  { id: 18, name: "Thomas Thompson", email: "thomasthompson@outlook.com", enrolled: true },
  { id: 19, name: "Jack Anderson", email: "jackanderson@hotmail.com", enrolled: true },
  { id: 20, name: "Leo Carter", email: "leocarter@icloud.com", enrolled: false },
];

const TeamUser = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const [users, setUsers] = useState(initialTeamUsers);
  const [selectedIds, setSelectedIds] = useState([]);
  const [activeUserId, setActiveUserId] = useState(null);

  const [filterInput, setFilterInput] = useState("All");
  const [filter, setFilter] = useState("All");
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const [importOpen, setImportOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState("");

  // Add form state (default mode)
  const [addFormData, setAddFormData] = useState({
    name: "",
    email: "",
    enrolled: true,
  });

  // Edit form state (when user row is selected)
  const [editFormData, setEditFormData] = useState({
    name: "",
    email: "",
    enrolled: false,
  });

  const activeUser = useMemo(() => {
    return users.find((u) => u.id === activeUserId) || null;
  }, [users, activeUserId]);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(""), 2500);
  };

  const handleSelectUser = (user) => {
    setActiveUserId(user.id);
    setEditFormData({
      name: user.name,
      email: user.email,
      enrolled: user.enrolled,
    });
    if (!selectedIds.includes(user.id)) {
      setSelectedIds([user.id]);
    }
  };

  // Sync external enrollment changes
  useEffect(() => {
    const syncEnrollment = (event) => {
      if (event.key !== "team-users-enrollment" || !event.newValue) return;
      const update = JSON.parse(event.newValue);
      setUsers((current) =>
        current.map((user) =>
          user.email === update.email ? { ...user, enrolled: update.enrolled } : user
        )
      );
    };
    window.addEventListener("storage", syncEnrollment);
    return () => window.removeEventListener("storage", syncEnrollment);
  }, []);

  // Filter & Search Logic
  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      const matchSearch =
        user.name.toLowerCase().includes(search.toLowerCase()) ||
        user.email.toLowerCase().includes(search.toLowerCase());

      if (!matchSearch) return false;

      if (filter === "All") return true;
      if (filter === "Yes") return user.enrolled === true;
      if (filter === "No") return user.enrolled === false;
      return true;
    });
  }, [users, search, filter]);

  const enrolledTotal = useMemo(() => {
    return users.filter((u) => u.enrolled).length;
  }, [users]);

  const isAllVisibleSelected =
    filteredUsers.length > 0 &&
    filteredUsers.every((u) => selectedIds.includes(u.id));

  const handleToggleSelectAll = (checked) => {
    if (checked) {
      const allVisibleIds = filteredUsers.map((u) => u.id);
      setSelectedIds(Array.from(new Set([...selectedIds, ...allVisibleIds])));
    } else {
      const visibleIdSet = new Set(filteredUsers.map((u) => u.id));
      setSelectedIds(selectedIds.filter((id) => !visibleIdSet.has(id)));
    }
  };

  const handleToggleSelectRow = (id, event) => {
    event.stopPropagation();
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  // Table Bottom Action Handlers: Delete, Download, Cancel, Send Invite
  const handleDelete = () => {
    if (selectedIds.length === 0) {
      showToast("No users selected to delete");
      return;
    }
    setUsers((prev) => prev.filter((u) => !selectedIds.includes(u.id)));
    if (selectedIds.includes(activeUserId)) {
      setActiveUserId(null);
    }
    setSelectedIds([]);
    showToast("Selected users deleted successfully");
  };

  const handleDownload = () => {
    const headers = ["Name", "Email", "Enrolled"];
    const rows = filteredUsers.map((u) => [
      `"${u.name}"`,
      `"${u.email}"`,
      `"${u.enrolled ? "Yes" : "No"}"`,
    ]);
    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "team_users_export.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast("User list downloaded as CSV");
  };

  const handleCancel = () => {
    setFilterInput("All");
    setFilter("All");
    setSearchInput("");
    setSearch("");
    setSelectedIds([]);
    setActiveUserId(null);
    showToast("Selection and filters reset");
  };

  // Add User Handler (SEND INVITE)
  const handleAddUser = (e) => {
    e.preventDefault();
    if (!addFormData.name.trim() || !addFormData.email.trim()) {
      showToast("Please provide both name and email");
      return;
    }
    const newUser = {
      id: Date.now(),
      name: addFormData.name.trim(),
      email: addFormData.email.trim(),
      enrolled: Boolean(addFormData.enrolled),
    };
    setUsers((prev) => [newUser, ...prev]);
    setAddFormData({ name: "", email: "", enrolled: true });
    showToast("Invitation sent and user added successfully");
  };

  // Side Panel Edit Save & Cancel
  const handleSaveUserInfo = (e) => {
    e.preventDefault();
    if (!activeUser) return;
    setUsers((prev) =>
      prev.map((u) =>
        u.id === activeUser.id
          ? {
              ...u,
              name: editFormData.name,
              email: editFormData.email,
              enrolled: editFormData.enrolled,
            }
          : u
      )
    );
    showToast("User details saved successfully");
  };

  const handleCancelUserInfo = () => {
    setActiveUserId(null);
    showToast("Closed edit mode");
  };

  // CSV Import Handlers
  const handleImportCsv = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const rows = String(reader.result)
        .split(/\r?\n/)
        .slice(1)
        .map((row) =>
          row.split(",").map((value) => value.trim().replace(/^"|"$/g, ""))
        )
        .filter((row) => row[0] && row[1]);

      const newUsers = rows.map(([name, email], idx) => ({
        id: Date.now() + idx,
        name,
        email,
        enrolled: false,
      }));

      setUsers((prev) => [...prev, ...newUsers]);
      setImportOpen(false);
      showToast(`${rows.length} users imported successfully`);
    };
    reader.readAsText(file);
    event.target.value = "";
  };

  return (
    <main className="team-users-page min-h-full px-2 py-2 text-[#888] md:px-10 md:py-4">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 rounded bg-[#151d56] px-4 py-2.5 text-sm text-white shadow-lg transition-all">
          {toastMessage}
        </div>
      )}

      {/* Header Title & Meta Info */}
      <h1 className="mb-4 text-xl font-normal text-[#999] md:text-2xl">
        Manage team users
      </h1>

      <div className="mb-4 space-y-0.5 text-xs font-bold text-[#333]">
        <p>Plan: Up to 500 users</p>
        <p>Total in list: {users.length}</p>
        <p>Enrolled user total: {enrolledTotal}</p>
      </div>

      {/* Main Grid: Left Table & Right Side Panel (Left wider by 35px, Right narrower by 40px, wider gap) */}
      <div className="grid grid-cols-1 gap-7 xl:grid-cols-[1.75fr_0.9fr] 2xl:grid-cols-[1.85fr_0.9fr]">
        {/* Left Column: Filter/Search, Table, Pagination, Action Buttons */}
        <section className="flex flex-col min-w-0">
          {/* Filters & Search Row */}
          <div className="mb-2.5 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-1.5">
              <span className="text-[#666]">Filter:</span>
              <select
                value={filterInput}
                onChange={(e) => setFilterInput(e.target.value)}
                className="h-6 rounded border border-[#ccc] bg-white px-1 text-xs outline-none"
              >
                <option value="All">All</option>
                <option value="Yes">Enrolled (Yes)</option>
                <option value="No">Not Enrolled (No)</option>
              </select>
              <button
                type="button"
                onClick={() => setFilter(filterInput)}
                className="h-6 rounded border border-[#ccc] bg-[#efefef] px-2.5 text-xs font-normal text-[#333] hover:bg-[#e4e4e4] active:bg-[#d5d5d5] cursor-pointer"
              >
                Go
              </button>
            </div>

            <div className="flex items-center gap-1.5">
              <span className="text-[#666]">Search:</span>
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && setSearch(searchInput.trim())}
                placeholder="Search by name or email"
                className="h-6 w-36 rounded border border-[#ccc] bg-white px-2 text-xs outline-none md:w-44"
              />
              <button
                type="button"
                onClick={() => setSearch(searchInput.trim())}
                className="h-6 rounded border border-[#ccc] bg-[#efefef] px-2.5 text-xs font-normal text-[#333] hover:bg-[#e4e4e4] active:bg-[#d5d5d5] cursor-pointer"
              >
                Go
              </button>
            </div>
          </div>

          {/* Table Container */}
          <div className="overflow-x-auto border border-[#eee]">
            <table className="w-full min-w-[620px] border-collapse text-left text-xs">
              <thead>
                <tr className="h-8 border-b border-[#eee] bg-[#f3f3f3] uppercase text-[#888] font-normal">
                  <th className="w-8 px-2 text-center">
                    <input
                      type="checkbox"
                      checked={isAllVisibleSelected}
                      onChange={(e) => handleToggleSelectAll(e.target.checked)}
                      className="cursor-pointer accent-[#ff823d]"
                      aria-label="Select all team users"
                    />
                  </th>
                  <th className="px-3 py-1 font-semibold tracking-wider">NAME</th>
                  <th className="px-3 py-1 font-semibold tracking-wider">EMAIL</th>
                  <th className="px-3 py-1 font-semibold tracking-wider">ENROLLED</th>
                  {/* Expanded spacing between Edit and Route History headers */}
                  <th className="w-20 px-4 py-1 text-center font-semibold tracking-wider">
                    EDIT/<br className="sm:hidden" />VIEW
                  </th>
                  <th className="w-28 px-4 py-1 text-center font-semibold tracking-wider">
                    ROUTE<br className="sm:hidden" />HISTORY
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-[#888]">
                      No team users found matching criteria.
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((user) => {
                    const isSelected = selectedIds.includes(user.id);
                    const isActive = activeUserId === user.id;
                    return (
                      <tr
                        key={user.id}
                        onClick={() => handleSelectUser(user)}
                        className={`h-8 border-b border-[#f0f0f0] cursor-pointer transition-colors ${
                          isActive
                            ? "bg-[#fff3eb]"
                            : isSelected
                            ? "bg-[#fef8f4]"
                            : "even:bg-[#f9f9f9] hover:bg-[#f5f5f5]"
                        }`}
                      >
                        <td className="px-2 text-center" onClick={(e) => e.stopPropagation()}>
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={(e) => handleToggleSelectRow(user.id, e)}
                            className="cursor-pointer accent-[#ff823d]"
                            aria-label={`Select ${user.name}`}
                          />
                        </td>
                        <td className="px-3 py-1 font-normal text-[#444] whitespace-nowrap">
                          {user.name}
                        </td>
                        <td className="px-3 py-1 text-[#666] whitespace-nowrap">
                          {user.email}
                        </td>
                        <td className="px-3 py-1 text-[#666] whitespace-nowrap">
                          {user.enrolled ? "Yes" : "No"}
                        </td>
                        <td className="px-4 py-1 text-center" onClick={(e) => e.stopPropagation()}>
                          <button
                            type="button"
                            onClick={() => handleSelectUser(user)}
                            className="text-[#777] hover:text-[#ff823d] p-0.5 cursor-pointer inline-flex items-center justify-center"
                            aria-label={`Edit ${user.name}`}
                          >
                            <Pencil size={15} />
                          </button>
                        </td>
                        <td className="px-4 py-1 text-center" onClick={(e) => e.stopPropagation()}>
                          <button
                            type="button"
                            onClick={() =>
                              navigate(
                                `/dashboard/manage/team-route-history`
                              )
                            }
                            className="text-[#777] hover:text-[#ff823d] p-0.5 cursor-pointer inline-flex items-center justify-center"
                            aria-label={`Route history for ${user.name}`}
                          >
                            <History size={16} />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Table Bottom Meta & Pagination */}
          <div className="flex flex-wrap items-center justify-between border-b border-[#eee] py-2 text-xs text-[#777]">
            <span>{selectedIds.length} of {users.length} selected</span>
            <span>1-{filteredUsers.length} of {users.length} users</span>
            <div className="flex items-center gap-1.5 underline cursor-pointer">
              <button
                type="button"
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                className="hover:text-black cursor-pointer"
              >
                Previous
              </button>
              <span
                onClick={() => setCurrentPage(1)}
                className={`px-0.5 cursor-pointer ${currentPage === 1 ? "font-bold text-black" : ""}`}
              >
                1
              </span>
              <span
                onClick={() => setCurrentPage(2)}
                className={`px-0.5 cursor-pointer ${currentPage === 2 ? "font-bold text-black" : ""}`}
              >
                2
              </span>
              <span
                onClick={() => setCurrentPage(3)}
                className={`px-0.5 cursor-pointer ${currentPage === 3 ? "font-bold text-black" : ""}`}
              >
                3
              </span>
              <button
                type="button"
                onClick={() => setCurrentPage(currentPage + 1)}
                className="hover:text-black cursor-pointer"
              >
                Next
              </button>
            </div>
          </div>

          {/* Table Action Buttons: DELETE, DOWNLOAD, CANCEL */}
          <div className="mt-4 flex flex-wrap items-center gap-2.5 rounded-lg border border-[#e7e7e7] bg-[#fafafa] p-2.5">
            <button
              type="button"
              onClick={handleDelete}
              className="rounded bg-[#ff823d] px-4 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-[#e56f2d] cursor-pointer"
            >
              DELETE
            </button>
            <button
              type="button"
              onClick={handleDownload}
              className="rounded bg-[#151d56] px-4 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-[#0e143d] cursor-pointer"
            >
              DOWNLOAD
            </button>
            <button
              type="button"
              onClick={handleCancel}
              className="rounded bg-[#151d56] px-4 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-[#0e143d] cursor-pointer"
            >
              CANCEL
            </button>
          </div>
        </section>

        {/* Right Column: Add/Edit Users Side Panel */}
        <section className="flex flex-col min-w-0">
          <div className="mb-2 text-xs font-bold uppercase tracking-wider text-[#999]">
            {activeUser ? "ADD/EDIT USER" : "ADD/EDIT USERS"}
          </div>

          {/* Side Panel Content Box */}
          <div className="flex-1 overflow-y-auto border border-[#ccc] bg-white p-3.5 min-h-[380px] max-h-[610px] text-xs space-y-3">
            {/* Top instruction box with 1px larger font and correct wording */}
            <div className="border border-[#e2e2e2] bg-[#f8f8f8] px-3 py-2 rounded-sm">
              <p className="text-[11px] font-bold uppercase tracking-wide text-[#555]">
                TYPE OR IMPORT USERS: FIRST LAST NAME, EMAIL
              </p>
            </div>

            {activeUser ? (
              /* Edit Mode when row is selected */
              <form onSubmit={handleSaveUserInfo} id="teamUserEditForm" className="space-y-3 text-[#555]">
                <h2 className="text-sm font-bold text-[#222]">
                  Edit: {activeUser.name}
                </h2>

                {/* Name field */}
                <div className="flex flex-col gap-1">
                  <label className="font-bold text-[#333]">Name:</label>
                  <input
                    type="text"
                    value={editFormData.name}
                    onChange={(e) =>
                      setEditFormData({ ...editFormData, name: e.target.value })
                    }
                    className="h-7 w-full rounded-sm border border-[#ccc] px-2 text-xs text-[#444] outline-none focus:border-[#ff823d]"
                    required
                  />
                </div>

                {/* Email field */}
                <div className="flex flex-col gap-1">
                  <label className="font-bold text-[#333]">Email:</label>
                  <input
                    type="email"
                    value={editFormData.email}
                    onChange={(e) =>
                      setEditFormData({ ...editFormData, email: e.target.value })
                    }
                    className="h-7 w-full rounded-sm border border-[#ccc] px-2 text-xs text-[#444] outline-none focus:border-[#ff823d]"
                    required
                  />
                </div>

                {/* Enrolled Checkbox */}
                <div className="flex items-center gap-2 pt-1">
                  <label className="font-bold text-[#333]">Enrolled:</label>
                  <label className="inline-flex items-center gap-1.5 cursor-pointer text-[#444]">
                    <input
                      type="checkbox"
                      checked={editFormData.enrolled}
                      onChange={(e) =>
                        setEditFormData({ ...editFormData, enrolled: e.target.checked })
                      }
                      className="accent-[#ff823d] cursor-pointer"
                    />
                    <span>{editFormData.enrolled ? "Yes (Enrolled)" : "No (Not enrolled)"}</span>
                  </label>
                </div>
              </form>
            ) : (
              /* Default Add Mode */
              <form onSubmit={handleAddUser} id="teamUserAddForm" className="space-y-3 text-[#555]">
                <h2 className="text-sm font-bold text-[#222]">
                  Add New Team User
                </h2>

                {/* Name field */}
                <div className="flex flex-col gap-1">
                  <label className="font-bold text-[#333]">First & Last Name:</label>
                  <input
                    type="text"
                    placeholder="e.g. John Doe"
                    value={addFormData.name}
                    onChange={(e) =>
                      setAddFormData({ ...addFormData, name: e.target.value })
                    }
                    className="h-7 w-full rounded-sm border border-[#ccc] px-2 text-xs text-[#444] outline-none focus:border-[#ff823d]"
                    required
                  />
                </div>

                {/* Email field */}
                <div className="flex flex-col gap-1">
                  <label className="font-bold text-[#333]">Email Address:</label>
                  <input
                    type="email"
                    placeholder="e.g. johndoe@company.com"
                    value={addFormData.email}
                    onChange={(e) =>
                      setAddFormData({ ...addFormData, email: e.target.value })
                    }
                    className="h-7 w-full rounded-sm border border-[#ccc] px-2 text-xs text-[#444] outline-none focus:border-[#ff823d]"
                    required
                  />
                </div>

                {/* Enrolled Checkbox */}
                {/* <div className="flex items-center gap-2 pt-1">
                  <label className="font-bold text-[#333]">Enrolled:</label>
                  <label className="inline-flex items-center gap-1.5 cursor-pointer text-[#444]">
                    <input
                      type="checkbox"
                      checked={addFormData.enrolled}
                      onChange={(e) =>
                        setAddFormData({ ...addFormData, enrolled: e.target.checked })
                      }
                      className="accent-[#ff823d] cursor-pointer"
                    />
                    <span>{addFormData.enrolled ? "Yes (Enrolled)" : "No (Not enrolled)"}</span>
                  </label>
                </div> */}
              </form>
            )}
          </div>

          {/* Under box: users remaining & Upgrade Plan Link */}
          <div className="flex flex-wrap items-center justify-between border-b border-[#eee] py-2 text-xs text-[#777]">
            <span>{users.length} out of 500 total users remaining</span>
            <button
              type="button"
              onClick={() => navigate("/dashboard/manage/plan")}
              className="text-[#1d2464] font-medium underline hover:text-[#ff823d] cursor-pointer"
            >
              Upgrade plan
            </button>
          </div>

          {/* Side Panel Action Buttons */}
          <div className="mt-4 flex flex-wrap items-center gap-2.5 rounded-lg border border-[#e7e7e7] bg-[#fafafa] p-2.5">
            {activeUser ? (
              <>
                <button
                  type="submit"
                  form="teamUserEditForm"
                  className="rounded bg-[#ff823d] px-5 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-[#e56f2d] cursor-pointer"
                >
                  SAVE
                </button>
                <button
                  type="button"
                  onClick={handleCancelUserInfo}
                  className="rounded bg-[#151d56] px-5 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-[#0e143d] cursor-pointer"
                >
                  CANCEL
                </button>
              </>
            ) : (
              <>
                <button
                  type="submit"
                  form="teamUserAddForm"
                  className="rounded bg-[#ff823d] px-5 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-[#e56f2d] cursor-pointer"
                >
                  SEND INVITE
                </button>
                <button
                  type="button"
                  onClick={() => setImportOpen(true)}
                  className="rounded bg-[#151d56] px-4 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-[#0e143d] cursor-pointer flex items-center gap-1.5"
                >
                  <Upload size={13} />
                  IMPORT
                </button>
                <button
                  type="button"
                  onClick={() => setAddFormData({ name: "", email: "", enrolled: true })}
                  className="rounded bg-[#666] px-4 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-[#555] cursor-pointer"
                >
                  CANCEL
                </button>
              </>
            )}
          </div>
        </section>
      </div>

      {/* CSV Import Modal */}
      {importOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div
            role="dialog"
            aria-modal="true"
            className="w-full max-w-sm rounded border border-[#ccc] bg-white p-5 shadow-lg"
          >
            <div className="mb-4 flex justify-between">
              <h2 className="font-semibold text-[#444]">Import team users</h2>
              <button
                type="button"
                onClick={() => setImportOpen(false)}
                aria-label="Close import dialog"
                className="text-[#666] hover:text-[#111] cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>
            <p className="mb-4 text-xs text-[#666]">
              Choose a CSV file containing name and email columns.
            </p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-2 rounded bg-[#ff823d] px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-[#e56f2d] cursor-pointer"
              >
                <Upload size={14} />
                Choose CSV
              </button>
              <button
                type="button"
                onClick={() => setImportOpen(false)}
                className="cursor-pointer rounded border border-[#bbb] px-3.5 py-1.5 text-xs font-semibold text-[#555] hover:bg-[#f0f0f0]"
              >
                Cancel
              </button>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,text/csv"
              onChange={handleImportCsv}
              className="hidden"
            />
          </div>
        </div>
      )}
    </main>
  );
};

export default TeamUser;
