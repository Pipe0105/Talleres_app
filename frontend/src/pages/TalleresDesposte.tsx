import TallerWorkflow from "../components/TallerWorkflow";

const TalleresDesposte = () => (
  <TallerWorkflow
    title="Flujo guiado de talleres"
    description="Sigue los pasos para registrar los cortes de un material, validar los pesos y obtener el cálculo generado por la API en segundos."
    emptyMessage="No se han registrado talleres en la plataforma todavía. Crea uno para visualizar el detalle de los cortes."
  />
);

export default TalleresDesposte;
