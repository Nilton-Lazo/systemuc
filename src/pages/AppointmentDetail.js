import React, { useState, useEffect, useCallback } from 'react';
import Calendar from 'react-calendar';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import '../assets/styles/AppointmentDetail.css';

const AppointmentDetail = ({ psicologo }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  // Estados para la cita actual
  const [cita, setCita] = useState(null);
  const [loading, setLoading] = useState(true);
  const [attended, setAttended] = useState(null);
  const [areaDerivacion, setAreaDerivacion] = useState('');
  const [diagnosticoPresuntivo, setDiagnosticoPresuntivo] = useState('');
  const [medioContacto, setMedioContacto] = useState('');
  const [recomendacion, setRecomendacion] = useState('');
  const [observaciones, setObservaciones] = useState('');
  
  // Estados para la cita de seguimiento
  const [followUpNeeded, setFollowUpNeeded] = useState(null); // 'si' o 'no'
  const [followUpModalidad, setFollowUpModalidad] = useState(''); // 'virtual' o 'presencial'
  const [followUpDate, setFollowUpDate] = useState(new Date());
  const [availableSlots, setAvailableSlots] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState(null);

  const fetchCita = useCallback(async () => {
    try {
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
    fetchCita();
  }, [fetchCita]);

  // Obtener horarios disponibles para la cita de seguimiento
  const fetchAvailableSlots = async (date) => {
    try {
      const fechaStr = date.toISOString().slice(0, 10);
      const response = await axios.get(`${process.env.REACT_APP_PSI_API_URL}/horarios-disponibles`, {
        params: {
          fecha: fechaStr,
          psicologoId: psicologo.id
        },
      });
      setAvailableSlots(response.data.horarios);
    } catch (error) {
      console.error("Error fetching available slots:", error);
    }
  };

  const handleFollowUpDateChange = (date) => {
    setFollowUpDate(date);
    fetchAvailableSlots(date);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
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
    } else if (attended === 'no_asistio') {
      payload.observaciones = observaciones;
    }

    try {
      await axios.put(`${process.env.REACT_APP_PSI_API_URL}/cita/${id}`, payload);
      let finalMessage = "Cita actualizada correctamente";
      if (followUpNeeded === 'si') {
        if (!selectedSlot) {
          alert("Debes seleccionar un horario para la cita de seguimiento.");
          return;
        }
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
      alert(finalMessage);
      fetchCita();
      navigate('/dashboard');
    } catch (error) {
      console.error("Error updating cita:", error);
      alert("Error al actualizar la cita. Verifica los datos.");
    }
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

  if (loading) return <p className="loading-text">Cargando...</p>;
  if (!cita) return <p className="error-text">Cita no encontrada</p>;

  // Agrupar los horarios disponibles en mañana y tarde usando el valor numérico de la hora
  const morningSlots = availableSlots.filter(slot => {
    const hourNumber = parseInt(slot.hora.split(":")[0], 10);
    return hourNumber < 12;
  });
  const afternoonSlots = availableSlots.filter(slot => {
    const hourNumber = parseInt(slot.hora.split(":")[0], 10);
    return hourNumber >= 12;
  });

  return (
    <div className="appointment-detail-container">
      <h2 className="detail-header">Detalle de Cita</h2>
      <div className="detail-info">
        <p><strong>Estudiante:</strong> {cita.estudiante.nombre}</p>
        <p><strong>Fecha:</strong> {formatDate(cita.fecha)}</p>
        <p><strong>Hora:</strong> {cita.hora}</p>
        <p><strong>Motivo:</strong> {cita.motivo}</p>
        {cita.meetLink && 
          <p>
            <strong>Enlace de Meet:</strong> <a href={cita.meetLink} target="_blank" rel="noreferrer">{cita.meetLink}</a>
          </p>
        }
      </div>
      
      <form onSubmit={handleSubmit} className="detail-form">
        <div className="form-section">
          <h3 className="section-title">Atención de Cita</h3>
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
          {attended === 'atendida' ? (
            <>
              <div className="form-group">
                <label>Área de derivación:</label>
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
                <label>Diagnóstico presuntivo:</label>
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
                <label>Medio de contacto:</label>
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
                <label>Recomendación:</label>
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
          ) : (
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
              <div>
                <div className="form-group">
                  <label>Selecciona el tipo de cita para seguimiento:</label>
                  <select value={followUpModalidad} onChange={(e) => setFollowUpModalidad(e.target.value)} className="select-field">
                    <option value="">Seleccione</option>
                    <option value="virtual">Virtual</option>
                    <option value="presencial">Presencial</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Selecciona la fecha para el seguimiento:</label>
                  <Calendar onChange={handleFollowUpDateChange} value={followUpDate} />
                </div>
                <div className="form-group">
                  <label>Selecciona un horario:</label>
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
              </div>
            )}
          </div>
        )}
        
        <button type="submit" className="submit-button">Guardar Detalles</button>
      </form>
    </div>
  );
};

export default AppointmentDetail;

