-- Citizen science / "Yo estuve aquí" sightings (not denuncias).
INSERT INTO report_categories (code, label, description, active, source)
VALUES (
  'avistamiento',
  'Yo estuve aquí / avistamiento',
  'Registro ciudadano de visita o biodiversidad (foto + ubicación). No es denuncia.',
  true,
  'local_config'
)
ON CONFLICT (code) DO UPDATE SET
  label = EXCLUDED.label,
  description = EXCLUDED.description,
  active = true;
