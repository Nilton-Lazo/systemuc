// src/pages/AppointmentDetail.js
import React, { useState, useEffect, useCallback } from 'react';
import Calendar from 'react-calendar';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import '../assets/styles/AppointmentDetail.css';
import Header from '../components/layout/Header';

// Función para parsear una fecha "YYYY-MM-DD" como fecha local (sin desfase)
const parseLocalDate = (dateStr) => {
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day);
};

// Función para calcular la edad a partir de la fecha de nacimiento
const computeAge = (birthDateStr) => {
  if (!birthDateStr) return "";
  const birthDate = new Date(birthDateStr);
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const m = today.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
};

// (Opcional) Función para reordenar el nombre
const reorderName = (fullName) => {
  if (!fullName) return "";
  // Aquí se aplica la lógica.
  // Simplemente devolver el nombre sin cambios:
  return fullName;
};

const AppointmentDetail = ({ psicologo, modoDerivacion }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isDerivacion = modoDerivacion === true;

  // Estados para la cita (modo programada)
  const [cita, setCita] = useState(null);
  const [loading, setLoading] = useState(!isDerivacion);
  const [attended, setAttended] = useState(null);
  const [areaDerivacion, setAreaDerivacion] = useState('');
  const [diagnosticoPresuntivo, setDiagnosticoPresuntivo] = useState('');
  const [medioContacto, setMedioContacto] = useState('');
  const [recomendacion, setRecomendacion] = useState('');
  const [observaciones, setObservaciones] = useState('');

  // Estados para la cita de seguimiento (modo programado)
  const [followUpNeeded, setFollowUpNeeded] = useState('');
  const [followUpModalidad, setFollowUpModalidad] = useState('');
  const [followUpDate, setFollowUpDate] = useState(new Date());
  const [availableSlots, setAvailableSlots] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [followUpCita, setFollowUpCita] = useState(null);

  // Estados para modo derivación (nuevos campos)
  const [searchCode, setSearchCode] = useState('');
  const [searchResult, setSearchResult] = useState(null);
  const [searchLoading, setSearchLoading] = useState(false);
  const [motivoDerivacion, setMotivoDerivacion] = useState('');

  // === Obtener cita principal (modo programada) ===
  const fetchCita = useCallback(async () => {
    try {
      // Se incluye citaPrevia con atencionCita y anidado para disponer de la info original
      const response = await axios.get(`${process.env.REACT_APP_PSI_API_URL}/cita/${id}`);
      setCita(response.data.cita);
      setAttended(response.data.cita.estado);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching cita details:", error);
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (!isDerivacion) {
      fetchCita();
    }
  }, [fetchCita, isDerivacion]);

  // Precargar datos de atención (modo programado)
  useEffect(() => {
    if (cita && cita.atencionCita) {
      setAreaDerivacion(cita.atencionCita.areaDerivacion || '');
      setDiagnosticoPresuntivo(cita.atencionCita.diagnosticoPresuntivo || '');
      setMedioContacto(cita.atencionCita.medioContacto || '');
      setRecomendacion(cita.atencionCita.recomendaciones || '');
      setObservaciones(cita.atencionCita.observaciones || '');

      // Solo si aún no se ha cargado una cita de seguimiento (fetchFollowUp)
      if (!followUpCita) {
        if (typeof cita.atencionCita.followUpRequested === 'boolean') {
          // Si followUpRequested es true, asigna 'si'; si es false, asigna 'no'
          setFollowUpNeeded(cita.atencionCita.followUpRequested ? 'si' : 'no');
        } else {
          setFollowUpNeeded("");
        }
      }
    }
  }, [cita, followUpCita]);  

  // En modo derivación, precargar datos si ya existe la cita
  useEffect(() => {
    if (isDerivacion && cita) {
      setMotivoDerivacion(cita.motivo || '');
      if (cita.estudiante) {
        setSearchResult({
          id: cita.estudiante.id,
          nombre: cita.estudiante.nombre,
          codigo: cita.estudiante.codigo,
        });
        setSearchCode(cita.estudiante.codigo || '');
        setAttended("atendida");
      }
    }
  }, [cita, isDerivacion]);

  // === Obtener horarios disponibles (modo programado) ===
  const fetchAvailableSlots = useCallback(async (date) => {
    try {
      const fechaStr = date.toISOString().slice(0, 10);
      const response = await axios.get(`${process.env.REACT_APP_PSI_API_URL}/horarios-disponibles`, {
        params: { fecha: fechaStr, psicologoId: psicologo.id }
      });
      return response.data.horarios;
    } catch (error) {
      console.error("Error fetching available slots:", error);
      return [];
    }
  }, [psicologo.id]);

  // === Obtener cita de seguimiento (modo programado) ===
  const fetchFollowUp = useCallback(async () => {
    try {
      const response = await axios.get(`${process.env.REACT_APP_PSI_API_URL}/cita/followup/${id}`);
      if (response.data && response.data.cita) {
        const followUpData = response.data.cita;
        setFollowUpCita(followUpData);
        setFollowUpNeeded('si');
        setFollowUpModalidad(followUpData.tipo || '');
        let fechaStr = '';
        if (typeof followUpData.fecha === 'string') {
          fechaStr = followUpData.fecha.includes('T') ? followUpData.fecha.slice(0, 10) : followUpData.fecha;
        } else {
          fechaStr = followUpData.fecha.toISOString().slice(0, 10);
        }
        const localFecha = parseLocalDate(fechaStr);
        setFollowUpDate(localFecha);
        // Asignar el slot reservado basado en la hora
        const reservedSlot = { 
          hora: followUpData.hora, 
          id: `${psicologo.id}-${followUpData.hora}`,
          calendarEventId: followUpData.calendarEventId 
        };
        setSelectedSlot(reservedSlot);
      } else {
        // Si no se encontró una cita de seguimiento, dejar followUpNeeded vacío
        setFollowUpCita(null);
        //setFollowUpNeeded(""); //Omitir
        
      }
    } catch (error) {
      console.error("Error fetching follow-up appointment:", error);
      setFollowUpCita(null);
      setFollowUpNeeded("");
    }
  }, [id, psicologo.id]);

  useEffect(() => {
    if (!isDerivacion && cita) {
      fetchFollowUp();
    }
  }, [cita, fetchFollowUp, isDerivacion]);

  const handleFollowUpDateChange = (date) => {
    setFollowUpDate(date);
    fetchAvailableSlots(date).then(slots => setAvailableSlots(slots));
  };

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('es-ES', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      timeZone: 'UTC'
    });
  };

  // === Funciones helper para citas de seguimiento ===
  // Obtiene el motivo original recorriendo la cadena hasta la primera cita
  const getOriginalMotivo = (citaObj) => {
    let original = citaObj;
    while(original && original.citaPrevia) {
      original = original.citaPrevia;
    }
    return original ? original.motivo : '';
  };

  // Obtiene la recomendación de la cita inmediatamente anterior
  const getPreviousRecommendation = (citaObj) => {
    let current = citaObj.citaPrevia;
    while (current) {
      // Si se encontró una recomendación no vacía en la atención, se retorna
      if (current.atencionCita && current.atencionCita.recomendaciones && current.atencionCita.recomendaciones.trim() !== "") {
        return current.atencionCita.recomendaciones;
      }
      current = current.citaPrevia;
    }
    return "";
  };

  // === Modo derivación: Buscar estudiante por código ===
  const handleSearch = async () => {
    if (!searchCode) return;
    setSearchLoading(true);
    setSearchResult(null);
    try {
      const response = await axios.get(`${process.env.REACT_APP_PSI_API_URL}/buscar-estudiante`, {
        params: { codigo: searchCode }
      });
      setSearchResult(response.data.estudiante);
      if (response.data.estudiante) {
        setAttended("atendida");
      }
    } catch (error) {
      if (error.response && error.response.data && error.response.data.error) {
        setSearchResult({ error: error.response.data.error });
      } else {
        setSearchResult({ error: "Error al buscar estudiante" });
      }
    }
    setSearchLoading(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  // === Validación del formulario ===
  const isFormValid = () => {
    const today = new Date();
    today.setHours(0,0,0,0);
    if (isDerivacion) {
      if (!searchResult || searchResult.error) return false;
      if (!motivoDerivacion.trim()) return false;
      if (!areaDerivacion) return false;
      if (!diagnosticoPresuntivo) return false;
      if (!medioContacto) return false;
      if (!recomendacion.trim()) return false;
      if (!followUpNeeded) return false;
      if (followUpNeeded === 'si') {
        if (!followUpModalidad) return false;
        const selectedDate = new Date(followUpDate);
        selectedDate.setHours(0,0,0,0);
        if (selectedDate <= today) return false;
        if (!selectedSlot) return false;
      }
      return true;
    } else {
      if (!attended) return false;
      if (attended === 'atendida') {
        if (!areaDerivacion) return false;
        if (!diagnosticoPresuntivo) return false;
        if (!medioContacto) return false;
        if (!recomendacion.trim()) return false;
        if (!followUpNeeded) return false;
        if (followUpNeeded === 'si') {
          if (!followUpModalidad) return false;
          const selectedDate = new Date(followUpDate);
          selectedDate.setHours(0,0,0,0);
          if (selectedDate <= today) return false;
          if (!selectedSlot) return false;
        }
        return true;
      } else if (attended === 'no_asistio') {
        return true;
      }
    }
    return false;
  };

  // === Función para enviar el formulario ===
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isDerivacion) {
      if (!searchResult || searchResult.error) {
        alert("Debe buscar y seleccionar un estudiante registrado.");
        return;
      }
      if (!motivoDerivacion.trim()) {
        alert("Debe ingresar el motivo de la cita.");
        return;
      }
      try {
        const now = new Date(new Date().toLocaleString("en-US", { timeZone: "America/Lima" }));
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, "0");
        const day = String(now.getDate()).padStart(2, "0");
        const fecha = `${year}-${month}-${day}`;
        const hours = String(now.getHours()).padStart(2, "0");
        const minutes = String(now.getMinutes()).padStart(2, "0");
        const hora = `${hours}:${minutes}`;

        // Paso 1: Crear la cita de derivación
        const payloadCita = {
          estudianteId: searchResult.id,
          psicologoId: psicologo.id,
          motivo: motivoDerivacion,
          fecha,
          hora,
          tipo: "presencial",
          estado: "atendida",
        };
        const responseCita = await axios.post(`${process.env.REACT_APP_PSI_API_URL}/derivacion-cita`, payloadCita);
        const newCita = responseCita.data.cita;

        // Paso 2: Actualizar la cita para registrar la atención
        const payloadAtencion = {
          psicologoId: psicologo.id,
          estado: "atendida",
          areaDerivacion,
          diagnosticoPresuntivo,
          medioContacto,
          recomendaciones: recomendacion,
          observaciones,
          followUpRequested: followUpNeeded === 'si' ? true : (followUpNeeded === 'no' ? false : null)
        };
        await axios.put(`${process.env.REACT_APP_PSI_API_URL}/cita/${newCita.id}`, payloadAtencion);

        // Lógica para la cita de seguimiento en modo derivación
        let finalMessage = "Cita derivada y atención registrada correctamente";
        if (followUpNeeded === 'si') {
          if (!selectedSlot) {
            alert("Debes seleccionar un horario para la cita de seguimiento.");
            return;
          }
          const followUpPayload = {
            estudianteId: searchResult.id,
            psicologoId: psicologo.id,
            motivo: "seguimiento",
            fecha: followUpDate.toISOString().slice(0, 10),
            hora: selectedSlot.hora,
            modalidad: followUpModalidad,
            citaPreviaId: newCita.id,
          };
          await axios.post(`${process.env.REACT_APP_PSI_API_URL}/reservar-cita`, followUpPayload);
          finalMessage += " y cita de seguimiento agendada correctamente";
        } else if (followUpNeeded === 'no') {
          finalMessage += " y no se reservo ninguna cita de seguimiento";
        }
        alert(finalMessage);
        navigate('/dashboard');
      } catch (error) {
        console.error("Error en derivacion-cita:", error);
        alert("Error al registrar la cita de derivación y la atención.");
      }
    } else {
      // Modo programado
      const payload = {
        psicologoId: psicologo.id,
        estado: attended,
      };

      if (attended === 'atendida') {
        payload.areaDerivacion = areaDerivacion;
        payload.diagnosticoPresuntivo = diagnosticoPresuntivo;
        payload.medioContacto = medioContacto;
        payload.recomendaciones = recomendacion;
        payload.observaciones = observaciones;
        // Agrega esta línea para enviar el valor de seguimiento:
        payload.followUpRequested = followUpNeeded === 'si';
      } else if (attended === 'no_asistio') {
        payload.observaciones = observaciones;
      }

      try {
        await axios.put(`${process.env.REACT_APP_PSI_API_URL}/cita/${id}`, payload);
        let finalMessage = "Cita actualizada correctamente";

        // Lógica para la cita de seguimiento en modo programado
        if (followUpNeeded === 'si') {
          if (!selectedSlot) {
            alert("Debes seleccionar un horario para la cita de seguimiento.");
            return;
          }
          if (followUpCita) {
            // Reprogramar cita de seguimiento
            const reprogramPayload = {
              fecha: followUpDate.toISOString().slice(0, 10),
              hora: selectedSlot.hora,
              modalidad: followUpModalidad,
              cancel: false
            };
            await axios.put(`${process.env.REACT_APP_PSI_API_URL}/cita/followup/${followUpCita.id}/reprogramar`, reprogramPayload);
            finalMessage += " y cita de seguimiento reprogramada correctamente";
          } else {
            // Crear una nueva cita de seguimiento
            const followUpPayload = {
              estudianteId: cita.estudiante.id,
              psicologoId: psicologo.id,
              motivo: "seguimiento",
              fecha: followUpDate.toISOString().slice(0, 10),
              hora: selectedSlot.hora,
              modalidad: followUpModalidad,
              citaPreviaId: cita.id,
            };
            await axios.post(`${process.env.REACT_APP_PSI_API_URL}/reservar-cita`, followUpPayload);
            finalMessage += " y cita de seguimiento agendada correctamente";
          }
        } else if (followUpNeeded === 'no') {
          if (followUpCita) {
            await axios.put(`${process.env.REACT_APP_PSI_API_URL}/cita/followup/${followUpCita.id}/reprogramar`, { cancel: true });
            finalMessage += " y cita de seguimiento cancelada";
          } else {
            finalMessage += " y no se reservo ninguna cita de seguimiento";
          }
        }
        alert(finalMessage);
        fetchCita();
        navigate('/dashboard');
      } catch (error) {
        console.error("Error updating cita:", error);
        alert("Error al actualizar la cita. Verifique los datos.");
      }
    }
  };

  if (loading) return <p className="loading-text">Cargando...</p>;
  if (!cita && !isDerivacion) return <p className="error-text">Cita no encontrada</p>;

  // Dividir horarios disponibles en franjas (modo programado)
  const morningSlots = availableSlots.filter(slot => {
    const hourNumber = parseInt(slot.hora.split(":")[0], 10);
    return hourNumber < 12;
  });
  const afternoonSlots = availableSlots.filter(slot => {
    const hourNumber = parseInt(slot.hora.split(":")[0], 10);
    return hourNumber >= 12;
  });

  const today = new Date();
  today.setHours(0,0,0,0);

  return (
    <>
      <Header psicologo={psicologo} />
      <div className="appointment-detail-container">
        <h2 className="detail-header">{isDerivacion ? "Derivado" : "Detalle de Cita"}</h2>
        
        {isDerivacion ? (
          <div className="derivacion-header">
            <div className="search-row">
              <span className="search-label">Buscar estudiante:</span>
              <div className="search-container">
                <input 
                  type="text"
                  placeholder="Código"
                  value={searchCode}
                  onChange={(e) => setSearchCode(e.target.value.replace(/\D/g, ''))}
                  onKeyDown={handleKeyDown}
                  className="search-input"
                />
                <div className="search-icon" onClick={handleSearch}>
                  {searchLoading ? "..." : "🔍"}
                </div>
              </div>
            </div>
            {searchResult && searchResult.error && (
              <div className="result-row">
                <span className="result-label">Estudiante:</span>
                <div className="result-field error">No encontrado</div>
              </div>
            )}
            {searchResult && !searchResult.error && (
              <>
                <div className="result-row">
                  <span className="result-label">Estudiante:</span>
                  <div className="result-field">
                    {reorderName(searchResult.nombre)}{" "}
                    {searchResult.fechaNacimiento
                      ? `(${computeAge(searchResult.fechaNacimiento)} años)`
                      : ""}
                  </div>
                </div>
                <div className="motive-row">
                  <label className="motive-label">
                    {!motivoDerivacion.trim() && <span style={{color:'red'}}>* </span>}Motivo de la cita:
                  </label>
                  <input 
                    type="text"
                    value={motivoDerivacion}
                    onChange={(e) => setMotivoDerivacion(e.target.value)}
                    className="motive-input"
                    placeholder="Ingrese el motivo"
                  />
                </div>
              </>
            )}
          </div>
        ) : (
          <div className="detail-info">
            <p>
              <strong>Estudiante:</strong> {reorderName(cita.estudiante.nombre)} 
              {cita.estudiante.fechaNacimiento ? ` (${computeAge(cita.estudiante.fechaNacimiento)} años)` : ""}
            </p>
            <p><strong>Fecha:</strong> {formatDate(cita.fecha)}</p>
            <p><strong>Hora:</strong> {cita.hora}</p>
            <p><strong>Motivo:</strong> {cita.motivo}</p>
            {cita.meetLink && 
              <p>
                <strong>Enlace de Meet:</strong> <a href={cita.meetLink} target="_blank" rel="noreferrer">{cita.meetLink}</a>
              </p>
            }
            {cita.citaPreviaId && (
              <div className="follow-up-additional">
                <p><strong>Motivo original:</strong> {getOriginalMotivo(cita)}</p>
                <p><strong>Recomendación anterior:</strong> {getPreviousRecommendation(cita)}</p>
              </div>
            )}
          </div>
        )}
        
        {(!isDerivacion || (isDerivacion && searchResult && !searchResult.error)) && (
          <form onSubmit={handleSubmit} className="detail-form">
            <div className="form-section">
              <h3 className="section-title">Atención de Cita</h3>
              {!isDerivacion && (
                <div className="form-group">
                  <label>¿El paciente asistió a la cita?</label>
                  <div className="radio-group">
                    <label>
                      <input 
                        type="radio" 
                        value="atendida" 
                        checked={attended === 'atendida'} 
                        onChange={(e) => setAttended(e.target.value)}
                      /> Sí
                    </label>
                    <label>
                      <input 
                        type="radio" 
                        value="no_asistio" 
                        checked={attended === 'no_asistio'} 
                        onChange={(e) => setAttended(e.target.value)}
                      /> No
                    </label>
                  </div>
                </div>
              )}
              {isDerivacion && !attended && setAttended("atendida")}
          
              {((!isDerivacion && attended === 'atendida') || isDerivacion) && (
                <>
                  <div className="form-group">
                    <label>{!areaDerivacion && <span style={{color:'red'}}>* </span>}Área de derivación:</label>
                    <select value={areaDerivacion} onChange={(e) => setAreaDerivacion(e.target.value)} className="select-field">
                      <option value=""></option>
                      <option value="tutoria">Tutoría</option>
                      <option value="mentoria">Mentoría</option>
                      <option value="topico">Tópico</option>
                      <option value="personal">Personal</option>
                      <option value="CAS">CAS</option>
                      <option value="defensoria_universitaria">Defensoría Universitaria</option>
                      <option value="vinculacion_internacional">Vinculación Internacional</option>
                      <option value="docente">Docente</option>
                      <option value="protocolo_de_salud_mental">Protocolo de Salud Mental</option>
                      <option value="servicio_social">Servicio Social</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>{!diagnosticoPresuntivo && <span style={{color:'red'}}>* </span>}Diagnóstico presuntivo:</label>
                    <select value={diagnosticoPresuntivo} onChange={(e) => setDiagnosticoPresuntivo(e.target.value)} className="select-field">
                      <option value=""></option>
                      <option value="familiar">Familiar</option>
                      <option value="academico">Académico</option>
                      <option value="agresivo_pasivo">Agresivo/Pasivo (asertividad)</option>
                      <option value="ansiedad">Ansiedad</option>
                      <option value="antisocial">Antisocial</option>
                      <option value="autoestima">Autoestima</option>
                      <option value="bipolar">Bipolar</option>
                      <option value="borderline">Borderline</option>
                      <option value="compulsivo_autocontrol">Compulsivo / autocontrol</option>
                      <option value="dependencia_videojuegos_internet">Dependencia a videojuegos o internet</option>
                      <option value="dependencia_alcohol_drogas">Dependencia de alcohol o drogas</option>
                      <option value="relacion_afectiva">Dependiente (relaciones afectivas)</option>
                      <option value="depresion">Depresión</option>
                      <option value="desorden_alimenticio">Desorden alimenticio</option>
                      <option value="duelo_fallecimiento">Duelo por fallecimiento o pérdida</option>
                      <option value="distimia">Distimia</option>
                      <option value="esquizoide">Esquizoide</option>
                      <option value="esquizotipico">Esquizotípico</option>
                      <option value="estres">Estrés</option>
                      <option value="histrionico">Histriónico</option>
                      <option value="ludopatia">Ludopatía</option>
                      <option value="narcisista">Narcisista</option>
                      <option value="orientacion_vocacional">Orientación Vocacional</option>
                      <option value="paranoide">Paranoide</option>
                      <option value="servicio_social">Social</option>
                      <option value="somatoformo">Somatoformo</option>
                      <option value="trabajo_o_laboral">Trabajo o laboral</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>{!medioContacto && <span style={{color:'red'}}>* </span>}Medio de contacto:</label>
                    <select value={medioContacto} onChange={(e) => setMedioContacto(e.target.value)} className="select-field">
                      <option value=""></option>
                      <option value="boca_a_boca">Oficina (boca a boca)</option>
                      <option value="protocolo_de_salud_mental">Protocolo de Salud Mental</option>
                      <option value="entrevistas_de_vinculacion">Entrevistas de Vinculación</option>
                      <option value="correo_electronico">Correo electrónico</option>
                      <option value="talleres_preventivos">Talleres preventivos</option>
                      <option value="citas_automatizadas">Citas Automatizadas</option>
                      <option value="onboarding">Onboarding</option>
                      <option value="app_movil">Aplicativo móvil</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>{!recomendacion.trim() && <span style={{color:'red'}}>* </span>}Recomendación:</label>
                    <textarea
                      value={recomendacion}
                      onChange={(e) => setRecomendacion(e.target.value)}
                      rows={4}
                      className="textarea-field"
                    />
                  </div>
                  <div className="form-group">
                    <label>Observaciones:</label>
                    <textarea
                      value={observaciones}
                      onChange={(e) => setObservaciones(e.target.value)}
                      rows={4}
                      className="textarea-field"
                    />
                  </div>
                </>
              )}
              {(!isDerivacion && attended === 'no_asistio') && (
                <div className="form-group">
                  <label>Observaciones:</label>
                  <textarea
                    value={observaciones}
                    onChange={(e) => setObservaciones(e.target.value)}
                    rows={4}
                    className="textarea-field"
                  />
                </div>
              )}
            </div>
            
            {attended === 'atendida' && (
              <div className="form-section">
                <h3 className="section-title">Cita de Seguimiento</h3>
                <div className="form-group">
                  <label>¿El estudiante necesita una cita de seguimiento?</label>
                  <div className="radio-group">
                    <label>
                      <input 
                        type="radio" 
                        value="si" 
                        checked={followUpNeeded === 'si'} 
                        onChange={(e) => setFollowUpNeeded(e.target.value)}
                      /> Sí
                    </label>
                    <label>
                      <input 
                        type="radio" 
                        value="no" 
                        checked={followUpNeeded === 'no'} 
                        onChange={(e) => setFollowUpNeeded(e.target.value)}
                      /> No
                    </label>
                  </div>
                </div>
                {followUpNeeded === 'si' && (
                  <>
                    <div className="form-group">
                      <label>{!followUpModalidad && <span style={{color:'red'}}>* </span>}Selecciona el tipo de cita para seguimiento:</label>
                      <select value={followUpModalidad} onChange={(e) => setFollowUpModalidad(e.target.value)} className="select-field">
                        <option value="">Seleccione</option>
                        <option value="virtual">Virtual</option>
                        <option value="presencial">Presencial</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label>{(new Date(followUpDate).setHours(0,0,0,0) <= today.getTime()) && <span style={{color:'red'}}>* </span>}Selecciona la fecha para el seguimiento:</label>
                      <Calendar onChange={handleFollowUpDateChange} value={followUpDate} />
                    </div>
                    <div className="form-group">
                      <label>{!selectedSlot && <span style={{color:'red'}}>* </span>}Selecciona un horario:</label>
                      {availableSlots.length === 0 ? (
                        <p>No hay horarios disponibles para la fecha seleccionada.</p>
                      ) : (
                        <div className="slots-container">
                          {morningSlots.length > 0 && (
                            <div className="slot-group">
                              <h4>Horarios de la mañana</h4>
                              {morningSlots.map(slot => (
                                <button
                                  key={slot.id}
                                  type="button"
                                  onClick={() => setSelectedSlot(slot)}
                                  className={`slot-button ${selectedSlot && selectedSlot.id === slot.id ? 'active' : ''}`}
                                  style={{ margin: '5px' }}
                                >
                                  {slot.hora}
                                </button>
                              ))}
                            </div>
                          )}
                          {afternoonSlots.length > 0 && (
                            <div className="slot-group">
                              <h4>Horarios de la tarde</h4>
                              {afternoonSlots.map(slot => (
                                <button
                                  key={slot.id}
                                  type="button"
                                  onClick={() => setSelectedSlot(slot)}
                                  className={`slot-button ${selectedSlot && selectedSlot.id === slot.id ? 'active' : ''}`}
                                  style={{ margin: '5px' }}
                                >
                                  {slot.hora}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </>
                )}
                {followUpNeeded === 'no' && followUpCita && (
                  <p>La cita de seguimiento se cancelará si existe.</p>
                )}
              </div>
            )}
            
            <button type="submit" className="submit-button" disabled={!isFormValid()}>Guardar Detalles</button>
          </form>      
        )}
      </div>
    </>
  );
};

export default AppointmentDetail;
