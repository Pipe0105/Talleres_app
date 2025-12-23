import PageHeader from "../PageHeader";
import { render, screen } from "../../test-utils";

describe("PageHeader", () => {
  it("renders the title, description, and action content", () => {
    render(
      <PageHeader
        title="Gestión de talleres"
        description="Revisa el estado de los talleres activos."
        action={<button>Crear taller</button>}
      />
    );

    expect(screen.getByText("Panel en línea")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Gestión de talleres" })).toBeInTheDocument();
    expect(screen.getByText("Revisa el estado de los talleres activos.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Crear taller" })).toBeInTheDocument();
  });
});
