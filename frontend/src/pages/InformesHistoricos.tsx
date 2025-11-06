import { useMemo, useState } from "react";
import {
  Box,
  Button,
  Chip,
  Divider,
  FormControl,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";

interface HistoricalReport {
  id: number;
  title: string;
  sede: string;
  fecha: string;
  responsable: string;
  estado: "Generado" | "Pendiente" | "Revisado";
  categoria: "Productividad" | "Seguridad" | "Calidad";
  resumen: string;
}

const REPORTS: HistoricalReport[] = [
  {
    id: 1,
    title: "Informe Productividad Q1 2024",
    sede: "Sede Central",
    fecha: "2024-03-31",
    responsable: "María González",
    estado: "Generado",
    categoria: "Productividad",
    resumen:
      "Análisis de la eficiencia operativa y cumplimiento de metas para el primer trimestre de 2024.",
  },
  {
    id: 2,
    title: "Reporte Auditoría Seguridad 2023",
    sede: "Sede Norte",
    fecha: "2023-11-15",
    responsable: "Luis Ramírez",
    estado: "Revisado",
    categoria: "Seguridad",
    resumen:
      "Resultados de la auditoría anual de seguridad industrial y planes de acción implementados.",
  },
  {
    id: 3,
    title: "Indicadores de Calidad Semestral",
    sede: "Sede Central",
    fecha: "2023-07-10",
    responsable: "Ana Pérez",
    estado: "Generado",
    categoria: "Calidad",
    resumen:
      "Resumen de indicadores de calidad de procesos y satisfacción de clientes internos.",
  },
  {
    id: 4,
    title: "Informe de Productividad Talleres Técnicos",
    sede: "Sede Sur",
    fecha: "2024-01-20",
    responsable: "Juan Ortiz",
    estado: "Pendiente",
    categoria: "Productividad",
    resumen:
      "Evaluación de talleres técnicos y rendimiento del personal especializado del último semestre.",
  },
  {
    id: 5,
    title: "Reporte de Seguridad Taller Mecánico",
    sede: "Sede Norte",
    fecha: "2024-02-12",
    responsable: "Carolina López",
    estado: "Generado",
    categoria: "Seguridad",
    resumen:
      "Control de incidentes y actividades de capacitación en seguridad del taller mecánico.",
  },
];

const InformesHistoricos = () => {
  const [search, setSearch] = useState("");
  const [selectedSede, setSelectedSede] = useState<string>("Todas");
  const [selectedEstado, setSelectedEstado] = useState<string>("Todos");
  const [selectedCategoria, setSelectedCategoria] = useState<string>("Todas");

  const uniqueSedes = useMemo(
    () => ["Todas", ...new Set(REPORTS.map((report) => report.sede))],
    []
  );

  const uniqueEstados = useMemo(
    () => ["Todos", ...new Set(REPORTS.map((report) => report.estado))],
    []
  );

  const uniqueCategorias = useMemo(
    () => ["Todas", ...new Set(REPORTS.map((report) => report.categoria))],
    []
  );

  const filteredReports = useMemo(() => {
    return REPORTS.filter((report) => {
      const matchesSearch =
        search.trim().length === 0 ||
        report.title.toLowerCase().includes(search.toLowerCase()) ||
        report.responsable.toLowerCase().includes(search.toLowerCase());

      const matchesSede =
        selectedSede === "Todas" || report.sede === selectedSede;

      const matchesEstado =
        selectedEstado === "Todos" || report.estado === selectedEstado;

      const matchesCategoria =
        selectedCategoria === "Todas" || report.categoria === selectedCategoria;

      return matchesSearch && matchesSede && matchesEstado && matchesCategoria;
    }).sort(
      (a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime()
    );
  }, [search, selectedSede, selectedEstado, selectedCategoria]);

  const handleDownloadReport = (report: HistoricalReport) => {
    const content = `Informe: ${report.title}\nSede: ${report.sede}\nFecha: ${report.fecha}\nResponsable: ${report.responsable}\nEstado: ${report.estado}\nCategoría: ${report.categoria}\nResumen: ${report.resumen}`;

    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${report.title.replace(/\s+/g, "_")}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadFiltered = () => {
    const headers = [
      "Título",
      "Sede",
      "Fecha",
      "Responsable",
      "Estado",
      "Categoría",
      "Resumen",
    ];

    const rows = filteredReports.map((report) =>
      [
        report.title,
        report.sede,
        report.fecha,
        report.responsable,
        report.estado,
        report.categoria,
        report.resumen,
      ]
        .map((value) => `"${value.replace(/"/g, '""')}"`)
        .join(",")
    );

    const csv = [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "informes_historicos.csv";
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Stack spacing={3}>
      <Paper sx={{ p: { xs: 3, md: 4 } }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Informes Históricos
        </Typography>
        <Typography variant="body1" color="text.secondary" gutterBottom>
          Accede a los informes históricos de talleres realizados en las sedes.
          Aquí podrás generar reportes detallados que te permitirán analizar el
          Organiza, filtra y descarga los reportes que necesitas para tus
          análisis.
        </Typography>
        <Divider sx={{ my: 3 }} />

        <Stack
          direction={{ xs: "column", md: "row" }}
          spacing={2}
          alignItems={{ md: "flex-end" }}
        >
          <TextField
            label="Buscar por título o responsable"
            variant="outlined"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            sx={{ flex: 1 }}
          />

          <FormControl sx={{ minWidth: 160 }}>
            <InputLabel id="sede-filter-label">Sede</InputLabel>
            <Select
              labelId="sede-filter-label"
              label="Sede"
              value={selectedSede}
              onChange={(event) => setSelectedSede(event.target.value)}
            >
              {uniqueSedes.map((sede) => (
                <MenuItem key={sede} value={sede}>
                  {sede}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl sx={{ minWidth: 160 }}>
            <InputLabel id="estado-filter-label">Estado</InputLabel>
            <Select
              labelId="estado-filter-label"
              label="Estado"
              value={selectedEstado}
              onChange={(event) => setSelectedEstado(event.target.value)}
            >
              {uniqueEstados.map((estado) => (
                <MenuItem key={estado} value={estado}>
                  {estado}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl sx={{ minWidth: 180 }}>
            <InputLabel id="categoria-filter-label">Categoría</InputLabel>
            <Select
              labelId="categoria-filter-label"
              label="Categoría"
              value={selectedCategoria}
              onChange={(event) => setSelectedCategoria(event.target.value)}
            >
              {uniqueCategorias.map((categoria) => (
                <MenuItem key={categoria} value={categoria}>
                  {categoria}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Stack>

        <Stack
          direction={{ xs: "column", sm: "row" }}
          justifyContent="space-between"
          alignItems={{ xs: "flex-start", sm: "center" }}
          spacing={2}
          sx={{ mt: 3 }}
        >
          <Typography variant="body2" color="text.secondary">
            {filteredReports.length} informe(s) encontrados.
          </Typography>
          <Button
            variant="contained"
            color="primary"
            disabled={filteredReports.length === 0}
            onClick={handleDownloadFiltered}
          >
            Descargar listado filtrado (CSV)
          </Button>
        </Stack>
      </Paper>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Título</TableCell>
              <TableCell>Sede</TableCell>
              <TableCell>Fecha</TableCell>
              <TableCell>Responsable</TableCell>
              <TableCell>Estado</TableCell>
              <TableCell>Categoría</TableCell>
              <TableCell align="center">Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredReports.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7}>
                  <Box textAlign="center" py={4}>
                    <Typography variant="body1" color="text.secondary">
                      No se encontraron informes con los filtros seleccionados.
                    </Typography>
                  </Box>
                </TableCell>
              </TableRow>
            ) : (
              filteredReports.map((report) => (
                <TableRow key={report.id} hover>
                  <TableCell>
                    <Stack spacing={0.5}>
                      <Typography variant="subtitle1" fontWeight={600}>
                        {report.title}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {report.resumen}
                      </Typography>
                    </Stack>
                  </TableCell>
                  <TableCell>{report.sede}</TableCell>
                  <TableCell>
                    {new Date(report.fecha).toLocaleDateString("es-ES")}
                  </TableCell>
                  <TableCell>{report.responsable}</TableCell>
                  <TableCell>
                    <Chip
                      label={report.estado}
                      color={
                        report.estado === "Generado"
                          ? "success"
                          : report.estado === "Pendiente"
                          ? "warning"
                          : "default"
                      }
                      size="small"
                    />
                  </TableCell>
                  <TableCell>{report.categoria}</TableCell>
                  <TableCell align="center">
                    <Button
                      variant="outlined"
                      size="small"
                      onClick={() => handleDownloadReport(report)}
                    >
                      Descargar
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Stack>
  );
};

export default InformesHistoricos;
