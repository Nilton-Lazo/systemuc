// src/pages/Report.js
import React, { useState, useEffect, useMemo, useRef } from 'react';
import axios from 'axios';
import Header from '../components/layout/Header';
import { useTable } from 'react-table';
import { useNavigate } from 'react-router-dom';
import { saveAs } from 'file-saver';
import ExcelJS from 'exceljs';
import '../assets/styles/Report.css';

const capitalizeFirstLetter = (str) => {
  if (!str || typeof str !== 'string') return "";
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};

const reorderName = (fullName) => {
  if (!fullName) return "";
  const words = fullName.trim().split(/\s+/);
  let result = "";
  if (words.length >= 4) {
    const surnames = words.slice(-2);
    const givenNames = words.slice(0, words.length - 2);
    result = [...surnames, ...givenNames].join(' ');
  } else if (words.length === 3) {
    const surnames = [words[2]];
    const givenNames = words.slice(0, 2);
    result = [...surnames, ...givenNames].join(' ');
  } else if (words.length === 2) {
    result = [words[1], words[0]].join(' ');
  } else {
    result = fullName;
  }
  return result.split(' ').map(word => capitalizeFirstLetter(word)).join(' ');
};

// Mapeos para mostrar textos amigables
const estadoMapping = {
  pendiente: "Pendiente",
  atendida: "Atendida",
  no_asistio: "No asistió",
  cancelada: "Cancelada",
  reprogramada: "Reprogramada"
};

const modalidadMapping = {
  presencial: "Presencial",
  semipresencial: "Semipresencial",
  a_distancia: "A distancia"
};

const tipoAtencionMapping = {
  virtual: "Virtual",
  presencial: "Presencial"
};

const medioContactoMapping = {
  boca_a_boca: "Oficina (boca a boca)",
  protocolo_de_salud_mental: "Protocolo de Salud Mental",
  entrevistas_de_vinculacion: "Entrevistas de Vinculación",
  correo_electronico: "Correo electrónico",
  talleres_preventivos: "Talleres preventivos",
  citas_automatizadas: "Citas Automatizadas",
  onboarding: "Onboarding",
  app_movil: "Aplicativo móvil"
};

const areaDerivacionMapping = {
  tutoria: "Tutoría",
  mentoria: "Mentoría",
  topico: "Tópico",
  personal: "Personal",
  CAS: "CAS",
  defensoria_universitaria: "Defensoría Universitaria",
  vinculacion_internacional: "Vinculación Internacional",
  docente: "Docente",
  protocolo_de_salud_mental: "Protocolo de Salud Mental",
  servicio_social: "Servicio Social"
};

const diagnosticoMapping = {
  familiar: "Familiar",
  academico: "Académico",
  agresivo_pasivo: "Agresivo/Pasivo (asertividad)",
  ansiedad: "Ansiedad",
  antisocial: "Antisocial",
  autoestima: "Autoestima",
  bipolar: "Bipolar",
  borderline: "Borderline",
  compulsivo_autocontrol: "Compulsivo / autocontrol",
  dependencia_videojuegos_internet: "Dependencia a videojuegos o internet",
  dependencia_alcohol_drogas: "Dependencia de alcohol o drogas",
  relacion_afectiva: "Dependiente (relaciones afectivas)",
  depresion: "Depresión",
  desorden_alimenticio: "Desorden alimenticio",
  duelo_fallecimiento: "Duelo por fallecimiento o pérdida",
  distimia: "Distimia",
  esquizoide: "Esquizoide",
  esquizotipico: "Esquizotípico",
  estres: "Estrés",
  histrionico: "Histriónico",
  ludopatia: "Ludopatía",
  narcisista: "Narcisista",
  orientacion_vocacional: "Orientación Vocacional",
  paranoide: "Paranoide",
  servicio_social: "Social",
  somatoformo: "Somatoformo",
  trabajo_o_laboral: "Trabajo o laboral"
};

// Opciones para filtro de fecha por año y mes
const AVAILABLE_YEARS = [2025];
const MONTHS = [
  { value: 0, label: "Enero" },
  { value: 1, label: "Febrero" },
  { value: 2, label: "Marzo" },
  { value: 3, label: "Abril" },
  { value: 4, label: "Mayo" },
  { value: 5, label: "Junio" },
  { value: 6, label: "Julio" },
  { value: 7, label: "Agosto" },
  { value: 8, label: "Septiembre" },
  { value: 9, label: "Octubre" },
  { value: 10, label: "Noviembre" },
  { value: 11, label: "Diciembre" },
];

// Componente para filtros de columna
const ColumnFilter = ({ id, title, options, selectedValues, onChange, mapping }) => {
  const [open, setOpen] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0 });
  const containerRef = useRef(null);
  const headerRef = useRef(null);

  const toggleOpen = () => {
    if (!open) {
      const rect = headerRef.current.getBoundingClientRect();
      setDropdownPosition({
        top: rect.bottom + 5,
        left: rect.left + rect.width / 2,
      });
    }
    setOpen(!open);
  };

  const toggleOption = (option) => {
    if (selectedValues.includes(option)) {
      onChange(selectedValues.filter(val => val !== option));
    } else {
      onChange([...selectedValues, option]);
    }
  };

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="column-filter" ref={containerRef}>
      <div className="filter-header" onClick={toggleOpen} ref={headerRef}>
        <span>{title}</span>
        {selectedValues.length > 0 && (
          <span className="filter-selected">
            {' (' + selectedValues.map(val => mapping ? (mapping[val] || capitalizeFirstLetter(val)) : capitalizeFirstLetter(val)).join(', ') + ')'}
          </span>
        )}
      </div>
      {open && (
        <div
          className="filter-dropdown"
          style={{
            position: 'fixed',
            top: dropdownPosition.top,
            left: dropdownPosition.left,
            transform: 'translateX(-50%)',
            zIndex: 9999,
            background: '#fff',
            border: '1px solid #8C68CE',
            borderRadius: '5px',
            minWidth: '120px',
            maxHeight: '300px',
            overflowY: 'auto',
            boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
            fontSize: '0.9rem',
            fontFamily: 'inherit',
            color: '#333'
          }}
        >
          {options.map(option => {
            const isSelected = selectedValues.includes(option);
            return (
              <div
                key={option}
                className="filter-dropdown-option"
                onClick={() => toggleOption(option)}
                style={{
                  backgroundColor: isSelected ? '#8C68CE' : 'transparent',
                  color: isSelected ? '#fff' : '#000',
                  padding: '5px 10px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center'
                }}
              >
                <span style={{ marginRight: '5px', flexShrink: 0, width: '20px' }}>•</span>
                <span>{mapping ? (mapping[option] || capitalizeFirstLetter(option)) : capitalizeFirstLetter(option)}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

const Report = ({ psicologo }) => {
  const navigate = useNavigate();

  // Filtros de columnas
  const [filters, setFilters] = useState({
    estado: [],
    carrera: [],
    ciclo: [],
    modalidad: [],
    sede: [],
    areaDerivacion: [],
    tipoAtencion: [],
    diagnostico: [],
    medioContacto: []
  });

  // Datos y opciones para columnas
  const [data, setData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [filterOptions, setFilterOptions] = useState({
    estado: [],
    carrera: [],
    ciclo: [],
    modalidad: [],
    sede: [],
    areaDerivacion: [],
    tipoAtencion: [],
    diagnostico: [],
    medioContacto: []
  });

  // NUEVOS filtros de FECHA: quedan dos opciones: input de "días personalizados" o selección de "año y mes"
  const [dateFilterType, setDateFilterType] = useState('none'); // 'customDays' o 'yearMonth' o 'none'
  const [customDays, setCustomDays] = useState('');
  const [selectedYears, setSelectedYears] = useState([]);
  const [selectedMonths, setSelectedMonths] = useState([]);

  // Manejo del input de días personalizados (solo números)
  const handleCustomDaysChange = (e) => {
    const val = e.target.value.replace(/\D/g, '');
    setCustomDays(val);
    if (val) {
      setDateFilterType('customDays');
      setSelectedYears([]);
      setSelectedMonths([]);
    } else {
      setDateFilterType('none');
    }
  };

  const handleToggleYear = (year) => {
    let newYears = selectedYears.includes(year)
      ? selectedYears.filter(y => y !== year)
      : [...selectedYears, year];
    setSelectedYears(newYears);
    if (newYears.length > 0 || selectedMonths.length > 0) {
      setDateFilterType('yearMonth');
      setCustomDays('');
    } else {
      setDateFilterType('none');
    }
  };

  const handleToggleMonth = (monthValue) => {
    let newMonths = selectedMonths.includes(monthValue)
      ? selectedMonths.filter(m => m !== monthValue)
      : [...selectedMonths, monthValue];
    setSelectedMonths(newMonths);
    if (selectedYears.length > 0 || newMonths.length > 0) {
      setDateFilterType('yearMonth');
      setCustomDays('');
    } else {
      setDateFilterType('none');
    }
  };

  // Obtener datos del backend
  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await axios.get(`${process.env.REACT_APP_PSI_API_URL}/reporte?psicologoId=${psicologo.id}`);
        setData(res.data.data);
        setFilteredData(res.data.data);
      } catch (err) {
        console.error('Error al obtener los datos del reporte:', err);
      }
    };
    if (psicologo?.id) {
      fetchData();
    }
  }, [psicologo.id]);

  // Extraer opciones únicas para filtros de columnas
  useEffect(() => {
    const extractOptions = (path) => {
      const parts = path.split('.');
      const values = data.map(item => {
        let val = item;
        parts.forEach(part => {
          val = val ? val[part] : undefined;
        });
        return val;
      }).filter(v => v != null);
      return Array.from(new Set(values));
    };

    setFilterOptions({
      estado: extractOptions('estado'),
      carrera: extractOptions('estudiante.carrera'),
      ciclo: extractOptions('estudiante.ciclo'),
      modalidad: extractOptions('estudiante.modalidad'),
      sede: extractOptions('estudiante.sede'),
      areaDerivacion: extractOptions('atencionCita.areaDerivacion'),
      tipoAtencion: extractOptions('tipo'),
      diagnostico: extractOptions('atencionCita.diagnosticoPresuntivo'),
      medioContacto: extractOptions('atencionCita.medioContacto')
    });
  }, [data]);

  const updateFilter = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const clearAllFilters = () => {
    setFilters({
      estado: [],
      carrera: [],
      ciclo: [],
      modalidad: [],
      sede: [],
      areaDerivacion: [],
      tipoAtencion: [],
      diagnostico: [],
      medioContacto: []
    });
    setDateFilterType('none');
    setCustomDays('');
    setSelectedYears([]);
    setSelectedMonths([]);
  };

  // Filtrado combinado: columnas + filtro de fecha
  useEffect(() => {
    let result = data;
    if (filters.estado.length > 0) {
      result = result.filter(item => filters.estado.includes(item.estado));
    }
    if (filters.carrera.length > 0) {
      result = result.filter(item => filters.carrera.includes(item.estudiante?.carrera));
    }
    if (filters.ciclo.length > 0) {
      result = result.filter(item => filters.ciclo.includes(String(item.estudiante?.ciclo)));
    }
    if (filters.modalidad.length > 0) {
      result = result.filter(item => filters.modalidad.includes(item.estudiante?.modalidad));
    }
    if (filters.sede.length > 0) {
      result = result.filter(item => filters.sede.includes(item.estudiante?.sede));
    }
    if (filters.areaDerivacion.length > 0) {
      result = result.filter(item => filters.areaDerivacion.includes(item.atencionCita?.areaDerivacion));
    }
    if (filters.tipoAtencion.length > 0) {
      result = result.filter(item => filters.tipoAtencion.includes(item.tipo));
    }
    if (filters.diagnostico.length > 0) {
      result = result.filter(item => filters.diagnostico.includes(item.atencionCita?.diagnosticoPresuntivo));
    }
    if (filters.medioContacto.length > 0) {
      result = result.filter(item => filters.medioContacto.includes(item.atencionCita?.medioContacto));
    }

    if (dateFilterType === 'customDays' && customDays) {
      const days = Number(customDays);
      const end = new Date();
      const start = new Date();
      start.setDate(end.getDate() - days);
      result = result.filter(item => {
        const fecha = new Date(item.fecha);
        return fecha >= start && fecha <= end;
      });
    } else if (dateFilterType === 'yearMonth') {
      if (selectedYears.length > 0) {
        result = result.filter(item => selectedYears.includes(new Date(item.fecha).getFullYear()));
      }
      if (selectedMonths.length > 0) {
        result = result.filter(item => selectedMonths.includes(new Date(item.fecha).getMonth()));
      }
    }
    setFilteredData(result);
  }, [data, filters, dateFilterType, customDays, selectedYears, selectedMonths]);

  // Función para exportar a Excel usando ExcelJS
  const exportToExcel = async () => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Reporte');

    worksheet.columns = [
      { header: 'ID', key: 'id', width: 10 },
      { header: 'Fecha', key: 'fecha', width: 15 },
      { header: 'Estado', key: 'estado', width: 15 },
      { header: 'Código', key: 'codigo', width: 15 },
      { header: 'Teléfono', key: 'telefono', width: 15 },
      { header: 'Apellidos y Nombres', key: 'nombre', width: 30 },
      { header: 'Carrera', key: 'carrera', width: 20 },
      { header: 'Ciclo', key: 'ciclo', width: 10 },
      { header: 'Modalidad', key: 'modalidad', width: 15 },
      { header: 'Sede', key: 'sede', width: 15 },
      { header: 'Tipo de atención', key: 'tipoAtencion', width: 15 },
      { header: 'Área de derivación', key: 'areaDerivacion', width: 20 },
      { header: 'Diagnóstico presuntivo', key: 'diagnostico', width: 20 },
      { header: 'Medio de contacto', key: 'medioContacto', width: 20 },
      { header: 'Observaciones', key: 'observaciones', width: 30 },
    ];

    worksheet.getRow(1).eachCell((cell) => {
      cell.fill = {
        type: 'pattern',
        pattern:'solid',
        fgColor:{ argb:'FF8C68CE' }
      };
      cell.font = { bold: true };
      cell.alignment = { vertical: 'middle', horizontal: 'center' };
    });

    filteredData.forEach(item => {
      worksheet.addRow({
        id: item.id,
        fecha: capitalizeFirstLetter(
          new Date(new Date(item.fecha).setHours(new Date(item.fecha).getHours() + 5))
            .toLocaleDateString('es-PE', { timeZone: 'America/Lima' })
        ),        
        estado: estadoMapping[item.estado] || item.estado,
        codigo: item.estudiante?.codigo || '',
        telefono: item.estudiante?.telefono || '',
        nombre: reorderName(item.estudiante?.nombre),
        carrera: capitalizeFirstLetter(item.estudiante?.carrera || ""),
        ciclo: item.estudiante?.ciclo || "",
        modalidad: modalidadMapping[item.estudiante?.modalidad] || item.estudiante?.modalidad,
        sede: capitalizeFirstLetter(item.estudiante?.sede || ""),
        tipoAtencion: tipoAtencionMapping[item.tipo] || item.tipo,
        areaDerivacion: areaDerivacionMapping[item.atencionCita?.areaDerivacion] || (item.atencionCita?.areaDerivacion || ""),
        diagnostico: diagnosticoMapping[item.atencionCita?.diagnosticoPresuntivo] || (item.atencionCita?.diagnosticoPresuntivo || ""),
        medioContacto: medioContactoMapping[item.atencionCita?.medioContacto] || (item.atencionCita?.medioContacto || ""),
        observaciones: item.atencionCita?.observaciones || ""
      });
    });

    worksheet.eachRow((row) => {
      row.alignment = { vertical: 'middle', horizontal: 'center' };
    });

    const buf = await workbook.xlsx.writeBuffer();
    saveAs(new Blob([buf]), 'reporte.xlsx');
  };

  // Definición de columnas para la tabla (sin cambios en la tabla)
  const columns = useMemo(() => [
    { Header: "ID", accessor: "id", className: "default-column" },
    { 
      Header: "Fecha", 
      accessor: row => {
        const d = new Date(row.fecha);
        d.setHours(d.getHours() + 5); // Suma 5 horas para compensar UTC-5
        return capitalizeFirstLetter(d.toLocaleDateString('es-PE', { timeZone: 'America/Lima' }));
      },      
      id: "fecha", 
      className: "default-column" 
    },
    { 
      Header: () => (
        <ColumnFilter 
          id="estado" 
          title="Estado" 
          options={filterOptions.estado} 
          selectedValues={filters.estado} 
          onChange={(vals) => updateFilter('estado', vals)}
          mapping={estadoMapping}
        />
      ),
      accessor: row => {
        const val = row.estado;
        return estadoMapping[val] || capitalizeFirstLetter(val || "");
      },
      id: "estado",
      className: "default-column"
    },
    { 
      Header: "Código", 
      accessor: row => capitalizeFirstLetter(row.estudiante?.codigo || ""), 
      id: "codigo", 
      className: "default-column" 
    },
    { 
      Header: "Teléfono", 
      accessor: row => capitalizeFirstLetter(row.estudiante?.telefono || ""), 
      id: "telefono", 
      className: "default-column" 
    },
    { 
      Header: "Apellidos y Nombres", 
      accessor: row => reorderName(row.estudiante?.nombre), 
      id: "nombre", 
      className: "default-column" 
    },
    { 
      Header: () => (
        <ColumnFilter 
          id="carrera" 
          title="Carrera" 
          options={filterOptions.carrera} 
          selectedValues={filters.carrera} 
          onChange={(vals) => updateFilter('carrera', vals)}
        />
      ),
      accessor: row => capitalizeFirstLetter(row.estudiante?.carrera || ""),
      id: "carrera",
      className: "default-column"
    },
    { 
      Header: () => (
        <ColumnFilter 
          id="ciclo" 
          title="Ciclo" 
          options={filterOptions.ciclo.map(String)} 
          selectedValues={filters.ciclo} 
          onChange={(vals) => updateFilter('ciclo', vals)}
        />
      ),
      accessor: row => row.estudiante?.ciclo || "",
      id: "ciclo",
      className: "default-column"
    },
    { 
      Header: () => (
        <ColumnFilter 
          id="modalidad" 
          title="Modalidad" 
          options={filterOptions.modalidad} 
          selectedValues={filters.modalidad} 
          onChange={(vals) => updateFilter('modalidad', vals)}
          mapping={modalidadMapping}
        />
      ),
      accessor: row => {
        const val = row.estudiante?.modalidad;
        return modalidadMapping[val] || capitalizeFirstLetter(val || "");
      },
      id: "modalidad",
      className: "default-column"
    },
    { 
      Header: () => (
        <ColumnFilter 
          id="sede" 
          title="Sede" 
          options={filterOptions.sede} 
          selectedValues={filters.sede} 
          onChange={(vals) => updateFilter('sede', vals)}
        />
      ),
      accessor: row => capitalizeFirstLetter(row.estudiante?.sede || ""),
      id: "sede",
      className: "default-column"
    },
    { 
      Header: () => (
        <ColumnFilter 
          id="tipoAtencion" 
          title="Tipo de atención" 
          options={filterOptions.tipoAtencion} 
          selectedValues={filters.tipoAtencion} 
          onChange={(vals) => updateFilter('tipoAtencion', vals)}
          mapping={tipoAtencionMapping}
        />
      ),
      accessor: row => {
        const val = row.tipo;
        return tipoAtencionMapping[val] || capitalizeFirstLetter(val || "");
      },
      id: "tipoAtencion",
      className: "default-column"
    },
    { 
      Header: () => (
        <ColumnFilter 
          id="areaDerivacion" 
          title="Área de derivación" 
          options={filterOptions.areaDerivacion} 
          selectedValues={filters.areaDerivacion} 
          onChange={(vals) => updateFilter('areaDerivacion', vals)}
          mapping={areaDerivacionMapping}
        />
      ),
      accessor: row => {
        const val = row.atencionCita?.areaDerivacion;
        return areaDerivacionMapping[val] || capitalizeFirstLetter(val || "");
      },
      id: "areaDerivacion",
      className: "default-column"
    },
    { 
      Header: () => (
        <ColumnFilter 
          id="diagnostico" 
          title="Diagnóstico presuntivo" 
          options={filterOptions.diagnostico} 
          selectedValues={filters.diagnostico} 
          onChange={(vals) => updateFilter('diagnostico', vals)}
          mapping={diagnosticoMapping}
        />
      ),
      accessor: row => {
        const val = row.atencionCita?.diagnosticoPresuntivo;
        return diagnosticoMapping[val] || capitalizeFirstLetter(val || "");
      },
      id: "diagnostico",
      className: "default-column"
    },
    { 
      Header: () => (
        <ColumnFilter 
          id="medioContacto" 
          title="Medio de contacto" 
          options={filterOptions.medioContacto} 
          selectedValues={filters.medioContacto} 
          onChange={(vals) => updateFilter('medioContacto', vals)}
          mapping={medioContactoMapping}
        />
      ),
      accessor: row => {
        const val = row.atencionCita?.medioContacto;
        return medioContactoMapping[val] || capitalizeFirstLetter(val || "");
      },
      id: "medioContacto",
      className: "default-column"
    },
    { 
      Header: "Observaciones", 
      accessor: row => row.atencionCita?.observaciones || "",
      id: "observaciones",
      className: "long-column",
      Cell: ({ cell: { value } }) => (
        <div className="scrollable-cell long-column">
          {value}
        </div>
      )
    },
  ], [filterOptions, filters]);

  const tableInstance = useTable({ columns, data: filteredData });
  const { getTableProps, getTableBodyProps, headerGroups, rows, prepareRow } = tableInstance;

  return (
    <>
      <Header psicologo={psicologo} />
      <div className="report-container">
        <h2 style={{ marginBottom: '20px' }} className="dashboard-title">Reporte de citas</h2>
        
        {/* Sección de filtros de fecha */}
        <div className="date-filter-container" style={{ marginBottom: '20px', border: '1px solid #ccc', padding: '10px', borderRadius: '5px' }}>
          <h3 className="date-filter">Filtrar por fecha</h3>
          <div className="day-personalized" style={{ marginBottom: '10px' }}>
            <label>
              <strong style={{ marginRight: '15px' }}>Días personalizados:</strong>
              <input
                type="text"
                placeholder="Cant."
                value={customDays}
                onChange={handleCustomDaysChange}
                disabled={selectedYears.length > 0 || selectedMonths.length > 0}
                className="custom-input"
              />
            </label>
          </div>
          <div>
            <strong className="year-month">Año y Mes:</strong>
            <div style={{ marginTop: '5px', display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
              <div>
                <p style={{ margin: '5px 0 3px 0' }}>Seleccione año(s):</p>
                {AVAILABLE_YEARS.map(year => (
                  <label key={year} style={{ display: 'inline-block', marginRight: '15px' }}>
                    <input
                      type="checkbox"
                      checked={selectedYears.includes(year)}
                      onChange={() => handleToggleYear(year)}
                      disabled={customDays !== ''}
                      className="custom-checkbox"
                    />
                    {year}
                  </label>
                ))}
              </div>
              <div>
                <p style={{ margin: '5px 0 3px 0' }}>Seleccione mes(es):</p>
                {MONTHS.map(m => (
                  <label key={m.value} style={{ display: 'inline-block', marginRight: '15px' }}>
                    <input
                      type="checkbox"
                      checked={selectedMonths.includes(m.value)}
                      onChange={() => handleToggleMonth(m.value)}
                      disabled={customDays !== ''}
                      className="custom-checkbox"
                    />
                    {m.label}
                  </label>
                ))}
              </div>
            </div>
          </div>
        </div>
        
        {/* Filtros activos */}
        <div className="active-filters" style={{ marginBottom: '20px' }}>
          {Object.entries(filters).map(([key, value]) => {
            if (Array.isArray(value) && value.length > 0) {
              const keyFormatted = capitalizeFirstLetter(key);
              return (
                <div key={key} className="filter-chip">
                  <span>{keyFormatted}: {value.map(v => v.toString()).join(', ')}</span>
                  <button className="custom-button" onClick={() => updateFilter(key, [])}>×</button>
                </div>
              );
            }
            return null;
          })}
          {(Object.values(filters).some(val => Array.isArray(val) && val.length > 0) || dateFilterType !== 'none') && (
            <button className="clear-filters custom-button" onClick={clearAllFilters}>Eliminar filtros</button>
          )}
        </div>
        
        {/* Botón de exportar a Excel y Total de citas */}
        <div style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '20px' }}>
          <button className="export-button custom-button excel-button" onClick={exportToExcel}>Exportar a Excel</button>
          <div className="counter" style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>
            Total de citas: {filteredData.length}
          </div>
        </div>
        
        {/* Tabla (sin modificaciones) */}
        <div className="table-container">
          <table {...getTableProps()}>
            <thead>
              {headerGroups.map(headerGroup => (
                <tr {...headerGroup.getHeaderGroupProps()}>
                  {headerGroup.headers.map(column => (
                    <th {...column.getHeaderProps()} className={column.className || ''}>
                      {column.render('Header')}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody {...getTableBodyProps()}>
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={columns.length}>No se encontraron registros</td>
                </tr>
              ) : (
                rows.map(row => {
                  prepareRow(row);
                  return (
                    <tr
                      {...row.getRowProps()}
                      style={{ cursor: 'pointer' }}
                      onClick={() => navigate(`/appointment/${row.original.id}`)}
                    >
                      {row.cells.map(cell => (
                        <td {...cell.getCellProps()} className={cell.column.className || ''}>
                          {cell.render('Cell')}
                        </td>
                      ))}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
};

export default Report;
