import { useEffect, useMemo, useRef, useState } from "react";
import { History, Pencil, Upload, X } from "lucide-react";
import { useNavigate } from "react-router";

const initialUsers = [
  ["Ethan Caldwell", "ethancaldwell@gmail.com", true],
  ["Marcus Bennett", "marcusbennett@yahoo.com", true],
  ["Daniel Reed", "danielreed@outlook.com", true],
  ["Nathan Parker", "nathanparker@hotmail.com", false],
  ["Lucas Foster", "lucasfoster@icloud.com", true],
  ["Adrian Collins", "adriancollins@gmail.com", true],
  ["Caleb Brooks", "calebbrooks@yahoo.com", true],
  ["Julian Ramirez", "julianramirez@outlook.com", true],
  ["Owen Mitchell", "owenmitchell@hotmail.com", false],
  ["Miles Sullivan", "milessullivan@icloud.com", true],
  ["Simon Turner", "simonturner@gmail.com", true],
  ["Henry Morgan", "henrymorgan@yahoo.com", true],
  ["Noah Harrison", "noahharrison@outlook.com", true],
  ["Liam Jenkins", "liamjenkins@hotmail.com", false],
  ["Samuel Hayes", "samuelhayes@icloud.com", true],
  ["Benjamin Cooper", "benjamincooper@gmail.com", true],
  ["Isaac Richardson", "isaacrichardson@yahoo.com", true],
  ["Thomas Thompson", "thomasthompson@outlook.com", true],
  ["Jack Anderson", "jackanderson@hotmail.com", true],
  ["Leo Carter", "leocarter@icloud.com", false],
];

const initialAvailable = [
  ["Landon Pierce", "landonpierce@gmail.com"],
  ["Derek Lawson", "dereklawson@yahoo.com"],
  ["Trevor Miles", "trevormiles@outlook.com"],
  ["Colin Mercer", "colinmercer@hotmail.com"],
  ["Brandon Keller", "brandonkeller@icloud.com"],
  ["Evan Rhodes", "evanrhodes@gmail.com"],
  ["Gavin Porter", "gavinporter@yahoo.com"],
  ["Mason Clarke", "masonclarke@outlook.com"],
  ["Tyler Benson", "tylerbenson@hotmail.com"],
  ["Jordan Reeves", "jordanreeves@icloud.com"],
  ["Cameron Ellis", "cameronellis@gmail.com"],
  ["Austin Grant", "austingrant@yahoo.com"],
  ["Blake Warren", "blakewarren@outlook.com"],
];

const TeamUser = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const [users, setUsers] = useState(initialUsers);
  const [availableUsers, setAvailableUsers] = useState(initialAvailable);
  const [selected, setSelected] = useState([]);
  const [filterInput, setFilterInput] = useState("All");
  const [filter, setFilter] = useState("All");
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [editUser, setEditUser] = useState(null);
  const [importOpen, setImportOpen] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const syncEnrollment = (event) => {
      if (event.key !== "team-users-enrollment" || !event.newValue) return;
      const update = JSON.parse(event.newValue);
      setUsers((current) =>
        current.map((user) =>
          user[1] === update.email ? [user[0], user[1], update.enrolled] : user,
        ),
      );
    };
    window.addEventListener("storage", syncEnrollment);
    return () => window.removeEventListener("storage", syncEnrollment);
  }, []);

  const visibleUsers = useMemo(
    () =>
      users.filter(([name, email, enrolled]) => {
        const matchesFilter =
          filter === "All" || (filter === "Yes" ? enrolled : !enrolled);
        return (
          matchesFilter &&
          `${name} ${email}`.toLowerCase().includes(search.toLowerCase())
        );
      }),
    [filter, search, users],
  );
  const selectedVisible =
    visibleUsers.every((user) => selected.includes(users.indexOf(user))) &&
    visibleUsers.length > 0;
  const enrolledTotal = users.filter((user) => user[2]).length;
  const showMessage = (text) => {
    setMessage(text);
    window.setTimeout(() => setMessage(""), 2400);
  };
  const toggleAll = (checked) =>
    setSelected(checked ? visibleUsers.map((user) => users.indexOf(user)) : []);
  const removeSelected = () => {
    setUsers((current) =>
      current.filter((_, index) => !selected.includes(index)),
    );
    setSelected([]);
    showMessage("Selected users and their access were removed");
  };
  const downloadCsv = () => {
    const csv = [["Name", "Email", "Enrolled"], ...visibleUsers]
      .map((row) =>
        row
          .map((value) => `"${String(value).replaceAll('"', '""')}"`)
          .join(","),
      )
      .join("\n");
    const link = document.createElement("a");
    link.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    link.download = "team-users.csv";
    link.click();
    URL.revokeObjectURL(link.href);
  };
  const saveEdit = (event) => {
    event.preventDefault();
    setUsers((current) =>
      current.map((user) =>
        user[1] === editUser.originalEmail
          ? [editUser.name, editUser.email, editUser.enrolled]
          : user,
      ),
    );
    setEditUser(null);
    showMessage("User details updated");
  };
  const importCsv = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const rows = String(reader.result)
        .split(/\r?\n/)
        .slice(1)
        .map((row) =>
          row.split(",").map((value) => value.trim().replace(/^"|"$/g, "")),
        )
        .filter((row) => row[0] && row[1]);
      setAvailableUsers(rows.map(([name, email]) => [name, email]));
      setImportOpen(false);
      showMessage(`${rows.length} users imported`);
    };
    reader.readAsText(file);
    event.target.value = "";
  };
  const addImported = () => {
    setUsers((current) => [
      ...current,
      ...availableUsers.map(([name, email]) => [name, email, false]),
    ]);
    setAvailableUsers([]);
    showMessage("Imported users added to the list");
  };

  return (
    <main className="team-users-page min-h-full  px-2 py-3 text-sm text-[#777] md:px-5 md:py-4">
      <h1 className="mb-4 text-xl font-normal text-[#999]">
        Manage team users
      </h1>
      <div className="mb-4 space-y-1 font-semibold text-[#333]">
        <p>Plan: Up to 500 users</p>
        <p>Total in list: {users.length}</p>
        <p>Enrolled user total: {enrolledTotal}</p>
      </div>
      <div className="grid gap-4 xl:grid-cols-[1.45fr_1fr]">
        <section className="min-w-0">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <label>
              Filter:{" "}
              <select
                value={filterInput}
                onChange={(event) => setFilterInput(event.target.value)}
                className="ml-1 h-7 w-20 border border-[#ccc] bg-white px-1"
              >
                <option>All</option>
                <option>Yes</option>
                <option>No</option>
              </select>
            </label>
            <button
              type="button"
              onClick={() => setFilter(filterInput)}
              className="h-7 rounded border border-[#ccc] bg-[#f4f4f4] px-2 cursor-pointer"
            >
              Go
            </button>
            <label className="ml-auto">
              Search:{" "}
              <input
                value={searchInput}
                onChange={(event) => setSearchInput(event.target.value)}
                className="ml-1 h-7 w-32 border border-[#ccc] px-2 outline-none md:w-40"
              />
            </label>
            <button
              type="button"
              onClick={() => setSearch(searchInput.trim())}
              className="h-7 rounded border border-[#ccc] bg-[#f4f4f4] px-2 cursor-pointer"
            >
              Go
            </button>
          </div>
          <div className="overflow-x-auto border border-[#eee]">
            <table className="w-full min-w-[590px] border-collapse text-left">
              <thead>
                <tr className="h-8 bg-[#f3f3f3] uppercase text-[#999]">
                  <th className="w-7 px-1">
                    <input
                      type="checkbox"
                      checked={selectedVisible}
                      onChange={(event) => toggleAll(event.target.checked)}
                      aria-label="Select visible team users"
                    />
                  </th>
                  <th className="px-2">Name</th>
                  <th className="px-2">Email</th>
                  <th className="px-2">Enrolled</th>
                  <th className="w-9 px-1">Edit</th>
                  <th className="w-12 px-1">Route history</th>
                </tr>
              </thead>
              <tbody>
                {visibleUsers.map((user) => {
                  const index = users.indexOf(user);
                  return (
                    <tr
                      key={user[1]}
                      className="h-8 border-b border-white even:bg-[#f7f7f7]"
                    >
                      <td className="px-1">
                        <input
                          type="checkbox"
                          checked={selected.includes(index)}
                          onChange={() =>
                            setSelected((current) =>
                              current.includes(index)
                                ? current.filter((item) => item !== index)
                                : [...current, index],
                            )
                          }
                          aria-label={`Select ${user[0]}`}
                        />
                      </td>
                      <td className="px-2">{user[0]}</td>
                      <td className="px-2">{user[1]}</td>
                      <td className="px-2">{user[2] ? "Yes" : "No"}</td>
                      <td className="px-1">
                        <button
                          type="button"
                          onClick={() =>
                            setEditUser({
                              name: user[0],
                              email: user[1],
                              originalEmail: user[1],
                              enrolled: user[2],
                            })
                          }
                          aria-label={`Edit ${user[0]}`}
                        >
                          <Pencil size={17} />
                        </button>
                      </td>
                      <td className="px-1">
                        <button
                          type="button"
                          onClick={() =>
                            navigate(
                              `/dashboard/manage/team-route-history`,
                            )
                          }
                          aria-label={`Route history for ${user[0]}`}
                        >
                          <History size={18} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="flex flex-wrap justify-between border-b border-[#eee] py-2">
            <span>
              {selected.length} of {users.length} selected
            </span>
            <span>
              1-{visibleUsers.length} of {users.length} users
            </span>
            <span className="underline">
              Previous&nbsp; 1&nbsp; 2&nbsp; 3&nbsp; Next
            </span>
          </div>
          <div className="mt-4 flex gap-2 rounded-lg border border-[#e7e7e7] bg-[#fafafa] p-2">
            <button
              type="button"
              onClick={removeSelected}
              className="rounded bg-[#ff823d] px-3 py-1.5 text-white cursor-pointer"
            >
              REMOVE
            </button>
            <button
              type="button"
              onClick={downloadCsv}
              className="rounded bg-[#151d56] px-3 py-1.5 text-white cursor-pointer"
            >
              DOWNLOAD
            </button>
            <button
              type="button"
              onClick={() => {
                setFilterInput("All");
                setFilter("All");
                setSearchInput("");
                setSearch("");
                setSelected([]);
              }}
              className="rounded bg-[#151d56] px-3 py-1.5 text-white cursor-pointer"
            >
              CANCEL
            </button>
          </div>
        </section>
        <section className="min-w-0">
          <h2 className="mb-2 font-bold text-[#333]">Add/Edit Users</h2>
          <div className="border border-[#eee]">
            <div className="flex items-center border-b border-[#eee] px-3">
              <input
                placeholder="TYPE OR IMPORT USERS: FIRST NAME, EMAIL"
                className="h-9 w-full text-[10px] uppercase outline-none placeholder:text-[#aaa]"
                readOnly
              />
              <button
                type="button"
                onClick={() => setAvailableUsers([])}
                aria-label="Clear imported users"
              >
                <X size={14} />
              </button>
            </div>
            <div className="h-[520px] overflow-y-auto px-3">
              {availableUsers.map(([name, email]) => (
                <button
                  type="button"
                  key={email}
                  onClick={() =>
                    setEditUser({
                      name,
                      email,
                      originalEmail: email,
                      enrolled: false,
                    })
                  }
                  className="block w-full py-2 text-left hover:text-[#ff823d]"
                >
                  {name}, {email}
                </button>
              ))}
            </div>
          </div>
          <div className="flex flex-wrap items-center justify-between border-b border-[#eee] py-2">
            <span>{availableUsers.length} out of 62 total users remaining</span>
            <button
              type="button"
              onClick={() => navigate("/dashboard")}
              className="underline"
            >
              Upgrade plan
            </button>
          </div>
          <div className="mt-4 flex gap-2 rounded-lg border border-[#e7e7e7] bg-[#fafafa] p-2">
            <button
              type="button"
              onClick={() => setImportOpen(true)}
              className="rounded bg-[#ff823d] px-3 py-1.5 text-white cursor-pointer" 
            >
              IMPORT
            </button>
            <button
              type="button"
              onClick={addImported}
              className="rounded bg-[#ff823d] px-3 py-1.5 text-white cursor-pointer"
            >
              ADD
            </button>
            <button
              type="button"
              onClick={() => setAvailableUsers([])}
              className="rounded bg-[#151d56] px-3 py-1.5 text-white cursor-pointer"
            >
              CANCEL
            </button>
          </div>
        </section>
      </div>
      {message && (
        <p
          role="status"
          className="fixed bottom-5 right-5 rounded bg-[#151d56] px-4 py-2 text-white shadow-lg"
        >
          {message}
        </p>
      )}
      {editUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <form
            onSubmit={saveEdit}
            className="w-full max-w-sm rounded border border-[#ccc] bg-white p-5 shadow-lg"
          >
            <div className="mb-4 flex justify-between">
              <h2 className="font-semibold text-[#444]">Edit user</h2>
              <button
                type="button"
                onClick={() => setEditUser(null)}
                aria-label="Close edit dialog"
              >
                <X size={18} />
              </button>
            </div>
            <label className="mb-3 block">
              Name
              <input
                value={editUser.name}
                onChange={(event) =>
                  setEditUser({ ...editUser, name: event.target.value })
                }
                className="mt-1 h-9 w-full border border-[#ccc] px-2"
                required
              />
            </label>
            <label className="mb-3 block">
              Email
              <input
                type="email"
                value={editUser.email}
                onChange={(event) =>
                  setEditUser({ ...editUser, email: event.target.value })
                }
                className="mt-1 h-9 w-full border border-[#ccc] px-2"
                required
              />
            </label>
            <label className="mb-4 flex items-center gap-2">
              <input
                type="checkbox"
                checked={editUser.enrolled}
                onChange={(event) =>
                  setEditUser({ ...editUser, enrolled: event.target.checked })
                }
              />{" "}
              Enrolled
            </label>
            <div className="flex gap-2">
              <button
                type="submit"
                className="rounded bg-[#ff823d] px-3 py-1.5 text-white"
              >
                SAVE
              </button>
              <button
                type="button"
                onClick={() => setEditUser(null)}
                className="rounded border border-[#bbb] px-3 py-1.5"
              >
                CANCEL
              </button>
            </div>
          </form>
        </div>
      )}
      {importOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div
            role="dialog"
            aria-modal="true"
            className="w-full max-w-sm rounded border border-[#ccc] bg-white p-5 shadow-lg"
          >
            <div className="mb-4 flex justify-between">
              <h2 className="font-semibold text-[#444]">Import users</h2>
              <button
                type="button"
                onClick={() => setImportOpen(false)}
                aria-label="Close import dialog"
              >
                <X size={18} />
              </button>
            </div>
            <p className="mb-4 text-sm">
              Choose a CSV file containing name and email columns.
            </p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-2 rounded bg-[#ff823d] px-3 py-1.5 text-white"
              >
                <Upload size={15} />
                Choose CSV
              </button>
              <button
                type="button"
                onClick={() => setImportOpen(false)}
                className="cursor-pointer rounded border border-[#bbb] px-3 py-1.5"
              >
                Cancel
              </button>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,text/csv"
              onChange={importCsv}
              className="hidden"
            />
          </div>
        </div>
      )}
    </main>
  );
};

export default TeamUser;
