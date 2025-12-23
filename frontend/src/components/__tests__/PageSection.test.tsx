import PageSection from "../PageSection";
import { render, screen } from "../../test-utils";

describe("PageSection", () => {
  it("shows title, description, actions, and children", () => {
    render(
      <PageSection
        title="Resumen"
        description="Indicadores de la semana"
        actions={<button>Ver detalles</button>}
      >
        <div>Contenido principal</div>
      </PageSection>
    );

    expect(screen.getByRole("heading", { name: "Resumen" })).toBeInTheDocument();
    expect(screen.getByText("Indicadores de la semana")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Ver detalles" })).toBeInTheDocument();
    expect(screen.getByText("Contenido principal")).toBeInTheDocument();
  });

  it("renders only children when header props are omitted", () => {
    render(
      <PageSection>
        <div>Solo contenido</div>
      </PageSection>
    );

    expect(screen.getByText("Solo contenido")).toBeInTheDocument();
    expect(screen.queryByRole("heading")).not.toBeInTheDocument();
  });
});
