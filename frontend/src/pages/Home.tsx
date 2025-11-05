const Home = () => {
  return (
    <section className="space-y-6">
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-2xl font-semibold text-slate-800">
          Bienvenido al panel de Talleres
        </h2>
        <p className="mt-3 text-sm leading-relaxed text-slate-600">
          Este panel consume el JSON mockeado expuesto mediante json-server.
          Desde aquí podrás explorar los talleres registrados, revisar sus
          archivos asociados, verificar precios de productos y generar nuevos
          registros de manera simulada.
        </p>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <h3 className="text-lg font-semibold text-brand-700">Mock API</h3>
          <p className="mt-2 text-sm text-slate-600">
            Utiliza{" "}
            <code className="rounded bg-slate-100 px-1 py-0.5">
              json-server
            </code>
            sobre{" "}
            <code className="rounded bg-slate-100 px-1 py-0.5">
              frontend/mock/db.json
            </code>
            para entregar los datos de talleres, productos, precios y archivos.
          </p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <h3 className="text-lg font-semibold text-brand-700">Tailwind CSS</h3>
          <p className="mt-2 text-sm text-slate-600">
            La interfaz está construida con Tailwind para prototipar rápidamente
            tarjetas, tablas y formularios sin definir CSS adicional.
          </p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <h3 className="text-lg font-semibold text-brand-700">React Router</h3>
          <p className="mt-2 text-sm text-slate-600">
            Navega entre la página de inicio y el tablero de talleres utilizando
            rutas cliente simples.
          </p>
        </div>
      </div>
    </section>
  );
};

export default Home;
