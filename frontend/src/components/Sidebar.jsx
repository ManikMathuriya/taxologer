import { Link, useLocation, useNavigate } from "react-router-dom";

const userMenu = [
  { to: "/dashboard", label: "Dashboard" },
  { to: "/packages", label: "Packages" },
  { to: "/my-requests", label: "My Requests" },
  { to: "/profile", label: "Profile" },
];

const adminMenu = [
  { to: "/admin/dashboard", label: "Admin Dashboard" },
  { to: "/admin/requests", label: "Manage Requests" },
  { to: "/profile", label: "Profile" },
];

export default function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();

  const role = localStorage.getItem("role");
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const menu = role === "ADMIN" ? adminMenu : userMenu;

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("refresh");
    localStorage.removeItem("role");
    localStorage.removeItem("user");
    navigate("/login");
  };

  return (
    <aside className="w-full md:w-72 bg-slate-950 text-white p-5 flex flex-col gap-6 md:min-h-screen">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Taxologer</h1>
        <p className="text-sm text-slate-300 mt-2">
          Hi, {user?.name || user?.username || "User"}
        </p>
      </div>

      <nav className="flex flex-col gap-2">
        {menu.map((item) => {
          const active = location.pathname === item.to;

          return (
            <Link
              key={item.to}
              to={item.to}
              className={`rounded-xl px-4 py-3 transition ${
                active
                  ? "bg-blue-600 text-white"
                  : "bg-slate-900 text-slate-200 hover:bg-slate-800"
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>

      <button
        onClick={handleLogout}
        className="mt-auto rounded-xl bg-white/10 px-4 py-3 text-left hover:bg-white/20"
      >
        Logout
      </button>
    </aside>
  );
}