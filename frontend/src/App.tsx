import { NavLink, Route, Routes } from "react-router-dom";
import Home from "./pages/Home";
import Talleres from "./pages/Talleres";

const App = () => {
  return (
    <div className="min-h-screen">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div>
            <h1 className="text-xl font-semibold text-brand-700">
              Talleres Cárnicos
            </h1>
            <p className="text-sm text-slate-500">
              Panel para visualizar y registrar talleres usando el mock JSON
            </p>
          </div>
          <nav className="flex gap-4 text-sm font-medium text-slate-600">
            <NavLink
              to="/"
              end
              className={({ isActive }) =>
                `rounded px-3 py-2 transition hover:bg-brand-50 hover:text-brand-700 ${
                  isActive ? "bg-brand-100 text-brand-700" : ""
                }`
              }
            >
              Inicio
            </NavLink>
            <NavLink
              to="/talleres"
              className={({ isActive }) =>
                `rounded px-3 py-2 transition hover:bg-brand-50 hover:text-brand-700 ${
                  isActive ? "bg-brand-100 text-brand-700" : ""
                }`
              }
            >
              Talleres
            </NavLink>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-6 py-8">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/talleres" element={<Talleres />} />
        </Routes>
      </main>
    </div>
  );
};

export default App;
